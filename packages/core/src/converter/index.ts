/**
 * ePub 3.0 Converter
 *
 * Converts a ParsedEpub (from the ePub 2.0 parser) into an ePub 3.0
 * compliant package. The output is a Buffer containing the ZIP archive.
 *
 * ePub 3.0 structure:
 *   mimetype                         (uncompressed, first entry)
 *   META-INF/
 *     container.xml
 *   OEBPS/
 *     package.opf
 *     Text/
 *       nav.xhtml
 *       cover.xhtml                  (if cover image exists)
 *       chapter-001.xhtml
 *       chapter-002.xhtml
 *       ...
 *     Styles/
 *       stylesheet.css
 *     Images/
 *       (all images from original epub)
 *     Fonts/
 *       (any embedded fonts)
 *     Audio/
 *       (TTS audio if generated)
 */

import JSZip from 'jszip';
import type {
  ParsedEpub,
  ConversionOptions,
  AiGeneratedContent,
  Chapter,
  Resource,
} from '../types.js';
import { generateChapterHtml5, generateCoverHtml5 } from './html5-generator.js';
import { generateStylesheet, type CssTheme } from './css-generator.js';
import { generateOpf3, chapterFilename } from './opf3-generator.js';
import { generateNavDocument } from './nav-generator.js';
import { applyAccessibility } from '../accessibility/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine the OEBPS subdirectory for a resource based on its media type.
 */
function resourceSubdir(mediaType: string): string {
  if (mediaType.startsWith('image/')) return 'Images';
  if (mediaType.startsWith('font/') || mediaType.includes('font')) return 'Fonts';
  if (mediaType.startsWith('audio/')) return 'Audio';
  if (mediaType.startsWith('video/')) return 'Audio'; // group with audio
  return 'Images'; // fallback
}

/**
 * Get the basename of a path.
 */
function basename(path: string): string {
  return path.split('/').pop() ?? path;
}

// ---------------------------------------------------------------------------
// Container.xml
// ---------------------------------------------------------------------------

const CONTAINER_XML = `<?xml version="1.0" encoding="UTF-8"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles>
    <rootfile full-path="OEBPS/package.opf" media-type="application/oebps-package+xml" />
  </rootfiles>
</container>`;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a parsed ePub 2.0 document into an ePub 3.0 buffer.
 *
 * @param parsed      - The output of parseEpub()
 * @param options     - Conversion options (themes, feature flags)
 * @param aiContent   - Optional AI-generated content to insert
 * @returns Buffer containing the ePub 3.0 ZIP archive
 */
