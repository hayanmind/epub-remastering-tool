/**
 * fixtures/create-samples.ts
 *
 * ePub 2.0 테스트 샘플 생성 스크립트
 * 실행: npx tsx fixtures/create-samples.ts
 *
 * 3가지 카테고리의 현실적인 한국어 ePub 2.0 파일을 생성한다:
 *   1. 문학 (소설)    - literature-novel.epub
 *   2. 교육 (교재)    - education-science.epub
 *   3. 유아동 (파닉스) - children-phonics.epub
 */

import JSZip from "jszip";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FIXTURES_DIR = __dirname;

/** Add the mimetype entry first (uncompressed, per ePub spec). */
function addMimetype(zip: JSZip): void {
  zip.file("mimetype", "application/epub+zip", {
    compression: "STORE",
  });
}

/** Standard META-INF/container.xml pointing to OEBPS/content.opf. */
function addContainerXml(zip: JSZip): void {
  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
`,
  );
}

interface MetadataOptions {
  title: string;
  creator: string;
  identifier: string;
  description?: string;
  publisher?: string;
  date?: string;
  subject?: string;
}

interface ManifestItem {
  id: string;
  href: string;
  mediaType: string;
}

interface SpineItemRef {
  idref: string;
}

interface NavPoint {
  id: string;
  playOrder: number;
  label: string;
  src: string;
  children?: NavPoint[];
}

function buildOpf(
  meta: MetadataOptions,
  manifestItems: ManifestItem[],
  spineRefs: SpineItemRef[],
): string {
  const manifest = manifestItems
    .map((i) => `    <item id="${i.id}" href="${i.href}" media-type="${i.mediaType}"/>`)
    .join("\n");

  const spine = spineRefs
    .map((r) => `    <itemref idref="${r.idref}"/>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${meta.title}</dc:title>
    <dc:creator opf:role="aut">${meta.creator}</dc:creator>
    <dc:language>ko</dc:language>
    <dc:identifier id="BookId">${meta.identifier}</dc:identifier>
${meta.description ? `    <dc:description>${meta.description}</dc:description>\n` : ""}${meta.publisher ? `    <dc:publisher>${meta.publisher}</dc:publisher>\n` : ""}${meta.date ? `    <dc:date>${meta.date}</dc:date>\n` : ""}${meta.subject ? `    <dc:subject>${meta.subject}</dc:subject>\n` : ""}  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
${manifest}
  </manifest>
  <spine toc="ncx">
${spine}
  </spine>
</package>
`;
}

function buildNavPoint(np: NavPoint, indent: string): string {
  const children = np.children
    ? np.children.map((c) => buildNavPoint(c, indent + "    ")).join("\n")
    : "";

  return `${indent}<navPoint id="${np.id}" playOrder="${np.playOrder}">
${indent}  <navLabel>
${indent}    <text>${np.label}</text>
${indent}  </navLabel>
${indent}  <content src="${np.src}"/>
${children ? "\n" + children + "\n" + indent : ""}
${indent}</navPoint>`;
}

function buildNcx(
  identifier: string,
  title: string,
  navPoints: NavPoint[],
): string {
  const navMap = navPoints
    .map((np) => buildNavPoint(np, "    "))
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${identifier}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${title}</text>
  </docTitle>
  <navMap>
${navMap}
  </navMap>
</ncx>
`;
}

function wrapXhtml(title: string, bodyContent: string, cssHref = "style.css"): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko">
<head>
  <meta http-equiv="Content-Type" content="application/xhtml+xml; charset=utf-8"/>
  <title>${title}</title>
  <link rel="stylesheet" type="text/css" href="${cssHref}"/>
</head>
<body>
${bodyContent}
</body>
</html>
`;
}

async function saveEpub(zip: JSZip, filename: string): Promise<void> {
  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
  const outPath = join(FIXTURES_DIR, filename);
  await writeFile(outPath, buffer);
  console.log(`  [OK] ${outPath}`);
}

// ---------------------------------------------------------------------------
// 1. Literature (소설) — 별이 빛나는 밤에
// ---------------------------------------------------------------------------

async function createLiteratureNovel(): Promise<void> {
  console.log("\n[1/3] 문학 소설: 별이 빛나는 밤에");

  const zip = new JSZip();
  addMimetype(zip);
  addContainerXml(zip);

  const identifier = "urn:uuid:a1b2c3d4-e5f6-7890-abcd-ef1234567890";
  const title = "별이 빛나는 밤에";

  // --- style.css ---
  zip.file(
    "OEBPS/style.css",
    `@charset "UTF-8";

/* 문학 소설용 기본 ePub 2.0 스타일 */
body {
  font-family: "Noto Serif KR", "Batang", serif;
  font-size: 1em;
  line-height: 1.8;
  margin: 1em;
  color: #1a1a1a;
  text-align: justify;
  word-break: keep-all;
}

h1 {
  font-size: 1.8em;
  text-align: center;
  margin: 2em 0 1em;
  font-weight: bold;
  letter-spacing: 0.05em;
}

h2 {
  font-size: 1.4em;
  text-align: center;
  margin: 1.5em 0 1em;
  font-weight: bold;
  border-bottom: 1px solid #ccc;
  padding-bottom: 0.3em;
}

p {
  text-indent: 1em;
  margin: 0.5em 0;
}

p.first {
  text-indent: 0;
}

.title-page {
  text-align: center;
  padding-top: 30%;
}

.title-page h1 {
  font-size: 2.2em;
  margin-bottom: 0.5em;
}

.title-page .author {
  font-size: 1.2em;
  color: #555;
  margin-top: 1em;
}

.title-page .genre {
  font-size: 0.9em;
  color: #888;
  margin-top: 0.5em;
}

.separator {
  text-align: center;
  margin: 2em 0;
  color: #aaa;
  font-size: 1.2em;
}
`,
  );

  // --- Title page ---
  zip.file(
    "OEBPS/title.xhtml",
    wrapXhtml(
      title,
      `<div class="title-page">
  <h1>별이 빛나는 밤에</h1>
  <p class="author">김서연 지음</p>
  <p class="genre">장편소설</p>
</div>
`,
    ),
  );

  // --- TOC page ---
  zip.file(
    "OEBPS/toc-page.xhtml",
    wrapXhtml(
      "목차",
      `<h1>목차</h1>
<ul>
  <li><a href="chapter1.xhtml">제1장 — 서울의 밤하늘</a></li>
  <li><a href="chapter2.xhtml">제2장 — 천문대에서의 만남</a></li>
  <li><a href="chapter3.xhtml">제3장 — 별이 빛나는 밤에</a></li>
</ul>
`,
    ),
  );

  // --- Chapter 1 ---
  zip.file(
    "OEBPS/chapter1.xhtml",
    wrapXhtml(
      "제1장 — 서울의 밤하늘",
      `<h2>제1장 — 서울의 밤하늘</h2>

<p class="first">지윤은 한강 둔치에 앉아 밤하늘을 올려다보았다. 서울의 하늘은 언제나 뿌옇게 흐려 있었다. 수천만 개의 불빛이 만들어낸 인공의 안개가 별빛을 삼켜버린 지 오래였다. 어린 시절 외할머니 댁 마당에서 보았던 은하수가 문득 그리워지는 밤이었다.</p>

<p>도시의 소음은 밤이 깊어도 잦아들 줄 몰랐다. 멀리서 자동차 경적 소리가 간간이 들려왔고, 강 건너편 아파트 단지의 불빛은 마치 땅 위에 내려앉은 별처럼 반짝이고 있었다. 지윤은 쓸쓸히 웃었다. 진짜 별은 볼 수 없으면서 가짜 별들로 둘러싸인 도시라니.</p>

<p>스마트폰에서 알림이 울렸다. 천문동호회 단체방에 누군가 사진을 올렸다. '오늘 밤 강원도 화천에서 찍은 겨울 은하수입니다.' 첨부된 사진 속에는 칠흑 같은 하늘을 수놓은 수백만 개의 별이 빛나고 있었다. 지윤의 심장이 두근거렸다.</p>

<p>그녀는 오래전부터 천체사진을 찍고 싶었다. 대학에서 물리학을 전공하던 시절, 천문학 수업에서 처음 망원경으로 토성의 고리를 보았을 때의 감동을 아직도 잊지 못했다. 하지만 졸업 후 IT 회사에 취직하면서 그 꿈은 서서히 잊혀져 갔다.</p>

<p>바람이 차가워지기 시작했다. 지윤은 코트 깃을 여미며 자리에서 일어났다. 걸음을 옮기면서도 자꾸 하늘을 올려다보았다. 흐린 하늘 너머 어딘가에 분명 별이 빛나고 있을 터였다. 그 별빛을 직접 보고 싶다는 마음이, 오랫동안 잠들어 있던 열망이 다시 깨어나고 있었다.</p>

<div class="separator">* * *</div>

