import { useEffect, useState } from 'react';
import { getSettings, putSettings, UnauthorizedError } from './api';
import type { KnowledgeItem, KnowledgeSettings } from './api';
import { Button, Card, Field, Label, TextArea, Toggle } from './ui';

const EMPTY: KnowledgeSettings = {
  system_style: '',
  fallback_message: '',
  items: [],
};

export default function KnowledgeTab({
  onSaved,
  onError,
  onUnauthorized,
}: {
  onSaved: () => void;
  onError: (msg: string) => void;
  onUnauthorized: () => void;
}) {
  const [knowledge, setKnowledge] = useState<KnowledgeSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then((d) => setKnowledge(d.settings.knowledge ?? EMPTY))
      .catch((err) => {
        if (err instanceof UnauthorizedError) onUnauthorized();
        else onError(err.message);
      });
  }, [onError, onUnauthorized]);

  if (!knowledge) return <Card>Loading…</Card>;

  const updateItem = (idx: number, patch: Partial<KnowledgeItem>) => {
    const items = [...knowledge.items];
    items[idx] = { ...items[idx], ...patch };
    setKnowledge({ ...knowledge, items });
  };

  const addItem = () => {
    const id = `k_${Date.now().toString(36)}`;
    setKnowledge({
      ...knowledge,
      items: [
        ...knowledge.items,
        {
          id,
          question: '',
          answer: '',
          tags: [],
          sort: knowledge.items.length + 1,
          active: true,
        },
      ],
    });
  };

  const removeItem = (idx: number) => {
    setKnowledge({
      ...knowledge,
      items: knowledge.items.filter((_, i) => i !== idx),
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await putSettings({ knowledge });
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
        <h2 className="font-bold text-[17px] text-gray-900 mb-1">AI knowledge bank</h2>
        <p className="text-[12px] text-gray-500 mb-4">
          Approved answers the assistant may use. Matched by keywords/tags with the visitor question,
          then combined with country facts. Not shown in the public settings JSON.
        </p>
        <TextArea
          label="System style (how the assistant should speak)"
          value={knowledge.system_style}
          onChange={(v) => setKnowledge({ ...knowledge, system_style: v })}
          rows={3}
        />
        <div className="mt-3">
          <TextArea
            label="Fallback when no verified answer exists"
            value={knowledge.fallback_message}
            onChange={(v) => setKnowledge({ ...knowledge, fallback_message: v })}
            rows={2}
          />
        </div>
      </Card>

      {knowledge.items
        .slice()
        .sort((a, b) => a.sort - b.sort)
        .map((item) => {
          const idx = knowledge.items.findIndex((x) => x.id === item.id);
          return (
            <Card key={item.id}>
              <div className="flex items-center justify-between mb-3">
                <Label>Q&A #{item.sort || idx + 1}</Label>
                <div className="flex items-center gap-3">
                  <Toggle
                    label="Active"
                    checked={item.active !== false}
                    onChange={(v) => updateItem(idx, { active: v })}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="text-[12px] font-semibold text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="grid md:grid-cols-[1fr_100px] gap-3 mb-3">
                <Field
                  label="Question / topic"
                  value={item.question}
                  onChange={(v) => updateItem(idx, { question: v })}
                />
                <Field
                  label="Sort"
                  type="number"
                  value={String(item.sort ?? 0)}
                  onChange={(v) => updateItem(idx, { sort: Number(v) || 0 })}
                />
              </div>
              <TextArea
                label="Approved answer"
                value={item.answer}
                onChange={(v) => updateItem(idx, { answer: v })}
                rows={4}
              />
              <div className="mt-3">
                <Field
                  label="Tags (comma separated — insurance, esim, schengen…)"
                  value={(item.tags || []).join(', ')}
                  onChange={(v) =>
                    updateItem(idx, {
                      tags: v
                        .split(',')
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
            </Card>
          );
        })}

      <div className="flex gap-3">
        <Button onClick={addItem} variant="ghost">
          + Add Q&A
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save knowledge'}
        </Button>
      </div>
    </div>
  );
}
