# Architecture / 아키텍처 문서

이 문서는 프로젝트의 전체 아키텍처와 설계 결정을 설명합니다.
오픈소스 기여자들이 코드베이스를 빠르게 이해할 수 있도록 작성되었습니다.

---

## 시스템 전체 구성도

```
┌─────────────────────────────────────────────────────────┐
│                    Web Dashboard (Next.js 16)            │
│   Dashboard → Upload → Convert → Preview → Report       │
│   Settings → Guide                                       │
│   Port: 3000                                             │
└─────────────┬───────────────────────────────┬────────────┘
              │ REST API (fetch)              │
              │ API_BASE = NEXT_PUBLIC_API_URL│
              │ || http://localhost:3001      │
              ▼                               │
┌─────────────────────────────────────────────────────────┐
│                  API Server (Express)                     │
│   /api/upload → /api/convert → /api/jobs → /api/download │
│   /api/preview → /api/report → /api/samples              │
│   /api/auth/login → /api/auth/register → /api/auth/me    │
│   /api/settings → /api/health                            │
│   Port: 3001                                              │
└─────────────┬───────────────────────────────────────────┘
              │ processEpub()
              ▼
┌─────────────────────────────────────────────────────────┐
│                  Core Engine (@gov-epub/core)             │
│                                                           │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────┐ │
│  │  Parser   │──▶│  Restructurer│──▶│   Interaction    │ │
│  │  (ePub2)  │   │  (Semantic)  │   │ (Quiz/TTS/Image) │ │
│  └──────────┘   └──────────────┘   └────────┬─────────┘ │
│                                              │            │
│  ┌──────────┐   ┌──────────────┐   ┌────────▼─────────┐ │
│  │Validator │◀──│ Accessibility│◀──│   Converter      │ │
│  │(ePubCheck│   │ (KWCAG 2.1)  │   │   (ePub 3.0)    │ │
│  └──────────┘   └──────────────┘   └──────────────────┘ │
└─────────────────────────────────────────────────────────┘
              │
              ▼ (선택적 외부 서비스, Mock 모드 지원)
┌─────────────────────────────────────────────────────────┐
│   External AI APIs                                       │
│   OpenAI GPT-4 / ElevenLabs TTS / Stability AI          │
└─────────────────────────────────────────────────────────┘
```

---

## 패키지 구조

### `packages/core` -- 핵심 변환 엔진

독립 실행 가능한 라이브러리입니다. API 서버 없이도 `processEpub()` 함수 하나로 변환을 실행할 수 있습니다.

```
packages/core/src/
├── index.ts              # 메인 진입점, processEpub() 파이프라인
├── types.ts              # 모든 공유 타입 정의
├── parser/               # [Stage 1] ePub 2.0 파싱
│   ├── index.ts          # parseEpub() — ZIP 해제, OPF/NCX/XHTML 파싱
│   ├── opf-parser.ts     # OPF XML → OpfData (메타데이터, 매니페스트, 스파인)
│   ├── ncx-parser.ts     # NCX → TocEntry[] (목차 트리)
│   └── html-parser.ts    # XHTML → ContentElement[] (시맨틱 요소 추출)
├── restructurer/         # [Stage 2] AI 기반 콘텐츠 재구성
│   └── index.ts          # 시맨틱 태그 부여, 스타일 정규화
├── interaction/          # [Stage 3] 인터랙티브 요소 생성
│   ├── index.ts          # 오케스트레이터 (전체 AI 콘텐츠 생성 조율)
│   ├── types.ts          # AI 모듈 공유 타입
│   ├── ai-config.ts      # API 키 검출, Mock/Real 모드 자동 전환
│   ├── quiz/index.ts     # GPT-4 퀴즈 자동 생성 (Mock 포함)
│   ├── tts/index.ts      # TTS 음성 + SMIL 미디어 오버레이
│   ├── image/index.ts    # AI 이미지 추천/생성
│   └── tutor/index.ts    # AI 튜터 대화형 학습
├── converter/            # [Stage 4] ePub 3.0 변환
│   ├── index.ts          # convertToEpub3() — 패키징 조율
│   ├── html5-generator.ts  # XHTML → HTML5 변환
│   ├── css-generator.ts    # CSS3 스타일시트 생성
│   ├── opf3-generator.ts   # OPF 3.0 패키지 문서 생성
│   └── nav-generator.ts    # NCX → EPUB Nav Document 변환
├── accessibility/        # [Stage 4.5] 접근성 자동 적용
│   └── index.ts          # KWCAG 2.1 / EPUB Accessibility 1.1
├── validator/            # [Stage 5] 검증
│   └── index.ts          # ePubCheck 연동, 접근성 점수
└── __tests__/            # 단위/통합 테스트 (5 Suites, 60 Tests)
    ├── parser.test.ts
    ├── converter.test.ts
    ├── accessibility.test.ts
    ├── validator.test.ts
    └── pipeline.test.ts
```

