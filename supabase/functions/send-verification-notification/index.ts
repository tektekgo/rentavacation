import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerificationNotificationRequest {
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  status: "approved" | "rejected";
  trustLevel?: string;
  rejectionReason?: string;
}

const TRUST_LEVEL_LABELS: Record<string, string> = {
  new: "New Owner",
  verified: "Verified Owner",
  trusted: "Trusted Owner",
  premium: "Premium Owner",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-VERIFICATION-NOTIFICATION] ${step}${detailsStr}`);
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

    // Verify the caller is an admin/staff
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const caller = userData.user;
    if (!caller) throw new Error("Caller not authenticated");

    // Check if caller has admin/staff role
    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .in("role", ["rav_owner", "rav_admin", "rav_staff"]);

    if (!roles || roles.length === 0) {
      throw new Error("Unauthorized: Admin or staff role required");
    }

    const { 
      ownerId, 
      ownerEmail, 
      ownerName, 
      status, 
      trustLevel, 
      rejectionReason 
    }: VerificationNotificationRequest = await req.json();

    logStep("Request parsed", { ownerId, ownerEmail, status });

    if (!ownerEmail || !status) {
      throw new Error("Missing required fields: ownerEmail and status are required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail)) {
      throw new Error("Invalid email address format");
    }

    let subject: string;
    let htmlContent: string;

    if (status === "approved") {
      const trustLevelLabel = TRUST_LEVEL_LABELS[trustLevel || "verified"] || "Verified Owner";
      subject = "🎉 Your Rent-A-Vacation Verification is Approved!";
      htmlContent = `
        <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0d6b5c 0%, #1a3a4a 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Verification Approved! 🎉</h1>
          </div>
          <div style="background: #f9f7f4; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
              Hi ${ownerName || "there"},
            </p>
            <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
              Great news! Your owner verification has been <strong style="color: #0d6b5c;">approved</strong>.
            </p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0d6b5c;">
              <p style="margin: 0; font-size: 16px; color: #2d3e4f;">
                <strong>Your Trust Level:</strong> ${trustLevelLabel}
              </p>
            </div>
            <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
              You can now:
            </p>
            <ul style="font-size: 16px; color: #2d3e4f; line-height: 1.8;">
              <li>List your timeshare properties for rent</li>
              <li>Receive bookings from verified travelers</li>
              <li>Access owner-exclusive features</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://rentavacation.lovable.app/owner-dashboard" 
                 style="background: #e86a4a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Go to Owner Dashboard
              </a>
            </div>
            <p style="font-size: 14px; color: #6b7c8a; text-align: center;">
              Thank you for joining Rent-A-Vacation as a property owner!
            </p>
          </div>
        </div>
      `;
    } else {
      subject = "Rent-A-Vacation Verification Update";
      htmlContent = `
        <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #1a3a4a 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Verification Update</h1>
          </div>
          <div style="background: #f9f7f4; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
              Hi ${ownerName || "there"},
            </p>
            <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
              We've reviewed your verification documents and unfortunately, we were unable to approve your verification at this time.
            </p>
            ${rejectionReason ? `
              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <p style="margin: 0 0 8px 0; font-weight: bold; color: #856404;">Reason:</p>
                <p style="margin: 0; font-size: 16px; color: #856404;">
                  ${rejectionReason}
                </p>
              </div>
            ` : ''}
            <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
              <strong>What you can do:</strong>
            </p>
            <ul style="font-size: 16px; color: #2d3e4f; line-height: 1.8;">
              <li>Review the feedback above</li>
              <li>Submit updated or additional documents</li>
              <li>Contact our support team if you have questions</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://rentavacation.lovable.app/owner-dashboard?tab=verification" 
                 style="background: #e86a4a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Update Verification
              </a>
            </div>
            <p style="font-size: 14px; color: #6b7c8a; text-align: center;">
              Questions? Reply to this email or contact support@rentavacation.com
            </p>
          </div>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
      to: [ownerEmail],
      subject: subject,
      html: htmlContent,
    });

    logStep("Email sent successfully", { emailId: emailResponse.data?.id });

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
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
