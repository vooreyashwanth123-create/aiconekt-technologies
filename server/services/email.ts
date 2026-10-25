import nodemailer from 'nodemailer';
import { run } from '../db/index.js';

const NOTIFICATION_RECIPIENT = process.env.NOTIFICATION_RECIPIENT || 'aiconekttechnologies@gmail.com';

export interface EmailNotificationResult {
  sent: boolean;
  status: 'sent' | 'failed' | 'pending_smtp_configuration';
  message: string;
}

export async function sendInquiryNotification(inquiry: {
  id: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}): Promise<EmailNotificationResult> {
  const logId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  // If SMTP is not yet configured by the administrator in .env
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('[Email Service] SMTP credentials not configured. Inquiry saved to database; notification recorded as pending_smtp_configuration.');

    run(
      `INSERT INTO notification_logs (id, recipient, subject, channel, status, provider_response, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        NOTIFICATION_RECIPIENT,
        `New Inquiry: ${inquiry.subject}`,
        'email',
        'pending_smtp_configuration',
        'SMTP credentials not set in environment. Stored in database for admin inbox review.',
        now,
      ]
    );

    return {
      sent: false,
      status: 'pending_smtp_configuration',
      message: 'Inquiry securely saved in database. Email notification queued pending SMTP configuration.',
    };
  }

  // If SMTP credentials ARE provided, transmit real email via nodemailer
  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: `"AICONEKT Platform" <${smtpUser}>`,
      to: NOTIFICATION_RECIPIENT,
      replyTo: inquiry.email,
      subject: `[AICONEKT Portal] ${inquiry.category}: ${inquiry.subject}`,
      text: `New contact inquiry received on AICONEKT TECHNOLOGIES portal:

From: ${inquiry.name} (${inquiry.email})
Category: ${inquiry.category}
Subject: ${inquiry.subject}
Received At: ${now}

Message Content:
${inquiry.message}

--
AICONEKT TECHNOLOGIES Platform Notification System`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #030712; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #1e293b;">
          <h2 style="color: #00f2fe; margin-top: 0;">AICONEKT TECHNOLOGIES</h2>
          <p style="color: #94a3b8; font-size: 13px;">New Contact & Collaboration Inquiry</p>
          <hr style="border: 0; border-top: 1px solid #1e293b; margin: 16px 0;" />
          <p><strong>From:</strong> ${inquiry.name} (<a href="mailto:${inquiry.email}" style="color: #38bdf8;">${inquiry.email}</a>)</p>
          <p><strong>Category:</strong> <span style="background: #0f172a; padding: 4px 8px; border-radius: 4px; border: 1px solid #334155; font-size: 12px;">${inquiry.category}</span></p>
          <p><strong>Subject:</strong> ${inquiry.subject}</p>
          <div style="background: #0f172a; padding: 16px; border-radius: 8px; border: 1px solid #1e293b; margin: 16px 0; white-space: pre-wrap;">
            ${inquiry.message}
          </div>
          <p style="font-size: 11px; color: #64748b;">Received at ${now} UTC. Logged into Organization Portal Inbox.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    run(
      `INSERT INTO notification_logs (id, recipient, subject, channel, status, provider_response, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        NOTIFICATION_RECIPIENT,
        inquiry.subject,
        'email',
        'sent',
        JSON.stringify({ messageId: info.messageId, response: info.response }),
        now,
      ]
    );

    return {
      sent: true,
      status: 'sent',
      message: 'Email notification delivered successfully to organisation inbox.',
    };
  } catch (err: any) {
    console.error('[Email Service] Error transmitting email:', err);

    run(
      `INSERT INTO notification_logs (id, recipient, subject, channel, status, provider_response, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        NOTIFICATION_RECIPIENT,
        inquiry.subject,
        'email',
        'failed',
        err.message || String(err),
        now,
      ]
    );

    return {
      sent: false,
      status: 'failed',
      message: `Failed to deliver email: ${err.message}`,
    };
  }
}
