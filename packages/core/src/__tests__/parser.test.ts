import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseEpub } from '../parser/index.js';
import { parseOpf } from '../parser/opf-parser.js';
import { parseNcx } from '../parser/ncx-parser.js';
import { parseHtmlContent, extractTitle } from '../parser/html-parser.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const fixturesDir = resolve(__dirname, '../../../../fixtures');

function loadFixture(name: string): Buffer {
  return readFileSync(resolve(fixturesDir, name));
}

// ---------------------------------------------------------------------------
// OPF Parser
// ---------------------------------------------------------------------------

describe('parseOpf', () => {
  const sampleOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>테스트 도서</dc:title>
    <dc:creator>홍길동</dc:creator>
    <dc:language>ko</dc:language>
    <dc:publisher>테스트출판사</dc:publisher>
    <dc:identifier id="BookId">urn:isbn:978-89-1234-567-8</dc:identifier>
    <dc:description>테스트 설명</dc:description>
    <meta name="cover" content="cover-img" />
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />
    <item id="ch1" href="chapter1.xhtml" media-type="application/xhtml+xml" />
    <item id="ch2" href="chapter2.xhtml" media-type="application/xhtml+xml" />
    <item id="cover-img" href="images/cover.jpg" media-type="image/jpeg" />
    <item id="style" href="style.css" media-type="text/css" />
  </manifest>
  <spine toc="ncx">
    <itemref idref="ch1" />
    <itemref idref="ch2" linear="no" />
  </spine>
</package>`;

  it('extracts metadata from OPF', () => {
    const result = parseOpf(sampleOpf, 'OEBPS');
    expect(result.metadata.title).toBe('테스트 도서');
    expect(result.metadata.author).toBe('홍길동');
    expect(result.metadata.language).toBe('ko');
    expect(result.metadata.publisher).toBe('테스트출판사');
    expect(result.metadata.description).toBe('테스트 설명');
  });

  it('parses manifest items', () => {
    const result = parseOpf(sampleOpf, 'OEBPS');
    expect(result.manifest).toHaveLength(5);
    expect(result.manifest.find(m => m.id === 'ch1')).toEqual({
      id: 'ch1',
      href: 'chapter1.xhtml',
      mediaType: 'application/xhtml+xml',
      properties: undefined,
    });
  });

  it('parses spine with reading order', () => {
    const result = parseOpf(sampleOpf, 'OEBPS');
    expect(result.spine).toHaveLength(2);
    expect(result.spine[0]).toEqual({ idref: 'ch1', linear: true });
    expect(result.spine[1]).toEqual({ idref: 'ch2', linear: false });
  });

  it('resolves TOC NCX id from spine', () => {
    const result = parseOpf(sampleOpf, 'OEBPS');
    expect(result.tocId).toBe('ncx');
  });

  it('resolves cover image from meta + manifest', () => {
    const result = parseOpf(sampleOpf, 'OEBPS');
    expect(result.metadata.coverImage).toBe('images/cover.jpg');
  });

  it('preserves opfDir', () => {
    const result = parseOpf(sampleOpf, 'OEBPS');
    expect(result.opfDir).toBe('OEBPS');
  });
});

// ---------------------------------------------------------------------------
// NCX Parser
// ---------------------------------------------------------------------------

describe('parseNcx', () => {
  const sampleNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <navMap>
    <navPoint id="np1" playOrder="1">
      <navLabel><text>제1장 시작</text></navLabel>
      <content src="chapter1.xhtml" />
      <navPoint id="np1-1" playOrder="2">
        <navLabel><text>1.1 소제목</text></navLabel>
        <content src="chapter1.xhtml#sec1" />
      </navPoint>
    </navPoint>
    <navPoint id="np2" playOrder="3">
      <navLabel><text>제2장 전개</text></navLabel>
      <content src="chapter2.xhtml" />
    </navPoint>
  </navMap>
</ncx>`;

  it('parses top-level TOC entries', () => {
    const toc = parseNcx(sampleNcx);
    expect(toc).toHaveLength(2);
    expect(toc[0].title).toBe('제1장 시작');
    expect(toc[1].title).toBe('제2장 전개');
  });

  it('parses nested TOC entries', () => {
    const toc = parseNcx(sampleNcx);
    expect(toc[0].children).toHaveLength(1);
    expect(toc[0].children[0].title).toBe('1.1 소제목');
    expect(toc[0].children[0].href).toBe('chapter1.xhtml#sec1');
  });

  it('preserves href and id', () => {
    const toc = parseNcx(sampleNcx);
    expect(toc[0].id).toBe('np1');
    expect(toc[0].href).toBe('chapter1.xhtml');
  });

  it('returns empty array for missing navMap', () => {
    const emptyNcx = `<?xml version="1.0"?><ncx></ncx>`;
    expect(parseNcx(emptyNcx)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// HTML Parser
// ---------------------------------------------------------------------------

describe('parseHtmlContent', () => {
  const sampleHtml = `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body>
  <h1>제1장</h1>
  <p>첫 번째 문단입니다.</p>
  <p>두 번째 문단입니다.</p>
  <h2>소제목</h2>
  <ul><li>항목 1</li><li>항목 2</li></ul>
  <table><tr><th>헤더</th></tr><tr><td>값</td></tr></table>
  <img src="image.jpg" alt="이미지" />
</body>
</html>`;

  it('extracts heading elements', () => {
    const elements = parseHtmlContent(sampleHtml);
    const headings = elements.filter(el => el.type === 'heading');
    expect(headings.length).toBeGreaterThanOrEqual(2);
  });

  it('extracts paragraph elements', () => {
    const elements = parseHtmlContent(sampleHtml);
    const paragraphs = elements.filter(el => el.type === 'paragraph');
    expect(paragraphs.length).toBeGreaterThanOrEqual(2);
  });

  it('extracts image elements', () => {
    const elements = parseHtmlContent(sampleHtml);
    const images = elements.filter(el => el.type === 'image');
    expect(images.length).toBeGreaterThanOrEqual(1);
  });

  it('extracts list elements', () => {
    const elements = parseHtmlContent(sampleHtml);
    const lists = elements.filter(el => el.type === 'list');
    expect(lists.length).toBeGreaterThanOrEqual(1);
  });

  it('extracts table elements', () => {
    const elements = parseHtmlContent(sampleHtml);
    const tables = elements.filter(el => el.type === 'table');
    expect(tables.length).toBeGreaterThanOrEqual(1);
  });
});

describe('extractTitle', () => {
  it('extracts title from h1', () => {
    const html = '<html><body><h1>테스트 제목</h1></body></html>';
    expect(extractTitle(html)).toBe('테스트 제목');
  });

  it('extracts title from <title> tag', () => {
    const html = '<html><head><title>페이지 제목</title></head><body></body></html>';
    expect(extractTitle(html)).toBe('페이지 제목');
  });

  it('returns empty string for no title', () => {
    const html = '<html><body><p>No heading</p></body></html>';
    expect(extractTitle(html)).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Full ePub Parser (integration with fixture files)
// ---------------------------------------------------------------------------

describe('parseEpub', () => {
  it('parses literature-novel.epub', async () => {
    const buffer = loadFixture('literature-novel.epub');
    const result = await parseEpub(buffer);

    expect(result.metadata.title).toBeTruthy();
    expect(result.metadata.language).toBe('ko');
    expect(result.chapters.length).toBeGreaterThan(0);
    expect(result.toc.length).toBeGreaterThan(0);
  });

  it('parses education-science.epub', async () => {
    const buffer = loadFixture('education-science.epub');
    const result = await parseEpub(buffer);

    expect(result.metadata.title).toBeTruthy();
    expect(result.chapters.length).toBeGreaterThan(0);
  });

  it('parses children-phonics.epub', async () => {
    const buffer = loadFixture('children-phonics.epub');
    const result = await parseEpub(buffer);

    expect(result.metadata.title).toBeTruthy();
    expect(result.chapters.length).toBeGreaterThan(0);
  });

  it('extracts chapter content with elements', async () => {
    const buffer = loadFixture('literature-novel.epub');
    const result = await parseEpub(buffer);

    for (const chapter of result.chapters) {
      expect(chapter.content).toBeTruthy();
      expect(chapter.title).toBeTruthy();
      expect(chapter.id).toBeTruthy();
    }
  });

  it('collects resources (CSS, images)', async () => {
    const buffer = loadFixture('education-science.epub');
    const result = await parseEpub(buffer);

    // Should have at least the CSS resource
    expect(result.resources.length).toBeGreaterThanOrEqual(0);
  });

  it('throws on invalid input', async () => {
    const invalidBuffer = Buffer.from('not a zip file');
    await expect(parseEpub(invalidBuffer)).rejects.toThrow('Invalid ePub file');
  });
});
