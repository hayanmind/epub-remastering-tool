/**
 * OPF (Open Packaging Format) Parser
 *
 * Parses ePub 2.0 content.opf files to extract:
 * - Dublin Core metadata (title, author, language, etc.)
 * - Manifest (list of all resources)
 * - Spine (reading order)
 */

import { parseDocument } from 'htmlparser2';
import * as domutils from 'domutils';
import type { Document, Element } from 'domhandler';
import type { EpubMetadata, ManifestItem, SpineItem, OpfData } from '../types.js';

/**
 * Return the text content of the *first* element matching the given tag name,
 * searching case-insensitively (OPF files may use dc:title or DC:Title).
 */
function textOf(doc: Document, tagName: string): string {
  const lower = tagName.toLowerCase();
  const el = domutils.findOne(
    (node) => node.type === 'tag' && node.name.toLowerCase() === lower,
    doc.children,
    true,
  );
  return el ? domutils.textContent(el).trim() : '';
}

/**
 * Find all elements matching a tag name (case-insensitive).
 */
function findAllByTag(doc: Document, tagName: string): Element[] {
  const lower = tagName.toLowerCase();
  return domutils.findAll(
    (node) => node.type === 'tag' && node.name.toLowerCase() === lower,
    doc.children,
  );
}

/**
 * Get an attribute value from an element, trying common namespace prefixes.
 */
function attr(el: Element, name: string): string {
  return (
    el.attribs[name] ??
    el.attribs[`opf:${name}`] ??
    el.attribs[`OPF:${name}`] ??
    ''
  );
}

/**
 * Extract metadata from the <metadata> section of the OPF.
 */
function parseMetadata(doc: Document): EpubMetadata {
  const extra: Record<string, string> = {};

  // Collect all <meta> tags for additional metadata
  const metas = findAllByTag(doc, 'meta');
  for (const meta of metas) {
    const name = meta.attribs['name'] ?? meta.attribs['property'] ?? '';
    const content = meta.attribs['content'] ?? domutils.textContent(meta).trim();
    if (name && content) {
      extra[name] = content;

      // ePub 2.0 cover image detection via <meta name="cover" content="img-id">
      if (name === 'cover') {
        extra['__coverId'] = content;
      }
    }
  }

  // Identifier / ISBN
  const identifiers = findAllByTag(doc, 'dc:identifier');
  let isbn = '';
  for (const id of identifiers) {
    const scheme = attr(id, 'scheme').toLowerCase();
    const text = domutils.textContent(id).trim();
    if (scheme === 'isbn' || /^(97[89])/.test(text.replace(/-/g, ''))) {
      isbn = text;
      break;
    }
    if (!isbn) isbn = text; // fallback to first identifier
  }

  // Cover image href – resolve later against manifest
  const coverImage = extra['__coverId'] ?? '';

  return {
    title: textOf(doc, 'dc:title') || 'Untitled',
    author: textOf(doc, 'dc:creator'),
    language: textOf(doc, 'dc:language') || 'ko',
    publisher: textOf(doc, 'dc:publisher'),
    date: textOf(doc, 'dc:date'),
    isbn,
    description: textOf(doc, 'dc:description'),
    coverImage,
    extra,
  };
}

/**
 * Parse the <manifest> section into an array of ManifestItems.
 */
function parseManifest(doc: Document): ManifestItem[] {
  const items: ManifestItem[] = [];
  const itemEls = findAllByTag(doc, 'item');

  for (const el of itemEls) {
    const id = el.attribs['id'] ?? '';
    const href = el.attribs['href'] ?? '';
    const mediaType = el.attribs['media-type'] ?? '';
    const properties = el.attribs['properties'] ?? '';

    if (id && href) {
      items.push({ id, href, mediaType, properties: properties || undefined });
    }
  }

  return items;
}

/**
 * Parse the <spine> section into an ordered array of SpineItems.
 */
function parseSpine(doc: Document): { items: SpineItem[]; tocId: string } {
  const spineEl = domutils.findOne(
    (node) => node.type === 'tag' && node.name.toLowerCase() === 'spine',
    doc.children,
    true,
  );

  const tocId = spineEl?.attribs?.['toc'] ?? '';
  const items: SpineItem[] = [];

  if (spineEl) {
    const itemrefs = domutils.findAll(
      (node) => node.type === 'tag' && node.name.toLowerCase() === 'itemref',
      spineEl.children,
    );

    for (const ref of itemrefs) {
      const idref = ref.attribs['idref'] ?? '';
      const linear = (ref.attribs['linear'] ?? 'yes').toLowerCase() !== 'no';
      if (idref) {
        items.push({ idref, linear });
      }
    }
  }

  return { items, tocId };
}

/**
 * Resolve the cover image href from the manifest.
 * The OPF may store a manifest item id in <meta name="cover">.
 */
function resolveCoverImage(metadata: EpubMetadata, manifest: ManifestItem[]): string {
  const coverId = metadata.coverImage;
  if (!coverId) return '';

  // Try to find a manifest item whose id matches the cover meta content
  const coverItem = manifest.find((item) => item.id === coverId);
  if (coverItem) return coverItem.href;

  // Also check for items with properties="cover-image" (ePub 3 style in 2.0 files)
  const propItem = manifest.find((item) => item.properties?.includes('cover-image'));
  if (propItem) return propItem.href;

  return coverId; // Return as-is if nothing resolved
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse an OPF XML string and return structured data.
 *
 * @param opfXml  - The raw OPF XML string
 * @param opfDir  - Directory path of the OPF file relative to the epub root
 */
export function parseOpf(opfXml: string, opfDir: string): OpfData {
  const doc = parseDocument(opfXml, { xmlMode: true });

  const metadata = parseMetadata(doc);
  const manifest = parseManifest(doc);
  const { items: spine, tocId } = parseSpine(doc);

  // Resolve cover image href from manifest
  metadata.coverImage = resolveCoverImage(metadata, manifest);

  return {
    metadata,
    manifest,
    spine,
    tocId,
    opfDir,
  };
}
