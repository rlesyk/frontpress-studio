// Build the compliant "Photo by X on Unsplash" credit line in two flavours.
// Both forms include the `utm_source=frontpress-studio&utm_medium=referral`
// querystring that Unsplash's API guidelines require on back-links from
// third-party apps. The links themselves are produced server-side (so
// utm_source stays consistent across the app); we only render here.

/**
 * @param {{author_name:string, author_link?:string, unsplash_link?:string}} a
 */
export function buildUnsplashCreditMarkdown(a) {
  const author = a.author_link
    ? `[${escapeMd(a.author_name)}](${a.author_link})`
    : escapeMd(a.author_name);
  const unsplash = a.unsplash_link
    ? `[Unsplash](${a.unsplash_link})`
    : 'Unsplash';
  return `*Photo by ${author} on ${unsplash}*`;
}

/**
 * @param {{author_name:string, author_link?:string, unsplash_link?:string}} a
 */
export function buildUnsplashCreditHtml(a) {
  const author = a.author_link
    ? `<a href="${escapeAttr(a.author_link)}" target="_blank" rel="noreferrer noopener">${escapeHtml(a.author_name)}</a>`
    : escapeHtml(a.author_name);
  const unsplash = a.unsplash_link
    ? `<a href="${escapeAttr(a.unsplash_link)}" target="_blank" rel="noreferrer noopener">Unsplash</a>`
    : 'Unsplash';
  return `<p class="fp-credit"><small><em>Photo by ${author} on ${unsplash}</em></small></p>`;
}

function escapeMd(s) {
  // Just the chars that could break the link syntax — names with `[`,
  // `]`, or `(` are rare but a Markdown parser would split the link
  // text on them.
  return String(s).replace(/[\[\]()]/g, (c) => `\\${c}`);
}
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escapeAttr(s) {
  return escapeHtml(s);
}
