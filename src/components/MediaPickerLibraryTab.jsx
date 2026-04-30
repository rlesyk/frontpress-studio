import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { isImageFile } from '../lib/utils.js';

// Library tab for the MediaPicker — grid of image thumbnails. Click any tile
// to confirm; the picked item flows back through `onPick`.
export default function MediaPickerLibraryTab({ onPick, pagePath }) {
  const url = pagePath ? `/media?page_path=${encodeURIComponent(pagePath)}` : '/media';
  const { data, isLoading } = useQuery({
    queryKey: ['media', pagePath || 'all'],
    queryFn: () => api.get(url),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-lg bg-zinc-100" />
        ))}
      </div>
    );
  }
  const files = (data?.files || []).filter(isImageFile);
  if (files.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
        No images yet. Switch to <strong>Upload</strong> to add some.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {files.map((f) => (
        <button
          key={f.name + (f.url || '')}
          type="button"
          onClick={() => onPick({ url: f.url, alt: f.alt || f.name })}
          className="group overflow-hidden rounded-lg border border-zinc-200 bg-white text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/20"
        >
          <img
            src={f.thumb_url || f.url}
            alt={f.alt || f.name}
            loading="lazy"
            decoding="async"
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