### `packages/api` -- REST API 서버

Express 기반 HTTP 서버. 파일 업로드, 변환 실행, 진행 상태 조회, 다운로드를 제공합니다.

```
packages/api/src/
├── server.ts             # Express 앱 설정, 미들웨어, 라우트 등록
├── routes/
│   ├── upload.ts         # POST /api/upload — 파일 업로드 (multer)
│   ├── convert.ts        # POST /api/convert/:id — 변환 시작, GET /api/jobs, GET /api/jobs/:id
│   ├── download.ts       # GET /api/download/:id, /api/preview/:id, /api/report/:id
│   ├── samples.ts        # GET /api/samples, GET /api/samples/:id/download, POST /api/samples/:id/use
│   ├── auth.ts           # POST /api/auth/login, POST /api/auth/register, GET /api/auth/me
│   └── settings.ts       # GET/POST /api/settings, GET /api/health
├── services/
│   ├── conversion-service.ts  # 변환 작업 관리, 진행 상태 추적
│   └── storage-service.ts     # 인메모리 + 파일시스템 스토리지
└── middleware/
    ├── auth.ts           # JWT 인증, 데모 모드 감지
    └── error-handler.ts  # 전역 에러 핸들러
```

### `packages/web` -- 웹 대시보드

Next.js 16 App Router 기반. 모든 페이지는 클라이언트 사이드 렌더링(`'use client'`)으로 동작합니다.

```
packages/web/src/
├── app/
│   ├── layout.tsx        # 루트 레이아웃 (Sidebar + Header)
│   ├── page.tsx          # 대시보드 (통계, 최근 작업, KPI)
│   ├── upload/page.tsx   # 파일 업로드 (드래그앤드롭, 샘플 선택)
│   ├── convert/page.tsx  # 변환 진행 (5단계 애니메이션, 데모 모드)
│   ├── preview/page.tsx  # Before/After 비교, 퀴즈, TTS, 요약, ePub 뷰어
│   ├── report/page.tsx   # KPI 리포트, ePubCheck, 접근성 점수
│   ├── settings/page.tsx # API 키 관리, 시스템 정보
│   └── guide/page.tsx    # 사용 가이드, FAQ, 기술 스택
├── components/layout/
│   ├── sidebar.tsx       # 네비게이션 사이드바
│   └── header.tsx        # API 연결 상태 표시
└── lib/
    └── api.ts            # API 클라이언트 (fetch 래퍼, 타입 정의)
```

---

## 데이터 흐름 상세

### 전체 변환 데이터 흐름

```
[사용자]
  │
  │ 1) ePub 파일 업로드 (또는 샘플 선택)
  ▼
[Web Dashboard]
  │
  │ POST /api/upload (multipart/form-data)
  │  또는 POST /api/samples/:id/use
  ▼
[API Server]
  │
  │ 2) 파일 저장, uploadId 반환
  │
  │ POST /api/convert/:uploadId
  ▼
[Conversion Service]
  │
  │ 3) 비동기 변환 작업 시작 (jobId 발급)
  │
  │  a. parseEpub(buffer)
  │     → ParsedEpub { metadata, toc, chapters[], resources[] }
  │
  │  b. restructureContent(parsed)
  │     → RestructuredContent { semanticChapters[], styleMap }
  │
  │  c. generateAiContent(chapters, config)
  │     → AiGeneratedContent { quizzes[], tts[], images[], summaries[] }
  │
  │  d. convertToEpub3(parsed, options, aiContent)
  │     → Buffer (ePub 3.0 ZIP 파일)
  │
  │  e. applyAccessibility(epub)
  │     → Buffer (접근성 적용된 ePub)
  │
  │  f. validateEpub(buffer)
  │     → ValidationReport { epubcheck, accessibility, kpiSummary }
  │
  ▼
[Storage Service]
  │
  │ 4) 결과물 저장 (ePub + previewData + report)
  │
  ▼
[사용자]
  │
  │ 5) GET /api/jobs/:jobId — 진행 상태 폴링 (1.5초 간격)
  │ 6) GET /api/preview/:jobId — 미리보기 데이터
  │ 7) GET /api/report/:jobId — 검증 리포트
  │ 8) GET /api/download/:jobId — 변환 파일 다운로드
  ▼
```

### 타입 의존성 그래프

