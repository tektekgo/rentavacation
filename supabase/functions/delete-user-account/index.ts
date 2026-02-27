import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[DELETE-USER-ACCOUNT] ${step}${detailsStr}`);
};

const GRACE_PERIOD_DAYS = 14;

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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { action, reason } = await req.json();

    if (action === "request") {
      // ── REQUEST DELETION (soft-delete with grace period) ──
      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + GRACE_PERIOD_DAYS);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          deletion_requested_at: new Date().toISOString(),
          deletion_scheduled_for: scheduledFor.toISOString(),
          deletion_reason: reason || null,
        })
        .eq("id", user.id);

      if (updateError) throw new Error(`Failed to request deletion: ${updateError.message}`);

      logStep("Deletion requested", {
        userId: user.id,
        scheduledFor: scheduledFor.toISOString(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          action: "deletion_requested",
          scheduled_for: scheduledFor.toISOString(),
          grace_period_days: GRACE_PERIOD_DAYS,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "cancel") {
      // ── CANCEL DELETION REQUEST ──
      const { error: cancelError } = await supabase
        .from("profiles")
        .update({
          deletion_requested_at: null,
          deletion_scheduled_for: null,
          deletion_reason: null,
        })
        .eq("id", user.id);

      if (cancelError) throw new Error(`Failed to cancel deletion: ${cancelError.message}`);

      logStep("Deletion cancelled", { userId: user.id });

      return new Response(
        JSON.stringify({ success: true, action: "deletion_cancelled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "execute") {
      // ── EXECUTE DELETION (called after grace period or by admin) ──
      // Verify grace period has passed
      const { data: profile } = await supabase
        .from("profiles")
        .select("deletion_scheduled_for")
        .eq("id", user.id)
        .single();

      if (!profile?.deletion_scheduled_for) {
        throw new Error("No deletion request found");
      }

      const scheduledDate = new Date(profile.deletion_scheduled_for);
      if (scheduledDate > new Date()) {
        throw new Error(
          `Deletion scheduled for ${scheduledDate.toISOString()}. Grace period has not elapsed.`
        );
      }

      logStep("Executing account deletion", { userId: user.id });

      // 1. Delete non-financial data (preferences, search logs, favorites)
      await Promise.all([
        supabase.from("notification_preferences").delete().eq("user_id", user.id),
        supabase.from("voice_search_logs").delete().eq("user_id", user.id),
        supabase.from("voice_user_overrides").delete().eq("user_id", user.id),
        supabase.from("favorites").delete().eq("user_id", user.id),
        supabase.from("user_memberships").delete().eq("user_id", user.id),
        supabase.from("role_upgrade_requests").delete().eq("user_id", user.id),
      ]);
      logStep("Non-financial data deleted");

      // 2. Delete user roles
      await supabase.from("user_roles").delete().eq("user_id", user.id);
      logStep("User roles deleted");

      // 3. Anonymize profile (keep record but remove PII)
      const anonymizedEmail = `deleted-${user.id.slice(0, 8)}@anonymized.rav`;
      const { error: anonError } = await supabase
        .from("profiles")
        .update({
          full_name: "Deleted User",
          email: anonymizedEmail,
          phone: null,
          avatar_url: null,
          stripe_account_id: null,
          stripe_charges_enabled: null,
          stripe_onboarding_complete: null,
          stripe_payouts_enabled: null,
          is_anonymized: true,
          deletion_requested_at: null,
          deletion_scheduled_for: null,
        })
        .eq("id", user.id);

      if (anonError) logStep("Warning: profile anonymization error", { error: anonError.message });
      logStep("Profile anonymized");

      // 4. Delete auth user (Supabase admin API)
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (authDeleteError) {
        logStep("Warning: auth user deletion error", { error: authDeleteError.message });
      } else {
        logStep("Auth user deleted");
      }

      // Note: Bookings, listings, properties, bids, proposals, disputes,
      // cancellation_requests are RETAINED for tax/legal compliance (7 years).
      // The profile is anonymized ("Deleted User") so joins still work
      // but no PII is accessible.

      logStep("Account deletion complete", { userId: user.id });

      return new Response(
        JSON.stringify({ success: true, action: "account_deleted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action. Use 'request', 'cancel', or 'execute'.");
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
