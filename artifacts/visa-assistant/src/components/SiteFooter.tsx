import { Link } from 'wouter';
import { useI18n } from '@/lib/i18n';

export default function SiteFooter() {
  const { t } = useI18n();
  const LINKS: { href: string; label: string }[] = [
    { href: '/faq', label: t('footer.faq') },
    { href: '/contact', label: t('footer.contact') },
    { href: '/privacy', label: t('footer.privacy') },
    { href: '/terms', label: t('footer.terms') },
    { href: '/track', label: t('footer.track') },
  ];

  return (
    <div className="px-1 pt-2 pb-1">
      <nav className="flex flex-nowrap items-center justify-center gap-1.5 overflow-x-auto text-[10px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
        {LINKS.map((l, i) => (
          <span key={l.href} className="inline-flex items-center gap-1.5 shrink-0">
            {i > 0 && <span className="text-gray-300 normal-case font-normal" aria-hidden>|</span>}
            <Link href={l.href} className="hover:text-gray-800">
              {l.label}
            </Link>
          </span>
        ))}
      </nav>
      <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-gray-400 whitespace-nowrap">
        <span>PCI-DSS</span>
        <span className="text-gray-300" aria-hidden>·</span>
        <span>256-bit SSL</span>
      </div>
    </div>
  );
}
