import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, SegmentedControl } from '../ui/index.js';
import BlockComposer from '../BlockComposer/index.jsx';
import CodeEditor from '../CodeEditor.jsx';

// Two view modes share the same buffer: Visual (BlockComposer) and Code
// (raw JSON in CodeMirror). The buffer is the source of truth — switching
// modes is pure derivation, so you can edit a block's `data.text` in the
// visual inspector, flip to Code to tweak something the inspector doesn't
// expose, flip back. Invalid JSON shows a warning and pins the view to
// Code so we never silently drop the user's in-progress edits.
export default function VisualBlocksPane({ currentPath, buffer, saved, loading, saving, error, onChange, onSave }) {
  const [mode, setMode] = useState('visual');

  const tree = useMemo(() => parseTree(buffer), [buffer]);
  const jsonValid = useMemo(() => isValidJson(buffer), [buffer]);

  const handleTreeChange = useCallback((next) => {
    onChange(JSON.stringify({ blocks: next }, null, 2));
  }, [onChange]);

  const dirty = buffer !== saved;

  useEffect(() => {
    function onKey(e) {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta || e.key.toLowerCase() !== 's') return;
      e.preventDefault();
      if (!saving && dirty) onSave();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saving, dirty, onSave]);

  if (loading) {
    return <div className="p-6 text-sm text-zinc-500">Loading {currentPath}…</div>;
  }

  const canShowVisual = jsonValid;
  const effectiveMode = canShowVisual ? mode : 'code';

  return (
    <div className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2">
        <div className="flex items-center gap-2 truncate">
          <code className="truncate font-mono text-[12px] text-zinc-800">{currentPath}</code>
          <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700">Visual</span>
          {dirty && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">Unsaved</span>}
          {!jsonValid && <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-800">Invalid JSON</span>}
        </div>
        <div className="flex items-center gap-2">
          <SegmentedControl
            value={effectiveMode}
            onChange={setMode}
            ariaLabel="View mode"
            options={[
              { value: 'visual', label: 'Visual', disabled: !canShowVisual },
              { value: 'code',   label: 'Code' },
            ]}
          />
          <Button onClick={onSave} disabled={!dirty || saving}>
            {saving ? 'Saving…' : 'Save (⌘S)'}
          </Button>
        </div>
      </div>
      {error && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-[13px] text-red-700">
          {error}
        </div>
      )}
      {!jsonValid && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-[12px] text-amber-800">
          JSON won't parse — fix the syntax to return to the visual builder.
        </div>
      )}
      <div className="min-h-0 flex-1">
        {effectiveMode === 'visual' ? (
          <BlockComposer
            tree={tree}
            onChange={handleTreeChange}
            pageMeta={{}}
          />
        ) : (
          <CodeEditor
            value={buffer ?? ''}
            onChange={onChange}
            language="html"
            className="h-full"
          />
        )}
      </div>
    </div>
  );
}

function isValidJson(s) {
  if (!s || !s.trim()) return true;
  try { JSON.parse(s); return true; } catch { return false; }
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
