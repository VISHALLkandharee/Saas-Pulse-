import { Resend } from "resend";

/**
 * EmailService
 * 
 * This service handles sending outgoing communication via Resend. 
 */
export class EmailService {
  private static resend = new Resend(process.env.RESEND_API_KEY);

  /**
   * Sends a professional invitation email to waitlisted users.
   */
  static async sendInviteEmail(to: string) {
    console.log(`[RESEND] 📧 Sending Invite Email to: ${to}`);
    
    // In local development without a key, we just log it
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_123456789") {
      console.warn("[RESEND] Missing API Key. Email simulation only.");
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: "SaaS Pulse <onboarding@resend.dev>", // Replace with your verified domain later
        to: [to],
        subject: "🎁 Your Early Access Invitation: SaaS Pulse PRO",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff; color: #1f2937;">
            <h1 style="color: #10b981; font-size: 24px; font-weight: 800; margin-bottom: 20px;">You're Invited!</h1>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Hey Founder,<br><br>
              Great news! We've reviewed your request and we're excited to grant you <strong>Early Access</strong> to SaaS Pulse.
            </p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">As a Waitlist Member, your account will be automatically upgraded to</p>
              <h2 style="margin: 0; color: #111827; font-size: 22px;">PRO Plan for FREE</h2>
            </div>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 28px;">
              Ready to track your startup's heartbeat? Click the button below to register and claim your VIP status.
            </p>
            <a href="${process.env.CLIENT_URL}/register?email=${encodeURIComponent(to)}" 
               style="display: inline-block; background-color: #111827; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 16px;">
               Claim My PRO Access
            </a>
            <hr style="margin-top: 40px; border: none; border-top: 1px solid #e5e7eb;" />
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 20px;">
              &copy; 2026 SaaS Pulse. All rights reserved.
            </p>
          </div>
        `,
      });

      if (error) {
        console.error("[RESEND] API Error:", error);
      } else {
        console.log("[RESEND] Email sent successfully:", data?.id);
      }
    } catch (err) {
      console.error("[RESEND] Unexpected Failure:", err);
    }
  }

  /**
   * Simulates sending a welcome email to a new user.
   */
  static async sendWelcomeEmail(to: string, name: string) {
    console.log(`[EMAIL] 📧 Sending welcome email to: ${to}`);
    // Stub for now, can be upgraded to Resend later
  }

  // ... other stubs stay for internal logging
}
