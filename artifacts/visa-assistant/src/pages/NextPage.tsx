import { useState } from 'react';
import { Link } from 'wouter';
import { useSettings } from '@/lib/settings';

/**
 * Application start page (route: /next).
 * Renders admin-editable apply settings — title, intro, dynamic form fields,
 * an insurance notice when force_insurance is on, and a success state on submit.
 * No backend submit endpoint yet: nothing is stored, we just show success.
 */
export default function NextPage() {
  const { settings } = useSettings();
  const { apply, brand } = settings;

  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const bottomPad = 'max(28px, calc(16px + env(safe-area-inset-bottom)))';

  const handleChange = (name: string, v: string) => {
    setValues(prev => ({ ...prev, [name]: v }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No backend submit endpoint yet — just show the success state.
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f9' }}>
      {/* ── Header ── */}
      <header className="px-4 py-3" style={{ background: '#0a1f44' }}>
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="flex items-center justify-center text-lg shrink-0"
              style={{ width: 34, height: 34, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #e8c984, #c5a059)' }}
            >
              {brand.logo_emoji}
            </div>
            <span className="text-white font-bold text-[15px] leading-tight">{brand.site_name}</span>
          </Link>
          <Link href="/" className="text-[13px] text-white/80 hover:text-white font-medium">← Home</Link>
        </div>
      </header>

      <main
        className="max-w-xl mx-auto px-4 py-6 flex flex-col gap-4"
        style={{ paddingBottom: bottomPad }}
      >
        {submitted ? (
          /* ── Success state ── */
          <div
            className="rounded-2xl p-6 text-center shadow-sm"
            style={{ background: '#fff', border: '1px solid #e5e7eb' }}
          >
            <div className="text-5xl mb-3">✅</div>
            <h1 className="font-black text-[22px] text-gray-900 leading-tight mb-2">Thank you!</h1>
            <p className="text-[14px] text-gray-600 leading-relaxed">{apply.success_message}</p>
            <Link
              href="/"
              className="inline-block mt-5 px-5 py-2.5 rounded-xl text-white font-semibold text-[14px]"
              style={{ background: '#0a1f44' }}
            >
              ← Back to home
            </Link>
          </div>
        ) : (
          <>
            {/* ── Title / intro ── */}
            <div className="text-center">
              <h1 className="font-black text-[26px] text-gray-900 leading-tight">{apply.title}</h1>
              <p className="text-[14px] text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">{apply.intro}</p>
            </div>

            {/* ── Insurance notice ── */}
            {apply.force_insurance && (
              <div
                className="rounded-2xl p-4 flex items-start gap-3"
                style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}
              >
                <span className="text-xl shrink-0">🛡️</span>
                <div>
                  <p className="font-semibold text-[14px]" style={{ color: '#c2410c' }}>
                    Travel insurance required
                  </p>
                  <p className="text-[13px] text-amber-800 mt-1">
                    {settings.chat.insurance_required_message}
                  </p>
                </div>
              </div>
            )}

            {/* ── Dynamic form ── */}
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl p-5 shadow-sm flex flex-col gap-4"
              style={{ background: '#fff', border: '1px solid #e5e7eb' }}
            >
              {apply.form_fields.map(field => (
                <div key={field.name} className="flex flex-col gap-1.5">
                  <label htmlFor={field.name} className="text-[13px] font-semibold text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500"> *</span>}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type || 'text'}
                    required={field.required}
                    value={values[field.name] ?? ''}
                    onChange={e => handleChange(field.name, e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-[14px] text-gray-800 bg-gray-50 outline-none focus:border-gray-400"
                  />
                </div>
              ))}

              <button
                type="submit"
                className="block w-full text-center font-bold text-[15px] text-white py-3.5 rounded-xl mt-1 transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e40af)' }}
              >
                SUBMIT
              </button>
            </form>
          </>
        )}

        {/* ── Footer ── */}
        {brand.footer_text && (
          <p className="text-center text-[11px] text-gray-400 mt-2">{brand.footer_text}</p>
        )}
      </main>
    </div>
  );
}
