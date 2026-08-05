import { useEffect, useState } from 'react';
import { getSettings, putSettings, SiteSettings, UnauthorizedError, hasForbiddenWord } from './api';
import { Button, Card, TextArea } from './ui';

const FIELDS: { key: keyof SiteSettings['chat']; label: string }[] = [
  { key: 'welcome_message', label: 'Welcome message' },
  { key: 'passport_selected_message', label: 'Passport selected message' },
  { key: 'insurance_required_message', label: 'Insurance required message' },
  { key: 'bottom_disclaimer', label: 'Bottom disclaimer' },
  { key: 'faq_text', label: 'FAQ text' },
  { key: 'track_text', label: 'Track text' },
  { key: 'contact_text', label: 'Contact text' },
];

export default function ChatTab({
  onSaved,
  onError,
  onUnauthorized,
}: {
  onSaved: () => void;
  onError: (msg: string) => void;
  onUnauthorized: () => void;
}) {
  const [chat, setChat] = useState<SiteSettings['chat'] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then((d) => setChat(d.settings.chat))
      .catch((err) => {
        if (err instanceof UnauthorizedError) onUnauthorized();
        else onError(err.message);
      });
  }, [onError, onUnauthorized]);

  if (!chat) return <Card>Loading…</Card>;

  const hasForbidden = FIELDS.some((f) => hasForbiddenWord(chat[f.key]));

  const save = async () => {
    if (hasForbidden) return;
    setSaving(true);
    try {
      await putSettings({ chat });
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
        <h2 className="font-bold text-[17px] text-gray-900 mb-4">Chat & Copy</h2>
        <div className="flex flex-col gap-4">
          {FIELDS.map((f) => (
            <TextArea
              key={f.key}
              label={f.label}
              value={chat[f.key]}
              onChange={(v) => setChat({ ...chat, [f.key]: v })}
              rows={2}
              checkForbidden
            />
          ))}
        </div>
      </Card>
      <div>
        <Button onClick={save} disabled={saving || hasForbidden}>
          {saving ? 'Saving…' : 'Save copy'}
        </Button>
        {hasForbidden && (
          <p className="text-red-600 text-[12px] mt-2 font-medium">
            Fix the forbidden word before saving.
          </p>
        )}
      </div>
    </div>
  );
}
