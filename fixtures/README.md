# fixtures/ - ePub 2.0 테스트 샘플

이 디렉토리에는 ePub 2.0 파싱 및 변환 파이프라인 테스트에 사용되는 샘플 ePub 파일이 포함되어 있습니다.

## 샘플 생성

```bash
pnpm exec tsx fixtures/create-samples.ts
```

스크립트를 실행하면 아래 3개의 `.epub` 파일이 이 디렉토리에 생성됩니다.

## 샘플 목록

### 1. `literature-novel.epub` - 문학 소설

| 항목 | 내용 |
|------|------|
| 제목 | 별이 빛나는 밤에 |
| 저자 | 김서연 |
| 유형 | 장편소설 (3챕터) |
| 언어 | ko |
| 특징 | 텍스트 중심, 한국어 타이포그래피, 단순 구조 |

**구조:**
- `OEBPS/title.xhtml` - 표지
- `OEBPS/toc-page.xhtml` - 목차
- `OEBPS/chapter1.xhtml` - 제1장: 서울의 밤하늘
- `OEBPS/chapter2.xhtml` - 제2장: 천문대에서의 만남
- `OEBPS/chapter3.xhtml` - 제3장: 별이 빛나는 밤에
- `OEBPS/style.css` - 세리프 폰트 기반 문학 스타일

**테스트 용도:**
- 텍스트 중심 ePub 2.0 파싱 검증
- 한국어 인코딩 처리 확인
- 기본 NCX/OPF 구조 파싱
- KPI 시나리오 #1: 텍스트 중심 소설 ePub 2.0 -> 3.0 변환

---

### 2. `education-science.epub` - 교육 교재

| 항목 | 내용 |
|------|------|
| 제목 | 초등 과학 탐구 |
| 저자 | 박정민 |
| 유형 | 초등 3~4학년 과학 보충 교재 (2단원) |
| 언어 | ko |
| 특징 | 혼합 콘텐츠, 이미지(placeholder), 표, 목록, 실험 박스 |

**구조:**
- `OEBPS/title.xhtml` - 표지
- `OEBPS/toc-page.xhtml` - 목차 (계층적)
- `OEBPS/unit1-intro.xhtml` - 1단원: 태양계와 우주 (1-1. 태양계의 구성)
- `OEBPS/unit1-planets.xhtml` - 1-2. 행성의 특징 (표 포함)
- `OEBPS/unit1-review.xhtml` - 1단원 정리 및 탐구 활동
- `OEBPS/unit2-intro.xhtml` - 2단원: 물의 순환 (2-1. 물의 상태 변화)
- `OEBPS/unit2-cycle.xhtml` - 2-2. 자연 속 물의 순환
- `OEBPS/unit2-review.xhtml` - 2단원 정리 및 탐구 활동
- `OEBPS/images/` - placeholder 이미지 4개 (1x1 PNG)
- `OEBPS/style.css` - 교재용 스타일 (표, 학습목표 박스, 실험 박스 등)

**의도적 이슈 (오류 패턴 감지 테스트용):**
- 빈 `<span></span>` 태그 (unit1-planets.xhtml 내 3곳)
- 빈 `<div></div>` 태그 (unit1-planets.xhtml 내 1곳)
- 비표준적 `<p>` 내부 `<div>` 중첩

**테스트 용도:**
- 복잡한 NCX 구조 (자식 navPoint) 파싱
- 이미지/미디어 인벤토리 분석
- 표, 목록, 혼합 콘텐츠 파싱
- 불필요 태그 감지 및 정리
- KPI 시나리오 #2: 이미지 포함 교재 ePub 변환
- KPI 시나리오 #4: 비표준 태그 사용 ePub 변환

---

### 3. `children-phonics.epub` - 유아동 파닉스

| 항목 | 내용 |
|------|------|
| 제목 | 한글 놀이: ㄱ부터 ㅎ까지 |
| 저자 | 이수진 (글) / 최민아 (그림) |
| 유형 | 만 4~6세 유아 한글 파닉스 교재 |
| 언어 | ko |
| 특징 | 큰 텍스트, 이미지 중심 레이아웃, 고정 레이아웃 CSS 힌트 |

**구조:**
- `OEBPS/cover.xhtml` - 표지
- `OEBPS/toc-page.xhtml` - 목차
- `OEBPS/page-giyeok.xhtml` - ㄱ 기역 (5개 단어 + 훈민정음 유래)
- `OEBPS/page-nieun.xhtml` - ㄴ 니은
- `OEBPS/page-digeut.xhtml` - ㄷ 디귿
- `OEBPS/page-rieul.xhtml` - ㄹ 리을
- `OEBPS/page-mieum.xhtml` - ㅁ 미음
- `OEBPS/page-bieup.xhtml` - ㅂ 비읍
- `OEBPS/page-siot.xhtml` - ㅅ 시옷
- `OEBPS/practice.xhtml` - 연습하기 (자음 쓰기, 퀴즈)
- `OEBPS/images/` - placeholder 이미지 8개 (1x1 PNG)
- `OEBPS/style.css` - 대형 텍스트 + 고정 레이아웃 힌트 스타일

**테스트 용도:**
- 이미지 다수 포함 ePub 파싱
- 고정 레이아웃(fixed-layout) CSS 감지
- 한글 자모 문자 처리 확인
- 대체 텍스트(alt) 접근성 검증
- 인터랙티브 요소 삽입 대상 식별

---

## ePub 2.0 공통 구조

모든 샘플은 ePub 2.0 OPF 표준을 따릅니다:

```
sample.epub (ZIP)
  ├── mimetype                    (첫 번째 엔트리, 비압축 STORE)
  ├── META-INF/
  │   └── container.xml           (rootfile -> OEBPS/content.opf)
  └── OEBPS/
      ├── content.opf             (dc:metadata, manifest, spine)
      ├── toc.ncx                 (NCX 목차)
      ├── style.css               (기본 스타일)
      ├── *.xhtml                 (XHTML 1.1 콘텐츠)
      └── images/                 (이미지 리소스, 해당 시)
```

## 메타데이터

| 필드 | literature-novel | education-science | children-phonics |
|------|-----------------|-------------------|------------------|
| `dc:title` | 별이 빛나는 밤에 | 초등 과학 탐구 | 한글 놀이: ㄱ부터 ㅎ까지 |
| `dc:creator` | 김서연 | 박정민 | 이수진 |
| `dc:language` | ko | ko | ko |
| `dc:publisher` | 하얀마인드 출판사 | 하얀마인드 교육연구소 | 하얀마인드 키즈 |
| `dc:subject` | 소설, 문학, 한국소설 | 교육, 과학, 초등교육 | 유아교육, 한글, 파닉스 |
| OPF version | 2.0 | 2.0 | 2.0 |
| 파일 크기 | ~9 KB | ~15 KB | ~13 KB |
