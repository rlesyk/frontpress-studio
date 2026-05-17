import { useEffect, useRef } from 'react';
import Editor, { loader } from '@monaco-editor/react';

// Pin Monaco to a known-good version so a Microsoft release doesn't
// silently change behavior under us. The bundle stays tiny — only the
// loader script (~3 KB) ships from our origin; the editor itself loads
// from the CDN on first navigation to a screen that uses CodeEditor.
loader.config({
  paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' },
});

/**
 * Thin React wrapper around `@monaco-editor/react`. Public API matches
 * the previous CodeMirror-backed component so callers don't change:
 *
 *   <CodeEditor
 *     value={...}            // string
 *     onChange={(next) => …} // fires only on real user edits
 *     language="html"        // 'html' | 'css' | 'javascript' | 'plaintext' | …
 *     filename="post.twig"   // optional — auto-derives a language if `language` is the default
 *     className="h-full"
 *     focusLine={42}         // when set, scroll + select that line and focus
 *   />
 *
 * `@monaco-editor/react` already does the right thing with external
 * value updates — it doesn't round-trip them back through `onChange` —
 * so the SYNC_FROM_PROP annotation dance we used with CodeMirror isn't
 * needed here. Switching files no longer flips the parent's dirty flag.
 */
export default function CodeEditor({
  value,
  onChange,
  language = 'html',
  filename = null,
  className = '',
  focusLine = null,
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const effectiveLanguage = filename ? languageFor(filename) || language : language;

  function handleMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
  }

  // Reveal + select the requested line. Bridges the outline-click in the
  // Theme Builder to "jump and highlight" in the code panel.
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !focusLine) return;
    const model = editor.getModel();
    if (!model) return;
    const lineNo = Math.max(1, Math.min(focusLine, model.getLineCount()));
    const endCol = model.getLineMaxColumn(lineNo);
    editor.revealLineInCenter(lineNo);
    editor.setSelection({
      startLineNumber: lineNo,
      startColumn: 1,
      endLineNumber: lineNo,
      endColumn: endCol,
    });
    editor.focus();
  }, [focusLine]);

  return (
    <div className={`cm-host text-[13px] ${className}`}>
      <Editor
        value={value ?? ''}
        onChange={(next) => onChange?.(next ?? '')}
        language={effectiveLanguage}
        path={filename || undefined}
        theme="vs"
        onMount={handleMount}
        loading={<div className="p-3 text-xs text-zinc-500">Loading editor…</div>}
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          fontSize: 13,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          tabSize: 2,
          insertSpaces: true,
          smoothScrolling: true,
          padding: { top: 6, bottom: 6 },
        }}
      />
    </div>
  );
}

// Map a file path / name to a Monaco language id. Returns null when we
// don't have a sensible mapping — the caller's `language` prop wins as
// a fallback.
function languageFor(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'twig':
    case 'html': return 'html';
    case 'css':
    case 'scss': return 'css';
    case 'js':
    case 'mjs': return 'javascript';
    case 'ts':  return 'typescript';
    case 'json': return 'json';
    case 'md':  return 'markdown';
    case 'php': return 'php';
    case 'yml':
    case 'yaml': return 'yaml';
    default: return null;
  }
}
