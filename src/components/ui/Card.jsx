// Mirrors dsystem `.admin-card` — radius-lg, border, shadow-card, padding 24px.
//
// The visual hierarchy is: page (gray) → Card (white) → nested tiles
// inside a Card (zinc-50). Cards themselves stay white; sub-cards,
// download tiles, dropzones, and other small surfaces opt into zinc-50
// to stand out gently against the white parent.
export default function Card({ title, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-zinc-200 bg-white p-6 shadow-card ${className}`}>
      {title && <h3 className="mb-4 text-[15px] font-semibold text-zinc-900">{title}</h3>}
      <div className="space-y-4">{children}</div>
    </section>
  );
}
