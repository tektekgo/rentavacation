import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";
import { buildEmailHtml, detailRow } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Calculate 48-hour confirmation deadline from now
const getConfirmationDeadline = (): string => {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 48);
  return deadline.toISOString();
};

// Calculate check-in confirmation deadline (24 hours after check-in date)
const getCheckinConfirmationDeadline = (checkInDate: string): string => {
  const deadline = new Date(checkInDate);
  deadline.setHours(deadline.getHours() + 24);
  return deadline.toISOString();
};

serve(async (req) => {
  // Webhooks are POST only — no CORS preflight needed
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Read raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No stripe-signature header");

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Webhook received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(supabase, stripe, event.data.object);
        break;

      case "checkout.session.expired":
        await handleCheckoutExpired(supabase, event.data.object);
        break;

      case "charge.refunded":
        await handleChargeRefunded(supabase, event.data.object);
        break;

      case "account.updated":
        await handleAccountUpdated(supabase, event.data.object);
        break;

      case "transfer.created":
        await handleTransferCreated(supabase, event.data.object);
        break;

      case "transfer.reversed":
        await handleTransferReversed(supabase, event.data.object);
        break;

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    // Return 400 for signature verification failures so Stripe retries
    const status = errorMessage.includes("signature") ? 400 : 500;
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { "Content-Type": "application/json" }, status }
    );
  }
});

