import { useEffect, useState } from 'react';
import { getSettings, putSettings, SiteSettings, UnauthorizedError, hasForbiddenWord } from './api';
import { Button, Card, Field } from './ui';

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

  useEffect(() => {
    getSettings()
      .then((d) => setBrand(d.settings.brand))
      .catch((err) => {
        if (err instanceof UnauthorizedError) onUnauthorized();
        else onError(err.message);
      });
  }, [onError, onUnauthorized]);

  if (!brand) return <Card>Loading…</Card>;

  const hasForbidden =
    hasForbiddenWord(brand.site_name) || hasForbiddenWord(brand.footer_text);

  const set = (k: keyof typeof brand, v: string) => setBrand({ ...brand, [k]: v });

  const save = async () => {
    if (hasForbidden) return;
    setSaving(true);
    try {
      await putSettings({ brand });
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
      <div>
        <Button onClick={save} disabled={saving || hasForbidden}>{saving ? 'Saving…' : 'Save brand'}</Button>
        {hasForbidden && (
          <p className="text-red-600 text-[12px] mt-2 font-medium">Fix the forbidden word before saving.</p>
        )}
      </div>
    </div>
  );
}
