import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/index.js';
import MediaPickerLibraryTab from './MediaPickerLibraryTab.jsx';
import MediaPickerUploadTab from './MediaPickerUploadTab.jsx';

/**
 * WordPress-style media picker. Two tabs (Library / Upload) live in their own
 * files; this component is just the modal shell + tab switcher. Portal-mounted
 * on `document.body` so it sits above the Toast UI editor without z-index
 * gymnastics. Closing happens via Esc, the backdrop click, or the Cancel button.
 */
export default function MediaPicker({ open, onClose, onPick, pagePath = '' }) {
  const [tab, setTab] = useState('library');

  // Reset tab to "library" each time the modal re-opens so users don't get
  // stuck on the upload tab from a previous session.
  useEffect(() => { if (open) setTab('library'); }, [open]);

  useEffect(() => {
    if (!open) return undefined;
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
          {tab === 'library' && <MediaPickerLibraryTab onPick={onPick} pagePath={pagePath} />}
          {tab === 'upload'  && <MediaPickerUploadTab  onPick={onPick} pagePath={pagePath} />}
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
