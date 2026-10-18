import nodemailer from 'nodemailer';
import { ApiError } from '../utils/http.js';
import { env } from '../config/env.js';
export function emailConfigured() {
  return !!(
    process.env.RESEND_API_KEY ||
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_APP_PASSWORD)
  );
}
export async function sendEmail(to, subject, text) {
  const from = process.env.EMAIL_FROM || 'CreatorOS <hello@creatoros.demo>';
  if (!emailConfigured() || !from) {
    if (!env.production) {
      console.log(`\n================ [DEV EMAIL / OTP LOG] ================`);
      console.log(`TO: ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`BODY:\n${text}`);
      console.log(`=======================================================\n`);
      return;
    }
    throw new ApiError(
      503,
      'Email delivery is not configured. Contact the workspace administrator.',
    );
  }
  const html = `<div style="background:#f5f5f0;padding:40px;font-family:Arial,sans-serif;color:#222"><div style="max-width:480px;margin:auto;background:white;border-radius:16px;padding:32px"><h2 style="color:#254d3e">CreatorOS</h2><h1 style="font-size:24px">${subject}</h1><p style="line-height:1.8;white-space:pre-line">${text}</p><hr style="border:0;border-top:1px solid #eee"/><p style="color:#777;font-size:12px">A little structure. More space to create.</p></div></div>`;
  try {
    if (process.env.RESEND_API_KEY) {
      const result = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, text, html }),
        signal: AbortSignal.timeout(15000),
      });
      if (!result.ok) throw new Error('Delivery failed');
    } else {
      await nodemailer
        .createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_PORT === '465',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_APP_PASSWORD },
          connectionTimeout: 15000,
        })
        .sendMail({ from, to, subject, text, html });
    }
  } catch (err) {
    if (!env.production) {
      console.log(`\n================ [DEV EMAIL FALLBACK] ================`);
      console.log(`TO: ${to}`);
      console.log(`SUBJECT: ${subject}`);
      console.log(`BODY:\n${text}`);
      console.log(`======================================================\n`);
      return;
    }
    throw new ApiError(503, 'Unable to send email. Please try again shortly.');
  }
}
export const sendOtpEmail = (email, otp, purpose) =>
  sendEmail(
    email,
    purpose === 'verification' ? 'Verify your email' : 'Reset your password',
    `Your verification code is:\n\n${otp}\n\nThis code expires in 10 minutes. Never share this code.\n\nIf you did not request this, you can safely ignore this email.`,
  );