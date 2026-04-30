---
title: Templates
layout: default
---

{% raw %}
# Templates

* TOC
{:toc}

A theme is a folder under `app/site/themes/<slug>/` containing `theme.json`, a `templates/` directory, and (optionally) an `assets/` directory.

```
site/themes/blank/
├── theme.json              # name, description, version, engine
├── templates/
│   ├── post.twig           # single post (or post.php)
│   ├── page.twig           # single flat page
│   ├── archive.twig        # folder listing (paginated)
│   ├── taxonomy.twig       # /tags/<slug>, /categories/<slug>
│   ├── feed.twig           # Atom feed (XML)
│   ├── 404.twig
│   ├── _header.twig        # partial — opening <html> + <header>
│   └── _footer.twig        # partial — closing </main></body></html>
└── assets/
    ├── style.scss          # auto-compiled to style.css
    └── style.css           # served at /assets/style.css
```

## Choosing an engine

Templates can be **plain PHP** or **Twig** — pick per file. `render('post', …)` first looks for `post.php`, then `post.twig`. PHP wins when both exist.

The two starter themes (`blank-php`, `blank-twig`) ship the same markup in both engines. Pick one when you create your theme; mixing is supported but rarely worth it.

| Engine | When it's a fit |
|--------|-----------------|
| **Twig** | Designers / front-end-leaning authors. Autoescapes HTML by default. Compiled, so it's fast even with auto-reload on. Default choice for new themes. |
| **PHP**  | When you want full PHP power (function calls, classes, anything). No autoescape — you escape manually with `e()`. |

Whichever you pick, every helper has the same name and signature in both engines.

## Template helpers

Defined in `cms/lib/template_helpers.php`, registered as Twig functions of the same name in `cms/lib/TemplateRenderer.php`:

| Helper | PHP | Twig | Purpose |
|--------|-----|------|---------|
| `e($v)` | `<?= e($v) ?>` | `{{ e(v) }}` (rarely needed — Twig autoescapes) | HTML-escape a value (`htmlspecialchars`, `ENT_QUOTES`, UTF-8). Returns `''` for `null`/`false`. |
| `partial($name, $vars=[])` | `<?php partial('header', ['page_title' => 'Hi']); ?>` | `{{ partial('header', { page_title: 'Hi' }) }}` | Render a partial from the active theme. |
| `asset_url($path)` | `<link rel="stylesheet" href="<?= e(asset_url('style.css')) ?>">` | `{{ asset_url('style.css') }}` | Prefix `/assets/` — the active theme's `assets/` is symlinked there. |
| `paginate($page, $totalPages, $baseUrl)` | `<?= paginate($page, $total_pages, '/' . $folder) ?>` | `{{ paginate(page, total_pages, '/' ~ folder)\|raw }}` (default theme uses `\|raw` because the helper already escapes its inputs) | Returns the prev / "Page X of Y" / next nav HTML. Empty when `$totalPages <= 1`. |
| `slug_url($term, $taxonomy='categories')` | `<a href="<?= e(slug_url($cat, 'categories')) ?>">` | `<a href="{{ slug_url(cat, 'categories') }}">` | URL for a taxonomy term archive, e.g. `/categories/php`. Slugifies the term. |

### Global helpers (PHP-only call sites)

These live in `bootstrap.php`:

