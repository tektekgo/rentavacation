import { supabase, isSupabaseConfigured } from './supabase';

export type EmailType = 'welcome' | 'password-reset' | 'verification' | 'notification' | 'contact';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  type?: EmailType;
}

interface EmailResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Send an email using the Resend API via edge function
 */
export const sendEmail = async (params: SendEmailParams): Promise<EmailResponse> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot send email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: params,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    return data as EmailResponse;
  } catch (err: any) {
    console.error('Email send error:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Send a welcome email to a new user
 */
export const sendWelcomeEmail = async (to: string, userName: string): Promise<EmailResponse> => {
  return sendEmail({
    to,
    subject: 'Welcome to Rent-A-Vacation! 🌴',
    type: 'welcome',
    html: `
      <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0d6b5c 0%, #1a3a4a 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Rent-A-Vacation!</h1>
        </div>
        <div style="background: #f9f7f4; padding: 30px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
            Hi ${userName || 'there'},
          </p>
          <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
            Welcome to Rent-A-Vacation! We're excited to have you join our community of travelers and timeshare owners.
          </p>
          <p style="font-size: 16px; color: #2d3e4f; line-height: 1.6;">
            With Rent-A-Vacation, you can:
          </p>
          <ul style="font-size: 16px; color: #2d3e4f; line-height: 1.8;">
            <li>Save up to 70% on luxury resort stays</li>
            <li>Access exclusive members-only vacation clubs</li>
            <li>List your timeshare and earn extra income</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://rentavacation.com/rentals" 
               style="background: #e86a4a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              Start Exploring
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7c8a; text-align: center;">
            Questions? Reply to this email or contact us at support@rentavacation.com
          </p>
        </div>
      </div>
    `,
  });
};

/**
 * Send a contact form submission notification
 */
export const sendContactFormEmail = async (
  name: string,
  email: string,
  message: string
): Promise<EmailResponse> => {
  return sendEmail({
    to: 'support@rentavacation.com', // Internal notification
    subject: `New Contact Form Submission from ${name}`,
    type: 'contact',
    html: `
      <div style="font-family: 'Roboto', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0d6b5c;">New Contact Form Submission</h2>
        <div style="background: #f9f7f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p style="background: white; padding: 15px; border-radius: 4px; border-left: 4px solid #0d6b5c;">
            ${message.replace(/\n/g, '<br>')}
          </p>
        </div>
        <p style="font-size: 14px; color: #6b7c8a;">
          Submitted at: ${new Date().toLocaleString()}
        </p>
      </div>
    `,
  });
};
