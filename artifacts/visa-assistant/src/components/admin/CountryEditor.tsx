import { useEffect, useState } from 'react';
import {
  AgeBand,
  CardPreview,
  Category,
  EffectivePricing,
  OptionCard,
  PricingOverride,
  RawCountry,
  UnauthorizedError,
  getCountry,
  saveCountry,
  resetCountry,
} from './api';
import {
  Button,
  Card,
  CATEGORY_OPTIONS,
  Field,
  Label,
  Select,
  TextArea,
  Toggle,
} from './ui';
import OptionCardsEditor from './OptionCardsEditor';

type Form = {
  name: string;
  name_tr: string;
  iso2: string;
  flag_emoji: string;
  slug: string;
  category: Category;
  is_active: boolean;
  visa_summary: string;
  stay_rule: string;
  precondition: string;
  airline_conditions: string;
  mission_note: string;
  admin_html_notes: string;
  ai_extra_context: string;
  headline: string;
  features: string[];
  price_label: string;
  price_example: string;
  cta: string;
  cta_href: string;
  insurance_required: boolean;
  age_bands: AgeBand[];
  option_cards: OptionCard[];
  pricing_override: PricingOverride;
  badge_country_label: string;
  top_title: string;
  top_subtitle: string;
  support_line: string;
  requirements_title: string;
  passport_validity_text: string;
  max_stay_text: string;
  insurance_label: string;
};

function toForm(c: RawCountry): Form {
  return {
    name: c.name ?? '',
    name_tr: c.name_tr ?? '',
    iso2: c.iso2 ?? '',
    flag_emoji: c.flag_emoji ?? '',
    slug: c.slug ?? '',
    category: c.category ?? 'evisa_direct',
    is_active: c.is_active !== false,
    visa_summary: c.visa_summary ?? '',
    stay_rule: c.stay_rule ?? '',
    precondition: c.precondition ?? '',
    airline_conditions: c.airline_conditions ?? '',
    mission_note: c.mission_note ?? '',
    admin_html_notes: c.admin_html_notes ?? '',
    ai_extra_context: c.ai_extra_context ?? '',
    headline: c.headline ?? '',
    features: c.features ?? [],
    price_label: c.price_label ?? '',
    price_example: c.price_example ?? '',
    cta: c.cta ?? '',
    cta_href: c.cta_href ?? '',
    insurance_required: c.insurance_required !== false,
    age_bands: c.age_bands ?? [],
    option_cards: c.option_cards ?? [],
    pricing_override: c.pricing_override ?? {},
    badge_country_label: c.badge_country_label ?? '',
    top_title: c.top_title ?? '',
    top_subtitle: c.top_subtitle ?? '',
    support_line: c.support_line ?? '',
    requirements_title: c.requirements_title ?? '',
    passport_validity_text: c.passport_validity_text ?? '',
    max_stay_text: c.max_stay_text ?? '',
    insurance_label: c.insurance_label ?? '',
  };
}

