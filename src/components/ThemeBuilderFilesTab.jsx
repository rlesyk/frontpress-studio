import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import useFocusTrap from '../lib/useFocusTrap.js';
import { api } from '../lib/api.js';
import { Alert, Button, ConfirmDialog, Field, Input } from './ui/index.js';
import { IconFile, IconPlus } from './icons.jsx';

// Files panel for the Theme Builder's left sidebar. List + "+" button +
// right-click menu driving the file-create/rename/duplicate/delete
// endpoints; create/rename/duplicate share PathDialog.
export default function ThemeBuilderFilesTab({
  theme,
  files,
  selectedPath,
  dirty,
  onSelectFile,
}) {
  const qc = useQueryClient();
  const [menu, setMenu] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [topError, setTopError] = useState('');

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['theme-files', theme] });

  const onMutated = (next) => {
    invalidate();
    setDialog(null);
    setTopError('');
    if (next) onSelectFile?.(next);
  };

  const createMut = useMutation({
    mutationFn: ({ path }) => api.post('/themes/file-create', { theme, path, content: '' }),
    onSuccess: (res) => onMutated(res.path),
  });
  const renameMut = useMutation({
    mutationFn: ({ from, to }) => api.post('/themes/file-rename', { theme, from, to }),
    onSuccess: (res) => onMutated(selectedPath === res.from ? res.path : null),
  });
  const dupMut = useMutation({
    mutationFn: ({ from, to }) => api.post('/themes/file-duplicate', { theme, from, to }),
    onSuccess: (res) => onMutated(res.path),
  });
  const deleteMut = useMutation({
    mutationFn: ({ path }) => api.post('/themes/file-delete', { theme, path }),
    onSuccess: (res) => {
      invalidate();
      setPendingDelete(null);
      // If the deleted file was open, fall back to a sibling.
      if (selectedPath === res.path) {
        const sibling = files.find((f) => f.path !== res.path);
        if (sibling) onSelectFile?.(sibling.path);
      }
    },
    onError: (e) => { setPendingDelete(null); setTopError(e.message); },
  });

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('click', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  const dialogError = (createMut.error || renameMut.error || dupMut.error)?.message || '';
  const dialogPending = createMut.isPending || renameMut.isPending || dupMut.isPending;

  function runRowAction(action, file) {
    setMenu(null);
    if (action === 'rename')         { renameMut.reset(); setDialog({ mode: 'rename', file }); }
    else if (action === 'duplicate') { dupMut.reset();    setDialog({ mode: 'duplicate', file }); }
    else                             { setTopError('');    setPendingDelete(file); }
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          Theme files
        </span>
        <button
          type="button"
          onClick={() => {
            setTopError('');
            createMut.reset();
            setDialog({ mode: 'create' });
          }}
          title="New file"
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        >
          {IconPlus}
          New
        </button>
      </div>

      {topError && (
        <div className="mb-2 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] text-rose-700">{topError}</div>
      )}

      {!files?.length ? (
        <div className="text-xs text-zinc-500">No files in this theme.</div>
      ) : (
        <ul className="space-y-0.5">
          {files.map((file) => {
            const active = file.path === selectedPath;
            return (
              <li key={file.path}>
                <button
                  type="button"
                  onClick={() => onSelectFile?.(file.path)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMenu({ file, x: e.clientX, y: e.clientY });
                  }}
                  title={file.path}
                  className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs font-medium ${
                    active
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                  }`}
                >
                  <span className="shrink-0">
                    <IconFile ext={extOf(file.name)} mono={active} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {file.name}
                    {active && dirty ? ' *' : ''}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {menu && createPortal(
        <ContextMenu x={menu.x} y={menu.y} onAction={(a) => runRowAction(a, menu.file)} />,
        document.body,
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete file?"
        message={pendingDelete ? `${pendingDelete.path} will be permanently removed.` : ''}
        confirmLabel={deleteMut.isPending ? 'Deleting…' : 'Delete'}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete || deleteMut.isPending) return;
          deleteMut.mutate({ path: pendingDelete.path });
        }}
      />

      {dialog && (
        <PathDialog
          mode={dialog.mode}
          file={dialog.file}
          files={files}
          error={dialogError}
          pending={dialogPending}
          onClose={() => setDialog(null)}
          onSubmit={(path) => {
            if (dialog.mode === 'create') createMut.mutate({ path });
            else if (dialog.mode === 'rename') renameMut.mutate({ from: dialog.file.path, to: path });
            else dupMut.mutate({ from: dialog.file.path, to: path });
          }}
        />
      )}
    </div>
  );
}

function extOf(name) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1) : '';
}

function ContextMenu({ x, y, onAction }) {
  const item = (label, action, danger) => (
    <button
      type="button"
      role="menuitem"
      onClick={() => onAction(action)}
      className={`block w-full px-3 py-1.5 text-left text-xs ${
        danger ? 'text-rose-600 hover:bg-rose-50' : 'text-zinc-700 hover:bg-zinc-100'
      }`}
    >
      {label}
    </button>
  );
  // stopPropagation: a menu click shouldn't also fire the window-level
  // close-on-outside-click handler.
  return (
    <div
      role="menu"
      onClick={(e) => e.stopPropagation()}
      className="fixed z-50 min-w-[160px] overflow-hidden rounded-md border border-zinc-200 bg-white py-1 shadow-lg"
      style={{ left: x, top: y }}
    >
      {item('Rename...', 'rename')}
      {item('Duplicate...', 'duplicate')}
      <div className="my-1 border-t border-zinc-100" />
      {item('Delete', 'delete', true)}
    </div>
  );
}

function PathDialog({ mode, file, files, error, pending, onClose, onSubmit }) {
  const ref = useRef(null);
  const inputRef = useRef(null);
  useFocusTrap(ref, true, inputRef);

  const [path, setPath] = useState(() => {
    if (mode === 'rename')    return file?.path || '';
    if (mode === 'duplicate') return uniqueCopyPath(file?.path, files);
    return 'templates/new.twig';
  });

  const title = mode === 'create'
    ? 'New file'
    : `${mode === 'rename' ? 'Rename' : 'Duplicate'} ${file?.name}`;
  const submitLabel = mode === 'create' ? 'Create' : mode === 'rename' ? 'Rename' : 'Duplicate';

  function submit(e) {
    e.preventDefault();
    const next = path.trim();
    if (!next || pending) return;
    onSubmit(next);
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="files-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl"
      >
        <h2 id="files-dialog-title" className="mb-3 text-sm font-semibold text-zinc-900">
          {title}
        </h2>
        <form onSubmit={submit} className="space-y-3">
          <Field
            label="Path"
            hint="Under templates/ or assets/. Allowed: twig, php, html, css, scss, js."
          >
            <Input
              ref={inputRef}
              mono
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="templates/about.twig"
            />
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !path.trim()}>
              {pending ? `${submitLabel}…` : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

// Default destination for the Duplicate flow. If the source already ends
// in `.copy` / `.copy<N>` we bump the number instead of stacking, so
// re-duplicating "foo.copy.twig" gives "foo.copy2.twig", not
// "foo.copy.copy.twig".
function uniqueCopyPath(path, files) {
  if (!path) return '';
  const dot = path.lastIndexOf('.');
  let stem = dot >= 0 ? path.slice(0, dot) : path;
  const ext = dot >= 0 ? path.slice(dot) : '';
  const m = /\.copy(\d*)$/.exec(stem);
  if (m) stem = stem.slice(0, -m[0].length);
  const taken = new Set((files || []).map((f) => f.path));
  let i = m ? Math.max(2, (parseInt(m[1] || '1', 10) || 1) + 1) : 1;
  let next = i === 1 ? `${stem}.copy${ext}` : `${stem}.copy${i}${ext}`;
  while (taken.has(next)) { i = Math.max(i + 1, 2); next = `${stem}.copy${i}${ext}`; }
  return next;
}
