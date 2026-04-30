<?php

declare(strict_types=1);

namespace MD\Api;

use MD\ThemeService;

class ThemesController
{
    /**
     * @param string[] $pathParts
     * @param array<string, mixed> $config
     */
    public static function handle(array $pathParts, string $method, array $config): void
    {
        Router::requireAuth();

        $themes = ServiceFactory::themes($config);
        $action = $pathParts[0] ?? '';

        if ($method === 'GET' && $action === '') {
            self::list($themes, $config);
            return;
        }

        if ($method === 'GET' && $action === 'templates') {
            \json_response(['ok' => true, 'templates' => $themes->listTemplates()]);
        }

        Router::requireCsrf();

        if ($method !== 'POST') {
            \json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
        }

        $body = Router::jsonBody();

        if ($action === 'activate') {
            $slug   = preg_replace('/[^a-z0-9_-]/', '', (string)($body['slug'] ?? ''));
            $result = $themes->activate($slug);
            if (!empty($result['ok'])) {
                self::clearCache($config);
                \json_response(['ok' => true]);
            }
            \json_response(['ok' => false, 'error' => $result['error'] ?? 'Failed'], 400);
        }
        if ($action === 'install') {
            $starter   = preg_replace('/[^a-z0-9_-]/', '', (string)($body['starter'] ?? ''));
            $themeSlug = preg_replace('/[^a-z0-9_-]/', '', (string)($body['theme_slug'] ?? $starter));
            $result    = $themes->installFromStarter($starter, $themeSlug, $config['cmsRoot'] . '/starters');
            if (!empty($result['ok'])) {
                \json_response(['ok' => true]);
            }
            \json_response(['ok' => false, 'error' => $result['error'] ?? 'Failed'], 400);
        }
        if ($action === 'delete') {
            $slug   = preg_replace('/[^a-z0-9_-]/', '', (string)($body['slug'] ?? ''));
            $result = $themes->delete($slug);
            if (!empty($result['ok'])) {
                self::clearCache($config);
                \json_response(['ok' => true]);
            }
            \json_response(['ok' => false, 'error' => $result['error'] ?? 'Failed'], 400);
        }
        if ($action === 'replace') {
            $starter   = preg_replace('/[^a-z0-9_-]/', '', (string)($body['starter'] ?? ''));
            $themeSlug = preg_replace('/[^a-z0-9_-]/', '', (string)($body['theme_slug'] ?? $themes->active()));
            $result    = $themes->replaceTemplates($starter, $themeSlug, $config['cmsRoot'] . '/starters');
            if (!empty($result['ok'])) {
                self::clearCache($config);
                \json_response(['ok' => true]);
            }
            \json_response(['ok' => false, 'error' => $result['error'] ?? 'Failed'], 400);
        }

        \json_response(['ok' => false, 'error' => 'Unknown theme action'], 404);
    }

    /** @param array<string, mixed> $config */
    private static function list(ThemeService $themes, array $config): void
    {
        // Starters and installed themes both use `theme.json` for metadata.
        // The Starters card globs `cms/starters/*/theme.json`; the Installed
        // card globs `site/themes/*/theme.json` (handled by ThemeService::list).
        $starters = [];
        foreach (glob($config['cmsRoot'] . '/starters/*/theme.json') ?: [] as $f) {
            $slug            = basename(dirname($f));
            $meta            = json_decode((string)file_get_contents($f), true) ?? [];
            $engine          = $meta['engine'] ?? ThemeService::detectEngine(dirname($f) . '/templates');
            $starters[$slug] = array_merge(['name' => $slug, 'description' => ''], $meta, ['slug' => $slug, 'engine' => $engine]);
        }
        \json_response([
            'ok'       => true,
            'themes'   => array_values($themes->list()),
            'active'   => $themes->active(),
            'starters' => array_values($starters),
        ]);
    }

    /** @param array<string, mixed> $config */
    private static function clearCache(array $config): void
    {
        $cache = ServiceFactory::cache($config);
        $cache->clearAllHtml();
        $cache->clearIndex();
        $cache->clearTwig();
    }
}
