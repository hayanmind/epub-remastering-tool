# API 명세서

## Base URL

```
http://localhost:3001
```

프론트엔드에서는 `NEXT_PUBLIC_API_URL` 환경 변수로 Base URL을 설정할 수 있습니다. 미설정 시 `http://localhost:3001`이 기본값입니다.

## 인증

JWT(JSON Web Token) 기반 인증을 사용합니다. 데모 모드에서는 인증 없이 모든 엔드포인트에 접근할 수 있습니다.

인증이 필요한 요청의 헤더:
```
Authorization: Bearer <token>
```

---

## 엔드포인트

### 1. 서버 상태 확인

```
GET /api/health
```

**응답 (200)**
```json
{
  "status": "ok",
  "timestamp": "2026-02-17T10:00:00.000Z",
  "uptime": 3600.5,
  "version": "1.0.0",
  "demo": true
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| status | string | 서버 상태 (`"ok"`) |
| timestamp | string | 현재 서버 시각 (ISO 8601) |
| uptime | number | 서버 업타임 (초) |
| version | string | 서버 버전 |
| demo | boolean | 데모 모드 여부 (API 키 미설정 시 true) |

---

### 2. 파일 업로드

```
POST /api/upload
Content-Type: multipart/form-data
```

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| file | File | O | ePub 2.0 파일 (.epub, 최대 50MB) |

**응답 (200)**
```json
{
  "id": "uuid-string",
  "filename": "example.epub",
  "size": 102400,
  "status": "uploaded"
}
```

---

### 3. 변환 시작

```
POST /api/convert/:uploadId
Content-Type: application/json
```

| URL 파라미터 | 설명 |
|-------------|------|
| uploadId | 업로드 시 반환된 파일 ID |

**요청 Body**
```json
{
  "options": {
    "enableQuiz": true,
    "enableTts": true,
    "enableSummary": true,
    "enableImageGen": false
  }
}
```

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| enableQuiz | boolean | true | LLM 기반 퀴즈 자동 생성 |
| enableTts | boolean | true | TTS 음성 변환 + 미디어 오버레이 |
| enableSummary | boolean | true | AI 챕터 요약 생성 |
| enableImageGen | boolean | false | AI 이미지 생성/추천 |

**응답 (200)**
```json
{
  "jobId": "uuid-string",
  "status": "processing"
}
```

---

### 4. 작업 목록 조회

```
GET /api/jobs
```

**응답 (200)**
```json
{
  "jobs": [
    {
      "jobId": "uuid-string",
      "uploadId": "uuid-string",
      "status": "completed",
      "progress": {
        "step": 5,
        "totalSteps": 5,
        "percent": 100,
        "currentStage": "validation",
        "stageName": "검증"
      },
      "createdAt": "2026-02-17T10:00:00Z"
    }
  ]
}
```

---

### 5. 작업 상태 조회

```
GET /api/jobs/:jobId
```

| URL 파라미터 | 설명 |
|-------------|------|
| jobId | 변환 시 반환된 작업 ID |

**응답 (200)**
```json
{
  "jobId": "uuid-string",
  "uploadId": "uuid-string",
  "status": "processing",
  "progress": {
    "step": 2,
    "totalSteps": 5,
    "percent": 40,
    "currentStage": "restructuring",
    "stageName": "AI 재구성"
  },
  "createdAt": "2026-02-17T10:00:00Z"
}
```

| 필드 | 설명 |
|------|------|
| status | `pending` / `processing` / `completed` / `failed` |
| progress.step | 현재 단계 번호 (0~4) |
| progress.totalSteps | 전체 단계 수 (5) |
| progress.percent | 진행률 (0~100) |
| progress.currentStage | 현재 단계 키 (`parsing`, `restructuring`, `ai_content`, `conversion`, `validation`) |
| progress.stageName | 현재 단계 한국어명 |

---

### 6. 미리보기 데이터

```
GET /api/preview/:jobId
```

작업 완료 후 호출 가능합니다.

**응답 (200)**
```json
{
  "jobId": "uuid-string",
  "original": {
    "metadata": { "title": "제목", "author": "저자" },
    "chapters": [
      { "id": "ch1", "title": "제1장", "html": "<p>원본 내용...</p>" }
    ]
  },
  "converted": {
    "metadata": { "title": "제목", "author": "저자" },
    "chapters": [
      { "id": "ch1", "title": "제1장", "html": "<p><mark class=\"ai-highlight\">변환된</mark> 내용...</p>" }
    ]
  },
  "aiContent": {
    "quizzes": [
      {
        "chapterId": "ch1",
        "questions": [
          {
            "question": "질문 텍스트",
            "options": ["보기1", "보기2", "보기3", "보기4"],
            "correctIndex": 2
          }
        ]
      }
    ],
    "summaries": [
      { "chapterId": "ch1", "text": "이 챕터의 AI 요약..." }
    ],
    "highlights": [
      { "chapterId": "ch1", "type": "restructured" }
    ]
  }
}
```

---

### 7. 검증 리포트

```
GET /api/report/:jobId
```

작업 완료 후 호출 가능합니다.

**응답 (200)**
```json
{
  "jobId": "uuid-string",
  "report": {
    "epubcheck": {
      "passed": true,
      "errors": 0,
      "warnings": 2,
      "details": ["CSS에서 미사용 속성 경고", "이미지 해상도 권장 수준 미달"]
    },
    "accessibility": {
      "score": 92,
      "issues": ["멀티미디어 대본 일부 누락"],
      "passed": ["이미지 대체 텍스트", "문서 구조 태그", "언어 선언", "ARIA 레이블"]
    },
    "interactionCount": 4,
    "kpiSummary": {
      "ePubCheck 통과율": { "value": 95.5, "target": 95, "unit": "%", "passed": true },
      "퀴즈 HTML 오류율": { "value": 0.8, "target": 1, "unit": "%", "passed": true },
      "KWCAG 접근성 충족율": { "value": 92.0, "target": 90, "unit": "%", "passed": true }
    }
  }
}
```

---

### 8. 변환 파일 다운로드

```
GET /api/download/:jobId
```

작업 완료 후 호출 가능합니다.

**응답**: ePub 3.0 파일 바이너리 (Content-Type: `application/epub+zip`)

**응답 헤더**:
```
Content-Type: application/epub+zip
Content-Disposition: attachment; filename="converted-{jobId}.epub"
Content-Length: {파일 크기}
```

---

### 9. 샘플 목록 조회

```
GET /api/samples
```

**응답 (200)**
```json
{
  "samples": [
    {
      "id": "alice-in-wonderland",
      "title": "Alice's Adventures in Wonderland",
      "author": "Lewis Carroll",
      "language": "EN",
      "description": "이상한 나라의 앨리스 (Project Gutenberg)",
      "filename": "alice-in-wonderland.epub",
      "fileSize": 174000,
      "source": "Project Gutenberg"
    }
  ]
}
```

---

### 10. 샘플 다운로드

```
GET /api/samples/:id/download
```

| URL 파라미터 | 설명 |
|-------------|------|
| id | 샘플 ID (`alice-in-wonderland` 등) |

**응답**: ePub 파일 바이너리 (Content-Type: `application/epub+zip`)

---

### 11. 샘플로 변환 시작

```
POST /api/samples/:id/use
```

샘플 ePub 파일을 업로드 디렉토리에 복사하고 업로드 결과를 반환합니다. 이후 `/api/convert/:uploadId`를 호출하여 변환을 시작합니다.

| URL 파라미터 | 설명 |
|-------------|------|
| id | 샘플 ID |

**응답 (201)**
```json
{
  "id": "uuid-string",
  "filename": "alice-in-wonderland.epub",
  "size": 174000,
  "status": "uploaded"
}
```

---

### 12. 로그인

```
POST /api/auth/login
Content-Type: application/json
```

**요청 Body**
```json
{
  "email": "demo@example.com",
  "password": "demo1234"
}
```

데모 모드에서는 어떤 이메일/비밀번호든 데모 사용자로 로그인됩니다.

**응답 (200)**
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": "demo-user",
    "email": "demo@example.com",
    "name": "데모 사용자"
  }
}
```

