import { memo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useConfirmDialog, useFileUpload } from '../lib/hooks.js';
import { extLabel, isImageFile } from '../lib/utils.js';
import { Alert, Button, ConfirmDialog } from '../components/ui/index.js';

export default function Media() {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const { confirm, dialogProps } = useConfirmDialog();

  const { data, isLoading } = useQuery({
    queryKey: ['media'],
    queryFn: () => api.get('/media'),
  });

  const del = useMutation({
    mutationFn: (name) => api.delete(`/media/${encodeURIComponent(name)}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  });

  async function askDelete(name) {
    const ok = await confirm({
      title: 'Delete media',
      message: `Delete ${name}? This cannot be undone.`,
    });
    if (ok) del.mutate(name);
  }

  const { upload, busy, error } = useFileUpload({
    endpoint: '/admin/api/media',
    invalidate: [['media']],
  });

  async function onPick(e) {
    const f = e.target.files?.[0];
    try { await upload(f); } catch {} finally { e.target.value = ''; }
  }

  if (isLoading) return <div className="text-sm text-zinc-500">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Media library</h1>
        <div>
          <input ref={fileRef} type="file" hidden onChange={onPick} />
          <Button onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {(data?.files || []).length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
            No files yet.
          </div>
        )}
        {(data?.files || []).map(f => (
          <MediaItem key={f.name + (f.url || '')} file={f} onDelete={() => askDelete(f.name)} />
        ))}
      </div>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}

const MediaItem = memo(function MediaItem({ file, onDelete }) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white">
      {isImageFile(file) ? (
        <img
          src={file.thumb_url || file.url}
          alt={file.alt || file.name}
          loading="lazy"
          decoding="async"
          className="aspect-square w-full object-cover"
        />
      ) : (
        <div className="flex aspect-square w-full items-center justify-center bg-zinc-50 text-xs text-zinc-500">
          {extLabel(file.name)}
        </div>
      )}
      <div className="border-t border-zinc-100 p-2">
        <div className="truncate text-xs font-medium" title={file.name}>{file.name}</div>
        <div className="mt-1 flex items-center justify-between">
          <a href={file.url} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 hover:underline">
            View
          </a>
          <button
            onClick={onDelete}
            className="text-xs text-red-600 hover:underline"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
});

