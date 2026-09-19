import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useSettings } from '@/lib/settings';
import { useI18n } from '@/lib/i18n';

const STORAGE_KEY = 'tta_cookie_ack';

/**
 * One-time notice, not a consent gate.
 *
 * The site sets no advertising or cross-site cookies, so there is nothing to
 * opt out of; visitors only need to be told what is stored. Add a real consent
 * flow here if tracking cookies are ever introduced.
 */
export default function CookieNotice() {
  const { settings } = useSettings();
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // Private mode with storage disabled: skip rather than nag every view.
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  const text = settings.legal.cookie_notice || t('cookie.text');

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 px-3"
      style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      role="region"
      aria-label={t('cookie.label')}
    >
      <div
        className="mx-auto max-w-xl rounded-2xl bg-white px-4 py-3.5 shadow-lg"
        style={{ border: '1px solid #e5e7eb' }}
      >
        <p className="text-[12.5px] leading-relaxed text-gray-600">
          {text}{' '}
          <Link href="/privacy" className="font-semibold underline text-gray-800">
            {t('cookie.privacy')}
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-3 w-full min-h-[44px] rounded-xl text-[14px] font-semibold text-white"
          style={{ background: '#0a1f44' }}
        >
          {t('cookie.ok')}
        </button>
      </div>
    </div>
  );
}
