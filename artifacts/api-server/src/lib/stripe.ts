import { logger } from "./logger";

/**
 * Stripe Checkout over the REST API.
 *
 * Called through fetch rather than the SDK to avoid a dependency for one
 * endpoint. Everything here is inert until STRIPE_SECRET_KEY is set, so the
 * site behaves exactly as it does today until real keys arrive.
 */

const API_BASE = "https://api.stripe.com/v1";

export function isStripeConfigured(): boolean {
  return Boolean(process.env["STRIPE_SECRET_KEY"]);
}

/** Stripe takes the smallest currency unit; these have no minor unit. */
const ZERO_DECIMAL = new Set(["JPY", "KRW", "VND", "CLP", "ISK", "XOF", "XAF"]);

function toMinorUnits(amount: number, currency: string): number {
  return ZERO_DECIMAL.has(currency.toUpperCase())
    ? Math.round(amount)
    : Math.round(amount * 100);
}

async function stripePost(path: string, form: URLSearchParams): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env["STRIPE_SECRET_KEY"]}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const err = data.error as { message?: string } | undefined;
    throw new Error(err?.message || `Stripe request failed (${res.status})`);
  }
  return data;
}

/**
 * Creates a hosted Checkout session for an existing order and returns its URL.
 * Returns null when Stripe is not configured.
 */
export async function createCheckoutSession(params: {
  trackingCode: string;
  description: string;
  amount: number;
  currency: string;
  customerEmail: string;
  siteUrl: string;
}): Promise<string | null> {
  if (!isStripeConfigured()) return null;
  if (!(params.amount > 0)) return null;

  const base = params.siteUrl.replace(/\/$/, "");
  const form = new URLSearchParams({
    mode: "payment",
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": params.currency.toLowerCase(),
    "line_items[0][price_data][unit_amount]": String(
      toMinorUnits(params.amount, params.currency),
    ),
    "line_items[0][price_data][product_data][name]": params.description,
    customer_email: params.customerEmail,
    client_reference_id: params.trackingCode,
    "metadata[tracking_code]": params.trackingCode,
    success_url: `${base}/track?paid=1`,
    cancel_url: `${base}/track`,
  });

  try {
    const session = await stripePost("/checkout/sessions", form);
    return typeof session.url === "string" ? session.url : null;
  } catch (err) {
    logger.error({ err, trackingCode: params.trackingCode }, "Stripe session creation failed");
    return null;
  }
}

/**
 * Verifies a Stripe webhook signature without the SDK.
 * Returns the parsed event, or null when the signature does not check out.
 */
export async function verifyWebhook(
  rawBody: Buffer,
  signatureHeader: string | undefined,
): Promise<Record<string, unknown> | null> {
  const secret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!secret || !signatureHeader) return null;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k?.trim(), v?.trim()];
    }),
  ) as Record<string, string | undefined>;

  const timestamp = parts["t"];
  const provided = parts["v1"];
  if (!timestamp || !provided) return null;

  // Reject replays of an old signed payload.
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return null;

  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody.toString("utf8")}`)
    .digest("hex");

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(provided, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}