---

### 13. 회원가입

```
POST /api/auth/register
Content-Type: application/json
```

**요청 Body**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "사용자"
}
```

데모 모드에서는 자동으로 데모 사용자가 반환됩니다.

**응답 (201)**
```json
{
  "token": "jwt-token-string",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "사용자"
  }
}
```

---

### 14. 인증 사용자 정보 조회

```
GET /api/auth/me
Authorization: Bearer <token>
```

**응답 (200)**
```json
{
  "user": {
    "id": "demo-user",
    "email": "demo@example.com",
    "name": "데모 사용자"
  }
}
```

---

### 15. 설정 조회

```
GET /api/settings
```

API 키는 마스킹되어 반환됩니다.

**응답 (200)**
```json
{
  "openaiApiKey": "****abcd",
  "anthropicApiKey": null,
  "hasOpenaiKey": true,
  "hasAnthropicKey": false
}
```

---

### 16. 설정 업데이트

```
POST /api/settings
Content-Type: application/json
```

**요청 Body**
```json
{
  "openaiApiKey": "sk-...",
  "anthropicApiKey": "sk-ant-..."
}
```

**응답 (200)**
```json
{
  "message": "Settings updated",
  "openaiApiKey": "****abcd",
  "anthropicApiKey": "****efgh",
  "hasOpenaiKey": true,
  "hasAnthropicKey": true
}
```

---

## 에러 응답

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "error": "에러 메시지",
  "code": "ERROR_CODE"
}
```

