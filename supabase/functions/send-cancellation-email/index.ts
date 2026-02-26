import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";
import { buildEmailHtml, detailRow, infoBox } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-CANCELLATION-EMAIL] ${step}${detailsStr}`);
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
    const { cancellationRequestId, type } = await req.json();
    if (!cancellationRequestId) throw new Error("cancellationRequestId is required");
    logStep("Processing cancellation email", { cancellationRequestId, type });

    // Fetch cancellation request with booking, listing, and property details
    const { data: request, error: reqError } = await supabase
      .from("cancellation_requests")
      .select(`
        *,
        booking:bookings(
          *,
          listing:listings(
            *,
            property:properties(*)
          )
        )
      `)
      .eq("id", cancellationRequestId)
      .single();

    if (reqError || !request) throw new Error("Cancellation request not found");

    const booking = request.booking;
    const listing = booking?.listing;
    const property = listing?.property;

    // Fetch traveler profile
    const { data: traveler } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", request.requester_id)
      .single();

    const travelerName = traveler?.full_name || "Traveler";
    const travelerEmail = traveler?.email;

    if (!travelerEmail) {
      logStep("No traveler email found, skipping");
      return new Response(JSON.stringify({ success: false, reason: "no_email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resortName = property?.resort_name || "Your Resort";
    const location = property?.location || "";
    const checkIn = listing?.check_in_date
      ? new Date(listing.check_in_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
      : "N/A";
    const bookingIdShort = booking?.id?.slice(0, 8).toUpperCase() || "N/A";

    let subject = "";
    let heading = "";
    let body = "";

    const detailsBlock = `
      <div style="background: #f7fafc; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
        ${detailRow("Booking ID", bookingIdShort)}
        ${detailRow("Resort", resortName)}
        ${location ? detailRow("Location", location) : ""}
        ${detailRow("Check-in", checkIn)}
      </div>
    `;

    if (type === "approved" || type === "completed") {
      const refundAmount = request.final_refund_amount ?? request.counter_offer_amount ?? request.policy_refund_amount;
      subject = `Cancellation Confirmed – ${resortName}`;
      heading = "Booking Cancelled";
      body = `
        <p>Your cancellation request has been processed.</p>
        ${detailsBlock}
        ${refundAmount > 0
          ? infoBox(`A refund of <strong>$${Number(refundAmount).toLocaleString()}</strong> will be returned to your original payment method within 5–10 business days.`, "success")
          : infoBox("Based on the cancellation policy, no refund is applicable for this booking.", "info")
        }
        ${request.owner_response ? `<p><strong>Owner's note:</strong> ${request.owner_response}</p>` : ""}
        <p>We're sorry to see this trip cancelled. When you're ready to plan your next getaway, we'll be here to help!</p>
      `;
    } else if (type === "denied") {
      subject = `Cancellation Request Denied – ${resortName}`;
      heading = "Cancellation Request Update";
      body = `
        <p>Unfortunately, the property owner has denied your cancellation request.</p>
        ${detailsBlock}
        ${request.owner_response ? infoBox(`<strong>Owner's response:</strong> ${request.owner_response}`, "warning") : ""}
        <p>If you'd like to discuss this further, please contact our support team and we'll help facilitate a resolution.</p>
      `;
    } else if (type === "counter_offer") {
      subject = `Counter Offer on Your Cancellation – ${resortName}`;
      heading = "Cancellation Counter Offer";
      body = `
        <p>The property owner has responded to your cancellation request with a counter offer.</p>
        ${detailsBlock}
        ${infoBox(`The owner is offering a refund of <strong>$${Number(request.counter_offer_amount).toLocaleString()}</strong> (you requested $${Number(request.requested_refund_amount).toLocaleString()}).`, "info")}
        ${request.owner_response ? `<p><strong>Owner's note:</strong> ${request.owner_response}</p>` : ""}
        <p>Please log in to review and accept or decline this offer.</p>
      `;
    } else {
      // Default: request submitted confirmation
      subject = `Cancellation Request Submitted – ${resortName}`;
      heading = "Cancellation Request Received";
      body = `
        <p>We've received your cancellation request and it's now being reviewed by the property owner.</p>
        ${detailsBlock}
        ${infoBox(`You requested a refund of <strong>$${Number(request.requested_refund_amount).toLocaleString()}</strong>. The policy-based refund for this booking is <strong>$${Number(request.policy_refund_amount).toLocaleString()}</strong>.`, "info")}
        <p><strong>Reason:</strong> ${request.reason}</p>
        <p>The owner typically responds within 24–48 hours. We'll notify you as soon as there's an update.</p>
      `;
    }

    const html = buildEmailHtml({
      recipientName: travelerName,
      heading,
      body,
      cta: { label: "View My Bookings", url: "https://rentavacation.lovable.app/my-bids" },
    });

    await resend.emails.send({
      from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
      to: [travelerEmail],
      subject,
      html,
    });

    logStep("Cancellation email sent", { type, travelerEmail });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
