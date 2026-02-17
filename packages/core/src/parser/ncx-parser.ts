/**
 * NCX (Navigation Control XML) Parser
 *
 * Parses the toc.ncx file from ePub 2.0 packages to produce
 * a hierarchical table of contents (TocEntry[]).
 */

import { parseDocument } from 'htmlparser2';
import * as domutils from 'domutils';
import type { Element } from 'domhandler';
import type { TocEntry } from '../types.js';

/**
 * Find the first child element matching a tag name (case-insensitive).
 */
function findChild(parent: Element, tagName: string): Element | null {
  const lower = tagName.toLowerCase();
  return (
    (parent.children.find(
      (c) => c.type === 'tag' && (c as Element).name.toLowerCase() === lower,
    ) as Element | undefined) ?? null
  );
}

/**
 * Find all child elements matching a tag name (case-insensitive).
 */
function findChildren(parent: Element, tagName: string): Element[] {
  const lower = tagName.toLowerCase();
  return parent.children.filter(
    (c) => c.type === 'tag' && (c as Element).name.toLowerCase() === lower,
  ) as Element[];
}

/**
 * Recursively parse a <navPoint> element into a TocEntry.
 */
function parseNavPoint(navPoint: Element): TocEntry {
  const id = navPoint.attribs['id'] ?? '';

  // <navLabel><text>Title</text></navLabel>
  const navLabel = findChild(navPoint, 'navLabel');
  let title = '';
  if (navLabel) {
    const textEl = findChild(navLabel, 'text');
    title = textEl ? domutils.textContent(textEl).trim() : '';
  }

  // <content src="chapter1.xhtml" />
  const contentEl = findChild(navPoint, 'content');
  const href = contentEl?.attribs?.['src'] ?? '';

  // Recursively parse child <navPoint> elements
  const childNavPoints = findChildren(navPoint, 'navPoint');
  const children: TocEntry[] = childNavPoints.map(parseNavPoint);

  return { id, title, href, children };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse an NCX XML string into an array of TocEntry objects.
 *
 * @param ncxXml - Raw NCX XML string
 * @returns Hierarchical table of contents
 */
export function parseNcx(ncxXml: string): TocEntry[] {
  const doc = parseDocument(ncxXml, { xmlMode: true });

  // Find the <navMap> root
  const navMap = domutils.findOne(
    (node) => node.type === 'tag' && node.name.toLowerCase() === 'navmap',
    doc.children,
    true,
  );

  if (!navMap) {
    return [];
  }

  // Parse top-level navPoints
  const topNavPoints = findChildren(navMap, 'navPoint');
  return topNavPoints.map(parseNavPoint);
}
