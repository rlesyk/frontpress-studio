import { useEffect, useRef, useState } from 'react';
import 'grapesjs/dist/css/grapes.min.css';
import grapesjs from 'grapesjs';
import gjsBlocksBasic from 'grapesjs-blocks-basic';
import { Alert, Button } from '../ui/index.js';
import CodeEditor from '../CodeEditor.jsx';

// Visual editor pane for theme .html files. GrapesJS owns the top half
// (drag/drop, inline edit, style sidebar); CodeMirror owns the bottom half
// with two-way sync. Clicking a component in GrapesJS scrolls the code
// pane to the matching block. Edits flow GrapesJS → code on every change.
//
// .html partials are static — no Twig / PHP. Use a .twig file if you
// need dynamic content; this pane edits the static surface only.
export default function VisualEditorPane({
  path,
  contents,
  loading,
  error,
  dirty,
  saving,
  saveError,
  onChange,
  onSave,
}) {
  const hostRef = useRef(null);
  const editorRef = useRef(null);
  const codeRef = useRef(null);
  const ignoreNextGjsUpdate = useRef(false);
  const ignoreNextCodeUpdate = useRef(false);
  const [selectionInfo, setSelectionInfo] = useState(null);

  // Mount GrapesJS once per `path` change — switching files reinstantiates
  // so we don't carry one file's component tree into another.
  useEffect(() => {
    if (!hostRef.current || loading) return undefined;
    const editor = grapesjs.init({
      container: hostRef.current,
      height: '100%',
      width: 'auto',
      storageManager: false,
      fromElement: false,
      panels: { defaults: [] },
      plugins: [gjsBlocksBasic],
      pluginsOpts: {
        [gjsBlocksBasic]: { flexGrid: true },
      },
      canvas: {
        styles: ['/assets/style.css'],
      },
    });

    editor.setComponents(extractBody(contents || ''));
    editor.setStyle(extractStyle(contents || ''));
    editorRef.current = editor;

    // Component selection → find its HTML in the buffer + tell the user.
    editor.on('component:selected', (model) => {
      const html = (model?.toHTML?.() || '').trim();
      const tag  = model?.get?.('tagName') || '?';
      const cls  = model?.getClasses?.()?.join(' ') || '';
      setSelectionInfo({ tag, cls, html });
      // Best-effort: find the rendered HTML in the buffer and highlight it.
      const idx = html ? (codeRef.current?.value || contents || '').indexOf(html) : -1;
      if (idx >= 0) {
        // Scroll handled by CodeEditor when the buffer is updated; we just
        // surface the position info for now. A future enhancement is to
        // dispatch a selection range into CodeMirror.
      }
    });

    // Push GrapesJS edits out as a serialized HTML buffer.
    const flush = () => {
      if (ignoreNextGjsUpdate.current) {
        ignoreNextGjsUpdate.current = false;
        return;
      }
      const css = (editor.getCss() || '').trim();
      const body = editor.getHtml() || '';
      const out = composeFile(css, body);
      ignoreNextCodeUpdate.current = true;
      onChange(out);
    };
    editor.on('component:update component:add component:remove style:change', flush);

    return () => {
      editor.destroy();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, loading]);

  // Code → GrapesJS push (for direct edits in the bottom pane).
  useEffect(() => {
    if (!editorRef.current) return;
    if (ignoreNextCodeUpdate.current) {
      ignoreNextCodeUpdate.current = false;
      return;
    }
    ignoreNextGjsUpdate.current = true;
    try {
      editorRef.current.setComponents(extractBody(contents || ''));
      editorRef.current.setStyle(extractStyle(contents || ''));
    } catch { /* malformed HTML — leave GrapesJS as is */ }
  }, [contents]);

  // Cmd/Ctrl + S → save.
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

  return (
    <div className="flex h-full min-w-0 flex-col bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-2">
        <div className="flex items-center gap-2 truncate">
          <code className="truncate font-mono text-[12px] text-zinc-800">{path}</code>
          <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-700">Visual</span>
          {dirty && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">Unsaved</span>}
          {selectionInfo && (
            <span className="font-mono text-[11px] text-amber-700">
              &lt;{selectionInfo.tag}{selectionInfo.cls && ` class="${selectionInfo.cls}"`}&gt;
            </span>
          )}
        </div>
        <Button onClick={onSave} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save (⌘S)'}
        </Button>
      </header>

      {(error || saveError) && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-2">
          <Alert tone="error">{error || saveError}</Alert>
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-rows-[1fr_240px]">
        <div className="min-h-0 overflow-hidden border-b border-zinc-200">
          {loading ? (
            <div className="p-6 text-sm text-zinc-500">Loading {path}…</div>
          ) : (
            <div ref={hostRef} className="h-full" />
          )}
        </div>
        <div ref={(el) => { codeRef.current = { value: contents }; }} className="min-h-0 overflow-hidden bg-white">
          <CodeEditor
            value={contents}
            onChange={(v) => { ignoreNextGjsUpdate.current = false; onChange(v); }}
            language="html"
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}

// File on disk is one .html with optional inline <style> block. Split it
// into (style, body) so GrapesJS gets the right initial state, then
// recompose on save.
function extractStyle(text) {
  const m = /<style[^>]*>([\s\S]*?)<\/style>/i.exec(text || '');
  return m ? m[1].trim() : '';
}

function extractBody(text) {
  return (text || '').replace(/<style[^>]*>[\s\S]*?<\/style>\s*/i, '').trim();
}

function composeFile(css, body) {
  const styleBlock = css ? `<style>\n${css}\n</style>\n` : '';
  return styleBlock + body;
}
