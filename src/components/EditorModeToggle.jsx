import { html as beautifyHtml } from 'js-beautify';
import { SegmentedControl } from './ui/index.js';

// Editor view selector. Toast UI's own bottom-right switcher is hidden via
// `hideModeSwitch: true`; this is the single source of truth for which
// surface the user is on.
//
// `withFiles=true` appends a "Files" tab that PageEditor renders as the
// per-post attachments grid in the main editor pane. Hidden on /new/*
// (no folder yet).
export default function EditorModeToggle({ mode, onChange, withFiles = false }) {
  const options = [
    { value: 'wysiwyg',  label: 'WYSIWYG'  },
    { value: 'markdown', label: 'Markdown' },
    { value: 'html',     label: 'HTML'     },
  ];
  if (withFiles) {
    options.push({ value: 'files', label: 'Files' });
  }
  return (
    <SegmentedControl
      ariaLabel="Editor mode"
      value={mode}
      onChange={onChange}
      options={options}
    />
  );
}

/**
 * Mode-switch logic kept outside the component so we don't have to thread
 * `useCallback` through the entire editor tree. Pure function: takes the
 * next/current modes and the refs/setters it needs, applies the right
 * Toast UI calls, and returns nothing.
 */
export function switchEditorMode(next, current, edRef, htmlValue, setHtmlValue, setEditorMode) {
  if (next === current) return;
  const ed = edRef.current;
  if (!ed) {
    setEditorMode(next);
    return;
  }

  // Leaving HTML view → push the textarea contents back into Toast UI
  // as MARKDOWN (not setHTML). The body is canonically markdown; raw
  // HTML inside it survives both the markdown source and the public
  // renderer (CommonMark `html_input: allow`). setHTML would re-parse
  // through ProseMirror and drop iframes / scripts / videos.
  if (current === 'html') {
    try { ed.setMarkdown(htmlValue, false); } catch { /* ignore */ }
  }

  if (next === 'files') {
    // Files view is a sibling surface, not an editor mode. No Toast UI
    // call needed — the parent hides the editor and shows FilesPanel.
  } else if (next === 'html') {
    // Entering HTML view → seed the textarea from the markdown source
    // (NOT getHTML, which would re-render through ProseMirror and lose
    // any non-schema elements). The source already contains any raw
    // HTML the author wrote. js-beautify still cleans up HTML blocks
    // inside the markdown without harming plain text / heading lines.
    try {
      const raw = ed.getMarkdown() || '';
      setHtmlValue(beautifyHtml(raw, {
        indent_size: 2,
        wrap_line_length: 100,
        end_with_newline: true,
        preserve_newlines: true,
        max_preserve_newlines: 1,
      }));
    } catch {
      setHtmlValue('');
    }
  } else {
    try { ed.changeMode(next, true); } catch { /* ignore */ }
  }

  setEditorMode(next);
}
