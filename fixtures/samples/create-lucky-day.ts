/**
 * fixtures/samples/create-lucky-day.ts
 *
 * 현진건의 "운수 좋은 날" (1924) ePub 2.0 생성 스크립트
 * 실행: npx tsx fixtures/samples/create-lucky-day.ts
 */

import JSZip from "jszip";
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function addMimetype(zip: JSZip): void {
  zip.file("mimetype", "application/epub+zip", {
    compression: "STORE",
  });
}

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

async function createLuckyDay(): Promise<void> {
  console.log("운수 좋은 날 ePub 2.0 생성 중...");

  const zip = new JSZip();
  addMimetype(zip);
  addContainerXml(zip);

  const identifier = "urn:uuid:b2c3d4e5-f6a7-8901-bcde-f23456789012";
  const title = "운수 좋은 날";
  const creator = "현진건";

  // --- style.css ---
  zip.file(
    "OEBPS/style.css",
    `@charset "UTF-8";

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

.separator {
  text-align: center;
  margin: 2em 0;
  color: #999;
}
`,
  );

  // --- Title page ---
  zip.file(
    "OEBPS/title.xhtml",
    wrapXhtml(
      title,
      `<div class="title-page">
  <h1>운수 좋은 날</h1>
  <p class="author">현진건</p>
  <p style="font-size:0.9em; color:#888; margin-top:2em;">1924년 발표</p>
</div>`,
    ),
  );

  // --- Chapter 1: 새벽 ---
  zip.file(
    "OEBPS/chapter01.xhtml",
    wrapXhtml(
      "제1장 새벽",
      `<h2>제1장 새벽</h2>

<p class="first">새침하게 흐린 품이 눈이 올 듯하더니 눈은 아니 오고 얼다가 만 북풍이 칼같이 날카로운 추위를 몰아왔다. 이날이야말로 동소문 안에서 인력거꾼 노릇을 하는 김 첨지에게는 오래간만에도 닥친 운수 좋은 날이었다.</p>

<p>문안에(거기도 문안이지) 들어간답시고 이 추운 날 전차 정류장까지 가랴면 빈 인력거를 털거덕거리고 가기가 여간 힘드는 것이 아니었다. 그런데 이런 날은 대개 손님도 없고 길바닥에 얼어붙은 눈이 조금이라도 녹아 물이 괴면 인력거 바퀴에 채어서 진흙탕이 옷에 튀었다.</p>

<p>그야말로 봄이 왔다고는 하지만 아직 찬바람이 등골을 에이는 때인지라, 달리 볼일도 없이 제집에 누워 굴러도 좋았으련만, 김 첨지의 집안 사정은 그러기를 허락지 않았다. 안해가 기침으로 자리에 누운 지 이미 달포가 넘었고, 열 살짜리 큰아이는 배가 고프다고 빌빌거렸다.</p>

<p>그래 이른 아침에 한 전이라도 벌어 볼 요량으로 거리에 나섰건마는 이렇게 흐린 날에는 사람의 그림자도 별로 보이지 않았다. 열시가 넘도록 전차 정류장에서 왔다 갔다 하며 빈 인력거를 끌었으나 한 사람의 손님도 태울 수가 없었다.</p>

<p>오늘도 헛물만 켜나 보다 하고, 열한시쯤 되어 인력거 채를 벌려 놓고 길가에 거꾸러져 몸을 펴고 있으려는데, 때마침 따끈따끈한 주머니를 가진 학생 하나가 정류장 앞에서 인력거를 불렀다.</p>`,
    ),
  );

  // --- Chapter 2: 거리에서 ---
  zip.file(
    "OEBPS/chapter02.xhtml",
    wrapXhtml(
      "제2장 거리에서",
      `<h2>제2장 거리에서</h2>

<p class="first">김 첨지는 한 손님을 남대문 정거장까지 태워다 주고 돈 십 전을 받았다. 십 전! 요새 물가에 십 전이면 고작 엿 한 개밖에 못 사겠지마는 오늘 아침 첫 수입이 십 전이라니 그야말로 재수가 옴붙었다.</p>

<p>첫 번 손님을 태우고 난 이후에는 어찌 된 셈인지 손님이 줄줄이 생겼다. 앞집 마나님을 태워다 주고 삼십 전, 다음에는 교동 학교에 다니는 아이 둘을 태워다 주고 오십 전— 이것이 또 웬 떡이냐 하고 김 첨지의 울퉁불퉁한 얼굴에는 처음으로 웃음보가 터졌다.</p>

<p>점심때가 지나도록 김 첨지는 열두 번이나 손님을 태워다 주었다. 합하여 이 원 오십 전이었다. 이 원 오십 전이면 쌀 한 되를 사고도 국수를 사 먹을 수 있었다. 김 첨지는 이런 날이 매일 있었으면 좋겠다고 속으로 빌었다.</p>

<p>거리에는 전차가 끊임없이 오갔고, 자동차 경적 소리가 요란했다. 김 첨지는 소나기가 퍼붓는 속을 뚫고 달렸다. 빗물이 온몸을 적셨지만 그의 마음은 가벼웠다. 아내에게 설렁탕이라도 한 그릇 사다 주어야겠다는 생각이 문득 들었다.</p>

<p>남대문통에서 다시 동대문 쪽으로 돌아가는 길이었다. 황혼 무렵, 붉은 노을이 먹구름 사이로 비쳐 거리 위에 기묘한 빛깔을 드리우고 있었다. 김 첨지는 오늘따라 세상이 아름답게 보였다. 발밑의 웅덩이에 고인 빗물에도 석양빛이 번져 보석처럼 반짝거렸다.</p>`,
    ),
  );

  // --- Chapter 3: 귀가 ---
  zip.file(
    "OEBPS/chapter03.xhtml",
    wrapXhtml(
      "제3장 귀가",
      `<h2>제3장 귀가</h2>

<p class="first">해가 꼭 서쪽 하늘에 떨어질 무렵이었다. 김 첨지는 빈 인력거를 끌고 집을 향하여 발을 옮겼다. 오늘 하루 벌이가 삼 원이 넘었으니 이만하면 정말 운수 좋은 날이라고 아니할 수 없었다.</p>

<p>동소문 고갯길을 올라가면서도 김 첨지의 입에서는 흥얼흥얼 콧노래가 흘러나왔다. 길옆 포장마차에서 풍기는 어묵 냄새가 코를 간질였다. 설렁탕집 앞을 지나면서 문득 발을 멈추었다. 아내가 설렁탕이 먹고 싶다고 했던가, 아니 자기가 먹고 싶었던 것인가, 분명치 않았지만 하여간 오늘은 한 그릇 사 가지고 가야겠다는 마음이 불끈 일었다.</p>

<p>김 첨지는 설렁탕 한 그릇 값으로 돈 이십 전을 내고, 뚝배기째 받아 들고 집으로 향했다. 인력거 위에 올려놓은 뚝배기에서는 김이 모락모락 피어올랐다. 좁은 골목길, 처마 밑에 고드름이 매달린 낡은 집들이 양쪽으로 늘어서 있었다.</p>

<p>골목 안 셋방에 이르러 문을 열었을 때, 안에서는 아무 소리도 들리지 않았다. 이상한 침묵이었다. 아이의 울음소리도, 아내의 기침소리도 없었다. 김 첨지는 뚝배기를 들고 선 채 방문 앞에 멈춰 섰다. 밀짚 자리 위에 가마니를 덮고 누워 있는 아내의 모습이 보였다.</p>

<p>"이봐, 설렁탕을 사왔소. 들어봐, 내가 사왔단 말이오."</p>

<p>김 첨지는 뚝배기를 방바닥에 내려놓으며 소리쳤다. 그러나 아내는 대답이 없었다. 달려들어 아내의 코 아래에 손을 대어 보았으나 숨결은 이미 없었다. 운수 좋은 날이라더니— 김 첨지는 대성통곡을 하였다.</p>`,
    ),
  );

  // --- content.opf ---
  const manifestItems = [
    { id: "style", href: "style.css", mediaType: "text/css" },
    { id: "title", href: "title.xhtml", mediaType: "application/xhtml+xml" },
    { id: "ch01", href: "chapter01.xhtml", mediaType: "application/xhtml+xml" },
    { id: "ch02", href: "chapter02.xhtml", mediaType: "application/xhtml+xml" },
    { id: "ch03", href: "chapter03.xhtml", mediaType: "application/xhtml+xml" },
  ];

  const manifest = manifestItems
    .map((i) => `    <item id="${i.id}" href="${i.href}" media-type="${i.mediaType}"/>`)
    .join("\n");

  const spineRefs = [
    { idref: "title" },
    { idref: "ch01" },
    { idref: "ch02" },
    { idref: "ch03" },
  ];

  const spine = spineRefs
    .map((r) => `    <itemref idref="${r.idref}"/>`)
    .join("\n");

  zip.file(
    "OEBPS/content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${title}</dc:title>
    <dc:creator opf:role="aut">${creator}</dc:creator>
    <dc:language>ko</dc:language>
    <dc:identifier id="BookId">${identifier}</dc:identifier>
    <dc:description>1920년대 식민지 조선의 하층민 인력거꾼의 하루를 그린 현진건의 대표 단편소설</dc:description>
    <dc:publisher>공공 도메인</dc:publisher>
    <dc:date>1924</dc:date>
    <dc:subject>한국 근대 문학</dc:subject>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
${manifest}
  </manifest>
  <spine toc="ncx">
${spine}
  </spine>
</package>
`,
  );

  // --- toc.ncx ---
  zip.file(
    "OEBPS/toc.ncx",
    `<?xml version="1.0" encoding="UTF-8"?>
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
    <navPoint id="nav-title" playOrder="1">
      <navLabel>
        <text>표지</text>
      </navLabel>
      <content src="title.xhtml"/>
    </navPoint>
    <navPoint id="nav-ch01" playOrder="2">
      <navLabel>
        <text>제1장 새벽</text>
      </navLabel>
      <content src="chapter01.xhtml"/>
    </navPoint>
    <navPoint id="nav-ch02" playOrder="3">
      <navLabel>
        <text>제2장 거리에서</text>
      </navLabel>
      <content src="chapter02.xhtml"/>
    </navPoint>
    <navPoint id="nav-ch03" playOrder="4">
      <navLabel>
        <text>제3장 귀가</text>
      </navLabel>
      <content src="chapter03.xhtml"/>
    </navPoint>
  </navMap>
</ncx>
`,
  );

  // --- Generate and save ---
  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
  const outPath = join(__dirname, "lucky-day.epub");
  await writeFile(outPath, buffer);
  console.log(`  [OK] ${outPath}`);
}

createLuckyDay().catch((err) => {
  console.error(err);
  process.exit(1);
});
