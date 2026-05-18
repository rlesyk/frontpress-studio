import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { Alert, Button, Card, Field, Input, Select } from '../../components/ui/index.js';

const DEFAULT_EMAIL = {
  smtp_host: '',
  smtp_port: 587,
  smtp_user: '',
  smtp_pass: '',
  smtp_encryption: 'tls',
  from_address: '',
  from_name: '',
  fallback_to_mail: true,
};

const DEFAULT_FIELDS = [
  { name: 'name',    label: 'Your name',     type: 'text',     required: true,  placeholder: '' },
  { name: 'email',   label: 'Email address', type: 'email',    required: true,  placeholder: '' },
  { name: 'message', label: 'Message',       type: 'textarea', required: true,  placeholder: '' },
];

const DEFAULT_CONTACT = {
  to: '',
  subject_prefix: '[Contact]',
  fields: DEFAULT_FIELDS,
  honeypot_field: 'website',
  rate_limit_per_hour: 5,
  success_redirect: '/contact?sent=1',
  store_submissions: true,
};

const FIELD_TYPES = [
  { value: 'text',     label: 'Text'     },
  { value: 'email',    label: 'Email'    },
  { value: 'tel',      label: 'Phone'    },
  { value: 'url',      label: 'URL'      },
  { value: 'textarea', label: 'Long text'},
  { value: 'select',   label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
];

// SMTP credentials + per-form configuration. The form mirrors how
// SiteSettings.jsx persists the settings blob — read the whole config
// on mount, mutate the email + forms.contact slices locally, PUT the
// whole thing back. SMTP password is masked with `__SAVED__` when one
// is stored; the user types a fresh value to replace it.
export default function EmailSettings() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings'),
  });

  const [email, setEmail]     = useState(DEFAULT_EMAIL);
  const [contact, setContact] = useState(DEFAULT_CONTACT);
  const [saved, setSaved]     = useState(false);

  // Hydrate from the server response. We never echo the real password
  // back — it arrives as `"__SAVED__"` when one exists, `""` when not.
  // Keep the placeholder text and only override on Save when the
  // operator typed something different.
  useEffect(() => {
    const s = data?.settings;
    if (!s) return;
    setEmail({ ...DEFAULT_EMAIL, ...(s.email || {}) });
    const c = s.forms?.contact;
    if (c) {
      setContact({
        ...DEFAULT_CONTACT,
        ...c,
        fields: Array.isArray(c.fields) && c.fields.length ? c.fields : DEFAULT_FIELDS,
      });
    } else {
      setContact(DEFAULT_CONTACT);
    }
  }, [data]);

  const passwordIsStored = (data?.settings?.email?.smtp_pass ?? '') === '__SAVED__';

  const save = useMutation({
    mutationFn: () => {
      // If the user didn't touch the password field (still equal to the
      // mask token), send empty so the server keeps whatever's stored.
      const out = { ...email };
      if (out.smtp_pass === '__SAVED__') out.smtp_pass = '';
      return api.put('/settings', {
        site: data?.settings?.site || { name: '', base: '/' },
        uploads: data?.settings?.uploads || { max_mb: 5, max_width: 0, max_height: 0 },
        taxonomies: data?.settings?.taxonomies || {},
        seo: data?.settings?.seo || {},
        email: out,
        forms: { ...(data?.settings?.forms || {}), contact },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    },
  });

  const [testTo, setTestTo]   = useState('');
  const [testRes, setTestRes] = useState(null);
  useEffect(() => { if (!testTo) setTestTo(contact.to || ''); }, [contact.to]);  // eslint-disable-line

  const test = useMutation({
    mutationFn: () => api.post('/email/test', { to: testTo }),
    onMutate: () => setTestRes(null),
    onSuccess: (r) => setTestRes(r),
    onError:   (e) => setTestRes({ ok: false, error: e.message || 'Request failed' }),
  });

  const set = (patch) => setEmail((p) => ({ ...p, ...patch }));
  const setC = (patch) => setContact((p) => ({ ...p, ...patch }));

  if (isLoading) return <div className="text-sm text-zinc-500">Loading…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Email</h2>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-emerald-600">Saved</span>}
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>

      {save.error && <Alert tone="error">{save.error.message}</Alert>}

      <Card>
        <div className="space-y-4">
          <header>
            <h3 className="text-sm font-semibold text-zinc-900">SMTP</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Outgoing mail. Works with any provider that exposes SMTP — Postmark, Mailgun, SendGrid, Amazon SES, Gmail (app password), Microsoft 365, or your own relay. Leave the host empty to fall back to PHP <code>mail()</code>.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Host">
              <Input value={email.smtp_host} onChange={(e) => set({ smtp_host: e.target.value })} placeholder="smtp.postmarkapp.com" />
            </Field>
            <Field label="Port">
              <Input type="number" min={1} max={65535} value={email.smtp_port} onChange={(e) => set({ smtp_port: Number(e.target.value) || 587 })} />
            </Field>
            <Field label="Encryption">
              <Select value={email.smtp_encryption} onChange={(e) => set({ smtp_encryption: e.target.value })}>
                <option value="tls">TLS (STARTTLS)</option>
                <option value="ssl">SSL</option>
                <option value="none">None</option>
              </Select>
            </Field>
            <Field label="Username">
              <Input value={email.smtp_user} onChange={(e) => set({ smtp_user: e.target.value })} autoComplete="off" placeholder="api token or login" />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={email.smtp_pass}
                onChange={(e) => set({ smtp_pass: e.target.value })}
                autoComplete="new-password"
                placeholder={passwordIsStored ? '(unchanged — type to replace)' : ''}
              />
              <p className="mt-1 text-[11px] text-zinc-500">
                Or set <code>MD_SMTP_PASS</code> in <code>config.php</code> and leave this empty — the server reads the env constant when the JSON value is blank.
              </p>
            </Field>
            <Field label="From address">
              <Input type="email" value={email.from_address} onChange={(e) => set({ from_address: e.target.value })} placeholder="noreply@yoursite.com" />
            </Field>
            <Field label="From name">
              <Input value={email.from_name} onChange={(e) => set({ from_name: e.target.value })} placeholder="Your Site" />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!email.fallback_to_mail}
              onChange={(e) => set({ fallback_to_mail: e.target.checked })}
            />
            <span>Fall back to PHP <code>mail()</code> when SMTP fails. (Convenient on hobby hosts; deliverability suffers.)</span>
          </label>

          <hr className="border-zinc-200" />

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-zinc-900">Send a test email</h4>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Field label="To">
                  <Input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" />
                </Field>
              </div>
              <Button variant="secondary" onClick={() => test.mutate()} disabled={test.isPending || !testTo}>
                {test.isPending ? 'Sending…' : 'Send test'}
              </Button>
            </div>
            {testRes && (
              <Alert tone={testRes.ok ? 'success' : 'error'}>
                {testRes.ok
                  ? <>Sent via <code>{testRes.transport}</code>. {testRes.transport === 'mail' && email.smtp_host
                      ? 'Warning: your SMTP settings aren’t working — PHP mail() picked it up. Most shared hosts deliver mail() messages to spam.' : ''}</>
                  : <>Failed: <code>{testRes.error}</code></>}
              </Alert>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-4">
          <header>
            <h3 className="text-sm font-semibold text-zinc-900">Contact form</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Public form available at <code>/submit/contact</code>. The bundled <code>blank</code> theme exposes it as the <code>contact</code> template — create a page and pick "Contact" from the Template dropdown.
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Send to">
              <Input type="email" value={contact.to} onChange={(e) => setC({ to: e.target.value })} placeholder="you@yoursite.com" />
            </Field>
            <Field label="Subject prefix">
              <Input value={contact.subject_prefix} onChange={(e) => setC({ subject_prefix: e.target.value })} />
            </Field>
            <Field label="Rate limit (per hour, per IP)">
              <Input type="number" min={0} max={1000} value={contact.rate_limit_per_hour} onChange={(e) => setC({ rate_limit_per_hour: Number(e.target.value) || 0 })} />
            </Field>
            <Field label="Success redirect">
              <Input value={contact.success_redirect} onChange={(e) => setC({ success_redirect: e.target.value })} placeholder="/contact?sent=1" />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!contact.store_submissions}
              onChange={(e) => setC({ store_submissions: e.target.checked })}
            />
            <span>Save every submission as a draft post under <code>site/content/&lt;form&gt;/</code>. The folder appears in the admin Pages list — included in backups, searchable, restorable from trash.</span>
          </label>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-700">Fields</div>
            <ul className="space-y-2">
              {contact.fields.map((f, i) => (
                <FieldRow
                  key={i}
                  field={f}
                  onChange={(patch) => setC({ fields: contact.fields.map((x, j) => i === j ? { ...x, ...patch } : x) })}
                  onMove={(dir) => {
                    const arr = [...contact.fields];
                    const j = i + dir;
                    if (j < 0 || j >= arr.length) return;
                    [arr[i], arr[j]] = [arr[j], arr[i]];
                    setC({ fields: arr });
                  }}
                  onRemove={() => setC({ fields: contact.fields.filter((_, j) => j !== i) })}
                  isFirst={i === 0}
                  isLast={i === contact.fields.length - 1}
                />
              ))}
            </ul>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setC({ fields: [...contact.fields, { name: '', label: '', type: 'text', required: false, placeholder: '' }] })}
            >
              + Add field
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function FieldRow({ field, onChange, onMove, onRemove, isFirst, isLast }) {
  return (
    <li className="rounded-md border border-zinc-200 bg-white p-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_140px_auto]">
        <Field label="Name">
          <Input
            value={field.name}
            onChange={(e) => onChange({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
            placeholder="email"
            mono
          />
        </Field>
        <Field label="Label">
          <Input
            value={field.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="Email address"
          />
        </Field>
        <Field label="Type">
          <Select value={field.type} onChange={(e) => onChange({ type: e.target.value })}>
            {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        </Field>
        <div className="flex items-end gap-1 pb-1">
          <Button variant="secondary" size="sm" onClick={() => onMove(-1)} disabled={isFirst} title="Move up">▲</Button>
          <Button variant="secondary" size="sm" onClick={() => onMove(1)}  disabled={isLast}  title="Move down">▼</Button>
          <Button variant="danger-outline" size="sm" onClick={onRemove} title="Remove field">×</Button>
        </div>
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
        <Field label="Placeholder">
          <Input value={field.placeholder || ''} onChange={(e) => onChange({ placeholder: e.target.value })} placeholder="Optional" />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" checked={!!field.required} onChange={(e) => onChange({ required: e.target.checked })} />
          <span>Required</span>
        </label>
      </div>

      {field.type === 'select' && (
        <Field label="Choices (one per line)">
          <textarea
            className="block w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[13px]"
            rows={3}
            value={(field.choices || []).join('\n')}
            onChange={(e) => onChange({ choices: e.target.value.split('\n') })}
            onBlur={(e) => onChange({ choices: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
          />
        </Field>
      )}
      {field.type === 'checkbox' && (
        <Field label="Checkbox label (text next to the box)">
          <Input
            value={field.cb_label || field.label}
            onChange={(e) => onChange({ cb_label: e.target.value })}
            placeholder="I agree to the terms"
          />
        </Field>
      )}
    </li>
  );
}
