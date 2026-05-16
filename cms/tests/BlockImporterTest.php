<?php

declare(strict_types=1);

use FrontPress\BlockImporter;
use PHPUnit\Framework\TestCase;

defined('FRONTPRESS_BOOT') || define('FRONTPRESS_BOOT', true);

class BlockImporterTest extends TestCase
{
    private BlockImporter $importer;

    protected function setUp(): void
    {
        $this->importer = new BlockImporter();
    }

    public function testEmptySourceProducesEmptyTree(): void
    {
        $this->assertSame([], $this->importer->importFromSource(''));
        $this->assertSame([], $this->importer->importFromSource("   \n\t  "));
    }

    public function testHeadingBecomesHeadingBlock(): void
    {
        $out = $this->importer->importFromSource('<h1>Hello world</h1>');
        $this->assertCount(1, $out);
        $this->assertSame('heading', $out[0]['type']);
        $this->assertSame('h1',      $out[0]['data']['level']);
        $this->assertSame('Hello world', $out[0]['data']['text']);
    }

    public function testParagraphBecomesParagraphBlock(): void
    {
        $out = $this->importer->importFromSource('<p>Just some text.</p>');
        $this->assertSame('paragraph', $out[0]['type']);
        $this->assertSame('Just some text.', $out[0]['data']['text']);
    }

    public function testImageBecomesImageBlock(): void
    {
        $out = $this->importer->importFromSource('<img src="/cover.jpg" alt="A cover">');
        $this->assertSame('image', $out[0]['type']);
        $this->assertSame('/cover.jpg', $out[0]['data']['src']);
        $this->assertSame('A cover',    $out[0]['data']['alt']);
    }

    public function testFigureWithImageBecomesImageBlockWithCaption(): void
    {
        $out = $this->importer->importFromSource(
            '<figure><img src="/x.png" alt="x"><figcaption>A caption</figcaption></figure>'
        );
        $this->assertSame('image',    $out[0]['type']);
        $this->assertSame('/x.png',   $out[0]['data']['src']);
        $this->assertSame('A caption',$out[0]['data']['caption']);
    }

    public function testSectionWrapsChildrenAsContainer(): void
    {
        $out = $this->importer->importFromSource(
            '<section><h2>Title</h2><p>Body.</p></section>'
        );
        $this->assertSame('section', $out[0]['type']);
        $this->assertIsArray($out[0]['children']);
        $this->assertCount(2, $out[0]['children']);
        $this->assertSame('heading',   $out[0]['children'][0]['type']);
        $this->assertSame('paragraph', $out[0]['children'][1]['type']);
    }

    public function testIdAndClassCarriedIntoBlockData(): void
    {
        $out = $this->importer->importFromSource(
            '<section id="hero" class="hero hero--dark"><h1>Yo</h1></section>'
        );
        $this->assertSame('hero',             $out[0]['data']['htmlId']);
        $this->assertSame('hero hero--dark',  $out[0]['data']['htmlClass']);
    }

    public function testTopLevelTwigBecomesCodeBlock(): void
    {
        $out = $this->importer->importFromSource(
            '{{ partial(\'header\') }}<h1>Welcome</h1>'
        );
        $this->assertSame('code', $out[0]['type']);
        $this->assertStringContainsString("partial('header')", $out[0]['data']['source']);
        $this->assertSame('heading', $out[1]['type']);
    }

    public function testUnknownElementFallsBackToCodeBlock(): void
    {
        $out = $this->importer->importFromSource('<table><tr><td>cell</td></tr></table>');
        $this->assertSame('code', $out[0]['type']);
        $this->assertStringContainsString('<table>', $out[0]['data']['source']);
    }

    public function testRealLifeMixedTwigSourceRoundTripsRecognizableShape(): void
    {
        $twig = <<<'TWIG'
{{ partial('header', { page_title: meta.title }) }}
<article>
  <h1>{{ meta.title }}</h1>
  <p>Posted {{ meta.date }}.</p>
  {{ html|raw }}
</article>
{{ partial('footer') }}
TWIG;
        $out = $this->importer->importFromSource($twig);

        // Expect: code(header), section/article(with heading + paragraph
        // + code), code(footer). Exact shape depends on element handling;
        // verify the major checkpoints.
        $types = array_map(fn ($b) => $b['type'], $out);
        $this->assertContains('code',    $types);   // partial() calls
        // The <article> isn't a section/columns/div, so it falls back to
        // a code block carrying the whole article inside it.
        $hasArticleChunk = false;
        foreach ($out as $b) {
            if ($b['type'] === 'code' && str_contains((string)($b['data']['source'] ?? ''), '<article')) {
                $hasArticleChunk = true;
                break;
            }
        }
        $this->assertTrue($hasArticleChunk, 'article should land in a code block');
    }
}
