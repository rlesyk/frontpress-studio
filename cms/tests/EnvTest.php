<?php

declare(strict_types=1);

use MD\Env;
use PHPUnit\Framework\TestCase;

class EnvTest extends TestCase
{
    private string $tmp;

    protected function setUp(): void
    {
        // Reset the in-memory cache between tests via reflection
        $r = new ReflectionProperty(Env::class, 'loaded');
        $r->setAccessible(true);
        $r->setValue(null, []);

        $this->tmp = tempnam(sys_get_temp_dir(), 'mdcfg_') . '.php';
    }

    protected function tearDown(): void
    {
        if (is_file($this->tmp)) {
            unlink($this->tmp);
        }
    }

    private function seedLoaded(array $values): void
    {
        $r = new ReflectionProperty(Env::class, 'loaded');
        $r->setAccessible(true);
        $r->setValue(null, $values);
    }

    public function testGetReturnsDefaultWhenKeyAbsent(): void
    {
        $this->assertSame('fallback', Env::get('MISSING', 'fallback'));
        $this->assertNull(Env::get('MISSING'));
    }

    public function testGetReturnsSeededValue(): void
    {
        $this->seedLoaded(['ADMIN_USER' => 'dev']);
        $this->assertSame('dev', Env::get('ADMIN_USER'));
    }

    public function testMissingFileIsNoOp(): void
    {
        Env::load('/nonexistent/config.php');
        $this->assertNull(Env::get('ANYTHING'));
    }

    public function testUpgradePlaintextPasswordReplacesHashAndRemovesPlaintext(): void
    {
        file_put_contents($this->tmp, <<<'PHP'
<?php
defined('MD_BOOT') || exit;
define('MD_ADMIN_USER', 'admin');
define('MD_ADMIN_PASS', 'admin');
define('MD_ADMIN_PASS_HASH', '');
define('MD_APP_ENV', 'dev');
PHP);
        $hash = '$2y$10$dummyhashvaluefortest1234567890123456789012';
        $this->assertTrue(Env::upgradePlaintextPassword($this->tmp, $hash));

        $out = (string)file_get_contents($this->tmp);
        $this->assertStringContainsString("define('MD_ADMIN_PASS_HASH', '" . addslashes($hash) . "');", $out);
        $this->assertStringNotContainsString("MD_ADMIN_PASS,", $out);
        $this->assertStringNotContainsString("'MD_ADMIN_PASS'", $out);
        $this->assertSame($hash, Env::get('ADMIN_PASS_HASH'));
        $this->assertNull(Env::get('ADMIN_PASS'));
    }

    public function testUpgradeAppendsHashWhenAbsent(): void
    {
        file_put_contents($this->tmp, <<<'PHP'
<?php
defined('MD_BOOT') || exit;
define('MD_ADMIN_USER', 'admin');
PHP);
        $hash = '$2y$10$dummyhashvaluefortest1234567890123456789012';
        $this->assertTrue(Env::upgradePlaintextPassword($this->tmp, $hash));
        $this->assertStringContainsString("define('MD_ADMIN_PASS_HASH', '" . addslashes($hash) . "');", (string)file_get_contents($this->tmp));
    }

    public function testIsPasswordDefaultTrueWhenHashVerifiesAdmin(): void
    {
        $this->seedLoaded(['ADMIN_PASS_HASH' => password_hash('admin', PASSWORD_BCRYPT)]);
        $this->assertTrue(Env::isPasswordDefault());
    }

    public function testIsPasswordDefaultFalseForOtherPassword(): void
    {
        $this->seedLoaded(['ADMIN_PASS_HASH' => password_hash('something-else', PASSWORD_BCRYPT)]);
        $this->assertFalse(Env::isPasswordDefault());
    }

    public function testIsPasswordDefaultFalseWhenHashEmpty(): void
    {
        $this->seedLoaded([]);
        $this->assertFalse(Env::isPasswordDefault());
    }
}