export async function convertToEpub3(
  parsed: ParsedEpub,
  options: ConversionOptions,
  aiContent?: AiGeneratedContent,
): Promise<Buffer> {
  const zip = new JSZip();

  // -------------------------------------------------------------------------
  // 1. mimetype (MUST be first entry, uncompressed, no extra field)
  // -------------------------------------------------------------------------
  zip.file('mimetype', 'application/epub+zip', {
    compression: 'STORE',
  });

  // -------------------------------------------------------------------------
  // 2. META-INF/container.xml
  // -------------------------------------------------------------------------
  zip.file('META-INF/container.xml', CONTAINER_XML);

  // -------------------------------------------------------------------------
  // 3. CSS Stylesheet
  // -------------------------------------------------------------------------
  const cssTheme = (options.cssTheme || 'default') as CssTheme;
  const css = generateStylesheet(cssTheme);
  zip.file('OEBPS/Styles/stylesheet.css', css);

  // -------------------------------------------------------------------------
  // 4. Process resources (images, fonts, etc.)
  // -------------------------------------------------------------------------
  const processedResources: Resource[] = [];
  const resourceHrefMap = new Map<string, string>(); // old href → new OEBPS-relative href

  for (const resource of parsed.resources) {
    if (!resource.data) continue;

    // Skip CSS (we generate our own) and NCX
    if (resource.mediaType === 'text/css') continue;
    if (resource.mediaType === 'application/x-dtbncx+xml') continue;

    const subdir = resourceSubdir(resource.mediaType);
    const filename = basename(resource.href);
    const newHref = `${subdir}/${filename}`;

    zip.file(`OEBPS/${newHref}`, resource.data);
    resourceHrefMap.set(resource.href, newHref);

    processedResources.push({
      ...resource,
      href: newHref,
    });
  }

  // -------------------------------------------------------------------------
  // 5. Determine cover image
  // -------------------------------------------------------------------------
  let coverImageHref: string | undefined;
  if (parsed.metadata.coverImage) {
    coverImageHref = resourceHrefMap.get(parsed.metadata.coverImage);
    if (!coverImageHref) {
      // Try basename match
      const coverBasename = basename(parsed.metadata.coverImage);
      for (const [oldHref, newHref] of resourceHrefMap) {
        if (basename(oldHref) === coverBasename) {
          coverImageHref = newHref;
          break;
        }
      }
    }
  }

  const hasCover = !!coverImageHref;

  // -------------------------------------------------------------------------
  // 6. Generate cover page
  // -------------------------------------------------------------------------
  if (hasCover && coverImageHref) {
    const coverHtml = generateCoverHtml5(
      parsed.metadata,
      `../${coverImageHref}`,
      '../Styles/stylesheet.css',
    );
    zip.file('OEBPS/Text/cover.xhtml', coverHtml);
  }

  // -------------------------------------------------------------------------
  // 7. Generate chapter XHTML files
  // -------------------------------------------------------------------------
  const processedChapters: Chapter[] = [];

  for (let i = 0; i < parsed.chapters.length; i++) {
    const chapter = parsed.chapters[i];
    const filename = chapterFilename(chapter, i);

    // Generate HTML5 content
    let html = generateChapterHtml5(
      chapter,
      parsed.metadata,
      '../Styles/stylesheet.css',
    );

    // Apply accessibility enhancements
    html = applyAccessibility(html, chapter.elements);

    // Insert AI-generated content if available
    if (aiContent) {
      html = insertAiContent(html, chapter, aiContent);
    }

    // Fix image src paths to point to OEBPS/Images/
    html = fixImagePaths(html, resourceHrefMap);

    zip.file(`OEBPS/Text/${filename}`, html);

    processedChapters.push({
      ...chapter,
      href: `Text/${filename}`,
    });
  }

  // -------------------------------------------------------------------------
  // 8. Generate nav.xhtml
  // -------------------------------------------------------------------------
  const navHtml = generateNavDocument(
    parsed.toc,
    parsed.chapters,
    parsed.metadata,
    '../Styles/stylesheet.css',
  );
  zip.file('OEBPS/Text/nav.xhtml', navHtml);

  // -------------------------------------------------------------------------
  // 9. Generate package.opf
  // -------------------------------------------------------------------------
  const opf = generateOpf3({
    metadata: parsed.metadata,
    chapters: parsed.chapters,
    resources: processedResources,
    hasCover,
    coverImageHref,
    navId: 'nav',
  });
  zip.file('OEBPS/package.opf', opf);

  // -------------------------------------------------------------------------
  // 10. Package as ZIP buffer
  // -------------------------------------------------------------------------
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  return buffer;
}

// ---------------------------------------------------------------------------
// AI Content insertion
// ---------------------------------------------------------------------------

/**
 * Insert AI-generated content (summaries, quizzes, alt texts) into the
 * chapter HTML.
 */
function insertAiContent(
  html: string,
  chapter: Chapter,
  aiContent: AiGeneratedContent,
): string {
  let result = html;

  // Insert chapter summary before </section>
  if (aiContent.summaries?.[chapter.id]) {
    const summary = aiContent.summaries[chapter.id];
    const summaryHtml = `
    <aside epub:type="annotation" class="ai-summary" role="note" aria-label="챕터 요약">
      <h2>요약</h2>
      <p>${escapeHtml(summary)}</p>
    </aside>`;
    result = result.replace('</section>', `${summaryHtml}\n  </section>`);
  }

  // Insert quiz after the chapter content
  if (aiContent.quizzes?.[chapter.id]) {
    const quiz = aiContent.quizzes[chapter.id];
    const quizHtml = `
    <aside class="ai-quiz" role="complementary" aria-label="이해도 확인 퀴즈">
      <h2>이해도 확인</h2>
      ${quiz}
    </aside>`;
    result = result.replace('</section>', `${quizHtml}\n  </section>`);
  }

  // Replace alt text placeholders with AI-generated alt texts
  if (aiContent.altTexts) {
    for (const [imgSrc, altText] of Object.entries(aiContent.altTexts)) {
      const escapedSrc = imgSrc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(
        `(<img[^>]*src="${escapedSrc}"[^>]*alt=")([^"]*)(")`,
        'g',
      );
      result = result.replace(pattern, `$1${escapeHtml(altText)}$3`);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Image path fixing
// ---------------------------------------------------------------------------

/**
 * Replace old image src paths with new OEBPS-relative paths.
 */
function fixImagePaths(
  html: string,
  hrefMap: Map<string, string>,
): string {
  return html.replace(
    /(<img[^>]*src=")([^"]+)(")/g,
    (_match, prefix, src, suffix) => {
      // Try exact match
      let newSrc = hrefMap.get(src);
      if (!newSrc) {
        // Try basename match
        const srcBasename = basename(src);
        for (const [oldHref, newHref] of hrefMap) {
          if (basename(oldHref) === srcBasename) {
            newSrc = newHref;
            break;
          }
        }
      }
      return newSrc ? `${prefix}../${newSrc}${suffix}` : `${prefix}${src}${suffix}`;
    },
  );
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
