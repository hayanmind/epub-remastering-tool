/**
 * Nav Document Generator
 *
 * Generates the nav.xhtml file for ePub 3.0.
 * This replaces the NCX from ePub 2.0 with an HTML5 navigation document
 * containing <nav epub:type="toc">.
 */

import type { TocEntry, EpubMetadata, Chapter } from '../types.js';
import { chapterFilename } from './opf3-generator.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ---------------------------------------------------------------------------
// TOC rendering
// ---------------------------------------------------------------------------

/**
 * Build a chapter href map so we can convert old ePub 2.0 hrefs
 * to new ePub 3.0 file paths.
 */
function buildHrefMap(chapters: Chapter[]): Map<string, string> {
  const map = new Map<string, string>();
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const oldBase = chapter.href.split('#')[0];
    const newFilename = chapterFilename(chapter, i);
    map.set(oldBase, newFilename);
  }
  return map;
}

/**
 * Resolve a TOC href to the new ePub 3.0 path.
 */
function resolveHref(href: string, hrefMap: Map<string, string>): string {
  const [base, fragment] = href.split('#');
  const newBase = hrefMap.get(base);
  if (newBase) {
    return fragment ? `${newBase}#${fragment}` : newBase;
  }
  // If not found in map, keep original (may be an external link)
  return href;
}

/**
 * Recursively render TOC entries as nested <ol>/<li> lists.
 */
function renderTocEntries(
  entries: TocEntry[],
  hrefMap: Map<string, string>,
  indent: string = '        ',
): string {
  if (entries.length === 0) return '';

  const items = entries.map((entry) => {
    const resolvedHref = resolveHref(entry.href, hrefMap);
    const link = `<a href="${escapeAttr(resolvedHref)}">${escapeHtml(entry.title)}</a>`;

    if (entry.children.length > 0) {
      const childList = renderTocEntries(entry.children, hrefMap, indent + '    ');
      return `${indent}<li>\n${indent}  ${link}\n${childList}\n${indent}</li>`;
    }

    return `${indent}<li>${link}</li>`;
  });

  return `${indent}<ol>\n${items.join('\n')}\n${indent}</ol>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate the nav.xhtml document for ePub 3.0.
 *
 * If the parsed ePub had a TOC (from NCX), that structure is preserved.
 * If no TOC was available, a flat TOC is generated from the chapter list.
 *
 * @param toc      - Parsed table of contents entries
 * @param chapters - Parsed chapters (for fallback and href mapping)
 * @param metadata - ePub metadata (for language, title)
 * @param cssHref  - Relative path to the CSS stylesheet
 * @returns XHTML string of the nav document
 */
export function generateNavDocument(
  toc: TocEntry[],
  chapters: Chapter[],
  metadata: EpubMetadata,
  cssHref: string = '../Styles/stylesheet.css',
): string {
  const lang = metadata.language || 'ko';
  const hrefMap = buildHrefMap(chapters);

  // If no TOC entries, generate a flat TOC from chapters
  const effectiveToc: TocEntry[] =
    toc.length > 0
      ? toc
      : chapters.map((chapter, i) => ({
          id: `nav-${i + 1}`,
          title: chapter.title,
          href: chapter.href,
          children: [],
        }));

  const tocHtml = renderTocEntries(effectiveToc, hrefMap);

  // Build landmarks
  const landmarks: string[] = [];
  landmarks.push(
    '          <li><a epub:type="toc" href="nav.xhtml">목차</a></li>',
  );
  if (chapters.length > 0) {
    const firstChapter = chapterFilename(chapters[0], 0);
    landmarks.push(
      `          <li><a epub:type="bodymatter" href="${escapeAttr(firstChapter)}">본문 시작</a></li>`,
    );
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <title>목차 - ${escapeHtml(metadata.title)}</title>
  <link rel="stylesheet" type="text/css" href="${escapeAttr(cssHref)}" />
</head>
<body>
  <nav epub:type="toc" role="doc-toc" aria-label="목차">
    <h1>목차</h1>
${tocHtml}
  </nav>

  <nav epub:type="landmarks" role="navigation" aria-label="랜드마크" hidden="">
    <h2>랜드마크</h2>
    <ol>
${landmarks.join('\n')}
    </ol>
  </nav>
</body>
</html>`;
}
