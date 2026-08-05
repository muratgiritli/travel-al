import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { adminLogout, adminSession, UnauthorizedError } from '@/components/admin/api';
import { BG, NAVY, Toast } from '@/components/admin/ui';
import Login from '@/components/admin/Login';
import Dashboard from '@/components/admin/Dashboard';
import CountriesTab from '@/components/admin/CountriesTab';
import PricingTab from '@/components/admin/PricingTab';
import ChatTab from '@/components/admin/ChatTab';
import ApplyTab from '@/components/admin/ApplyTab';
import BrandTab from '@/components/admin/BrandTab';
import SecurityTab from '@/components/admin/SecurityTab';

type Tab = 'dashboard' | 'countries' | 'pricing' | 'chat' | 'apply' | 'brand' | 'security';

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'dashboard', label: 'Dashboard', emoji: '📊' },
  { id: 'countries', label: 'Countries', emoji: '🌍' },
  { id: 'pricing', label: 'Pricing', emoji: '💲' },
  { id: 'chat', label: 'Chat & Copy', emoji: '💬' },
  { id: 'apply', label: 'Apply', emoji: '📝' },
  { id: 'brand', label: 'Brand', emoji: '🎨' },
  { id: 'security', label: 'Security', emoji: '🔒' },
];

export default function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = checking
  const [username, setUsername] = useState('');
  const [tab, setTab] = useState<Tab>('dashboard');
  const [toast, setToast] = useState<{ text: string; kind: 'ok' | 'error' } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  // Check existing session on load
  useEffect(() => {
    adminSession()
      .then((d) => {
        setUsername(d.username);
        setAuthed(true);
      })
      .catch(() => setAuthed(false));
  }, []);

  const showToast = useCallback((text: string, kind: 'ok' | 'error' = 'ok') => {
    setToast({ text, kind });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const onSaved = useCallback(() => showToast('Saved ✓', 'ok'), [showToast]);
  const onError = useCallback((msg: string) => showToast(msg || 'Something went wrong', 'error'), [showToast]);
  const onUnauthorized = useCallback(() => {
    setAuthed(false);
    setUsername('');
  }, []);

  const logout = async () => {
    try {
      await adminLogout();
    } catch {
      /* ignore */
    }
    onUnauthorized();
  };

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-gray-400 text-[14px]">Loading…</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <Login
        onSuccess={(u) => {
          setUsername(u);
          setAuthed(true);
          setTab('dashboard');
        }}
      />
    );
  }

  const tabProps = { onSaved, onError, onUnauthorized };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: BG }}>
      {toast && <Toast message={toast.text} kind={toast.kind} />}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="text-3xl">🕌</div>
          <div>
            <h1 className="font-bold text-xl text-gray-900">Turkey Travel Assistant — Admin</h1>
            <p className="text-[13px] text-gray-500">Signed in as {username}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/" className="text-[13px] text-gray-500 hover:text-gray-700">← Back to chat</Link>
            <button
              onClick={logout}
              className="px-3.5 py-2 rounded-xl text-[13px] font-semibold text-white"
              style={{ background: NAVY }}
            >
              Log out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="whitespace-nowrap px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-colors"
              style={{
                background: tab === t.id ? NAVY : '#fff',
                color: tab === t.id ? '#fff' : '#374151',
                border: `1px solid ${tab === t.id ? NAVY : '#e5e7eb'}`,
              }}
            >
              <span className="mr-1">{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === 'dashboard' && (
          <Dashboard onNavigate={(t) => setTab(t as Tab)} onUnauthorized={onUnauthorized} />
        )}
        {tab === 'countries' && <CountriesTab {...tabProps} />}
        {tab === 'pricing' && <PricingTab {...tabProps} />}
        {tab === 'chat' && <ChatTab {...tabProps} />}
        {tab === 'apply' && <ApplyTab {...tabProps} />}
        {tab === 'brand' && <BrandTab {...tabProps} />}
        {tab === 'security' && <SecurityTab currentUsername={username} onUnauthorized={onUnauthorized} />}
      </div>
    </div>
  );
}
