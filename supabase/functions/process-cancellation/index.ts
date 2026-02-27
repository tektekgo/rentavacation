import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[PROCESS-CANCELLATION] ${step}${detailsStr}`);
};

/**
 * Calculate policy-based refund (mirrors src/lib/cancellation.ts)
 */
function calculatePolicyRefund(
  totalAmount: number,
  policy: string,
  daysUntilCheckin: number
): number {
  switch (policy) {
    case "flexible":
      return daysUntilCheckin >= 1 ? totalAmount : 0;
    case "moderate":
      if (daysUntilCheckin >= 5) return totalAmount;
      if (daysUntilCheckin >= 1) return Math.round(totalAmount * 0.5 * 100) / 100;
      return 0;
    case "strict":
      return daysUntilCheckin >= 7 ? Math.round(totalAmount * 0.5 * 100) / 100 : 0;
    case "super_strict":
      return 0;
    default:
      return 0;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    // Authenticate
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Rate limit check
    const rateCheck = await checkRateLimit(supabase, user.id, RATE_LIMITS.CANCELLATION);
    if (!rateCheck.allowed) {
      logStep("Rate limited", { userId: user.id });
      return rateLimitResponse(rateCheck.retryAfterSeconds);
    }

    const { bookingId, reason, cancelledBy } = await req.json();
    if (!bookingId) throw new Error("Booking ID is required");
    if (!reason) throw new Error("Cancellation reason is required");
    if (!cancelledBy || !["renter", "owner"].includes(cancelledBy)) {
      throw new Error("cancelledBy must be 'renter' or 'owner'");
    }
    logStep("Request parsed", { bookingId, cancelledBy });

    // Fetch booking with listing and property
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

    if (bookingError || !booking) throw new Error("Booking not found");

    // Verify the booking is cancellable
    if (booking.status !== "confirmed") {
      throw new Error(`Cannot cancel a booking with status: ${booking.status}`);
    }

    // Authorization: renter can cancel their own, owner can cancel bookings on their listings
    if (cancelledBy === "renter" && booking.renter_id !== user.id) {
      throw new Error("You can only cancel your own bookings");
    }
    if (cancelledBy === "owner" && booking.listing?.owner_id !== user.id) {
      throw new Error("You can only cancel bookings on your own listings");
    }

    // Calculate refund amount
    const checkInDate = new Date(booking.listing?.check_in_date);
    const now = new Date();
    const daysUntilCheckin = Math.max(0, Math.ceil((checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const policy = booking.listing?.cancellation_policy || "moderate";

    let refundAmount: number;
    if (cancelledBy === "owner") {
      // Owner cancellations ALWAYS get full refund to renter
      refundAmount = booking.total_amount;
    } else {
      // Renter cancellation uses policy-based calculation
      refundAmount = calculatePolicyRefund(booking.total_amount, policy, daysUntilCheckin);
    }

    logStep("Refund calculated", { policy, daysUntilCheckin, refundAmount, totalAmount: booking.total_amount });

    // Process Stripe refund if there's a payment to refund
    let refundReference: string | null = null;
    if (refundAmount > 0 && booking.payment_intent_id) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      const refundAmountCents = Math.round(refundAmount * 100);

      try {
        const refund = await stripe.refunds.create({
          payment_intent: booking.payment_intent_id,
          amount: refundAmountCents,
          metadata: {
            booking_id: bookingId,
            cancelled_by: cancelledBy,
            reason: reason.slice(0, 500),
          },
        });
        refundReference = refund.id;
        logStep("Stripe refund created", { refundId: refund.id, amount: refundAmountCents });
      } catch (stripeError) {
        const msg = stripeError instanceof Error ? stripeError.message : String(stripeError);
        logStep("Stripe refund failed, continuing with cancellation", { error: msg });
        // Don't block the cancellation — log the failure and continue
      }
    }

    // Create cancellation request record
    const { data: cancellationRequest, error: cancelError } = await supabase
      .from("cancellation_requests")
      .insert({
        booking_id: bookingId,
        requester_id: user.id,
        status: "completed",
        reason,
        requested_refund_amount: refundAmount,
        policy_refund_amount: calculatePolicyRefund(booking.total_amount, policy, daysUntilCheckin),
        days_until_checkin: daysUntilCheckin,
        final_refund_amount: refundAmount,
        refund_processed_at: refundReference ? new Date().toISOString() : null,
        refund_reference: refundReference,
      })
      .select()
      .single();

    if (cancelError) {
      logStep("Warning: Failed to create cancellation request", { error: cancelError.message });
    }

    // Update booking status to cancelled
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (updateError) throw new Error(`Failed to cancel booking: ${updateError.message}`);
    logStep("Booking cancelled", { bookingId });

    // Update listing status back to active
    const { error: listingError } = await supabase
      .from("listings")
      .update({ status: "active" })
      .eq("id", booking.listing_id);

    if (listingError) {
      logStep("Warning: Failed to reactivate listing", { error: listingError.message });
    }

    // Update escrow status to refunded if exists
    await supabase
      .from("booking_confirmations")
      .update({
        escrow_status: "refunded",
        escrow_refunded_at: new Date().toISOString(),
      })
      .eq("booking_id", bookingId);

    // If owner-initiated, increment their cancellation count
    if (cancelledBy === "owner") {
      const { data: verification } = await supabase
        .from("owner_verifications")
        .select("id, cancellation_count")
        .eq("owner_id", user.id)
        .single();

      if (verification) {
        await supabase
          .from("owner_verifications")
          .update({ cancellation_count: (verification.cancellation_count || 0) + 1 })
          .eq("id", verification.id);
        logStep("Owner cancellation count incremented");
      }
    }

    // Send cancellation email
    if (cancellationRequest) {
      try {
        const emailUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-cancellation-email`;
        await fetch(emailUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            cancellationRequestId: cancellationRequest.id,
            type: "completed",
          }),
        });
        logStep("Cancellation email sent");
      } catch (emailError) {
        logStep("Warning: Failed to send cancellation email", { error: String(emailError) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        refund_amount: refundAmount,
        refund_reference: refundReference,
        policy,
        days_until_checkin: daysUntilCheckin,
        cancelled_by: cancelledBy,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
