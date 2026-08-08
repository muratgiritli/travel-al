import StaticPageShell from '@/components/StaticPageShell';
import { useSettings } from '@/lib/settings';

export default function TermsPage() {
  const { settings } = useSettings();
  return (
    <StaticPageShell title="Terms of Service">
      <p className="mb-3">
        By using {settings.brand.site_name}, you agree to these terms. We provide independent travel
        assistance and information about Türkiye entry requirements, insurance, and eSIM products.
      </p>
      <p className="mb-3">
        We are not a government website. Final entry decisions rest with border authorities.
        Information is provided for guidance and may change; always verify official requirements
        before travel.
      </p>
      <p className="mb-3">
        Application, insurance, and eSIM purchases are subject to the product terms shown at
        checkout. Fees paid for consultancy or processing services are described on the relevant
        offer cards.
      </p>
      <p>
        If you do not agree with these terms, please do not use the service. For questions, visit
        Contact.
      </p>
    </StaticPageShell>
  );
}
