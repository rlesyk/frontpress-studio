<?php

/**
 * FrontPress Studio — site configuration.
 *
 * Copy this file to `config.php` and edit the values. It's a PHP file so
 * accessing it directly via HTTP runs it server-side but produces no
 * output — credentials never leak. Same pattern as WordPress's
 * `wp-config.php`.
 *
 * Each constant prefers an OS environment variable when one is set. If
 * your host lets you inject env vars (Fly, Docker, CI/CD, modern PaaS,
 * or PHP-FPM `env[KEY]=val` in the pool config), set `MD_ADMIN_PASS_HASH`
 * etc. there and the on-disk fallback below is only used as a default.
 * On classic shared hosting where env injection isn't available, the
 * fallback values are what actually get used.
 */

defined('FRONTPRESS_BOOT') || exit;

// ── Admin login ───────────────────────────────────────────────────────────
define('MD_ADMIN_USER', getenv('MD_ADMIN_USER') ?: 'admin');

// Set EITHER `MD_ADMIN_PASS` (plaintext, auto-hashed on first request and
// removed from this file) OR `MD_ADMIN_PASS_HASH` (a bcrypt hash you
// generated yourself with `php -r "echo password_hash('mypass', PASSWORD_BCRYPT);"`).
//
// `MD_ADMIN_PASS_HASH` wins if both are set.
define('MD_ADMIN_PASS',      getenv('MD_ADMIN_PASS')      ?: 'admin');
define('MD_ADMIN_PASS_HASH', getenv('MD_ADMIN_PASS_HASH') ?: '');

// ── Runtime ───────────────────────────────────────────────────────────────

// `dev` (default) auto-compiles a theme's SCSS on every public-site request
// whenever a source file is newer than its CSS. Set to `prod` on a deployed
// host to skip the freshness check entirely.
define('MD_APP_ENV', getenv('MD_APP_ENV') ?: 'dev');

// Show admin API exception messages to the client. Defaults off — exceptions
// are written to the PHP error log and the client sees a generic message.
define('MD_APP_DEBUG', getenv('MD_APP_DEBUG') ?: '0');

// Idle-timeout for admin sessions (seconds). 0 disables the idle check.
define('MD_SESSION_IDLE_SECONDS', getenv('MD_SESSION_IDLE_SECONDS') ?: '7200');
