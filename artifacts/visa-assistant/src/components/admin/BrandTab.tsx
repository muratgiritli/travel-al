import { useEffect, useRef, useState } from 'react';
import { getSettings, putSettings, SiteSettings, UnauthorizedError, hasForbiddenWord } from './api';
import { clearSettingsCache } from '@/lib/settings';
import { Button, Card, Field, Label } from './ui';

const DEFAULT_WELCOME_BG = '/istanbul-welcome-bg.jpg';
const MAX_UPLOAD_BYTES = 1.8 * 1024 * 1024; // ~1.8 MB

export default function BrandTab({
  onSaved,
  onError,
  onUnauthorized,
}: {
  onSaved: () => void;
  onError: (msg: string) => void;
  onUnauthorized: () => void;
}) {
  const [brand, setBrand] = useState<SiteSettings['brand'] | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSettings()
      .then((d) =>
        setBrand({
          ...d.settings.brand,
          welcome_bg_url: d.settings.brand.welcome_bg_url || DEFAULT_WELCOME_BG,
        }),
      )
      .catch((err) => {
        if (err instanceof UnauthorizedError) onUnauthorized();
        else onError(err.message);
      });
  }, [onError, onUnauthorized]);

  if (!brand) return <Card>Loading…</Card>;

  const hasForbidden =
    hasForbiddenWord(brand.site_name) || hasForbiddenWord(brand.footer_text);

  const set = (k: keyof typeof brand, v: string) => setBrand({ ...brand, [k]: v });
  const previewSrc = brand.welcome_bg_url?.trim() || DEFAULT_WELCOME_BG;

  const onFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError('Please choose an image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      onError('Image is too large. Use a file under ~1.8 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        onError('Could not read image.');
        return;
      }
      setBrand({ ...brand, welcome_bg_url: result });
    };
    reader.onerror = () => onError('Could not read image.');
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (hasForbidden) return;
    setSaving(true);
    try {
      await putSettings({ brand });
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
        <h2 className="font-bold text-[17px] text-gray-900 mb-4">Brand</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Site name" value={brand.site_name} onChange={(v) => set('site_name', v)} checkForbidden />
          <Field label="Logo emoji" value={brand.logo_emoji} onChange={(v) => set('logo_emoji', v)} />
          <Field label="Logo URL" value={brand.logo_url} onChange={(v) => set('logo_url', v)} />
          <Field label="Favicon URL" value={brand.favicon_url} onChange={(v) => set('favicon_url', v)} />
        </div>
        <div className="mt-4">
          <Field label="Footer text" value={brand.footer_text} onChange={(v) => set('footer_text', v)} checkForbidden />
        </div>
      </Card>

      <Card>
        <h2 className="font-bold text-[17px] text-gray-900 mb-1">Welcome background</h2>
        <p className="text-[12px] text-gray-500 mb-4">
          Shown only on the empty welcome screen (before passport country is selected). Upload an
          image or paste a URL.
        </p>

        <div
          className="rounded-xl overflow-hidden mb-4 h-40 bg-gray-100"
          style={{ border: '1px solid #e5e7eb' }}
        >
          <img
            src={previewSrc}
            alt="Welcome background preview"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <Button variant="ghost" onClick={() => fileRef.current?.click()}>
            Upload image
          </Button>
          <Button
            variant="ghost"
            onClick={() => setBrand({ ...brand, welcome_bg_url: DEFAULT_WELCOME_BG })}
          >
            Reset to default Istanbul
          </Button>
        </div>

        <div>
          <Label>Image URL</Label>
          {brand.welcome_bg_url?.startsWith('data:') ? (
            <p className="text-[12px] text-gray-500 mt-1">
              Uploaded image ready — click <strong>Save brand</strong>. Prefer JPG under 1 MB.
              Or{' '}
              <button
                type="button"
                className="underline font-semibold text-gray-700"
                onClick={() => set('welcome_bg_url', DEFAULT_WELCOME_BG)}
              >
                clear upload
              </button>{' '}
              and paste a URL.
            </p>
          ) : (
            <input
              value={brand.welcome_bg_url || ''}
              onChange={(e) => set('welcome_bg_url', e.target.value)}
              placeholder="/istanbul-welcome-bg.jpg or https://…"
              className="w-full mt-1 border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] outline-none bg-white"
            />
          )}
        </div>
      </Card>

      <div>
        <Button onClick={save} disabled={saving || hasForbidden}>
          {saving ? 'Saving…' : 'Save brand'}
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
