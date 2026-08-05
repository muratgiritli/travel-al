import { useState } from 'react';
import { Link } from 'wouter';
import { adminLogin } from './api';
import { NAVY, BG } from './ui';

export default function Login({ onSuccess }: { onSuccess: (username: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      await adminLogin(username, password);
      onSuccess(username);
    } catch {
      setError('Wrong username or password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: BG }}>
      <div
        className="w-full max-w-sm bg-white rounded-2xl p-8 text-center"
        style={{ border: '1px solid #e5e7eb', boxShadow: '0 8px 28px rgba(10,31,68,.08)' }}
      >
        <div className="text-4xl mb-2">🕌</div>
        <h2 className="font-bold text-xl text-gray-900 mb-6">Admin Login</h2>
        <input
          type="text"
          placeholder="Username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[15px] outline-none mb-3 focus:border-blue-400"
        />
        <input
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-[15px] outline-none mb-3 focus:border-blue-400"
        />
        <button
          onClick={submit}
          disabled={busy}
          className="w-full py-3 rounded-xl text-white font-semibold text-[15px] transition-colors disabled:opacity-60"
          style={{ background: NAVY }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        {error && <p className="text-red-500 text-[13px] mt-3">{error}</p>}
        <Link href="/" className="block mt-4 text-[13px] text-gray-400 hover:text-gray-600">
          ← Back to chat
        </Link>
      </div>
    </div>
  );
}
