<?php

declare(strict_types=1);

use FrontPress\RateLimiter;
use PHPUnit\Framework\TestCase;

/**
 * `RateLimiter` exposes a `now()` hook for clock injection in tests.
 * The subclass overrides it so we can advance time without sleeping.
 */
class FakeClockRateLimiter extends RateLimiter
{
    public int $clock = 0;
    protected function now(): int { return $this->clock; }
}

class RateLimiterTest extends TestCase
{
    private string $file;

    protected function setUp(): void
    {
        $this->file = sys_get_temp_dir() . '/fp_rl_' . bin2hex(random_bytes(4)) . '.json';
    }

    protected function tearDown(): void
    {
        @unlink($this->file);
    }

    public function testAllowsUpToMaxThenDenies(): void
    {
        $rl = new FakeClockRateLimiter($this->file);
        $rl->clock = 1000;

        $this->assertTrue($rl->check('a', 3, 60));
        $this->assertTrue($rl->check('a', 3, 60));
        $this->assertTrue($rl->check('a', 3, 60));
        $this->assertFalse($rl->check('a', 3, 60), '4th should be denied');
        $this->assertFalse($rl->check('a', 3, 60), '5th should still be denied');
    }

    public function testWindowSlides(): void
    {
        $rl = new FakeClockRateLimiter($this->file);

        $rl->clock = 0;
        $this->assertTrue($rl->check('a', 2, 60));
        $rl->clock = 30;
        $this->assertTrue($rl->check('a', 2, 60));
        $rl->clock = 31;
        $this->assertFalse($rl->check('a', 2, 60), 'still inside the window');

        // Jump past the first hit's window; the oldest entry drops out.
        $rl->clock = 65;
        $this->assertTrue($rl->check('a', 2, 60), 'first hit aged out');
    }

    public function testKeysAreIsolated(): void
    {
        $rl = new FakeClockRateLimiter($this->file);
        $rl->clock = 100;
        $this->assertTrue($rl->check('a', 1, 60));
        $this->assertFalse($rl->check('a', 1, 60));
        // Different key — independent budget.
        $this->assertTrue($rl->check('b', 1, 60));
    }
}
