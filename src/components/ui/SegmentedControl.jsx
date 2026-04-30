// Two-or-more-way segmented control. Same look as the editor mode toggle and
// the MediaPicker tabs — extracted so anywhere we'd otherwise reach for a
// `<Select>` with 2–4 options can use this instead.
//
// Pass an `options` array of `{ value, label }`. The active value is matched
// strictly (`===`), so use the same primitive type you bind to.
export default function SegmentedControl({
  value,
  onChange,
  options,
  ariaLabel,
  className = '',
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white p-1 ${className}`}
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded px-2.5 py-1 text-[12px] font-medium transition-colors ${
              active
                ? 'bg-zinc-900 text-white'
                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
