<?php

declare(strict_types=1);

namespace FrontPress;

defined('FRONTPRESS_BOOT') || exit;

/**
 * Persists form submissions to disk — one JSON file per submission, under
 * `<root>/<form>/<YYYY-MM>/<ts>_<rand>.json`. Partitioning by form first
 * means listing one form's submissions doesn't scan the others, and the
 * month partition keeps any single directory small even for a busy form.
 *
 * The id returned by `save()` doubles as the URL slug for admin endpoints
 * (`GET /admin/api/submissions/<id>`). It's always re-validated against a
 * strict regex before any filesystem operation so path-traversal can't
 * reach files outside the store.
 *
 * Lives under `site/data/submissions/` so the existing BackupService picks
 * it up in Full and Content backups.
 */
final class SubmissionStore
{
    /** Strict id format — used for both URL parsing and filesystem lookup. */
    private const ID_RE = '#^[a-z0-9_-]+/\d{4}-\d{2}/\d{8}T\d{4}_[a-f0-9]{4}$#';

    public function __construct(private string $root) {}

    /**
     * Persist a submission. Returns the canonical id.
     *
     * @param array<string, mixed> $payload   the form fields as submitted
     * @param array<string, mixed> $meta      ip, ua, email-delivery result, etc.
     */
    public function save(string $formName, array $payload, array $meta = []): string
    {
        $form = self::slugForm($formName);
        $now  = gmdate('Ymd\THi');
        $rand = bin2hex(random_bytes(2));
        $id   = $form . '/' . gmdate('Y-m') . '/' . $now . '_' . $rand;

        if (!preg_match(self::ID_RE, $id)) {
            // Defensive — shouldn't happen given the inputs above.
            throw new \RuntimeException('Invalid submission id (refused to write)');
        }

        $path = $this->root . '/' . $id . '.json';
        $row  = [
            'id'      => $id,
            'form'    => $form,
            'created' => date(\DATE_ATOM),
            'ip'      => isset($meta['ip']) ? (string)$meta['ip'] : null,
            'ua'      => isset($meta['ua']) ? (string)$meta['ua'] : null,
            'fields'  => $payload,
            'email'   => $meta['email'] ?? null,
        ];

        $json = json_encode($row, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false || !Fs::atomicWrite($path, $json)) {
            throw new \RuntimeException('Could not persist submission');
        }
        return $id;
    }

    /**
     * List submissions newest-first. `$form === null` lists across all
     * forms. Result rows are *summaries* (id, form, created, summary
     * line + email transport status) — call `find()` for the full payload.
     *
     * @return list<array<string, mixed>>
     */
    public function list(?string $form = null, int $limit = 50, int $offset = 0): array
    {
        $base = $this->root;
        $glob = $form !== null
            ? $base . '/' . self::slugForm($form) . '/*/*.json'
            : $base . '/*/*/*.json';

        $files = glob($glob) ?: [];
        // Newest-first by filename — filenames are timestamps, so a
        // descending sort is correct without re-reading the contents.
        rsort($files);

        $slice = array_slice($files, $offset, $limit);
        $out   = [];
        foreach ($slice as $path) {
            $raw = @file_get_contents($path);
            if ($raw === false) continue;
            $row = json_decode($raw, true);
            if (!is_array($row) || !isset($row['id'])) continue;
            $out[] = [
                'id'         => $row['id'],
                'form'       => $row['form'] ?? '',
                'created'    => $row['created'] ?? '',
                'summary'    => self::summarize($row['fields'] ?? []),
                'email'      => $row['email'] ?? null,
            ];
        }
        return $out;
    }

    /** Total count for an optional form filter, for pagination math. */
    public function count(?string $form = null): int
    {
        $glob = $form !== null
            ? $this->root . '/' . self::slugForm($form) . '/*/*.json'
            : $this->root . '/*/*/*.json';
        return count(glob($glob) ?: []);
    }

    /**
     * Full record for one submission, or null if not found / id invalid.
     *
     * @return array<string, mixed>|null
     */
    public function find(string $id): ?array
    {
        if (!preg_match(self::ID_RE, $id)) return null;
        $path = $this->root . '/' . $id . '.json';
        if (!is_file($path)) return null;
        $raw = @file_get_contents($path);
        if ($raw === false) return null;
        $row = json_decode($raw, true);
        return is_array($row) ? $row : null;
    }

    /** Hard-delete (no trash bin). Returns true if a file was removed. */
    public function delete(string $id): bool
    {
        if (!preg_match(self::ID_RE, $id)) return false;
        $path = $this->root . '/' . $id . '.json';
        if (!is_file($path)) return false;
        return @unlink($path);
    }

    /**
     * Normalise a form name into the slug we use both in the URL space
     * and as the top-level directory.
     */
    public static function slugForm(string $name): string
    {
        $slug = strtolower(preg_replace('/[^a-zA-Z0-9_-]/', '', $name) ?? '');
        return $slug !== '' ? $slug : 'contact';
    }

    /**
     * Build a one-line summary from the submission's fields — best-guess
     * "what's this submission about" for the admin list view.
     *
     * @param array<string, mixed> $fields
     */
    private static function summarize(array $fields): string
    {
        // Prefer name + subject + first chunk of message, in that order.
        $parts = [];
        if (!empty($fields['name']))    $parts[] = (string)$fields['name'];
        if (!empty($fields['email']))   $parts[] = (string)$fields['email'];
        if (!empty($fields['subject'])) $parts[] = (string)$fields['subject'];
        if (!empty($fields['message'])) $parts[] = mb_substr((string)$fields['message'], 0, 80);
        if (empty($parts)) {
            // Fall back to the first non-empty field.
            foreach ($fields as $v) {
                if (is_scalar($v) && (string)$v !== '') { $parts[] = mb_substr((string)$v, 0, 80); break; }
            }
        }
        $summary = implode(' · ', $parts);
        return mb_strlen($summary) > 120 ? mb_substr($summary, 0, 117) . '…' : $summary;
    }
}
