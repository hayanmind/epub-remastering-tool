/**
 * @gov-epub/core
 *
 * Core engine for ePub 2.0 → ePub 3.0 conversion.
 *
 * Exports:
 *   - All shared types
 *   - parseEpub()       — ePub 2.0 parser
 *   - convertToEpub3()  — ePub 3.0 converter
 *   - applyAccessibility() — Accessibility enhancements
 *   - validateEpub()    — ePub validation
 *   - processEpub()     — Full pipeline: parse → convert → validate
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type {
  EpubMetadata,
  TocEntry,
  ContentElement,
  ContentElementType,
  ParsedEpub,
  Chapter,
  Resource,
  ParseError,
  ParseErrorSeverity,
  ManifestItem,
  SpineItem,
  OpfData,
  ConversionOptions,
  AiGeneratedContent,
  ConversionResult,
  ConversionStats,
  ValidationReport,
  ValidationIssue,
} from './types.js';

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export { parseEpub } from './parser/index.js';

// ---------------------------------------------------------------------------
// Converter
// ---------------------------------------------------------------------------

export { convertToEpub3 } from './converter/index.js';

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

export {
  applyAccessibility,
  generateAccessibilityMetadata,
  checkAccessibility,
} from './accessibility/index.js';

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

export { validateEpub } from './validator/index.js';

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

import type {
  ConversionOptions,
  AiGeneratedContent,
  ConversionResult,
} from './types.js';
import { parseEpub } from './parser/index.js';
import { convertToEpub3 } from './converter/index.js';
import { validateEpub } from './validator/index.js';

/**
 * Full processing pipeline: parse → convert → validate.
 *
 * Takes an ePub 2.0 buffer and produces an ePub 3.0 buffer along with
 * a validation report, metadata, and conversion statistics.
 *
 * @param inputBuffer - Raw ePub 2.0 file buffer
 * @param options     - Conversion options
 * @param aiContent   - Optional AI-generated content to insert
 * @returns ConversionResult with the output ePub buffer, report, metadata, and stats
 */
export async function processEpub(
  inputBuffer: Buffer,
  options: ConversionOptions,
  aiContent?: AiGeneratedContent,
): Promise<ConversionResult> {
  const startTime = Date.now();

  // 1. Parse the input ePub 2.0
  const parsed = await parseEpub(inputBuffer);

  // 2. Convert to ePub 3.0
  const epubBuffer = await convertToEpub3(parsed, options, aiContent);

  // 3. Validate the output
  const report = await validateEpub(epubBuffer);

  const conversionTimeMs = Date.now() - startTime;

  return {
    epub: epubBuffer,
    report,
    metadata: parsed.metadata,
    stats: {
      chapterCount: parsed.chapters.length,
      resourceCount: parsed.resources.length,
      totalSize: epubBuffer.length,
      conversionTimeMs,
    },
  };
}
