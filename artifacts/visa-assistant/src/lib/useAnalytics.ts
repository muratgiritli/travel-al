import { useEffect } from 'react';
import { useSettings } from '@/lib/settings';

/**
 * Loads Plausible when a domain is configured in admin.
 *
 * Plausible is cookie-free and stores no personal data, which keeps the site
 * out of consent-banner territory. Nothing loads until a domain is set.
 */
export function useAnalytics() {
  const { settings } = useSettings();
  const domain = settings.integrations.plausible_domain;

  useEffect(() => {
    if (!domain) return;
    if (document.querySelector('script[data-analytics]')) return;

    const script = document.createElement('script');
    script.defer = true;
    script.dataset.analytics = 'plausible';
    script.dataset.domain = domain;
    script.src = 'https://plausible.io/js/script.js';
    document.head.appendChild(script);
  }, [domain]);
}
