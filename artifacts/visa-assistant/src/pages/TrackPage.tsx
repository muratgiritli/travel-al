import { useState } from 'react';
import StaticPageShell from '@/components/StaticPageShell';
import { useSettings } from '@/lib/settings';

export default function TrackPage() {
  const { settings } = useSettings();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');

  const lookup = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    try {
      const raw = localStorage.getItem('teg_last_application');
      if (raw) {
        const saved = JSON.parse(raw) as { tracking?: string; email?: string };
        if (saved.tracking && saved.tracking.toUpperCase() === trimmed) {
          setMsg(`Application found. Confirmation email: ${saved.email || '—'}. Status: Received.`);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setMsg('No matching application found on this device. Check your email for updates.');
  };

  return (
    <StaticPageShell title="Track Application">
      <p className="mb-4">{settings.chat.track_text}</p>
      <form onSubmit={lookup} className="flex flex-col gap-3">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. TEG-XXXXXXXX"
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] bg-gray-50 outline-none focus:border-gray-400"
        />
        <button
          type="submit"
          className="w-full font-bold text-white py-3 rounded-xl"
          style={{ background: '#C73E54' }}
        >
          Track
        </button>
      </form>
      {msg && <p className="mt-4 text-[13px] text-gray-700 leading-relaxed">{msg}</p>}
    </StaticPageShell>
  );
}
