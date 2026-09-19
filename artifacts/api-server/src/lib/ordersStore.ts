import { randomBytes } from "crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, siteSettingsTable, travelOrdersTable, type TravelOrderRow } from "@workspace/db";

export const ORDER_STATUSES = [
  "new",
  "paid",
  "approved",
  "processing",
  "sent",
  "completed",
  "rejected",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderType = "entry" | "sticker" | "insurance" | "esim";

export interface StatusEvent {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface TravelOrder {
  id: string;
  /** Customer-facing reference, e.g. TEG-4K2P9XQ1. Unique across orders. */
  tracking_code: string;
  created_at: string;
  updated_at: string;
  type: OrderType;
  status: OrderStatus;
  status_history: StatusEvent[];
  amount: number;
  currency: string;
  email: string;
  phone?: string;
  customer_name?: string;
  country?: string;
  option_id?: string;
  option_title?: string;
  option_index?: number;
  summary?: string;
  /** Application payload — never store full card numbers */
  payload: Record<string, unknown>;
  payment?: {
    method: string;
    cardholder?: string;
    last4?: string;
    submitted_at: string;
  };
  admin_note?: string;
}

export interface CreateOrderInput {
  type: OrderType;
  amount: number;
  currency?: string;
  email: string;
  phone?: string;
  customer_name?: string;
  country?: string;
  option_id?: string;
  option_title?: string;
  option_index?: number;
  summary?: string;
  payload?: Record<string, unknown>;
  payment?: {
    cardholder?: string;
    last4?: string;
  };
  /** Customer-facing code prefix, from admin apply settings. */
  tracking_prefix?: string;
}

const LEGACY_ORDERS_KEY = "travel_orders";

function newId(): string {
  return `ord_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
}

/** Ambiguous characters (0/O, 1/I) are excluded so codes survive being read aloud. */
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function newTrackingCode(prefix: string): string {
  const clean = (prefix || "TEG").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6) || "TEG";
  const bytes = randomBytes(8);
  let body = "";
  for (const b of bytes) body += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `${clean}-${body}`;
}

function rowToOrder(row: TravelOrderRow): TravelOrder {
  return {
    id: row.id,
    tracking_code: row.trackingCode,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    type: row.type as OrderType,
    status: row.status as OrderStatus,
    status_history: (row.statusHistory as StatusEvent[]) || [],
    amount: Number(row.amount),
    currency: row.currency,
    email: row.email,
    phone: row.phone ?? undefined,
    customer_name: row.customerName ?? undefined,
    country: row.country ?? undefined,
    option_id: row.optionId ?? undefined,
    option_title: row.optionTitle ?? undefined,
    option_index: row.optionIndex ?? undefined,
    summary: row.summary ?? undefined,
    payload: (row.payload as Record<string, unknown>) || {},
    payment: (row.payment as TravelOrder["payment"]) ?? undefined,
    admin_note: row.adminNote ?? undefined,
  };
}

/**
 * Moves any orders still held in the old site_settings JSON blob into the
 * table, once, on first use. The blob is left in place as a safety copy.
 */
let migrationPromise: Promise<void> | null = null;

async function migrateLegacyOrders(): Promise<void> {
  const rows = await db
    .select()
    .from(siteSettingsTable)
    .where(eq(siteSettingsTable.key, LEGACY_ORDERS_KEY));
  const legacy = rows[0]?.value;
  if (!Array.isArray(legacy) || legacy.length === 0) return;

  const existing = await db.select({ id: travelOrdersTable.id }).from(travelOrdersTable).limit(1);
  if (existing.length > 0) return;

  const values = (legacy as TravelOrder[])
    .filter((o) => o && o.id && o.email)
    .map((o) => ({
      id: o.id,
      trackingCode: o.tracking_code || newTrackingCode("TEG"),
      createdAt: new Date(o.created_at || Date.now()),
      updatedAt: new Date(o.updated_at || o.created_at || Date.now()),
      type: o.type,
      status: o.status,
      statusHistory: o.status_history || [],
      amount: String(Number(o.amount) || 0),
      currency: o.currency || "USD",
      email: o.email,
      phone: o.phone ?? null,
      customerName: o.customer_name ?? null,
      country: o.country ?? null,
      optionId: o.option_id ?? null,
      optionTitle: o.option_title ?? null,
      optionIndex: o.option_index ?? null,
      summary: o.summary ?? null,
      payload: o.payload || {},
      payment: o.payment ?? null,
      adminNote: o.admin_note ?? null,
    }));

  if (values.length === 0) return;
  await db.insert(travelOrdersTable).values(values).onConflictDoNothing();
  console.log(`[orders] migrated ${values.length} order(s) out of site_settings`);
}

async function ensureMigrated(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = migrateLegacyOrders().catch((err) => {
      console.error("[orders] legacy migration failed:", err);
      // Allow a later call to retry rather than caching the failure.
      migrationPromise = null;
    });
  }
  return migrationPromise;
}

export async function listOrders(): Promise<TravelOrder[]> {
  await ensureMigrated();
  const rows = await db.select().from(travelOrdersTable).orderBy(desc(travelOrdersTable.createdAt));
  return rows.map(rowToOrder);
}

export async function getOrder(id: string): Promise<TravelOrder | null> {
  await ensureMigrated();
  const rows = await db.select().from(travelOrdersTable).where(eq(travelOrdersTable.id, id)).limit(1);
  return rows[0] ? rowToOrder(rows[0]) : null;
}

/**
 * Public tracking lookup. The email must match the one on the order, so a
 * guessed code alone never reveals an application.
 */
export async function findOrderForTracking(
  code: string,
  email: string,
): Promise<TravelOrder | null> {
  const wanted = String(code || "").trim().toUpperCase();
  const wantedEmail = String(email || "").trim().toLowerCase();
  if (!wanted || !wantedEmail) return null;
  await ensureMigrated();
  const rows = await db
    .select()
    .from(travelOrdersTable)
    .where(
      and(
        eq(sql`upper(${travelOrdersTable.trackingCode})`, wanted),
        eq(sql`lower(${travelOrdersTable.email})`, wantedEmail),
      ),
    )
    .limit(1);
  return rows[0] ? rowToOrder(rows[0]) : null;
}

export async function createOrder(input: CreateOrderInput): Promise<TravelOrder> {
  await ensureMigrated();
  const now = new Date();
  // Nothing is charged here, so an order is never created already paid.
  const status: OrderStatus = "new";

  // The unique index is the real guard; retry only covers a random collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const inserted = await db
        .insert(travelOrdersTable)
        .values({
          id: newId(),
          trackingCode: newTrackingCode(input.tracking_prefix || "TEG"),
          createdAt: now,
          updatedAt: now,
          type: input.type,
          status,
          statusHistory: [{ status, at: now.toISOString(), note: "Order created" }],
          amount: (Number(input.amount) || 0).toFixed(2),
          currency: input.currency || "USD",
          email: String(input.email || "").trim(),
          phone: input.phone?.trim() || null,
          customerName: input.customer_name?.trim() || null,
          country: input.country?.trim() || null,
          optionId: input.option_id ?? null,
          optionTitle: input.option_title ?? null,
          optionIndex: input.option_index ?? null,
          summary: input.summary ?? null,
          payload: input.payload && typeof input.payload === "object" ? input.payload : {},
          payment: input.payment
            ? {
                method: "manual",
                cardholder: input.payment.cardholder,
                last4: input.payment.last4,
                submitted_at: now.toISOString(),
              }
            : null,
        })
        .returning();
      return rowToOrder(inserted[0]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!/tracking_code/.test(message)) throw err;
    }
  }
  throw new Error("Could not allocate a unique tracking code");
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  note?: string,
  adminNote?: string,
): Promise<TravelOrder | null> {
  if (!ORDER_STATUSES.includes(status)) return null;
  await ensureMigrated();
  const current = await getOrder(id);
  if (!current) return null;

  const now = new Date();
  const updated = await db
    .update(travelOrdersTable)
    .set({
      status,
      updatedAt: now,
      statusHistory: [
        ...(current.status_history || []),
        { status, at: now.toISOString(), note: note || undefined },
      ],
      ...(adminNote !== undefined ? { adminNote } : {}),
    })
    .where(eq(travelOrdersTable.id, id))
    .returning();
  return updated[0] ? rowToOrder(updated[0]) : null;
}

export async function updateOrderNote(id: string, adminNote: string): Promise<TravelOrder | null> {
  await ensureMigrated();
  const updated = await db
    .update(travelOrdersTable)
    .set({ adminNote, updatedAt: new Date() })
    .where(eq(travelOrdersTable.id, id))
    .returning();
  return updated[0] ? rowToOrder(updated[0]) : null;
}
