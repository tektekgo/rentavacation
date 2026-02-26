import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";
import { buildEmailHtml, detailRow } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-STRIPE-PAYOUT] ${step}${detailsStr}`);
};

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

    // Authenticate — must be admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Verify admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isAdmin = roles?.some(r => r.role === "rav_admin" || r.role === "rav_staff");
    if (!isAdmin) throw new Error("Only RAV admins can initiate payouts");
    logStep("Admin authenticated", { userId: user.id });

    const { bookingId } = await req.json();
    if (!bookingId) throw new Error("Booking ID is required");

    // Fetch booking with owner details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        listing:listings(
          *,
          property:properties(*),
          owner:profiles!listings_owner_id_fkey(
            id, full_name, email,
            stripe_account_id, stripe_onboarding_complete, stripe_payouts_enabled
          )
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) throw new Error("Booking not found");
    logStep("Booking fetched", { bookingId, status: booking.status, payoutStatus: booking.payout_status });

    // Validate booking is eligible for payout
    if (booking.status !== "confirmed" && booking.status !== "completed") {
      throw new Error(`Booking status must be confirmed or completed, got: ${booking.status}`);
    }

    if (booking.payout_status === "paid") {
      throw new Error("Payout already completed for this booking");
    }

    if (booking.payout_status === "processing") {
      throw new Error("Payout is already being processed");
    }

    const owner = booking.listing?.owner;
    if (!owner) throw new Error("Owner not found for this listing");

    // Check owner has a connected Stripe account
    if (!owner.stripe_account_id) {
      throw new Error("Owner has not set up their Stripe Connect account. They must complete onboarding first.");
    }

    if (!owner.stripe_payouts_enabled) {
      throw new Error("Owner's Stripe account is not fully verified. Payouts are not yet enabled.");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Verify the connected account is still in good standing
    const account = await stripe.accounts.retrieve(owner.stripe_account_id);
    if (!account.payouts_enabled) {
      // Update our records if they're stale
      await supabase
        .from("profiles")
        .update({ stripe_payouts_enabled: false })
        .eq("id", owner.id);
      throw new Error("Owner's Stripe account payouts are currently disabled. Please contact the owner.");
    }

    const payoutAmountCents = Math.round(booking.owner_payout * 100);
    logStep("Creating transfer", {
      amount: payoutAmountCents,
      destination: owner.stripe_account_id,
      ownerName: owner.full_name,
    });

    // Create a Transfer to the owner's connected account
    const transfer = await stripe.transfers.create({
      amount: payoutAmountCents,
      currency: "usd",
      destination: owner.stripe_account_id,
      description: `Payout for booking ${bookingId.slice(0, 8).toUpperCase()} - ${booking.listing?.property?.resort_name || "Vacation Rental"}`,
      metadata: {
        booking_id: bookingId,
        listing_id: booking.listing_id,
        owner_id: owner.id,
      },
    });

    logStep("Transfer created", { transferId: transfer.id });

    // Update booking with transfer info
    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        payout_status: "processing",
        stripe_transfer_id: transfer.id,
        payout_reference: transfer.id,
        payout_notes: `Stripe Connect transfer initiated by ${user.email}`,
      })
      .eq("id", bookingId);

    if (updateError) {
      logStep("Warning: Failed to update booking", { error: updateError.message });
    }

    // Send payout notification email to owner
    try {
      const resortName = booking.listing?.property?.resort_name || "Your Property";
      const checkIn = new Date(booking.listing?.check_in_date).toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
      });

      const html = buildEmailHtml({
        recipientName: owner.full_name || "Property Owner",
        heading: "Payout Initiated!",
        body: `
          <p>Great news! A payout has been initiated for your completed booking.</p>
          <div style="background: #f7fafc; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
            ${detailRow("Resort", resortName)}
            ${detailRow("Check-in", checkIn)}
            ${detailRow("Payout Amount", `$${booking.owner_payout.toLocaleString()}`)}
            ${detailRow("Transfer ID", transfer.id)}
          </div>
          <p>The funds will be deposited to your connected bank account, typically within 2-3 business days.</p>
          <p>You can track all your payouts in your Owner Dashboard.</p>
        `,
        cta: { label: "View My Earnings", url: "https://rent-a-vacation.com/owner-dashboard?tab=earnings" },
      });

      await resend.emails.send({
        from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
        to: [owner.email],
        subject: `Payout Initiated – $${booking.owner_payout.toLocaleString()} for ${resortName}`,
        html,
      });
      logStep("Payout notification sent", { ownerEmail: owner.email });
    } catch (emailError) {
      logStep("Warning: Failed to send payout email", { error: String(emailError) });
    }

    return new Response(
      JSON.stringify({
        success: true,
        transfer_id: transfer.id,
        amount: booking.owner_payout,
        destination: owner.stripe_account_id,
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
