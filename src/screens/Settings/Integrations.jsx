import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { Alert, Button, Card, Field, Input } from '../../components/ui/index.js';

/**
 * Settings → Integrations.
 *
 * Today this is just the Unsplash Access Key. The key is per-install, lives
 * in `site/config.json` under `integrations.unsplash`, and never leaves the
 * server — search + download happen through the `/admin/api/unsplash/*`
 * proxy so we don't expose it to the browser.
 *
 * The GET handler returns only the last 4 chars of the saved key (the
 * "masked" form) so a screen-share doesn't leak it. Users have to paste the
 * full key again to rotate.
 */
export default function Integrations() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['unsplash', 'key'],
    queryFn: () => api.get('/unsplash/key'),
  });
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: () => api.put('/unsplash/key', { access_key: draft.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unsplash', 'key'] });
      setDraft('');
      setError('');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (e) => setError(e?.message || 'Could not save'),
  });

  const disconnect = useMutation({
    mutationFn: () => api.delete('/unsplash/key'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['unsplash', 'key'] });
      setDraft('');
      setError('');
    },
    onError: (e) => setError(e?.message || 'Could not disconnect'),
  });

  if (isLoading) return <div className="text-sm text-zinc-500">Loading…</div>;

  // `source` tells us *where* the active key came from:
  //   - 'own'         : entered via this UI, lives in site/config.json
  //   - 'config_php'  : FPS_UNSPLASH_ACCESS_KEY constant in config.php
  //   - 'default'     : bundled with FrontPress (shared by every install)
  //   - 'none'        : no key anywhere; integration is disabled
  const source      = data?.source || 'none';
  const configured  = !!data?.configured;
  const usingOwnKey = source === 'own' || source === 'config_php';
  const masked      = data?.masked || '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Integrations</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Third-party services FrontPress can call on your behalf. Each
          integration is per-install — credentials live in <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[12px]">site/config.json</code> and never ship in releases.
        </p>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <Card title="Unsplash">
        {configured ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900">
            {source === 'own' && (
              <div className="flex items-center justify-between gap-3">
                <span>
                  Connected with your own Access Key (ends in{' '}
                  <code className="rounded bg-white/60 px-1 py-0.5 font-mono text-[12px]">{masked}</code>
                  ).
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => disconnect.mutate()}
                  disabled={disconnect.isPending}
                >
                  {disconnect.isPending ? 'Disconnecting…' : 'Disconnect'}
                </Button>
              </div>
            )}
            {source === 'config_php' && (
              <span>
                Connected via <code className="rounded bg-white/60 px-1 py-0.5 font-mono text-[12px]">FPS_UNSPLASH_ACCESS_KEY</code> in <code className="rounded bg-white/60 px-1 py-0.5 font-mono text-[12px]">config.php</code> (ends in <code className="rounded bg-white/60 px-1 py-0.5 font-mono text-[12px]">{masked}</code>).
              </span>
            )}
            {source === 'default' && (
              <span>
                Connected using the Access Key bundled with FrontPress. Shared with every other install — fine for casual use, swap in your own key below for higher rate limits or your own Unsplash TOS scope.
              </span>
            )}
          </div>
        ) : (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
            No Access Key available. Paste one below to enable Unsplash search.
          </div>
        )}

        <p className="mt-4 text-xs text-zinc-500">
          {usingOwnKey
            ? 'This install talks to Unsplash directly under your own quota and TOS scope.'
            : (
              <>
                Want higher rate limits, your own Unsplash TOS scope, or to opt out of the shared key? Create a free developer app at{' '}
                <a
                  href="https://unsplash.com/oauth/applications"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-900"
                >unsplash.com/oauth/applications</a>{' '}
                and paste the <strong>Access Key</strong> below.
              </>
            )}
        </p>

        <Field
          label={usingOwnKey ? 'Replace Access Key' : 'Use your own Access Key (optional)'}
          hint="Free tier allows 50 requests/hour. Apply for the production tier inside the Unsplash dashboard for 5,000/hour."
          className="mt-3"
        >
          <Input
            value={draft}
            type="password"
            autoComplete="off"
            spellCheck={false}
            placeholder="byCToi14SRX… (40+ characters)"
            onChange={(e) => setDraft(e.target.value)}
          />
        </Field>

        <div className="mt-3 flex items-center gap-3">
          <Button onClick={() => save.mutate()} disabled={save.isPending || draft.trim() === ''}>
            {save.isPending ? 'Saving…' : (usingOwnKey ? 'Replace' : 'Save')}
          </Button>
          {saved && <span className="text-xs text-emerald-600">Saved</span>}
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          By using this integration you agree to Unsplash's{' '}
          <a
            href="https://unsplash.com/api-terms"
            target="_blank"
            rel="noreferrer noopener"
            className="underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-900"
          >API Terms</a>
          . FrontPress automatically credits the photographer and pings Unsplash's download endpoint on every pick, as required.
        </p>
      </Card>
    </div>
  );
}
