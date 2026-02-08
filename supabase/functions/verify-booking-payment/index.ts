import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-BOOKING-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { bookingId } = await req.json();
    if (!bookingId) throw new Error("Booking ID is required");
    logStep("Request body parsed", { bookingId });

    // Fetch the booking
    const { data: booking, error: bookingError } = await supabaseClient
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("renter_id", user.id)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }
    logStep("Booking fetched", { bookingId: booking.id, status: booking.status });

    if (booking.status === "confirmed" || booking.status === "completed") {
      logStep("Booking already confirmed");
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: booking.status,
          message: "Booking already confirmed" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (!booking.payment_intent_id) {
      throw new Error("No payment session associated with this booking");
    }

    // Initialize Stripe and verify payment
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(booking.payment_intent_id);
    logStep("Stripe session retrieved", { 
      sessionId: session.id, 
      paymentStatus: session.payment_status 
    });

    if (session.payment_status === "paid") {
      // Update booking to confirmed
      const { error: updateError } = await supabaseClient
        .from("bookings")
        .update({
          status: "confirmed",
          paid_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (updateError) throw new Error(`Failed to update booking: ${updateError.message}`);

      // Update listing status to booked
      const { error: listingError } = await supabaseClient
        .from("listings")
        .update({ status: "booked" })
        .eq("id", booking.listing_id);

      if (listingError) {
        logStep("Warning: Failed to update listing status", { error: listingError.message });
      }

      logStep("Booking confirmed successfully");
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: "confirmed",
          message: "Payment verified and booking confirmed" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      logStep("Payment not completed", { paymentStatus: session.payment_status });
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: booking.status,
          message: "Payment not completed" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
