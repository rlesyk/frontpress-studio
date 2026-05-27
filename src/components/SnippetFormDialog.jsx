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
 * Create-only dialog for a new theme snippet. MVP scope: no edit path
 * (delete + recreate), no duplicate, no tags. Body is plain text — a
 * full Monaco-in-modal is overkill for the typical 5-50 line scaffold.
 *
 * `initialCode` pre-fills the Code field when the dialog is launched
 * from "Save selection as snippet" so the author doesn't paste twice.
 */
export default function SnippetFormDialog({ open, theme, initialCode = '', onClose, onSaved }) {
  const [id,          setId]          = useState('');
  const [name,        setName]        = useState('');
  const [category,    setCategory]    = useState('layout');
  const [language,    setLanguage]    = useState('twig');
  const [description, setDescription] = useState('');
  const [code,        setCode]        = useState('');
  const [busy,        setBusy]        = useState(false);
  const [error,       setError]       = useState(null);

  useEffect(() => {
    if (!open) return;
    setId(''); setName('');
    setCategory('layout'); setLanguage('twig');
    setDescription(''); setCode(initialCode || '');
    setError(null);
  }, [open, initialCode]);

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
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(id)) {
      setError('Id must be lowercase letters, digits, dashes or underscores (no spaces).');
      return;
    }
    if (!code.trim()) {
      setError('Code is required.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.post('/themes/snippets-add', {
        theme: theme || undefined,
        snippet: {
          id, name: name.trim(), category, language,
          description: description.trim(), content: code,
        },
      });
      onSaved?.(res.snippet);
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
          <h3 className="text-sm font-semibold">New snippet</h3>
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="ID">
              <Input
                value={id}
                onChange={(e) => setId(e.target.value.toLowerCase())}
                placeholder="hero-section"
                autoFocus
                spellCheck={false}
              />
            </Field>
            <Field label="Name">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hero section" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </Field>
            <Field label="Language">
              <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                <option value="twig">Twig</option>
                <option value="php">PHP</option>
              </Select>
            </Field>
          </div>
          <Field label="Description">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this snippet does, where you'd use it."
            />
          </Field>
          <Field label="Code">
            <Textarea
              rows={10}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="<section>...</section>"
              className="font-mono text-[12px]"
              spellCheck={false}
            />
          </Field>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Create snippet'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
