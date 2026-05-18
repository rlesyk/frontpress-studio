<?php

declare(strict_types=1);

use FrontPress\SubmissionStore;
use PHPUnit\Framework\TestCase;

class SubmissionStoreTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/fp_subs_' . bin2hex(random_bytes(4));
        mkdir($this->root, 0755, true);
    }

    protected function tearDown(): void
    {
        $this->rrm($this->root);
    }

    public function testSaveFindRoundTrip(): void
    {
        $store = new SubmissionStore($this->root);
        $id = $store->save('contact',
            ['name' => 'Marko', 'email' => 'a@b.com', 'message' => 'Hi'],
            ['ip' => '127.0.0.1', 'ua' => 'phpunit', 'email' => ['ok' => true, 'transport' => 'smtp']],
        );

        $this->assertMatchesRegularExpression(
            '#^contact/\d{4}-\d{2}/\d{8}T\d{4}_[a-f0-9]{4}$#',
            $id,
        );

        $row = $store->find($id);
        $this->assertNotNull($row);
        $this->assertSame('Marko', $row['fields']['name']);
        $this->assertSame('a@b.com', $row['fields']['email']);
        $this->assertSame('127.0.0.1', $row['ip']);
        $this->assertSame('smtp', $row['email']['transport']);
    }

    public function testListNewestFirst(): void
    {
        $store = new SubmissionStore($this->root);
        $store->save('contact', ['name' => 'first']);
        usleep(1100); // ensure a different randhex
        $second = $store->save('contact', ['name' => 'second']);

        $list = $store->list('contact', 50, 0);
        $this->assertNotEmpty($list);
        $this->assertSame($second, $list[0]['id']);
    }

    public function testFindRejectsTraversal(): void
    {
        $store = new SubmissionStore($this->root);
        $this->assertNull($store->find('../etc/passwd'));
        $this->assertNull($store->find('contact/2026-05/../../etc/passwd'));
        $this->assertNull($store->find('not-an-id'));
    }

    public function testDeleteRemovesFile(): void
    {
        $store = new SubmissionStore($this->root);
        $id    = $store->save('contact', ['name' => 'gone']);
        $this->assertNotNull($store->find($id));
        $this->assertTrue($store->delete($id));
        $this->assertNull($store->find($id));
        // Idempotent — a second delete returns false but doesn't throw.
        $this->assertFalse($store->delete($id));
    }

    public function testCountPerForm(): void
    {
        $store = new SubmissionStore($this->root);
        $store->save('contact', ['x' => 1]);
        $store->save('contact', ['x' => 2]);
        $store->save('newsletter', ['x' => 3]);

        $this->assertSame(2, $store->count('contact'));
        $this->assertSame(1, $store->count('newsletter'));
        $this->assertSame(3, $store->count(null));
    }

    private function rrm(string $path): void
    {
        if (!is_dir($path)) return;
        $it = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST,
        );
        foreach ($it as $f) {
            $f->isDir() ? rmdir($f->getPathname()) : unlink($f->getPathname());
        }
        rmdir($path);
    }
}
