import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CONNECT-ACCOUNT] ${step}${detailsStr}`);
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

    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    const { returnUrl } = await req.json();

    // Verify the user is a property owner
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isOwner = roles?.some(r => r.role === "property_owner");
    if (!isOwner) throw new Error("Only property owners can create a Connect account");

    // Check if owner already has a Stripe account
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_account_id, stripe_onboarding_complete, full_name")
      .eq("id", user.id)
      .single();

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let accountId = profile?.stripe_account_id;

    if (accountId) {
      // Account already exists — check if onboarding is complete
      const account = await stripe.accounts.retrieve(accountId);

      if (account.charges_enabled && account.payouts_enabled) {
        logStep("Account already fully onboarded", { accountId });
        return new Response(
          JSON.stringify({
            success: true,
            already_complete: true,
            account_id: accountId,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      // Not complete — generate a new onboarding link
      logStep("Account exists but onboarding incomplete, generating new link", { accountId });
    } else {
      // Create a new Stripe Express account
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        metadata: {
          rav_user_id: user.id,
        },
        business_profile: {
          product_description: "Vacation timeshare property rentals via Rent-A-Vacation marketplace",
        },
        capabilities: {
          transfers: { requested: true },
        },
      });

      accountId = account.id;
      logStep("Stripe Express account created", { accountId });

      // Store account ID in profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          stripe_account_id: accountId,
          stripe_onboarding_complete: false,
          stripe_charges_enabled: false,
          stripe_payouts_enabled: false,
        })
        .eq("id", user.id);

      if (updateError) {
        logStep("Warning: Failed to store account ID in profile", { error: updateError.message });
      }
    }

    // Generate Account Link for onboarding
    const origin = req.headers.get("origin") || "https://rent-a-vacation.com";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: returnUrl || `${origin}/owner-dashboard?tab=earnings&stripe=refresh`,
      return_url: returnUrl || `${origin}/owner-dashboard?tab=earnings&stripe=complete`,
      type: "account_onboarding",
    });

    logStep("Onboarding link generated", { url: accountLink.url });

    return new Response(
      JSON.stringify({
        success: true,
        url: accountLink.url,
        account_id: accountId,
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