<p>다음 날 아침, 지윤은 회사에서 모니터를 바라보면서도 계속 어젯밤 사진을 떠올렸다. 점심시간에 검색을 시작했다. '겨울 천체관측 명소', '별 사진 촬영법', '천문대 프로그램'. 검색 결과를 훑어보다가 눈이 멈춘 곳이 있었다. 영양 반딧불이 천문대에서 다음 주말에 특별 관측 행사를 연다는 공지였다.</p>

<p>지윤은 잠시 망설였다. 주말에 밀린 업무를 처리해야 했고, 영양까지는 서울에서 네 시간이 넘게 걸렸다. 하지만 사진 속 은하수가 자꾸 눈앞에 아른거렸다. 결국 그녀는 참가 신청 버튼을 눌렀다.</p>
`,
    ),
  );

  // --- Chapter 2 ---
  zip.file(
    "OEBPS/chapter2.xhtml",
    wrapXhtml(
      "제2장 — 천문대에서의 만남",
      `<h2>제2장 — 천문대에서의 만남</h2>

<p class="first">영양군 수비면의 밤은 서울과는 완전히 다른 세계였다. 지윤이 천문대 주차장에서 차에서 내렸을 때, 가장 먼저 느낀 것은 고요함이었다. 도시에서는 결코 경험할 수 없는 깊고 절대적인 침묵이 온몸을 감쌌다.</p>

<p>고개를 들어 하늘을 보는 순간, 지윤은 숨을 멈추었다. 하늘 가득 별이 쏟아지고 있었다. 그것은 사진으로 보았던 것과는 차원이 다른 광경이었다. 은하수가 하늘을 가로질러 흐르고 있었고, 수없이 많은 별들이 제각기 다른 밝기로 반짝이고 있었다. 눈물이 날 것 같았다.</p>

<p>"처음이세요?"</p>

<p>뒤에서 들려온 목소리에 지윤이 돌아보았다. 방한 재킷을 입은 남자가 삼각대와 카메라 가방을 들고 서 있었다. 서른 즈음으로 보이는 그는 따뜻한 미소를 짓고 있었다.</p>

<p>"네, 이런 하늘은 정말 처음이에요." 지윤이 다시 하늘을 올려다보며 말했다.</p>

<p>"이곳은 국내 최고의 별 관측지 중 하나예요. 광공해가 거의 없어서요." 남자가 지윤 옆에 서서 하늘을 가리켰다. "저기 보이는 게 오리온자리예요. 왼쪽 어깨에 붉게 빛나는 별이 베텔게우스이고, 오른쪽 발 아래 파랗게 빛나는 게 리겔이에요."</p>

<p>지윤은 남자가 가리키는 방향을 따라 시선을 옮겼다. 정말로, 별들 사이에서 붉은색과 푸른색이 구분되었다. 도시에서는 별 자체를 보기 어려웠는데, 여기서는 별의 색까지 구분할 수 있다니.</p>

<p>"저는 한준서라고 해요. 천체사진 찍으러 자주 오는 편이에요." 남자가 손을 내밀었다.</p>

<p>"이지윤이에요. 저도 천체사진에 관심이 있어서 왔어요. 아직 아무것도 모르지만요." 지윤이 손을 맞잡으며 웃었다.</p>

<div class="separator">* * *</div>

<p>천문대 관측실에서 해설사의 설명을 들으며, 지윤은 학부 시절의 기억이 새록새록 떠올랐다. 쌍성계, 성운, 성단에 대한 이야기가 귓가에 맴돌았다. 준서는 해설이 끝난 후 지윤에게 자신의 카메라로 찍은 사진들을 보여주었다.</p>

<p>"이건 지난달에 찍은 안드로메다 은하예요. 250만 광년 떨어져 있는데, 맑은 날에는 맨눈으로도 희미하게 보여요."</p>

<p>카메라 화면 속 안드로메다 은하는 나선형 팔을 우아하게 펼치고 있었다. 지윤은 그 아름다움에 넋을 잃었다. 동시에, 이 빛이 250만 년 전에 출발한 것이라는 사실에 아득한 경외감을 느꼈다.</p>

<p>"저도 이런 사진을 찍을 수 있을까요?" 지윤이 조심스럽게 물었다.</p>

<p>"물론이죠. 처음에는 삼각대와 카메라만 있으면 돼요. 제가 기초부터 알려드릴게요." 준서의 눈이 반짝였다.</p>
`,
    ),
  );

  // --- Chapter 3 ---
  zip.file(
    "OEBPS/chapter3.xhtml",
    wrapXhtml(
      "제3장 — 별이 빛나는 밤에",
      `<h2>제3장 — 별이 빛나는 밤에</h2>

<p class="first">그 후로 지윤의 주말은 완전히 바뀌었다. 준서에게 천체사진의 기초를 배우면서, 그녀는 매주 서울 근교의 관측지를 찾아다녔다. 가평, 양평, 포천의 어두운 밤하늘 아래서 카메라 셔터를 누를 때마다 새로운 세계가 열렸다.</p>

<p>처음 찍은 사진은 초점도 맞지 않고 노출도 엉망이었다. 하지만 화면 한구석에 희미하게 잡힌 오리온 대성운의 분홍빛 가스 구름을 발견했을 때, 지윤은 환호성을 질렀다. 그 작은 성공이 더 큰 열정으로 이어졌다.</p>

<p>봄이 오면서 겨울 은하수는 서서히 모습을 감추었지만, 대신 봄의 별자리가 하늘을 채워갔다. 사자자리, 처녀자리, 목동자리가 차례로 떠오르면서 계절이 바뀌고 있음을 하늘이 알려주었다. 지윤은 별자리가 계절의 시계 같다는 것을 처음으로 실감했다.</p>

<p>회사에서의 일상도 조금씩 변했다. 예전에는 야근 후 피곤한 발걸음으로 귀가하던 길이, 이제는 하늘을 올려다보는 시간이 되었다. 서울의 뿌연 하늘 너머로 가장 밝은 별 몇 개가 보이는 밤이면, 지윤은 그 별의 이름을 속으로 불렀다. 시리우스, 아크투루스, 직녀성.</p>

<p>어느 여름밤, 지윤과 준서는 지리산 노고단에서 여름 은하수를 촬영하고 있었다. 궁수자리 방향으로 은하수의 중심부가 찬란하게 빛나고 있었다. 삼각대 위의 카메라가 30초 동안 하늘의 빛을 모으는 사이, 두 사람은 나란히 앉아 하늘을 바라보았다.</p>

<div class="separator">* * *</div>

<p>"지윤 씨, 저 별빛이 우리 눈에 도달하기까지 수백 년, 수천 년이 걸린 거예요." 준서가 조용히 말했다. "지금 우리가 보는 이 빛은 조선시대에, 혹은 그보다 훨씬 전에 출발한 거죠."</p>

<p>"그러니까 우리는 지금 과거의 빛을 보고 있는 거네요." 지윤이 대답했다.</p>

<p>"맞아요. 별을 본다는 건 시간여행을 하는 거예요. 그리고 그 빛이 수천 년을 여행해서 바로 우리 눈에 닿았다는 건, 어떻게 보면 기적 같은 일이에요."</p>

<p>지윤은 준서의 말을 가만히 되새겼다. 수천 광년 떨어진 별에서 출발한 빛이 끝없는 우주를 가로질러 이 작은 산꼭대기에 앉아 있는 자신의 눈에 닿았다는 사실. 그것은 정말로 경이로운 일이었다.</p>

<p>카메라의 셔터가 닫히는 소리가 적막을 깨뜨렸다. 지윤이 카메라 화면을 확인했다. 은하수가 선명하게 찍혀 있었다. 수백만 개의 별이 만들어낸 빛의 강이 화면 가득 흐르고 있었다. 가장 아름다운 밤이었다.</p>

<p>지윤은 문득 깨달았다. 자신이 찾고 있던 것은 단순히 아름다운 별 사진이 아니었다. 도시의 불빛과 소음에 가려져 잊고 있었던, 우주 속 자신의 존재를 다시 느끼는 것이었다. 별이 빛나는 밤은 그녀에게 잃어버린 경이로움을 되돌려주었다.</p>

