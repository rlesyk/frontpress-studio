<?php

declare(strict_types=1);

namespace MD;

use League\CommonMark\CommonMarkConverter;

class Content
{
    private string $contentDir;
    private string $cacheDir;
    private CommonMarkConverter $md;

    public function __construct(string $contentDir, string $cacheDir)
    {
        $this->contentDir = rtrim($contentDir, '/');
        $this->cacheDir   = rtrim($cacheDir, '/');
        // 'html_input' => 'allow' lets HTML blocks (image figures from the
        // admin editor, embedded snippets) round-trip cleanly. Without this,
        // <div>…</div> blocks get escaped to text on every reload and Turndown
        // then escapes any underscores in them on the next save — accumulating
        // backslashes (e.g. class="\\\_se\\\_…") with each round-trip.
        $this->md         = new CommonMarkConverter([
            'html_input'         => 'allow',
            'allow_unsafe_links' => false,
        ]);
    }

    /**
     * Load a content file by its relative path (e.g. "blog/my-post" or "pages/about").
     * Returns ['meta' => [...], 'html' => '...'] or null if not found.
     *
     * @return array<string, mixed>|null
     */
    public function load(string $relPath): ?array
    {
        $file = $this->contentDir . '/' . $relPath . '.md';
        if (!is_file($file)) {
            return null;
        }

        $cacheFile = $this->cacheDir . '/html/' . md5($relPath) . '.json';
        if (is_file($cacheFile) && filemtime($cacheFile) >= filemtime($file)) {
            $cached = json_decode(file_get_contents($cacheFile), true);
            if (is_array($cached)) {
                return $cached;
            }
        }

        $parsed = $this->parse($file);
        $this->writeCache($cacheFile, $parsed);
        return $parsed;
    }

    /**
     * Parse a markdown file into meta + html.
     *
     * A malformed YAML block does not throw: the page still renders with an
     * empty meta array so public requests survive one hand-edited file. The
     * parse error is logged via FrontMatter.
     *
     * @return array<string, mixed>
     */
    public function parse(string $file): array
    {
        $raw  = file_get_contents($file);
        $meta = [];
        $body = $raw;

        if (str_starts_with($raw, "---\n")) {
            $end = strpos($raw, "\n---\n", 4);
            if ($end !== false) {
                $yaml   = substr($raw, 4, $end - 4);
                $body   = substr($raw, $end + 5);
                $parsed = FrontMatter::parse($yaml, $file);
                $meta   = $parsed === null ? [] : FrontMatter::normalize($parsed);
            }
        }

        $html = $this->md->convert($body)->getContent();
        $html = $this->annotateImages($html);

        return [
            'meta' => $meta,
            'body' => $body,
            'html' => $html,
        ];
    }

    /**
     * Inject `width`, `height`, and `loading="lazy"` (after the first image)
     * onto every local `<img src="/uploads/…">` in rendered HTML.
     *
     * Why here: the result is cached in `cache/html/`, so the `getimagesize()`
     * calls run once per content edit, never per request. Browsers can
     * reserve the right slot in layout the moment they parse the HTML, which
     * eliminates the layout shift / "blink" that fires when an image
     * suddenly takes up its true height after streaming in.
     *
     * Skipped when an `<img>` already has `width=` or `height=` set, so any
     * hand-authored `<img>` in markdown wins. External URLs are skipped too.
     */
    private function annotateImages(string $html): string
    {
        if (!str_contains($html, '<img')) return $html;

        $first = true;
        return (string)preg_replace_callback(
            '#<img\b([^>]*)>#i',
            function (array $m) use (&$first): string {
                $attrs = $m[1];
                if (preg_match('/\s(width|height)\s*=/i', $attrs)) {
                    return $m[0];
                }
                if (!preg_match('/\bsrc\s*=\s*"([^"]+)"/i', $attrs, $sm)) {
                    return $m[0];
                }
                $src = $sm[1];
                if (!str_starts_with($src, '/uploads/')) {
                    return $m[0];
                }

                $diskPath = $this->resolveUploadPath($src);
                if (!$diskPath) return $m[0];

                $info = @getimagesize($diskPath);
                if (!$info) return $m[0];

                [$w, $h] = $info;
                // Strip a trailing self-closing slash CommonMark emits in
                // XHTML mode so the new attrs don't end up after the `/`.
                $attrs  = rtrim($attrs, " /");
                $extras = sprintf(' width="%d" height="%d"', $w, $h);
                if (!$first && !preg_match('/\bloading\s*=/i', $attrs)) {
                    $extras .= ' loading="lazy" decoding="async"';
                }
                $first = false;
                return '<img' . $attrs . $extras . '>';
            },
            $html
        );
    }

    /**
     * Map a `/uploads/<rel>` URL back to its file on disk. Tries the per-post
     * location (`site/content/<rel>`) first, then the global pool
     * (`site/uploads/<rel>`) — same precedence as the route in
     * `public/index.php`. Returns null when the file isn't local or escapes
     * its base via `..`.
     */
    private function resolveUploadPath(string $src): ?string
    {
        $rel = ltrim(substr($src, strlen('/uploads/')), '/');
        if ($rel === '' || str_contains($rel, '..')) return null;

        $bases = [
            $this->contentDir,
            dirname($this->contentDir) . '/uploads',
        ];
        foreach ($bases as $base) {
            $abs      = $base . '/' . $rel;
            $real     = realpath($abs);
            $baseReal = realpath($base);
            if ($real && $baseReal && str_starts_with($real, $baseReal . '/') && is_file($real)) {
                return $real;
            }
        }
        return null;
    }

    /**
     * Extract just the front matter (no markdown conversion) — used by the
     * index builder. Returns null when the YAML is malformed so the caller
     * can skip the file instead of indexing a half-broken record.
     *
     * @return array<string, mixed>|null
     */
    public function parseMeta(string $file): ?array
    {
        $fp = fopen($file, 'r');
        if (!$fp) {
            return [];
        }
        $first = fgets($fp);
        if (trim($first) !== '---') {
            fclose($fp);
            return [];
        }
        $yaml = '';
        while (($line = fgets($fp)) !== false) {
            if (trim($line) === '---') {
                break;
            }
            $yaml .= $line;
        }
        fclose($fp);
        $parsed = FrontMatter::parse($yaml, $file);
        if ($parsed === null) {
            return null;
        }
        return FrontMatter::normalize($parsed);
    }

    /** @param array<string, mixed> $data */
    private function writeCache(string $file, array $data): void
    {
        Fs::atomicWrite($file, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }
}
