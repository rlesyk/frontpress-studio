import { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import './DatePicker.css';

const IconCalendar = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
    <path d="M5.5 2v3M10.5 2v3M2.5 7h11" />
  </svg>
);

function toIso(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fromIso(iso) {
  if (!iso || typeof iso !== 'string') return undefined;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return undefined;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? undefined : d;
}

// Override react-day-picker's defaults so the calendar matches the rest of
// the admin (zinc/black palette, sidebar-sized cells). Inlined as a `style`
// prop on the rdp root so it travels with the component and doesn't pollute
// the global stylesheet.
const rdpVars = {
  '--rdp-accent-color': 'var(--color-zinc-900, #18181b)',
  '--rdp-accent-background-color': 'var(--color-zinc-100, #f4f4f5)',
  '--rdp-today-color': 'var(--color-zinc-900, #18181b)',
  '--rdp-day-height': '32px',
  '--rdp-day-width': '32px',
  '--rdp-day_button-height': '30px',
  '--rdp-day_button-width': '30px',
  '--rdp-day_button-border-radius': '6px',
  '--rdp-nav_button-height': '24px',
  '--rdp-nav_button-width': '24px',
  '--rdp-nav-height': '28px',
  '--rdp-weekday-padding': '4px 0',
  '--rdp-weekday-text-align': 'center',
  '--rdp-weekday-text-transform': 'none',
  '--rdp-weekday-opacity': '0.6',
  fontSize: '13px',
};

/**
 * Date input + calendar popover. `value`/`onChange` speak `YYYY-MM-DD`
 * strings so the markdown front matter sees a stable, sortable format
 * regardless of the user's locale.
 */
export default function DatePicker({ value, onChange, placeholder = 'YYYY-MM-DD' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (!wrapRef.current?.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const selected = fromIso(value);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 text-left text-[13px] text-zinc-900 transition-colors focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/15"
      >
        <span className={value ? '' : 'text-zinc-400'}>
          {value || placeholder}
        </span>
        <span className="shrink-0 text-zinc-500">{IconCalendar}</span>
      </button>

      {open && (
        <div className="fp-datepicker absolute right-0 z-50 mt-1 rounded-md border border-zinc-200 bg-white p-2 shadow-lg">
          <DayPicker
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(d) => { onChange(toIso(d)); setOpen(false); }}
            weekStartsOn={1}
            showOutsideDays
            style={rdpVars}
          />
        </div>
      )}
    </div>
  );
}
