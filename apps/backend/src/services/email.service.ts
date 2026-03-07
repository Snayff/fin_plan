import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { config } from '../config/env.js';

let transporter: Transporter | null = null;

async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  if (config.NODE_ENV !== 'production' && !config.SMTP_HOST) {
    // Auto-provision Ethereal test account in development
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('[email] Using Ethereal test account:', testAccount.user);
  } else {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth: config.SMTP_USER
        ? { user: config.SMTP_USER, pass: config.SMTP_PASS }
        : undefined,
    });
  }

  return transporter;
}

export async function sendInviteEmail(
  to: string,
  householdName: string,
  token: string,
  inviterName: string
): Promise<void> {
  const transport = await getTransporter();
  const acceptUrl = `${config.APP_URL}/accept-invite?token=${token}`;

  const info = await transport.sendMail({
    from: `"FinPlan" <${config.FROM_EMAIL}>`,
    to,
    subject: `${inviterName} has invited you to join ${householdName} on FinPlan`,
    text: [
      `Hi there,`,
      ``,
      `${inviterName} has invited you to join "${householdName}" on FinPlan — a shared financial planning workspace.`,
      ``,
      `Accept your invitation here:`,
      acceptUrl,
      ``,
      `This link expires in 24 hours and can only be used once.`,
      ``,
      `If you didn't expect this invitation, you can safely ignore this email.`,
    ].join('\n'),
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #333;">
        <h2 style="color: #FF7A18;">You've been invited to FinPlan</h2>
        <p><strong>${inviterName}</strong> has invited you to join <strong>"${householdName}"</strong> — a shared financial planning workspace.</p>
        <p style="margin: 32px 0;">
          <a href="${acceptUrl}"
             style="background: #FF7A18; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Accept Invitation
          </a>
        </p>
        <p style="font-size: 13px; color: #888;">This link expires in 24 hours and can only be used once.<br>If you didn't expect this, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="font-size: 12px; color: #aaa;">Or copy this link: ${acceptUrl}</p>
      </div>
    `,
  });

  if (config.NODE_ENV !== 'production') {
    console.log('[email] Preview URL:', nodemailer.getTestMessageUrl(info));
  }
}
