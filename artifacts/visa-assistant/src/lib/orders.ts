export const ORDER_STATUSES = [
  'new',
  'paid',
  'approved',
  'processing',
  'sent',
  'completed',
  'rejected',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderType = 'entry' | 'sticker' | 'insurance' | 'esim';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'New',
  paid: 'Paid',
  approved: 'Approved',
  processing: 'Processing',
  sent: 'Sent',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  entry: 'Entry permit',
  sticker: 'Sticker / support',
  insurance: 'Insurance',
  esim: 'eSIM',
};

export interface StatusEvent {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface TravelOrder {
  id: string;
  /** Customer-facing reference shown on /track. */
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
  payload: Record<string, unknown>;
  payment?: {
    method: string;
    cardholder?: string;
    last4?: string;
    submitted_at: string;
  };
  admin_note?: string;
}

export interface CreateOrderBody {
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
}

export interface SubmittedOrder {
  id: string;
  /** Customer-facing reference used on /track. */
  tracking_code: string;
  status: string;
}

/** Public intake — records the application and returns its tracking reference. */
export async function submitOrder(body: CreateOrderBody): Promise<SubmittedOrder> {
  const res = await fetch('/api/travel/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let msg = `Order failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const data = (await res.json()) as { order: SubmittedOrder };
  return data.order;
}

export interface TrackedOrder {
  tracking_code: string;
  status: string;
  type: string;
  country?: string;
  summary?: string;
  amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  history: { status: string; at: string }[];
}

/** Public status lookup. The server requires the reference and email to match. */
export async function trackOrder(code: string, email: string): Promise<TrackedOrder> {
  const params = new URLSearchParams({ code, email });
  const res = await fetch(`/api/travel/orders/track?${params.toString()}`);
  if (!res.ok) {
    let msg = 'No application matches that reference and email.';
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* keep the default message */
    }
    throw new Error(msg);
  }
  const data = (await res.json()) as { order: TrackedOrder };
  return data.order;
}

/** Starts hosted Stripe Checkout. 404 means payments are not enabled. */
export async function startCheckout(code: string, email: string): Promise<string> {
  const res = await fetch(`/api/travel/orders/${encodeURIComponent(code)}/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    let msg = 'Could not start payment.';
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* keep default */
    }
    throw new Error(msg);
  }
  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error('Could not start payment.');
  return data.url;
}
