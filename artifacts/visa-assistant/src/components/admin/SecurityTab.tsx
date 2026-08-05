import { useState } from 'react';
import { changePassword, UnauthorizedError } from './api';
import { Button, Card, Field } from './ui';

export default function SecurityTab({
  currentUsername,
  onUnauthorized,
}: {
  currentUsername: string;
  onUnauthorized: () => void;
}) {
  const [username, setUsername] = useState(currentUsername);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setMsg(null);
    if (password.length < 6) {
      setMsg({ kind: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (password !== confirm) {
      setMsg({ kind: 'error', text: 'Passwords do not match.' });
      return;
    }
    setBusy(true);
    try {
      await changePassword({ username: username || undefined, new_password: password });
      setMsg({ kind: 'ok', text: 'Credentials updated ✓' });
      setPassword('');
      setConfirm('');
    } catch (err) {
      if (err instanceof UnauthorizedError) onUnauthorized();
      else setMsg({ kind: 'error', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <h2 className="font-bold text-[17px] text-gray-900 mb-4">Security</h2>
      <div className="flex flex-col gap-4 max-w-md">
        <Field label="Username" value={username} onChange={setUsername} />
        <Field label="New password (min 6 chars)" type="password" value={password} onChange={setPassword} />
        <Field label="Confirm new password" type="password" value={confirm} onChange={setConfirm} />
        <div>
          <Button onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Update credentials'}</Button>
        </div>
        {msg && (
          <p className={`text-[13px] font-medium ${msg.kind === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
            {msg.text}
          </p>
        )}
      </div>
    </Card>
  );
}
