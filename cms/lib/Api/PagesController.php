<?php

declare(strict_types=1);

namespace MD\Api;

use MD\CacheService;
use MD\Content;
use MD\ContentRepository;
use MD\Index;
use MD\PathResolver;
use MD\ThemeService;

class PagesController
{
    /**
     * @param string[] $pathParts
     * @param array<string, mixed> $config
     */
    public static function handle(array $pathParts, string $method, array $config): void
    {
        Router::requireAuth();

        $relPath = trim(implode('/', $pathParts), '/');
        $services = self::services($config);

        if ($method === 'GET' && $relPath === '') {
            self::list($services, $config);
            return;
        }
        if ($method === 'GET') {
            self::get($relPath, $services);
            return;
        }

        Router::requireCsrf();

        if ($method === 'POST' && $relPath === '') {
            self::save(null, $services, $config);
            return;
        }
        if ($method === 'PUT' && $relPath !== '') {
            self::save($relPath, $services, $config);
            return;
        }
        if ($method === 'DELETE' && $relPath !== '') {
            self::delete($relPath, $services, $config);
            return;
        }

        \json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
    }

    /**
     * @param array<string, mixed> $config
     * @return array{paths: PathResolver, content: Content, cache: CacheService, repo: ContentRepository, index: Index}
     */
    private static function services(array $config): array
    {
        $paths   = ServiceFactory::paths($config);
        $content = ServiceFactory::content($config);
        $cache   = ServiceFactory::cache($config);
        $repo    = ServiceFactory::repository($config);
        $index   = ServiceFactory::index($config, $content);
        return compact('paths', 'content', 'cache', 'repo', 'index');
    }

    /**
     * @param array{paths: PathResolver, index: Index} $svc
     * @param array<string, mixed> $config
     */
    private static function list(array $svc, array $config): void
    {
        $folders = [];
        if (is_dir($config['contentDir'])) {
            foreach (array_diff(scandir($config['contentDir']), ['.', '..']) as $entry) {
                if (is_dir($config['contentDir'] . '/' . $entry)) {
                    $folders[] = $entry;
                }
            }
        }
        sort($folders);

        $pages = array_values($svc['index']->get(includeDrafts: true));
        \json_response(['ok' => true, 'pages' => $pages, 'folders' => $folders]);
    }

    /** @param array{paths: PathResolver, repo: ContentRepository} $svc */
    private static function get(string $relPath, array $svc): void
    {
        $abs = $svc['paths']->contentFile($relPath);
        if (!$abs) {
            \json_response(['ok' => false, 'error' => 'Not found'], 404);
        }
        $parsed = $svc['repo']->parse($abs);
        \json_response([
            'ok'   => true,
            'path' => $relPath,
            'meta' => $parsed['meta'] ?? [],
            'body' => $parsed['body'] ?? '',
            'html' => $parsed['html'] ?? '',
        ]);
    }

    /**
     * @param array{paths: PathResolver, repo: ContentRepository} $svc
     * @param array<string, mixed> $config
     */
    private static function save(?string $existingPath, array $svc, array $config): void
    {
        $input   = Router::jsonBody();
        $isNew   = $existingPath === null;
        $relPath = trim((string)($input['path'] ?? $existingPath ?? ''), '/');
        $title   = trim((string)($input['title'] ?? ''));
        $body    = (string)($input['body'] ?? '');

        if (!$svc['paths']->isValidRelPath($relPath)) {
            \json_response(['ok' => false, 'error' => 'Invalid path'], 400);
        }
        if ($title === '') {
            \json_response(['ok' => false, 'error' => 'Title is required'], 400);
        }

        $existing = [];
        if ($isNew) {
            if ($svc['paths']->resolveNewContentFile($relPath) === null) {
                \json_response(['ok' => false, 'error' => 'Cannot create at this path'], 400);
            }
        } else {
            $abs = $svc['paths']->contentFile($relPath);
            if (!$abs) {
                \json_response(['ok' => false, 'error' => 'Not found'], 404);
            }
            $existing = $svc['repo']->parseMeta($abs);
        }

        $incomingMeta = is_array($input['meta'] ?? null) ? $input['meta'] : [];
        $meta         = array_merge($existing, $incomingMeta, ['title' => $title]);

        $status = (string)($input['status'] ?? 'published');
        if ($status === 'draft') {
            $meta['draft'] = true;
        } else {
            unset($meta['draft']);
        }

        // Per-post template override — empty string clears the key so the
        // public renderer falls back to the route-type default (post / page).
        // The submitted name must match a real, user-selectable template in the
        // active theme; otherwise we reject the save instead of silently
        // dropping the field, so the caller knows the value was invalid.
        if (array_key_exists('template', $input)) {
            $tpl = preg_replace('/[^a-z0-9_-]/', '', strtolower(trim((string)$input['template'])));
            if ($tpl === '') {
                unset($meta['template']);
            } else {
                $themes = ServiceFactory::themes($config);
                if (!in_array($tpl, $themes->listTemplates(), true)) {
                    \json_response(['ok' => false, 'error' => "Unknown template: $tpl"], 400);
                }
                $meta['template'] = $tpl;
            }
        }

        // Taxonomies — pass-through, repo persists everything in $meta.
        //
        // Skip keys that are owned by other top-level inputs (`title`, `draft`,
        // `template`, `path`). The editor seeds `taxValues` from the loaded
        // meta, which means a reserved key like `draft: true` would otherwise
        // come back through this loop and clobber the change the dedicated
        // `status` / `template` blocks above just made.
        $reserved = ['title', 'draft', 'template', 'path'];
        if (is_array($input['taxonomies'] ?? null)) {
            foreach ($input['taxonomies'] as $taxSlug => $value) {
                $taxSlug = (string)$taxSlug;
                if (in_array($taxSlug, $reserved, true)) continue;
                if (is_array($value)) {
                    $items = array_values(array_filter(array_map(
                        fn ($v) => trim((string)$v),
                        $value
                    ), fn ($v) => $v !== ''));
                    if ($items) {
                        $meta[$taxSlug] = $items;
                    } else {
                        unset($meta[$taxSlug]);
                    }
                } else {
                    $v = trim((string)$value);
                    if ($v !== '') {
                        $meta[$taxSlug] = $v;
                    } else {
                        unset($meta[$taxSlug]);
                    }
                }
            }
        }

        $svc['repo']->save($relPath, $meta, $body);
        ServiceFactory::audit($config)->record(
            $isNew ? 'page.create' : 'page.update',
            $relPath,
            ['title' => $title, 'draft' => !empty($meta['draft'])],
        );
        \json_response(['ok' => true, 'path' => $relPath]);
    }

    /**
     * @param array{paths: PathResolver, repo: ContentRepository} $svc
     * @param array<string, mixed>                                $config
     */
    private static function delete(string $relPath, array $svc, array $config): void
    {
        $abs = $svc['paths']->contentFile($relPath);
        if (!$abs) {
            \json_response(['ok' => false, 'error' => 'Not found'], 404);
        }
        $svc['repo']->delete($relPath, $abs);
        ServiceFactory::audit($config)->record('page.delete', $relPath);
        \json_response(['ok' => true]);
    }
}
