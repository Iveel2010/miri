import { logger } from "@/lib/logger";

// ============================================================================
// Email service. This is an integration seam: swap the body of `send` for a
// real provider (nodemailer, SES, Resend, Postmark). For now it logs; in
// production it should actually enqueue/deliver.
// ============================================================================

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const emailService = {
  async send(msg: EmailMessage): Promise<void> {
    const configured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
    if (!configured) {
      logger.warn(`[email:stub] -> ${msg.to} | ${msg.subject}`);
      return;
    }
    // TODO: integrate a real SMTP/transactional provider here.
    logger.info(`[email] sending to ${msg.to}: ${msg.subject}`);
  },

  sendVerification(to: string, token: string) {
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/verify-email?token=${token}`;
    return this.send({
      to,
      subject: "Verify your email",
      html: `<p>Welcome! Confirm your address by clicking <a href="${url}">here</a>.</p>`,
      text: `Verify your email: ${url}`,
    });
  },

  sendPasswordReset(to: string, token: string) {
    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/reset-password?token=${token}`;
    return this.send({
      to,
      subject: "Reset your password",
      html: `<p>Reset your password by clicking <a href="${url}">here</a>. This link expires in 1 hour.</p>`,
      text: `Reset your password: ${url}`,
    });
  },
};