/**
 * Handle checkout.session.completed
 * This is the critical safety net — if the client-side verify-booking-payment
 * didn't run (browser closed after payment), this ensures the booking is confirmed.
 */
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    logStep("No booking_id in session metadata, skipping");
    return;
  }

  logStep("Processing checkout.session.completed", {
    sessionId: session.id,
    bookingId,
    paymentIntent: session.payment_intent,
  });

  // Fetch booking with listing details
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(`
      *,
      listing:listings(
        *,
        property:properties(*)
      )
    `)
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    logStep("Booking not found", { bookingId, error: bookingError?.message });
    return;
  }

  // Store the real Stripe PaymentIntent ID for future refund event lookups
  if (session.payment_intent && session.payment_intent !== booking.payment_intent_id) {
    await supabase
      .from("bookings")
      .update({ payment_intent_id: String(session.payment_intent) })
      .eq("id", bookingId);
    logStep("Updated payment_intent_id", { old: booking.payment_intent_id, new: session.payment_intent });
  }

  // Idempotency: if already confirmed/completed, skip
  if (booking.status === "confirmed" || booking.status === "completed") {
    logStep("Booking already confirmed, skipping", { status: booking.status });
    return;
  }

  if (session.payment_status !== "paid") {
    logStep("Payment not completed", { paymentStatus: session.payment_status });
    return;
  }

  // --- Confirm the booking (mirrors verify-booking-payment logic) ---

  // 1. Update booking to confirmed
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      paid_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    logStep("Failed to update booking", { error: updateError.message });
    return;
  }
  logStep("Booking confirmed", { bookingId });

  // 2. Update listing status to booked
  const { error: listingError } = await supabase
    .from("listings")
    .update({ status: "booked" })
    .eq("id", booking.listing_id);

  if (listingError) {
    logStep("Warning: Failed to update listing status", { error: listingError.message });
  }

  // 3. Read owner confirmation window from system_settings
  let ownerConfirmationWindowMinutes = 60;
  try {
    const { data: windowSetting } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "owner_confirmation_window_minutes")
      .single();
    if (windowSetting?.setting_value?.value) {
      ownerConfirmationWindowMinutes = windowSetting.setting_value.value;
    }
  } catch {
    logStep("Using default owner confirmation window", { minutes: ownerConfirmationWindowMinutes });
  }

  // 4. Calculate deadlines
  const ownerConfirmationDeadline = new Date();
  ownerConfirmationDeadline.setMinutes(ownerConfirmationDeadline.getMinutes() + ownerConfirmationWindowMinutes);
  const confirmationDeadline = getConfirmationDeadline();

  // 5. Create booking_confirmations record (escrow)
  const { data: bookingConfirmation, error: confirmationError } = await supabase
    .from("booking_confirmations")
    .insert({
      booking_id: bookingId,
      listing_id: booking.listing_id,
      owner_id: booking.listing?.owner_id,
      confirmation_deadline: confirmationDeadline,
      escrow_status: "pending_confirmation",
      escrow_amount: booking.total_amount,
      owner_confirmation_status: "pending_owner",
      owner_confirmation_deadline: ownerConfirmationDeadline.toISOString(),
      extensions_used: 0,
    })
    .select()
    .single();

  if (confirmationError) {
    logStep("Warning: Failed to create booking confirmation", { error: confirmationError.message });
  } else {
    logStep("Booking confirmation created", {
      confirmationId: bookingConfirmation.id,
      deadline: confirmationDeadline,
    });

    // Send owner notifications
    try {
      const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-booking-confirmation-reminder`;
      const authHeader = `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`;

      // New booking notification
      await fetch(notificationUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": authHeader },
        body: JSON.stringify({ type: "new_booking", bookingConfirmationId: bookingConfirmation.id }),
      });
      logStep("New booking notification sent to owner");

      // Owner confirmation request
      await fetch(notificationUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": authHeader },
        body: JSON.stringify({ type: "owner_confirmation_request", bookingConfirmationId: bookingConfirmation.id }),
      });
      logStep("Owner confirmation request notification sent");
    } catch (emailError) {
      logStep("Warning: Failed to send owner notifications", { error: String(emailError) });
    }
  }

  // 6. Create checkin_confirmations record
  const checkInDate = booking.listing?.check_in_date;
  if (checkInDate) {
    const checkinDeadline = getCheckinConfirmationDeadline(checkInDate);
    const { error: checkinError } = await supabase
      .from("checkin_confirmations")
      .insert({
        booking_id: bookingId,
        traveler_id: booking.renter_id,
        confirmation_deadline: checkinDeadline,
      });

    if (checkinError) {
      logStep("Warning: Failed to create checkin confirmation", { error: checkinError.message });
    } else {
      logStep("Checkin confirmation created", { deadline: checkinDeadline });
    }
  }

  // 7. Contribute to platform guarantee fund (3% of commission)
  const guaranteeFundContribution = Math.round(booking.rav_commission * 0.03 * 100) / 100;
  const { error: fundError } = await supabase
    .from("platform_guarantee_fund")
    .insert({
      booking_id: bookingId,
      contribution_amount: guaranteeFundContribution,
      contribution_percentage: 3,
    });

  if (fundError) {
    logStep("Warning: Failed to add to guarantee fund", { error: fundError.message });
  }

  // 8. Send traveler confirmation email
  try {
    const resortName = booking.listing?.property?.resort_name || "Your Resort";
    const location = booking.listing?.property?.location || "";
    const checkIn = new Date(booking.listing?.check_in_date).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
    const checkOut = new Date(booking.listing?.check_out_date).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
    const nights = Math.ceil(
      (new Date(booking.listing?.check_out_date).getTime() - new Date(booking.listing?.check_in_date).getTime()) /
      (1000 * 60 * 60 * 24)
    );
    const unitType = booking.listing?.unit_type || "Standard";

    // Fetch traveler profile
    const { data: travelerProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", booking.renter_id)
      .single();

    const travelerName = travelerProfile?.full_name || "Traveler";
    const travelerEmail = travelerProfile?.email;

    if (travelerEmail) {
      const html = buildEmailHtml({
        recipientName: travelerName,
        heading: "Booking Confirmed!",
        body: `
          <p>Congratulations! Your booking has been confirmed and payment received.</p>
          <p>Here are the details of your reservation:</p>
          <div style="background: #f7fafc; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
            ${detailRow("Booking ID", bookingId.slice(0, 8).toUpperCase())}
            ${detailRow("Resort", resortName)}
            ${location ? detailRow("Location", location) : ""}
            ${detailRow("Unit Type", unitType)}
            ${detailRow("Dates", `${checkIn} – ${checkOut}`)}
            ${detailRow("Duration", `${nights} night${nights !== 1 ? "s" : ""}`)}
            ${detailRow("Total Paid", `$${booking.total_amount?.toLocaleString()}`)}
          </div>
          <p>The property owner will confirm your reservation with the resort shortly. We'll notify you once that's complete.</p>
        `,
        cta: { label: "View My Booking", url: `https://rent-a-vacation.com/booking-success?booking_id=${bookingId}` },
      });

      await resend.emails.send({
        from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
        to: [travelerEmail],
        subject: `Booking Confirmed – ${resortName}`,
        html,
      });
      logStep("Traveler confirmation email sent", { travelerEmail });
    }
  } catch (emailError) {
    logStep("Warning: Failed to send traveler confirmation email", { error: String(emailError) });
  }

  logStep("checkout.session.completed processed successfully");
}

/**
 * Handle checkout.session.expired
 * If the session expires before payment, cancel the pending booking.
 */
async function handleCheckoutExpired(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session
) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    logStep("No booking_id in expired session metadata, skipping");
    return;
  }

  logStep("Processing checkout.session.expired", { sessionId: session.id, bookingId });

  // Only cancel if still pending
  const { data: booking } = await supabase
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .single();

  if (!booking || booking.status !== "pending") {
    logStep("Booking not pending, skipping expiry", { status: booking?.status });
    return;
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (error) {
    logStep("Failed to cancel expired booking", { error: error.message });
  } else {
    logStep("Pending booking cancelled due to session expiry", { bookingId });
  }
}

/**
 * Handle charge.refunded
 * Update booking record when a Stripe refund is processed.
 */
