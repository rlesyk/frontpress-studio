<?php

declare(strict_types=1);

namespace FrontPress\Api;

defined('FRONTPRESS_BOOT') || exit;

/**
 * Form-submission inbox. The public form handler in index.php writes
 * submissions; this controller surfaces them in the admin.
 *
 *   GET    /admin/api/submissions[?form=<name>&limit=<n>&offset=<n>]
 *   GET    /admin/api/submissions/<form>/<YYYY-MM>/<ts>_<rand>
 *   DELETE /admin/api/submissions/<form>/<YYYY-MM>/<ts>_<rand>
 *
 * All endpoints require an authenticated admin session. The destructive
 * one (DELETE) also requires CSRF. Submission ids are validated against
 * a strict regex inside `SubmissionStore` so path-traversal can't reach
 * outside the store.
 */
class SubmissionsController
{
    /**
     * @param string[]             $pathParts
     * @param array<string, mixed> $config
     */
    public static function handle(array $pathParts, string $method, array $config): void
    {
        Router::requireAuth();

        $store = ServiceFactory::submissions($config);

        // GET /submissions  — list
        if ($method === 'GET' && empty($pathParts)) {
            $form   = $_GET['form'] ?? null;
            $form   = $form !== null ? (string)$form : null;
            $limit  = max(1, min(200, (int)($_GET['limit']  ?? 50)));
            $offset = max(0, (int)($_GET['offset'] ?? 0));
            \json_response([
                'ok'    => true,
                'items' => $store->list($form, $limit, $offset),
                'total' => $store->count($form),
            ]);
        }

        // GET /submissions/<form>/<month>/<id>
        if ($method === 'GET') {
            $id  = implode('/', $pathParts);
            $row = $store->find($id);
            if ($row === null) {
                \json_response(['ok' => false, 'error' => 'Not found'], 404);
            }
            \json_response(['ok' => true, 'submission' => $row]);
        }

        // DELETE /submissions/<form>/<month>/<id>
        if ($method === 'DELETE') {
            Router::requireCsrf();
            $id = implode('/', $pathParts);
            $ok = $store->delete($id);
            ServiceFactory::audit($config)->record('submission.delete', $id, ['ok' => $ok]);
            \json_response(['ok' => $ok]);
        }

        \json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
    }
}
