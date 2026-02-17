/**
 * @gov-epub/core - Shared Types
 *
 * All type definitions for the ePub 2.0 parser and ePub 3.0 converter pipeline.
 */

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export interface EpubMetadata {
  title: string;
  author: string;
  language: string;
  publisher: string;
  date: string;
  isbn: string;
  description: string;
  coverImage: string;
  /** Additional Dublin Core or custom metadata entries */
  extra: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Table of Contents
// ---------------------------------------------------------------------------

export interface TocEntry {
  id: string;
  title: string;
  href: string;
  children: TocEntry[];
}

// ---------------------------------------------------------------------------
// Content Elements (parsed from HTML)
// ---------------------------------------------------------------------------

export type ContentElementType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'caption'
  | 'list'
  | 'table'
  | 'unknown';

export interface ContentElement {
  type: ContentElementType;
  tag: string;
  content: string;
  attributes: Record<string, string>;
  children: ContentElement[];
}

// ---------------------------------------------------------------------------
// Chapter & Resource
// ---------------------------------------------------------------------------

export interface Chapter {
  id: string;
  title: string;
  href: string;
  /** Raw HTML/XHTML string of the chapter body */
  content: string;
  /** Structured elements extracted from the chapter */
  elements: ContentElement[];
}

export interface Resource {
  id: string;
  href: string;
  mediaType: string;
  data?: Buffer;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type ParseErrorSeverity = 'error' | 'warning' | 'info';

export interface ParseError {
  type: string;
  message: string;
  location: string;
  severity: ParseErrorSeverity;
}

// ---------------------------------------------------------------------------
// Parsed ePub (output of the parser)
// ---------------------------------------------------------------------------

export interface ParsedEpub {
  metadata: EpubMetadata;
  toc: TocEntry[];
  chapters: Chapter[];
  resources: Resource[];
  errors: ParseError[];
}

// ---------------------------------------------------------------------------
// OPF internal types
// ---------------------------------------------------------------------------

export interface ManifestItem {
  id: string;
  href: string;
  mediaType: string;
  properties?: string;
}

export interface SpineItem {
  idref: string;
  linear: boolean;
}

export interface OpfData {
  metadata: EpubMetadata;
  manifest: ManifestItem[];
  spine: SpineItem[];
  /** ID of the TOC NCX item in the manifest */
  tocId: string;
  /** Base directory of the OPF file relative to the epub root */
  opfDir: string;
}

// ---------------------------------------------------------------------------
// Conversion Options
// ---------------------------------------------------------------------------

export interface ConversionOptions {
  enableTts: boolean;
  enableQuiz: boolean;
  enableImageGen: boolean;
  enableSummary: boolean;
  templateId: string;
  cssTheme: string;
}

// ---------------------------------------------------------------------------
// AI-Generated Content (optional input to converter)
// ---------------------------------------------------------------------------

export interface AiGeneratedContent {
  summaries?: Record<string, string>;
  quizzes?: Record<string, string>;
  ttsAudio?: Record<string, Buffer>;
  generatedImages?: Record<string, Buffer>;
  altTexts?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Validation Report
// ---------------------------------------------------------------------------

export interface ValidationIssue {
  code: string;
  message: string;
  location: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationReport {
  epubcheck: {
    passed: boolean;
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
  };
  accessibility: {
    score: number;
    issues: ValidationIssue[];
  };
  interactionCount: number;
}

// ---------------------------------------------------------------------------
// Conversion Result
// ---------------------------------------------------------------------------

export interface ConversionStats {
  chapterCount: number;
  resourceCount: number;
  totalSize: number;
  conversionTimeMs: number;
}

export interface ConversionResult {
  epub: Buffer;
  report: ValidationReport;
  metadata: EpubMetadata;
  stats: ConversionStats;
}
