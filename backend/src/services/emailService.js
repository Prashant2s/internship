import nodemailer from 'nodemailer';
import { config } from '../../config.js';

function buildTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = config;
  if (SMTP_HOST && SMTP_PORT) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: false,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
  }
  // Fallback: log emails to console in dev if SMTP is not configured
  return {
    sendMail: async (opts) => {
      // eslint-disable-next-line no-console
      console.log('[Email mock] To:', opts.to, 'Subject:', opts.subject, 'Text:', opts.text, 'HTML:', opts.html);
      return { mocked: true };
    },
  };
}

const transporter = buildTransporter();

function appUrl() {
  const base = config.CORS_ORIGIN || 'http://localhost:3000';
  return base.replace(/\/$/, '');
}

export async function sendVerificationEmail(to, token) {
  const url = `${appUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  const from = process.env.EMAIL_FROM || 'no-reply@example.com';
  const subject = 'Verify your email';
  const text = `Welcome! Click the link to verify your email: ${url}`;
  const html = `<p>Welcome!</p><p>Click the link to verify your email:</p><p><a href="${url}">${url}</a></p>`;
  await transporter.sendMail({ from, to, subject, text, html });
}

export async function sendPasswordResetEmail(to, token) {
  const url = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const from = process.env.EMAIL_FROM || 'no-reply@example.com';
  const subject = 'Reset your password';
  const text = `Use this link to reset your password: ${url}`;
  const html = `<p>Use this link to reset your password:</p><p><a href="${url}">${url}</a></p>`;
  await transporter.sendMail({ from, to, subject, text, html });
}