import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { buildEmailHtml, detailRow, infoBox } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[MATCH-TRAVEL-REQUESTS] ${step}${detailsStr}`);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { listing_id } = await req.json();
    if (!listing_id) {
      return new Response(
        JSON.stringify({ error: "listing_id required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    logStep("Starting match for listing", { listing_id });

    // 1. Fetch listing + property details
    const { data: listing, error: listingError } = await supabaseClient
      .from("listings")
      .select(`
        id, check_in_date, check_out_date, final_price, status,
        property:properties!inner(id, resort_name, location, bedrooms, brand, city, state)
      `)
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      logStep("Listing not found", { listing_id, error: listingError?.message });
      return new Response(
        JSON.stringify({ error: "Listing not found", matched_count: 0, notified_traveler_ids: [] }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (listing.status !== "active") {
      logStep("Listing not active, skipping", { listing_id, status: listing.status });
      return new Response(
        JSON.stringify({ matched_count: 0, notified_traveler_ids: [] }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const property = listing.property as any;
    const city = property?.city || property?.location?.split(",")[0]?.trim() || "";

    // 2. Query matching open travel requests
    let query = supabaseClient
      .from("travel_requests")
      .select("*, traveler:profiles!travel_requests_traveler_id_fkey(email, full_name)")
      .eq("status", "open")
      .gt("proposals_deadline", new Date().toISOString());

    // Destination match (city-based ILIKE)
    if (city) {
      query = query.ilike("destination_location", `%${city}%`);
    }

    // Bedrooms match
    if (property?.bedrooms) {
      query = query.lte("bedrooms_needed", property.bedrooms);
    }

    const { data: matchingRequests, error: matchError } = await query;

    if (matchError) {
      logStep("Error querying travel requests", { error: matchError.message });
      throw matchError;
    }

    logStep("Found potential matches", { count: matchingRequests?.length || 0 });

    const notifiedIds: string[] = [];

    for (const request of matchingRequests ?? []) {
      // Date flexibility check
      const listingCheckIn = new Date(listing.check_in_date);
      const requestCheckIn = new Date(request.check_in_date);
      const flexDays = request.flexibility_days || 0;
      const daysDiff = Math.abs(
        (listingCheckIn.getTime() - requestCheckIn.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff > flexDays + 30) continue; // outside ±30 day window + flexibility

      // Budget check
      if (request.budget_preference !== "undisclosed" && request.budget_max) {
        if (listing.final_price > request.budget_max) continue;
      }

      // Brand preference check
      if (request.preferred_brands?.length > 0 && property?.brand) {
        if (!request.preferred_brands.includes(property.brand)) continue;
      }

      // Deduplication check
      const { data: alreadyNotified } = await supabaseClient
        .from("notifications")
        .select("id")
        .eq("user_id", request.traveler_id)
        .eq("type", "new_travel_request_match")
        .eq("listing_id", listing.id)
        .maybeSingle();

      if (alreadyNotified) {
        logStep("Already notified, skipping", { traveler_id: request.traveler_id });
        continue;
      }

      // Budget-aware notification message
      const bedroomStr = property?.bedrooms ? `${property.bedrooms}BR` : "";
      const message =
        request.budget_preference === "undisclosed"
          ? `A ${bedroomStr} listing just became available in ${city}. View it to see pricing.`
          : `A ${bedroomStr} listing in ${city} just listed for $${listing.final_price.toLocaleString()} — within your budget.`;

      // Create in-app notification
      await supabaseClient.from("notifications").insert({
        user_id: request.traveler_id,
        type: "new_travel_request_match",
        title: "New listing matches your request!",
        message,
        listing_id: listing.id,
        request_id: request.id,
      });

      // Send email (best-effort)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const traveler = request.traveler as any;
      if (traveler?.email) {
        try {
          const emailBody =
            request.budget_preference === "undisclosed"
              ? `A listing matching your request just listed in ${city} — ${bedroomStr} available. View it to see pricing.`
              : `A listing matching your request just listed in ${city} — ${bedroomStr} for $${listing.final_price.toLocaleString()}.`;

          await resend.emails.send({
            from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
            to: [traveler.email],
            subject: `New listing matches your travel request in ${city}!`,
            html: buildEmailHtml({
              recipientName: traveler.full_name,
              heading: "New Listing Match",
              body: `
                <p>${emailBody}</p>
                ${detailRow("Resort", property?.resort_name || city)}
                ${detailRow("Dates", `${listing.check_in_date} – ${listing.check_out_date}`)}
                ${property?.bedrooms ? detailRow("Bedrooms", String(property.bedrooms)) : ""}
                ${request.budget_preference !== "undisclosed" ? detailRow("Price", `$${listing.final_price.toLocaleString()}`) : ""}
                ${infoBox("This listing was automatically matched to your open travel request.", "success")}
              `,
              cta: {
                label: "View Listing →",
                url: `https://rent-a-vacation.com/property/${listing.id}`,
              },
            }),
          });
        } catch (emailErr) {
          logStep("Email failed (notification still created)", {
            traveler_id: request.traveler_id,
            error: String(emailErr),
          });
        }
      }

      notifiedIds.push(request.traveler_id);
      logStep("Match notified", { traveler_id: request.traveler_id, request_id: request.id });
    }

    logStep("Processing complete", { matched_count: notifiedIds.length });

    return new Response(
      JSON.stringify({ matched_count: notifiedIds.length, notified_traveler_ids: notifiedIds }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage, matched_count: 0, notified_traveler_ids: [] }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
