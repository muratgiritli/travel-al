import { useState, useEffect } from 'react';
import { Link } from 'wouter';

interface Country {
  id: string; name: string; iso2: string; flag_emoji: string;
  visa_summary: string; stay_rule: string; insurance_required: boolean;
  admin_html_notes: string; ai_extra_context: string; is_active: boolean;
}

interface CardPreview {
  visa_status: string; insurance_required: boolean;
  headline: string; body: string[]; admin_html_notes: string;
}

const ADMIN_API = '/api/visa/admin/countries';

export default function Admin() {
  const [pw, setPw] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [filtered, setFiltered] = useState<Country[]>([]);
  const [searchQ, setSearchQ] = useState('');
  const [current, setCurrent] = useState<Country | null>(null);
  const [card, setCard] = useState<CardPreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Fields
  const [fVisaSummary, setFVisaSummary] = useState('');
  const [fStayRule, setFStayRule] = useState('');
  const [fInsurance, setFInsurance] = useState(true);
  const [fHtmlNotes, setFHtmlNotes] = useState('');
  const [fAiContext, setFAiContext] = useState('');

  const headers = (p = pw) => ({ 'Content-Type': 'application/json', 'x-admin-password': p });

  const doLogin = async () => {
    setLoginError(false);
    try {
      const res = await fetch(`${ADMIN_API}?password=${encodeURIComponent(pw)}`);
      if (!res.ok) throw new Error('bad');
      const data = await res.json();
      setCountries(data.countries);
      setFiltered(data.countries);
      setAuthed(true);
    } catch {
      setLoginError(true);
    }
  };

  useEffect(() => {
    const q = searchQ.toLowerCase();
    setFiltered(
      q
        ? countries.filter(c => c.name.toLowerCase().includes(q) || c.iso2.toLowerCase().includes(q))
        : countries
    );
  }, [searchQ, countries]);

  const openEditor = async (id: string) => {
    const res = await fetch(`${ADMIN_API}/${id}`, { headers: { 'x-admin-password': pw } });
    const data = await res.json();
    const c: Country = data.country;
    setCurrent(c);
    setCard(data.card);
    setFVisaSummary(data.card.visa_status || '');
    setFStayRule(c.stay_rule || '');
    setFInsurance(!!c.insurance_required);
    setFHtmlNotes(c.admin_html_notes || '');
    setFAiContext(c.ai_extra_context || '');
  };

  const saveCountry = async () => {
    if (!current) return;
    setSaving(true);
    const res = await fetch(`${ADMIN_API}/${current.id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        visa_summary: fVisaSummary,
        stay_rule: fStayRule,
        insurance_required: fInsurance,
        admin_html_notes: fHtmlNotes,
        ai_extra_context: fAiContext,
      }),
    });
    const data = await res.json();
    setCard(data.card);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    const res2 = await fetch(`${ADMIN_API}`, { headers: { 'x-admin-password': pw } });
    const d2 = await res2.json();
    setCountries(d2.countries);
  };

  // Login screen
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f4f6f9' }}>
        <div
          className="w-full max-w-sm bg-white rounded-2xl p-8 text-center"
          style={{ border: '1px solid #e5e7eb', boxShadow: '0 8px 28px rgba(10,31,68,.08)' }}
        >
          <div className="text-4xl mb-2">🕌</div>
          <h2 className="font-bold text-xl text-gray-900 mb-6">Admin Login</h2>
          <input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doLogin()}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[15px] outline-none mb-3 focus:border-blue-400"
          />
          <button
            onClick={doLogin}
            className="w-full py-3 rounded-xl text-white font-semibold text-[15px] transition-colors"
            style={{ background: '#0a1f44' }}
          >
            Sign in
          </button>
          {loginError && <p className="text-red-500 text-[13px] mt-3">Wrong password</p>}
          <Link href="/" className="block mt-4 text-[13px] text-gray-400 hover:text-gray-600">
            ← Back to chat
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: '#f4f6f9' }}>
      {/* Toast */}
      {saved && (
        <div
          className="fixed bottom-6 right-6 px-4 py-3 rounded-xl text-white text-[13px] font-semibold z-50"
          style={{ background: '#16a34a' }}
        >
          Saved ✓
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="text-3xl">🕌</div>
          <div>
            <h1 className="font-bold text-xl text-gray-900">Turkey Travel — Admin</h1>
            <p className="text-[13px] text-gray-500">Manage visa-exempt countries</p>
          </div>
          <Link href="/" className="ml-auto text-[13px] text-gray-500 hover:text-gray-700">
            ← Back to chat
          </Link>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Search country…"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-[14px] mb-4 outline-none bg-white"
        />

        {/* Country grid */}
        <div className="grid gap-2 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => openEditor(c.id)}
              className="text-left px-3.5 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
              style={{
                background: current?.id === c.id ? '#eef2f9' : '#fff',
                border: `1px solid ${current?.id === c.id ? '#0a1f44' : '#e5e7eb'}`,
                color: current?.id === c.id ? '#0a1f44' : '#374151',
              }}
            >
              {c.flag_emoji} {c.name}
            </button>
          ))}
        </div>

        {/* Editor */}
        {current && (
          <div
            className="bg-white rounded-2xl p-6"
            style={{ border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(10,31,68,.06)' }}
          >
            <h2 className="font-bold text-[17px] text-gray-900 mb-5">
              {current.flag_emoji} {current.name}
            </h2>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Visa summary
                </label>
                <input
                  type="text"
                  value={fVisaSummary}
                  onChange={e => setFVisaSummary(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Insurance required
                </label>
                <select
                  value={fInsurance ? 'true' : 'false'}
                  onChange={e => setFInsurance(e.target.value === 'true')}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] outline-none bg-white"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Stay rule (shown in card)
              </label>
              <textarea
                value={fStayRule}
                onChange={e => setFStayRule(e.target.value)}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] outline-none resize-y"
              />
            </div>

            <div className="mt-4">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Admin HTML notes <span className="text-gray-400 normal-case">(shown under card to visitors)</span>
              </label>
              <textarea
                value={fHtmlNotes}
                onChange={e => setFHtmlNotes(e.target.value)}
                rows={4}
                placeholder="<p><strong>Tip:</strong> Keep insurance PDF offline for border checks.</p>"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] font-mono outline-none resize-y"
              />
            </div>

            <div className="mt-4">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                AI extra context <span className="text-gray-400 normal-case">(used in chat replies)</span>
              </label>
              <textarea
                value={fAiContext}
                onChange={e => setFAiContext(e.target.value)}
                rows={3}
                placeholder="Border crossings: Istanbul Airport, Sabiha Gökçen..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] outline-none resize-y"
              />
            </div>

            {/* Live preview */}
            {card && (
              <div
                className="mt-5 p-4 rounded-xl"
                style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
              >
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Card preview
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold bg-green-50 text-green-700">
                    {card.visa_status}
                  </span>
                  {card.insurance_required && (
                    <span className="px-2.5 py-1 rounded-full text-[12px] font-semibold bg-orange-50 text-orange-700">
                      Insurance required
                    </span>
                  )}
                </div>
                <p className="font-semibold text-[14px] text-gray-900 mb-1">{card.headline}</p>
                <p className="text-[13px] text-gray-500">{(card.body || []).join(' ')}</p>
                {card.admin_html_notes && (
                  <div
                    className="mt-2 pt-2 border-t border-gray-200 text-[13px] text-gray-600"
                    dangerouslySetInnerHTML={{ __html: card.admin_html_notes }}
                  />
                )}
              </div>
            )}

            <button
              onClick={saveCountry}
              disabled={saving}
              className="mt-5 px-6 py-3 rounded-xl text-white font-semibold text-[14px] transition-colors disabled:opacity-60"
              style={{ background: '#0a1f44' }}
            >
              {saving ? 'Saving…' : 'Save country'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
