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
        from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
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

    // Process owner confirmation timeouts
    const { data: timedOutConfirmations, error: timeoutError } = await supabaseClient
      .from("booking_confirmations")
      .select("id, booking_id, owner_id, escrow_amount")
      .eq("owner_confirmation_status", "pending_owner")
      .lte("owner_confirmation_deadline", now.toISOString());

    if (!timeoutError && timedOutConfirmations) {
      logStep("Found timed-out owner confirmations", { count: timedOutConfirmations.length });

      for (const conf of timedOutConfirmations) {
        // Auto-set owner_timed_out and refund escrow
        await supabaseClient
          .from("booking_confirmations")
          .update({
            owner_confirmation_status: "owner_timed_out",
            escrow_status: "refunded",
            escrow_refunded_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq("id", conf.id);

        // Cancel the booking
        await supabaseClient
          .from("bookings")
          .update({
            status: "cancelled",
            updated_at: now.toISOString(),
          })
          .eq("id", conf.booking_id);

        // Send timeout notifications to both parties
        try {
          const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-booking-confirmation-reminder`;
          await fetch(notificationUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              type: "owner_confirmation_timeout",
              bookingConfirmationId: conf.id,
            }),
          });
        } catch (notifyError) {
          logStep("Warning: Failed to send timeout notification", { confirmationId: conf.id, error: String(notifyError) });
        }

        emailsSent++;
        logStep("Owner confirmation timed out", { confirmationId: conf.id, bookingId: conf.booking_id });
      }
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
              from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
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

    // === TRAVEL REQUEST EXPIRY WARNINGS ===
    // Find requests expiring in the next 47-49 hours (window avoids duplicate sends)
    let expiryWarningsSent = 0;
    const expiryWindowStart = new Date(now.getTime() + 47 * 3600000);
    const expiryWindowEnd = new Date(now.getTime() + 49 * 3600000);

    const { data: expiringRequests, error: expiryError } = await supabaseClient
      .from("travel_requests")
      .select(`
        *,
        traveler:profiles!travel_requests_traveler_id_fkey(email, full_name),
        travel_proposals(count)
      `)
      .eq("status", "open")
      .gte("proposals_deadline", expiryWindowStart.toISOString())
      .lte("proposals_deadline", expiryWindowEnd.toISOString());

    if (!expiryError && expiringRequests) {
      logStep("Found expiring travel requests", { count: expiringRequests.length });

      for (const request of expiringRequests) {
        // Dedup: check if expiry warning already sent for this request
        const { data: existingWarning } = await supabaseClient
          .from("notifications")
          .select("id")
          .eq("user_id", request.traveler_id)
          .eq("type", "travel_request_expiring_soon")
          .maybeSingle();

        if (existingWarning) {
          logStep("Expiry warning already sent", { request_id: request.id });
          continue;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const traveler = request.traveler as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const proposalCount = (request.travel_proposals as any)?.[0]?.count ?? 0;

        // Create in-app notification
        await supabaseClient.from("notifications").insert({
          user_id: request.traveler_id,
          type: "travel_request_expiring_soon",
          title: "Your travel request expires in 48 hours",
          message: proposalCount > 0
            ? `You have ${proposalCount} proposal(s) waiting. Review them before your request closes.`
            : `Your request for ${request.destination_location} closes soon. Extend it or it will expire.`,
        });

        // Send email
        if (traveler?.email) {
          try {
            const subject = proposalCount > 0
              ? `${proposalCount} proposal(s) waiting — your request expires in 48h`
              : `Your travel request for ${request.destination_location} expires in 48h`;

            const html = buildEmailHtml({
              recipientName: traveler.full_name,
              heading: "Your Travel Request Is Expiring",
              body: `
                ${detailRow("Destination", request.destination_location)}
                ${detailRow("Dates", `${request.check_in_date} – ${request.check_out_date}`)}
                ${detailRow("Proposals received", String(proposalCount))}
                ${detailRow("Expires", new Date(request.proposals_deadline).toLocaleDateString())}
                ${proposalCount > 0
                  ? infoBox("You have proposals waiting. Review them before your request closes.", "warning")
                  : infoBox("No proposals yet. You can extend your deadline to give owners more time.", "info")
                }
              `,
              cta: {
                label: proposalCount > 0 ? "Review Proposals →" : "View My Request →",
                url: "https://rent-a-vacation.com/my-bids",
              },
            });

            await resend.emails.send({
              from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
              to: [traveler.email],
              subject,
              html,
            });
          } catch (emailErr) {
            logStep("Expiry warning email failed", { request_id: request.id, error: String(emailErr) });
          }
        }

        expiryWarningsSent++;
        emailsSent++;
        logStep("Expiry warning sent", { request_id: request.id, traveler_id: request.traveler_id });
      }
    }

    logStep("Processing complete", { totalEmailsSent: emailsSent, urgentReminders, standardReminders, expiryWarningsSent });

    return new Response(
      JSON.stringify({ success: true, emailsSent, urgentReminders, standardReminders, expiryWarningsSent }),
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