<p>노고단의 바람이 두 사람의 머리카락을 흩날렸다. 하늘에서는 유성 하나가 긴 꼬리를 그으며 스쳐 지나갔다. 지윤은 소원을 빌지 않았다. 이미 가장 아름다운 밤 한가운데에 있었으니까.</p>
`,
    ),
  );

  // --- content.opf ---
  zip.file(
    "OEBPS/content.opf",
    buildOpf(
      {
        title,
        creator: "김서연",
        identifier,
        description: "서울의 밤하늘 아래서 시작된 한 여성의 천체관측 이야기",
        publisher: "하얀마인드 출판사",
        date: "2025-12-01",
        subject: "소설, 문학, 한국소설",
      },
      [
        { id: "style", href: "style.css", mediaType: "text/css" },
        { id: "title-page", href: "title.xhtml", mediaType: "application/xhtml+xml" },
        { id: "toc-page", href: "toc-page.xhtml", mediaType: "application/xhtml+xml" },
        { id: "chapter1", href: "chapter1.xhtml", mediaType: "application/xhtml+xml" },
        { id: "chapter2", href: "chapter2.xhtml", mediaType: "application/xhtml+xml" },
        { id: "chapter3", href: "chapter3.xhtml", mediaType: "application/xhtml+xml" },
      ],
      [
        { idref: "title-page" },
        { idref: "toc-page" },
        { idref: "chapter1" },
        { idref: "chapter2" },
        { idref: "chapter3" },
      ],
    ),
  );

  // --- toc.ncx ---
  zip.file(
    "OEBPS/toc.ncx",
    buildNcx(identifier, title, [
      { id: "navpoint-1", playOrder: 1, label: "표지", src: "title.xhtml" },
      { id: "navpoint-2", playOrder: 2, label: "목차", src: "toc-page.xhtml" },
      { id: "navpoint-3", playOrder: 3, label: "제1장 — 서울의 밤하늘", src: "chapter1.xhtml" },
      { id: "navpoint-4", playOrder: 4, label: "제2장 — 천문대에서의 만남", src: "chapter2.xhtml" },
      { id: "navpoint-5", playOrder: 5, label: "제3장 — 별이 빛나는 밤에", src: "chapter3.xhtml" },
    ]),
  );

  await saveEpub(zip, "literature-novel.epub");
}

// ---------------------------------------------------------------------------
// 2. Education (교재) — 초등 과학 탐구
// ---------------------------------------------------------------------------

async function createEducationScience(): Promise<void> {
  console.log("\n[2/3] 교육 교재: 초등 과학 탐구");

  const zip = new JSZip();
  addMimetype(zip);
  addContainerXml(zip);

  const identifier = "urn:uuid:b2c3d4e5-f6a7-8901-bcde-f23456789012";
  const title = "초등 과학 탐구";

  // --- Placeholder image (1x1 white PNG) ---
  const placeholderPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "base64",
  );
  zip.file("OEBPS/images/placeholder-solar-system.png", placeholderPng);
  zip.file("OEBPS/images/placeholder-water-cycle.png", placeholderPng);
  zip.file("OEBPS/images/placeholder-photosynthesis.png", placeholderPng);
  zip.file("OEBPS/images/placeholder-experiment.png", placeholderPng);

  // --- style.css ---
  zip.file(
    "OEBPS/style.css",
    `@charset "UTF-8";

/* 교육 교재용 ePub 2.0 스타일 */
body {
  font-family: "Noto Sans KR", "Malgun Gothic", sans-serif;
  font-size: 1em;
  line-height: 1.7;
  margin: 1em;
  color: #222;
  word-break: keep-all;
}

h1 {
  font-size: 1.8em;
  color: #1a5276;
  text-align: center;
  margin: 1.5em 0 1em;
  padding-bottom: 0.3em;
  border-bottom: 3px solid #1a5276;
}

h2 {
  font-size: 1.4em;
  color: #2e86c1;
  margin: 1.5em 0 0.5em;
  padding-left: 0.5em;
  border-left: 4px solid #2e86c1;
}

h3 {
  font-size: 1.2em;
  color: #2874a6;
  margin: 1em 0 0.5em;
}

p {
  margin: 0.5em 0;
  text-align: justify;
}

img {
  max-width: 100%;
  display: block;
  margin: 1em auto;
}

.caption {
  text-align: center;
  font-size: 0.9em;
  color: #666;
  font-style: italic;
  margin-top: -0.5em;
  margin-bottom: 1em;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  font-size: 0.95em;
}

th {
  background-color: #2e86c1;
  color: white;
  padding: 0.5em;
  text-align: center;
  border: 1px solid #1a5276;
}

td {
  padding: 0.5em;
  border: 1px solid #ccc;
  text-align: center;
}

tr:nth-child(even) {
  background-color: #eaf2f8;
}

ul, ol {
  margin: 0.5em 0 0.5em 1.5em;
}

li {
  margin: 0.3em 0;
}

.learning-objective {
  background-color: #eaf2f8;
  border: 1px solid #2e86c1;
  border-radius: 5px;
  padding: 1em;
  margin: 1em 0;
}

.learning-objective h3 {
  color: #1a5276;
  margin-top: 0;
}

.experiment-box {
  background-color: #fef9e7;
  border: 2px solid #f39c12;
  border-radius: 5px;
  padding: 1em;
  margin: 1em 0;
}

.experiment-box h3 {
  color: #e67e22;
  margin-top: 0;
}

.key-term {
  font-weight: bold;
  color: #1a5276;
}

.note {
  background-color: #fdedec;
  border-left: 4px solid #e74c3c;
  padding: 0.5em 1em;
  margin: 1em 0;
  font-size: 0.95em;
}

.review-question {
  background-color: #f4ecf7;
  border: 1px solid #8e44ad;
  border-radius: 5px;
  padding: 1em;
  margin: 1em 0;
}

.title-page {
  text-align: center;
  padding-top: 20%;
}

.title-page h1 {
  border-bottom: none;
  font-size: 2em;
}

.title-page .subtitle {
  font-size: 1.3em;
  color: #2e86c1;
  margin-top: 0.5em;
}

.title-page .info {
  font-size: 1em;
  color: #666;
  margin-top: 2em;
}
`,
  );

  // --- Title page ---
  zip.file(
    "OEBPS/title.xhtml",
    wrapXhtml(
      title,
      `<div class="title-page">
  <h1>초등 과학 탐구</h1>
  <p class="subtitle">3~4학년 과학 교과 보충 교재</p>
  <p class="info">박정민 지음</p>
  <p class="info">하얀마인드 교육연구소</p>
</div>
`,
    ),
  );

  // --- TOC page ---
  zip.file(
    "OEBPS/toc-page.xhtml",
    wrapXhtml(
      "목차",
      `<h1>목차</h1>
<ul>
  <li>
    <a href="unit1-intro.xhtml">제1단원: 태양계와 우주</a>
    <ul>
      <li><a href="unit1-intro.xhtml">1-1. 태양계의 구성</a></li>
      <li><a href="unit1-planets.xhtml">1-2. 행성의 특징</a></li>
      <li><a href="unit1-review.xhtml">1단원 정리 및 탐구 활동</a></li>
    </ul>
  </li>
  <li>
    <a href="unit2-intro.xhtml">제2단원: 물의 순환</a>
    <ul>
      <li><a href="unit2-intro.xhtml">2-1. 물의 상태 변화</a></li>
      <li><a href="unit2-cycle.xhtml">2-2. 자연 속 물의 순환</a></li>
      <li><a href="unit2-review.xhtml">2단원 정리 및 탐구 활동</a></li>
    </ul>
  </li>
</ul>
`,
    ),
  );

  // --- Unit 1: Section 1 ---
  zip.file(
    "OEBPS/unit1-intro.xhtml",
    wrapXhtml(
      "1-1. 태양계의 구성",
      `<h1>제1단원: 태양계와 우주</h1>

<div class="learning-objective">
  <h3>학습 목표</h3>
  <ul>
    <li>태양계를 구성하는 천체의 종류를 설명할 수 있다.</li>
    <li>태양의 역할과 특징을 이해할 수 있다.</li>
    <li>행성의 분류 기준을 알고 구분할 수 있다.</li>
  </ul>
</div>

<h2>1-1. 태양계의 구성</h2>

<p>우리가 살고 있는 지구는 <span class="key-term">태양계</span>에 속해 있습니다. 태양계는 태양을 중심으로 그 주위를 도는 여러 천체로 이루어져 있습니다. 태양계에는 8개의 행성, 수많은 위성, 소행성, 혜성, 유성체 등이 포함됩니다.</p>

<img src="images/placeholder-solar-system.png" alt="태양계의 구성을 보여주는 모식도. 태양을 중심으로 수성, 금성, 지구, 화성, 목성, 토성, 천왕성, 해왕성이 차례로 배치되어 있다."/>
<p class="caption">[그림 1-1] 태양계 모식도</p>

<h3>태양</h3>

<p>태양은 태양계의 중심에 있는 <span class="key-term">항성</span>(스스로 빛을 내는 별)입니다. 태양의 지름은 약 139만 킬로미터로 지구의 약 109배에 달합니다. 태양의 표면 온도는 약 5,500도이며, 중심부는 약 1,500만 도에 이릅니다.</p>

<p>태양은 태양계 전체 질량의 약 99.86%를 차지합니다. 태양의 강력한 중력이 모든 행성과 천체를 붙잡아 태양 주위를 돌게 합니다. 또한 태양에서 나오는 빛과 열은 지구의 모든 생명에게 에너지를 공급합니다.</p>

<h3>행성의 분류</h3>

<p>태양계의 8개 행성은 크게 두 종류로 나눌 수 있습니다.</p>

<ul>
  <li><span class="key-term">지구형 행성</span>(암석형 행성): 수성, 금성, 지구, 화성 — 단단한 암석 표면을 가지고 있으며 크기가 비교적 작습니다.</li>
  <li><span class="key-term">목성형 행성</span>(가스 행성): 목성, 토성, 천왕성, 해왕성 — 주로 가스로 이루어져 있으며 크기가 매우 큽니다.</li>