```
EpubMetadata ──┐
TocEntry ──────┤
Chapter ───────┼──▶ ParsedEpub ──▶ convertToEpub3() ──▶ Buffer
Resource ──────┤                        ↑
ParseError ────┘                  ConversionOptions
                                  AiGeneratedContent
                                    ├── QuizData[]
                                    ├── TtsData[]
                                    ├── ImageData[]
                                    └── SummaryData[]

Buffer ──▶ validateEpub() ──▶ ValidationReport
                                  ├── epubcheck { passed, errors, warnings }
                                  ├── accessibility { score, issues, passed }
                                  ├── interactionCount
                                  └── kpiSummary { 13개 지표 }
```

### 프론트엔드 데이터 흐름

```
[api.ts]  ← 중앙 API 클라이언트
  │
  │ API_BASE = NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  │ apiFetch<T>(path, options) → T
  │
  ├── getSamples() ────────── GET /api/samples ──────────▶ SampleFile[]
  ├── useSample(id) ───────── POST /api/samples/:id/use ─▶ UploadResult
  ├── uploadFile(file) ────── POST /api/upload ──────────▶ UploadResult
  ├── startConversion(id) ─── POST /api/convert/:id ─────▶ { jobId }
  ├── getJobs() ───────────── GET /api/jobs ─────────────▶ JobStatus[]
  ├── getJobStatus(id) ────── GET /api/jobs/:id ─────────▶ JobStatus
  ├── getPreview(id) ──────── GET /api/preview/:id ──────▶ PreviewData
  ├── getReport(id) ───────── GET /api/report/:id ───────▶ ValidationReport
  ├── getDownloadUrl(id) ──── URL 생성 ──────────────────▶ string
  └── getHealth() ─────────── GET /api/health ───────────▶ { status, mode }
```

---

## 핵심 설계 결정

### 1. Mock/Real 모드 자동 전환

모든 AI 모듈은 API 키 존재 여부를 자동 감지하여 동작합니다.

```typescript
// packages/core/src/interaction/ai-config.ts
export function createAiConfig(): AiConfig {
  const useMock = !process.env.OPENAI_API_KEY;
  return { useMock, /* ... */ };
}
```

**이유**: 데모 환경에서 API 키 없이도 전체 파이프라인을 시연할 수 있어야 합니다. 프론트엔드 역시 API 서버에 연결되지 않아도 데모 모드(demo fallback)로 동작하여, 단독으로 데모가 가능합니다.

### 2. 5단계 파이프라인

```
입력(ePub 2.0) → 파싱 → AI재구성 → 인터랙션삽입 → ePub3.0변환+접근성 → 검증
```

각 단계는 독립 모듈로 분리되어 있어 개별 테스트와 교체가 가능합니다. 이 구조는 다음과 같은 이점을 제공합니다:
- 각 단계를 독립적으로 테스트 가능 (5개 Test Suite)
- AI 모듈을 다른 LLM으로 교체 가능 (OpenAI -> Anthropic 등)
- 특정 단계만 건너뛰기 가능 (예: 이미지 생성 비활성화)

### 3. 모노레포 (pnpm workspace)

`@gov-epub/core`를 독립 라이브러리로 분리하여:
- API 서버 없이 CLI로도 사용 가능
- 향후 Sigil 플러그인에서 핵심 로직 재사용
- npm 패키지로 배포 가능
- `workspace:*` 참조로 로컬 개발 시 실시간 반영

### 4. OPF 중심 파싱 전략

ePub은 본질적으로 OPF(Open Packaging Format) 파일이 모든 구조를 정의합니다.
파서는 `container.xml` -> OPF -> 매니페스트/스파인 순서로 탐색합니다.

```
META-INF/container.xml  →  OPF 경로 획득
     ↓
content.opf  →  메타데이터, 매니페스트(파일 목록), 스파인(읽기 순서)
     ↓
*.ncx  →  목차 (navMap → navPoint → TocEntry[])
     ↓
*.xhtml  →  각 챕터 콘텐츠 파싱
```

### 5. 인메모리 스토리지 (데모용)

API 서버는 데모 목적으로 인메모리 스토리지를 사용합니다.
프로덕션에서는 `StorageService` 인터페이스를 구현하여 S3, GCS 등으로 교체합니다.

### 6. 환경 변수 기반 API URL 관리

프론트엔드는 `NEXT_PUBLIC_API_URL` 환경 변수로 API 서버 주소를 설정합니다.
미설정 시 `http://localhost:3001`을 기본값으로 사용합니다.

```typescript
// packages/web/src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
```

이 패턴은 모든 페이지 컴포넌트에서 `api.ts`의 함수를 통해 일관되게 적용됩니다.

