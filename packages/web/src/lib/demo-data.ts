/**
 * 데모용 한국 문학 기반 데이터
 * "운수 좋은 날" (현진건, 1924) — 공유저작물
 */

import type { PreviewData, ValidationReport, JobStatus } from '@/lib/api';

// ---------------------------------------------------------------------------
// 본문 텍스트 (운수 좋은 날, 현진건)
// ---------------------------------------------------------------------------
const CH1_ORIGINAL = `<p>새침하게 흐린 품이 눈이 올 듯하더니 눈은 아니 오고 얼다가 만 북풍이 핫바람으로 문풍지를 거칠게 때리며 나왔다.</p>
<p>이 날이야말로 동소문 안에서 인력거꾼 노릇을 하는 김 첨지에게는 오래간만에도 닥친 운수 좋은 날이었다. 문 안에 들어간 뒤로는, 앞집 마나님을 전찻길까지 모셔다 드린 것을 비롯으로 행여나 손님이 있을까 하고 정류장에서 어정어정하며 내리는 사람 하나하나에게 거의 비는 듯한 눈결을 보내고 있다가 마침내 교원인 듯한 양복쟁이를 태우고 인사동까지 달린 것이 둘.</p>
<p>거기서 한 건 또 있었다. 빈 인력거가 호텔 앞에 와 닿을락말락하여 손님은 뛰어 타겠다는 듯이 길 가운데로 달려 나오며 인력거를 잡으려 하였다.</p>`;

const CH1_CONVERTED = `<p>새침하게 흐린 품이 눈이 올 듯하더니 눈은 아니 오고 얼다가 만 <mark class="ai-highlight">북풍</mark>이 핫바람으로 문풍지를 거칠게 때리며 나왔다.</p>
<p>이 날이야말로 <mark class="ai-highlight">동소문</mark> 안에서 <mark class="ai-highlight">인력거꾼</mark> 노릇을 하는 김 첨지에게는 오래간만에도 닥친 <mark class="ai-highlight">운수 좋은 날</mark>이었다. 문 안에 들어간 뒤로는, 앞집 마나님을 전찻길까지 모셔다 드린 것을 비롯으로 행여나 손님이 있을까 하고 정류장에서 어정어정하며 내리는 사람 하나하나에게 거의 비는 듯한 눈결을 보내고 있다가 마침내 교원인 듯한 양복쟁이를 태우고 <mark class="ai-highlight">인사동</mark>까지 달린 것이 둘.</p>
<p>거기서 한 건 또 있었다. 빈 인력거가 호텔 앞에 와 닿을락말락하여 손님은 뛰어 타겠다는 듯이 길 가운데로 달려 나오며 인력거를 잡으려 하였다.</p>`;

const CH2_ORIGINAL = `<p>그의 아내가 기침으로 쿨럭거리고 있건만 그것은 귓전에도 들어가지 않았다. 그는 계속하여 술을 마시고 거리로 달렸다. 다음 손님을 기다렸다. 이 눈치를 보아서는 오늘 얼마든지 벌 수 있을 듯하였다.</p>
<p>"이 사람아, 왜 남의 인력거를 끌고 나가!" 이런 호통과 함께 인력거 위에 높이 올라앉은 손님은 딴 집 하인인 듯 호기 있는 목소리를 하였다.</p>
<p>치삼은 앙큼한 생각을 하였다. 저놈을 태워주면 한 품어치는 되겠지. 정말 오늘은 운수가 좋은 날이었다.</p>`;

const CH2_CONVERTED = `<p>그의 아내가 <mark class="ai-highlight">기침</mark>으로 쿨럭거리고 있건만 그것은 귓전에도 들어가지 않았다. 그는 계속하여 술을 마시고 거리로 달렸다. 다음 손님을 기다렸다. 이 눈치를 보아서는 오늘 얼마든지 벌 수 있을 듯하였다.</p>
<p>"이 사람아, 왜 남의 인력거를 끌고 나가!" 이런 호통과 함께 인력거 위에 높이 올라앉은 손님은 딴 집 <mark class="ai-highlight">하인</mark>인 듯 호기 있는 목소리를 하였다.</p>
<p>치삼은 앙큼한 생각을 하였다. 저놈을 태워주면 한 품어치는 되겠지. 정말 오늘은 <mark class="ai-highlight">운수가 좋은 날</mark>이었다.</p>`;

