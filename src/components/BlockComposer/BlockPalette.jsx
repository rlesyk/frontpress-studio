import { useMemo } from 'react';

// Left column of the block composer. Lists every block in the framework's
// registry, grouped by category. Clicking a block appends it to the tree
// root (or to the currently-selected container, if one is selected and
// hasChildren is true). v1 has no drag/drop; click-to-add is good enough.
export default function BlockPalette({ blocks, onAdd, addingTo }) {
  const grouped = useMemo(() => {
    const out = {};
    for (const b of blocks || []) {
      const cat = b.category || 'General';
      if (!out[cat]) out[cat] = [];
      out[cat].push(b);
    }
    return Object.entries(out).sort(([a], [b]) => a.localeCompare(b));
  }, [blocks]);

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-y-auto border-r border-zinc-200 bg-white">
      <header className="border-b border-zinc-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500">
        Blocks
        {addingTo && (
          <span className="ml-1 normal-case font-normal text-zinc-400">into <code>{addingTo.type}</code></span>
        )}
      </header>
      <div className="flex-1 p-2">
        {grouped.length === 0 && (
          <p className="px-2 py-4 text-xs text-zinc-500">No blocks registered yet.</p>
        )}
        {grouped.map(([cat, items]) => (
          <div key={cat} className="mb-3">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-400">{cat}</div>
            <ul className="space-y-1">
              {items.map((b) => (
                <li key={b.slug}>
                  <button
                    type="button"
                    onClick={() => onAdd(b)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-zinc-50"
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 font-mono text-sm text-zinc-700">
                      {b.icon || b.slug.charAt(0).toUpperCase()}
                    </span>
                    <span className="flex-1 truncate">{b.label}</span>
                    {b.hasChildren && (
                      <span className="text-[10px] uppercase tracking-wide text-zinc-400">box</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}
