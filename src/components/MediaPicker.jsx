import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/index.js';
import useFocusTrap from '../lib/useFocusTrap.js';
import MediaPickerLibraryTab from './MediaPickerLibraryTab.jsx';
import MediaPickerUploadTab from './MediaPickerUploadTab.jsx';

/**
 * WordPress-style media picker. Previously had Library/Upload tabs; both
 * surfaces are now stacked in a single view (upload on top, library grid
 * below) so the common path — "drop a file" or "pick an existing one" —
 * doesn't require choosing a tab first. The two child components live in
 * their own files; this is just the modal shell.
 *
 * Portal-mounted on `document.body` so it sits above the Toast UI editor
 * without z-index gymnastics. Closing happens via Esc, the backdrop click,
 * or the Close button.
 *
 * Accessibility: announced as `role="dialog" aria-modal="true"`, labelled by
 * the header title. Focus is trapped while open and restored to the opener on
 * close (via `useFocusTrap`).
 */
export default function MediaPicker({ open, onClose, onPick, pagePath = '' }) {
  const dialogRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useFocusTrap(dialogRef, open);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex h-[80vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-modal"
      >
        <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
          <h2 id={titleId} className="text-sm font-medium text-zinc-900">Media</h2>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </header>

        {/* Upload stays pinned at the top; the library scrolls below so a
            large grid can never push the dropzone off-screen. */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-5">
          <MediaPickerUploadTab onPick={onPick} pagePath={pagePath} />
          <div className="flex-1 overflow-y-auto">
            <MediaPickerLibraryTab onPick={onPick} pagePath={pagePath} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
