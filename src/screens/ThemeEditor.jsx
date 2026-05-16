import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useToast } from '../lib/toast.jsx';
import { Button } from '../components/ui/index.js';
import FileTree from '../components/ThemeEditor/FileTree.jsx';
import EditorPane from '../components/ThemeEditor/EditorPane.jsx';
import PreviewPane from '../components/ThemeEditor/PreviewPane.jsx';
import BlockComposer from '../components/BlockComposer/index.jsx';

// GrapesJS pulls in a 15MB dependency tree — only load it when the user
// opens a `.html` file. Twig / PHP / CSS workflows never pay for it.
const VisualEditorPane = lazy(() => import('../components/ThemeEditor/VisualEditorPane.jsx'));

// File extensions that the visual page builder owns. The on-disk format is
// JSON ({ blocks: [...] }); the editor surface is the BlockComposer.
const VISUAL_EXT = '.fp.json';

// Theme editor — three surfaces depending on the selected file:
//   *.fp.json  → BlockComposer (visual page builder, JSON tree on disk)
//   *.html     → GrapesJS visual editor (lazy-loaded)
//   anything   → CodeMirror + iframe preview
//
// Buffers (path → current text/tree) live here so switching files doesn't
// nuke unsaved work. `dirty` tracks which buffers diverged from the
// last-saved server state. `previewVersion` bumps on save so the iframe
// cache-busts and reloads with the new bundle.
export default function ThemeEditor() {
  const qc = useQueryClient();
  const toast = useToast();

  const [currentPath, setCurrentPath] = useState('');
  const [buffers, setBuffers] = useState({});
  const [savedAt, setSavedAt] = useState({});
  const [previewVersion, setPreviewVersion] = useState(() => Date.now());
  const [hover, setHover] = useState(null);

  const tree = useQuery({
    queryKey: ['theme-tree'],
    queryFn: () => api.get('/theme/tree'),
  });

  // Auto-pick a first file (templates/post.* if it exists, else first file).
  useEffect(() => {
    if (currentPath) return;
    const files = (tree.data?.entries || []).filter((e) => e.type === 'file');
    if (!files.length) return;
    const post = files.find((f) => f.path === 'templates/post.twig' || f.path === 'templates/post.php');
    setCurrentPath((post || files[0]).path);
  }, [tree.data, currentPath]);

  const file = useQuery({
    queryKey: ['theme-file', currentPath],
    queryFn: () => api.get(`/theme/file?path=${encodeURIComponent(currentPath)}`),
    enabled: !!currentPath,
  });

  // Hydrate the buffer from the server response. Don't overwrite a buffer
  // that already has unsaved local edits.
  useEffect(() => {
    if (!file.data || !currentPath) return;
    setBuffers((prev) => (prev[currentPath] !== undefined ? prev : { ...prev, [currentPath]: file.data.contents }));
    setSavedAt((prev) => ({ ...prev, [currentPath]: file.data.contents }));
  }, [file.data, currentPath]);

  const save = useMutation({
    mutationFn: () => api.put('/theme/file', { path: currentPath, contents: buffers[currentPath] ?? '' }),
    onSuccess: () => {
      setSavedAt((prev) => ({ ...prev, [currentPath]: buffers[currentPath] }));
      setPreviewVersion(Date.now());
      qc.invalidateQueries({ queryKey: ['theme-tree'] });
      toast.show(`Saved ${currentPath}.`, { duration: 1800 });
    },
    onError: (err) => toast.show(err.message || "Couldn't save.", { tone: 'error' }),
  });

  // Create a fresh visual template. Prompts for a name; lands in templates/.
  const newVisual = useMutation({
    mutationFn: async () => {
      const raw = window.prompt('Name for visual template (e.g. hero, landing, _cta):');
      if (!raw) return null;
      const slug = raw.trim().replace(/[^A-Za-z0-9._-]/g, '');
      if (!slug) throw new Error('Invalid name.');
      const path = `templates/${slug}${slug.endsWith(VISUAL_EXT) ? '' : VISUAL_EXT}`;
      const initial = JSON.stringify({ blocks: [] }, null, 2);
      await api.put('/theme/file', { path, contents: initial });
      return path;
    },
    onSuccess: (path) => {
      if (!path) return;
      qc.invalidateQueries({ queryKey: ['theme-tree'] });
      setCurrentPath(path);
      toast.show(`Created ${path}.`, { duration: 1800 });
    },
    onError: (err) => toast.show(err.message || "Couldn't create.", { tone: 'error' }),
  });

  const dirtySet = useMemo(() => {
    const out = new Set();
    for (const p of Object.keys(buffers)) {
      if (buffers[p] !== savedAt[p]) out.add(p);
    }
    return out;
  }, [buffers, savedAt]);

  function selectFile(path) {
    setCurrentPath(path);
  }

  function updateBuffer(v) {
    setBuffers((prev) => ({ ...prev, [currentPath]: v }));
  }

  const onHover = useCallback((tag, className) => {
    setHover(className ? `<${tag} class="${className}">` : `<${tag}>`);
  }, []);

  // Branch on extension. Order matters: .fp.json before .html.
  const isVisualBlocks = currentPath.toLowerCase().endsWith(VISUAL_EXT);
  const isVisualHtml   = !isVisualBlocks && currentPath.toLowerCase().endsWith('.html');

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-white px-6 py-3">
        <div>
          <h1 className="text-base font-semibold">Theme editor</h1>
          <p className="text-xs text-zinc-500">
            Editing <strong>{tree.data?.theme || '…'}</strong> — changes save to disk and the preview reloads.
            {hover && <span className="ml-2 font-mono text-[11px] text-amber-700">{hover}</span>}
          </p>
        </div>
        <Button onClick={() => newVisual.mutate()} disabled={newVisual.isPending}>
          {newVisual.isPending ? 'Creating…' : '+ New visual template'}
        </Button>
      </header>

      <div className={`grid min-h-0 flex-1 ${isVisualBlocks ? 'grid-cols-[240px_minmax(0,1fr)]' : isVisualHtml ? 'grid-cols-[240px_minmax(0,1fr)]' : 'grid-cols-[240px_minmax(0,1fr)_minmax(0,1fr)]'}`}>
        <FileTree
          entries={tree.data?.entries}
          currentPath={currentPath}
          dirty={dirtySet}
          onSelect={selectFile}
        />

        {isVisualBlocks ? (
          <VisualBlocksPane
            currentPath={currentPath}
            buffer={buffers[currentPath]}
            saved={savedAt[currentPath]}
            loading={file.isLoading}
            saving={save.isPending}
            error={file.error?.message || save.error?.message}
            onChange={updateBuffer}
            onSave={() => save.mutate()}
          />
        ) : isVisualHtml ? (
          <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading visual editor…</div>}>
            <VisualEditorPane
              path={currentPath}
              contents={buffers[currentPath] ?? ''}
              loading={file.isLoading}
              error={file.error?.message}
              dirty={dirtySet.has(currentPath)}
              saving={save.isPending}
              saveError={save.error?.message}
              onChange={updateBuffer}
              onSave={() => save.mutate()}
            />
          </Suspense>
        ) : (
          <>
            <EditorPane
              path={currentPath}
              contents={buffers[currentPath] ?? ''}
              loading={file.isLoading}
              error={file.error?.message}
              dirty={dirtySet.has(currentPath)}
              saving={save.isPending}
              saveError={save.error?.message}
              onChange={updateBuffer}
              onSave={() => save.mutate()}
            />
            <PreviewPane version={previewVersion} onHover={onHover} />
          </>
        )}
      </div>
    </div>
  );
}

