import StaticPageShell from '@/components/StaticPageShell';
import SellerInfo from '@/components/SellerInfo';
import { useSettings } from '@/lib/settings';
import { useI18n } from '@/lib/i18n';

export default function DistanceSalesPage() {
  const { settings } = useSettings();
  const { t } = useI18n();
  const agreement = settings.legal.distance_sales_agreement.trim();

  return (
    <StaticPageShell title="Distance Sales Agreement">
      {agreement ? (
        agreement.split(/\n{2,}/).map((para, i) => (
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
