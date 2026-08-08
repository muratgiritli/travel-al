import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getOrders,
  patchOrder,
  UnauthorizedError,
} from './api';
import type { TravelOrder, OrderStatus } from '@/lib/orders';
import {
  ORDER_STATUS_LABELS,
  ORDER_TYPE_LABELS,
  ORDER_STATUSES,
} from '@/lib/orders';
import { Button, Card } from './ui';

const STATUS_COLORS: Record<OrderStatus, { bg: string; color: string }> = {
  new: { bg: '#F3F4F6', color: '#374151' },
  paid: { bg: '#DBEAFE', color: '#1D4ED8' },
  approved: { bg: '#DCFCE7', color: '#15803D' },
  processing: { bg: '#FFEDD5', color: '#C2410C' },
  sent: { bg: '#E0E7FF', color: '#4338CA' },
  completed: { bg: '#D1FAE5', color: '#047857' },
  rejected: { bg: '#FEE2E2', color: '#B91C1C' },
  cancelled: { bg: '#F3F4F6', color: '#6B7280' },
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.new;
  return (
    <span
      className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide"
      style={{ background: c.bg, color: c.color }}
    >
      {ORDER_STATUS_LABELS[status] || status}
    </span>
  );
}

export default function OrdersTab({
  onSaved,
  onError,
  onUnauthorized,
}: {
  onSaved: () => void;
  onError: (msg: string) => void;
  onUnauthorized: () => void;
}) {
  const [orders, setOrders] = useState<TravelOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | string>('all');
  const [selected, setSelected] = useState<TravelOrder | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getOrders()
      .then((d) => setOrders(d.orders || []))
      .catch((err) => {
        if (err instanceof UnauthorizedError) onUnauthorized();
        else onError(err.message);
      })
      .finally(() => setLoading(false));
  }, [onError, onUnauthorized]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filter !== 'all' && o.status !== filter) return false;
      if (typeFilter !== 'all' && o.type !== typeFilter) return false;
      return true;
    });
  }, [orders, filter, typeFilter]);

  const setStatus = async (status: OrderStatus) => {
    if (!selected) return;
    setSaving(true);
    try {
      const { order } = await patchOrder(selected.id, {
        status,
        note: `Status → ${ORDER_STATUS_LABELS[status]}`,
        admin_note: note,
      });
      setSelected(order);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
      onSaved();
    } catch (err) {
      if (err instanceof UnauthorizedError) onUnauthorized();
      else onError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const { order } = await patchOrder(selected.id, { admin_note: note });
      setSelected(order);
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
      onSaved();
    } catch (err) {
      if (err instanceof UnauthorizedError) onUnauthorized();
      else onError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setNote(selected?.admin_note || '');
  }, [selected?.id, selected?.admin_note]);

  if (loading) return <Card>Loading orders…</Card>;

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold text-[17px] text-gray-900">Orders & applications</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {filtered.length} shown · {orders.length} total
            </p>
          </div>
          <Button onClick={load}>Refresh</Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | OrderStatus)}
            className="rounded-xl px-3 py-2 text-[13px] border border-gray-200"
          >
            <option value="all">All statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl px-3 py-2 text-[13px] border border-gray-200"
          >
            <option value="all">All types</option>
            <option value="entry">Entry permit</option>
            <option value="sticker">Sticker / support</option>
            <option value="insurance">Insurance</option>
            <option value="esim">eSIM</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <p className="text-[13px] text-gray-500 py-8 text-center">
            No orders yet. Submissions from chat forms appear here.
          </p>
        ) : (
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelected(o)}
                className="w-full text-left rounded-xl px-3.5 py-3 transition-colors"
                style={{
                  border: selected?.id === o.id ? '1.5px solid #0a1f44' : '1px solid #e5e7eb',
                  background: selected?.id === o.id ? '#F8FAFC' : '#fff',
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-[14px] text-gray-900">
                      {o.customer_name || o.email}
                    </div>
                    <div className="text-[12px] text-gray-500 mt-0.5">
                      {ORDER_TYPE_LABELS[o.type] || o.type}
                      {o.option_title ? ` · ${o.option_title}` : ''}
                    </div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="flex justify-between mt-2 text-[12px] text-gray-500">
                  <span>{formatWhen(o.created_at)}</span>
                  <span className="font-semibold text-gray-800">
                    {o.currency} {o.amount}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card>
        {!selected ? (
          <p className="text-[13px] text-gray-500">Select an order to manage status.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                Order
              </div>
              <div className="font-bold text-[16px] text-gray-900 mt-1 break-all">
                {selected.id}
              </div>
              <div className="mt-2">
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div className="text-[13px] space-y-1.5">
              <Row label="Type" value={ORDER_TYPE_LABELS[selected.type] || selected.type} />
              <Row label="Customer" value={selected.customer_name || '—'} />
              <Row label="Email" value={selected.email} />
              <Row label="Phone" value={selected.phone || '—'} />
              <Row label="Country" value={selected.country || '—'} />
              <Row
                label="Amount"
                value={`${selected.currency} ${selected.amount}`}
              />
              <Row label="Summary" value={selected.summary || '—'} />
              {selected.payment?.last4 && (
                <Row
                  label="Card"
                  value={`···· ${selected.payment.last4}${
                    selected.payment.cardholder ? ` · ${selected.payment.cardholder}` : ''
                  }`}
                />
              )}
            </div>

            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Set status
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ORDER_STATUSES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={saving || selected.status === s}
                    onClick={() => setStatus(s)}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase disabled:opacity-40"
                    style={{
                      background: STATUS_COLORS[s].bg,
                      color: STATUS_COLORS[s].color,
                      border: selected.status === s ? `1.5px solid ${STATUS_COLORS[s].color}` : '1px solid transparent',
                    }}
                  >
                    {ORDER_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Admin note
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="w-full rounded-xl px-3 py-2 text-[13px] border border-gray-200 outline-none"
                placeholder="Internal note…"
              />
              <Button className="mt-2" onClick={saveNote} disabled={saving}>
                Save note
              </Button>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Status history
              </div>
              <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                {(selected.status_history || []).slice().reverse().map((h, i) => (
                  <li key={`${h.at}-${i}`} className="text-[12px] text-gray-600">
                    <span className="font-semibold text-gray-800">
                      {ORDER_STATUS_LABELS[h.status] || h.status}
                    </span>
                    <span className="text-gray-400"> · {formatWhen(h.at)}</span>
                    {h.note && <div className="text-gray-500">{h.note}</div>}
                  </li>
                ))}
              </ul>
            </div>

            <details className="text-[12px]">
              <summary className="cursor-pointer font-semibold text-gray-600">
                Application payload
              </summary>
              <pre
                className="mt-2 p-3 rounded-xl overflow-auto text-[11px] max-h-56"
                style={{ background: '#F8FAFC', border: '1px solid #E5E7EB' }}
              >
                {JSON.stringify(selected.payload || {}, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-medium text-gray-900 text-right break-all">{value}</span>
    </div>
  );
}
