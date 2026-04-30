import { useRef, useState } from 'react';
import { useFileUpload } from '../lib/hooks.js';
import { Alert, Button } from './ui/index.js';

// Upload tab for the MediaPicker — drop-zone + click-to-pick. On a successful
// `POST /admin/api/media` the new file is auto-selected via `onPick`.
export default function MediaPickerUploadTab({ onPick, pagePath }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const { upload, busy, error } = useFileUpload({
    endpoint: '/admin/api/media',
    extraFields: pagePath ? { page_path: pagePath } : {},
    invalidate: [['media']],
  });

  async function uploadFile(file) {
    if (!file) return;
    try {
      const data = await upload(file);
      onPick({ url: data.url, alt: file.name });
    } catch { /* error surfaced via the hook */ }
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
