import { useEffect, useState } from 'react';
import {
  getSettings,
  putSettings,
  SiteSettings,
  FormField,
  UnauthorizedError,
  hasForbiddenWord,
} from './api';
import { Button, Card, Field, Label, TextArea, Toggle } from './ui';

const TYPE_OPTIONS = ['text', 'email', 'date', 'tel', 'number'];

export default function ApplyTab({
  onSaved,
  onError,
  onUnauthorized,
}: {
  onSaved: () => void;
  onError: (msg: string) => void;
  onUnauthorized: () => void;
}) {
  const [apply, setApply] = useState<SiteSettings['apply'] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then((d) => setApply(d.settings.apply))
      .catch((err) => {
        if (err instanceof UnauthorizedError) onUnauthorized();
        else onError(err.message);
      });
  }, [onError, onUnauthorized]);

  if (!apply) return <Card>Loading…</Card>;

  const hasForbidden =
    hasForbiddenWord(apply.title) ||
    hasForbiddenWord(apply.intro) ||
    hasForbiddenWord(apply.success_message) ||
    apply.form_fields.some((f) => hasForbiddenWord(f.label));

  const setFields = (fields: FormField[]) => setApply({ ...apply, form_fields: fields });
  const updateField = (i: number, patch: Partial<FormField>) => {
    const next = apply.form_fields.slice();
    next[i] = { ...next[i], ...patch };
    setFields(next);
  };
  const addField = () =>
    setFields([...apply.form_fields, { name: '', label: '', type: 'text', required: false }]);
  const removeField = (i: number) => setFields(apply.form_fields.filter((_, idx) => idx !== i));

  const save = async () => {
    if (hasForbidden) return;
    setSaving(true);
    try {
      await putSettings({ apply });
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
        <h2 className="font-bold text-[17px] text-gray-900 mb-4">Apply page</h2>
        <div className="flex flex-col gap-4">
          <Field label="Title" value={apply.title} onChange={(v) => setApply({ ...apply, title: v })} checkForbidden />
          <TextArea label="Intro" value={apply.intro} onChange={(v) => setApply({ ...apply, intro: v })} rows={2} checkForbidden />
          <TextArea label="Success message" value={apply.success_message} onChange={(v) => setApply({ ...apply, success_message: v })} rows={2} checkForbidden />
          <Field
            label="Success title"
            value={apply.success_title || ''}
            onChange={(v) => setApply({ ...apply, success_title: v })}
          />
          <TextArea
            label="Success email note (use {email} and {tracking})"
            value={apply.success_email_note || ''}
            onChange={(v) => setApply({ ...apply, success_email_note: v })}
            rows={2}
          />
          <Field
            label="Tracking prefix"
            value={apply.tracking_prefix || 'TEG'}
            onChange={(v) => setApply({ ...apply, tracking_prefix: v })}
          />
          <Toggle label="Force insurance" checked={apply.force_insurance} onChange={(v) => setApply({ ...apply, force_insurance: v })} />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[17px] text-gray-900">Form fields</h2>
          <Button variant="ghost" onClick={addField}>+ Add field</Button>
        </div>
        <div className="flex flex-col gap-3">
          {apply.form_fields.map((f, i) => (
            <div key={i} className="p-3 rounded-xl" style={{ border: '1px solid #e5e7eb', background: '#fafbfc' }}>
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Name (key)" value={f.name} onChange={(v) => updateField(i, { name: v })} />
                <Field label="Label" value={f.label} onChange={(v) => updateField(i, { label: v })} checkForbidden />
                <div>
                  <Label>Type</Label>
                  <select
                    value={f.type}
                    onChange={(e) => updateField(i, { type: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] outline-none bg-white"
                  >
                    {TYPE_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <Toggle label="Required" checked={f.required} onChange={(v) => updateField(i, { required: v })} />
              </div>
              <button onClick={() => removeField(i)} className="text-red-500 text-[12px] mt-2 hover:underline">
                Remove field
              </button>
            </div>
          ))}
          {apply.form_fields.length === 0 && <p className="text-gray-400 text-[13px]">No fields yet.</p>}
        </div>
      </Card>

      <div>
        <Button onClick={save} disabled={saving || hasForbidden}>{saving ? 'Saving…' : 'Save apply page'}</Button>
        {hasForbidden && (
          <p className="text-red-600 text-[12px] mt-2 font-medium">Fix the forbidden word before saving.</p>
        )}
      </div>
    </div>
  );
}
