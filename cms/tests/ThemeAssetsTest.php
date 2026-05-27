<?php

declare(strict_types=1);

use FrontPress\ThemeAssets;
use PHPUnit\Framework\TestCase;

class CopyOnlyThemeAssets extends ThemeAssets
{
    protected function createSymlink(string $target, string $link): bool
    {
        return false;
    }
}

class ThemeAssetsTest extends TestCase
{
    private string $appRoot;
    private CopyOnlyThemeAssets $assets;

    protected function setUp(): void
    {
        $this->appRoot = sys_get_temp_dir() . '/fp_theme_assets_' . uniqid();
        mkdir($this->appRoot . '/site/themes/default/assets/css', 0755, true);
        file_put_contents($this->appRoot . '/site/themes/default/assets/css/style.css', 'body{color:#111;}');
        $this->assets = new CopyOnlyThemeAssets($this->appRoot, $this->appRoot . '/site/themes');
    }

    protected function tearDown(): void
    {
        $this->removeDir($this->appRoot);
    }

    public function testRelinkFallsBackToCopiedAssetsWhenSymlinkUnavailable(): void
    {
        $result = $this->assets->relink('default');

        $this->assertTrue($result['ok']);
        $this->assertFalse(is_link($this->appRoot . '/assets'));
        $this->assertSame('default', trim((string)file_get_contents($this->appRoot . '/assets/.fp-theme')));
        $this->assertSame('body{color:#111;}', file_get_contents($this->appRoot . '/assets/css/style.css'));
        $this->assertTrue($this->assets->ensure('default'));
    }

    public function testRefreshUpdatesCopiedAssetsMirror(): void
    {
        $this->assertTrue($this->assets->relink('default')['ok']);
        file_put_contents($this->appRoot . '/site/themes/default/assets/css/style.css', 'body{color:#222;}');

        $this->assets->refresh('default');

        $this->assertSame('body{color:#222;}', file_get_contents($this->appRoot . '/assets/css/style.css'));
    }

    private function removeDir(string $dir): void
    {
        if (!is_dir($dir) && !is_link($dir)) return;
        if (is_link($dir)) {
            unlink($dir);
            return;
        }
        $iter = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST,
        );
        foreach ($iter as $item) {
            $item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname());
        }
        rmdir($dir);
    }
}
