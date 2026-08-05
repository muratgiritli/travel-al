import { OptionCard } from './api';
import { Button, Field, Label, TextArea, Toggle } from './ui';

// Editor for a country's option cards (add / remove / reorder via sort field).
export default function OptionCardsEditor({
  cards,
  onChange,
}: {
  cards: OptionCard[];
  onChange: (cards: OptionCard[]) => void;
}) {
  const update = (i: number, patch: Partial<OptionCard>) => {
    const next = cards.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(cards.filter((_, idx) => idx !== i));
  const add = () =>
    onChange([
      ...cards,
      {
        id: `card-${Date.now().toString(36)}`,
        title: '',
        description: '',
        price: 0,
        sort: (cards.reduce((m, c) => Math.max(m, c.sort ?? 0), 0) || 0) + 1,
        active: true,
        cta_label: 'APPLY NOW',
        cta_href: '/next',
      },
    ]);

  const num = (v: string) => (v === '' ? 0 : Number(v));

  // Sorted view (does not mutate order in state — sort field controls display).
  const ordered = cards
    .map((c, idx) => ({ c, idx }))
    .sort((a, b) => (a.c.sort ?? 0) - (b.c.sort ?? 0));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Label>Option cards</Label>
        <Button variant="ghost" onClick={add}>+ Add card</Button>
      </div>
      <div className="flex flex-col gap-3">
        {ordered.map(({ c, idx }) => (
          <div key={c.id || idx} className="p-3 rounded-xl" style={{ border: '1px solid #e5e7eb', background: '#fafbfc' }}>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Title" value={c.title} onChange={(v) => update(idx, { title: v })} checkForbidden />
              <Field label="Sort" type="number" value={String(c.sort ?? 0)} onChange={(v) => update(idx, { sort: num(v) })} />
            </div>
            <div className="mt-3">
              <TextArea label="Description" value={c.description} onChange={(v) => update(idx, { description: v })} rows={2} checkForbidden />
            </div>
            <div className="mt-3">
              <TextArea label="Condition" value={c.condition ?? ''} onChange={(v) => update(idx, { condition: v })} rows={2} checkForbidden />
            </div>
            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <Field
                label="Eligible tags (comma-separated)"
                value={(c.eligible_tags ?? []).join(', ')}
                onChange={(v) =>
                  update(idx, {
                    eligible_tags: v.split(',').map((s) => s.trim()).filter(Boolean),
                  })
                }
              />
              <Field label="Price" type="number" value={String(c.price ?? 0)} onChange={(v) => update(idx, { price: num(v) })} />
              <Field label="Currency" value={c.currency ?? ''} onChange={(v) => update(idx, { currency: v })} />
              <Field label="CTA label" value={c.cta_label} onChange={(v) => update(idx, { cta_label: v })} checkForbidden />
              <Field label="CTA href (internal, must start with /)" value={c.cta_href} onChange={(v) => update(idx, { cta_href: v })} />
            </div>
            <div className="mt-3">
              <TextArea
                label="Bullets (one per line)"
                value={(c.bullets ?? []).join('\n')}
                onChange={(v) => update(idx, { bullets: v.split('\n').map((s) => s.trim()).filter(Boolean) })}
                rows={2}
                checkForbidden
              />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Toggle label="Active" checked={c.active} onChange={(v) => update(idx, { active: v })} />
              <button onClick={() => remove(idx)} className="text-red-500 text-[12px] hover:underline">
                Remove card
              </button>
            </div>
          </div>
        ))}
        {cards.length === 0 && <p className="text-gray-400 text-[13px]">No option cards. Category defaults will be used.</p>}
      </div>
    </div>
  );
}
