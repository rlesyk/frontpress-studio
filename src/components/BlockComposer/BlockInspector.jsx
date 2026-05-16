import { Field, Input, Select, Textarea } from '../ui/index.js';
import CodeEditor from '../CodeEditor.jsx';

// Right column: edits the selected block's fields. Renders a typed control
// per field — text / textarea / select / color. Updates flow up through
// onFieldChange so the parent owns the tree.
export default function BlockInspector({ block, def, onFieldChange, onRemove }) {
  if (!block) {
    return (
      <aside className="flex h-full min-h-0 flex-col border-l border-zinc-200 bg-white">
        <header className="border-b border-zinc-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500">
          Inspector
        </header>
        <div className="flex flex-1 items-center justify-center px-3 text-center text-xs text-zinc-500">
          Select a block to edit its fields.
        </div>
      </aside>
    );
  }

  const fields = def?.fields || [];
  return (
    <aside className="flex h-full min-h-0 flex-col overflow-y-auto border-l border-zinc-200 bg-white">
      <header className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500">
        <span>{def?.label || block.type}</span>
        <button
          type="button"
          onClick={() => onRemove?.(block.id)}
          className="text-red-600 hover:underline"
        >
          Delete
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Content section — block-defined fields. The headline thing
            users edit; always open. */}
        <Section title="Content" defaultOpen>
          {fields.length === 0 && (
            <p className="text-xs text-zinc-500">This block has no editable fields.</p>
          )}
          {fields.map((f) => (
            <Field key={f.name} label={f.label || f.name}>
              <FieldControl
                field={f}
                value={block.data?.[f.name] ?? ''}
                onChange={(v) => onFieldChange(block.id, f.name, v)}
              />
            </Field>
          ))}
        </Section>

        {/* Attributes — HTML id + class. Honoured by blocks whose render.twig
            applies `data.htmlId` / `data.htmlClass` to the outer element. */}
        <Section title="Attributes">
          <Field label="HTML id" hint="Page-unique. Anchored links use this.">
            <Input
              value={block.data?.htmlId || ''}
              onChange={(e) => onFieldChange(block.id, 'htmlId', e.target.value)}
              placeholder="my-section"
            />
          </Field>
          <Field label="CSS class" hint="Space-separated, no leading dot.">
            <Input
              value={block.data?.htmlClass || ''}
              onChange={(e) => onFieldChange(block.id, 'htmlClass', e.target.value)}
              placeholder="hero hero--dark"
            />
          </Field>
        </Section>

        {/* Categorized stub sections for parity with Webstudio/Bricks. v1
            lists them so users see the shape; controls inside each land in
            follow-up commits. */}
        <Section title="Layout">
          <Stub>Display, flex direction, alignment — coming soon.</Stub>
        </Section>
        <Section title="Sizing">
          <Stub>Width, height, min/max — coming soon.</Stub>
        </Section>
        <Section title="Spacing">
          <Stub>Margin, padding — coming soon.</Stub>
        </Section>
        <Section title="Borders">
          <Stub>Border + radius — coming soon.</Stub>
        </Section>
        <Section title="Typography">
          <Stub>Font family, size, weight, line-height — coming soon.</Stub>
        </Section>

        <details className="mt-4 mx-3 mb-4 rounded-md border border-zinc-100 p-2 text-xs text-zinc-500">
          <summary className="cursor-pointer font-medium text-zinc-700">JSON</summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] text-zinc-700">
            {JSON.stringify(block, null, 2)}
          </pre>
        </details>
      </div>
    </aside>
  );
}

function Section({ title, children, defaultOpen = false }) {
  return (
    <details open={defaultOpen || undefined} className="border-b border-zinc-100">
      <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-700 hover:bg-zinc-50">
        <span className="mr-1 inline-block w-3 text-zinc-400 transition-transform">▸</span>
        {title}
      </summary>
      <div className="space-y-3 px-3 pb-3">{children}</div>
    </details>
  );
}

function Stub({ children }) {
  return <p className="text-[12px] italic text-zinc-400">{children}</p>;
}

function FieldControl({ field, value, onChange }) {
  const type = field.type || 'text';
  if (type === 'code') {
    return (
      <div className="h-64 overflow-hidden rounded-md border border-zinc-200">
        <CodeEditor
          value={value || ''}
          onChange={onChange}
          language={field.language || 'html'}
          className="h-full"
        />
      </div>
    );
  }
  if (type === 'textarea') {
    return (
      <Textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
      />
    );
  }
  if (type === 'select') {
    return (
      <Select value={value || ''} onChange={(e) => onChange(e.target.value)}>
        {(field.options || []).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </Select>
    );
  }
  if (type === 'color') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded border border-zinc-200"
        />
        <Input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="#hex or blank" />
      </div>
    );
  }
  return (
    <Input value={value || ''} onChange={(e) => onChange(e.target.value)} />
  );
}