| Helper | Purpose |
|--------|---------|
| `posts(array $args = [])` | Query the post index. See [Querying posts](#querying-posts) below. |
| `render(string $template, array $vars = [])` | Render a named template (PHP wins, Twig fallback). Used by `public/index.php` to dispatch routes. |
| `not_found(?string $url = null)` | Send a 404 and render the active theme's `404` template. |
| `csrf_token()` | Current session's CSRF token. |

## Partials

Use `partial('name', ['var' => 'value'])` to include a sub-template. Resolution order inside the active theme's `templates/`:

1. `components/<name>.php`
2. `components/<name>.twig`
3. `_<name>.php`
4. `<name>.php`
5. `_<name>.twig`
6. `<name>.twig`

Convention: prefix shared layout chunks with `_` (`_header`, `_footer`, `_nav`). The leading underscore marks them as "not a route template" — `ThemeService::listTemplates()` excludes them from the per-post template dropdown.

**Twig partial:**

```twig
{# templates/_header.twig #}
<!doctype html>
<html lang="en">
<head>
  <title>{{ page_title|default(config.site.name) }}</title>
  <link rel="stylesheet" href="{{ asset_url('style.css') }}">
</head>
<body>
  <header>…</header>
  <main>
```

```twig
{# templates/post.twig #}
{{ partial('header', { page_title: meta.title }) }}
<article>
  <h1>{{ meta.title }}</h1>
  {{ html|raw }}
</article>
{{ partial('footer') }}
```

**PHP partial:**

```php
<?php /* templates/_header.php */ ?>
<!doctype html>
<html lang="en">
<head>
  <title><?= e($page_title ?? $GLOBALS['md_config']->get('site')['name'] ?? 'Site') ?></title>
  <link rel="stylesheet" href="<?= e(asset_url('style.css')) ?>">
</head>
<body>
  <main>
```

```php
<?php /* templates/post.php */
partial('header', ['page_title' => $meta['title'] ?? 'Post']); ?>
<article>
  <h1><?= e($meta['title'] ?? '') ?></h1>
  <?= $html ?>
</article>
<?php partial('footer'); ?>
```

The Twig variant looks tighter, the PHP variant gives you `<?php` for arbitrary logic. Pick whichever your team writes faster.

## Variables available per template

Each route in `public/index.php` calls `render($template, $vars)` with a different shape:

### `post.php` / `post.twig`
For URLs like `/blog/my-post`.

| Variable | Type | Notes |
|----------|------|-------|
| `meta` | array | Front matter as an associative array (`title`, `date`, `tags`, `categories`, `draft`, `excerpt`, `template`, plus any custom keys you added). |
| `html` | string | Rendered Markdown HTML. Already trusted — output with `<?= $html ?>` in PHP or `{{ html\|raw }}` in Twig. |
| `route` | array | The resolved route (`{ type: 'post', path: 'blog/my-post', folder: 'blog' }`). |

### `page.php` / `page.twig`
Same shape as `post`, but for flat pages (`/about` → `pages/about.md`).

### `archive.php` / `archive.twig`
For folder listings (`/blog`, `/tutorials`, `/blog/page/2`).

| Variable | Type | Notes |
|----------|------|-------|
| `folder` | string | The folder slug (`'blog'`). |
| `items` / `posts` | array of posts | The current page's posts (already sliced). `posts` is an alias of `items`. Each post has its front matter flattened up alongside canonical fields, so `post.image` works without `post.meta.image`. Canonical fields (`url`, `title`, `date`, `slug`, `folder`, `path`, `mtime`, `draft`) win over any same-named meta keys. |
| `folders` | string[] | Every content folder slug — useful for filter tabs. |
| `intro` | array \| null | The folder's `_index.md` parsed (`{ meta, body, html }`), or `null` if absent. |
| `page` | int | Current page number, 1-indexed. |
| `total_pages` | int | Total number of pages. |
| `per_page` | int | Posts per page (resolved from `_index.md` front matter, then `site/config.json`'s `posts_per_page`, then default 10). |

### `taxonomy.php` / `taxonomy.twig`
For `/tags/<slug>`, `/categories/<slug>`, with optional `/page/<n>`.

| Variable | Type | Notes |
|----------|------|-------|
| `taxonomy` | `'tags'` \| `'categories'` | Which taxonomy. |
| `term` | string | The URL slug (`'php'`). |
| `label` | string | Original term from front matter — use this for the page title (e.g. `"PHP"`, `"News Flash"`). Falls back to `term` when no posts matched. |
| `items` / `posts` | array of posts | Same shape as `archive` (meta flattened). |
| `page`, `total_pages`, `per_page` | int | Same as `archive`. |

### `feed.twig` / `feed.php`
Atom feed at `/feed` and `/<folder>/feed`.

| Variable | Type | Notes |
|----------|------|-------|
| `site_name`, `title` | string | Title strings. |
| `site_url`, `feed_url` | string | Absolute URLs. |
| `updated` | int | Unix timestamp — most recent `mtime` of any included item. |
| `items` | array | Up to 20 most recent posts. Each item has `absolute_url` pre-computed. |

### `404.php` / `404.twig`

| Variable | Type | Notes |
|----------|------|-------|
| `url` | string | The path that didn't resolve. |

### Globals available everywhere

- **Twig:** `config` is the full site config as an array — `{{ config.site.name }}`, `{{ config.taxonomies.categories.label }}`, `{{ config.uploads.max_mb }}`.
- **PHP:** `$GLOBALS['md_config']` (the `MD\Config` instance), `$GLOBALS['md_index']` (the `MD\Index` instance), `$GLOBALS['md_router']`, `$GLOBALS['md_content']`. Use these from inside a template if you need to query the index for related posts, recent posts, etc.

## Querying posts

`posts()` is the front-end's query helper. It reads the index, filters, sorts, paginates, and returns a plain array.

```php
function posts(array $args = []): array
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `folder` | string | — | Limit to one content folder. |
| `filter` | array | `[]` | Key/value pairs matched against the post's canonical fields and meta. Scalars compare with `===`; if the post's value is an array (like `tags`, `categories`), `in_array` is used. |
| `orderby` | string | `'date'` | Field to sort by — `date`, `title`, or any meta key. |
| `order` | string | `'desc'` | `'desc'` or `'asc'`. |
| `limit` | int | `0` | Max posts (`0` = all). |
| `offset` | int | `0` | Skip N. |

Drafts are excluded by default.

### Examples

```php
// 3 most recent blog posts
$recent = posts(['folder' => 'blog', 'limit' => 3]);

// Tutorials A–Z
$az = posts(['folder' => 'tutorials', 'orderby' => 'title', 'order' => 'asc']);

// Featured posts across all folders
$featured = posts(['filter' => ['featured' => true], 'limit' => 6]);

// All posts in the "PHP" tag (matched against the array of tags on each post)
$phpPosts = posts(['filter' => ['tags' => 'PHP']]);

// Page 2 of blog (10 per page)
$page2 = posts(['folder' => 'blog', 'limit' => 10, 'offset' => 10]);
```

> **Gotcha:** custom filter keys go inside `filter`, not at the top level. `posts(['featured' => true])` does **not** filter — `featured` is silently ignored.

In Twig, register your own filtered list as a variable in the controller (no Twig wrapper for `posts()` ships by default), or call it from a partial:

```twig
{# templates/_recent.twig — call from any template via partial('recent') #}
{# but the recent list itself needs to come in as a var. Easiest: do it in PHP and #}
{# delegate to the partial. Or expose posts() to Twig in TemplateRenderer if you need it everywhere. #}
```

For most themes you won't need `posts()` in Twig — `archive` / `taxonomy` / front-matter loops cover the common cases.

## Pagination — full example

The framework computes `page` / `total_pages` / `per_page` for you on archive and taxonomy routes. The `paginate()` helper emits the prev / counter / next nav block. Drop it in `archive.twig` (or `archive.php`):

**Twig:**

```twig
{{ partial('header', { page_title: folder|capitalize }) }}

<h1>{{ folder|capitalize }}</h1>

{% if posts|length %}
  <ul class="post-list">
    {% for post in posts %}
      <li>
        <a href="{{ post.url }}">{{ post.title }}</a>
        {% if post.date %}<time datetime="{{ post.date }}">{{ post.date }}</time>{% endif %}
        {% if post.excerpt %}<p>{{ post.excerpt }}</p>{% endif %}
      </li>
    {% endfor %}
  </ul>

  {{ paginate(page, total_pages, '/' ~ folder)|raw }}
{% else %}
  <p>No posts yet.</p>
{% endif %}

{{ partial('footer') }}
```

**PHP:**

```php
<?php partial('header', ['page_title' => ucfirst($folder)]); ?>

<h1><?= e(ucfirst($folder)) ?></h1>

<?php if (!empty($posts)): ?>
  <ul class="post-list">
    <?php foreach ($posts as $post): ?>
      <li>
        <a href="<?= e($post['url']) ?>"><?= e($post['title']) ?></a>
        <?php if (!empty($post['date'])): ?>
          <time datetime="<?= e($post['date']) ?>"><?= e($post['date']) ?></time>
        <?php endif; ?>
        <?php if (!empty($post['excerpt'])): ?>
          <p><?= e($post['excerpt']) ?></p>
        <?php endif; ?>
      </li>
    <?php endforeach; ?>
  </ul>

  <?= paginate((int)$page, (int)$total_pages, '/' . $folder) ?>
<?php else: ?>
  <p>No posts yet.</p>
<?php endif; ?>

<?php partial('footer'); ?>
```

### Custom pagination markup

The default `paginate()` is intentionally minimal. To roll your own, ignore the helper and use `page` / `total_pages` directly:

```twig
{% if total_pages > 1 %}
  <nav class="pagination" aria-label="Pagination">
    {% if page > 1 %}
      <a href="{{ page == 2 ? '/' ~ folder : '/' ~ folder ~ '/page/' ~ (page - 1) }}">← Newer</a>
    {% endif %}

    {% for n in 1..total_pages %}
      {% if n == page %}
        <span aria-current="page">{{ n }}</span>
      {% else %}
        <a href="{{ n == 1 ? '/' ~ folder : '/' ~ folder ~ '/page/' ~ n }}">{{ n }}</a>
      {% endif %}
    {% endfor %}

    {% if page < total_pages %}
      <a href="{{ '/' ~ folder ~ '/page/' ~ (page + 1) }}">Older →</a>
    {% endif %}
  </nav>
{% endif %}
```

To change posts per page, set `posts_per_page:` in the folder's `_index.md` front matter (per-folder), or add `"posts_per_page": 6` at the top level of `site/config.json` (site-wide default).

## Filtering by tags / categories

The framework auto-registers a route for every taxonomy term — no template work required.

| Path | Resolves to |
|------|-------------|
| `/tags/php` | All published posts with `php` in their `tags:` front matter (case-insensitive, slug-matched). |
| `/categories/news` | All published posts with `news` in `categories:`. |
| `/tags/php/page/2` | Page 2 of the same. |

Posts are matched by the **slugified** form of the term, so `"News Flash"`, `"news flash"`, and `news-flash` all resolve to `/tags/news-flash`.

### Linking from a post

Use `slug_url()`:

**Twig:**

```twig
{# Inside post.twig — show the post's tags as links #}
{% if meta.tags %}
  <ul class="tag-list">
    {% for tag in meta.tags %}
      <li><a href="{{ slug_url(tag, 'tags') }}">{{ tag }}</a></li>
    {% endfor %}
  </ul>
{% endif %}

{% if meta.categories %}
  {% for cat in meta.categories %}
    <a href="{{ slug_url(cat, 'categories') }}">{{ cat }}</a>
  {% endfor %}
{% endif %}
```

**PHP:**

```php
<?php if (!empty($meta['tags'])): ?>
  <ul class="tag-list">
    <?php foreach ($meta['tags'] as $tag): ?>
      <li><a href="<?= e(slug_url($tag, 'tags')) ?>"><?= e($tag) ?></a></li>
    <?php endforeach; ?>
  </ul>
<?php endif; ?>
```

### Filtering posts by taxonomy in a custom query

`posts(['filter' => ['tags' => 'PHP']])` works because each post's `tags` field is an array — `Index::filter()` falls back to `in_array($value, $actual, true)` for array fields. Same for `categories`:

```php
// 5 most recent posts in the "tutorials" category, across all folders
$tutPosts = posts([
    'filter'  => ['categories' => 'tutorials'],
    'limit'   => 5,
]);
```

Note the strict comparison — capitalisation matters. To match by slug instead, scan the index yourself:

```php
$index  = $GLOBALS['md_index'];
$result = $index->findByTaxonomyTerm('tags', 'php');  // slug-matched
$posts  = $result['posts'];
$label  = $result['label']; // original cased term, e.g. "PHP"
```

`findByTaxonomyTerm()` is what powers the `/tags/<slug>` routes themselves.

### Listing every term used on the site

Walk the index and collect uniques:

```php
$index = $GLOBALS['md_index'];
$tags = [];
foreach ($index->get() as $post) {
    foreach ($post['tags'] as $t) {
        $tags[$t] = ($tags[$t] ?? 0) + 1;
    }
}
arsort($tags); // most-used first
foreach ($tags as $tag => $count) {
    printf('<a href="%s">%s (%d)</a>', e(slug_url($tag, 'tags')), e($tag), $count);
}
```

Same shape works for `categories`, or any custom taxonomy you added in `site/config.json`.

## Loop via front matter

Pages can embed a post loop without a custom template using the `loop:` key in front matter:

```yaml
---
title: Home
loop:
  folder: blog
  orderby: date
  order: desc
  limit: 5
  offset: 0
  filter:
    featured: true
---
```

Supported `loop` keys mirror the `posts()` arguments. The loop renders below the page body as a simple `<section>` of linked titles. For richer markup, drop `loop:` and switch to a custom template.

## Per-post template override

Add `template:` to a post's front matter to use a different file from the active theme:

```yaml
---
title: Special landing page
template: landing
---
```

Resolution rules (`ThemeService::resolveTemplate()`):

- Looks up `templates/landing.php`, then `templates/landing.twig` in the active theme.
- Excludes partials (filenames starting with `_`) and route-bound templates (`archive`, `taxonomy`, `feed`, `404`).
- An invalid value falls back to the route-type default (`post.twig` / `page.twig`).

The admin's editor sidebar exposes this as a **Template** dropdown, populated via `GET /admin/api/themes/templates`.

## Custom collections

A folder under `site/content/<name>/` is automatically a collection: `/<name>` archive, `/<name>/<slug>` posts, `/<name>/feed`, `/<name>/page/<n>`. No registration step.

You can scope a taxonomy to specific folders via `site/config.json`:

```json
"taxonomies": {
  "tags": {
    "label": "Tags",
    "post_types": ["blog", "tutorials"]
  }
}
```

`post_types` is the list of folder slugs the taxonomy applies to — controls which post types show the field in the admin editor sidebar.

## Theme assets

`site/themes/<active>/assets/` is symlinked into `public/assets/` on theme activation. Reference files with `asset_url()`:

```twig
<link rel="stylesheet" href="{{ asset_url('style.css') }}">
<script src="{{ asset_url('main.js') }}"></script>
<img src="{{ asset_url('logo.svg') }}" alt="Logo">
```

### SCSS auto-compile

If `assets/style.scss` exists and is newer than `assets/style.css`, `MD\ScssCompiler` compiles it on the next public or admin request — no build step. Imports (`@import 'partials/forms';`) work; partial files (`_*.scss`) aren't compiled standalone. Compilation only runs when something changed (a couple of stat() calls), so the overhead in production is essentially zero.

To skip auto-compile (e.g. you have your own pipeline), don't ship a `.scss` file — drop a hand-authored `style.css` instead.

## Engine specifics: Twig

- Compiled templates: `site/cache/twig/`. `auto_reload: true` so editing `.twig` picks up on next request.
- Cache invalidation: theme switch and admin "regenerate cache" both clear via `CacheService::clearTwig()`.
- Autoescape: `html` mode. Use `{{ html|raw }}` to emit pre-rendered Markdown HTML, or `{% autoescape false %}…{% endautoescape %}`.
- Globals: `config` (full site config array).
- `partial()`, `paginate()` are registered with `is_safe: ['html']`, so their output is *not* re-escaped — the helpers escape their own inputs.

## Engine specifics: PHP

- No autoescape — call `e()` on every interpolated value. The exception is `$html` (rendered Markdown) and `$intro['html']`, which are pre-trusted.
- `extract($vars, EXTR_SKIP)` runs in `render()` — variables don't clobber globals.
- The PHP layout pattern (output-buffer the body, then `require '_layout.php'`) still works for legacy themes:

  ```php
  <?php
  ob_start(); ?>
  <h1><?= e($meta['title']) ?></h1>
  <div><?= $html ?></div>
  <?php
  $content_body = ob_get_clean();
  $page_title   = $meta['title'];
  require __DIR__ . '/_layout.php';
  ```

  The starter themes use `partial('header')` / `partial('footer')` instead, which is simpler and avoids the buffer.

## Debugging — what's actually available?

When you're trying to figure out which fields a post has or what data lands in a template, dump the variables:

**Twig:**

```twig
{# Drop this anywhere — Twig pretty-prints the array #}
<pre>{{ dump() }}</pre>

{# Or dump specific things #}
<pre>{{ dump(meta) }}</pre>
<pre>{{ dump(posts) }}</pre>
<pre>{{ dump(config) }}</pre>
```

`dump()` ships with Twig's `DebugExtension` when you enable debug mode. To turn it on for a development theme, add to `MD\TemplateRenderer::__construct` (temporarily):

```php
$this->twig->enableDebug();
$this->twig->addExtension(new \Twig\Extension\DebugExtension());
```

Without `DebugExtension`, fall back to plain inspection:

```twig
<pre>
folder: {{ folder }}
total_pages: {{ total_pages }}
per_page: {{ per_page }}
posts count: {{ posts|length }}
config: {{ config|json_encode(constant('JSON_PRETTY_PRINT')) }}
first post: {{ posts[0]|json_encode(constant('JSON_PRETTY_PRINT')) }}
</pre>
```

**PHP:**

```php
<?php
echo '<pre>';
echo "Route: ";        var_export($route ?? null);
echo "\n\nMeta: ";      var_export($meta ?? null);
echo "\n\nPosts: ";     var_export($posts ?? null);
echo "\n\nConfig: ";    var_export($GLOBALS['md_config']->all());
echo "\n\nFolders: ";   var_export($folders ?? null);
echo '</pre>';
```

### A reusable inspect partial

Drop this in `templates/_inspect.twig` to use as `{{ partial('inspect') }}` from any template:

```twig
{# templates/_inspect.twig — site dev dashboard #}
{% if config.site.debug ?? false %}
<details style="background:#111;color:#0f0;padding:1rem;font:12px/1.4 monospace">
  <summary>🔍 inspect</summary>

  <h4>Globals</h4>
  <pre>config = {{ config|json_encode(constant('JSON_PRETTY_PRINT')) }}</pre>

  <h4>This route</h4>
  <pre>{{ {
    'meta': meta|default(null),
    'route': route|default(null),
    'folder': folder|default(null),
    'taxonomy': taxonomy|default(null),
    'term': term|default(null),
    'page': page|default(null),
    'total_pages': total_pages|default(null),
    'per_page': per_page|default(null),
    'posts (count)': (posts|default([]))|length,
    'folders': folders|default(null),
  }|json_encode(constant('JSON_PRETTY_PRINT')) }}</pre>

  {% if posts|default([])|length %}
    <h4>First post (full record)</h4>
    <pre>{{ posts[0]|json_encode(constant('JSON_PRETTY_PRINT')) }}</pre>
  {% endif %}
</details>
{% endif %}
```

Enable it by adding `"debug": true` under `site` in `site/config.json`:

```json
{
  "site": { "name": "My Site", "debug": true }
}
```

The PHP equivalent (`templates/_inspect.php`):

```php
<?php
$debug = $GLOBALS['md_config']->get('site', [])['debug'] ?? false;
if (!$debug) return;

$snapshot = [
    'meta'        => $meta        ?? null,
    'route'       => $route       ?? null,
    'folder'      => $folder      ?? null,
    'taxonomy'    => $taxonomy    ?? null,
    'term'        => $term        ?? null,
    'page'        => $page        ?? null,
    'total_pages' => $total_pages ?? null,
    'per_page'    => $per_page    ?? null,
    'posts_count' => isset($posts) ? count($posts) : 0,
    'folders'     => $folders     ?? null,
];
?>
<details style="background:#111;color:#0f0;padding:1rem;font:12px/1.4 monospace">
  <summary>🔍 inspect</summary>
  <h4>Config</h4>
  <pre><?= e(json_encode($GLOBALS['md_config']->all(), JSON_PRETTY_PRINT)) ?></pre>
  <h4>This route</h4>
  <pre><?= e(json_encode($snapshot, JSON_PRETTY_PRINT)) ?></pre>
  <?php if (!empty($posts)): ?>
    <h4>First post</h4>
    <pre><?= e(json_encode($posts[0], JSON_PRETTY_PRINT)) ?></pre>
  <?php endif; ?>
</details>
```

Then call it from any template:

```twig
{{ partial('inspect') }}
```

```php
<?php partial('inspect'); ?>
```

### What the data looks like

A typical post record in `posts` (and from `posts()`):

```json
{
  "slug":       "my-first-post",
  "folder":     "blog",
  "path":       "blog/my-first-post",
  "url":        "/blog/my-first-post",
  "title":      "My First Post",
  "date":       "2026-04-22",
  "categories": ["news", "releases"],
  "tags":       ["php", "markdown"],
  "draft":      false,
  "mtime":      1714000000,
  "meta": {
    "title": "My First Post",
    "date":  "2026-04-22",
    "excerpt": "Short description shown in archive lists.",
    "image": "/uploads/cover.jpg",
    "...":   "any custom front-matter key"
  },

  "excerpt":    "Short description shown in archive lists.",
  "image":      "/uploads/cover.jpg"
}
```

The bottom two fields (`excerpt`, `image`) are the result of meta-flattening done by `archive` and `taxonomy` routes — every meta key lands at the top level for easy template access. Single-post `meta` (in `post.twig` / `page.twig`) is **not** flattened; reach into `meta.image` directly.

{% endraw %}
