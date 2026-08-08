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
  payment?: { cardholder?: string; last4?: string };
  mark_paid?: boolean;
}

/** Public intake — saves application + payment-form meta for admin. */
export async function submitOrder(body: CreateOrderBody): Promise<{ id: string; status: string }> {
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
  const data = (await res.json()) as { order: { id: string; status: string } };
  return data.order;
}
