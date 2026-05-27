import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { Button, Field, Input, Select, Textarea } from './ui/index.js';

const CATEGORIES = [
  { value: 'layout',     label: 'Layout' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'content',    label: 'Content' },
  { value: 'media',      label: 'Media' },
  { value: 'forms',      label: 'Forms' },
  { value: 'utility',    label: 'Utility' },
];

/**
 * Create-or-edit dialog for a single pattern registry entry. `editing`
 * (the existing component, or null for new) drives which endpoint we
 * POST to and which initial state we hydrate.
 *
 * Server is the source of truth on validation (id collisions, template
 * existence). We only do quick client-side checks (id slug pattern,
 * required fields) before the round-trip.
 */
export default function PatternFormDialog({ open, theme, editing, onClose, onSaved }) {
  const [id,          setId]          = useState('');
  const [name,        setName]        = useState('');
  const [template,    setTemplate]    = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState('layout');
  const [busy,        setBusy]        = useState(false);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setId(editing.id || '');
      setName(editing.name || '');
      setTemplate(editing.template || '');
      setDescription(editing.description || '');
      setCategory(editing.category || 'layout');
    } else {
      setId(''); setName(''); setTemplate('');
      setDescription(''); setCategory('layout');
    }
    setError(null);
  }, [open, editing]);

  // Esc to close (matches the parent modal pattern).
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    setError(null);
    // Quick client-side guard so we don't round-trip just to be told
    // "id is empty". Real validation still happens server-side.
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(id)) {
      setError('Id must be lowercase letters, digits, dashes or underscores (no spaces).');
      return;
    }
    if (!template.trim()) {
      setError('Template path is required.');
      return;
    }

    setBusy(true);
    const payload = {
      theme: theme || undefined,
      component: { id, name: name.trim(), template: template.trim(), description: description.trim(), category },
    };
    try {
      const endpoint = editing ? '/themes/components-update' : '/themes/components-add';
      if (editing) payload.id = editing.id; // rename support
      const res = await api.post(endpoint, payload);
      onSaved?.(res.component);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-lg bg-white shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
          <h3 className="text-sm font-semibold">{editing ? 'Edit pattern' : 'Add pattern'}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </header>

        <form onSubmit={submit} className="space-y-3 px-5 py-4">
          <Field label="ID">
            <Input
              value={id}
              onChange={(e) => setId(e.target.value.toLowerCase())}
              placeholder="hero"
              autoFocus={!editing}
              spellCheck={false}
            />
          </Field>
          <Field label="Name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Hero"
            />
          </Field>
          <Field label="Template path">
            <Input
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="templates/_hero.twig"
              spellCheck={false}
            />
          </Field>
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Description">
            <Textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this component, and where is it used?"
            />
          </Field>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Add pattern'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
