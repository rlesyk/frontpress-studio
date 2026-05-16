import { Fragment } from 'react';

// Middle column: the tree, rendered as a stack of selectable cards. Each
// card surfaces the block's type label, its primary content (heading text,
// paragraph snippet, image src) and per-block actions (move ↑↓, delete).
// Container blocks (section, columns) render their children indented
// underneath so the tree is visually obvious without a separate outliner.
//
// Selection is single-block. Selected card gets a primary-coloured ring;
// the inspector binds to whichever block has the selectedId.
export default function BlockCanvas({
  tree,
  selectedId,
  onSelect,
  onMove,
  onRemove,
  registry,
}) {
  if (!tree.length) {
    return (
      <div className="flex h-full items-center justify-center bg-zinc-50">
        <div className="max-w-sm rounded-lg border border-dashed border-zinc-300 bg-white px-6 py-8 text-center text-sm text-zinc-500">
          Empty page. Pick a block from the palette on the left to start composing.
        </div>
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto bg-zinc-50 p-4">
      <BlockList
        tree={tree}
        depth={0}
        selectedId={selectedId}
        onSelect={onSelect}
        onMove={onMove}
        onRemove={onRemove}
        registry={registry}
      />
    </div>
  );
}

function BlockList({ tree, depth, selectedId, onSelect, onMove, onRemove, registry }) {
  return (
    <ul className="space-y-2" style={{ marginLeft: depth ? '1.25rem' : 0 }}>
      {tree.map((block, idx) => {
        const def = registry?.find((r) => r.slug === block.type);
        const isSelected = block.id === selectedId;
        return (
          <Fragment key={block.id}>
            <li>
              <article
                onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
                className={`group cursor-pointer rounded-md border bg-white p-3 transition ${
                  isSelected
                    ? 'border-zinc-900 ring-2 ring-zinc-900/15'
                    : 'border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <header className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-zinc-200 bg-zinc-50 font-mono text-[12px] text-zinc-700">
                      {def?.icon || block.type.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-[12px] font-semibold uppercase tracking-wide text-zinc-700">
                      {def?.label || block.type}
                    </span>
                    <Summary block={block} />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <IconButton title="Move up"   onClick={(e) => { e.stopPropagation(); onMove(block.id, 'up'); }}   disabled={idx === 0}>↑</IconButton>
                    <IconButton title="Move down" onClick={(e) => { e.stopPropagation(); onMove(block.id, 'down'); }} disabled={idx === tree.length - 1}>↓</IconButton>
                    <IconButton title="Delete"    onClick={(e) => { e.stopPropagation(); onRemove(block.id); }} tone="danger">×</IconButton>
                  </div>
                </header>
                {Array.isArray(block.children) && (
                  <div className="mt-2 border-t border-zinc-100 pt-2">
                    <BlockList
                      tree={block.children}
                      depth={depth + 1}
                      selectedId={selectedId}
                      onSelect={onSelect}
                      onMove={onMove}
                      onRemove={onRemove}
                      registry={registry}
                    />
                  </div>
                )}
              </article>
            </li>
          </Fragment>
        );
      })}
    </ul>
  );
}

/** Short text summary of what's inside a block — heading text, paragraph snippet, image src, etc. */
function Summary({ block }) {
  const d = block.data || {};
  let txt = '';
  if (d.text) txt = String(d.text);
  else if (d.src) txt = String(d.src);
  else if (d.background) txt = `bg ${d.background}`;
  else if (Array.isArray(block.children)) txt = `${block.children.length} block${block.children.length === 1 ? '' : 's'} inside`;
  if (!txt) return null;
  return (
    <span className="truncate font-normal text-[12px] text-zinc-500">
      — {txt.length > 80 ? txt.slice(0, 80) + '…' : txt}
    </span>
  );
}

function IconButton({ children, tone = 'plain', ...rest }) {
  const palette = tone === 'danger'
    ? 'text-red-600 hover:bg-red-50'
    : 'text-zinc-700 hover:bg-zinc-100';
  return (
    <button
      type="button"
      {...rest}
      className={`inline-flex h-6 w-6 items-center justify-center rounded text-[14px] font-semibold disabled:cursor-not-allowed disabled:opacity-30 ${palette}`}
    >
      {children}
    </button>
  );
}
