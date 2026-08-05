import { useEffect, useState } from 'react';
import { getSettings, putSettings, SiteSettings, UnauthorizedError } from './api';
import { Button, Card, Field, Label, Toggle } from './ui';

export default function PricingTab({
  onSaved,
  onError,
  onUnauthorized,
}: {
  onSaved: () => void;
  onError: (msg: string) => void;
  onUnauthorized: () => void;
}) {
  const [pricing, setPricing] = useState<SiteSettings['pricing'] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then((d) => setPricing(d.settings.pricing))
      .catch((err) => {
        if (err instanceof UnauthorizedError) onUnauthorized();
        else onError(err.message);
      });
  }, [onError, onUnauthorized]);

  if (!pricing) return <Card>Loading…</Card>;

  const ins = pricing.insurance;
  const fees = pricing.fees;

  const setIns = (k: keyof typeof ins, v: unknown) =>
    setPricing({ ...pricing, insurance: { ...ins, [k]: v } });
  const setFees = (k: keyof typeof fees, v: unknown) =>
    setPricing({ ...pricing, fees: { ...fees, [k]: v } });

  const num = (v: string) => (v === '' ? 0 : Number(v));

  // Live example calculation
  const exampleDays = ins.min_days || 1;
  const insuranceCost = ins.daily_price * exampleDays;
  const subtotal = insuranceCost + fees.standard_service;
  const tax = fees.tax_enabled ? (subtotal * fees.tax_percent) / 100 : 0;
  const total = subtotal + tax;

  const save = async () => {
    setSaving(true);
    try {
      await putSettings({ pricing });
      onSaved();
    } catch (err) {
      if (err instanceof UnauthorizedError) onUnauthorized();
      else onError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <h2 className="font-bold text-[17px] text-gray-900 mb-4">Insurance</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Daily price" type="number" value={String(ins.daily_price)} onChange={(v) => setIns('daily_price', num(v))} />
          <Field label="Minimum days" type="number" value={String(ins.min_days)} onChange={(v) => setIns('min_days', num(v))} />
          <Toggle label="Per traveler" checked={ins.per_traveler} onChange={(v) => setIns('per_traveler', v)} />
          <Toggle label="Required by default" checked={ins.required_default} onChange={(v) => setIns('required_default', v)} />
        </div>
        <div className="mt-4">
          <Field label="Example text" value={ins.example_text} onChange={(v) => setIns('example_text', v)} />
        </div>
      </Card>

      <Card>
        <h2 className="font-bold text-[17px] text-gray-900 mb-4">Fees</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Standard service" type="number" value={String(fees.standard_service)} onChange={(v) => setFees('standard_service', num(v))} />
          <Field label="Express" type="number" value={String(fees.express)} onChange={(v) => setFees('express', num(v))} />
          <Field label="Sticker consultancy" type="number" value={String(fees.sticker_consultancy)} onChange={(v) => setFees('sticker_consultancy', num(v))} />
          <Field label="Conditional option" type="number" value={String(fees.conditional_option)} onChange={(v) => setFees('conditional_option', num(v))} />
          <Field label="Gulf support" type="number" value={String(fees.gulf_support)} onChange={(v) => setFees('gulf_support', num(v))} />
          <Field label="Currency" value={fees.currency} onChange={(v) => setFees('currency', v)} />
        </div>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <Toggle label="Tax enabled" checked={fees.tax_enabled} onChange={(v) => setFees('tax_enabled', v)} />
          <Field label="Tax percent" type="number" value={String(fees.tax_percent)} onChange={(v) => setFees('tax_percent', num(v))} />
        </div>
      </Card>

      <Card>
        <Label>Example calculation (live)</Label>
        <div className="p-4 rounded-xl text-[14px] text-gray-700" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <div>Insurance: {ins.daily_price} × {exampleDays} day(s) = <b>{insuranceCost.toFixed(2)} {fees.currency}</b></div>
          <div>+ Standard service: {fees.standard_service.toFixed(2)} {fees.currency}</div>
          <div>Subtotal: {subtotal.toFixed(2)} {fees.currency}</div>
          {fees.tax_enabled && <div>+ Tax ({fees.tax_percent}%): {tax.toFixed(2)} {fees.currency}</div>}
          <div className="mt-1 font-bold text-gray-900">Total: {total.toFixed(2)} {fees.currency}</div>
        </div>
      </Card>

      <div>
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save pricing'}</Button>
      </div>
    </div>
  );
}
