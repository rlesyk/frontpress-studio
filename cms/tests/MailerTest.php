<?php

declare(strict_types=1);

use FrontPress\Mailer;
use PHPUnit\Framework\TestCase;

class MailerTest extends TestCase
{
    public function testIsConfiguredFalseWithEmptyHost(): void
    {
        $this->assertFalse((new Mailer([]))->isConfigured());
        $this->assertFalse((new Mailer(['smtp_host' => '']))->isConfigured());
    }

    public function testIsConfiguredTrueWithHost(): void
    {
        $this->assertTrue((new Mailer(['smtp_host' => 'smtp.example.com']))->isConfigured());
    }

    /**
     * Without SMTP configured AND no MTA on the test runner, mail() will
     * return false. The Mailer should surface that as ok=false instead of
     * crashing.
     */
    public function testFallbackReturnsErrorWhenMailFails(): void
    {
        $m = new Mailer([
            'from_address' => 'noreply@example.com',
            'from_name'    => 'Test',
        ]);
        // We can't reliably make mail() succeed in CI; what we *can* assert
        // is that the result has the right shape regardless of outcome.
        $res = @$m->send('nobody@example.invalid', 'Subject', 'Body');
        $this->assertSame('mail', $res['transport']);
        $this->assertArrayHasKey('ok', $res);
        if ($res['ok'] === false) {
            $this->assertArrayHasKey('error', $res);
        }
    }

    public function testSmtpFailureNoFallbackReturnsSmtpError(): void
    {
        // Unreachable port so SmtpTransport throws ConnectionRefused fast.
        $m = new Mailer([
            'smtp_host'        => '127.0.0.1',
            'smtp_port'        => 1,           // closed in any sane env
            'smtp_encryption'  => 'none',
            'from_address'     => 'noreply@example.com',
            'from_name'        => 'Test',
            'fallback_to_mail' => false,
        ]);
        $res = $m->send('nobody@example.invalid', 'Subject', 'Body');
        $this->assertFalse($res['ok']);
        $this->assertSame('smtp', $res['transport']);
        $this->assertArrayHasKey('error', $res);
        $this->assertNotSame('', $res['error']);
    }

    public function testReplyToOnlyIncludedWhenValid(): void
    {
        // Use reflection to inspect the assembled headers without sending.
        $m = new Mailer([]);
        $r = new ReflectionClass(Mailer::class);
        $build = $r->getMethod('buildHeaders');
        $build->setAccessible(true);

        $withReply = $build->invoke(null, 'a@b.com', 'A', 'c@d.com', 'Hi', 'a@b.com');
        $this->assertStringContainsString('Reply-To: <a@b.com>', $withReply);

        $noReply = $build->invoke(null, 'a@b.com', 'A', 'c@d.com', 'Hi', null);
        $this->assertStringNotContainsString('Reply-To:', $noReply);

        $invalidReply = $build->invoke(null, 'a@b.com', 'A', 'c@d.com', 'Hi', 'not-an-email');
        $this->assertStringNotContainsString('Reply-To:', $invalidReply);
    }
}
