import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { processEpub } from '../index.js';
import type { ConversionOptions } from '../types.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const fixturesDir = resolve(__dirname, '../../../../fixtures');

function loadFixture(name: string): Buffer {
  return readFileSync(resolve(fixturesDir, name));
}

const defaultOptions: ConversionOptions = {
  enableTts: false,
  enableQuiz: false,
  enableImageGen: false,
  enableSummary: false,
  templateId: 'default',
  cssTheme: 'default',
};

// ---------------------------------------------------------------------------
// Full Pipeline: parse → convert → validate
// ---------------------------------------------------------------------------

describe('processEpub (full pipeline)', () => {
  it('processes literature-novel.epub end-to-end', async () => {
    const input = loadFixture('literature-novel.epub');
    const result = await processEpub(input, defaultOptions);

    // Output ePub buffer
    expect(result.epub).toBeInstanceOf(Buffer);
    expect(result.epub.length).toBeGreaterThan(0);

    // Metadata
    expect(result.metadata.title).toBeTruthy();
    expect(result.metadata.language).toBe('ko');

    // Stats
    expect(result.stats.chapterCount).toBeGreaterThan(0);
    expect(result.stats.conversionTimeMs).toBeGreaterThan(0);
    expect(result.stats.totalSize).toBeGreaterThan(0);

    // Validation
    expect(result.report.epubcheck.passed).toBe(true);
    expect(result.report.accessibility.score).toBeGreaterThan(0);
  });

  it('processes education-science.epub end-to-end', async () => {
    const input = loadFixture('education-science.epub');
    const result = await processEpub(input, defaultOptions);

    expect(result.epub).toBeInstanceOf(Buffer);
    expect(result.metadata.title).toBeTruthy();
    expect(result.stats.chapterCount).toBeGreaterThan(0);
    expect(result.report.epubcheck.passed).toBe(true);
  });

  it('processes children-phonics.epub end-to-end', async () => {
    const input = loadFixture('children-phonics.epub');
    const result = await processEpub(input, defaultOptions);

    expect(result.epub).toBeInstanceOf(Buffer);
    expect(result.metadata.title).toBeTruthy();
    expect(result.stats.chapterCount).toBeGreaterThan(0);
    expect(result.report.epubcheck.passed).toBe(true);
  });

  it('throws on invalid input', async () => {
    const invalidBuffer = Buffer.from('not a zip');
    await expect(processEpub(invalidBuffer, defaultOptions)).rejects.toThrow();
  });

  it('measures conversion time', async () => {
    const input = loadFixture('literature-novel.epub');
    const result = await processEpub(input, defaultOptions);
    expect(result.stats.conversionTimeMs).toBeGreaterThanOrEqual(0);
    // Should complete within reasonable time (< 10 seconds)
    expect(result.stats.conversionTimeMs).toBeLessThan(10_000);
  });
});
