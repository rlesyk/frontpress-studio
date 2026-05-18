import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { Alert, Badge, Button, Card } from '../../components/ui/index.js';

// Inbox of form submissions captured by the public-side /submit/<form>
// handler. Click any row to open the detail drawer; delete removes the
// submission file from disk (no trash — these are anonymous public
// inputs, not user content, so a soft-delete would just leave noise
// behind for the operator to clean up later).
export default function Submissions() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['submissions', 'all'],
    queryFn:  () => api.get('/submissions?limit=200'),
  });
  const [open, setOpen]       = useState(null); // selected submission id
  const [detail, setDetail]   = useState(null); // full payload of the open row
  const [detailErr, setErr]   = useState(null);

  async function openRow(id) {
    setOpen(id);
    setDetail(null);
    setErr(null);
    try {
      const res = await api.get('/submissions/' + id);
      setDetail(res.submission || null);
    } catch (e) {
      setErr(e.message || 'Failed to load');
    }
  }

  const del = useMutation({
    mutationFn: (id) => api.delete('/submissions/' + id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submissions'] });
      setOpen(null);
      setDetail(null);
    },
  });

  if (isLoading) return <div className="text-sm text-zinc-500">Loading…</div>;

  const items = data?.items || [];

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-semibold">Submissions</h2>
        <div className="text-xs text-zinc-500">
          {data?.total ?? 0} total · stored under <code>site/data/submissions/</code>
        </div>
      </div>

      {items.length === 0 ? (
        <Card>
          <div className="p-2 text-sm text-zinc-500">
            No submissions yet. The bundled contact form posts to <code>/submit/contact</code>; configure SMTP under <a href="/admin/settings/email" className="text-blue-600 underline">Email</a> to receive notifications when one arrives.
          </div>
        </Card>
      ) : (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Form</th>
                <th className="px-3 py-2 font-medium">Summary</th>
                <th className="px-3 py-2 font-medium">Delivery</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr
                  key={row.id}
                  className={`cursor-pointer border-b border-zinc-100 hover:bg-zinc-50 ${open === row.id ? 'bg-zinc-50' : ''}`}
                  onClick={() => openRow(row.id)}
                >
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-600">
                    {formatTime(row.created)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs">
                    <code className="text-zinc-700">{row.form}</code>
                  </td>
                  <td className="px-3 py-2 text-zinc-800">
                    <span className="line-clamp-1">{row.summary || '(empty submission)'}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <DeliveryBadge email={row.email} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="danger-outline"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); if (confirm('Delete this submission?')) del.mutate(row.id); }}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {open && (
        <Card>
          <div className="space-y-3">
            <header className="flex items-baseline justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Submission</h3>
                <code className="text-[11px] text-zinc-500">{open}</code>
              </div>
              <button
                type="button"
                onClick={() => { setOpen(null); setDetail(null); }}
                className="text-xs text-zinc-500 hover:text-zinc-900"
                aria-label="Close detail"
              >
                Close
              </button>
            </header>
            {detailErr && <Alert tone="error">{detailErr}</Alert>}
            {detail && (
              <div className="space-y-3">
                <div className="grid gap-2 text-xs sm:grid-cols-2">
                  <div><span className="text-zinc-500">Received:</span> <span className="text-zinc-800">{formatTime(detail.created)}</span></div>
                  <div><span className="text-zinc-500">IP:</span> <code>{detail.ip || 'unknown'}</code></div>
                  <div className="sm:col-span-2"><span className="text-zinc-500">User agent:</span> <span className="break-all text-zinc-700">{detail.ua || 'unknown'}</span></div>
                </div>

                <div>
                  <div className="mb-1 text-xs font-semibold text-zinc-700">Fields</div>
                  <dl className="rounded-md border border-zinc-200 bg-zinc-50/50 p-3 text-sm">
                    {Object.entries(detail.fields || {}).map(([k, v]) => (
                      <div key={k} className="grid grid-cols-[140px_1fr] gap-2 py-1">
                        <dt className="font-mono text-xs text-zinc-500">{k}</dt>
                        <dd className="whitespace-pre-wrap break-words text-zinc-800">{String(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div>
                  <div className="mb-1 text-xs font-semibold text-zinc-700">Email delivery</div>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50/50 p-3 text-xs">
                    {detail.email ? (
                      <div className="space-y-1">
                        <div>
                          <DeliveryBadge email={detail.email} />
                          {' '}
                          <span className="text-zinc-500">via</span> <code>{detail.email.transport}</code>
                        </div>
                        {detail.email.error && (
                          <div className="text-red-700"><code>{detail.email.error}</code></div>
                        )}
                      </div>
                    ) : <span className="text-zinc-500">Not attempted.</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function DeliveryBadge({ email }) {
  if (!email) return <Badge tone="neutral">no email</Badge>;
  if (email.ok && email.transport === 'smtp') return <Badge tone="success">sent</Badge>;
  if (email.ok && email.transport === 'mail') return <Badge tone="warning">mail()</Badge>;
  return <Badge tone="danger">failed</Badge>;
}

function formatTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch { return iso; }
}
