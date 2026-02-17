/**
 * HTML5 Generator
 *
 * Converts parsed chapter content into semantic HTML5 documents
 * conforming to ePub 3.0 (XHTML5 serialisation).
 */

import type { Chapter, ContentElement, EpubMetadata } from '../types.js';

// ---------------------------------------------------------------------------
// Element → HTML5
// ---------------------------------------------------------------------------

/**
 * Render a single ContentElement as an HTML5 string.
 */
function renderElement(el: ContentElement, indent: string = '    '): string {
  switch (el.type) {
    case 'heading':
      return `${indent}<${el.tag}>${escapeHtml(el.content)}</${el.tag}>`;

    case 'paragraph':
      if (el.tag === '#text') {
        return `${indent}<p>${escapeHtml(el.content)}</p>`;
      }
      if (el.tag === 'blockquote') {
        return `${indent}<blockquote>\n${indent}  <p>${escapeHtml(el.content)}</p>\n${indent}</blockquote>`;
      }
      if (el.tag === 'pre') {
        return `${indent}<pre><code>${escapeHtml(el.content)}</code></pre>`;
      }
      return `${indent}<p>${escapeHtml(el.content)}</p>`;

    case 'image': {
      const src = el.attributes['src'] ?? el.attributes['xlink:href'] ?? '';
      const alt = el.attributes['alt'] ?? '';
      return `${indent}<figure>\n${indent}  <img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" />\n${indent}</figure>`;
    }

    case 'caption':
      return `${indent}<figcaption>${escapeHtml(el.content)}</figcaption>`;

    case 'list': {
      const tag = el.tag === 'ol' ? 'ol' : el.tag === 'dl' ? 'dl' : 'ul';
      const childrenHtml = el.children
        .map((child) => {
          if (child.tag === 'li' || child.tag === 'dt' || child.tag === 'dd') {
            return `${indent}  <${child.tag}>${escapeHtml(child.content)}</${child.tag}>`;
          }
          return `${indent}  <li>${escapeHtml(child.content)}</li>`;
        })
        .join('\n');
      return `${indent}<${tag}>\n${childrenHtml}\n${indent}</${tag}>`;
    }

    case 'table': {
      // For tables, preserve existing structure if available
      const rows = el.children.filter(
        (c) => c.tag === 'tr' || c.tag === 'thead' || c.tag === 'tbody',
      );
      if (rows.length > 0) {
        const rowsHtml = rows
          .map((row) => {
            if (row.tag === 'thead' || row.tag === 'tbody') {
              const innerRows = row.children
                .filter((c) => c.tag === 'tr')
                .map((tr) => renderTableRow(tr, indent + '    '))
                .join('\n');
              return `${indent}  <${row.tag}>\n${innerRows}\n${indent}  </${row.tag}>`;
            }
            return renderTableRow(row, indent + '  ');
          })
          .join('\n');
        return `${indent}<table>\n${rowsHtml}\n${indent}</table>`;
      }
      // Fallback: render content as a simple table
      return `${indent}<table>\n${indent}  <tbody>\n${indent}    <tr><td>${escapeHtml(el.content)}</td></tr>\n${indent}  </tbody>\n${indent}</table>`;
    }

    default:
      if (el.content.trim()) {
        return `${indent}<div>${escapeHtml(el.content)}</div>`;
      }
      return '';
  }
}

function renderTableRow(row: ContentElement, indent: string): string {
  const cells = row.children
    .filter((c) => c.tag === 'td' || c.tag === 'th')
    .map((cell) => `${indent}  <${cell.tag}>${escapeHtml(cell.content)}</${cell.tag}>`)
    .join('\n');
  return `${indent}<tr>\n${cells}\n${indent}</tr>`;
}

// ---------------------------------------------------------------------------
// HTML escaping utilities
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
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a complete XHTML5 document for an ePub 3.0 chapter.
 *
 * @param chapter  - The parsed chapter
 * @param metadata - The ePub metadata (for lang attribute, etc.)
 * @param cssHref  - Relative path to the CSS stylesheet
 * @returns XHTML5 string
 */
export function generateChapterHtml5(
  chapter: Chapter,
  metadata: EpubMetadata,
  cssHref: string = '../Styles/stylesheet.css',
): string {
  const lang = metadata.language || 'ko';

  // If the original content looks clean enough for ePub 3, use elements;
  // otherwise fall back to using the raw content with a wrapper.
  const bodyContent =
    chapter.elements.length > 0
      ? chapter.elements
          .map((el) => renderElement(el))
          .filter(Boolean)
          .join('\n')
      : `    <div class="chapter-content">\n${escapeHtml(chapter.content)}\n    </div>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="${escapeAttr(cssHref)}" />
</head>
<body epub:type="bodymatter">
  <section epub:type="chapter" role="doc-chapter" aria-label="${escapeAttr(chapter.title)}">
    <header>
      <h1>${escapeHtml(chapter.title)}</h1>
    </header>
${bodyContent}
  </section>
</body>
</html>`;
}

/**
 * Generate the cover page XHTML.
 */
export function generateCoverHtml5(
  metadata: EpubMetadata,
  coverImageHref: string,
  cssHref: string = '../Styles/stylesheet.css',
): string {
  const lang = metadata.language || 'ko';

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}" lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(metadata.title)}</title>
  <link rel="stylesheet" type="text/css" href="${escapeAttr(cssHref)}" />
</head>
<body epub:type="frontmatter">
  <section epub:type="cover" role="doc-cover">
    <figure>
      <img src="${escapeAttr(coverImageHref)}" alt="${escapeAttr(metadata.title)} 표지" />
    </figure>
  </section>
</body>
</html>`;
}