const CH3_ORIGINAL = `<p>그런데 이 발이 왜 이리 무거운지, 집이 왜 이리 먼지... 그는 중얼거리며 집으로 돌아가기 시작하였다. 한 걸음 한 걸음이 천근만근이었다.</p>
<p>대문에 들어서니 조용하였다. 방문을 열었다. 설렁탕을 한 그릇 사 가지고 들어왔건만 설렁탕은 식어 있었고, 아내는... 그는 대성 통곡을 하였다.</p>`;

const CH3_CONVERTED = `<p>그런데 이 발이 왜 이리 무거운지, 집이 왜 이리 먼지... 그는 중얼거리며 집으로 돌아가기 시작하였다. 한 걸음 한 걸음이 <mark class="ai-highlight">천근만근</mark>이었다.</p>
<p>대문에 들어서니 조용하였다. 방문을 열었다. <mark class="ai-highlight">설렁탕</mark>을 한 그릇 사 가지고 들어왔건만 설렁탕은 식어 있었고, 아내는... 그는 <mark class="ai-highlight">대성 통곡</mark>을 하였다.</p>`;

// ---------------------------------------------------------------------------
// 데모 미리보기 데이터
// ---------------------------------------------------------------------------
export const DEMO_PREVIEW: PreviewData = {
  jobId: 'demo',
  original: {
    metadata: {},
    chapters: [
      { id: 'ch1', title: '제1장: 운수 좋은 아침', html: CH1_ORIGINAL },
      { id: 'ch2', title: '제2장: 거리 위의 인력거꾼', html: CH2_ORIGINAL },
      { id: 'ch3', title: '제3장: 귀가', html: CH3_ORIGINAL },
    ],
  },
  converted: {
    metadata: {},
    chapters: [
      { id: 'ch1', title: '제1장: 운수 좋은 아침', html: CH1_CONVERTED },
      { id: 'ch2', title: '제2장: 거리 위의 인력거꾼', html: CH2_CONVERTED },
      { id: 'ch3', title: '제3장: 귀가', html: CH3_CONVERTED },
    ],
  },
  aiContent: {
    quizzes: [
      {
        chapterId: 'ch1',
        questions: [
          {
            question: '김 첨지의 직업은 무엇인가?',
            options: ['마부', '인력거꾼', '상인', '교원'],
            correctIndex: 1,
          },
          {
            question: '이 소설의 배경이 되는 지역은 어디인가?',
            options: ['인사동', '동소문 안', '남대문 밖', '종로'],
            correctIndex: 1,
          },
          {
            question: '김 첨지의 두 번째 손님은 어떤 사람이었나?',
            options: ['마나님', '교원인 듯한 양복쟁이', '호텔 손님', '하인'],
            correctIndex: 1,
          },
        ],
      },
      {
        chapterId: 'ch2',
        questions: [
          {
            question: '김 첨지의 아내의 건강 상태는 어떠하였는가?',
            options: ['건강하였다', '기침을 하고 있었다', '입원 중이었다', '다리를 다쳤다'],
            correctIndex: 1,
          },
          {
            question: '김 첨지가 운수가 좋다고 느낀 이유는?',
            options: ['날씨가 좋아서', '손님이 계속 잡혀서', '아내가 나아서', '복권에 당첨되어서'],
            correctIndex: 1,
          },
        ],
      },
      {
        chapterId: 'ch3',
        questions: [
          {
            question: '김 첨지가 집에 가져간 음식은 무엇인가?',
            options: ['떡볶이', '냉면', '설렁탕', '칼국수'],
            correctIndex: 2,
          },
        ],
      },
    ],
    summaries: [
      {
        chapterId: 'ch1',
        text: '1920년대 서울, 인력거꾼 김 첨지에게 오랜만에 손님이 연이어 잡히는 운수 좋은 날이 시작된다. 동소문에서 인사동까지 손님을 태우며 희망에 부풀어 오른다.',
      },
      {
        chapterId: 'ch2',
        text: '김 첨지는 병든 아내를 뒤로한 채 거리에서 연이어 손님을 태운다. 술도 한잔 걸치며 오늘의 행운에 취하지만, 집에 남겨진 아내의 기침 소리는 의식하지 못한다.',
      },
      {
        chapterId: 'ch3',
        text: '하루의 벌이를 끝내고 설렁탕을 사 들고 무거운 발걸음으로 귀가한 김 첨지. 그러나 집에서 기다린 것은 냉혹한 현실이었다. 아이러니한 제목의 의미가 비극적으로 완성된다.',
      },
    ],
    highlights: [],
  },
};

