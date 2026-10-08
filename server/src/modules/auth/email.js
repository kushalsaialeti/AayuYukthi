import { Resend } from 'resend';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';

let resendClient = null;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY || env.RESEND_API_KEY;
  if (!resendClient && apiKey) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export async function sendOtpEmail({ email, code, purpose }) {
  if (!email || !email.includes('@')) {
    logger.warn({ email, purpose }, '[EMAIL] Invalid email provided for OTP dispatch');
    return { ok: false, reason: 'INVALID_EMAIL' };
  }

  if (env.isTest || email.endsWith('@example.com')) {
    logger.debug({ email, purpose }, '[EMAIL] Test run: skipping real Resend dispatch for example.com');
    return { ok: true, id: 'test-email-dispatched' };
  }

  const client = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL || env.RESEND_FROM_EMAIL || 'AayuYukthi Care <onboarding@resend.dev>';
  const subjectMap = {
    signup: 'Your AayuYukthi Care Verification Code',
    login: 'Your AayuYukthi Care Login Passcode',
    recovery: 'Reset Your AayuYukthi Care Password',
  };
  const subject = subjectMap[purpose] || 'Your AayuYukthi Verification Code';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8faf9; margin: 0; padding: 32px 16px; color: #191c1c; }
        .wrapper { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 4px 24px rgba(0, 67, 73, 0.06); border: 1px solid #e1e3e2; }
        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; border-bottom: 1px solid #eceeed; padding-bottom: 16px; }
        .brand { font-size: 22px; font-weight: 700; color: #004349; letter-spacing: -0.02em; }
        .badge { background: #e6e9e8; color: #004349; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.04em; }
        h1 { font-size: 22px; font-weight: 700; color: #004349; margin: 0 0 12px 0; line-height: 1.3; }
        p { font-size: 15px; line-height: 1.6; color: #3f484a; margin: 0 0 18px 0; }
        .code-box { background: #f2f4f3; border: 2px dashed #0d5c63; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0; }
        .code-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #0d5c63; margin-bottom: 10px; }
        .code-display { font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #004349; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
        .security-notice { font-size: 13px; line-height: 1.5; color: #6d230f; background: #ffdbd2/30; border-left: 4px solid #8c3923; padding: 12px 14px; border-radius: 0 8px 8px 0; margin-top: 24px; }
        .footer { font-size: 12px; line-height: 1.6; color: #6f797a; text-align: center; margin-top: 32px; border-top: 1px solid #e1e3e2; padding-top: 20px; }
        .helpline { color: #004349; font-weight: 600; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <span class="brand">AayuYukthi</span>
          <span class="badge">Care Portal</span>
        </div>
        <h1>Your One-Time Passcode</h1>
        <p>You requested a secure verification code to access your family's AayuYukthi care portal.</p>
        <div class="code-box">
          <div class="code-label">6-Digit Verification Code</div>
          <div class="code-display">${code}</div>
        </div>
        <p>Enter this 6-digit code on the verification screen to proceed. This code expires in <strong>10 minutes</strong>.</p>
        <div class="security-notice">
          <strong>Security Tip:</strong> AayuYukthi care coordinators will never ask for your verification code by phone, chat, hospital gates, or email. Do not disclose this code to anyone.
        </div>
        <div class="footer">
          Need urgent hospital transit assistance? Call 24/7 Care Helpline: <a href="tel:180022982273" class="helpline">1800-AAYU-CARE</a>.<br>
          &copy; ${new Date().getFullYear()} AayuYukthi Care Coordination • End-to-End Encrypted Session
        </div>
      </div>
    </body>
    </html>
  `;

  if (!client) {
    logger.warn({ email, purpose }, '[RESEND] RESEND_API_KEY is not configured in .env. Real email dispatch skipped.');
    return { ok: false, reason: 'MISSING_API_KEY' };
  }

  try {
    const res = await client.emails.send({
      from,
      to: email,
      subject,
      html,
    });
    if (res.error) {
      logger.error({ error: res.error, email, purpose }, '[RESEND] Resend API error');
      if (res.error.statusCode === 403 || res.error.message?.includes('testing emails')) {
        console.warn(
          `\n======================================================\n` +
          `[RESEND RESTRICTION - DOMAIN VERIFICATION REQUIRED]\n` +
          `Resend's default test sender (onboarding@resend.dev) ONLY allows sending\n` +
          `to the account owner (kushalsaialeti98@gmail.com).\n\n` +
          `TO SEND TO ANY EMAIL GLOBALLY:\n` +
          `1. Go to https://resend.com/domains\n` +
          `2. Add and verify your custom domain (e.g. aayuyukthi.com)\n` +
          `3. In server/.env set: RESEND_FROM_EMAIL=AayuYukthi <noreply@yourdomain.com>\n\n` +
          `DEV TEST OTP FOR [${email}]: >>> ${code} <<<\n` +
          `======================================================\n`
        );
      }
      return { ok: false, error: res.error };
    }
    logger.info({ id: res.data?.id, email, purpose }, '[RESEND] OTP email dispatched successfully');
    return { ok: true, id: res.data?.id };
  } catch (err) {
    logger.error({ err: err.message, email, purpose }, '[RESEND] Unexpected error dispatching OTP email');
    return { ok: false, error: err.message };
  }
}
