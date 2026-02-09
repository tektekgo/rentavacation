import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { buildEmailHtml, detailRow, infoBox } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type NotificationType =
  | "new_booking"
  | "confirmation_reminder"
  | "deadline_urgent"
  | "checkin_reminder";

interface NotificationRequest {
  type: NotificationType;
  bookingConfirmationId?: string;
  checkinConfirmationId?: string;
}

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-BOOKING-CONFIRMATION-REMINDER] ${step}${detailsStr}`);
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
    logStep("Function started");

    const { type, bookingConfirmationId, checkinConfirmationId }: NotificationRequest = await req.json();
    logStep("Request parsed", { type, bookingConfirmationId, checkinConfirmationId });

    if (type === "new_booking" && bookingConfirmationId) {
      const { data: confirmation, error } = await supabaseClient
        .from("booking_confirmations")
        .select(`*, booking:bookings(*, listing:listings(*, property:properties(*)), renter:profiles(*)), owner:profiles!booking_confirmations_owner_id_fkey(*)`)
        .eq("id", bookingConfirmationId)
        .single();

      if (error || !confirmation) throw new Error("Booking confirmation not found");

      const ownerEmail = confirmation.owner?.email;
      const ownerName = confirmation.owner?.full_name || "Owner";
      const resortName = confirmation.booking?.listing?.property?.resort_name;
      const guestName = confirmation.booking?.renter?.full_name || "Guest";
      const checkIn = new Date(confirmation.booking?.listing?.check_in_date).toLocaleDateString();
      const checkOut = new Date(confirmation.booking?.listing?.check_out_date).toLocaleDateString();
      const deadline = new Date(confirmation.confirmation_deadline).toLocaleString();

      if (!ownerEmail) throw new Error("Owner email not found");

      const html = buildEmailHtml({
        recipientName: ownerName,
        heading: "New Booking Received!",
        body: `
          <p>Great news! You have a new booking for <strong>${resortName}</strong>.</p>
          <p>Here are the details:</p>
          <div style="background: #f7fafc; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
            ${detailRow("Guest", guestName)}
            ${detailRow("Check-in", checkIn)}
            ${detailRow("Check-out", checkOut)}
            ${detailRow("Payout Amount", `$${confirmation.escrow_amount?.toLocaleString()}`)}
          </div>
          ${infoBox(`<strong>Action Required:</strong> Submit your resort confirmation number before <strong>${deadline}</strong>.`, "warning")}
        `,
        cta: { label: "Submit Confirmation", url: "https://rentavacation.lovable.app/owner-dashboard?tab=confirmations" },
      });

      await resend.emails.send({
        from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
        to: [ownerEmail],
        subject: `New Booking! Action Required – ${resortName}`,
        html,
      });

      logStep("New booking email sent", { ownerEmail });
    }

    if (type === "confirmation_reminder" && bookingConfirmationId) {
      const { data: confirmation, error } = await supabaseClient
        .from("booking_confirmations")
        .select(`*, booking:bookings(*, listing:listings(*, property:properties(*))), owner:profiles!booking_confirmations_owner_id_fkey(*)`)
        .eq("id", bookingConfirmationId)
        .single();

      if (error || !confirmation) throw new Error("Booking confirmation not found");

      const ownerEmail = confirmation.owner?.email;
      const ownerName = confirmation.owner?.full_name || "Owner";
      const resortName = confirmation.booking?.listing?.property?.resort_name;
      const deadline = new Date(confirmation.confirmation_deadline);
      const hoursRemaining = Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60));

      if (!ownerEmail) throw new Error("Owner email not found");

      const html = buildEmailHtml({
        recipientName: ownerName,
        heading: "Deadline Approaching",
        body: `
          <p>You have <strong>${hoursRemaining} hours</strong> remaining to submit your resort confirmation number for <strong>${resortName}</strong>.</p>
          ${infoBox("Please submit your confirmation number before the deadline to avoid cancellation.", "warning")}
        `,
        cta: { label: "Submit Now", url: "https://rentavacation.lovable.app/owner-dashboard?tab=confirmations" },
      });

      await resend.emails.send({
        from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
        to: [ownerEmail],
        subject: `Reminder: ${hoursRemaining}h left to submit confirmation – ${resortName}`,
        html,
      });

      logStep("Reminder email sent", { ownerEmail, hoursRemaining });
    }

    if (type === "checkin_reminder" && checkinConfirmationId) {
      const { data: checkin, error } = await supabaseClient
        .from("checkin_confirmations")
        .select(`*, booking:bookings(*, listing:listings(*, property:properties(*))), traveler:profiles!checkin_confirmations_traveler_id_fkey(*)`)
        .eq("id", checkinConfirmationId)
        .single();

      if (error || !checkin) throw new Error("Checkin confirmation not found");

      const travelerEmail = checkin.traveler?.email;
      const travelerName = checkin.traveler?.full_name || "Traveler";
      const resortName = checkin.booking?.listing?.property?.resort_name;
      const deadline = new Date(checkin.confirmation_deadline).toLocaleString();

      if (!travelerEmail) throw new Error("Traveler email not found");

      const html = buildEmailHtml({
        recipientName: travelerName,
        heading: `Welcome to ${resortName}!`,
        body: `
          <p>We hope you're enjoying your stay! Please confirm your check-in to complete the booking process.</p>
          ${infoBox(`<strong>Please confirm by:</strong> ${deadline}`, "success")}
          <p>If everything is as expected, confirm your arrival. If you encounter any issues, report them so we can help.</p>
        `,
        cta: { label: "Confirm Check-in", url: "https://rentavacation.lovable.app/checkin" },
      });

      await resend.emails.send({
        from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
        to: [travelerEmail],
        subject: `Time to confirm your check-in at ${resortName}!`,
        html,
      });

      logStep("Checkin reminder email sent", { travelerEmail });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
