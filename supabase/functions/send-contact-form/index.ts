import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
  user_id?: string | null;
}

const SUBJECT_LABELS: Record<string, string> = {
  general: "General Inquiry",
  booking: "Booking Help",
  account: "Account Issue",
  listing: "Listing Support",
  payment: "Payment Question",
  feedback: "Feedback",
  other: "Other",
};

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildEmailHtml(heading: string, body: string, recipientName?: string): string {
  const greeting = recipientName
    ? `<p style="font-size: 15px; color: #2d3748; line-height: 1.6; margin: 0 0 20px 0;"><strong>Hi ${recipientName},</strong></p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #f7fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f7fafc;">
    <tr><td align="center" style="padding: 40px 20px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
        <tr><td style="background: linear-gradient(135deg, #0d6b5c 0%, #1a4a3a 100%); padding: 28px 40px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">${heading}</h1>
        </td></tr>
        <tr><td style="background: #ffffff; padding: 36px 40px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">
          ${greeting}
          <div style="font-size: 15px; color: #2d3748; line-height: 1.7;">${body}</div>
          <p style="font-size: 15px; color: #2d3748; line-height: 1.6; margin: 24px 0 0 0;">
            If you have any questions, feel free to reach out at
            <a href="mailto:support@rentavacation.com" style="color: #0d6b5c; text-decoration: none;">support@rentavacation.com</a>.
          </p>
          <p style="font-size: 15px; color: #2d3748; margin: 24px 0 4px 0;">Best,</p>
          <p style="font-size: 15px; color: #2d3748; margin: 0;"><strong>&mdash;The Rent-A-Vacation Team</strong></p>
        </td></tr>
        <tr><td style="background: #ffffff; padding: 24px 40px 32px; border-top: 1px solid #e2e8f0; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="font-size: 12px; color: #718096; margin: 0 0 8px 0;">Name Your Price. Book Your Paradise.</p>
          <p style="font-size: 12px; color: #718096; margin: 0;">
            <a href="https://rent-a-vacation.com" style="color: #718096; text-decoration: underline;">rentavacation.com</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message, user_id }: ContactFormRequest = await req.json();

    if (!name || !email || !subject || !message) {
      throw new Error("Missing required fields: name, email, subject, message");
    }

    const subjectLabel = SUBJECT_LABELS[subject] || subject;
    const safeMessage = escapeHtml(message);

    // Lazy-import Resend to avoid top-level npm import crash
    const { Resend } = await import("npm:resend@2.0.0");
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Send notification email to support team
    const supportHtml = buildEmailHtml(
      `New Contact Form: ${subjectLabel}`,
      `<p>A visitor has submitted a contact form on the website.</p>
       <p style="margin: 0 0 6px 0;"><strong>Name:</strong> ${escapeHtml(name)}</p>
       <p style="margin: 0 0 6px 0;"><strong>Email:</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
       <p style="margin: 0 0 6px 0;"><strong>Subject:</strong> ${subjectLabel}</p>
       <p style="margin: 0 0 6px 0;"><strong>User:</strong> ${user_id || "Not logged in"}</p>
       <div style="margin-top: 20px; padding: 16px; background: #f7fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
         <p style="margin: 0 0 8px 0; font-weight: 600;">Message:</p>
         <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
       </div>`
    );

    const supportEmail = await resend.emails.send({
      from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
      to: ["support@rentavacation.com"],
      replyTo: email,
      subject: `[Contact Form] ${subjectLabel} — from ${name}`,
      html: supportHtml,
    });

    console.log("[CONTACT-FORM] Support email sent:", supportEmail);

    // Send confirmation email to the submitter
    const confirmHtml = buildEmailHtml(
      "We Received Your Message",
      `<p>Thank you for contacting Rent-A-Vacation. We've received your message and will get back to you within 24 hours.</p>
       <p><strong>Your message summary:</strong></p>
       <p style="margin: 0 0 6px 0;"><strong>Subject:</strong> ${subjectLabel}</p>
       <div style="margin-top: 12px; padding: 16px; background: #f7fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
         <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
       </div>`,
      name.split(" ")[0]
    );

    const confirmEmail = await resend.emails.send({
      from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
      to: [email],
      subject: "We received your message — Rent-A-Vacation",
      html: confirmHtml,
    });

    console.log("[CONTACT-FORM] Confirmation email sent:", confirmEmail);

    return new Response(
      JSON.stringify({ success: true, email_sent: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("[CONTACT-FORM] Error:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: errMsg }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
