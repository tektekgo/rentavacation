import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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
    const sixHoursFromNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
    const twelveHoursFromNow = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    // Find booking confirmations with deadlines approaching
    const { data: pendingConfirmations, error: fetchError } = await supabaseClient
      .from("booking_confirmations")
      .select(`
        *,
        booking:bookings(
          *,
          listing:listings(
            *,
            property:properties(*)
          )
        ),
        owner:profiles!booking_confirmations_owner_id_fkey(*)
      `)
      .eq("status", "pending_confirmation")
      .lte("confirmation_deadline", twelveHoursFromNow.toISOString())
      .gt("confirmation_deadline", now.toISOString());

    if (fetchError) {
      throw new Error(`Failed to fetch pending confirmations: ${fetchError.message}`);
    }

    logStep("Found pending confirmations", { count: pendingConfirmations?.length || 0 });

    let emailsSent = 0;
    let urgentReminders = 0;
    let standardReminders = 0;

    for (const confirmation of pendingConfirmations || []) {
      const deadline = new Date(confirmation.confirmation_deadline);
      const hoursRemaining = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      // Determine reminder type
      const isUrgent = hoursRemaining <= 6;
      const reminderType = isUrgent ? "deadline_urgent" : "confirmation_reminder";

      // Check if we already sent this type of reminder
      const reminderKey = isUrgent ? "urgent_reminder_sent" : "standard_reminder_sent";
      if (confirmation[reminderKey]) {
        logStep("Skipping - reminder already sent", { 
          confirmationId: confirmation.id, 
          reminderType 
        });
        continue;
      }

      const ownerEmail = confirmation.owner?.email;
      const ownerName = confirmation.owner?.full_name || "Owner";
      const resortName = confirmation.booking?.listing?.property?.resort_name || "Your Property";

      if (!ownerEmail) {
        logStep("Skipping - no owner email", { confirmationId: confirmation.id });
        continue;
      }

      // Send reminder email
      const subject = isUrgent 
        ? `🚨 URGENT: Only ${hoursRemaining}h left to confirm - ${resortName}`
        : `⏰ Reminder: ${hoursRemaining}h left to submit confirmation - ${resortName}`;

      const urgentBanner = isUrgent ? `
        <div style="background: #dc3545; color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 18px;">
          ⚠️ URGENT: Deadline in ${hoursRemaining} hours!
        </div>
      ` : '';

      await resend.emails.send({
        from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
        to: [ownerEmail],
        subject,
        html: `
          <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            ${urgentBanner}
            <div style="background: linear-gradient(135deg, ${isUrgent ? '#dc3545' : '#ffc107'} 0%, #1a3a4a 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">
                ${isUrgent ? '🚨 Final Warning!' : '⏰ Deadline Approaching'}
              </h1>
            </div>
            <div style="background: #f9f7f4; padding: 30px;">
              <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
                Hi ${ownerName},
              </p>
              <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
                ${isUrgent 
                  ? `<strong>This is your final reminder.</strong> You have only <strong>${hoursRemaining} hours</strong> remaining to submit your resort confirmation number for <strong>${resortName}</strong>.`
                  : `You have <strong>${hoursRemaining} hours</strong> remaining to submit your resort confirmation number for <strong>${resortName}</strong>.`
                }
              </p>
              <div style="background: ${isUrgent ? '#f8d7da' : '#fff3cd'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${isUrgent ? '#dc3545' : '#ffc107'};">
                <p style="margin: 0; font-weight: bold; color: ${isUrgent ? '#721c24' : '#856404'};">
                  ${isUrgent ? '⚠️ Critical Warning' : '⏰ Action Required'}
                </p>
                <p style="margin: 8px 0 0 0; color: ${isUrgent ? '#721c24' : '#856404'};">
                  ${isUrgent 
                    ? 'Failure to submit the confirmation number will result in automatic booking cancellation and full refund to the traveler.'
                    : 'Please submit your confirmation number before the deadline to avoid cancellation.'
                  }
                </p>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Payout Amount:</strong> $${confirmation.escrow_amount?.toLocaleString() || '0'}</p>
                <p style="margin: 8px 0 0 0;"><strong>Deadline:</strong> ${deadline.toLocaleString()}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://rentavacation.lovable.app/owner-dashboard?tab=confirmations" 
                   style="background: ${isUrgent ? '#dc3545' : '#e86a4a'}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  Submit Confirmation Now
                </a>
              </div>
            </div>
          </div>
        `,
      });

      // Mark reminder as sent
      await supabaseClient
        .from("booking_confirmations")
        .update({ 
          [isUrgent ? "urgent_reminder_sent" : "standard_reminder_sent"]: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", confirmation.id);

      emailsSent++;
      if (isUrgent) {
        urgentReminders++;
      } else {
        standardReminders++;
      }

      logStep("Reminder sent", { 
        confirmationId: confirmation.id, 
        ownerEmail, 
        hoursRemaining,
        reminderType
      });
    }

    // Also process check-in reminders for travelers
    const checkInStart = new Date(now.getTime() - 2 * 60 * 60 * 1000); // 2 hours ago
    const checkInEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

    const { data: pendingCheckins, error: checkinError } = await supabaseClient
      .from("checkin_confirmations")
      .select(`
        *,
        booking:bookings(
          *,
          listing:listings(
            *,
            property:properties(*)
          )
        ),
        traveler:profiles!checkin_confirmations_traveler_id_fkey(*)
      `)
      .eq("status", "pending")
      .is("reminder_sent", false);

    if (!checkinError && pendingCheckins) {
      for (const checkin of pendingCheckins) {
        const checkInDate = new Date(checkin.booking?.listing?.check_in_date);
        
        // Only send reminder if check-in is within the window
        if (checkInDate >= checkInStart && checkInDate <= checkInEnd) {
          const travelerEmail = checkin.traveler?.email;
          const travelerName = checkin.traveler?.full_name || "Traveler";
          const resortName = checkin.booking?.listing?.property?.resort_name || "Your Resort";

          if (travelerEmail) {
            await resend.emails.send({
              from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
              to: [travelerEmail],
              subject: `✈️ Time to confirm your check-in at ${resortName}!`,
              html: `
                <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #0d6b5c 0%, #1a3a4a 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ${resortName}! 🏖️</h1>
                  </div>
                  <div style="background: #f9f7f4; padding: 30px; border-radius: 0 0 12px 12px;">
                    <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
                      Hi ${travelerName},
                    </p>
                    <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
                      We hope you're enjoying your stay! Please confirm your check-in within 24 hours of arrival.
                    </p>
                    <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                      <p style="margin: 0; font-weight: bold; color: #155724;">✓ Please confirm by:</p>
                      <p style="margin: 8px 0 0 0; color: #155724;">${new Date(checkin.confirmation_deadline).toLocaleString()}</p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="https://rentavacation.lovable.app/checkin" 
                         style="background: #e86a4a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                        Confirm Check-in
                      </a>
                    </div>
                  </div>
                </div>
              `,
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

    logStep("Processing complete", { 
      totalEmailsSent: emailsSent,
      urgentReminders,
      standardReminders
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent,
        urgentReminders,
        standardReminders
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
