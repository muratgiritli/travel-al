import StaticPageShell from '@/components/StaticPageShell';
import { useSettings } from '@/lib/settings';

export default function ContactPage() {
  const { settings } = useSettings();
  return (
    <StaticPageShell title="Contact">
      <p>{settings.chat.contact_text}</p>
      <p className="mt-3 text-[13px] text-gray-500">
        For application help, reply to your confirmation email or use Track Application with your
        tracking number.
      </p>
    </StaticPageShell>
  );
}
