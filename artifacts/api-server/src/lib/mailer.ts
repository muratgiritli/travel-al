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

/** Where internal notifications go; falls back to the sender address. */
export function adminNotifyAddress(): string | null {
  return process.env["ADMIN_NOTIFY_EMAIL"] || process.env["EMAIL_FROM"] || null;
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

const STATUS_COPY: Record<string, string> = {
  paid: "Your payment has been received.",
  approved: "Your application has been approved.",
  processing: "Your application is being processed.",
  sent: "Your documents have been sent.",
  completed: "Your application is complete.",
  rejected: "Your application could not be approved.",
  cancelled: "Your application has been cancelled.",
};

/** Returns null for statuses not worth emailing about. */
export function statusChangeEmail(params: {
  trackingCode: string;
  status: string;
  note?: string;
  siteName: string;
  siteUrl: string;
}): { subject: string; html: string; text: string } | null {
  const { trackingCode, status, note, siteName, siteUrl } = params;
  const headline = STATUS_COPY[status];
  if (!headline) return null;

  const trackUrl = `${siteUrl.replace(/\/$/, "")}/track`;
  const text = [
    headline,
    "",
    `Reference: ${trackingCode}`,
    note ? `Note: ${note}` : "",
    "",
    `Full status: ${trackUrl}`,
    "",
    `— ${siteName}`,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:24px;background:#f4f6f9;font-family:Inter,Segoe UI,Roboto,sans-serif;color:#0f172a">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:28px">
    <h1 style="margin:0 0 10px;font-size:19px">${escapeHtml(headline)}</h1>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-top:16px">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#94a3b8">Reference</div>
      <div style="font-size:20px;font-weight:700;margin-top:2px">${escapeHtml(trackingCode)}</div>
      ${note ? `<div style="font-size:13px;color:#475569;margin-top:12px">${escapeHtml(note)}</div>` : ""}
    </div>
    <a href="${escapeHtml(trackUrl)}"
       style="display:block;margin-top:22px;padding:13px;border-radius:12px;background:#ff3c00;color:#fff;text-align:center;text-decoration:none;font-weight:600;font-size:15px">
      View status
    </a>
    <p style="margin:22px 0 0;font-size:12px;color:#94a3b8">— ${escapeHtml(siteName)}</p>
  </div>
</body></html>`;

  return { subject: `${trackingCode} — ${headline}`, html, text };
}

export function newOrderAdminEmail(params: {
  trackingCode: string;
  type: string;
  summary?: string;
  amount: number;
  currency: string;
  email: string;
  customerName?: string;
  country?: string;
  siteUrl: string;
}): { subject: string; html: string; text: string } {
  const rows: [string, string][] = [
    ["Reference", params.trackingCode],
    ["Service", params.type],
    ["Summary", params.summary || "—"],
    ["Amount", `${params.currency} ${params.amount}`],
    ["Customer", params.customerName || "—"],
    ["Email", params.email],
    ["Country", params.country || "—"],
  ];

  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `<!DOCTYPE html>
<html><body style="font-family:Inter,Segoe UI,Roboto,sans-serif;color:#0f172a">
  <h2 style="font-size:17px">New application: ${escapeHtml(params.trackingCode)}</h2>
  <table style="border-collapse:collapse;font-size:14px">
    ${rows
      .map(
        ([k, v]) =>
          `<tr><td style="padding:4px 14px 4px 0;color:#64748b">${escapeHtml(k)}</td><td style="padding:4px 0"><b>${escapeHtml(v)}</b></td></tr>`,
      )
      .join("")}
  </table>
  <p style="font-size:13px"><a href="${escapeHtml(params.siteUrl.replace(/\/$/, ""))}/admin">Open admin</a></p>
</body></html>`;

  return { subject: `New application ${params.trackingCode} (${params.type})`, html, text };
}
