/**
 * OPF 3.0 Generator
 *
 * Generates the package.opf file for ePub 3.0 conforming to
 * the EPUB 3.2 specification, including:
 *   - Dublin Core metadata with DCMI refinements
 *   - Accessibility metadata (schema.org)
 *   - Manifest with media-type declarations
 *   - Spine reading order
 */

import { v4 as uuidv4 } from 'uuid';
import type { EpubMetadata, Chapter, Resource } from '../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Determine a safe filename for a chapter based on its href or index.
 */
function chapterFilename(chapter: Chapter, index: number): string {
  // Use the original href basename if available
  const base = chapter.href.split('/').pop() ?? '';
  if (base) {
    // Ensure it ends with .xhtml
    return base.replace(/\.(x?html?|xml)$/i, '.xhtml');
  }
  return `chapter-${String(index + 1).padStart(3, '0')}.xhtml`;
}

// ---------------------------------------------------------------------------
// Media type detection
// ---------------------------------------------------------------------------

function inferMediaType(href: string, declaredType?: string): string {
  if (declaredType) return declaredType;

  const ext = href.split('.').pop()?.toLowerCase() ?? '';
  const mediaTypes: Record<string, string> = {
    xhtml: 'application/xhtml+xml',
    html: 'application/xhtml+xml',
    htm: 'application/xhtml+xml',
    css: 'text/css',
    js: 'application/javascript',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    m4a: 'audio/mp4',
    ogg: 'audio/ogg',
    woff: 'font/woff',
    woff2: 'font/woff2',
    ttf: 'font/ttf',
    otf: 'font/otf',
    smil: 'application/smil+xml',
    ncx: 'application/x-dtbncx+xml',
    json: 'application/json',
  };

  return mediaTypes[ext] ?? 'application/octet-stream';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface Opf3ManifestEntry {
  id: string;
  href: string;
  mediaType: string;
  properties?: string;
}

export interface Opf3Options {
  metadata: EpubMetadata;
  chapters: Chapter[];
  resources: Resource[];
  hasCover: boolean;
  coverImageHref?: string;
  navId?: string;
}

/**
 * Generate a complete OPF 3.0 XML string.
 */
export function generateOpf3(options: Opf3Options): string {
  const {
    metadata,
    chapters,
    resources,
    hasCover,
    coverImageHref,
    navId = 'nav',
  } = options;

  const bookId = metadata.isbn || `urn:uuid:${uuidv4()}`;
  const modifiedDate = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  // Build manifest entries
  const manifestEntries: Opf3ManifestEntry[] = [];

  // Nav document
  manifestEntries.push({
    id: navId,
    href: 'Text/nav.xhtml',
    mediaType: 'application/xhtml+xml',
    properties: 'nav',
  });

  // Cover page (if cover image exists)
  if (hasCover) {
    manifestEntries.push({
      id: 'cover-page',
      href: 'Text/cover.xhtml',
      mediaType: 'application/xhtml+xml',
    });
  }

  // Cover image
  if (coverImageHref) {
    manifestEntries.push({
      id: 'cover-image',
      href: coverImageHref,
      mediaType: inferMediaType(coverImageHref),
      properties: 'cover-image',
    });
  }

  // Stylesheet
  manifestEntries.push({
    id: 'stylesheet',
    href: 'Styles/stylesheet.css',
    mediaType: 'text/css',
  });

  // Chapters
  const chapterIds: string[] = [];
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const id = `chapter-${String(i + 1).padStart(3, '0')}`;
    const filename = chapterFilename(chapter, i);
    chapterIds.push(id);

    manifestEntries.push({
      id,
      href: `Text/${filename}`,
      mediaType: 'application/xhtml+xml',
    });
  }

  // Resources (images, fonts, audio, etc.)
  const usedIds = new Set(manifestEntries.map((e) => e.id));
  for (const res of resources) {
    // Skip items already added (CSS, NCX, etc.)
    if (res.mediaType === 'application/x-dtbncx+xml') continue;
    if (res.mediaType === 'text/css') continue;

    // Skip if this is the cover image already added
    if (coverImageHref && res.href === coverImageHref) continue;

    let id = res.id;
    if (usedIds.has(id)) {
      id = `res-${id}`;
    }
    usedIds.add(id);

    manifestEntries.push({
      id,
      href: res.href.startsWith('Images/') || res.href.startsWith('Fonts/') || res.href.startsWith('Audio/')
        ? res.href
        : `Images/${res.href.split('/').pop() ?? res.href}`,
      mediaType: inferMediaType(res.href, res.mediaType),
    });
  }

  // Build spine
  const spineItems: string[] = [];
  if (hasCover) {
    spineItems.push('cover-page');
  }
  for (const id of chapterIds) {
    spineItems.push(id);
  }

  // Generate XML
  const metadataXml = generateMetadataXml(metadata, bookId, modifiedDate);
  const manifestXml = manifestEntries
    .map((e) => {
      const props = e.properties ? ` properties="${escapeXml(e.properties)}"` : '';
      return `    <item id="${escapeXml(e.id)}" href="${escapeXml(e.href)}" media-type="${escapeXml(e.mediaType)}"${props} />`;
    })
    .join('\n');

  const spineXml = spineItems
    .map((id) => `    <itemref idref="${escapeXml(id)}" />`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf"
         xmlns:dc="http://purl.org/dc/elements/1.1/"
         xmlns:dcterms="http://purl.org/dc/terms/"
         version="3.0"
         unique-identifier="book-id"
         xml:lang="${escapeXml(metadata.language || 'ko')}">

  <metadata>
${metadataXml}
  </metadata>

  <manifest>
${manifestXml}
  </manifest>

  <spine>
${spineXml}
  </spine>

</package>`;
}

// ---------------------------------------------------------------------------
// Metadata generation
// ---------------------------------------------------------------------------

function generateMetadataXml(
  metadata: EpubMetadata,
  bookId: string,
  modifiedDate: string,
): string {
  const lines: string[] = [];

  // Identifier
  lines.push(`    <dc:identifier id="book-id">${escapeXml(bookId)}</dc:identifier>`);

  // Title
  lines.push(`    <dc:title>${escapeXml(metadata.title)}</dc:title>`);

  // Language
  lines.push(`    <dc:language>${escapeXml(metadata.language || 'ko')}</dc:language>`);

  // Creator / Author
  if (metadata.author) {
    lines.push(`    <dc:creator>${escapeXml(metadata.author)}</dc:creator>`);
  }

  // Publisher
  if (metadata.publisher) {
    lines.push(`    <dc:publisher>${escapeXml(metadata.publisher)}</dc:publisher>`);
  }

  // Date
  if (metadata.date) {
    lines.push(`    <dc:date>${escapeXml(metadata.date)}</dc:date>`);
  }

  // Description
  if (metadata.description) {
    lines.push(`    <dc:description>${escapeXml(metadata.description)}</dc:description>`);
  }

  // ISBN as dc:identifier with scheme
  if (metadata.isbn && metadata.isbn !== bookId) {
    lines.push(`    <dc:identifier id="isbn">${escapeXml(metadata.isbn)}</dc:identifier>`);
  }

  // Modified date (required for ePub 3.0)
  lines.push(`    <meta property="dcterms:modified">${modifiedDate}</meta>`);

  // -------------------------------------------------------------------------
  // Accessibility metadata (schema.org - EPUB Accessibility 1.1)
  // -------------------------------------------------------------------------
  lines.push('');
  lines.push('    <!-- Accessibility metadata (EPUB Accessibility 1.1) -->');
  lines.push('    <meta property="schema:accessMode">textual</meta>');
  lines.push('    <meta property="schema:accessMode">visual</meta>');
  lines.push('    <meta property="schema:accessModeSufficient">textual</meta>');
  lines.push('    <meta property="schema:accessibilityFeature">structuralNavigation</meta>');
  lines.push('    <meta property="schema:accessibilityFeature">readingOrder</meta>');
  lines.push('    <meta property="schema:accessibilityFeature">alternativeText</meta>');
  lines.push('    <meta property="schema:accessibilityFeature">longDescription</meta>');
  lines.push('    <meta property="schema:accessibilityFeature">tableOfContents</meta>');
  lines.push('    <meta property="schema:accessibilityHazard">none</meta>');
  lines.push('    <meta property="schema:accessibilitySummary">이 전자책은 구조적 내비게이션, 대체 텍스트, 읽기 순서를 지원합니다.</meta>');

  return lines.join('\n');
}

/**
 * Utility: return the filename that a chapter will be stored as in the OEBPS.
 * Exported so that other generators (nav, converter) can reference
 * the same paths.
 */
export { chapterFilename };
