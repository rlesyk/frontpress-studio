<?php

declare(strict_types=1);

namespace FrontPress\Api;

defined('FRONTPRESS_BOOT') || exit;

/**
 * Email-related admin endpoints. Currently just:
 *
 *   POST /admin/api/email/test  { to } → tries to send a test message.
 *
 * Uses the same Mailer::send() path as real form submissions, so a
 * green test guarantees the contact form will also deliver. Returns
 * the verbatim SMTP error on failure so the admin UI can surface
 * actionable diagnostics ("AUTH LOGIN failed: 535 5.7.8 …") rather
 * than a generic "send failed" message.
 */
class EmailController
{
    /**
     * @param string[]             $pathParts
     * @param array<string, mixed> $config
     */
    public static function handle(array $pathParts, string $method, array $config): void
    {
        Router::requireAuth();
        Router::requireCsrf();

        $action = $pathParts[0] ?? '';
        if ($method !== 'POST' || $action !== 'test') {
            \json_response(['ok' => false, 'error' => 'Method not allowed'], 405);
        }

        $body = Router::jsonBody();
        $to   = trim((string)($body['to'] ?? ''));
        if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
            \json_response(['ok' => false, 'error' => 'Recipient is not a valid email address.'], 400);
        }

        $mailer = ServiceFactory::mailer($config);
        if (!$mailer->isConfigured()) {
            \json_response([
                'ok'    => false,
                'error' => 'SMTP is not configured — fill in the host/port/user/password first and save.',
            ], 400);
        }

        $subject = 'FrontPress test email';
        $bodyTxt = "If you're reading this, SMTP works.\n\nSent " . date(\DATE_ATOM);
        $res     = $mailer->send($to, $subject, $bodyTxt);

        ServiceFactory::audit($config)->record('email.test', $to, [
            'ok'        => $res['ok'],
            'transport' => $res['transport'],
        ]);

        \json_response($res, $res['ok'] ? 200 : 502);
    }
}