// ---------------------------------------------------------------------------
// 데모 검증 리포트
// ---------------------------------------------------------------------------
export const DEMO_REPORT: ValidationReport = {
  epubcheck: {
    passed: true,
    errors: 0,
    warnings: 2,
    details: ['CSS에서 미사용 속성 경고', '이미지 해상도 권장 수준 미달'],
  },
  accessibility: {
    score: 92,
    issues: ['멀티미디어 대본 일부 누락'],
    passed: [
      '이미지 대체 텍스트 (alt)',
      '문서 구조 태그 (h1-h6)',
      '언어 선언 (lang)',
      '읽기 순서 (reading order)',
      'ARIA 레이블',
      '표 접근성 (scope, summary)',
      '접근성 메타데이터',
    ],
  },
  interactionCount: 4,
  kpiSummary: {
    'ePubCheck 통과율': { value: 95.5, target: 95, unit: '%', passed: true },
    '퀴즈 HTML 오류율': { value: 0.8, target: 1, unit: '%', passed: true },
    '퀴즈 JSON 스키마 통과율': { value: 98.5, target: 98, unit: '%', passed: true },
    'TTS 텍스트 싱크 정확도': { value: 98.2, target: 98, unit: '%', passed: true },
    'TTS 무음 구간 비율': { value: 3.1, target: 5, unit: '%', passed: true },
    'KWCAG 접근성 충족율': { value: 92.0, target: 90, unit: '%', passed: true },
    '인터랙션 요소 자동 포함': { value: 4, target: 3, unit: '종', passed: true },
    'API 평균 응답시간': { value: 2.4, target: 3, unit: '초', passed: true },
    '시스템 가용률': { value: 99.7, target: 99.5, unit: '%', passed: true },
    '자동 TC 통과율': { value: 93.0, target: 90, unit: '%', passed: true },
    '변환 후 구조 오류율': { value: 1.5, target: 2, unit: '%', passed: true },
    'GitHub Actions 테스트': { value: 100, target: 100, unit: '%', passed: true },
    '문서화 커버리지': { value: 5, target: 3, unit: '건', passed: true },
  },
};

// ---------------------------------------------------------------------------
// 데모 작업 목록
// ---------------------------------------------------------------------------
export const DEMO_JOBS: JobStatus[] = [
  {
    jobId: 'demo-unsu-001',
    uploadId: 'upload-001',
    status: 'completed',
    createdAt: '2026-02-22T09:15:00Z',
    progress: { step: 4, totalSteps: 5, percent: 100, currentStage: 'validation', stageName: '검증 완료' },
    result: { downloadUrl: '#', previewUrl: '#', reportUrl: '#', filename: '운수_좋은_날.epub' },
  },
  {
    jobId: 'demo-bom-002',
    uploadId: 'upload-002',
    status: 'completed',
    createdAt: '2026-02-21T14:30:00Z',
    progress: { step: 4, totalSteps: 5, percent: 100, currentStage: 'validation', stageName: '검증 완료' },
    result: { downloadUrl: '#', previewUrl: '#', reportUrl: '#', filename: '봄봄.epub' },
  },
  {
    jobId: 'demo-sanghwa-003',
    uploadId: 'upload-003',
    status: 'completed',
    createdAt: '2026-02-20T11:00:00Z',
    progress: { step: 4, totalSteps: 5, percent: 100, currentStage: 'validation', stageName: '검증 완료' },
    result: { downloadUrl: '#', previewUrl: '#', reportUrl: '#', filename: '상록수.epub' },
  },
  {
    jobId: 'demo-taebaek-004',
    uploadId: 'upload-004',
    status: 'completed',
    createdAt: '2026-02-19T16:45:00Z',
    progress: { step: 4, totalSteps: 5, percent: 100, currentStage: 'validation', stageName: '검증 완료' },
    result: { downloadUrl: '#', previewUrl: '#', reportUrl: '#', filename: '태백산맥_1권.epub' },
  },
];

// ---------------------------------------------------------------------------
// 데모 통계
// ---------------------------------------------------------------------------
export const DEMO_STATS = {
  totalConversions: 5,
  successRate: 95,
  avgTime: '~8초',
  accessibilityScore: '92%',
};
