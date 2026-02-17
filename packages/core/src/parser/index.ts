/**
 * ePub 2.0 Parser
 *
 * Main entry point that orchestrates the full parsing pipeline:
 *   1. Extract ZIP with JSZip
 *   2. Parse container.xml to find rootfile (OPF)
 *   3. Parse OPF for metadata, manifest, spine
 *   4. Parse NCX for table of contents
 *   5. Parse each HTML/XHTML chapter and extract content elements
 *   6. Collect all resources (images, CSS, fonts, etc.)
 *   7. Return structured ParsedEpub
 */

import JSZip from 'jszip';
import { parseDocument } from 'htmlparser2';
import * as domutils from 'domutils';
import type {
  ParsedEpub,
  ParseError,
  Chapter,
  Resource,
  TocEntry,
  ManifestItem,
  OpfData,
} from '../types.js';
import { parseOpf } from './opf-parser.js';
import { parseNcx } from './ncx-parser.js';
import { parseHtmlContent, extractTitle } from './html-parser.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a file path by stripping leading slashes and resolving relative
 * segments so that lookups against the JSZip object work reliably.
 */
function normalisePath(base: string, relative: string): string {
  if (relative.startsWith('/')) {
    return relative.slice(1);
  }

  const baseParts = base.split('/');
  baseParts.pop(); // Remove filename from base

  const relParts = relative.split('/');
  for (const part of relParts) {
    if (part === '..') {
      baseParts.pop();
    } else if (part !== '.') {
      baseParts.push(part);
    }
  }

  return baseParts.join('/');
}

/**
 * Read a text file from the zip, trying different encodings if necessary.
 */
async function readTextFile(
  zip: JSZip,
  path: string,
  errors: ParseError[],
): Promise<string | null> {
  const file = zip.file(path);
  if (!file) {
    // Try case-insensitive search
    const lowerPath = path.toLowerCase();
    const match = Object.keys(zip.files).find(
      (name) => name.toLowerCase() === lowerPath,
    );
    if (match) {
      const matchFile = zip.file(match);
      if (matchFile) {
        return matchFile.async('string');
      }
    }

    errors.push({
      type: 'missing-file',
      message: `File not found in epub archive: ${path}`,
      location: path,
      severity: 'error',
    });
    return null;
  }

  try {
    return await file.async('string');
  } catch {
    // Attempt binary read and decode
    try {
      const buf = await file.async('nodebuffer');
      // Try to detect encoding with chardet
      let chardet: typeof import('chardet') | null = null;
      try {
        chardet = await import('chardet');
      } catch {
        // chardet not available, fall through
      }

      if (chardet) {
        const detected = chardet.detect(buf);
        if (detected && detected !== 'UTF-8') {
          errors.push({
            type: 'encoding-issue',
            message: `File ${path} detected as ${detected}, converting to UTF-8`,
            location: path,
            severity: 'warning',
          });
          const decoder = new TextDecoder(detected);
          return decoder.decode(buf);
        }
      }

      // Fallback: force UTF-8
      return new TextDecoder('utf-8', { fatal: false }).decode(buf);
    } catch (innerErr) {
      errors.push({
        type: 'encoding-error',
        message: `Failed to read file ${path}: ${innerErr instanceof Error ? innerErr.message : String(innerErr)}`,
        location: path,
        severity: 'error',
      });
      return null;
    }
  }
}

/**
 * Read a binary file from the zip.
 */
async function readBinaryFile(
  zip: JSZip,
  path: string,
): Promise<Buffer | undefined> {
  const file = zip.file(path);
  if (!file) {
    // Case-insensitive fallback
    const lowerPath = path.toLowerCase();
    const match = Object.keys(zip.files).find(
      (name) => name.toLowerCase() === lowerPath,
    );
    if (match) {
      const matchFile = zip.file(match);
      if (matchFile) {
        return matchFile.async('nodebuffer');
      }
    }
    return undefined;
  }
  return file.async('nodebuffer');
}

// ---------------------------------------------------------------------------
// Container.xml parsing
// ---------------------------------------------------------------------------

