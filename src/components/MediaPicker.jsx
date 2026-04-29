import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getCsrf } from '../lib/api.js';
import { Alert, Button } from './ui/index.js';

/**
 * WordPress-style media picker. Two tabs:
 *
 *   1. **Library** — grid of thumbnails from `GET /admin/api/media`. Click a
 *      tile to confirm; the chosen file flows back through `onPick`.
 *   2. **Upload** — dropzone / click-to-pick. On a successful upload to
 *      `POST /admin/api/media`, the new file is auto-selected.
 *
 * The modal is a portal mounted on `document.body` so it can sit above the
 * Toast UI editor without z-index gymnastics. Closing happens via Esc, the
 * backdrop click, or the Cancel button.
 */
export default function MediaPicker({ open, onClose, onPick, pagePath = '' }) {
  const [tab, setTab] = useState('library');

  // Reset tab to "library" each time the modal re-opens so users don't get
  // stuck on the upload tab from a previous session.
  useEffect(() => { if (open) setTab('library'); }, [open]);

  // Esc key closes — keeps keyboard parity with most modal libraries.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-lg">
        <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
          <div className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1">
            <TabButton active={tab === 'library'} onClick={() => setTab('library')}>Library</TabButton>
            <TabButton active={tab === 'upload'}  onClick={() => setTab('upload')}>Upload</TabButton>
          </div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'library' && <LibraryTab onPick={onPick} pagePath={pagePath} />}
          {tab === 'upload'  && <UploadTab  onPick={onPick} pagePath={pagePath} />}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function TabButton({ active, children, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      className={`rounded px-2.5 py-1 text-[12px] font-medium transition-colors ${
        active ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
      }`}
    >
      {children}
    </button>
  );
}

function LibraryTab({ onPick, pagePath }) {
  const url = pagePath ? `/media?page_path=${encodeURIComponent(pagePath)}` : '/media';
  const { data, isLoading } = useQuery({
    queryKey: ['media', pagePath || 'all'],
    queryFn: () => api.get(url),
  });

  if (isLoading) return <div className="text-sm text-zinc-500">Loading…</div>;
  const files = (data?.files || []).filter(isImage);
  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
        No images yet. Switch to <strong>Upload</strong> to add some.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {files.map(f => (
        <button
          key={f.name + (f.url || '')}
          type="button"
          onClick={() => onPick({ url: f.url, alt: f.alt || f.name })}
          className="group overflow-hidden rounded-lg border border-zinc-200 bg-white text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <img
            src={f.thumb_url || f.url}
            alt={f.alt || f.name}
            className="aspect-square w-full object-cover"
          />
          <div className="border-t border-zinc-100 p-2">
            <div className="truncate text-xs" title={f.name}>{f.name}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function UploadTab({ onPick, pagePath }) {
  const qc = useQueryClient();
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [drag, setDrag] = useState(false);

  async function uploadFile(file) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (pagePath) fd.append('page_path', pagePath);
      const res = await fetch('/admin/api/media', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'X-CSRF-Token': getCsrf() },
        body: fd,
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Upload failed');
      qc.invalidateQueries({ queryKey: ['media'] });
      onPick({ url: data.url, alt: file.name });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {error && <Alert tone="error">{error}</Alert>}

      <div
        onDragEnter={(e) => { e.preventDefault(); setDrag(true); }}
        onDragOver={(e)  => { e.preventDefault(); setDrag(true); }}
        onDragLeave={()  => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          uploadFile(e.dataTransfer.files?.[0]);
        }}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
          drag ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-300 bg-white'
        }`}
      >
        <p className="text-sm text-zinc-700">Drop an image here</p>
        <p className="mt-1 text-xs text-zinc-500">or</p>
        <Button
          variant="secondary"
          className="mt-3"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Uploading…' : 'Choose file'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => { uploadFile(e.target.files?.[0]); e.target.value = ''; }}
        />
      </div>
    </div>
  );
}

function isImage(f) {
  return /\.(jpe?g|png|gif|webp|svg)$/i.test(f.name);
}
