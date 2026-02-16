import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ApprovalEmailRequest {
  user_id: string;
  action: "approved" | "rejected";
  rejection_reason?: string;
  email_type?: "user_approval" | "role_upgrade";
  requested_role?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, action, rejection_reason, email_type, requested_role }: ApprovalEmailRequest =
      await req.json();

    if (!user_id || !action) {
      throw new Error("Missing required fields: user_id and action");
    }

    // Fetch user profile
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user_id)
      .single();

    if (profileError || !profile) {
      throw new Error("User not found");
    }

    const name = profile.full_name || "there";
    const isRoleUpgrade = email_type === "role_upgrade";

    const roleLabel = requested_role === "property_owner" ? "Property Owner" : requested_role || "new role";

    let subject: string;
    let html: string;

    if (isRoleUpgrade && action === "approved") {
      subject = `Your ${roleLabel} role has been approved!`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background: #f9fafb; border-radius: 0 0 8px 8px; }
            .button {
              display: inline-block;
              background: #3b82f6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Role Upgrade Approved!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>

              <p><strong>Great news!</strong> Your request to become a <strong>${roleLabel}</strong> has been approved.</p>

              <p>You now have access to the Owner Dashboard where you can:</p>
              <ul>
                <li>Register your vacation club properties</li>
                <li>Create and manage listings</li>
                <li>Receive bookings and earn income</li>
                <li>Track your earnings and payouts</li>
              </ul>

              <div style="text-align: center;">
                <a href="https://rent-a-vacation.com/owner-dashboard" class="button">Go to Owner Dashboard</a>
              </div>

              <p>If you have any questions, just reply to this email.</p>

              <p>Happy listing!<br>
              The Rent-A-Vacation Team</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (isRoleUpgrade && action === "rejected") {
      subject = `Update on your ${roleLabel} role request`;
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background: #f9fafb; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Role Request Update</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>

              <p>Thank you for your interest in becoming a ${roleLabel} on Rent-A-Vacation.</p>

              <p>Unfortunately, we're unable to approve your role upgrade request at this time.</p>

              ${rejection_reason ? `<p><strong>Reason:</strong> ${rejection_reason}</p>` : ""}

              <p>You can submit a new request at any time. If you have questions, please reply to this email.</p>

              <p>Best regards,<br>
              The Rent-A-Vacation Team</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (action === "approved") {
      subject = "Your Rent-A-Vacation account has been approved!";
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background: #f9fafb; border-radius: 0 0 8px 8px; }
            .button {
              display: inline-block;
              background: #3b82f6;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .features { list-style: none; padding: 0; }
            .features li { padding: 8px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Rent-A-Vacation!</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>

              <p><strong>Great news!</strong> Your account has been approved and you now have full access to Rent-A-Vacation.</p>

              <h3>You can now:</h3>
              <ul class="features">
                <li>Browse and book vacation rentals</li>
                <li>Use voice search to find properties</li>
                <li>Create bids and travel requests</li>
                <li>List your own timeshare properties</li>
              </ul>

              <div style="text-align: center;">
                <a href="https://rent-a-vacation.com/rentals" class="button">Start Browsing Rentals</a>
              </div>

              <p>If you have any questions, just reply to this email.</p>

              <p>Happy travels!<br>
              The Rent-A-Vacation Team</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = "Update on your Rent-A-Vacation account";
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background: #f9fafb; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account Update</h1>
            </div>
            <div class="content">
              <p>Hi ${name},</p>

              <p>Thank you for your interest in Rent-A-Vacation.</p>

              <p>Unfortunately, we're unable to approve your account at this time.</p>

              ${rejection_reason ? `<p><strong>Reason:</strong> ${rejection_reason}</p>` : ""}

              <p>If you believe this is an error or have questions, please reply to this email and we'll be happy to help.</p>

              <p>Best regards,<br>
              The Rent-A-Vacation Team</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    console.log(
      `[APPROVAL-EMAIL] Sending ${action} email to: ${profile.email}`
    );

    const emailResponse = await resend.emails.send({
      from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
      to: [profile.email],
      subject,
      html,
    });

    console.log("[APPROVAL-EMAIL] Email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, email_sent: true, action }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("[APPROVAL-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
