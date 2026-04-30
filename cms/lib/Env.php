<?php

declare(strict_types=1);

namespace MD;

class Env
{
    /** @var array<string, string> */
    private static array $loaded = [];

    public static function load(string $file): void
    {
        if (!is_file($file)) {
            return;
        }
        foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            if (!str_contains($line, '=')) {
                continue;
            }
            [$k, $v] = explode('=', $line, 2);
            $k       = trim($k);
            $v       = trim($v);
            // Strip surrounding quotes if present
            if ((str_starts_with($v, '"') && str_ends_with($v, '"')) || (str_starts_with($v, "'") && str_ends_with($v, "'"))) {
                $v = substr($v, 1, -1);
            }
            self::$loaded[$k] = $v;
        }
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        return self::$loaded[$key] ?? $default;
    }

    /**
     * Replace the plaintext `ADMIN_PASS=` line in .env with a hashed
     * `ADMIN_PASS_HASH=`. Used by the admin shell on first request when a
     * fresh install was unzipped with the friendly default `.env.example`
     * (`ADMIN_PASS=admin`).
     *
     * The plaintext is removed from disk; subsequent requests see only the
     * hash. The atomic-write guarantees readers never see a half-rewritten
     * file. Returns true on success — caller can decide whether a failure
     * (read-only .env, etc.) is fatal or just a warning.
     */
    public static function upgradePlaintextPassword(string $file, string $hash): bool
    {
        if (!is_file($file)) {
            return false;
        }

        $lines  = file($file, FILE_IGNORE_NEW_LINES) ?: [];
        $out    = [];
        $hashed = false;

        foreach ($lines as $line) {
            $trim = trim($line);

            // Drop the plaintext line entirely.
            if (preg_match('/^ADMIN_PASS\s*=/', $trim)) {
                continue;
            }

            // Replace an existing (empty) hash line in place to keep ordering.
            if (preg_match('/^ADMIN_PASS_HASH\s*=/', $trim)) {
                $out[]  = 'ADMIN_PASS_HASH=' . $hash;
                $hashed = true;
                continue;
            }

            $out[] = $line;
        }

        // Nothing existing to replace — append at the end.
        if (!$hashed) {
            $out[] = 'ADMIN_PASS_HASH=' . $hash;
        }

        $contents = implode("\n", $out);
        if (!str_ends_with($contents, "\n")) {
            $contents .= "\n";
        }

        // Reflect the change in the in-memory cache so the current request
        // sees the new hash without re-reading the file.
        self::$loaded['ADMIN_PASS_HASH'] = $hash;
        unset(self::$loaded['ADMIN_PASS']);

        return Fs::atomicWrite($file, $contents);
    }
}
