<?php

declare(strict_types=1);

namespace FrontPress;

defined('FRONTPRESS_BOOT') || exit;

/**
 * Discovers and caches the set of available blocks. A block is a directory
 * under `cms/blocks/<slug>/` containing:
 *
 *   block.json   — schema: { label, icon, fields[], category? }
 *   render.twig  — server-side render template (receives `data`, `children`,
 *                  `page` — `data` carries the field values for this
 *                  instance, `children` is an already-rendered HTML string
 *                  for nested blocks, `page` is the host page's meta)
 *
 * The registry is read once per request (it's a handful of stat() calls
 * over a few directories — no need for a persistent cache yet).
 */
final class BlockRegistry
{
    /** @var array<string, array<string, mixed>>|null */
    private ?array $cache = null;

    public function __construct(private string $blocksDir) {}

    /**
     * @return array<string, array<string, mixed>> map of slug → definition
     */
    public function all(): array
    {
        if ($this->cache !== null) return $this->cache;
        $out = [];
        if (is_dir($this->blocksDir)) {
            foreach (scandir($this->blocksDir) ?: [] as $entry) {
                if ($entry === '.' || $entry === '..') continue;
                $jsonFile = $this->blocksDir . '/' . $entry . '/block.json';
                if (!is_file($jsonFile)) continue;
                $meta = json_decode((string)file_get_contents($jsonFile), true);
                if (!is_array($meta)) continue;
                $meta['slug']     = $meta['slug']     ?? $entry;
                $meta['label']    = $meta['label']    ?? ucfirst($entry);
                $meta['icon']     = $meta['icon']     ?? '';
                $meta['category'] = $meta['category'] ?? 'General';
                $meta['fields']   = is_array($meta['fields'] ?? null) ? $meta['fields'] : [];
                $meta['template'] = $this->blocksDir . '/' . $entry . '/render.twig';
                $meta['hasChildren'] = !empty($meta['hasChildren']);
                $out[$meta['slug']] = $meta;
            }
        }
        ksort($out);
        return $this->cache = $out;
    }

    /** @return array<string, mixed>|null */
    public function get(string $slug): ?array
    {
        return $this->all()[$slug] ?? null;
    }
}