async function handleChargeRefunded(
  supabase: ReturnType<typeof createClient>,
  charge: Stripe.Charge
) {
  const paymentIntentId = typeof charge.payment_intent === "string"
    ? charge.payment_intent
    : charge.payment_intent?.id;

  if (!paymentIntentId) {
    logStep("No payment_intent on charge, skipping refund tracking");
    return;
  }

  logStep("Processing charge.refunded", {
    chargeId: charge.id,
    paymentIntentId,
    amountRefunded: charge.amount_refunded,
  });

  // Look up booking by payment_intent_id
  const { data: booking, error: lookupError } = await supabase
    .from("bookings")
    .select("id, status, total_amount")
    .eq("payment_intent_id", paymentIntentId)
    .single();

  if (lookupError || !booking) {
    // Fallback: try looking up by the session ID stored before webhook updated it
    logStep("Booking not found by payment_intent_id, refund tracking skipped", {
      paymentIntentId,
      error: lookupError?.message,
    });
    return;
  }

  // Full refund = cancel booking, partial refund = keep status but log
  const refundedAmountDollars = charge.amount_refunded / 100;
  const isFullRefund = refundedAmountDollars >= booking.total_amount;

  if (isFullRefund && booking.status !== "cancelled") {
    await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id);
    logStep("Booking cancelled due to full refund", { bookingId: booking.id });
  }

  logStep("Refund tracked", {
    bookingId: booking.id,
    refundedAmount: refundedAmountDollars,
    isFullRefund,
  });
}

/**
 * Handle account.updated (Stripe Connect)
 * Sync the owner's Connect account status when Stripe sends updates
 * (e.g., after onboarding completion, verification changes).
 */
async function handleAccountUpdated(
  supabase: ReturnType<typeof createClient>,
  account: Stripe.Account
) {
  logStep("Processing account.updated", {
    accountId: account.id,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
  });

  // Find the owner by stripe_account_id
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_account_id", account.id)
    .single();

  if (error || !profile) {
    logStep("No profile found for Stripe account", { accountId: account.id });
    return;
  }

  const onboardingComplete = !!(account.charges_enabled && account.payouts_enabled);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      stripe_charges_enabled: account.charges_enabled ?? false,
      stripe_payouts_enabled: account.payouts_enabled ?? false,
      stripe_onboarding_complete: onboardingComplete,
    })
    .eq("id", profile.id);

  if (updateError) {
    logStep("Failed to update profile", { error: updateError.message });
  } else {
    logStep("Profile updated with Connect status", {
      ownerId: profile.id,
      onboardingComplete,
    });
  }
}

/**
 * Handle transfer.created (Stripe Connect)
 * Confirm payout was initiated — update booking payout_status.
 */
async function handleTransferCreated(
  supabase: ReturnType<typeof createClient>,
  transfer: Stripe.Transfer
) {
  const bookingId = transfer.metadata?.booking_id;
  logStep("Processing transfer.created", {
    transferId: transfer.id,
    bookingId,
    amount: transfer.amount,
  });

  if (!bookingId) {
    // Try looking up by stripe_transfer_id
    const { data: booking } = await supabase
      .from("bookings")
      .select("id")
      .eq("stripe_transfer_id", transfer.id)
      .single();

    if (!booking) {
      logStep("No booking found for transfer", { transferId: transfer.id });
      return;
    }

    await supabase
      .from("bookings")
      .update({
        payout_status: "paid",
        payout_date: new Date().toISOString(),
        status: "completed",
      })
      .eq("id", booking.id);

    logStep("Booking payout marked as paid", { bookingId: booking.id });
    return;
  }

  await supabase
    .from("bookings")
    .update({
      payout_status: "paid",
      payout_date: new Date().toISOString(),
      stripe_transfer_id: transfer.id,
      status: "completed",
    })
    .eq("id", bookingId);

  logStep("Booking payout marked as paid", { bookingId });
}

/**
 * Handle transfer.reversed (Stripe Connect)
 * Mark payout as failed if a transfer is reversed.
 */
async function handleTransferReversed(
  supabase: ReturnType<typeof createClient>,
  transfer: Stripe.Transfer
) {
  logStep("Processing transfer.reversed", {
    transferId: transfer.id,
    amount: transfer.amount,
    amountReversed: transfer.amount_reversed,
  });

  // Look up booking by transfer ID
  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("stripe_transfer_id", transfer.id)
    .single();

  if (!booking) {
    logStep("No booking found for reversed transfer", { transferId: transfer.id });
    return;
  }

  await supabase
    .from("bookings")
    .update({
      payout_status: "failed",
      payout_notes: `Transfer reversed: ${transfer.id}`,
    })
    .eq("id", booking.id);

  logStep("Booking payout marked as failed due to reversal", { bookingId: booking.id });
}
