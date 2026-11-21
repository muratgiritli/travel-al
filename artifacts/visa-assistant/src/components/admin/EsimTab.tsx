import { useEffect, useState } from 'react';
import { getSettings, putSettings, EsimPlan, EsimSettings, UnauthorizedError } from './api';
import { Button, Card, Field, Label, Toggle } from './ui';
import { DEFAULT_SETTINGS } from '@/lib/settings';

const emptyPlan = (): EsimPlan => ({
  id: `tr-${Date.now()}`,
  name: 'Turkey eSIM',
  data_label: '1 GB',
  validity_days: 7,
  price: 4.5,
  network: 'Turkcell',
  hotspot: true,
  coverage: 'Türkiye',
  features: ['QR ile anında kurulum', 'LTE / 5G'],
  details: '',
  sort: 99,
  active: true,
});

export default function EsimTab({
  onSaved,
  onError,
  onUnauthorized,
}: {
  onSaved: () => void;
  onError: (msg: string) => void;
  onUnauthorized: () => void;
}) {
  const [esim, setEsim] = useState<EsimSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then((d) => {
        setEsim(d.settings.esim ?? DEFAULT_SETTINGS.esim);
      })
      .catch((err) => {
        if (err instanceof UnauthorizedError) onUnauthorized();
        else onError(err.message);
      });
  }, [onError, onUnauthorized]);

  if (!esim) return <Card>Loading…</Card>;

  const num = (v: string) => (v === '' ? 0 : Number(v));

  const updatePlan = (idx: number, patch: Partial<EsimPlan>) => {
    const plans = [...esim.plans];
    plans[idx] = { ...plans[idx], ...patch };
    setEsim({ ...esim, plans });
  };

  const removePlan = (idx: number) => {
    setEsim({ ...esim, plans: esim.plans.filter((_, i) => i !== idx) });
  };

  const addPlan = () => {
    setEsim({
      ...esim,
      plans: [...esim.plans, { ...emptyPlan(), sort: esim.plans.length + 1 }],
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await putSettings({ esim });
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
        <h2 className="font-bold text-[17px] text-gray-900 mb-1">Turkey eSIM</h2>
        <p className="text-[12px] text-gray-500 mb-4">
          Sample plans (editable). Shown in chat when the user picks TURKEY eSIM.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <Toggle
            label="Enabled"
            checked={esim.enabled}
            onChange={(v) => setEsim({ ...esim, enabled: v })}
          />
          <Field
            label="Currency"
            value={esim.currency}
            onChange={(v) => setEsim({ ...esim, currency: v })}
          />
          <Field
            label="CTA label"
            value={esim.cta_label}
            onChange={(v) => setEsim({ ...esim, cta_label: v })}
          />
          <Field
            label="CTA link"
            value={esim.cta_href}
            onChange={(v) => setEsim({ ...esim, cta_href: v })}
          />
        </div>
        <div className="mt-4">
          <Field
            label="Intro text"
            value={esim.intro}
            onChange={(v) => setEsim({ ...esim, intro: v })}
          />
        </div>
      </Card>

      {esim.plans
        .slice()
        .sort((a, b) => a.sort - b.sort)
        .map((plan) => {
          const idx = esim.plans.findIndex((p) => p.id === plan.id);
          return (
            <Card key={plan.id}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-[15px] text-gray-900">
                  {plan.name || 'Untitled plan'}
                </h3>
                <div className="flex items-center gap-3">
                  <Toggle
                    label="Active"
                    checked={plan.active !== false}
                    onChange={(v) => updatePlan(idx, { active: v })}
                  />
                  <button
                    type="button"
                    onClick={() => removePlan(idx)}
                    className="text-[12px] font-semibold text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="ID" value={plan.id} onChange={(v) => updatePlan(idx, { id: v })} />
                <Field label="Name" value={plan.name} onChange={(v) => updatePlan(idx, { name: v })} />
                <Field
                  label="Data label"
                  value={plan.data_label}
                  onChange={(v) => updatePlan(idx, { data_label: v })}
                />
                <Field
                  label="Validity (days)"
                  type="number"
                  value={String(plan.validity_days)}
                  onChange={(v) => updatePlan(idx, { validity_days: num(v) })}
                />
                <Field
                  label="Price"
                  type="number"
                  value={String(plan.price)}
                  onChange={(v) => updatePlan(idx, { price: num(v) })}
                />
                <Field
                  label="Sort"
                  type="number"
                  value={String(plan.sort)}
                  onChange={(v) => updatePlan(idx, { sort: num(v) })}
                />
                <Field
                  label="Network"
                  value={plan.network}
                  onChange={(v) => updatePlan(idx, { network: v })}
                />
                <Field
                  label="Coverage"
                  value={plan.coverage}
                  onChange={(v) => updatePlan(idx, { coverage: v })}
                />
                <Toggle
                  label="Hotspot"
                  checked={!!plan.hotspot}
                  onChange={(v) => updatePlan(idx, { hotspot: v })}
                />
              </div>
              <div className="mt-3">
                <Label>Features (one per line)</Label>
                <textarea
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-[13px] min-h-[72px]"
                  value={(plan.features || []).join('\n')}
                  onChange={(e) =>
                    updatePlan(idx, {
                      features: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              <div className="mt-3">
                <Label>Details (drawer text)</Label>
                <textarea
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-[13px] min-h-[88px]"
                  value={plan.details || ''}
                  onChange={(e) => updatePlan(idx, { details: e.target.value })}
                />
              </div>
            </Card>
          );
        })}

      <div className="flex gap-3">
        <Button onClick={addPlan} variant="ghost">
          + Add plan
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save eSIM plans'}
        </Button>
      </div>
    </div>
  );
}
