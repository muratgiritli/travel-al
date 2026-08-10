import { Link } from 'wouter';
import { useSettings } from '@/lib/settings';
import SiteFooter from '@/components/SiteFooter';

export default function StaticPageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { settings } = useSettings();
  const brand = settings.brand;
  const bottomPad = 'max(28px, calc(16px + env(safe-area-inset-bottom)))';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f4f6f9' }}>
      <header className="px-4 py-3" style={{ background: '#0a1f44' }}>
        <div className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-white font-bold text-[15px]">{brand.site_name}</span>
          </Link>
          <Link href="/" className="text-[13px] text-white/80 hover:text-white font-medium">
            ← Home
          </Link>
        </div>
      </header>
      <main
        className="flex-1 w-full max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 py-6"
        style={{ paddingBottom: bottomPad }}
      >
        <h1 className="font-bold text-[22px] mb-4" style={{ color: '#0a1f44' }}>
          {title}
        </h1>
        <div
          className="rounded-2xl bg-white px-4 py-4 text-[14px] text-gray-700 leading-relaxed"
          style={{ border: '1px solid #E5E7EB' }}
        >
          {children}
        </div>
        <div className="mt-6">
          <SiteFooter />
        </div>
      </main>
    </div>
  );
}
