import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const fromEmail = "ClickUp Clone <noreply@yourdomain.com>";

export async function sendInvitationEmail(params: {
  email: string;
  inviterName: string;
  workspaceName: string;
  inviteLink: string;
}) {
  const { email, inviterName, workspaceName, inviteLink } = params;

  try {
    const resend = getResend();
    if (!resend) return { success: false, error: "Email not configured" };

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: `You've been invited to ${workspaceName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>You're invited!</h2>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong>.</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Accept Invitation
          </a>
          <p style="color: #666; font-size: 14px;">This invitation will expire in 7 days.</p>
        </div>
      `,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to send invitation email:", error);
    return { success: false, error };
  }
}

export async function sendResetPasswordEmail(params: {
  email: string;
  resetLink: string;
}) {
  const { email, resetLink } = params;

  try {
    const resend = getResend();
    if (!resend) return { success: false, error: "Email not configured" };

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2>Reset your password</h2>
          <p>We received a request to reset your password. Click the button below to set a new one.</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to send reset password email:", error);
    return { success: false, error };
  }
}

export async function sendNotificationEmail(params: {
  email: string;
  subject: string;
  message: string;
  actionLink?: string;
  actionText?: string;
}) {
  const { email, subject, message, actionLink, actionText } = params;

  try {
    const resend = getResend();
    if (!resend) return { success: false, error: "Email not configured" };

    const result = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <p>${message}</p>
          ${actionLink && actionText
            ? `<a href="${actionLink}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">${actionText}</a>`
            : ""
          }
        </div>
      `,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to send notification email:", error);
    return { success: false, error };
  }
}
