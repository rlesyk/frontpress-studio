// Sidebar icons — 16×16, stroke-1.5 (matches Lucide / dsystem assets/icons.svg style).

const stroke = { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const IconGrid = (
  <svg {...stroke}>
    <rect x="2"   y="2"   width="5" height="5" rx="1" />
    <rect x="9"   y="2"   width="5" height="5" rx="1" />
    <rect x="2"   y="9"   width="5" height="5" rx="1" />
    <rect x="9"   y="9"   width="5" height="5" rx="1" />
  </svg>
);

export const IconFolder = (
  <svg {...stroke}>
    <path d="M2 4a1 1 0 0 1 1-1h3.6l1.4 1.5H13a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4z" />
  </svg>
);

export const IconPlus = (
  <svg {...stroke}>
    <path d="M8 3v10M3 8h10" />
  </svg>
);

export const IconTrash = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2">
    <path d="M10 11v6"/>
    <path d="M14 11v6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
    <path d="M3 6h18"/>
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

export const IconImage = (
  <svg {...stroke}>
    <rect x="2" y="2" width="12" height="12" rx="1.5" />
    <circle cx="6" cy="6" r="1.2" />
    <path d="M2.5 11.5l3-3 2.5 2.5L11 7l3 4" />
  </svg>
);

export const IconBook = (
  <svg {...stroke}>
    <path d="M2.5 3a1 1 0 0 1 1-1H7v11H3.5a1 1 0 0 1-1-1V3z" />
    <path d="M9 2h3.5a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9V2z" />
  </svg>
);

export const IconBackup = (
  <svg {...stroke}>
    <path d="M2 4h12v3H2z" />
    <path d="M2 7h12v6a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 2 13V7z" />
    <path d="M8 9v3M6.5 10.5L8 12l1.5-1.5" />
  </svg>
);

export const IconCog = (
  <svg {...stroke} viewBox="0 0 24 24">
    <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

export const IconLogout = (
  <svg {...stroke}>
    <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
    <path d="M10 11l3-3-3-3" />
    <path d="M13 8H6" />
  </svg>
);

export const IconBrush = (
  <svg {...stroke} viewBox="0 0 24 24">
    <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08" />
    <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.21 0 4-1.81 4-4.04a3.01 3.01 0 0 0-3-3.02z" />
  </svg>
);

export const IconSearch = (
  <svg {...stroke}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.5 10.5L14 14" />
  </svg>
);

// Per-language brand glyphs. Each is a 16×16 inline SVG drawn in the
// language's signature symbol (leaf for Twig, elephant for PHP, JS/TS
// wordmark squares, dollar for SCSS, hash for CSS, `</>` for HTML, etc.)
// `mono` flips the whole glyph to `currentColor` for use on the active
// (inverted) row.

const LANG_COLORS = {
  twig: '#10b981', // emerald
  php:  '#6366f1', // indigo
  js:   '#facc15', // yellow
  mjs:  '#facc15',
  cjs:  '#facc15',
  ts:   '#3178c6', // ts-blue
  jsx:  '#06b6d4',
  tsx:  '#06b6d4',
  css:  '#2563eb',
  scss: '#cd6799', // sass pink
  sass: '#cd6799',
  json: '#71717a',
  html: '#e34c26', // html5 orange
  md:   '#6b7280',
  svg:  '#7c3aed',
  yml:  '#cb171e',
  yaml: '#cb171e',
};

function langColor(ext, mono) {
  if (mono) return 'currentColor';
  return LANG_COLORS[ext] || '#71717a';
}

// JS / TS / similar "wordmark in coloured square" glyphs. The brand
// identity for these languages literally IS a coloured tile with the
// letters — same approach devicon uses.
function WordmarkSquare({ color, letters, fg = '#111827' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <rect x="1" y="1" width="14" height="14" rx="2" fill={color} />
      <text
        x="8"
        y="11.4"
        textAnchor="middle"
        fontSize="6.6"
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto"
        fill={fg}
      >
        {letters}
      </text>
    </svg>
  );
}

function IconTwig({ color }) {
  // Leaf with central vein — Twig's identity mark.
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3c0 5-3.5 9.5-9.5 10.5C3.5 8 7 3.5 13 3z" fill={color} fillOpacity="0.18" />
      <path d="M13 3L3.5 13.5" />
    </svg>
  );
}

function IconPhp({ color }) {
  // PHP's purple ellipse mark, simplified.
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <ellipse cx="8" cy="8" rx="7" ry="4.5" fill={color} fillOpacity="0.18" stroke={color} strokeWidth="1.3" />
      <path d="M3.5 11l1.4-6h2c1.3 0 1.7.8 1.4 1.8-.2 1-1 1.5-2 1.5h-.9" stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 11l1.4-6" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconBraces({ color, strokeW = 1.5 }) {
  // { } — JSON, generic JS-family fallback.
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 2.5c-1.5 0-2 1-2 2.5s.5 2.5-1 2.5c1.5 0 1 1 1 2.5s.5 2.5 2 2.5" />
      <path d="M10.5 2.5c1.5 0 2 1 2 2.5s-.5 2.5 1 2.5c-1.5 0-1 1-1 2.5s-.5 2.5-2 2.5" />
    </svg>
  );
}

