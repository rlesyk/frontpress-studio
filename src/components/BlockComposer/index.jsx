import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, getCsrf } from '../../lib/api.js';
import { appendBlock, findById, makeId, moveById, removeById, updateById } from '../../lib/blockHelpers.js';
import BlockCanvas from './BlockCanvas.jsx';
import BlockInspector from './BlockInspector.jsx';
import BlockPalette from './BlockPalette.jsx';

// Three-pane page-builder surface: Palette | Canvas | Inspector.
// Owns the block tree as controlled state; the parent (PageEditor) reads
// `tree` and feeds it to the save mutation as the `blocks` field.
//
// v1 deliberately avoids drag/drop, cross-parent reordering, and inline
// canvas editing — the inspector handles all field edits, the canvas
// handles selection + move/delete + nesting visualization, the palette
// adds blocks. Plenty for a real first pass; everything above is polish.
export default function BlockComposer({ tree, onChange, pageMeta }) {
  const [selectedId, setSelectedId] = useState(null);

  // Registry from the server. Refetched on every mount — block.json edits
  // are infrequent enough that we don't need clever caching.
  const reg = useQuery({
    queryKey: ['blocks'],
    queryFn: () => api.get('/blocks'),
  });
  const registry = reg.data?.blocks || [];

  // Make sure every block in the tree has an id (older saves may not).
  useEffect(() => {
    let needsIds = false;
    function check(list) {
      for (const b of list || []) {
        if (!b.id) { needsIds = true; return; }
        if (Array.isArray(b.children)) check(b.children);
      }
    }
    check(tree);
    if (!needsIds) return;
    function seed(list) {
      return (list || []).map((b) => ({
        ...b,
        id: b.id || makeId(),
        ...(Array.isArray(b.children) ? { children: seed(b.children) } : {}),
      }));
    }
    onChange(seed(tree));
  }, [tree, onChange]);

  const selected = useMemo(() => (selectedId ? findById(tree, selectedId) : null), [tree, selectedId]);
  const selectedDef = useMemo(
    () => (selected ? registry.find((r) => r.slug === selected.block.type) : null),
    [selected, registry],
  );

  const addingTo = useMemo(() => {
    if (!selected) return null;
    const def = registry.find((r) => r.slug === selected.block.type);
    return def?.hasChildren ? selected.block : null;
  }, [selected, registry]);

  const addBlock = useCallback((def) => {
    onChange(appendBlock(tree, def, addingTo?.id || null));
  }, [tree, addingTo, onChange]);

  const moveBlock = useCallback((id, dir) => {
    onChange(moveById(tree, id, dir));
  }, [tree, onChange]);

  const removeBlock = useCallback((id) => {
    onChange(removeById(tree, id));
    if (id === selectedId) setSelectedId(null);
  }, [tree, onChange, selectedId]);

  const setField = useCallback((id, name, value) => {
    onChange(updateById(tree, id, (b) => ({ ...b, data: { ...b.data, [name]: value } })));
  }, [tree, onChange]);

  // Live preview at the bottom of the canvas — POST the full tree to the
  // server renderer, get HTML back, drop it into an isolated <iframe>.
  // Debounced so typing in a text field doesn't fire a request per keystroke.
  const previewHtml = useLivePreview(tree, pageMeta);

  return (
    <div className="grid h-full min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)_280px]">
      <BlockPalette
        blocks={registry}
        onAdd={addBlock}
        addingTo={addingTo}
      />
      <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_minmax(180px,40%)]">
        <BlockCanvas
          tree={tree}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMove={moveBlock}
          onRemove={removeBlock}
          registry={registry}
        />
        <div className="border-t border-zinc-200 bg-white">
          <div className="border-b border-zinc-100 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500">
            Preview
          </div>
          <iframe
            title="Live block preview"
            srcDoc={previewHtml}
            sandbox="allow-same-origin"
            className="h-full w-full"
          />
        </div>
      </div>
      <BlockInspector
        block={selected?.block || null}
        def={selectedDef}
        onFieldChange={setField}
        onRemove={removeBlock}
      />
    </div>
  );
}

function useLivePreview(tree, pageMeta) {
  const [html, setHtml] = useState('');
  useEffect(() => {
    const t = setTimeout(async () => {
      try {
        const res = await fetch('/admin/api/blocks/render', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() },
          body: JSON.stringify({ blocks: tree, page: pageMeta || {} }),
        });
        const data = await res.json();
        if (data.ok) setHtml(wrapPreview(data.html || '<p style="color:#999;padding:1rem">Empty</p>'));
      } catch { /* leave previous */ }
    }, 300);
    return () => clearTimeout(t);
  }, [tree, pageMeta]);
  return html;
}

function wrapPreview(inner) {
  // Minimal HTML document so the preview iframe renders with sane defaults
  // and a system font stack. Active theme styles aren't pulled in here —
  // for now the canvas previews each block in isolation; refining to the
  // theme's actual CSS context is a follow-up.
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { font-family: -apple-system, BlinkMacSystemFont, system-ui, sans-serif; margin: 0; padding: 1rem; color: #18181b; }
    h1, h2, h3, h4, h5, h6 { margin: .75rem 0 .5rem; }
    p { margin: 0 0 .75rem; line-height: 1.5; }
  </style></head><body>${inner}</body></html>`;
}
