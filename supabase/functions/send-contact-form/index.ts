import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { buildEmailHtml, detailRow } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message, user_id }: ContactFormRequest = await req.json();

    if (!name || !email || !subject || !message) {
      throw new Error("Missing required fields: name, email, subject, message");
    }

    const subjectLabel = SUBJECT_LABELS[subject] || subject;

    // Send notification email to support team
    const supportEmailHtml = buildEmailHtml({
      heading: `New Contact Form: ${subjectLabel}`,
      body: `
        <p>A visitor has submitted a contact form on the website.</p>
        ${detailRow("Name", name)}
        ${detailRow("Email", `<a href="mailto:${email}">${email}</a>`)}
        ${detailRow("Subject", subjectLabel)}
        ${user_id ? detailRow("User ID", user_id) : detailRow("User", "Not logged in")}
        <div style="margin-top: 20px; padding: 16px; background: #f7fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 8px 0; font-weight: 600;">Message:</p>
          <p style="margin: 0; white-space: pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        </div>
      `,
    });

    const supportEmail = await resend.emails.send({
      from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
      to: ["support@rentavacation.com"],
      replyTo: email,
      subject: `[Contact Form] ${subjectLabel} — from ${name}`,
      html: supportEmailHtml,
    });

    console.log("[CONTACT-FORM] Support email sent:", supportEmail);

    // Send confirmation email to the submitter
    const confirmationHtml = buildEmailHtml({
      recipientName: name.split(" ")[0],
      heading: "We Received Your Message",
      body: `
        <p>Thank you for contacting Rent-A-Vacation. We've received your message and will get back to you within 24 hours.</p>
        <p><strong>Your message summary:</strong></p>
        ${detailRow("Subject", subjectLabel)}
        <div style="margin-top: 12px; padding: 16px; background: #f7fafc; border-radius: 6px; border: 1px solid #e2e8f0;">
          <p style="margin: 0; white-space: pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
        </div>
      `,
      cta: { label: "Browse Rentals", url: "https://rent-a-vacation.com/rentals" },
    });

    const confirmationEmail = await resend.emails.send({
      from: "Rent-A-Vacation <rav@mail.ai-focus.org>",
      to: [email],
      subject: "We received your message — Rent-A-Vacation",
      html: confirmationHtml,
    });

    console.log("[CONTACT-FORM] Confirmation email sent:", confirmationEmail);

    return new Response(
      JSON.stringify({ success: true, email_sent: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    console.error("[CONTACT-FORM] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
