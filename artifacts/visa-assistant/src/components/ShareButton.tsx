import { useState } from 'react';

/**
 * Share sheet on mobile, clipboard copy elsewhere.
 * Rendered only once a country result exists, so the link carries that result.
 */
export default function ShareButton({
  title,
  text,
  url,
  label,
  copiedLabel,
}: {
  title: string;
  text?: string;
  url: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // Dismissed share sheet, or sharing denied — fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked; nothing useful left to try.
    }
  };

  return (
    <button
      type="button"
      onClick={onShare}
      aria-label={label}
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 text-[13px] font-semibold text-gray-700 active:bg-gray-50"
    >
      <span aria-hidden>{copied ? '✓' : '↗'}</span>
      <span>{copied ? copiedLabel : label}</span>
    </button>
  );
}