또는 (인증 관련):

```json
{
  "error": {
    "message": "에러 메시지"
  }
}
```

### 에러 코드

| 코드 | HTTP | 설명 |
|------|------|------|
| FILE_NOT_FOUND | 404 | 파일을 찾을 수 없음 |
| INVALID_FORMAT | 400 | 잘못된 파일 형식 (.epub이 아님) |
| JOB_NOT_FOUND | 404 | 작업을 찾을 수 없음 |
| JOB_NOT_COMPLETED | 400 | 작업이 아직 완료되지 않음 |
| CONVERSION_FAILED | 500 | 변환 실패 |
| UNAUTHORIZED | 401 | 인증 필요 또는 토큰 만료 |
| CONFLICT | 409 | 이미 등록된 이메일 (회원가입 시) |
| BAD_REQUEST | 400 | 잘못된 요청 형식 |

---

## 엔드포인트 요약

| # | Method | Path | 설명 | 인증 |
|---|--------|------|------|------|
| 1 | GET | /api/health | 서버 상태 확인 | 불필요 |
| 2 | POST | /api/upload | ePub 파일 업로드 | 선택 |
| 3 | POST | /api/convert/:uploadId | 변환 시작 | 선택 |
| 4 | GET | /api/jobs | 전체 작업 목록 조회 | 선택 |
| 5 | GET | /api/jobs/:jobId | 개별 작업 상태 조회 | 선택 |
| 6 | GET | /api/preview/:jobId | 미리보기 데이터 | 선택 |
| 7 | GET | /api/report/:jobId | 검증 리포트 | 선택 |
| 8 | GET | /api/download/:jobId | 변환 파일 다운로드 | 선택 |
| 9 | GET | /api/samples | 샘플 목록 조회 | 불필요 |
| 10 | GET | /api/samples/:id/download | 샘플 다운로드 | 불필요 |
| 11 | POST | /api/samples/:id/use | 샘플로 변환 시작 | 선택 |
| 12 | POST | /api/auth/login | 로그인 | 불필요 |
| 13 | POST | /api/auth/register | 회원가입 | 불필요 |
| 14 | GET | /api/auth/me | 인증 사용자 정보 | 필수 |
| 15 | GET | /api/settings | 설정 조회 | 선택 |
| 16 | POST | /api/settings | 설정 업데이트 | 선택 |