</ul>

<div class="note">
  <strong>알고 가기!</strong> 명왕성은 2006년에 국제천문연맹(IAU)에 의해 '왜소행성'으로 재분류되었습니다. 따라서 현재 태양계의 행성은 8개입니다.
</div>

<p>태양에서 가까운 순서대로 행성을 나열하면 수성, 금성, 지구, 화성, 목성, 토성, 천왕성, 해왕성입니다. 이를 쉽게 외우는 방법으로 "수금지화목토천해"라는 말을 사용합니다.</p>
`,
    ),
  );

  // --- Unit 1: Section 2 (Planets table) ---
  // Intentional issues: empty <span></span> tags, inconsistent formatting
  zip.file(
    "OEBPS/unit1-planets.xhtml",
    wrapXhtml(
      "1-2. 행성의 특징",
      `<h2>1-2. 행성의 특징</h2>

<p>각 행성은 고유한 특징을 가지고 있습니다. 아래 표에서 태양계 행성들의 주요 특징을 비교해 봅시다.<span></span></p>

<table>
  <tr>
    <th>행성</th>
    <th>분류</th>
    <th>지름(km)</th>
    <th>태양까지 거리(AU)</th>
    <th>공전 주기</th>
    <th>위성 수</th>
  </tr>
  <tr>
    <td>수성</td>
    <td>지구형</td>
    <td>4,879</td>
    <td>0.39</td>
    <td>88일</td>
    <td>0</td>
  </tr>
  <tr>
    <td>금성</td>
    <td>지구형</td>
    <td>12,104</td>
    <td>0.72</td>
    <td>225일</td>
    <td>0</td>
  </tr>
  <tr>
    <td>지구</td>
    <td>지구형</td>
    <td>12,756</td>
    <td>1.00</td>
    <td>365일</td>
    <td>1</td>
  </tr>
  <tr>
    <td>화성</td>
    <td>지구형</td>
    <td>6,792</td>
    <td>1.52</td>
    <td>687일</td>
    <td>2</td>
  </tr>
  <tr>
    <td>목성</td>
    <td>목성형</td>
    <td>142,984</td>
    <td>5.20</td>
    <td>12년</td>
    <td>95</td>
  </tr>
  <tr>
    <td>토성</td>
    <td>목성형</td>
    <td>120,536</td>
    <td>9.58</td>
    <td>29년</td>
    <td>146</td>
  </tr>
  <tr>
    <td>천왕성</td>
    <td>목성형</td>
    <td>51,118</td>
    <td>19.22</td>
    <td>84년</td>
    <td>28</td>
  </tr>
  <tr>
    <td>해왕성</td>
    <td>목성형</td>
    <td>49,528</td>
    <td>30.05</td>
    <td>165년</td>
    <td>16</td>
  </tr>
</table>

<p><span></span></p>

<h3>지구형 행성의 특징</h3>

<p><span class="key-term">수성</span>은 태양에 가장 가까운 행성으로, 대기가 거의 없어 낮과 밤의 온도 차이가 매우 큽니다. 낮에는 약 430도까지 올라가고, 밤에는 영하 180도까지 내려갑니다.</p>

<p><span class="key-term">금성</span>은 지구와 크기가 비슷하여 '지구의 쌍둥이'라고 불리지만, 두꺼운 이산화탄소 대기 때문에 표면 온도가 약 470도에 달합니다. 이것은 <span class="key-term">온실 효과</span>의 극단적인 예입니다.</p>

<p><span class="key-term">지구</span>는 태양계에서 유일하게 액체 상태의 물이 존재하는 행성입니다. 적절한 온도와 대기, 물의 존재가 생명체가 살 수 있는 환경을 만들어 줍니다.<span></span></p>

<p><span class="key-term">화성</span>은 표면의 산화철 때문에 붉은색을 띠어 '붉은 행성'이라 불립니다. 과거에 물이 흘렀던 흔적이 발견되어 생명체 존재 가능성에 대한 연구가 활발히 진행되고 있습니다.</p>

<h3>목성형 행성의 특징</h3>

<p><span class="key-term">목성</span>은 태양계에서 가장 큰 행성으로, 대적점이라 불리는 거대한 폭풍이 수백 년째 계속되고 있습니다. 목성은 주로 수소와 헬륨으로 이루어져 있습니다.</p>

<p><span class="key-term">토성</span>은 아름다운 고리로 유명합니다. 이 고리는 얼음과 암석 조각으로 이루어져 있으며, 밀도가 매우 낮아 물에 띄울 수 있을 만큼 가볍습니다.</p>

<p><div></div><span class="key-term">천왕성</span>은 자전축이 거의 옆으로 누워 있어 마치 굴러가듯 공전합니다. 이 독특한 기울기 때문에 극지방이 태양을 향하는 계절이 있습니다.</p>

<p><span class="key-term">해왕성</span>은 태양에서 가장 먼 행성으로, 태양계에서 가장 강한 바람이 붑니다. 풍속이 시속 2,000킬로미터에 달하기도 합니다.</p>
`,
    ),
  );

  // --- Unit 1: Review ---
  zip.file(
    "OEBPS/unit1-review.xhtml",
    wrapXhtml(
      "1단원 정리 및 탐구 활동",
      `<h2>1단원 정리 및 탐구 활동</h2>

<h3>단원 핵심 정리</h3>
<ol>
  <li>태양계는 태양을 중심으로 8개의 행성, 위성, 소행성, 혜성 등으로 구성되어 있다.</li>
  <li>태양은 태양계 질량의 약 99.86%를 차지하는 항성이다.</li>
  <li>행성은 지구형 행성(수성, 금성, 지구, 화성)과 목성형 행성(목성, 토성, 천왕성, 해왕성)으로 분류된다.</li>
  <li>지구형 행성은 암석으로 이루어져 있고, 목성형 행성은 주로 가스로 이루어져 있다.</li>
</ol>

<div class="experiment-box">
  <h3>탐구 활동: 태양계 축소 모형 만들기</h3>

  <img src="images/placeholder-experiment.png" alt="태양계 축소 모형 만들기 활동 예시 사진"/>
  <p class="caption">[활동 사진] 태양계 축소 모형</p>

  <p><strong>준비물:</strong> 다양한 크기의 공(탁구공, 테니스공, 농구공 등), 실, 색종이, 풀, 가위</p>

  <p><strong>활동 순서:</strong></p>
  <ol>
    <li>교실이나 운동장에서 태양 역할을 할 큰 공을 중앙에 놓는다.</li>
    <li>각 행성의 상대적 크기에 맞는 공을 선택한다.</li>
    <li>태양에서의 거리 비율에 맞게 행성을 배치한다.</li>
    <li>각 행성의 특징을 색종이에 적어 행성 옆에 붙인다.</li>
    <li>완성된 모형을 관찰하고 느낀 점을 발표한다.</li>
  </ol>

  <p><strong>생각해 봅시다:</strong></p>
  <ul>
    <li>태양과 행성의 크기 차이를 직접 보니 어떤 느낌이 드나요?</li>
    <li>행성 사이의 거리는 예상보다 어땠나요?</li>
    <li>지구형 행성과 목성형 행성의 크기 차이는 어느 정도인가요?</li>
  </ul>
</div>

<div class="review-question">
  <h3>확인 문제</h3>
  <ol>
    <li>태양계를 구성하는 8개 행성을 태양에서 가까운 순서대로 나열하시오.</li>
    <li>지구형 행성과 목성형 행성의 차이점을 두 가지 이상 설명하시오.</li>
    <li>금성의 표면 온도가 수성보다 높은 이유를 설명하시오.</li>
    <li>다음 중 목성형 행성에 해당하지 않는 것은? (가) 목성 (나) 토성 (다) 화성 (라) 해왕성</li>
  </ol>
</div>
`,
    ),
  );

  // --- Unit 2: Section 1 ---
  zip.file(
    "OEBPS/unit2-intro.xhtml",
    wrapXhtml(
      "2-1. 물의 상태 변화",
      `<h1>제2단원: 물의 순환</h1>

<div class="learning-objective">
  <h3>학습 목표</h3>
  <ul>
    <li>물의 세 가지 상태(고체, 액체, 기체)를 이해할 수 있다.</li>
    <li>물의 상태 변화가 일어나는 조건을 설명할 수 있다.</li>
    <li>일상생활에서 물의 상태 변화 예시를 찾을 수 있다.</li>
  </ul>
</div>

<h2>2-1. 물의 상태 변화</h2>

<p>우리 주변에서 가장 흔히 볼 수 있는 물질 중 하나인 <span class="key-term">물</span>은 온도에 따라 세 가지 상태로 변합니다. 고체 상태인 <span class="key-term">얼음</span>, 액체 상태인 <span class="key-term">물</span>, 기체 상태인 <span class="key-term">수증기</span>가 바로 그것입니다.</p>

<h3>물의 세 가지 상태</h3>

