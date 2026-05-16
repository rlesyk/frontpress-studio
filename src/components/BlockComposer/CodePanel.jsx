import { useEffect, useState } from 'react';
import { getCsrf } from '../../lib/api.js';

// Bottom panel of the canvas — shows the live HTML for the currently
// selected block. Bricks/Webstudio-style "read the code while you build"
// affordance. Read-only for now; CSS authoring lives in the right
// inspector. Empty when nothing is selected.
export default function CodePanel({ block, pageMeta }) {
  const [tab, setTab] = useState('html');
  const [html, setHtml] = useState('');

  useEffect(() => {
    if (!block) { setHtml(''); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/admin/api/blocks/render', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrf() },
          body: JSON.stringify({ blocks: [block], page: pageMeta || {} }),
        });
        const data = await res.json();
        if (cancelled) return;
        // The render endpoint wraps the block with our editor wrapper —
        // strip the outer <div class="fp-block" …> so users see just
        // their block's HTML, not the admin scaffolding.
        let out = (data.html || '').trim();
        out = stripEditorWrapper(out);
        setHtml(out);
      } catch { /* keep last */ }
    })();
    return () => { cancelled = true; };
  }, [block, pageMeta]);

  return (
    <div className="flex h-full min-h-0 flex-col border-t border-zinc-200 bg-zinc-950 text-zinc-100">
      <div className="flex items-center gap-1 border-b border-zinc-800 px-2 py-1">
        <Tab active={tab === 'html'} onClick={() => setTab('html')}>HTML</Tab>
        <Tab active={tab === 'css'} onClick={() => setTab('css')}>CSS</Tab>
        <Tab active={tab === 'js'} onClick={() => setTab('js')}>JS</Tab>
        <span className="ml-auto pr-2 font-mono text-[11px] text-zinc-500">
          {block ? block.type : 'no selection'}
        </span>
      </div>
      <pre className="flex-1 overflow-auto px-3 py-2 font-mono text-[12px] leading-relaxed">
        {!block && <span className="text-zinc-500">Select a block to see its code.</span>}
        {block && tab === 'html' && (html || <span className="text-zinc-500">Rendering…</span>)}
        {block && tab === 'css' && (
          <span className="text-zinc-500">
            CSS authoring is in the right inspector. Per-block stylesheet is a follow-up.
          </span>
        )}
        {block && tab === 'js' && (
          <span className="text-zinc-500">
            JS hooks not enabled yet — use the Code block for script bodies.
          </span>
        )}
      </pre>
    </div>
  );
}

function Tab({ active, children, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      className={`rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
        active ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function stripEditorWrapper(html) {
  // Remove a single outer `<div class="fp-block" …>…</div>` so the user
  // sees the actual block markup, not the editor scaffolding. Regex is
  // intentionally conservative — only strips the OUTERmost wrapper.
  const m = /^<div class="fp-block"[^>]*>([\s\S]*)<\/div>\s*$/.exec(html);
  return m ? m[1].trim() : html;
}
