import { useMemo, useState } from 'react';

// Hierarchical outline of the entire block tree. Bricks-style — each row
// shows the block label + icon, with collapsible chevrons for containers.
// Clicking a row selects the block; the canvas + inspector sync through
// the shared selectedId state.
export default function ListView({ tree, registry, selectedId, onSelect }) {
  const defs = useMemo(() => {
    const out = {};
    for (const d of registry || []) out[d.slug] = d;
    return out;
  }, [registry]);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="border-b border-zinc-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500">
        List view
      </header>
      <ul role="tree" className="flex-1 overflow-y-auto py-1 text-[13px]">
        {tree.length === 0 && (
          <li className="px-3 py-4 text-xs text-zinc-500">No blocks yet.</li>
        )}
        {tree.map((b) => (
          <Node
            key={b.id}
            block={b}
            depth={0}
            defs={defs}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </div>
  );
}

function Node({ block, depth, defs, selectedId, onSelect }) {
  const [open, setOpen] = useState(true);
  const def = defs[block.type];
  const hasKids = Array.isArray(block.children) && block.children.length > 0;
  const isCurr = block.id === selectedId;

  return (
    <li role="treeitem" aria-expanded={hasKids ? open : undefined}>
      <div
        onClick={() => onSelect(block.id)}
        className={`group flex cursor-pointer items-center gap-1 py-1 pr-2 ${
          isCurr ? 'bg-blue-600 text-white' : 'text-zinc-700 hover:bg-zinc-50'
        }`}
        style={{ paddingLeft: 6 + depth * 12 }}
      >
        {hasKids ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
            className={`inline-flex h-4 w-4 items-center justify-center text-[10px] ${
              isCurr ? 'text-white/80 hover:text-white' : 'text-zinc-400 hover:text-zinc-700'
            }`}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span className="inline-block w-4" />
        )}
        <span
          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded font-mono text-[11px] ${
            isCurr ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-600'
          }`}
        >
          {def?.icon || block.type.charAt(0).toUpperCase()}
        </span>
        <span className="flex-1 truncate font-medium">
          {def?.label || block.type}
        </span>
        <Subtitle block={block} muted={!isCurr} />
      </div>
      {hasKids && open && (
        <ul role="group">
          {block.children.map((c) => (
            <Node
              key={c.id}
              block={c}
              depth={depth + 1}
              defs={defs}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/** Short text after the label — heading text, paragraph snippet, etc. */
function Subtitle({ block, muted }) {
  const d = block.data || {};
  let txt = '';
  if (d.text)        txt = String(d.text);
  else if (d.src)    txt = String(d.src);
  else if (d.source) txt = String(d.source).split('\n')[0];
  if (!txt) return null;
  return (
    <span className={`truncate text-[11px] ${muted ? 'text-zinc-400' : 'text-white/80'}`}>
      {txt.length > 28 ? txt.slice(0, 28) + '…' : txt}
    </span>
  );
}
