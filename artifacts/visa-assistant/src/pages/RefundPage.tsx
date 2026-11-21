import StaticPageShell from '@/components/StaticPageShell';
import SellerInfo from '@/components/SellerInfo';
import { useSettings } from '@/lib/settings';
import { useI18n } from '@/lib/i18n';

export default function RefundPage() {
  const { settings } = useSettings();
  const { t } = useI18n();
  const policy = settings.legal.refund_policy.trim();

  return (
    <StaticPageShell title="Cancellation and Refunds">
      {policy ? (
        policy.split(/\n{2,}/).map((para, i) => (
          <p key={i} className="mb-3 whitespace-pre-line">
            {para}
          </p>
        ))
      ) : (
        <p className="mb-3">{t('legal.notPublished')}</p>
      )}
      <SellerInfo />
    </StaticPageShell>
  );
}
