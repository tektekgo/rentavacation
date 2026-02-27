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
  console.log(`[DISPUTE-REFUND] ${step}${detailsStr}`);
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

    // Authenticate — must be RAV team
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Verify RAV team role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const isRavTeam = roles?.some((r: { role: string }) =>
      ["rav_admin", "rav_staff", "rav_owner"].includes(r.role)
    );
    if (!isRavTeam) throw new Error("Unauthorized: RAV team access required");
    logStep("Admin authenticated", { userId: user.id });

    // Rate limit check
    const rateCheck = await checkRateLimit(supabase, user.id, RATE_LIMITS.DISPUTE_REFUND);
    if (!rateCheck.allowed) {
      logStep("Rate limited", { userId: user.id });
      return rateLimitResponse(rateCheck.retryAfterSeconds);
    }

    const { disputeId, refundAmount, resolutionNotes, status } = await req.json();
    if (!disputeId) throw new Error("Dispute ID is required");
    if (refundAmount === undefined || refundAmount === null) {
      throw new Error("Refund amount is required (use 0 for no refund)");
    }
    if (!status) throw new Error("Resolution status is required");

    logStep("Request parsed", { disputeId, refundAmount, status });

    // Fetch dispute with booking
    const { data: dispute, error: disputeError } = await supabase
      .from("disputes")
      .select(`
        *,
        booking:bookings(
          id,
          total_amount,
          payment_intent_id,
          status,
          renter_id,
          listing_id
        )
      `)
      .eq("id", disputeId)
      .single();

    if (disputeError || !dispute) {
      throw new Error(`Dispute not found: ${disputeError?.message || "unknown"}`);
    }

    const booking = dispute.booking;
    if (!booking) throw new Error("Associated booking not found");
    logStep("Dispute fetched", {
      disputeId: dispute.id,
      bookingId: booking.id,
      totalAmount: booking.total_amount,
    });

    let refundReference: string | null = null;

    // Process Stripe refund if amount > 0 and payment exists
    if (refundAmount > 0 && booking.payment_intent_id) {
      logStep("Processing Stripe refund", { amount: refundAmount });
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-01-27.acacia" });

      const refund = await stripe.refunds.create({
        payment_intent: booking.payment_intent_id,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: "requested_by_customer",
        metadata: {
          dispute_id: disputeId,
          resolved_by: user.id,
        },
      });

      refundReference = refund.id;
      logStep("Stripe refund created", { refundId: refund.id });
    } else if (refundAmount > 0 && !booking.payment_intent_id) {
      logStep("No payment intent — refund recorded without Stripe processing");
    }

    // Update dispute record
    const { error: updateError } = await supabase
      .from("disputes")
      .update({
        status,
        resolution_notes: resolutionNotes || null,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        refund_amount: refundAmount,
        refund_reference: refundReference,
      })
      .eq("id", disputeId);

    if (updateError) throw new Error(`Failed to update dispute: ${updateError.message}`);
    logStep("Dispute resolved", { status, refundAmount });

    // Update escrow if refund was issued
    if (refundAmount > 0) {
      const { error: escrowError } = await supabase
        .from("booking_confirmations")
        .update({
          escrow_status: "refunded",
          escrow_refunded_at: new Date().toISOString(),
        })
        .eq("booking_id", booking.id);

      if (escrowError) {
        logStep("Warning: Failed to update escrow", { error: escrowError.message });
      }

      // Update booking status to cancelled if full refund
      if (refundAmount >= booking.total_amount) {
        await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", booking.id);
        logStep("Booking cancelled due to full refund");
      }
    }

    // Add resolution message to dispute thread
    await supabase.from("dispute_messages").insert({
      dispute_id: disputeId,
      sender_id: user.id,
      message: `Dispute resolved: ${status.replace(/_/g, " ")}. ${refundAmount > 0 ? `Refund of $${refundAmount.toFixed(2)} issued.` : "No refund issued."} ${resolutionNotes || ""}`.trim(),
      is_internal: false,
    });

    return new Response(
      JSON.stringify({
        success: true,
        disputeId,
        status,
        refundAmount,
        refundReference,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message });
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
