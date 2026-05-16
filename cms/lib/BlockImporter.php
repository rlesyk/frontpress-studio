<?php

declare(strict_types=1);

namespace FrontPress;

defined('FRONTPRESS_BOOT') || exit;

/**
 * One-way converter: Twig/HTML/PHP source → block tree.
 *
 * The visual builder owns JSON; existing template files don't. This
 * importer parses the source's HTML structure, recognizes elements we
 * have first-class blocks for (heading, paragraph, image, section,
 * columns) and turns the rest into Code blocks carrying the original
 * source verbatim. The Twig control-flow round-trip problem is sidestepped
 * by preserving anything we can't safely model.
 *
 * Conversion is lossy in one direction only: the produced .fp.json
 * doesn't claim to be equivalent to the original .twig. Inspect the
 * result, tweak in the visual builder, save. The original .twig is
 * never touched.
 *
 * Twig tags ({% %}, {{ }}) inside HTML elements are preserved as part of
 * the element's text content. When they're top-level (between sibling
 * HTML elements) they land in their own Code block.
 */
final class BlockImporter
{
    /**
     * Convert source text to a list of block instances. Returns a flat-
     * or nested-tree shape suitable for `{ "blocks": [...] }`.
     *
     * @return list<array<string, mixed>>
     */
    public function importFromSource(string $source): array
    {
        $source = trim($source);
        if ($source === '') return [];

        // DOMDocument needs a wrapping element to anchor the parse and
        // wants UTF-8 declared. Use loadHTML with flags that suppress
        // warnings (we're parsing user content, not validating it).
        $wrapped = '<?xml encoding="UTF-8"?><div id="__fp_root">' . $source . '</div>';
        $doc = new \DOMDocument();
        $prev = libxml_use_internal_errors(true);
        $doc->loadHTML($wrapped, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD | LIBXML_NOERROR);
        libxml_clear_errors();
        libxml_use_internal_errors($prev);

        $root = $doc->getElementById('__fp_root');
        if (!$root) return [['type' => 'code', 'data' => ['source' => $source]]];

        return $this->walkChildren($root);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function walkChildren(\DOMNode $parent): array
    {
        $out = [];
        $textBuffer = '';

        foreach ($parent->childNodes as $node) {
            if ($node instanceof \DOMText) {
                $textBuffer .= $node->wholeText;
                continue;
            }

            // Flush accumulated text — if it contains Twig tags, turn it
            // into a Code block. Whitespace-only buffers are discarded.
            if ($textBuffer !== '') {
                $b = $this->textToBlock($textBuffer);
                if ($b !== null) $out[] = $b;
                $textBuffer = '';
            }

            if (!($node instanceof \DOMElement)) continue;

            $block = $this->elementToBlock($node);
            if ($block !== null) $out[] = $block;
        }

        // Flush trailing text.
        if ($textBuffer !== '') {
            $b = $this->textToBlock($textBuffer);
            if ($b !== null) $out[] = $b;
        }

        return $out;
    }

    /** @return array<string, mixed>|null */
    private function textToBlock(string $text): ?array
    {
        $trim = trim($text);
        if ($trim === '') return null;
        if (str_contains($trim, '{{') || str_contains($trim, '{%')) {
            return ['type' => 'code', 'data' => ['source' => $trim]];
        }
        // Bare text between elements becomes a paragraph — close enough.
        return ['type' => 'paragraph', 'data' => ['text' => $trim, 'align' => 'left']];
    }

    /**
     * Map a DOM element to a block. Elements we don't know how to
     * represent fall back to a Code block carrying the verbatim outer
     * HTML so the user can still see and edit the content.
     *
     * @return array<string, mixed>|null
     */
    private function elementToBlock(\DOMElement $el): ?array
    {
        $tag = strtolower($el->tagName);
        $id  = trim((string)$el->getAttribute('id'));
        $cls = trim((string)$el->getAttribute('class'));
        $attrs = ['htmlId' => $id, 'htmlClass' => $cls];

        // Skip empty wrappers entirely.
        if ($tag === 'div' && !$el->hasChildNodes()) return null;

        if (in_array($tag, ['h1','h2','h3','h4','h5','h6'], true)) {
            return [
                'type' => 'heading',
                'data' => array_merge($attrs, [
                    'level' => $tag,
                    'text'  => trim($el->textContent),
                    'align' => 'left',
                ]),
            ];
        }

        if ($tag === 'p') {
            return [
                'type' => 'paragraph',
                'data' => array_merge($attrs, [
                    'text'  => $this->innerSource($el),
                    'align' => 'left',
                ]),
            ];
        }

        if ($tag === 'img') {
            return [
                'type' => 'image',
                'data' => array_merge($attrs, [
                    'src'     => (string)$el->getAttribute('src'),
                    'alt'     => (string)$el->getAttribute('alt'),
                    'caption' => '',
                    'width'   => 'full',
                ]),
            ];
        }

        if ($tag === 'figure' && $el->getElementsByTagName('img')->length > 0) {
            /** @var \DOMElement|null $img */
            $img = $el->getElementsByTagName('img')->item(0);
            $cap = $el->getElementsByTagName('figcaption')->item(0);
            $caption = $cap instanceof \DOMNode ? trim($cap->textContent) : '';
            return [
                'type' => 'image',
                'data' => array_merge($attrs, [
                    'src'     => $img ? (string)$img->getAttribute('src') : '',
                    'alt'     => $img ? (string)$img->getAttribute('alt') : '',
                    'caption' => $caption,
                    'width'   => 'full',
                ]),
            ];
        }

        if ($tag === 'section') {
            return [
                'type'     => 'section',
                'data'     => array_merge($attrs, [
                    'padding'  => 'md',
                    'maxWidth' => 'full',
                ]),
                'children' => $this->walkChildren($el),
            ];
        }

        // <div> is ambiguous: if it has multiple block-like children
        // arranged in columns, you'd want `columns`; otherwise treat it
        // as a `section`. The smart-detect is hard to get right; default
        // to section to preserve nesting.
        if ($tag === 'div') {
            return [
                'type'     => 'section',
                'data'     => array_merge($attrs, [
                    'padding'  => 'none',
                    'maxWidth' => 'full',
                ]),
                'children' => $this->walkChildren($el),
            ];
        }

        // Everything else: code block with the verbatim outer HTML.
        return [
            'type' => 'code',
            'data' => ['source' => $this->outerSource($el)],
        ];
    }

    /** outerHTML for a node, including any Twig tags in attributes. */
    private function outerSource(\DOMElement $el): string
    {
        $html = $el->ownerDocument?->saveHTML($el) ?? '';
        return trim($html);
    }

    private function innerSource(\DOMElement $el): string
    {
        $html = '';
        foreach ($el->childNodes as $n) {
            $html .= $el->ownerDocument?->saveHTML($n) ?? '';
        }
        return trim($html);
    }
}
