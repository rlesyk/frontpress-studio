import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, SegmentedControl } from './ui/index.js';
import useFocusTrap from '../lib/useFocusTrap.js';
import MediaPickerLibraryTab from './MediaPickerLibraryTab.jsx';
import MediaPickerUploadTab from './MediaPickerUploadTab.jsx';
import MediaPickerUnsplash from './MediaPickerUnsplash.jsx';

const SOURCES = [
  { value: 'local',    label: 'Local'    },
  { value: 'unsplash', label: 'Unsplash' },
];

/**
 * WordPress-style media picker. Layout has two zones:
 *
 *   1. The "add new" zone at the top — a Local/Unsplash segmented
 *      toggle picks the source, then renders either the local dropzone
 *      or the Unsplash search inline. Only one is visible at a time
 *      because they're alternative ways to add a brand-new image.
 *
 *   2. The library grid below — every image already in `site/uploads/`
 *      (plus this post's per-post folder when `pagePath` is set).
 *      Always visible regardless of the active "add new" tab; you don't
 *      have to flip back to a "Library" tab to pick something you've
 *      already uploaded.
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
  const [source, setSource] = useState('local');

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

        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-5">
          <div className="flex items-center justify-between">
            <SegmentedControl
              ariaLabel="Add image source"
              value={source}
              onChange={setSource}
              options={SOURCES}
            />
          </div>

          {source === 'local'    && <MediaPickerUploadTab onPick={onPick} pagePath={pagePath} />}
          {source === 'unsplash' && <MediaPickerUnsplash  onPick={onPick} pagePath={pagePath} />}

          <div className="flex-1 overflow-y-auto">
            <MediaPickerLibraryTab onPick={onPick} pagePath={pagePath} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
