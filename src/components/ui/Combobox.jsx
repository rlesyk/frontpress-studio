import { useEffect, useMemo, useRef, useState } from 'react';
import { baseControlCls } from './Input.jsx';

/**
 * Searchable single-select. Drop-in replacement for a native <select> when
 * the option list is too long to scroll. Input doubles as the search box;
 * matching is a simple case-insensitive substring against the option label.
 *
 * Props:
 *   options:     [{ value, label, hint? }]  // hint shows muted on the right
 *   value:       currently selected value (matches `option.value`)
 *   onChange:    (newValue) => void         // fires when an option is picked
 *   placeholder: input placeholder when no value
 *   disabled, className: standard form props
 *
 * Deliberately simple: mouse + typing only, no keyboard nav. Add useKeyboard
 * later if needed — the cost is real-DOM keyboard handling, not worth it for
 * a settings panel that's used once a year.
 */
export default function Combobox({
  options = [],
  value = '',
  onChange,
  placeholder = '',
  disabled = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);

  // Mirror the canonical option's label into the input whenever `value`
  // changes from outside. We track `query` separately so typing doesn't
  // wipe the persisted value until the user commits a new pick.
  const selected = useMemo(
    () => options.find((o) => o.value === value) || null,
    [options, value],
  );
  const displayLabel = selected?.label ?? value ?? '';

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  // Close on outside click — without this, the dropdown becomes a sticky
  // floating layer that obscures everything else on the page.
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (q === '') return options;
    return options.filter((o) => (o.label || '').toLowerCase().includes(q));
  }, [options, q]);

  function pick(opt) {
    onChange?.(opt.value);
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <input
        type="text"
        className={`${baseControlCls} w-full`}
        value={open ? query : displayLabel}
        onChange={(e) => { setQuery(e.target.value); if (!open) setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        spellCheck={false}
        autoComplete="off"
      />
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-card">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-[13px] text-zinc-500">No matches</div>
          ) : (
            filtered.map((o) => {
              const isActive = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[13px] transition-colors hover:bg-zinc-100 ${isActive ? 'bg-zinc-50 font-medium' : ''}`}
                  onMouseDown={(e) => { e.preventDefault(); pick(o); }}
                >
                  <span className="truncate">{o.label}</span>
                  {o.hint && <span className="shrink-0 text-[11px] text-zinc-500">{o.hint}</span>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
