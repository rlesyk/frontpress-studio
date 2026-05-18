// Mirrors dsystem `.admin-card` — radius-lg, border, shadow-card, padding 24px.
//
// Background is `bg-zinc-50` for consistency across the admin: form inputs
// (which carry their own `bg-white`) stand out against the card, and nested
// "section" tiles inside a card should opt into `bg-white` if they want to
// stand out further. Previously cards were white and individual screens
// drifted between white and zinc-50 for their containers — picking a single
// background here keeps every screen on the same footing.
export default function Card({ title, children, className = '' }) {
  return (
    <section className={`rounded-lg border border-zinc-200 bg-zinc-50 p-6 shadow-card ${className}`}>
      {title && <h3 className="mb-4 text-[15px] font-semibold text-zinc-900">{title}</h3>}
      <div className="space-y-4">{children}</div>
    </section>
  );
}
