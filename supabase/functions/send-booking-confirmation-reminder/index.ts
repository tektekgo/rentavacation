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
  | "checkin_reminder"
  | "owner_confirmation_request"
  | "owner_extension_notification"
  | "owner_confirmation_timeout";

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

    if (type === "owner_confirmation_request" && bookingConfirmationId) {
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
      const deadline = confirmation.owner_confirmation_deadline
        ? new Date(confirmation.owner_confirmation_deadline).toLocaleString()
        : "soon";

      if (!ownerEmail) throw new Error("Owner email not found");

      const html = buildEmailHtml({
        recipientName: ownerName,
        heading: "Action Required: Confirm Your Booking",
        body: `
          <p>A renter has booked your property at <strong>${resortName}</strong> and payment has been received.</p>
          <p>Please confirm that you can fulfill this booking:</p>
          <div style="background: #f7fafc; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
            ${detailRow("Guest", guestName)}
            ${detailRow("Check-in", checkIn)}
            ${detailRow("Check-out", checkOut)}
            ${detailRow("Payout Amount", `$${confirmation.escrow_amount?.toLocaleString()}`)}
          </div>
          ${infoBox(`<strong>You must confirm by:</strong> ${deadline}. If you cannot fulfill this booking, please decline so the renter can be refunded.`, "warning")}
        `,
        cta: { label: "Confirm Booking", url: "https://rentavacation.lovable.app/owner-dashboard?tab=confirmations" },
      });

      await resend.emails.send({
        from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
        to: [ownerEmail],
        subject: `Action Required: Confirm booking – ${resortName}`,
        html,
      });

      logStep("Owner confirmation request email sent", { ownerEmail });
    }

    if (type === "owner_extension_notification" && bookingConfirmationId) {
      const { data: confirmation, error } = await supabaseClient
        .from("booking_confirmations")
        .select(`*, booking:bookings(*, listing:listings(*, property:properties(*)), renter:profiles(*)), owner:profiles!booking_confirmations_owner_id_fkey(*)`)
        .eq("id", bookingConfirmationId)
        .single();

      if (error || !confirmation) throw new Error("Booking confirmation not found");

      const renterEmail = confirmation.booking?.renter?.email;
      const renterName = confirmation.booking?.renter?.full_name || "Traveler";
      const resortName = confirmation.booking?.listing?.property?.resort_name;
      const newDeadline = confirmation.owner_confirmation_deadline
        ? new Date(confirmation.owner_confirmation_deadline).toLocaleString()
        : "extended";

      if (!renterEmail) throw new Error("Renter email not found");

      const html = buildEmailHtml({
        recipientName: renterName,
        heading: "Owner Requested More Time",
        body: `
          <p>The property owner for <strong>${resortName}</strong> has requested a time extension to confirm your booking.</p>
          ${infoBox(`The new confirmation deadline is <strong>${newDeadline}</strong>. We'll notify you as soon as the owner confirms.`, "warning")}
          <p>No action is needed from you at this time. Your payment is safely held in escrow.</p>
        `,
        cta: { label: "View Booking", url: "https://rentavacation.lovable.app/booking-success" },
      });

      await resend.emails.send({
        from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
        to: [renterEmail],
        subject: `Booking Update – Owner requested more time for ${resortName}`,
        html,
      });

      logStep("Owner extension notification sent to renter", { renterEmail });
    }

    if (type === "owner_confirmation_timeout" && bookingConfirmationId) {
      const { data: confirmation, error } = await supabaseClient
        .from("booking_confirmations")
        .select(`*, booking:bookings(*, listing:listings(*, property:properties(*)), renter:profiles(*)), owner:profiles!booking_confirmations_owner_id_fkey(*)`)
        .eq("id", bookingConfirmationId)
        .single();

      if (error || !confirmation) throw new Error("Booking confirmation not found");

      const ownerEmail = confirmation.owner?.email;
      const ownerName = confirmation.owner?.full_name || "Owner";
      const renterEmail = confirmation.booking?.renter?.email;
      const renterName = confirmation.booking?.renter?.full_name || "Traveler";
      const resortName = confirmation.booking?.listing?.property?.resort_name;

      // Notify owner
      if (ownerEmail) {
        const ownerHtml = buildEmailHtml({
          recipientName: ownerName,
          heading: "Booking Cancelled – Confirmation Timed Out",
          body: `
            <p>Your booking for <strong>${resortName}</strong> has been automatically cancelled because you did not confirm within the required time window.</p>
            ${infoBox("The renter's payment has been refunded. This may affect your reliability rating.", "error")}
          `,
          cta: { label: "View Dashboard", url: "https://rentavacation.lovable.app/owner-dashboard" },
        });

        await resend.emails.send({
          from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
          to: [ownerEmail],
          subject: `Booking Cancelled – Confirmation timed out for ${resortName}`,
          html: ownerHtml,
        });

        logStep("Timeout notification sent to owner", { ownerEmail });
      }

      // Notify renter
      if (renterEmail) {
        const renterHtml = buildEmailHtml({
          recipientName: renterName,
          heading: "Booking Cancelled – Full Refund Issued",
          body: `
            <p>Unfortunately, the property owner for <strong>${resortName}</strong> did not confirm your booking within the required time.</p>
            <p>A full refund of <strong>$${confirmation.escrow_amount?.toLocaleString()}</strong> has been initiated to your original payment method.</p>
            ${infoBox("Your refund should appear within 5-10 business days depending on your bank.", "success")}
            <p>We encourage you to browse other available properties!</p>
          `,
          cta: { label: "Browse Properties", url: "https://rentavacation.lovable.app/rentals" },
        });

        await resend.emails.send({
          from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
          to: [renterEmail],
          subject: `Booking Cancelled – Full refund for ${resortName}`,
          html: renterHtml,
        });

        logStep("Timeout notification sent to renter", { renterEmail });
      }
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
