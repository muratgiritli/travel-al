import { useSettings } from '@/lib/settings';
import { useI18n } from '@/lib/i18n';

/**
 * Seller identity block required on legal pages for distance selling.
 * Renders nothing until the details are filled in from admin, so the site
 * never shows invented company information.
 */
export default function SellerInfo() {
  const { settings } = useSettings();
  const { t } = useI18n();
  const l = settings.legal;

  const rows: [string, string][] = [
    ['Title', l.legal_name || l.company_name],
    ['Address', l.address],
    ['Tax office', l.tax_office],
    ['Tax number', l.tax_number],
    ['MERSIS', l.mersis_no],
    ['Trade registry', l.trade_registry_no],
    ['Email', l.email],
    ['Phone', l.phone],
  ].filter(([, value]) => Boolean(value)) as [string, string][];

  if (rows.length === 0) return null;

  return (
    <div
      className="mt-5 rounded-xl px-4 py-3.5"
      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
        {t('legal.sellerInfo')}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
        {rows.map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-gray-500">{label}</dt>
            <dd className="text-gray-800 break-words">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
