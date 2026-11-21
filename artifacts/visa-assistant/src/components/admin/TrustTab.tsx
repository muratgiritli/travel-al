import { useEffect, useState } from 'react';
import { getSettings, putSettings, UnauthorizedError } from './api';
import type { FaqItem, TrustLine, TrustSettings } from '@/lib/settings';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { Button, Card, Field, Label, Toggle } from './ui';

export default function TrustTab({
  onSaved,
  onError,
  onUnauthorized,
}: {
  onSaved: () => void;
  onError: (msg: string) => void;
  onUnauthorized: () => void;
}) {
  const [trust, setTrust] = useState<TrustSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then((d) => setTrust(d.settings.trust ?? DEFAULT_SETTINGS.trust))
      .catch((err) => {
        if (err instanceof UnauthorizedError) onUnauthorized();
        else onError(err.message);
      });
  }, [onError, onUnauthorized]);

  if (!trust) return <Card>Loading…</Card>;

  const num = (v: string) => (v === '' ? 0 : Number(v));

  const updateLine = (idx: number, patch: Partial<TrustLine>) => {
    const trust_lines = [...trust.trust_lines];
    trust_lines[idx] = { ...trust_lines[idx], ...patch };
    setTrust({ ...trust, trust_lines });
  };

  const updateFaq = (idx: number, patch: Partial<FaqItem>) => {
    const faq = [...trust.faq];
    faq[idx] = { ...faq[idx], ...patch };
    setTrust({ ...trust, faq });
  };

  const save = async () => {
    setSaving(true);
    try {
      await putSettings({ trust });
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
        <h2 className="font-bold text-[17px] text-gray-900 mb-1">Why us / trust lines</h2>
        <p className="text-[12px] text-gray-500 mb-4">
          Short lines under the chat composer. Keep it to 2–3 lines.
        </p>
        <Field
          label="Section title (optional, unused in footer)"
          value={trust.trust_title}
          onChange={(v) => setTrust({ ...trust, trust_title: v })}
        />
        <div className="flex flex-col gap-3 mt-4">
          {trust.trust_lines.map((line, i) => (
            <div
              key={line.id}
              className="p-3 rounded-xl grid md:grid-cols-[1fr_80px_auto] gap-2 items-end"
              style={{ border: '1px solid #e5e7eb', background: '#fafbfc' }}
            >
              <Field
                label="Text"
                value={line.text}
                onChange={(v) => updateLine(i, { text: v })}
              />
              <Field
                label="Sort"
                type="number"
                value={String(line.sort)}
                onChange={(v) => updateLine(i, { sort: num(v) })}
              />
              <div className="pb-1">
                <Toggle
                  label="Active"
                  checked={line.active !== false}
                  onChange={(v) => updateLine(i, { active: v })}
                />
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          className="mt-3"
          onClick={() =>
            setTrust({
              ...trust,
              trust_lines: [
                ...trust.trust_lines,
                {
                  id: `t${Date.now()}`,
                  text: 'New trust line',
                  sort: trust.trust_lines.length + 1,
                  active: true,
                },
              ],
            })
          }
        >
          + Add trust line
        </Button>
      </Card>

      <Card>
        <h2 className="font-bold text-[17px] text-gray-900 mb-1">FAQ</h2>
        <p className="text-[12px] text-gray-500 mb-4">
          Collapsible FAQ under the chat. Short questions work best.
        </p>
        <Field
          label="FAQ title"
          value={trust.faq_title}
          onChange={(v) => setTrust({ ...trust, faq_title: v })}
        />
        <div className="flex flex-col gap-3 mt-4">
          {trust.faq.map((item, i) => (
            <div
              key={item.id}
              className="p-3 rounded-xl"
              style={{ border: '1px solid #e5e7eb', background: '#fafbfc' }}
            >
              <div className="flex items-center justify-between mb-2">
                <Toggle
                  label="Active"
                  checked={item.active !== false}
                  onChange={(v) => updateFaq(i, { active: v })}
                />
                <button
                  type="button"
                  className="text-[12px] font-semibold text-red-500"
                  onClick={() =>
                    setTrust({ ...trust, faq: trust.faq.filter((_, idx) => idx !== i) })
                  }
                >
                  Delete
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <Field
                  label="Question"
                  value={item.question}
                  onChange={(v) => updateFaq(i, { question: v })}
                />
                <Field
                  label="Sort"
                  type="number"
                  value={String(item.sort)}
                  onChange={(v) => updateFaq(i, { sort: num(v) })}
                />
              </div>
              <div className="mt-3">
                <Label>Answer</Label>
                <textarea
                  className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-[13px] min-h-[80px]"
                  value={item.answer}
                  onChange={(e) => updateFaq(i, { answer: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          className="mt-3"
          onClick={() =>
            setTrust({
              ...trust,
              faq: [
                ...trust.faq,
                {
                  id: `f${Date.now()}`,
                  question: 'New question?',
                  answer: '',
                  sort: trust.faq.length + 1,
                  active: true,
                },
              ],
            })
          }
        >
          + Add FAQ
        </Button>
      </Card>

      <div>
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save trust & FAQ'}
        </Button>
      </div>
    </div>
  );
}
