import { useEffect, useState } from 'react';
import { getSettings, putSettings, UnauthorizedError, hasForbiddenWord } from './api';
import type { ContentSettings } from '@/lib/settings';
import { DEFAULT_SETTINGS, clearSettingsCache } from '@/lib/settings';
import { Button, Card, Field, TextArea } from './ui';

function anyForbidden(content: ContentSettings): boolean {
  const strings: string[] = [
    content.welcome_title,
    content.select_hint,
    content.type_country_placeholder,
    content.start_typing_hint,
    content.choose_service_label,
    content.ask_placeholder,
    content.status_line,
    content.insurance_badge,
    ...Object.values(content.services),
    ...Object.values(content.category_lines),
    ...Object.values(content.country_card),
    content.insurance.title,
    content.insurance.daily_label,
    content.insurance.per_day_label,
    content.insurance.important_title,
    content.insurance.important_note,
    content.insurance.cta_label,
    ...(content.insurance.features || []),
    ...content.insurance.paragraphs,
    content.esim_page.headline,
    content.esim_page.body,
    content.esim_page.choose_label,
    content.esim_page.unavailable,
    content.esim_page.details_label,
    ...content.esim_page.bullets,
  ];
  return strings.some((s) => hasForbiddenWord(s));
}

export default function ContentTab({
  onSaved,
  onError,
  onUnauthorized,
}: {
  onSaved: () => void;
  onError: (msg: string) => void;
  onUnauthorized: () => void;
}) {
  const [content, setContent] = useState<ContentSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then((d) => setContent(d.settings.content ?? DEFAULT_SETTINGS.content))
      .catch((err) => {
        if (err instanceof UnauthorizedError) onUnauthorized();
        else onError(err.message);
      });
  }, [onError, onUnauthorized]);

  if (!content) return <Card>Loading…</Card>;

  const forbidden = anyForbidden(content);

  const set = <K extends keyof ContentSettings>(key: K, value: ContentSettings[K]) => {
    setContent({ ...content, [key]: value });
  };

  const setService = (key: keyof ContentSettings['services'], value: string) => {
    setContent({ ...content, services: { ...content.services, [key]: value } });
  };

  const setCat = (key: keyof ContentSettings['category_lines'], value: string) => {
    setContent({ ...content, category_lines: { ...content.category_lines, [key]: value } });
  };

  const setCountry = (key: keyof ContentSettings['country_card'], value: string) => {
    setContent({ ...content, country_card: { ...content.country_card, [key]: value } });
  };

  const setIns = <K extends keyof ContentSettings['insurance']>(
    key: K,
    value: ContentSettings['insurance'][K],
  ) => {
    setContent({ ...content, insurance: { ...content.insurance, [key]: value } });
  };

  const setEsim = <K extends keyof ContentSettings['esim_page']>(
    key: K,
    value: ContentSettings['esim_page'][K],
  ) => {
    setContent({ ...content, esim_page: { ...content.esim_page, [key]: value } });
  };

  const save = async () => {
    if (forbidden) return;
    setSaving(true);
    try {
      await putSettings({ content });
      clearSettingsCache();
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
        <h2 className="font-bold text-[17px] text-gray-900 mb-1">Welcome & chat chrome</h2>
        <p className="text-[12px] text-gray-500 mb-4">
          All visitor-facing conversation copy. Nothing here is hardcoded in the site bundle.
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Welcome title" value={content.welcome_title} onChange={(v) => set('welcome_title', v)} checkForbidden />
          <Field label="Status line" value={content.status_line} onChange={(v) => set('status_line', v)} checkForbidden />
          <Field label="Select hint" value={content.select_hint} onChange={(v) => set('select_hint', v)} checkForbidden />
          <Field label="Choose service label" value={content.choose_service_label} onChange={(v) => set('choose_service_label', v)} checkForbidden />
          <Field label="Type country placeholder" value={content.type_country_placeholder} onChange={(v) => set('type_country_placeholder', v)} checkForbidden />
          <Field label="Ask placeholder" value={content.ask_placeholder} onChange={(v) => set('ask_placeholder', v)} checkForbidden />
          <Field label="Insurance badge" value={content.insurance_badge} onChange={(v) => set('insurance_badge', v)} checkForbidden />
          <Field label="Start typing hint" value={content.start_typing_hint} onChange={(v) => set('start_typing_hint', v)} checkForbidden />
        </div>
      </Card>

      <Card>
        <h2 className="font-bold text-[17px] text-gray-900 mb-4">Service hub labels</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {(
            [
              ['entry_title', 'Entry title'],
              ['entry_subtitle', 'Entry subtitle'],
              ['entry_title_free', 'Entry title (free)'],
              ['entry_subtitle_free', 'Entry subtitle (free)'],
              ['entry_title_sticker', 'Entry title (sticker)'],
              ['entry_subtitle_sticker', 'Entry subtitle (sticker)'],
              ['entry_title_direct', 'Entry title (direct)'],
              ['entry_subtitle_direct', 'Entry subtitle (direct)'],
              ['insurance_title', 'Insurance title'],
              ['insurance_subtitle', 'Insurance subtitle'],
              ['esim_title', 'eSIM title'],
              ['esim_subtitle', 'eSIM subtitle'],
            ] as const
          ).map(([key, label]) => (
            <Field
              key={key}
              label={label}
              value={content.services[key]}
              onChange={(v) => setService(key, v)}
              checkForbidden
            />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-bold text-[17px] text-gray-900 mb-4">Category support lines</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {(
            [
              ['entry_free', 'Entry free'],
              ['e_permit_direct', 'e-Permit direct'],
              ['e_permit_conditional', 'e-Permit conditional'],
              ['age_special', 'Age special'],
              ['sticker_mission', 'Sticker mission'],
              ['default', 'Default'],
            ] as const
          ).map(([key, label]) => (
            <Field
              key={key}
              label={label}
              value={content.category_lines[key]}
              onChange={(v) => setCat(key, v)}
              checkForbidden
            />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-bold text-[17px] text-gray-900 mb-4">Country card defaults</h2>
        <div className="grid md:grid-cols-2 gap-3">
          {(Object.keys(content.country_card) as (keyof ContentSettings['country_card'])[]).map((key) => (
            <Field
              key={key}
              label={key.replace(/_/g, ' ')}
              value={content.country_card[key]}
              onChange={(v) => setCountry(key, v)}
              checkForbidden
            />
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-bold text-[17px] text-gray-900 mb-4">Insurance panel</h2>
        <div className="grid md:grid-cols-2 gap-3 mb-3">
          <Field label="Title" value={content.insurance.title} onChange={(v) => setIns('title', v)} checkForbidden />
          <Field label="Daily label" value={content.insurance.daily_label} onChange={(v) => setIns('daily_label', v)} checkForbidden />
          <Field label="Per day label" value={content.insurance.per_day_label} onChange={(v) => setIns('per_day_label', v)} checkForbidden />
          <Field label="CTA" value={content.insurance.cta_label} onChange={(v) => setIns('cta_label', v)} checkForbidden />
        </div>
        <TextArea
          label="Features (one per line, optional emoji prefix)"
          value={(content.insurance.features || []).join('\n')}
          onChange={(v) =>
            setIns(
              'features',
              v.split('\n').map((s) => s.trim()).filter(Boolean),
            )
          }
          rows={5}
          checkForbidden
        />
        <div className="mt-3">
          <Field
            label="Important title"
            value={content.insurance.important_title}
            onChange={(v) => setIns('important_title', v)}
            checkForbidden
          />
        </div>
        <div className="mt-3">
          <TextArea
            label="Important paragraphs (one per line)"
            value={content.insurance.paragraphs.join('\n')}
            onChange={(v) =>
              setIns(
                'paragraphs',
                v.split('\n').map((s) => s.trim()).filter(Boolean),
              )
            }
            rows={6}
            checkForbidden
          />
        </div>
        <div className="mt-3">
          <TextArea
            label="Important note"
            value={content.insurance.important_note}
            onChange={(v) => setIns('important_note', v)}
            rows={2}
            checkForbidden
          />
        </div>
      </Card>

      <Card>
        <h2 className="font-bold text-[17px] text-gray-900 mb-4">eSIM page copy</h2>
        <div className="grid md:grid-cols-2 gap-3 mb-3">
          <Field label="Headline" value={content.esim_page.headline} onChange={(v) => setEsim('headline', v)} checkForbidden />
          <Field label="Choose label" value={content.esim_page.choose_label} onChange={(v) => setEsim('choose_label', v)} checkForbidden />
          <Field label="Details label" value={content.esim_page.details_label} onChange={(v) => setEsim('details_label', v)} checkForbidden />
          <Field label="Unavailable" value={content.esim_page.unavailable} onChange={(v) => setEsim('unavailable', v)} checkForbidden />
        </div>
        <TextArea
          label="Body"
          value={content.esim_page.body}
          onChange={(v) => setEsim('body', v)}
          rows={3}
          checkForbidden
        />
        <div className="mt-3">
          <TextArea
            label="Bullets (one per line)"
            value={content.esim_page.bullets.join('\n')}
            onChange={(v) =>
              setEsim(
                'bullets',
                v.split('\n').map((s) => s.trim()).filter(Boolean),
              )
            }
            rows={5}
            checkForbidden
          />
        </div>
      </Card>

      <div>
        <Button onClick={save} disabled={saving || forbidden}>
          {saving ? 'Saving…' : 'Save content'}
        </Button>
        {forbidden && (
          <p className="text-red-600 text-[12px] mt-2 font-medium">
            Fix the forbidden word before saving.
          </p>
        )}
      </div>
    </div>
  );
}
