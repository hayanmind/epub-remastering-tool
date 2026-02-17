# ePub 3.0 인터랙티브 리마스터링 도구

AI 기반 ePub 2.0 → 3.0 자동 변환 시스템

## 개요

구형 ePub 2.0 이하 전자책을 최신 국제표준 ePub 3.0 인터랙티브 콘텐츠로 자동 변환합니다.

### 주요 기능

- **ePub 2.0 자동 파싱**: HTML/XML/OPF/NCX 구조 분석, 메타데이터 추출, 오류 감지
- **AI 기반 콘텐츠 재구성**: 시맨틱 태그 자동 부여, 스타일 매핑, 불필요 태그 정리
- **인터랙티브 요소 삽입**: 퀴즈 자동 생성, TTS 음성 변환, 용어 팝업, 이미지 추천
- **ePub 3.0 변환**: HTML5/CSS3/JS 기반 패키징, ePubCheck 자동 검증
- **접근성 자동 적용**: KWCAG 2.1, EPUB Accessibility 1.1 표준 준수
- **웹 대시보드**: 파일 업로드, 변환 모니터링, Before/After 비교, KPI 리포트

## 빠른 시작

### 요구사항

- Node.js 20+
- pnpm 9+

### 설치

```bash
git clone https://github.com/hayanmind/gov-epub-2026.git
cd gov-epub-2026
pnpm install
```

### 실행

```bash
# API 서버 (포트 3001)
pnpm dev:api

# 웹 대시보드 (포트 3000)
pnpm dev
```

### 환경 변수 (선택)

```bash
cp .env.example .env
# API 키 없으면 Mock 모드로 자동 동작
```

## 프로젝트 구조

```
packages/
  core/   - ePub 변환 핵심 엔진 (파서, 변환기, 접근성, 검증)
  api/    - REST API 서버 (Express)
  web/    - 웹 대시보드 (Next.js)
fixtures/ - 테스트용 ePub 2.0 샘플
docs/     - 기술 문서
```

## 기술 스택

- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **AI**: OpenAI GPT-4, ElevenLabs TTS (Mock 모드 지원)
- **ePub**: JSZip, htmlparser2, ePubCheck
- **테스트**: Vitest, Playwright

## 라이선스

MIT License

## 기여

[CONTRIBUTING.md](./CONTRIBUTING.md) 참조

## 지원 사업

한국출판문화산업진흥원 2025년 출판콘텐츠 기술개발 지원 사업
