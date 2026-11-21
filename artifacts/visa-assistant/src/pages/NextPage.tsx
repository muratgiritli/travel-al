import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useSettings } from '@/lib/settings';
import { submitOrder } from '@/lib/orders';

/**
 * Application start page (route: /next).
 * Renders admin-editable apply settings — title, intro, dynamic form fields,
 * an insurance notice when force_insurance is on, and a success state on submit
 * with email + tracking number.
 */
export default function NextPage() {
  const { settings } = useSettings();
  const { apply, brand } = settings;

  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [tracking, setTracking] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const bottomPad = 'max(28px, calc(16px + env(safe-area-inset-bottom)))';

  const handleChange = (name: string, v: string) => {
    setValues((prev) => ({ ...prev, [name]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = (values.email || '').trim();
    if (!email) {
      setError('An email address is required so we can send your reference.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      // The reference comes from the server so /track can find this application.
      const order = await submitOrder({
        type: 'entry',
        amount: 0,
        email,
        customer_name: values.full_name || undefined,
        phone: values.phone || undefined,
        summary: apply.title || 'Application',
        payload: { ...values, source: 'apply_page' },
      });
      setTracking(order.tracking_code);
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not submit your application. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  };

  const emailNote = useMemo(() => {
    const note =
      apply.success_email_note ||
      'Keep this reference — you need it together with {email} to check your status on the Track page.';
    return note
      .replace(/\{email\}/gi, values.email || 'your email')
      .replace(/\{tracking\}/gi, tracking);
  }, [apply.success_email_note, values.email, tracking]);

  return (
    <div className="min-h-screen" style={{ background: '#f4f6f9' }}>
      <header className="px-4 py-3" style={{ background: '#0a1f44' }}>
        <div className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="shrink-0 overflow-hidden relative"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#E30A17',
                border: '1px solid rgba(255,255,255,.25)',
              }}
              aria-hidden
            >
              <svg viewBox="0 0 36 36" width={34} height={34} className="block">
                <circle cx="14.8" cy="18" r="7.6" fill="#fff" />
                <circle cx="17.2" cy="18" r="6.1" fill="#E30A17" />
                <polygon
                  fill="#fff"
                  transform="translate(23.4,18) rotate(-10) scale(0.42) translate(-12,-12)"
                  points="12,2.5 14.4,9.2 21.5,9.2 15.8,13.4 18.1,20.2 12,15.9 5.9,20.2 8.2,13.4 2.5,9.2 9.6,9.2"
                />
              </svg>
            </div>
            <span className="text-white font-bold text-[15px] leading-tight">{brand.site_name}</span>
          </Link>
          <Link href="/" className="text-[13px] text-white/80 hover:text-white font-medium">
            ← Home
          </Link>
        </div>
      </header>

      <main
        className="w-full max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 py-6 flex flex-col gap-4"
        style={{ paddingBottom: bottomPad }}
      >
        {submitted ? (
          <div
            className="rounded-2xl p-6 shadow-sm"
            style={{ background: '#fff', border: '1px solid #e5e7eb' }}
          >
            <div className="text-center">
              <div className="text-5xl mb-3">✅</div>
              <h1 className="font-black text-[22px] text-gray-900 leading-tight mb-2">
                {apply.success_title || 'Application received'}
              </h1>
              <p className="text-[14px] text-gray-600 leading-relaxed">
                {apply.success_message}
              </p>
            </div>

            <div
              className="mt-5 rounded-xl px-4 py-3.5 text-left"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Email
              </div>
              <div className="text-[14px] font-semibold text-gray-900 mt-0.5 break-all">
                {values.email || '—'}
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mt-3">
                Tracking number
              </div>
              <div
                className="text-[18px] font-bold tracking-wide mt-0.5"
                style={{ color: '#0a1f44' }}
              >
                {tracking}
              </div>
              <p className="text-[12px] text-gray-600 mt-3 leading-relaxed">{emailNote}</p>
            </div>

            <Link
              href="/"
              className="block w-full text-center mt-5 px-5 py-3 rounded-xl text-white font-semibold text-[14px]"
              style={{ background: '#C73E54' }}
            >
              ← Back to home
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center">
              <h1 className="font-black text-[26px] text-gray-900 leading-tight">{apply.title}</h1>
              <p className="text-[14px] text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
                {apply.intro}
              </p>
            </div>

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

            <form
              onSubmit={handleSubmit}
              className="rounded-2xl p-5 shadow-sm flex flex-col gap-4"
              style={{ background: '#fff', border: '1px solid #e5e7eb' }}
            >
              {apply.form_fields.map((field) => (
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
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base sm:text-[14px] text-gray-800 bg-gray-50 outline-none focus:border-gray-400"
                  />
                </div>
              ))}

              {error && <p className="text-[13px] text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="block w-full text-center font-bold text-[15px] text-white py-3.5 rounded-xl mt-1 transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #C73E54, #A82E42)' }}
              >
                {busy ? 'SUBMITTING…' : 'SUBMIT'}
              </button>
            </form>
          </>
        )}

        {brand.footer_text && (
          <p className="text-center text-[11px] text-gray-400 mt-2">{brand.footer_text}</p>
        )}
      </main>
    </div>
  );
}
