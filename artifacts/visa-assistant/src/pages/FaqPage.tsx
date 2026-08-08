import { useMemo, useState } from 'react';
import StaticPageShell from '@/components/StaticPageShell';
import { useSettings } from '@/lib/settings';

export default function FaqPage() {
  const { settings } = useSettings();
  const [openId, setOpenId] = useState<string | null>(null);
  const faqs = useMemo(
    () =>
      [...(settings.trust.faq || [])]
        .filter((f) => f.active !== false)
        .sort((a, b) => a.sort - b.sort),
    [settings.trust.faq],
  );

  return (
    <StaticPageShell title={settings.trust.faq_title || 'FAQ'}>
      {faqs.length === 0 ? (
        <p>{settings.chat.faq_text}</p>
      ) : (
        <div className="divide-y divide-gray-100 -mx-1">
          {faqs.map((f) => {
            const open = openId === f.id;
            return (
              <div key={f.id} className="px-1">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : f.id)}
                  className="w-full text-left py-3 flex justify-between gap-2"
                >
                  <span className="font-semibold text-[14px] text-gray-900">{f.question}</span>
                  <span className="text-gray-400">{open ? '−' : '+'}</span>
                </button>
                {open && (
                  <p className="pb-3 text-[13px] text-gray-600 leading-relaxed">{f.answer}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </StaticPageShell>
  );
}
