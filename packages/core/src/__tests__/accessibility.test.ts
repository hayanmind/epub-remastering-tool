import { describe, it, expect } from 'vitest';
import {
  applyAccessibility,
  checkAccessibility,
  generateAccessibilityMetadata,
} from '../accessibility/index.js';
import type { ContentElement } from '../types.js';

// ---------------------------------------------------------------------------
// applyAccessibility
// ---------------------------------------------------------------------------

describe('applyAccessibility', () => {
  it('adds alt text to images without alt attribute', () => {
    const html = `<html xmlns="http://www.w3.org/1999/xhtml"><body><img src="images/photo.jpg" /></body></html>`;
    const result = applyAccessibility(html, []);
    expect(result).toContain('alt=');
    expect(result).toContain('photo');
  });

  it('preserves existing alt text', () => {
    const html = `<html xmlns="http://www.w3.org/1999/xhtml"><body><img src="img.jpg" alt="existing text" /></body></html>`;
    const result = applyAccessibility(html, []);
    expect(result).toContain('alt="existing text"');
    // Should not replace with placeholder
    expect(result).not.toContain('[이미지');
  });

  it('adds role="presentation" to decorative images (empty alt)', () => {
    const html = `<html xmlns="http://www.w3.org/1999/xhtml"><body><img src="deco.png" alt="" /></body></html>`;
    const result = applyAccessibility(html, []);
    expect(result).toContain('role="presentation"');
  });

  it('adds ARIA roles to nav elements', () => {
    const html = `<html xmlns="http://www.w3.org/1999/xhtml"><body><nav><ul><li>항목</li></ul></nav></body></html>`;
    const result = applyAccessibility(html, []);
    expect(result).toContain('role="navigation"');
  });

  it('adds scope="col" to table headers', () => {
    const html = `<html xmlns="http://www.w3.org/1999/xhtml"><body><table><thead><tr><th>제목</th></tr></thead></table></body></html>`;
    const result = applyAccessibility(html, []);
    expect(result).toContain('scope="col"');
  });

  it('ensures lang attribute on html element', () => {
    const html = `<html xmlns="http://www.w3.org/1999/xhtml"><body><p>내용</p></body></html>`;
    const result = applyAccessibility(html, []);
    expect(result).toContain('lang="ko"');
  });

  it('preserves existing lang attribute', () => {
    const html = `<html xmlns="http://www.w3.org/1999/xhtml" lang="en"><body><p>Content</p></body></html>`;
    const result = applyAccessibility(html, []);
    expect(result).toContain('lang="en"');
  });
});

// ---------------------------------------------------------------------------
// checkAccessibility
// ---------------------------------------------------------------------------

describe('checkAccessibility', () => {
  it('reports missing alt text', () => {
    const html = `<html><body><img src="test.jpg" /></body></html>`;
    const issues = checkAccessibility(html);
    expect(issues.some(i => i.includes('alt text'))).toBe(true);
  });

  it('reports missing lang attribute', () => {
    const html = `<html><body><p>Content</p></body></html>`;
    const issues = checkAccessibility(html);
    expect(issues.some(i => i.includes('lang'))).toBe(true);
  });

  it('reports heading level skip', () => {
    const html = `<html lang="ko"><body><h1>Title</h1><h3>Skipped</h3></body></html>`;
    const issues = checkAccessibility(html);
    expect(issues.some(i => i.includes('Heading level skip'))).toBe(true);
  });

  it('reports tables without headers', () => {
    const html = `<html lang="ko"><body><table><tr><td>값</td></tr></table></body></html>`;
    const issues = checkAccessibility(html);
    expect(issues.some(i => i.includes('header cells'))).toBe(true);
  });

  it('returns empty array for accessible content', () => {
    const html = `<html lang="ko"><body><h1>Title</h1><p>Content</p><img src="a.jpg" alt="설명" /></body></html>`;
    const issues = checkAccessibility(html);
    expect(issues).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// generateAccessibilityMetadata
// ---------------------------------------------------------------------------

describe('generateAccessibilityMetadata', () => {
  it('returns array of meta tag strings', () => {
    const metadata = generateAccessibilityMetadata();
    expect(metadata.length).toBeGreaterThan(0);
    expect(metadata.every(m => m.startsWith('<meta'))).toBe(true);
  });

  it('includes required accessibility properties', () => {
    const metadata = generateAccessibilityMetadata();
    const joined = metadata.join('\n');
    expect(joined).toContain('schema:accessMode');
    expect(joined).toContain('schema:accessibilityFeature');
    expect(joined).toContain('schema:accessibilityHazard');
  });
});
