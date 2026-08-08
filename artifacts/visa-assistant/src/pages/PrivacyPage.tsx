import StaticPageShell from '@/components/StaticPageShell';
import { useSettings } from '@/lib/settings';

export default function PrivacyPage() {
  const { settings } = useSettings();
  return (
    <StaticPageShell title="Privacy Policy">
      <p className="mb-3">
        {settings.brand.site_name} (“we”) processes personal information you submit to provide entry
        guidance, insurance, eSIM, and application support related to travel to Türkiye.
      </p>
      <p className="mb-3">
        Data we may collect includes your name, email, passport details, travel dates, and messages
        you send in chat. We use this information to process your request and contact you about your
        application.
      </p>
      <p className="mb-3">
        We do not sell your personal data. Payment processing, when enabled, is handled by
        PCI-DSS compliant providers over 256-bit SSL encryption.
      </p>
      <p>
        For privacy questions, use the Contact page. This policy may be updated; the latest version
        is always available on this page.
      </p>
    </StaticPageShell>
  );
}