<table>
  <tr>
    <th>상태</th>
    <th>모양</th>
    <th>부피</th>
    <th>입자 배열</th>
    <th>일상 예시</th>
  </tr>
  <tr>
    <td>고체 (얼음)</td>
    <td>일정함</td>
    <td>일정함</td>
    <td>규칙적, 촘촘</td>
    <td>얼음, 서리, 눈</td>
  </tr>
  <tr>
    <td>액체 (물)</td>
    <td>담긴 그릇에 따라 변함</td>
    <td>일정함</td>
    <td>불규칙적, 비교적 가까움</td>
    <td>수돗물, 빗물, 강물</td>
  </tr>
  <tr>
    <td>기체 (수증기)</td>
    <td>일정하지 않음</td>
    <td>일정하지 않음</td>
    <td>불규칙적, 매우 멀리 떨어짐</td>
    <td>김, 안개, 구름 속 수증기</td>
  </tr>
</table>

<h3>상태 변화의 종류</h3>

<p>물은 열을 받거나 잃으면서 상태가 변합니다. 이러한 변화를 <span class="key-term">상태 변화</span>라고 합니다.</p>

<ul>
  <li><strong>융해(녹음)</strong>: 고체 → 액체 (얼음이 녹아 물이 됨)</li>
  <li><strong>응고(얼음)</strong>: 액체 → 고체 (물이 얼어 얼음이 됨)</li>
  <li><strong>기화(증발·끓음)</strong>: 액체 → 기체 (물이 수증기로 변함)</li>
  <li><strong>액화(응결)</strong>: 기체 → 액체 (수증기가 물방울로 변함)</li>
  <li><strong>승화</strong>: 고체 → 기체 (드라이아이스가 직접 기체로 변함)</li>
</ul>

<div class="note">
  <strong>생각해 봅시다!</strong> 빨래가 마르는 것은 어떤 상태 변화에 해당할까요? 젖은 빨래의 물이 수증기로 변해 공기 중으로 날아가는 것이므로, 기화(증발)에 해당합니다.
</div>

<p>물의 <span class="key-term">끓는점</span>은 100도(1기압 기준)이고, <span class="key-term">어는점</span>은 0도입니다. 하지만 이 온도는 기압에 따라 달라질 수 있습니다. 예를 들어, 높은 산 위에서는 기압이 낮아 물이 100도보다 낮은 온도에서 끓습니다.</p>

<div class="experiment-box">
  <h3>간단 실험: 물의 상태 변화 관찰하기</h3>
  <p><strong>준비물:</strong> 비커, 알코올 램프, 삼발이, 석면판, 온도계, 얼음</p>
  <ol>
    <li>비커에 얼음을 넣고 알코올 램프로 가열합니다.</li>
    <li>온도계로 온도 변화를 1분 간격으로 기록합니다.</li>
    <li>얼음이 녹기 시작하는 온도, 물이 끓기 시작하는 온도를 확인합니다.</li>
    <li>온도-시간 그래프를 그려 봅니다.</li>
  </ol>
  <p><strong>주의:</strong> 알코올 램프 사용 시 선생님의 지도 아래에서 실험합니다.</p>
</div>
`,
    ),
  );

  // --- Unit 2: Section 2 ---
  zip.file(
    "OEBPS/unit2-cycle.xhtml",
    wrapXhtml(
      "2-2. 자연 속 물의 순환",
      `<h2>2-2. 자연 속 물의 순환</h2>

<p>지구의 물은 끊임없이 순환합니다. 바다, 강, 호수의 물이 증발하여 구름이 되고, 구름에서 비나 눈이 내려 다시 땅으로 돌아옵니다. 이러한 과정을 <span class="key-term">물의 순환</span>(수순환)이라고 합니다.</p>

<img src="images/placeholder-water-cycle.png" alt="물의 순환 과정을 보여주는 그림. 바다에서 증발한 물이 구름이 되고, 비가 되어 내린 후 강을 통해 다시 바다로 돌아가는 과정이 화살표로 표시되어 있다."/>
<p class="caption">[그림 2-1] 물의 순환 과정</p>

<h3>물의 순환 과정</h3>

<ol>
  <li><strong>증발</strong>: 태양 에너지에 의해 바다, 강, 호수 등의 물이 수증기로 변합니다. 지구 표면 물의 약 86%가 바다에서 증발합니다.</li>
  <li><strong>응결과 구름 형성</strong>: 수증기가 높은 하늘로 올라가면 차가운 공기를 만나 작은 물방울이나 얼음 알갱이로 변합니다. 이것들이 모여 구름이 됩니다.</li>
  <li><strong>강수</strong>: 구름 속 물방울이나 얼음이 커지면 비, 눈, 우박 등의 형태로 땅에 내립니다. 이를 <span class="key-term">강수</span>라고 합니다.</li>
  <li><strong>유출과 침투</strong>: 땅에 내린 물은 일부가 강이나 하천을 통해 바다로 흘러가고(유출), 일부는 땅속으로 스며듭니다(침투).</li>
  <li><strong>지하수</strong>: 땅속으로 스며든 물은 <span class="key-term">지하수</span>가 되어 천천히 이동하다가 샘이나 강으로 다시 나옵니다.</li>
</ol>

<h3>물의 순환이 중요한 이유</h3>

<p>물의 순환은 지구의 기후를 조절하고, 생물이 살아가는 데 필요한 물을 공급합니다. 만약 물의 순환이 멈추면 어떻게 될까요?</p>

<ul>
  <li>비가 내리지 않아 강과 호수가 마르게 됩니다.</li>
  <li>식물이 말라 죽고, 동물도 물을 구할 수 없게 됩니다.</li>
  <li>기후가 극단적으로 변하게 됩니다.</li>
  <li>인간도 식수와 농업용수를 구할 수 없게 됩니다.</li>
</ul>

<h3>식물과 물의 순환</h3>

<img src="images/placeholder-photosynthesis.png" alt="식물의 증산 작용을 보여주는 그림. 뿌리로 흡수한 물이 줄기를 통해 잎까지 이동하고, 잎의 기공을 통해 수증기로 배출되는 과정이 표시되어 있다."/>
<p class="caption">[그림 2-2] 식물의 증산 작용</p>

<p>식물도 물의 순환에 중요한 역할을 합니다. 식물의 뿌리가 흡수한 물은 줄기를 통해 잎까지 이동합니다. 잎에서는 <span class="key-term">증산 작용</span>을 통해 수증기를 공기 중으로 내보냅니다. 열대우림에서는 증산 작용으로 배출되는 수증기가 전체 수증기의 상당 부분을 차지합니다.</p>

<div class="note">
  <strong>환경 이야기!</strong> 지구온난화로 인해 물의 순환이 빨라지고 있습니다. 이로 인해 어떤 지역에서는 홍수가, 다른 지역에서는 가뭄이 더 심해지고 있습니다. 물을 아끼는 것은 환경을 보호하는 일이기도 합니다.
</div>
`,
    ),
  );

  // --- Unit 2: Review ---
  zip.file(
    "OEBPS/unit2-review.xhtml",
    wrapXhtml(
      "2단원 정리 및 탐구 활동",
      `<h2>2단원 정리 및 탐구 활동</h2>

<h3>단원 핵심 정리</h3>
<ol>
  <li>물은 고체(얼음), 액체(물), 기체(수증기) 세 가지 상태로 존재한다.</li>
  <li>물의 상태 변화에는 융해, 응고, 기화, 액화, 승화가 있다.</li>
  <li>물은 증발 → 응결 → 강수 → 유출/침투의 과정을 거쳐 끊임없이 순환한다.</li>
  <li>물의 순환은 지구의 기후 조절과 생물의 생존에 필수적이다.</li>
  <li>식물의 증산 작용도 물의 순환에 기여한다.</li>
</ol>

<div class="experiment-box">
  <h3>탐구 활동: 간이 물의 순환 장치 만들기</h3>
  <p><strong>준비물:</strong> 큰 투명 용기(또는 어항), 작은 컵, 랩, 얼음, 따뜻한 물, 식용 색소</p>
  <ol>
    <li>큰 투명 용기에 따뜻한 물을 부어 넣는다 (바다 역할).</li>
    <li>식용 색소를 몇 방울 넣어 물을 관찰하기 쉽게 한다.</li>
    <li>용기 안에 작은 빈 컵을 놓는다 (육지 역할).</li>
    <li>용기 위를 랩으로 밀봉한다.</li>
    <li>랩 위에 얼음을 올려놓는다 (차가운 대기 역할).</li>
    <li>따뜻한 곳에 두고 30분~1시간 관찰한다.</li>
  </ol>

  <p><strong>관찰 포인트:</strong></p>
  <ul>
    <li>랩 아래쪽에 물방울이 맺히는 것을 관찰한다 (응결/구름 형성).</li>
    <li>물방울이 떨어지는 것을 관찰한다 (강수/비).</li>
    <li>작은 컵에 물이 모이는지 확인한다 (유출).</li>
  </ul>
</div>

