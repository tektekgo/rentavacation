import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[EXPORT-USER-DATA] ${step}${detailsStr}`);
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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Gather all user data across tables
    const userId = user.id;

    const [
      profile,
      bookings,
      properties,
      listings,
      bids,
      travelRequests,
      proposals,
      notificationPrefs,
      voiceSearchLogs,
      roles,
      memberships,
      favorites,
      disputes,
      cancellationRequests,
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("bookings").select("*").eq("renter_id", userId),
      supabase.from("properties").select("*").eq("owner_id", userId),
      supabase.from("listings").select("*").eq("owner_id", userId),
      supabase.from("listing_bids").select("*").eq("bidder_id", userId),
      supabase.from("travel_requests").select("*").eq("requester_id", userId),
      supabase.from("travel_proposals").select("*").eq("owner_id", userId),
      supabase.from("notification_preferences").select("*").eq("user_id", userId),
      supabase.from("voice_search_logs").select("*").eq("user_id", userId),
      supabase.from("user_roles").select("*").eq("user_id", userId),
      supabase.from("user_memberships").select("*").eq("user_id", userId),
      supabase.from("favorites").select("*").eq("user_id", userId),
      supabase.from("disputes").select("*").eq("reporter_id", userId),
      supabase.from("cancellation_requests").select("*").eq("requester_id", userId),
    ]);

    const exportData = {
      export_metadata: {
        exported_at: new Date().toISOString(),
        user_id: userId,
        email: user.email,
        format: "JSON",
        version: "1.0",
      },
      profile: profile.data,
      account: {
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
      },
      roles: roles.data || [],
      memberships: memberships.data || [],
      bookings: bookings.data || [],
      properties: properties.data || [],
      listings: listings.data || [],
      bids: bids.data || [],
      travel_requests: travelRequests.data || [],
      travel_proposals: proposals.data || [],
      notification_preferences: notificationPrefs.data || [],
      voice_search_history: voiceSearchLogs.data || [],
      favorites: favorites.data || [],
      disputes: disputes.data || [],
      cancellation_requests: cancellationRequests.data || [],
    };

    logStep("Export complete", {
      bookings: (bookings.data || []).length,
      properties: (properties.data || []).length,
      listings: (listings.data || []).length,
    });

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="rav-data-export-${userId.slice(0, 8)}.json"`,
      },
    });
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
