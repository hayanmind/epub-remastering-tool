/**
 * HTML / XHTML Content Parser
 *
 * Parses individual chapter HTML/XHTML files and classifies the content
 * into structured ContentElement objects (headings, paragraphs, images, etc.).
 */

import { parseDocument } from 'htmlparser2';
import * as domutils from 'domutils';
import type { Element, Node } from 'domhandler';
import type { ContentElement, ContentElementType } from '../types.js';

// ---------------------------------------------------------------------------
// Tag → Element type classification
// ---------------------------------------------------------------------------

const HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
const PARAGRAPH_TAGS = new Set(['p', 'blockquote', 'pre', 'address']);
const LIST_TAGS = new Set(['ul', 'ol', 'dl']);
const TABLE_TAGS = new Set(['table']);
const IMAGE_TAGS = new Set(['img', 'svg', 'picture']);
const CAPTION_TAGS = new Set(['figcaption', 'caption']);

function classifyTag(tagName: string): ContentElementType {
  const lower = tagName.toLowerCase();
  if (HEADING_TAGS.has(lower)) return 'heading';
  if (PARAGRAPH_TAGS.has(lower)) return 'paragraph';
  if (IMAGE_TAGS.has(lower)) return 'image';
  if (CAPTION_TAGS.has(lower)) return 'caption';
  if (LIST_TAGS.has(lower)) return 'list';
  if (TABLE_TAGS.has(lower)) return 'table';
  return 'unknown';
}

// ---------------------------------------------------------------------------
// Attribute extraction
// ---------------------------------------------------------------------------

function extractAttributes(el: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const [key, value] of Object.entries(el.attribs)) {
    attrs[key] = value;
  }
  return attrs;
}

// ---------------------------------------------------------------------------
// Recursive element extraction
// ---------------------------------------------------------------------------

/**
 * Tags that are structural containers we descend into but do not emit
 * as their own ContentElement.
 */
const CONTAINER_TAGS = new Set([
  'div', 'span', 'section', 'article', 'aside', 'main', 'header',
  'footer', 'nav', 'figure', 'details', 'summary', 'a', 'em',
  'strong', 'b', 'i', 'u', 'sup', 'sub', 'small', 'mark', 'abbr',
  'cite', 'code', 'kbd', 'samp', 'var', 'ruby', 'rt', 'rp',
]);

/**
 * Tags whose children should be collected as structured child elements,
 * rather than flattened text.
 */
const STRUCTURED_PARENTS = new Set([
  'figure', 'ul', 'ol', 'dl', 'table', 'thead', 'tbody', 'tfoot', 'tr',
]);

/**
 * Recursively extract ContentElements from a DOM node.
 */
function extractElements(node: Node): ContentElement[] {
  if (node.type === 'text') {
    const text = (node as unknown as { data: string }).data.trim();
    if (text) {
      return [
        {
          type: 'paragraph',
          tag: '#text',
          content: text,
          attributes: {},
          children: [],
        },
      ];
    }
    return [];
  }

  if (node.type !== 'tag') return [];

  const el = node as Element;
  const tag = el.name.toLowerCase();
  const elementType = classifyTag(tag);

  // Skip non-content tags
  if (['script', 'style', 'link', 'meta', 'head', 'html'].includes(tag)) {
    return [];
  }

  // For <body>, just recurse into children
  if (tag === 'body') {
    const results: ContentElement[] = [];
    for (const child of el.children) {
      results.push(...extractElements(child));
    }
    return results;
  }

  // For known content element types, emit them
  if (elementType !== 'unknown' || !CONTAINER_TAGS.has(tag)) {
    if (STRUCTURED_PARENTS.has(tag)) {
      // Recurse children as structured sub-elements
      const children: ContentElement[] = [];
      for (const child of el.children) {
        children.push(...extractElements(child));
      }
      return [
        {
          type: elementType,
          tag,
          content: domutils.textContent(el).trim(),
          attributes: extractAttributes(el),
          children,
        },
      ];
    }

    // Leaf-like content element
    return [
      {
        type: elementType,
        tag,
        content: domutils.textContent(el).trim(),
        attributes: extractAttributes(el),
        children: [],
      },
    ];
  }

  // Container tags: recurse into children, flattening results
  const results: ContentElement[] = [];
  for (const child of el.children) {
    results.push(...extractElements(child));
  }
  return results;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse an HTML/XHTML string and extract structured content elements.
 *
 * @param html - Raw HTML/XHTML string of a chapter
 * @returns Array of classified ContentElement objects
 */
export function parseHtmlContent(html: string): ContentElement[] {
  const doc = parseDocument(html, { xmlMode: false });

  // Find <body> or use root
  const body = domutils.findOne(
    (node) => node.type === 'tag' && node.name.toLowerCase() === 'body',
    doc.children,
    true,
  );

  const root = body ?? doc;
  const elements: ContentElement[] = [];

  for (const child of root.children) {
    elements.push(...extractElements(child));
  }

  return elements;
}

/**
 * Extract the title from an HTML document (from <title> tag or first heading).
 */
export function extractTitle(html: string): string {
  const doc = parseDocument(html, { xmlMode: false });

  // Try <title>
  const titleEl = domutils.findOne(
    (node) => node.type === 'tag' && node.name.toLowerCase() === 'title',
    doc.children,
    true,
  );
  if (titleEl) {
    const text = domutils.textContent(titleEl).trim();
    if (text) return text;
  }

  // Fallback: first heading
  const heading = domutils.findOne(
    (node) => node.type === 'tag' && HEADING_TAGS.has(node.name.toLowerCase()),
    doc.children,
    true,
  );
  if (heading) {
    return domutils.textContent(heading).trim();
  }

  return '';
}