<div class="review-question">
  <h3>확인 문제</h3>
  <ol>
    <li>물의 세 가지 상태와 각 상태에서의 입자 배열 특징을 설명하시오.</li>
    <li>물의 순환 과정을 순서대로 나열하고, 각 단계에서 일어나는 상태 변화를 쓰시오.</li>
    <li>추운 겨울날 유리창에 물방울이 맺히는 현상은 어떤 상태 변화에 해당하나요?</li>
    <li>식물의 증산 작용이 물의 순환에서 하는 역할을 설명하시오.</li>
    <li>물의 순환이 멈추면 지구 환경에 어떤 변화가 일어날지 세 가지 이상 쓰시오.</li>
  </ol>
</div>
`,
    ),
  );

  // --- content.opf ---
  zip.file(
    "OEBPS/content.opf",
    buildOpf(
      {
        title,
        creator: "박정민",
        identifier,
        description: "초등학교 3~4학년 대상 과학 탐구 보충 교재",
        publisher: "하얀마인드 교육연구소",
        date: "2025-09-15",
        subject: "교육, 과학, 초등교육",
      },
      [
        { id: "style", href: "style.css", mediaType: "text/css" },
        { id: "title-page", href: "title.xhtml", mediaType: "application/xhtml+xml" },
        { id: "toc-page", href: "toc-page.xhtml", mediaType: "application/xhtml+xml" },
        { id: "unit1-intro", href: "unit1-intro.xhtml", mediaType: "application/xhtml+xml" },
        { id: "unit1-planets", href: "unit1-planets.xhtml", mediaType: "application/xhtml+xml" },
        { id: "unit1-review", href: "unit1-review.xhtml", mediaType: "application/xhtml+xml" },
        { id: "unit2-intro", href: "unit2-intro.xhtml", mediaType: "application/xhtml+xml" },
        { id: "unit2-cycle", href: "unit2-cycle.xhtml", mediaType: "application/xhtml+xml" },
        { id: "unit2-review", href: "unit2-review.xhtml", mediaType: "application/xhtml+xml" },
        { id: "img-solar", href: "images/placeholder-solar-system.png", mediaType: "image/png" },
        { id: "img-water", href: "images/placeholder-water-cycle.png", mediaType: "image/png" },
        { id: "img-photo", href: "images/placeholder-photosynthesis.png", mediaType: "image/png" },
        { id: "img-experiment", href: "images/placeholder-experiment.png", mediaType: "image/png" },
      ],
      [
        { idref: "title-page" },
        { idref: "toc-page" },
        { idref: "unit1-intro" },
        { idref: "unit1-planets" },
        { idref: "unit1-review" },
        { idref: "unit2-intro" },
        { idref: "unit2-cycle" },
        { idref: "unit2-review" },
      ],
    ),
  );

  // --- toc.ncx ---
  zip.file(
    "OEBPS/toc.ncx",
    buildNcx(identifier, title, [
      { id: "navpoint-1", playOrder: 1, label: "표지", src: "title.xhtml" },
      { id: "navpoint-2", playOrder: 2, label: "목차", src: "toc-page.xhtml" },
      {
        id: "navpoint-3",
        playOrder: 3,
        label: "제1단원: 태양계와 우주",
        src: "unit1-intro.xhtml",
        children: [
          { id: "navpoint-3-1", playOrder: 4, label: "1-1. 태양계의 구성", src: "unit1-intro.xhtml" },
          { id: "navpoint-3-2", playOrder: 5, label: "1-2. 행성의 특징", src: "unit1-planets.xhtml" },
          { id: "navpoint-3-3", playOrder: 6, label: "1단원 정리 및 탐구 활동", src: "unit1-review.xhtml" },
        ],
      },
      {
        id: "navpoint-4",
        playOrder: 7,
        label: "제2단원: 물의 순환",
        src: "unit2-intro.xhtml",
        children: [
          { id: "navpoint-4-1", playOrder: 8, label: "2-1. 물의 상태 변화", src: "unit2-intro.xhtml" },
          { id: "navpoint-4-2", playOrder: 9, label: "2-2. 자연 속 물의 순환", src: "unit2-cycle.xhtml" },
          { id: "navpoint-4-3", playOrder: 10, label: "2단원 정리 및 탐구 활동", src: "unit2-review.xhtml" },
        ],
      },
    ]),
  );

  await saveEpub(zip, "education-science.epub");
}

// ---------------------------------------------------------------------------
// 3. Children (유아동) — 한글 놀이: ㄱ부터 ㅎ까지
// ---------------------------------------------------------------------------

async function createChildrenPhonics(): Promise<void> {
  console.log("\n[3/3] 유아동 파닉스: 한글 놀이 — ㄱ부터 ㅎ까지");

  const zip = new JSZip();
  addMimetype(zip);
  addContainerXml(zip);

  const identifier = "urn:uuid:c3d4e5f6-a7b8-9012-cdef-345678901234";
  const title = "한글 놀이: ㄱ부터 ㅎ까지";

  // --- Placeholder image ---
  const placeholderPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "base64",
  );
  zip.file("OEBPS/images/placeholder-giyeok.png", placeholderPng);
  zip.file("OEBPS/images/placeholder-nieun.png", placeholderPng);
  zip.file("OEBPS/images/placeholder-digeut.png", placeholderPng);
  zip.file("OEBPS/images/placeholder-rieul.png", placeholderPng);
  zip.file("OEBPS/images/placeholder-mieum.png", placeholderPng);
  zip.file("OEBPS/images/placeholder-bieup.png", placeholderPng);
  zip.file("OEBPS/images/placeholder-siot.png", placeholderPng);
  zip.file("OEBPS/images/placeholder-cover.png", placeholderPng);

  // --- style.css (fixed-layout hints, large text for children) ---
  zip.file(
    "OEBPS/style.css",
    `@charset "UTF-8";

/* 유아동 파닉스 교재용 ePub 2.0 스타일 */
/* 고정 레이아웃 힌트 포함 */

@page {
  margin: 0;
}

body {
  font-family: "Noto Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif;
  font-size: 1.5em;
  line-height: 2;
  margin: 0.5em;
  color: #333;
  text-align: center;
  word-break: keep-all;
  /* Fixed-layout hint */
  width: 768px;
  height: 1024px;
  overflow: hidden;
}

h1 {
  font-size: 2em;
  color: #e74c3c;
  text-align: center;
  margin: 0.5em 0;
}

h2 {
  font-size: 1.8em;
  color: #2980b9;
  text-align: center;
  margin: 0.5em 0;
}

.cover-page {
  text-align: center;
  padding-top: 15%;
  background-color: #fffde7;
}

.cover-page h1 {
  font-size: 2.5em;
  color: #e74c3c;
  margin-bottom: 0.3em;
}

.cover-page .subtitle {
  font-size: 1.2em;
  color: #f39c12;
}

.cover-page .author {
  font-size: 1em;
  color: #888;
  margin-top: 1em;
}

.letter-page {
  text-align: center;
  padding-top: 5%;
  min-height: 90vh;
}

.big-letter {
  font-size: 8em;
  font-weight: bold;
  line-height: 1.2;
  margin: 0.2em 0;
  display: block;
}

