import { useEffect, useState } from 'react';
import { getSettings, putSettings, SiteSettings, UnauthorizedError } from './api';
import { clearSettingsCache } from '@/lib/settings';
import { Button, Card, Field, TextArea } from './ui';

/**
 * Seller identity, policy copy and third-party integrations.
 *
 * Selling online from Türkiye requires the seller's legal details and a
 * cancellation policy to be published. Blank fields are hidden on the public
 * pages rather than filled with placeholder text.
 */
export default function LegalTab({
  onSaved,
  onError,
  onUnauthorized,
}: {
  onSaved: () => void;
  onError: (msg: string) => void;
  onUnauthorized: () => void;
}) {
  const [legal, setLegal] = useState<SiteSettings['legal'] | null>(null);
  const [integrations, setIntegrations] = useState<SiteSettings['integrations'] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSettings()
      .then((d) => {
        setLegal(d.settings.legal);
        setIntegrations(d.settings.integrations);
      })
      .catch((err) => {
        if (err instanceof UnauthorizedError) onUnauthorized();
        else onError(err.message);
      });
  }, [onError, onUnauthorized]);

  if (!legal || !integrations) return <Card>Loading…</Card>;

  const setL = (k: keyof typeof legal, v: string) => setLegal({ ...legal, [k]: v });
  const setI = (k: keyof typeof integrations, v: string) =>
    setIntegrations({ ...integrations, [k]: v });

  const save = async () => {
    setSaving(true);
    try {
      await putSettings({ legal, integrations });
      clearSettingsCache();
      onSaved();
    } catch (err) {
      if (err instanceof UnauthorizedError) onUnauthorized();
      else onError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-bold text-[17px] text-gray-900 mb-1">Seller details</h2>
        <p className="text-[13px] text-gray-500 mb-3">
          Shown on the Privacy, Refunds and Distance Sales pages. Fields left blank are hidden.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Trading name" value={legal.company_name} onChange={(v) => setL('company_name', v)} />
          <Field label="Registered legal name" value={legal.legal_name} onChange={(v) => setL('legal_name', v)} />
          <Field label="Tax office" value={legal.tax_office} onChange={(v) => setL('tax_office', v)} />
          <Field label="Tax number" value={legal.tax_number} onChange={(v) => setL('tax_number', v)} />
          <Field label="MERSIS number" value={legal.mersis_no} onChange={(v) => setL('mersis_no', v)} />
          <Field label="Trade registry number" value={legal.trade_registry_no} onChange={(v) => setL('trade_registry_no', v)} />
          <Field label="Contact email" value={legal.email} onChange={(v) => setL('email', v)} />
          <Field label="Contact phone" value={legal.phone} onChange={(v) => setL('phone', v)} />
        </div>
        <div className="mt-3">
          <TextArea label="Registered address" value={legal.address} onChange={(v) => setL('address', v)} rows={2} />
        </div>
      </Card>

      <Card>
        <h2 className="font-bold text-[17px] text-gray-900 mb-4">Policies</h2>
        <TextArea
          label="Cancellation and refund policy"
          value={legal.refund_policy}
          onChange={(v) => setL('refund_policy', v)}
          rows={7}
          placeholder="Blank leaves the Refunds page showing a 'not published yet' notice."
        />
        <div className="mt-3">
          <TextArea
            label="Distance sales agreement"
            value={legal.distance_sales_agreement}
            onChange={(v) => setL('distance_sales_agreement', v)}
            rows={9}
          />
        </div>
        <div className="mt-3">
          <TextArea
            label="KVKK / GDPR notice (added to the Privacy page)"
            value={legal.kvkk_notice}
            onChange={(v) => setL('kvkk_notice', v)}
            rows={6}
          />
        </div>
        <div className="mt-3">
          <TextArea
            label="Cookie notice text"
            value={legal.cookie_notice}
            onChange={(v) => setL('cookie_notice', v)}
            rows={3}
          />
        </div>
      </Card>

      <Card>
        <h2 className="font-bold text-[17px] text-gray-900 mb-4">Integrations</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Plausible analytics domain"
            value={integrations.plausible_domain}
            onChange={(v) => setI('plausible_domain', v)}
            placeholder="turkiyetraveloffice.com"
          />
          <Field
            label="WhatsApp number (digits only)"
            value={integrations.whatsapp_number}
            onChange={(v) => setI('whatsapp_number', v)}
            placeholder="905551112233"
          />
        </div>
        <div className="mt-3">
          <Field
            label="WhatsApp prefilled message"
            value={integrations.whatsapp_message}
            onChange={(v) => setI('whatsapp_message', v)}
          />
        </div>
        <p className="text-[12px] text-gray-500 mt-3">
          Analytics and the support button stay hidden until these are filled in.
        </p>
      </Card>

      <Button onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}
