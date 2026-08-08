import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";

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
    method: "card_form";
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
  /** If payment form was submitted, start as paid */
  mark_paid?: boolean;
}

const ORDERS_KEY = "travel_orders";

function newId(): string {
  return `ord_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
}

async function readAll(): Promise<TravelOrder[]> {
  try {
    const rows = await db
      .select()
      .from(siteSettingsTable)
      .where(eq(siteSettingsTable.key, ORDERS_KEY));
    const val = rows[0]?.value;
    if (Array.isArray(val)) return val as TravelOrder[];
  } catch (err) {
    console.error("[orders] read failed:", err);
  }
  return [];
}

async function writeAll(orders: TravelOrder[]): Promise<void> {
  await db
    .insert(siteSettingsTable)
    .values({ key: ORDERS_KEY, value: orders, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: siteSettingsTable.key,
      set: { value: orders, updatedAt: new Date() },
    });
}

export async function listOrders(): Promise<TravelOrder[]> {
  const all = await readAll();
  return [...all].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export async function getOrder(id: string): Promise<TravelOrder | null> {
  const all = await readAll();
  return all.find((o) => o.id === id) || null;
}

export async function createOrder(input: CreateOrderInput): Promise<TravelOrder> {
  const now = new Date().toISOString();
  const status: OrderStatus = input.mark_paid ? "paid" : "new";
  const order: TravelOrder = {
    id: newId(),
    created_at: now,
    updated_at: now,
    type: input.type,
    status,
    status_history: [{ status, at: now, note: "Order created" }],
    amount: Number(input.amount) || 0,
    currency: input.currency || "USD",
    email: String(input.email || "").trim(),
    phone: input.phone?.trim() || undefined,
    customer_name: input.customer_name?.trim() || undefined,
    country: input.country?.trim() || undefined,
    option_id: input.option_id,
    option_title: input.option_title,
    option_index: input.option_index,
    summary: input.summary,
    payload: input.payload && typeof input.payload === "object" ? input.payload : {},
    payment: input.payment
      ? {
          method: "card_form",
          cardholder: input.payment.cardholder,
          last4: input.payment.last4,
          submitted_at: now,
        }
      : undefined,
  };
  const all = await readAll();
  all.unshift(order);
  await writeAll(all);
  return order;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  note?: string,
  adminNote?: string,
): Promise<TravelOrder | null> {
  if (!ORDER_STATUSES.includes(status)) return null;
  const all = await readAll();
  const idx = all.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  const prev = all[idx];
  const next: TravelOrder = {
    ...prev,
    status,
    updated_at: now,
    status_history: [
      ...(prev.status_history || []),
      { status, at: now, note: note || undefined },
    ],
    admin_note: adminNote !== undefined ? adminNote : prev.admin_note,
  };
  all[idx] = next;
  await writeAll(all);
  return next;
}

export async function updateOrderNote(id: string, adminNote: string): Promise<TravelOrder | null> {
  const all = await readAll();
  const idx = all.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  all[idx] = { ...all[idx], admin_note: adminNote, updated_at: now };
  await writeAll(all);
  return all[idx];
}