### 7. 데모 Fallback 패턴

프론트엔드의 모든 페이지는 API 호출 실패 시 데모 데이터로 자동 전환됩니다:

```typescript
// 공통 패턴
try {
  const data = await apiFunction(id);
  setData(data);
} catch {
  setData(DEMO_DATA); // 데모 데이터로 fallback
}
```

변환 진행 페이지는 `demo-` 접두사가 붙은 jobId를 감지하여 자동 애니메이션 모드로 동작합니다.

---

## 배포 아키텍처

### 개발 환경 (로컬)

```
[개발자 PC]
  ├── pnpm dev        → Next.js Dev Server (포트 3000, HMR)
  ├── pnpm dev:api    → Express Dev Server (포트 3001, tsx watch)
  └── pnpm test       → Vitest (5 Suites, 60 Tests)
```

### 프로덕션 환경 (GCP)

```
[CDN / Load Balancer]
  │
  ├── [Cloud Run: Web] ── Next.js 빌드 결과물 서빙
  │       │
  │       └── NEXT_PUBLIC_API_URL=https://api.example.com
  │
  ├── [Cloud Run: API] ── Express 서버
  │       │
  │       ├── GCS (Google Cloud Storage) ── ePub 파일 저장
  │       ├── PostgreSQL ── 메타데이터, 사용자
  │       └── Redis ── 작업 큐, 캐시
  │
  └── [External APIs]
        ├── OpenAI GPT-4
        ├── ElevenLabs TTS
        └── Stability AI
```

---

## 기술 스택 선택 이유

| 기술 | 선택 이유 |
|------|-----------|
| **TypeScript** | 타입 안전성, 모든 패키지에서 일관된 개발 경험, strict 모드로 런타임 오류 방지 |
| **pnpm** | 빠른 설치, 엄격한 의존성 격리, 모노레포 네이티브 지원 |
| **JSZip** | ePub(=ZIP) 파일 처리, 브라우저/Node.js 양쪽 지원 |
| **htmlparser2** | 빠르고 관대한 HTML/XML 파싱, 잘못된 마크업 허용 (ePub 2.0 호환에 필수) |
| **chardet** | 인코딩 자동 감지 (한국어 ePub에서 발생하는 EUC-KR/CP949 등 처리) |
| **Express** | 간결한 REST API, 미들웨어 생태계, multer 파일 업로드 지원 |
| **Next.js 16** | App Router SSR, React Server Components, Tailwind CSS v4 통합 |
| **Vitest** | TypeScript/ESM 네이티브, Jest 호환 API, 빠른 실행 속도 |
| **tsup** | 빠른 번들링, ESM/CJS 동시 출력, DTS 자동 생성 |
| **epub.js** | 브라우저 내 ePub 뷰어, 페이지 네비게이션 지원 |

---

## 확장 가이드

### 새로운 AI 인터랙션 모듈 추가

1. `packages/core/src/interaction/<module-name>/index.ts` 생성
2. Mock + Real API 로직 모두 구현
3. `interaction/types.ts`에 타입 추가
4. `interaction/index.ts`의 `generateAiContent()`에 등록

### 새로운 파서 지원

1. `packages/core/src/parser/` 디렉토리에 새 파서 추가
2. `ParsedEpub` 인터페이스를 출력으로 맞춤
3. `parser/index.ts`에서 입력 형식 감지 후 분기

### 프로덕션 스토리지 교체

1. `packages/api/src/services/storage-service.ts`의 인터페이스 구현
2. 환경 변수로 스토리지 백엔드 선택
3. S3, GCS, Azure Blob 등 지원

### 새로운 API 엔드포인트 추가

1. `packages/api/src/routes/`에 새 라우트 파일 생성
2. `server.ts`에 라우터 등록
3. 필요 시 미들웨어 (인증 등) 적용

### 새로운 프론트엔드 페이지 추가

1. `packages/web/src/app/<page-name>/page.tsx` 생성
2. `api.ts`에 필요한 API 함수 추가
3. 사이드바 (`components/layout/sidebar.tsx`)에 네비게이션 링크 추가

---

## 준수 표준

| 표준 | 적용 위치 |
|------|-----------|
| KWCAG 2.1 | `core/accessibility/` |
| EPUB Accessibility 1.1 | `core/accessibility/` |
| WCAG 2.1 AA | `web/` (프론트엔드) |
| ePub 3.0 (IDPF/W3C) | `core/converter/` |
| ePubCheck 4.x | `core/validator/` |
| SMIL 3.0 | `core/interaction/tts/` |
| Conventional Commits | Git 커밋 메시지 |
| Semantic Versioning | 패키지 버전 관리 |