// Wrapper that translates between the BlockComposer's tree-state and the
// JSON string the file buffer carries on disk. Save flow: parse buffer →
// hand tree to composer → composer emits new tree → re-stringify into the
// buffer. Save button writes the buffer string to disk.
function VisualBlocksPane({ currentPath, buffer, saved, loading, saving, error, onChange, onSave }) {
  const tree = useMemo(() => parseTree(buffer), [buffer]);

  const handleTreeChange = useCallback((next) => {
    onChange(JSON.stringify({ blocks: next }, null, 2));
  }, [onChange]);

  const dirty = buffer !== saved;

  if (loading) {
    return <div className="p-6 text-sm text-zinc-500">Loading {currentPath}…</div>;
  }

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2">
        <div className="flex items-center gap-2 truncate">
          <code className="truncate font-mono text-[12px] text-zinc-800">{currentPath}</code>
          <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700">Visual</span>
          {dirty && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">Unsaved</span>}
        </div>
        <Button onClick={onSave} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save (⌘S)'}
        </Button>
      </div>
      {error && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-[13px] text-red-700">
          {error}
        </div>
      )}
      <div className="min-h-0 flex-1">
        <BlockComposer
          tree={tree}
          onChange={handleTreeChange}
          pageMeta={{}}
        />
      </div>
    </div>
  );
}

function parseTree(buffer) {
  if (!buffer) return [];
  try {
    const json = JSON.parse(buffer);
    return Array.isArray(json?.blocks) ? json.blocks : [];
  } catch {
    return [];
  }
}