export default function CountryEditor({
  id,
  onBack,
  onSaved,
  onError,
  onUnauthorized,
  onChanged,
}: {
  id: string;
  onBack: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
  onUnauthorized: () => void;
  onChanged: () => void;
}) {
  const [form, setForm] = useState<Form | null>(null);
  const [card, setCard] = useState<CardPreview | null>(null);
  const [pricing, setPricing] = useState<EffectivePricing | null>(null);
  const [saving, setSaving] = useState(false);

  const handleErr = (err: unknown) => {
    if (err instanceof UnauthorizedError) onUnauthorized();
    else onError((err as Error).message);
  };

  useEffect(() => {
    getCountry(id)
      .then((d) => {
        setForm(toForm(d.country));
        setCard(d.card);
      })
      .catch(handleErr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!form) return <Card>Loading…</Card>;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm({ ...form, [k]: v });

  // ── Age bands editor helpers ──
  const setBand = (i: number, patch: Partial<AgeBand>) => {
    const next = form.age_bands.slice();
    next[i] = { ...next[i], ...patch };
    set('age_bands', next);
  };
  const addBand = () => set('age_bands', [...form.age_bands, { label: '', status: '', detail: '' }]);
  const removeBand = (i: number) => set('age_bands', form.age_bands.filter((_, idx) => idx !== i));

  // ── Pricing override editor ──
  const po = form.pricing_override;
  const num = (v: string) => (v === '' ? undefined : Number(v));
  const setPoIns = (k: keyof NonNullable<PricingOverride['insurance']>, v: number | undefined) =>
    set('pricing_override', { ...po, insurance: { ...(po.insurance || {}), [k]: v } });
  const setPoFee = (k: keyof NonNullable<PricingOverride['fees']>, v: number | string | boolean | undefined) =>
    set('pricing_override', { ...po, fees: { ...(po.fees || {}), [k]: v } });

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        name_tr: form.name_tr,
        iso2: form.iso2,
        flag_emoji: form.flag_emoji,
        slug: form.slug,
        category: form.category,
        is_active: form.is_active,
        visa_summary: form.visa_summary,
        stay_rule: form.stay_rule,
        precondition: form.precondition,
        airline_conditions: form.airline_conditions,
        mission_note: form.mission_note,
        admin_html_notes: form.admin_html_notes,
        ai_extra_context: form.ai_extra_context,
        headline: form.headline,
        features: form.features,
        price_label: form.price_label,
        price_example: form.price_example,
        cta: form.cta,
        cta_href: form.cta_href,
        insurance_required: form.insurance_required,
        age_bands: form.age_bands,
        option_cards: form.option_cards,
        pricing_override: form.pricing_override,
        badge_country_label: form.badge_country_label,
        top_title: form.top_title,
        top_subtitle: form.top_subtitle,
        support_line: form.support_line,
        requirements_title: form.requirements_title,
        passport_validity_text: form.passport_validity_text,
        max_stay_text: form.max_stay_text,
        insurance_label: form.insurance_label,
      };
      const res = await saveCountry(id, payload);
      setCard(res.card);
      setPricing(res.pricing);
      onSaved();
      onChanged();
    } catch (err) {
      handleErr(err);
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!confirm('Reset this country to seed defaults? This removes all overrides.')) return;
    setSaving(true);
    try {
      await resetCountry(id);
      const d = await getCountry(id).catch(() => null);
      if (d) {
        setForm(toForm(d.country));
        setCard(d.card);
      }
      onSaved();
      onChanged();
    } catch (err) {
      handleErr(err);
    } finally {
      setSaving(false);
    }
  };

  // Live price preview from effective pricing (returned by PUT/GET)
  const eff = pricing;
  const previewInsurance = eff ? eff.insurance.daily_price * (eff.insurance.min_days || 1) : null;
  const previewTotal = eff ? (previewInsurance ?? 0) + eff.fees.standard_service : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-[13px] text-gray-500 hover:text-gray-700">← All countries</button>
        <h2 className="font-bold text-[17px] text-gray-900">
          {form.flag_emoji} {form.name || id}
        </h2>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ── Left column: fields ── */}
        <div className="flex flex-col gap-5">
          <Card>
            <h3 className="font-semibold text-[15px] text-gray-900 mb-4">Basics</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Name" value={form.name} onChange={(v) => set('name', v)} checkForbidden />
              <Field label="Name (TR)" value={form.name_tr} onChange={(v) => set('name_tr', v)} />
              <Field label="ISO2" value={form.iso2} onChange={(v) => set('iso2', v)} />
              <Field label="Flag emoji" value={form.flag_emoji} onChange={(v) => set('flag_emoji', v)} />
              <Field label="Slug" value={form.slug} onChange={(v) => set('slug', v)} />
              <Select
                label="Category"
                value={form.category}
                onChange={(v) => set('category', v as Category)}
                options={CATEGORY_OPTIONS}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Toggle label="Published (visible in public picker)" checked={form.is_active} onChange={(v) => set('is_active', v)} />
              <Toggle label="Insurance required" checked={form.insurance_required} onChange={(v) => set('insurance_required', v)} />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-[15px] text-gray-900 mb-1">Top block</h3>
            <p className="text-[12px] text-gray-500 mb-4">
              Badges + title + requirements card shown first in the chat result. Leave blank to use defaults.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Badge country label" value={form.badge_country_label} onChange={(v) => set('badge_country_label', v)} placeholder={form.name.toUpperCase()} checkForbidden />
              <Field label="Title" value={form.top_title} onChange={(v) => set('top_title', v)} placeholder="Get Your Travel E-Visa" />
              <Field label="Subtitle" value={form.top_subtitle} onChange={(v) => set('top_subtitle', v)} placeholder={`for ${form.name} Citizens`} checkForbidden />
              <Field label="Support line" value={form.support_line} onChange={(v) => set('support_line', v)} placeholder="(category default)" checkForbidden />
              <Field label="Requirements title (no year)" value={form.requirements_title} onChange={(v) => set('requirements_title', v)} placeholder="Travel Requirements for Turkey:" checkForbidden />
              <Field label="Passport validity text" value={form.passport_validity_text} onChange={(v) => set('passport_validity_text', v)} placeholder="Minimum 180 days" checkForbidden />
              <Field label="Max stay text" value={form.max_stay_text} onChange={(v) => set('max_stay_text', v)} placeholder="(derived from status)" checkForbidden />
              <Field label="Insurance label" value={form.insurance_label} onChange={(v) => set('insurance_label', v)} placeholder="Required" checkForbidden />
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-[15px] text-gray-900 mb-4">Content</h3>
            <div className="flex flex-col gap-4">
              <Field label="Status summary" value={form.visa_summary} onChange={(v) => set('visa_summary', v)} checkForbidden />
              <TextArea label="Stay rule" value={form.stay_rule} onChange={(v) => set('stay_rule', v)} rows={2} checkForbidden />
              <TextArea label="Precondition" value={form.precondition} onChange={(v) => set('precondition', v)} rows={2} checkForbidden />
              <TextArea label="Airline conditions" value={form.airline_conditions} onChange={(v) => set('airline_conditions', v)} rows={2} checkForbidden />
              <TextArea label="Mission note" value={form.mission_note} onChange={(v) => set('mission_note', v)} rows={2} checkForbidden />
              <Field label="Headline" value={form.headline} onChange={(v) => set('headline', v)} checkForbidden />
              <TextArea
                label="Features (one per line)"
                value={form.features.join('\n')}
                onChange={(v) => set('features', v.split('\n'))}
                rows={4}
                checkForbidden
              />
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Price label" value={form.price_label} onChange={(v) => set('price_label', v)} checkForbidden />
                <Field label="Price example" value={form.price_example} onChange={(v) => set('price_example', v)} checkForbidden />
                <Field label="CTA" value={form.cta} onChange={(v) => set('cta', v)} checkForbidden />
                <Field label="CTA href (must start with /)" value={form.cta_href} onChange={(v) => set('cta_href', v)} />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[15px] text-gray-900">Age bands</h3>
              <Button variant="ghost" onClick={addBand}>+ Add row</Button>
            </div>
            <div className="flex flex-col gap-3">
              {form.age_bands.map((b, i) => (
                <div key={i} className="p-3 rounded-xl" style={{ border: '1px solid #e5e7eb', background: '#fafbfc' }}>
                  <div className="grid md:grid-cols-3 gap-3">
                    <Field label="Label" value={b.label} onChange={(v) => setBand(i, { label: v })} />
                    <Field label="Status" value={b.status} onChange={(v) => setBand(i, { status: v })} checkForbidden />
                    <Field label="Detail" value={b.detail} onChange={(v) => setBand(i, { detail: v })} checkForbidden />
                  </div>
                  <button onClick={() => removeBand(i)} className="text-red-500 text-[12px] mt-2 hover:underline">Remove row</button>
                </div>
              ))}
              {form.age_bands.length === 0 && <p className="text-gray-400 text-[13px]">No age bands.</p>}
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-[15px] text-gray-900 mb-4">Notes & context</h3>
            <div className="flex flex-col gap-4">
              <TextArea
                label="Admin HTML notes (shown under card to visitors)"
                value={form.admin_html_notes}
                onChange={(v) => set('admin_html_notes', v)}
                rows={4}
                mono
                checkForbidden
              />
              <div>
                <Label>HTML preview</Label>
                <div
                  className="p-3 rounded-xl text-[13px] text-gray-600"
                  style={{ background: '#f9fafb', border: '1px solid #e5e7eb', minHeight: 40 }}
                  dangerouslySetInnerHTML={{ __html: form.admin_html_notes || '<span style="color:#9ca3af">— empty —</span>' }}
                />
              </div>
              <TextArea
                label="AI extra context (used in chat replies)"
                value={form.ai_extra_context}
                onChange={(v) => set('ai_extra_context', v)}
                rows={3}
              />
            </div>
          </Card>

          <Card>
            <OptionCardsEditor cards={form.option_cards} onChange={(c) => set('option_cards', c)} />
          </Card>

          <Card>
            <h3 className="font-semibold text-[15px] text-gray-900 mb-4">Pricing override</h3>
            <p className="text-[12px] text-gray-500 mb-3">Leave blank to inherit global pricing.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Insurance daily price" type="number" value={po.insurance?.daily_price?.toString() ?? ''} onChange={(v) => setPoIns('daily_price', num(v))} />
              <Field label="Insurance min days" type="number" value={po.insurance?.min_days?.toString() ?? ''} onChange={(v) => setPoIns('min_days', num(v))} />
              <Field label="Standard service fee" type="number" value={po.fees?.standard_service?.toString() ?? ''} onChange={(v) => setPoFee('standard_service', num(v))} />
              <Field label="Express fee" type="number" value={po.fees?.express?.toString() ?? ''} onChange={(v) => setPoFee('express', num(v))} />
              <Field label="Currency" value={po.fees?.currency ?? ''} onChange={(v) => setPoFee('currency', v || undefined)} />
            </div>
          </Card>
        </div>

        {/* ── Right column: live preview ── */}
        <div className="lg:sticky lg:top-4 self-start w-full">
          <Card>
            <Label>Top block preview</Label>
            <div className="rounded-2xl p-4 mt-2 mb-4" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <div className="flex items-center justify-center gap-2 flex-wrap mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold tracking-wide" style={{ background: 'linear-gradient(135deg, #f3e3bd, #e2c684)', color: '#7c5c1e', border: '1px solid #d9bd7f' }}>
                  🇹🇷 TURKEY
                </span>
                <span className="text-gray-400 text-[13px] font-bold">+</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-bold tracking-wide text-white" style={{ background: '#0a1f44' }}>
                  {form.flag_emoji} {form.badge_country_label || form.name.toUpperCase()}
                </span>
              </div>
              <div className="text-center mb-4">
                <div className="font-black text-[19px] text-gray-900 leading-tight">{form.top_title || 'Get Your Travel E-Visa'}</div>
                <div className="font-semibold text-[14px] text-gray-700 mt-0.5">{form.top_subtitle || `for ${form.name} Citizens`}</div>
                {form.support_line && <div className="text-[12px] text-gray-500 mt-1">{form.support_line}</div>}
              </div>
              <div className="rounded-xl overflow-hidden" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                <div className="px-4 pt-3 pb-2 font-bold text-[13px] text-gray-900">{form.requirements_title || 'Travel Requirements for Turkey:'}</div>
                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid #eef1f5' }}>
                  <span className="text-[13px] text-gray-500">Passport validity</span>
                  <span className="text-[13px] font-semibold text-gray-900">{form.passport_validity_text || 'Minimum 180 days'}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid #eef1f5' }}>
                  <span className="text-[13px] text-gray-500">Maximum stay</span>
                  <span className="text-[13px] font-semibold text-gray-900">{form.max_stay_text || '(derived from status)'}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5" style={{ borderTop: '1px solid #eef1f5' }}>
                  <span className="text-[13px] text-gray-500">Insurance</span>
                  <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
                    {form.insurance_label || 'Required'}
                  </span>
                </div>
              </div>
            </div>

            <Label>Live card preview</Label>
            <div className="rounded-2xl p-4 mt-2" style={{ background: '#fff', border: '1px solid #e5e7eb' }}>
              <div className="flex items-center gap-2 text-[14px] font-medium text-gray-800 mb-3">
                <span>{form.flag_emoji} {form.name}</span>
                <span className="text-gray-400">→</span>
                <span>🇹🇷 Türkiye</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {(card?.visa_status || form.visa_summary) && (
                  <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold" style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' }}>
                    {card?.visa_status || form.visa_summary}
                  </span>
                )}
                {form.insurance_required && (
                  <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold" style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
                    Insurance required
                  </span>
                )}
              </div>
              <h4 className="font-semibold text-[15px] text-gray-900 mb-2 leading-snug">{form.headline}</h4>
              <div className="flex flex-col gap-2 mt-3 mb-3">
                {form.features.filter(Boolean).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-[13px] text-gray-700">
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              {form.price_label && (
                <div className="rounded-xl px-4 py-3 mb-3" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div className="font-semibold text-[14px] text-gray-900">{form.price_label}</div>
                  {form.price_example && <div className="text-[12px] text-gray-500 mt-0.5">{form.price_example}</div>}
                </div>
              )}
              <div className="block w-full text-center py-3 rounded-xl font-semibold text-[14px] text-white" style={{ background: '#0a1f44' }}>
                {form.cta || 'Continue'}
              </div>
              {form.admin_html_notes && (
                <div
                  className="mt-3 pt-3 text-[13px] text-gray-600"
                  style={{ borderTop: '1px solid #e5e7eb' }}
                  dangerouslySetInnerHTML={{ __html: form.admin_html_notes }}
                />
              )}
            </div>

            <div className="mt-4">
              <Label>Live price preview (from effective pricing)</Label>
              <div className="p-3 rounded-xl text-[13px] text-gray-700" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                {eff ? (
                  <>
                    <div>
                      Insurance: {eff.insurance.daily_price} × {eff.insurance.min_days || 1} day(s) ={' '}
                      <b>{(previewInsurance ?? 0).toFixed(2)} {eff.fees.currency}</b>
                    </div>
                    <div>+ Standard service: {eff.fees.standard_service.toFixed(2)} {eff.fees.currency}</div>
                    <div className="mt-1 font-bold text-gray-900">
                      Total: {(previewTotal ?? 0).toFixed(2)} {eff.fees.currency}
                    </div>
                  </>
                ) : (
                  <span className="text-gray-400">Save to compute effective pricing.</span>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save country'}</Button>
        <Button variant="danger" onClick={reset} disabled={saving}>Reset to defaults</Button>
      </div>
    </div>
  );
}
