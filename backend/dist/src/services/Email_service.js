"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
/**
 * EmailService (Stub)
 *
 * This service handles sending outgoing communication.
 * In a production environment, this would integrate with SendGrid, Postmark, or Resend.
 */
class EmailService {
    /**
     * Simulates sending a welcome email to a new user.
     */
    static async sendWelcomeEmail(to, name) {
        console.log(`[EMAIL] 📧 Sending welcome email to: ${to}`);
        console.log(`[EMAIL] 📝 Subject: Welcome to SaaS Pulse, ${name}!`);
        console.log(`[EMAIL] 🔗 Body: Your dashboard is ready at https://saaspulse.com/dashboard`);
        // Simulate async network delay
        return new Promise((resolve) => setTimeout(resolve, 500));
    }
    /**
     * Simulates sending a activity alert for significant business events.
     */
    static async sendActivityAlert(to, event, metadata) {
        console.log(`[EMAIL] 📧 Sending Activity Alert to: ${to}`);
        console.log(`[EMAIL] 🚨 Significant Pulse: ${event}`);
        console.log(`[EMAIL] 📄 Details: ${JSON.stringify(metadata)}`);
        return new Promise((resolve) => setTimeout(resolve, 300));
    }
    /**
     * Simulates sending an admin alert for significant business events.
     */
    static async sendAdminAlert(subject, message) {
        console.log(`[EMAIL] 🚨 ADMIN ALERT: ${subject}`);
        console.log(`[EMAIL] 📄 Message: ${message}`);
        return new Promise((resolve) => setTimeout(resolve, 300));
    }
}
exports.EmailService = EmailService;
