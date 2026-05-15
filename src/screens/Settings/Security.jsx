import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/auth.jsx';
import { Alert, Button, Card, Field, Input } from '../../components/ui/index.js';

// Rotate the admin password. The current-password challenge is the second
// factor — a hijacked session can't quietly change credentials without it.
// On success we re-read /me so the first-run banner disappears in the same
// turn the password is rotated.
export default function Security() {
  const { refresh } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [localError, setLocalError] = useState('');
  const [done, setDone] = useState(false);

  const change = useMutation({
    mutationFn: () => api.post('/password', { current, next }),
    onSuccess: async () => {
      setCurrent('');
      setNext('');
      setConfirmation('');
      setLocalError('');
      setDone(true);
      await refresh();
    },
  });

  function onSubmit(e) {
    e.preventDefault();
    setDone(false);
    if (next !== confirmation) {
      setLocalError('The two new passwords don\'t match.');
      return;
    }
    if (next.length < 8) {
      setLocalError('New password should be at least 8 characters.');
      return;
    }
    setLocalError('');
    change.mutate();
  }

  const serverError = change.error ? (change.error.message || 'Couldn\'t change the password.') : '';
  const error = localError || serverError;

  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-4">
        <header>
          <h2 className="text-base font-semibold text-zinc-900">Admin password</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Rotates the password stored in <code className="text-xs">.env</code>. Only the bcrypt hash is written to disk.
          </p>
        </header>

        {error && <Alert tone="error">{error}</Alert>}
        {done && <Alert tone="success">Password updated.</Alert>}

        <Field label="Current password">
          <Input
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
          />
        </Field>

        <Field label="New password" hint="At least 8 characters.">
          <Input
            type="password"
            autoComplete="new-password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
          />
        </Field>

        <Field label="Confirm new password">
          <Input
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            required
          />
        </Field>

        <div>
          <Button type="submit" aria-busy={change.isPending}>
            {change.isPending ? 'Saving…' : 'Update password'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
