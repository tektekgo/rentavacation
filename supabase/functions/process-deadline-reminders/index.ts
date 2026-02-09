import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { buildEmailHtml, infoBox } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-DEADLINE-REMINDERS] ${step}${detailsStr}`);
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
    logStep("Starting deadline reminder processing");

    const now = new Date();
    const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    const { data: pendingConfirmations, error: fetchError } = await supabaseClient
      .from("booking_confirmations")
      .select(`*, booking:bookings(*, listing:listings(*, property:properties(*))), owner:profiles!booking_confirmations_owner_id_fkey(*)`)
      .eq("status", "pending_confirmation")
      .lte("confirmation_deadline", twelveHoursFromNow.toISOString())
      .gt("confirmation_deadline", now.toISOString());

    if (fetchError) throw new Error(`Failed to fetch pending confirmations: ${fetchError.message}`);
    logStep("Found pending confirmations", { count: pendingConfirmations?.length || 0 });

    let emailsSent = 0;
    let urgentReminders = 0;
    let standardReminders = 0;

    for (const confirmation of pendingConfirmations || []) {
      const deadline = new Date(confirmation.confirmation_deadline);
      const hoursRemaining = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
      const isUrgent = hoursRemaining <= 6;
      const reminderKey = isUrgent ? "urgent_reminder_sent" : "standard_reminder_sent";

      if (confirmation[reminderKey]) {
        logStep("Skipping - reminder already sent", { confirmationId: confirmation.id });
        continue;
      }

      const ownerEmail = confirmation.owner?.email;
      const ownerName = confirmation.owner?.full_name || "Owner";
      const resortName = confirmation.booking?.listing?.property?.resort_name || "Your Property";

      if (!ownerEmail) {
        logStep("Skipping - no owner email", { confirmationId: confirmation.id });
        continue;
      }

      const subject = isUrgent
        ? `URGENT: Only ${hoursRemaining}h left to confirm – ${resortName}`
        : `Reminder: ${hoursRemaining}h left to submit confirmation – ${resortName}`;

      const html = buildEmailHtml({
        recipientName: ownerName,
        heading: isUrgent ? "Final Warning" : "Deadline Approaching",
        body: `
          <p>${isUrgent
            ? `<strong>This is your final reminder.</strong> You have only <strong>${hoursRemaining} hours</strong> remaining to submit your resort confirmation number for <strong>${resortName}</strong>.`
            : `You have <strong>${hoursRemaining} hours</strong> remaining to submit your resort confirmation number for <strong>${resortName}</strong>.`
          }</p>
          ${infoBox(
            isUrgent
              ? "Failure to submit the confirmation number will result in automatic booking cancellation and full refund to the traveler."
              : "Please submit your confirmation number before the deadline to avoid cancellation.",
            isUrgent ? "error" : "warning"
          )}
          <div style="background: #f7fafc; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
            <p style="margin: 0 0 6px 0;"><strong>Payout Amount:</strong> $${confirmation.escrow_amount?.toLocaleString() || '0'}</p>
            <p style="margin: 0;"><strong>Deadline:</strong> ${deadline.toLocaleString()}</p>
          </div>
        `,
        cta: { label: "Submit Confirmation Now", url: "https://rentavacation.lovable.app/owner-dashboard?tab=confirmations" },
      });

      await resend.emails.send({
        from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
        to: [ownerEmail],
        subject,
        html,
      });

      await supabaseClient
        .from("booking_confirmations")
        .update({
          [isUrgent ? "urgent_reminder_sent" : "standard_reminder_sent"]: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", confirmation.id);

      emailsSent++;
      if (isUrgent) urgentReminders++; else standardReminders++;
      logStep("Reminder sent", { confirmationId: confirmation.id, ownerEmail, hoursRemaining });
    }

    // Process check-in reminders for travelers
    const checkInStart = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const checkInEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const { data: pendingCheckins, error: checkinError } = await supabaseClient
      .from("checkin_confirmations")
      .select(`*, booking:bookings(*, listing:listings(*, property:properties(*))), traveler:profiles!checkin_confirmations_traveler_id_fkey(*)`)
      .eq("status", "pending")
      .is("reminder_sent", false);

    if (!checkinError && pendingCheckins) {
      for (const checkin of pendingCheckins) {
        const checkInDate = new Date(checkin.booking?.listing?.check_in_date);
        if (checkInDate >= checkInStart && checkInDate <= checkInEnd) {
          const travelerEmail = checkin.traveler?.email;
          const travelerName = checkin.traveler?.full_name || "Traveler";
          const resortName = checkin.booking?.listing?.property?.resort_name || "Your Resort";

          if (travelerEmail) {
            const html = buildEmailHtml({
              recipientName: travelerName,
              heading: `Welcome to ${resortName}!`,
              body: `
                <p>We hope you're enjoying your stay! Please confirm your check-in within 24 hours of arrival.</p>
                ${infoBox(`<strong>Please confirm by:</strong> ${new Date(checkin.confirmation_deadline).toLocaleString()}`, "success")}
              `,
              cta: { label: "Confirm Check-in", url: "https://rentavacation.lovable.app/checkin" },
            });

            await resend.emails.send({
              from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
              to: [travelerEmail],
              subject: `Time to confirm your check-in at ${resortName}!`,
              html,
            });

            await supabaseClient
              .from("checkin_confirmations")
              .update({ reminder_sent: true })
              .eq("id", checkin.id);

            emailsSent++;
            logStep("Check-in reminder sent", { checkinId: checkin.id, travelerEmail });
          }
        }
      }
    }

    logStep("Processing complete", { totalEmailsSent: emailsSent, urgentReminders, standardReminders });

    return new Response(
      JSON.stringify({ success: true, emailsSent, urgentReminders, standardReminders }),
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
