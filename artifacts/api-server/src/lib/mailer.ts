import { logger } from "./logger";

/**
 * Transactional email over the Resend HTTP API.
 *
 * HTTP rather than SMTP keeps this dependency-free. When no key is configured
 * nothing is sent and `sendMail` reports it, so callers can avoid telling a
 * customer that an email is on its way when it is not.
 */

const API_URL = "https://api.resend.com/emails";

export function isMailConfigured(): boolean {
  return Boolean(process.env["RESEND_API_KEY"] && process.env["EMAIL_FROM"]);
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export async function sendMail(input: MailInput): Promise<boolean> {
  if (!isMailConfigured()) {
    logger.warn({ to: input.to, subject: input.subject }, "Email skipped: mailer not configured");
    return false;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env["RESEND_API_KEY"]}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env["EMAIL_FROM"],
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      logger.error(
        { status: res.status, body: (await res.text()).slice(0, 400) },
        "Email send failed",
      );
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err }, "Email send threw");
    return false;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function orderReceivedEmail(params: {
  trackingCode: string;
  summary?: string;
  amount: number;
  currency: string;
  siteName: string;
  siteUrl: string;
}): { subject: string; html: string; text: string } {
  const { trackingCode, summary, amount, currency, siteName, siteUrl } = params;
  const trackUrl = `${siteUrl.replace(/\/$/, "")}/track`;
  const amountLine = amount > 0 ? `${currency} ${amount}` : "";

  const text = [
    `Your application has been received.`,
    ``,
    `Reference: ${trackingCode}`,
    summary ? `Service: ${summary}` : "",
    amountLine ? `Amount: ${amountLine}` : "",
    ``,
    `Track your application: ${trackUrl}`,
    `You will need this reference and the email address you applied with.`,
    ``,
    `— ${siteName}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f4f6f9;font-family:Inter,Segoe UI,Roboto,sans-serif;color:#0f172a">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px">
    <h1 style="margin:0 0 10px;font-size:19px">Your application has been received</h1>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569">
      Keep the reference below. You will need it together with this email address to check your status.
    </p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#94a3b8">Reference</div>
      <div style="font-size:20px;font-weight:700;margin-top:2px">${escapeHtml(trackingCode)}</div>
      ${summary ? `<div style="font-size:13px;color:#475569;margin-top:12px">${escapeHtml(summary)}</div>` : ""}
      ${amountLine ? `<div style="font-size:13px;color:#475569;margin-top:4px">${escapeHtml(amountLine)}</div>` : ""}
    </div>
    <a href="${escapeHtml(trackUrl)}"
       style="display:block;margin-top:22px;padding:13px;border-radius:12px;background:#ff3c00;color:#fff;text-align:center;text-decoration:none;font-weight:600;font-size:15px">
      Track your application
    </a>
    <p style="margin:22px 0 0;font-size:12px;color:#94a3b8">— ${escapeHtml(siteName)}</p>
  </div>
</body></html>`;

  return {
    subject: `${trackingCode} — your application has been received`,
    html,
    text,
  };
}
