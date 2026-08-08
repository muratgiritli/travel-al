import { useMemo, useState } from 'react';
import type { ContentEsimPage, EsimPlan, EsimSettings } from '@/lib/settings';
import EsimApplyForm, { type EsimCountryOption } from '@/components/EsimApplyForm';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

const ACCENT = '#7C3AED';
const ACCENT_DARK = '#6D28D9';

function formatPrice(price: number, currency: string) {
  const n = Number.isInteger(price) ? String(price) : price.toFixed(2).replace(/\.00$/, '');
  return { amount: n, currency };
}

export default function EsimPlans({
  esim,
  page,
  countries = [],
  defaultCountry = '',
  onFormVisibilityChange,
}: {
  esim: EsimSettings;
  page: ContentEsimPage;
  countries?: EsimCountryOption[];
  defaultCountry?: string;
  onFormVisibilityChange?: (open: boolean) => void;
}) {
  const [selected, setSelected] = useState<EsimPlan | null>(null);
  const [orderPlan, setOrderPlan] = useState<EsimPlan | null>(null);
  const currency = esim.currency || 'USD';

  const plans = useMemo(
    () =>
      [...(esim.plans || [])]
        .filter((p) => p.active !== false)
        .sort((a, b) => a.sort - b.sort),
    [esim.plans],
  );

  const openOrder = (plan: EsimPlan) => {
    setSelected(null);
    setOrderPlan(plan);
    onFormVisibilityChange?.(true);
  };

  const closeOrder = () => {
    setOrderPlan(null);
    onFormVisibilityChange?.(false);
  };

  if (!esim.enabled) {
    return (
      <div
        className="mt-3 rounded-2xl px-4 py-4 bg-white text-[13px] text-gray-500"
        style={{ border: '1px solid #E5E7EB' }}
      >
        {page.unavailable}
      </div>
    );
  }

  if (orderPlan) {
    return (
      <EsimApplyForm
        plan={orderPlan}
        currency={currency}
        countries={countries}
        defaultCountry={defaultCountry}
        onBack={closeOrder}
      />
    );
  }

  return (
    <div className="mt-3">
      <div
        className="rounded-2xl bg-white px-4 py-4 mb-3"
        style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 10px rgba(15,23,42,.06)' }}
      >
        {page.headline && (
          <h3 className="font-bold text-[16px] leading-snug" style={{ color: '#0a1f44' }}>
            {page.headline}
          </h3>
        )}
        {page.body && (
          <p className="text-[13px] text-gray-600 mt-2 leading-relaxed">{page.body}</p>
        )}
        {page.bullets?.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {page.bullets.map((line) => (
              <li key={line} className="text-[12.5px] text-gray-700 flex gap-2 leading-relaxed">
                <span className="shrink-0 font-bold" style={{ color: ACCENT }}>
                  ✓
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {page.choose_label && (
        <h4
          className="text-[13px] font-bold tracking-wide mb-2.5"
          style={{ color: '#0a1f44' }}
        >
          {page.choose_label}
        </h4>
      )}

      <div className="space-y-2.5">
        {plans.map((plan) => {
          const { amount, currency: cur } = formatPrice(plan.price, plan.currency || currency);
          return (
            <div
              key={plan.id}
              className="rounded-2xl bg-white px-4 py-3.5"
              style={{ border: '1px solid #E5E7EB', boxShadow: '0 2px 10px rgba(15,23,42,.06)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-bold text-[15px]" style={{ color: '#0a1f44' }}>
                    {plan.name}
                  </div>
                  <div className="text-[12px] text-gray-500 mt-0.5">
                    {plan.data_label} · {plan.validity_days} days · {plan.network}
                  </div>
                </div>
                <div className="shrink-0 text-right leading-none">
                  <span className="font-bold text-[20px]" style={{ color: '#0a1f44' }}>
                    ${amount}
                  </span>
                  <span className="ml-1 text-[11px] font-semibold text-gray-400">{cur}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => setSelected(plan)}
                  className="flex-1 text-center text-[13px] font-semibold py-2.5 rounded-xl"
                  style={{ background: '#F5F3FF', color: ACCENT, border: `1px solid #DDD6FE` }}
                >
                  {page.details_label}
                </button>
                <button
                  type="button"
                  onClick={() => openOrder(plan)}
                  className="flex-1 text-center text-[13px] font-bold text-white py-2.5 rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` }}
                >
                  {esim.cta_label}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Drawer open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DrawerContent className="max-h-[85vh]">
          {selected && (
            <>
              <DrawerHeader className="text-left">
                <DrawerTitle style={{ color: '#0a1f44' }}>{selected.name}</DrawerTitle>
                <DrawerDescription>
                  {selected.data_label} · {selected.validity_days} days · {selected.coverage}
                </DrawerDescription>
              </DrawerHeader>

              <div className="px-4 pb-2 overflow-y-auto">
                <div className="flex items-baseline gap-1.5 mb-4">
                  <span className="font-bold text-[28px]" style={{ color: '#0a1f44' }}>
                    ${formatPrice(selected.price, selected.currency || currency).amount}
                  </span>
                  <span className="text-[13px] font-semibold text-gray-400">
                    {selected.currency || currency}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Meta label="Data" value={selected.data_label} />
                  <Meta label="Validity" value={`${selected.validity_days} days`} />
                  <Meta label="Network" value={selected.network} />
                  <Meta label="Hotspot" value={selected.hotspot ? 'Yes' : 'No'} />
                </div>

                <p className="text-[13px] text-gray-600 leading-relaxed mb-3">
                  {selected.details}
                </p>

                {selected.features?.length > 0 && (
                  <ul className="space-y-1.5 mb-2">
                    {selected.features.map((f) => (
                      <li key={f} className="text-[13px] text-gray-700 flex gap-2">
                        <span style={{ color: ACCENT }}>✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <DrawerFooter>
                <button
                  type="button"
                  onClick={() => openOrder(selected)}
                  className="block w-full text-center font-bold text-[15px] text-white py-3.5 rounded-xl"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})` }}
                >
                  {esim.cta_label}
                </button>
                <DrawerClose asChild>
                  <button
                    type="button"
                    className="w-full text-center text-[13px] font-semibold text-gray-500 py-2"
                  >
                    Close
                  </button>
                </DrawerClose>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
      <div className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">{label}</div>
      <div className="text-[13px] font-semibold text-gray-800 mt-0.5">{value}</div>
    </div>
  );
}
