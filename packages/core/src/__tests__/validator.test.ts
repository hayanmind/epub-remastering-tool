import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseEpub } from '../parser/index.js';
import { convertToEpub3 } from '../converter/index.js';
import { validateEpub } from '../validator/index.js';
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
// Validator
// ---------------------------------------------------------------------------

describe('validateEpub', () => {
  it('rejects invalid ZIP', async () => {
    const invalidBuffer = Buffer.from('not a zip');
    const report = await validateEpub(invalidBuffer);
    expect(report.epubcheck.passed).toBe(false);
    expect(report.epubcheck.errors.length).toBeGreaterThan(0);
  });

  it('validates converted literature-novel.epub', async () => {
    const input = loadFixture('literature-novel.epub');
    const parsed = await parseEpub(input);
    const output = await convertToEpub3(parsed, defaultOptions);
    const report = await validateEpub(output);

    expect(report.epubcheck.passed).toBe(true);
    expect(report.accessibility.score).toBeGreaterThan(0);
  });

  it('validates converted education-science.epub', async () => {
    const input = loadFixture('education-science.epub');
    const parsed = await parseEpub(input);
    const output = await convertToEpub3(parsed, defaultOptions);
    const report = await validateEpub(output);

    expect(report.epubcheck.passed).toBe(true);
  });

  it('validates converted children-phonics.epub', async () => {
    const input = loadFixture('children-phonics.epub');
    const parsed = await parseEpub(input);
    const output = await convertToEpub3(parsed, defaultOptions);
    const report = await validateEpub(output);

    expect(report.epubcheck.passed).toBe(true);
  });

  it('reports accessibility score', async () => {
    const input = loadFixture('literature-novel.epub');
    const parsed = await parseEpub(input);
    const output = await convertToEpub3(parsed, defaultOptions);
    const report = await validateEpub(output);

    expect(report.accessibility.score).toBeGreaterThanOrEqual(0);
    expect(report.accessibility.score).toBeLessThanOrEqual(100);
  });

  it('counts interaction elements', async () => {
    const input = loadFixture('literature-novel.epub');
    const parsed = await parseEpub(input);
    const output = await convertToEpub3(parsed, defaultOptions);
    const report = await validateEpub(output);

    expect(typeof report.interactionCount).toBe('number');
    expect(report.interactionCount).toBeGreaterThanOrEqual(0);
  });
});