.letter-giyeok { color: #e74c3c; }
.letter-nieun { color: #3498db; }
.letter-digeut { color: #2ecc71; }
.letter-rieul { color: #9b59b6; }
.letter-mieum { color: #f39c12; }
.letter-bieup { color: #1abc9c; }
.letter-siot { color: #e67e22; }

.word-box {
  background-color: #fef9e7;
  border: 3px solid #f39c12;
  border-radius: 15px;
  padding: 0.5em 1em;
  margin: 0.5em auto;
  display: inline-block;
  font-size: 1.5em;
}

.word-list {
  list-style: none;
  padding: 0;
  margin: 0.5em 0;
}

.word-list li {
  font-size: 1.4em;
  margin: 0.3em 0;
  padding: 0.2em 0.5em;
}

.word-list li .highlight {
  color: #e74c3c;
  font-weight: bold;
  font-size: 1.2em;
}

.illustration {
  max-width: 80%;
  margin: 0.5em auto;
  display: block;
  border-radius: 10px;
}

.practice-section {
  background-color: #eaf2f8;
  border: 2px dashed #3498db;
  border-radius: 15px;
  padding: 1em;
  margin: 1em 0.5em;
  text-align: center;
}

.practice-section h3 {
  color: #2980b9;
  font-size: 1.3em;
  margin-bottom: 0.5em;
}

.syllable-grid {
  display: inline-block;
  text-align: center;
  margin: 0.3em;
}

.syllable-grid .syllable {
  display: inline-block;
  font-size: 2em;
  width: 1.5em;
  height: 1.5em;
  line-height: 1.5em;
  margin: 0.1em;
  border: 2px solid #bdc3c7;
  border-radius: 8px;
  background-color: white;
}

.fun-fact {
  background-color: #fdedec;
  border: 2px solid #e74c3c;
  border-radius: 15px;
  padding: 0.5em 1em;
  margin: 0.5em;
  font-size: 1em;
}
`,
  );

  // --- Cover / Title page ---
  zip.file(
    "OEBPS/cover.xhtml",
    wrapXhtml(
      title,
      `<div class="cover-page">
  <img src="images/placeholder-cover.png" alt="한글 놀이 표지 그림: 알록달록한 한글 자음 글자들이 춤추고 있다" class="illustration"/>
  <h1>한글 놀이</h1>
  <p class="subtitle">ㄱ부터 ㅎ까지</p>
  <p class="author">이수진 글 / 최민아 그림</p>
</div>
`,
    ),
  );

  // --- TOC page ---
  zip.file(
    "OEBPS/toc-page.xhtml",
    wrapXhtml(
      "목차",
      `<h1>목차</h1>
<ul class="word-list">
  <li><a href="page-giyeok.xhtml"><span class="highlight">ㄱ</span> 기역 — 가나다</a></li>
  <li><a href="page-nieun.xhtml"><span class="highlight">ㄴ</span> 니은 — 나비가 날아요</a></li>
  <li><a href="page-digeut.xhtml"><span class="highlight">ㄷ</span> 디귿 — 다람쥐와 도토리</a></li>
  <li><a href="page-rieul.xhtml"><span class="highlight">ㄹ</span> 리을 — 라디오 속 노래</a></li>
  <li><a href="page-mieum.xhtml"><span class="highlight">ㅁ</span> 미음 — 무지개 마을</a></li>
  <li><a href="page-bieup.xhtml"><span class="highlight">ㅂ</span> 비읍 — 바다의 보물</a></li>
  <li><a href="page-siot.xhtml"><span class="highlight">ㅅ</span> 시옷 — 사과와 수박</a></li>
  <li><a href="practice.xhtml">연습하기</a></li>
</ul>
`,
    ),
  );

  // --- ㄱ (Giyeok) ---
  zip.file(
    "OEBPS/page-giyeok.xhtml",
    wrapXhtml(
      "ㄱ 기역",
      `<div class="letter-page">
  <span class="big-letter letter-giyeok">ㄱ</span>
  <h2>기역</h2>

  <img src="images/placeholder-giyeok.png" alt="기역 글자와 함께 그려진 귀여운 강아지, 거북이, 고래 그림" class="illustration"/>

  <div class="word-box">
    <span class="highlight">가</span>방 속에 <span class="highlight">거</span>북이!
  </div>

  <ul class="word-list">
    <li><span class="highlight">가</span>방 — 학교에 갈 때 메는 가방</li>
    <li><span class="highlight">거</span>북이 — 느릿느릿 걸어가는 거북이</li>
    <li><span class="highlight">고</span>래 — 바다에서 헤엄치는 고래</li>
    <li><span class="highlight">구</span>름 — 하늘에 둥둥 떠다니는 구름</li>
    <li><span class="highlight">기</span>차 — 칙칙폭폭 달리는 기차</li>
  </ul>

  <div class="fun-fact">
    <strong>알고 있나요?</strong> 'ㄱ'은 혀뿌리가 목구멍을 막는 모양을 본떠 만든 글자예요!
  </div>
</div>
`,
    ),
  );

  // --- ㄴ (Nieun) ---
  zip.file(
    "OEBPS/page-nieun.xhtml",
    wrapXhtml(
      "ㄴ 니은",
      `<div class="letter-page">
  <span class="big-letter letter-nieun">ㄴ</span>
  <h2>니은</h2>

  <img src="images/placeholder-nieun.png" alt="니은 글자와 함께 나비, 나무, 노란 해바라기 그림" class="illustration"/>

  <div class="word-box">
    <span class="highlight">나</span>비가 <span class="highlight">나</span>무 위로 날아요!
  </div>

  <ul class="word-list">
    <li><span class="highlight">나</span>비 — 꽃밭에서 춤추는 나비</li>
    <li><span class="highlight">나</span>무 — 키가 큰 나무</li>
    <li><span class="highlight">노</span>래 — 즐겁게 부르는 노래</li>
    <li><span class="highlight">누</span>나 — 다정한 우리 누나</li>
    <li><span class="highlight">눈</span> — 겨울에 내리는 하얀 눈</li>
  </ul>

  <div class="fun-fact">
    <strong>알고 있나요?</strong> 'ㄴ'은 혀가 윗잇몸에 닿는 모양을 본떠 만든 글자예요!
  </div>
</div>
`,
    ),
  );

  // --- ㄷ (Digeut) ---
  zip.file(
    "OEBPS/page-digeut.xhtml",
    wrapXhtml(
      "ㄷ 디귿",
      `<div class="letter-page">
  <span class="big-letter letter-digeut">ㄷ</span>
  <h2>디귿</h2>

  <img src="images/placeholder-digeut.png" alt="디귿 글자와 함께 다람쥐가 도토리를 들고 있는 그림" class="illustration"/>

  <div class="word-box">
    <span class="highlight">다</span>람쥐가 <span class="highlight">도</span>토리를 먹어요!
  </div>

  <ul class="word-list">
    <li><span class="highlight">다</span>람쥐 — 나무 위의 재빠른 다람쥐</li>
    <li><span class="highlight">도</span>토리 — 다람쥐가 좋아하는 도토리</li>
    <li><span class="highlight">달</span> — 밤하늘에 빛나는 달</li>
    <li><span class="highlight">딸</span>기 — 새빨간 맛있는 딸기</li>
    <li><span class="highlight">두</span>꺼비 — 폴짝폴짝 뛰는 두꺼비</li>
  </ul>

  <div class="fun-fact">
    <strong>알고 있나요?</strong> 'ㄷ'은 'ㄴ'에 획을 하나 더해서 만든 글자예요. 소리가 더 세지면 획이 늘어나요!
  </div>
</div>
`,
    ),
  );

  // --- ㄹ (Rieul) ---
  zip.file(
    "OEBPS/page-rieul.xhtml",
    wrapXhtml(
      "ㄹ 리을",
      `<div class="letter-page">
  <span class="big-letter letter-rieul">ㄹ</span>
  <h2>리을</h2>

  <img src="images/placeholder-rieul.png" alt="리을 글자와 함께 라디오에서 음표가 나오는 그림" class="illustration"/>

  <div class="word-box">
    <span class="highlight">라</span>디오에서 <span class="highlight">노</span>래가 나와요!
  </div>

  <ul class="word-list">
    <li><span class="highlight">라</span>디오 — 음악이 흘러나오는 라디오</li>
    <li><span class="highlight">로</span>봇 — 씩씩한 장난감 로봇</li>
    <li><span class="highlight">리</span>본 — 예쁜 머리 리본</li>
    <li><span class="highlight">레</span>몬 — 새콤한 레몬</li>
    <li><span class="highlight">루</span>돌프 — 빨간 코 루돌프</li>
  </ul>

  <div class="fun-fact">
    <strong>알고 있나요?</strong> 'ㄹ'은 혀가 윗잇몸에 닿았다가 구르는 모양을 본떠 만든 글자예요!
  </div>
</div>
`,
    ),
  );

  // --- ㅁ (Mieum) ---
  zip.file(
    "OEBPS/page-mieum.xhtml",
    wrapXhtml(
      "ㅁ 미음",
      `<div class="letter-page">
  <span class="big-letter letter-mieum">ㅁ</span>
  <h2>미음</h2>

  <img src="images/placeholder-mieum.png" alt="미음 글자와 함께 무지개, 모자, 말 그림" class="illustration"/>

  <div class="word-box">
    <span class="highlight">무</span>지개 <span class="highlight">마</span>을에 가요!
  </div>

  <ul class="word-list">
    <li><span class="highlight">무</span>지개 — 비 온 뒤에 뜨는 무지개</li>
    <li><span class="highlight">마</span>을 — 우리가 사는 마을</li>
    <li><span class="highlight">모</span>자 — 햇볕을 가리는 모자</li>
    <li><span class="highlight">말</span> — 히힝, 달리는 말</li>
    <li><span class="highlight">미</span>소 — 활짝 웃는 미소</li>
  </ul>

  <div class="fun-fact">
    <strong>알고 있나요?</strong> 'ㅁ'은 입 모양을 본떠 만든 글자예요. 입을 다물고 소리를 내 보세요!
  </div>
</div>
`,
    ),
  );

  // --- ㅂ (Bieup) ---
  zip.file(
    "OEBPS/page-bieup.xhtml",
    wrapXhtml(
      "ㅂ 비읍",
      `<div class="letter-page">
  <span class="big-letter letter-bieup">ㅂ</span>
  <h2>비읍</h2>

  <img src="images/placeholder-bieup.png" alt="비읍 글자와 함께 바다에 보물상자가 있는 그림" class="illustration"/>

  <div class="word-box">
    <span class="highlight">바</span>다에 <span class="highlight">보</span>물이 있어요!
  </div>

  <ul class="word-list">
    <li><span class="highlight">바</span>다 — 넓고 푸른 바다</li>
    <li><span class="highlight">보</span>물 — 반짝반짝 빛나는 보물</li>
    <li><span class="highlight">비</span> — 주룩주룩 내리는 비</li>
    <li><span class="highlight">버</span>스 — 학교 가는 버스</li>
    <li><span class="highlight">별</span> — 밤하늘의 반짝이는 별</li>
  </ul>

  <div class="fun-fact">
    <strong>알고 있나요?</strong> 'ㅂ'은 'ㅁ'에 획을 더해서 만든 글자예요. 입술이 만났다가 터지는 소리를 나타내요!
  </div>
</div>
`,
    ),
  );

  // --- ㅅ (Siot) ---
  zip.file(
    "OEBPS/page-siot.xhtml",
    wrapXhtml(
      "ㅅ 시옷",
      `<div class="letter-page">
  <span class="big-letter letter-siot">ㅅ</span>
  <h2>시옷</h2>

  <img src="images/placeholder-siot.png" alt="시옷 글자와 함께 사과, 수박 그림" class="illustration"/>

  <div class="word-box">
    <span class="highlight">사</span>과와 <span class="highlight">수</span>박, 맛있어요!
  </div>

  <ul class="word-list">
    <li><span class="highlight">사</span>과 — 빨갛고 맛있는 사과</li>
    <li><span class="highlight">수</span>박 — 시원하고 달콤한 수박</li>
    <li><span class="highlight">소</span> — 음메~ 하고 우는 소</li>
    <li><span class="highlight">새</span> — 하늘을 나는 새</li>
    <li><span class="highlight">시</span>계 — 째깍째깍 시계</li>
  </ul>

  <div class="fun-fact">
    <strong>알고 있나요?</strong> 'ㅅ'은 이빨 모양을 본떠 만든 글자예요. 이 사이로 바람이 나오는 소리예요!
  </div>
</div>
`,
    ),
  );

  // --- Practice page ---
  zip.file(
    "OEBPS/practice.xhtml",
    wrapXhtml(
      "연습하기",
      `<h1>연습하기</h1>

<div class="practice-section">
  <h3>자음을 따라 써 보세요!</h3>
  <p>손가락으로 글자를 따라 써 보세요.</p>
  <div class="syllable-grid">
    <span class="syllable">ㄱ</span>
    <span class="syllable">ㄴ</span>
    <span class="syllable">ㄷ</span>
    <span class="syllable">ㄹ</span>
    <span class="syllable">ㅁ</span>
    <span class="syllable">ㅂ</span>
    <span class="syllable">ㅅ</span>
  </div>
</div>

<div class="practice-section">
  <h3>어떤 글자로 시작할까요?</h3>
  <ul class="word-list">
    <li>🍎 (  )과 — 사과의 첫 글자는?</li>
    <li>🦋 (  )비 — 나비의 첫 글자는?</li>
    <li>🐿️ (  )람쥐 — 다람쥐의 첫 글자는?</li>
    <li>🌈 (  )지개 — 무지개의 첫 글자는?</li>
    <li>⭐ (  )  — 별의 첫 글자는?</li>
  </ul>
</div>

<div class="practice-section">
  <h3>같은 글자로 시작하는 낱말 찾기</h3>
  <p>'ㄱ'으로 시작하는 낱말을 세 개 말해 보세요!</p>
  <p>'ㄴ'으로 시작하는 낱말을 세 개 말해 보세요!</p>
  <p>'ㅁ'으로 시작하는 낱말을 세 개 말해 보세요!</p>
</div>

<div class="practice-section">
  <h3>글자를 합쳐 보아요!</h3>
  <p>자음과 모음을 합치면 글자가 돼요!</p>
  <div class="syllable-grid">
    <span class="syllable">ㄱ</span>
    <span class="syllable">+</span>
    <span class="syllable">ㅏ</span>
    <span class="syllable">=</span>
    <span class="syllable">가</span>
  </div>
  <div class="syllable-grid">
    <span class="syllable">ㄴ</span>
    <span class="syllable">+</span>
    <span class="syllable">ㅏ</span>
    <span class="syllable">=</span>
    <span class="syllable">나</span>
  </div>
  <div class="syllable-grid">
    <span class="syllable">ㄷ</span>
    <span class="syllable">+</span>
    <span class="syllable">ㅏ</span>
    <span class="syllable">=</span>
    <span class="syllable">다</span>
  </div>
  <div class="syllable-grid">
    <span class="syllable">ㅁ</span>
    <span class="syllable">+</span>
    <span class="syllable">ㅏ</span>
    <span class="syllable">=</span>
    <span class="syllable">마</span>
  </div>
</div>
`,
    ),
  );

  // --- content.opf ---
  zip.file(
    "OEBPS/content.opf",
    buildOpf(
      {
        title,
        creator: "이수진",
        identifier,
        description: "만 4~6세 유아를 위한 한글 자음 학습 파닉스 교재",
        publisher: "하얀마인드 키즈",
        date: "2025-11-01",
        subject: "유아교육, 한글, 파닉스",
      },
      [
        { id: "style", href: "style.css", mediaType: "text/css" },
        { id: "cover", href: "cover.xhtml", mediaType: "application/xhtml+xml" },
        { id: "toc-page", href: "toc-page.xhtml", mediaType: "application/xhtml+xml" },
        { id: "page-giyeok", href: "page-giyeok.xhtml", mediaType: "application/xhtml+xml" },
        { id: "page-nieun", href: "page-nieun.xhtml", mediaType: "application/xhtml+xml" },
        { id: "page-digeut", href: "page-digeut.xhtml", mediaType: "application/xhtml+xml" },
        { id: "page-rieul", href: "page-rieul.xhtml", mediaType: "application/xhtml+xml" },
        { id: "page-mieum", href: "page-mieum.xhtml", mediaType: "application/xhtml+xml" },
        { id: "page-bieup", href: "page-bieup.xhtml", mediaType: "application/xhtml+xml" },
        { id: "page-siot", href: "page-siot.xhtml", mediaType: "application/xhtml+xml" },
        { id: "practice", href: "practice.xhtml", mediaType: "application/xhtml+xml" },
        { id: "img-cover", href: "images/placeholder-cover.png", mediaType: "image/png" },
        { id: "img-giyeok", href: "images/placeholder-giyeok.png", mediaType: "image/png" },
        { id: "img-nieun", href: "images/placeholder-nieun.png", mediaType: "image/png" },
        { id: "img-digeut", href: "images/placeholder-digeut.png", mediaType: "image/png" },
        { id: "img-rieul", href: "images/placeholder-rieul.png", mediaType: "image/png" },
        { id: "img-mieum", href: "images/placeholder-mieum.png", mediaType: "image/png" },
        { id: "img-bieup", href: "images/placeholder-bieup.png", mediaType: "image/png" },
        { id: "img-siot", href: "images/placeholder-siot.png", mediaType: "image/png" },
      ],
      [
        { idref: "cover" },
        { idref: "toc-page" },
        { idref: "page-giyeok" },
        { idref: "page-nieun" },
        { idref: "page-digeut" },
        { idref: "page-rieul" },
        { idref: "page-mieum" },
        { idref: "page-bieup" },
        { idref: "page-siot" },
        { idref: "practice" },
      ],
    ),
  );

  // --- toc.ncx ---
  zip.file(
    "OEBPS/toc.ncx",
    buildNcx(identifier, title, [
      { id: "navpoint-1", playOrder: 1, label: "표지", src: "cover.xhtml" },
      { id: "navpoint-2", playOrder: 2, label: "목차", src: "toc-page.xhtml" },
      { id: "navpoint-3", playOrder: 3, label: "ㄱ 기역", src: "page-giyeok.xhtml" },
      { id: "navpoint-4", playOrder: 4, label: "ㄴ 니은", src: "page-nieun.xhtml" },
      { id: "navpoint-5", playOrder: 5, label: "ㄷ 디귿", src: "page-digeut.xhtml" },
      { id: "navpoint-6", playOrder: 6, label: "ㄹ 리을", src: "page-rieul.xhtml" },
      { id: "navpoint-7", playOrder: 7, label: "ㅁ 미음", src: "page-mieum.xhtml" },
      { id: "navpoint-8", playOrder: 8, label: "ㅂ 비읍", src: "page-bieup.xhtml" },
      { id: "navpoint-9", playOrder: 9, label: "ㅅ 시옷", src: "page-siot.xhtml" },
      { id: "navpoint-10", playOrder: 10, label: "연습하기", src: "practice.xhtml" },
    ]),
  );

  await saveEpub(zip, "children-phonics.epub");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("=== ePub 2.0 테스트 샘플 생성 시작 ===");
  console.log(`출력 디렉토리: ${FIXTURES_DIR}`);

  await mkdir(FIXTURES_DIR, { recursive: true });

  await createLiteratureNovel();
  await createEducationScience();
  await createChildrenPhonics();

  console.log("\n=== 생성 완료 ===");
  console.log("생성된 파일:");
  console.log("  - fixtures/literature-novel.epub   (문학 소설)");
  console.log("  - fixtures/education-science.epub   (교육 교재)");
  console.log("  - fixtures/children-phonics.epub    (유아동 파닉스)");
}

main().catch((err) => {
  console.error("오류 발생:", err);
  process.exit(1);
});
