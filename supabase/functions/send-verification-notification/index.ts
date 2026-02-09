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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const caller = userData.user;
    if (!caller) throw new Error("Caller not authenticated");

    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .in("role", ["rav_owner", "rav_admin", "rav_staff"]);

    if (!roles || roles.length === 0) {
      throw new Error("Unauthorized: Admin or staff role required");
    }

    const { ownerEmail, ownerName, status, trustLevel, rejectionReason }: VerificationNotificationRequest = await req.json();
    logStep("Request parsed", { ownerEmail, status });

    if (!ownerEmail || !status) throw new Error("Missing required fields: ownerEmail and status are required");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(ownerEmail)) throw new Error("Invalid email address format");

    let subject: string;
    let html: string;

    if (status === "approved") {
      const trustLevelLabel = TRUST_LEVEL_LABELS[trustLevel || "verified"] || "Verified Owner";
      subject = "Your Rent-A-Vacation Verification is Approved!";
      html = buildEmailHtml({
        recipientName: ownerName || undefined,
        heading: "Verification Approved!",
        body: `
          <p>Great news! Your owner verification has been <strong>approved</strong>.</p>
          <div style="background: #f7fafc; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
            <p style="margin: 0;"><strong>Your Trust Level:</strong> ${trustLevelLabel}</p>
          </div>
          <p>You can now:</p>
          <ul style="line-height: 1.8; padding-left: 20px;">
            <li>List your timeshare properties for rent</li>
            <li>Receive bookings from verified travelers</li>
            <li>Access owner-exclusive features</li>
          </ul>
        `,
        cta: { label: "Go to Owner Dashboard", url: "https://rentavacation.lovable.app/owner-dashboard" },
        footerNote: "Thank you for joining Rent-A-Vacation as a property owner!",
      });
    } else {
      subject = "Rent-A-Vacation Verification Update";
      html = buildEmailHtml({
        recipientName: ownerName || undefined,
        heading: "Verification Update",
        body: `
          <p>We've reviewed your verification documents and unfortunately, we were unable to approve your verification at this time.</p>
          ${rejectionReason ? infoBox(`<strong>Reason:</strong> ${rejectionReason}`, "warning") : ""}
          <p><strong>What you can do:</strong></p>
          <ul style="line-height: 1.8; padding-left: 20px;">
            <li>Review the feedback above</li>
            <li>Submit updated or additional documents</li>
            <li>Contact our support team if you have questions</li>
          </ul>
        `,
        cta: { label: "Update Verification", url: "https://rentavacation.lovable.app/owner-dashboard?tab=verification" },
      });
    }

    const emailResponse = await resend.emails.send({
      from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
      to: [ownerEmail],
      subject,
      html,
    });

    logStep("Email sent successfully", { emailId: emailResponse.data?.id });

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
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
