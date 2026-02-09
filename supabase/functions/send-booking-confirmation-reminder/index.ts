import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

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
      // Send notification to owner about new booking
      const { data: confirmation, error } = await supabaseClient
        .from("booking_confirmations")
        .select(`
          *,
          booking:bookings(
            *,
            listing:listings(
              *,
              property:properties(*)
            ),
            renter:profiles(*)
          ),
          owner:profiles!booking_confirmations_owner_id_fkey(*)
        `)
        .eq("id", bookingConfirmationId)
        .single();

      if (error || !confirmation) {
        throw new Error("Booking confirmation not found");
      }

      const ownerEmail = confirmation.owner?.email;
      const ownerName = confirmation.owner?.full_name || "Owner";
      const resortName = confirmation.booking?.listing?.property?.resort_name;
      const guestName = confirmation.booking?.renter?.full_name || "Guest";
      const checkIn = new Date(confirmation.booking?.listing?.check_in_date).toLocaleDateString();
      const checkOut = new Date(confirmation.booking?.listing?.check_out_date).toLocaleDateString();
      const deadline = new Date(confirmation.confirmation_deadline).toLocaleString();

      if (!ownerEmail) {
        throw new Error("Owner email not found");
      }

      await resend.emails.send({
        from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
        to: [ownerEmail],
        subject: `🎉 New Booking! Action Required - ${resortName}`,
        html: `
          <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #0d6b5c 0%, #1a3a4a 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">New Booking Received! 🎉</h1>
            </div>
            <div style="background: #f9f7f4; padding: 30px; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
                Hi ${ownerName},
              </p>
              <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
                Great news! You have a new booking for <strong>${resortName}</strong>.
              </p>
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0d6b5c;">
                <p style="margin: 0 0 8px 0;"><strong>Guest:</strong> ${guestName}</p>
                <p style="margin: 0 0 8px 0;"><strong>Check-in:</strong> ${checkIn}</p>
                <p style="margin: 0 0 8px 0;"><strong>Check-out:</strong> ${checkOut}</p>
                <p style="margin: 0 0 8px 0;"><strong>Payout Amount:</strong> $${confirmation.escrow_amount.toLocaleString()}</p>
              </div>
              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0; font-weight: bold; color: #856404;">⏰ Action Required</p>
                <p style="margin: 8px 0 0 0; color: #856404;">
                  Submit your resort confirmation number before: <strong>${deadline}</strong>
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://rentavacation.lovable.app/owner-dashboard?tab=confirmations" 
                   style="background: #e86a4a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  Submit Confirmation
                </a>
              </div>
            </div>
          </div>
        `,
      });

      logStep("New booking email sent", { ownerEmail });
    }

    if (type === "confirmation_reminder" && bookingConfirmationId) {
      // Send reminder about upcoming deadline
      const { data: confirmation, error } = await supabaseClient
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
        .eq("id", bookingConfirmationId)
        .single();

      if (error || !confirmation) {
        throw new Error("Booking confirmation not found");
      }

      const ownerEmail = confirmation.owner?.email;
      const ownerName = confirmation.owner?.full_name || "Owner";
      const resortName = confirmation.booking?.listing?.property?.resort_name;
      const deadline = new Date(confirmation.confirmation_deadline);
      const hoursRemaining = Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60));

      if (!ownerEmail) {
        throw new Error("Owner email not found");
      }

      await resend.emails.send({
        from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
        to: [ownerEmail],
        subject: `⏰ Reminder: ${hoursRemaining}h left to submit confirmation - ${resortName}`,
        html: `
          <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc3545 0%, #1a3a4a 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Deadline Approaching!</h1>
            </div>
            <div style="background: #f9f7f4; padding: 30px; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
                Hi ${ownerName},
              </p>
              <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
                You have <strong>${hoursRemaining} hours</strong> remaining to submit your resort confirmation number for <strong>${resortName}</strong>.
              </p>
              <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                <p style="margin: 0; font-weight: bold; color: #721c24;">⚠️ Important</p>
                <p style="margin: 8px 0 0 0; color: #721c24;">
                  Failure to submit the confirmation number may result in booking cancellation and escrow refund to the traveler.
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://rentavacation.lovable.app/owner-dashboard?tab=confirmations" 
                   style="background: #e86a4a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                  Submit Now
                </a>
              </div>
            </div>
          </div>
        `,
      });

      logStep("Reminder email sent", { ownerEmail, hoursRemaining });
    }

    if (type === "checkin_reminder" && checkinConfirmationId) {
      // Send reminder to traveler about check-in confirmation
      const { data: checkin, error } = await supabaseClient
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
        .eq("id", checkinConfirmationId)
        .single();

      if (error || !checkin) {
        throw new Error("Checkin confirmation not found");
      }

      const travelerEmail = checkin.traveler?.email;
      const travelerName = checkin.traveler?.full_name || "Traveler";
      const resortName = checkin.booking?.listing?.property?.resort_name;
      const deadline = new Date(checkin.confirmation_deadline).toLocaleString();

      if (!travelerEmail) {
        throw new Error("Traveler email not found");
      }

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
                We hope you're enjoying your stay! Please confirm your check-in to complete the booking process.
              </p>
              <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                <p style="margin: 0; font-weight: bold; color: #155724;">✓ Please confirm by:</p>
                <p style="margin: 8px 0 0 0; color: #155724;">${deadline}</p>
              </div>
              <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
                If everything is as expected, confirm your arrival. If you encounter any issues, report them so we can help.
              </p>
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

      logStep("Checkin reminder email sent", { travelerEmail });
    }

    return new Response(
      JSON.stringify({ success: true }),
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