function IconCss({ color }) {
  // # — selector glyph for CSS.
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
      <path d="M6 2.5L4.5 13.5" />
      <path d="M11.5 2.5L10 13.5" />
      <path d="M2.5 6h11" />
      <path d="M2.5 10h11" />
    </svg>
  );
}

function IconScss({ color }) {
  // $ — Sass variable sigil.
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4.5c-.8-1-2-1.5-3.2-1.4-1.5.1-2.5 1-2.5 2.2 0 1.3 1 1.8 3 2.4s3 1.1 3 2.5c0 1.4-1.3 2.3-3 2.4-1.4.1-2.7-.4-3.5-1.5" />
      <path d="M8 1.5v13" />
    </svg>
  );
}

function IconHtml({ color }) {
  // </> — closing-tag mark for HTML.
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4.5L1.5 8 5 11.5" />
      <path d="M11 4.5L14.5 8 11 11.5" />
      <path d="M9.5 3l-3 10" />
    </svg>
  );
}

function IconSvgFile({ color }) {
  // Geometric composition — primitive shapes are the SVG identity.
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinejoin="round">
      <circle cx="5" cy="11" r="3" />
      <rect x="8" y="2" width="6" height="6" rx="0.6" />
      <path d="M11 9l3 5H8z" fill={color} fillOpacity="0.2" />
    </svg>
  );
}

function IconMd({ color }) {
  // Markdown's official mark — rounded rectangle with `M↓`.
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round">
      <rect x="1" y="3.5" width="14" height="9" rx="1.4" />
      <path d="M3.5 10.5v-5l2 2.5 2-2.5v5" />
      <path d="M10.5 6.5v4M9 9l1.5 1.5L12 9" />
    </svg>
  );
}

function IconYaml({ color }) {
  // YAML key:value — pair of colon dots beside a value bar.
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round">
      <circle cx="4" cy="5.5" r="0.9" fill={color} />
      <circle cx="4" cy="10.5" r="0.9" fill={color} />
      <path d="M7 5.5h6.5" />
      <path d="M7 10.5h6.5" />
    </svg>
  );
}

function IconUnknown({ color }) {
  // Folded-corner file fallback for extensions we don't have a mark for.
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 1.75h5l3.75 3.75V13.5a.75.75 0 0 1-.75.75h-8a.75.75 0 0 1-.75-.75v-11a.75.75 0 0 1 .75-.75z" />
      <path d="M8.5 1.75V5.5h3.75" />
    </svg>
  );
}

export function IconFile({ ext, mono }) {
  const e = String(ext || '').toLowerCase();
  const color = langColor(e, mono);
  switch (e) {
    case 'twig': return <IconTwig color={color} />;
    case 'php':  return <IconPhp  color={color} />;
    case 'js':
    case 'mjs':
    case 'cjs':  return <WordmarkSquare color={color} letters="JS" />;
    case 'ts':   return <WordmarkSquare color={color} letters="TS" fg="#ffffff" />;
    case 'jsx':  return <WordmarkSquare color={color} letters="JSX" fg="#ffffff" />;
    case 'tsx':  return <WordmarkSquare color={color} letters="TSX" fg="#ffffff" />;
    case 'json': return <IconBraces color={color} />;
    case 'css':  return <IconCss color={color} />;
    case 'scss':
    case 'sass': return <IconScss color={color} />;
    case 'html':
    case 'htm':  return <IconHtml color={color} />;
    case 'svg':  return <IconSvgFile color={color} />;
    case 'md':
    case 'markdown': return <IconMd color={color} />;
    case 'yml':
    case 'yaml': return <IconYaml color={color} />;
    default:     return <IconUnknown color={color} />;
  }
}