/**
 * Parse META-INF/container.xml to find the rootfile (OPF path).
 */
function parseContainerXml(xml: string): string {
  const doc = parseDocument(xml, { xmlMode: true });

  const rootfile = domutils.findOne(
    (node) => node.type === 'tag' && node.name.toLowerCase() === 'rootfile',
    doc.children,
    true,
  );

  if (!rootfile) {
    throw new Error('No <rootfile> element found in container.xml');
  }

  const fullPath = rootfile.attribs['full-path'];
  if (!fullPath) {
    throw new Error('No full-path attribute on <rootfile> in container.xml');
  }

  return fullPath;
}

// ---------------------------------------------------------------------------
// Chapter parsing
// ---------------------------------------------------------------------------

/**
 * Build a title lookup map from the TOC so we can assign chapter titles.
 */
function buildTocTitleMap(toc: TocEntry[]): Map<string, string> {
  const map = new Map<string, string>();

  function walk(entries: TocEntry[]): void {
    for (const entry of entries) {
      // Store by href (strip any fragment after #)
      const baseHref = entry.href.split('#')[0];
      if (baseHref && !map.has(baseHref)) {
        map.set(baseHref, entry.title);
      }
      walk(entry.children);
    }
  }

  walk(toc);
  return map;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse an ePub 2.0 buffer and return a structured ParsedEpub object.
 *
 * @param buffer - The raw .epub file as a Buffer
 * @returns Structured ParsedEpub with metadata, TOC, chapters, resources, and errors
 */
export async function parseEpub(buffer: Buffer): Promise<ParsedEpub> {
  const errors: ParseError[] = [];

  // -------------------------------------------------------------------------
  // 1. Load ZIP
  // -------------------------------------------------------------------------
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch (err) {
    throw new Error(
      `Invalid ePub file: not a valid ZIP archive. ${err instanceof Error ? err.message : ''}`,
    );
  }

  // -------------------------------------------------------------------------
  // 2. Verify mimetype
  // -------------------------------------------------------------------------
  const mimetypeFile = zip.file('mimetype');
  if (mimetypeFile) {
    const mimetype = (await mimetypeFile.async('string')).trim();
    if (mimetype !== 'application/epub+zip') {
      errors.push({
        type: 'invalid-mimetype',
        message: `Expected "application/epub+zip" but got "${mimetype}"`,
        location: 'mimetype',
        severity: 'warning',
      });
    }
  } else {
    errors.push({
      type: 'missing-mimetype',
      message: 'mimetype file is missing from the ePub archive',
      location: 'mimetype',
      severity: 'warning',
    });
  }

  // -------------------------------------------------------------------------
  // 3. Parse container.xml
  // -------------------------------------------------------------------------
  const containerXml = await readTextFile(
    zip,
    'META-INF/container.xml',
    errors,
  );
  if (!containerXml) {
    throw new Error('META-INF/container.xml not found or unreadable');
  }

  let opfPath: string;
  try {
    opfPath = parseContainerXml(containerXml);
  } catch (err) {
    throw new Error(
      `Failed to parse container.xml: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // -------------------------------------------------------------------------
  // 4. Parse OPF
  // -------------------------------------------------------------------------
  const opfXml = await readTextFile(zip, opfPath, errors);
  if (!opfXml) {
    throw new Error(`OPF file not found: ${opfPath}`);
  }

  const opfDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/')) : '';
  let opfData: OpfData;
  try {
    opfData = parseOpf(opfXml, opfDir);
  } catch (err) {
    throw new Error(
      `Failed to parse OPF: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // Build a manifest lookup
  const manifestMap = new Map<string, ManifestItem>();
  for (const item of opfData.manifest) {
    manifestMap.set(item.id, item);
  }

  // -------------------------------------------------------------------------
  // 5. Parse NCX (Table of Contents)
  // -------------------------------------------------------------------------
  let toc: TocEntry[] = [];

  // Find the NCX file
  const ncxItem = opfData.tocId
    ? manifestMap.get(opfData.tocId)
    : opfData.manifest.find((item) => item.mediaType === 'application/x-dtbncx+xml');

  if (ncxItem) {
    const ncxPath = opfDir ? `${opfDir}/${ncxItem.href}` : ncxItem.href;
    const ncxXml = await readTextFile(zip, ncxPath, errors);
    if (ncxXml) {
      try {
        toc = parseNcx(ncxXml);
      } catch (err) {
        errors.push({
          type: 'ncx-parse-error',
          message: `Failed to parse NCX: ${err instanceof Error ? err.message : String(err)}`,
          location: ncxPath,
          severity: 'warning',
        });
      }
    }
  } else {
    errors.push({
      type: 'missing-ncx',
      message: 'No NCX table of contents found in the ePub',
      location: opfPath,
      severity: 'warning',
    });
  }

  // -------------------------------------------------------------------------
  // 6. Parse chapters (spine items)
  // -------------------------------------------------------------------------
  const tocTitleMap = buildTocTitleMap(toc);
  const chapters: Chapter[] = [];

  for (const spineItem of opfData.spine) {
    const manifestItem = manifestMap.get(spineItem.idref);
    if (!manifestItem) {
      errors.push({
        type: 'missing-spine-item',
        message: `Spine references manifest id "${spineItem.idref}" which does not exist`,
        location: opfPath,
        severity: 'error',
      });
      continue;
    }

    // Only parse HTML/XHTML content
    const mt = manifestItem.mediaType.toLowerCase();
    if (
      !mt.includes('html') &&
      !mt.includes('xml') &&
      mt !== 'application/xhtml+xml'
    ) {
      continue;
    }

    const chapterPath = opfDir
      ? `${opfDir}/${manifestItem.href}`
      : manifestItem.href;

    const html = await readTextFile(zip, chapterPath, errors);
    if (!html) continue;

    let elements: import('../types.js').ContentElement[];
    try {
      elements = parseHtmlContent(html);
    } catch (err) {
      errors.push({
        type: 'html-parse-error',
        message: `Failed to parse chapter HTML: ${err instanceof Error ? err.message : String(err)}`,
        location: chapterPath,
        severity: 'warning',
      });
      elements = [];
    }

    // Determine chapter title
    const relHref = manifestItem.href;
    let title = tocTitleMap.get(relHref) ?? '';
    if (!title) {
      title = extractTitle(html);
    }
    if (!title) {
      title = `Chapter ${chapters.length + 1}`;
    }

    chapters.push({
      id: manifestItem.id,
      title,
      href: relHref,
      content: html,
      elements,
    });
  }

  // -------------------------------------------------------------------------
  // 7. Collect resources
  // -------------------------------------------------------------------------
  const resources: Resource[] = [];
  const spineIds = new Set(opfData.spine.map((s) => s.idref));

  for (const item of opfData.manifest) {
    // Skip spine (chapter) items and the NCX itself
    if (spineIds.has(item.id)) continue;
    if (item.mediaType === 'application/x-dtbncx+xml') continue;

    const resourcePath = opfDir ? `${opfDir}/${item.href}` : item.href;
    const data = await readBinaryFile(zip, resourcePath);

    if (!data) {
      errors.push({
        type: 'missing-resource',
        message: `Resource declared in manifest but not found: ${item.href}`,
        location: resourcePath,
        severity: 'warning',
      });
    }

    resources.push({
      id: item.id,
      href: item.href,
      mediaType: item.mediaType,
      data,
    });
  }

  // -------------------------------------------------------------------------
  // 8. Resolve cover image path in metadata
  // -------------------------------------------------------------------------
  if (opfData.metadata.coverImage) {
    const coverItem = opfData.manifest.find(
      (m) => m.id === opfData.metadata.coverImage || m.href === opfData.metadata.coverImage,
    );
    if (coverItem) {
      opfData.metadata.coverImage = coverItem.href;
    }
  }

  return {
    metadata: opfData.metadata,
    toc,
    chapters,
    resources,
    errors,
  };
}
