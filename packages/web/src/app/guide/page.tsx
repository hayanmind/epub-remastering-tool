'use client';

import { useState } from 'react';
import {
  Upload,
  RefreshCw,
  BookOpen,
  Eye,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Zap,
  Code,
  Globe,
  Settings,
  Volume2,
  Shield,
  FileCheck,
} from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    title: 'ePub 파일 업로드',
    desc: 'ePub 2.0 이하 형식의 전자책 파일을 드래그 앤 드롭으로 업로드합니다. 최대 50MB까지 지원하며, 샘플 파일로 바로 시작할 수도 있습니다.',
  },
  {
    icon: Settings,
    title: '변환 옵션 선택',
    desc: '퀴즈 생성, TTS 음성 변환, 챕터 요약, 이미지 생성 등 원하는 인터랙티브 기능을 선택합니다.',
  },
  {
    icon: RefreshCw,
    title: 'AI 자동 변환',
    desc: '5단계 파이프라인(파싱 → 재구성 → 인터랙션 삽입 → 변환 → 검증)을 통해 ePub 3.0으로 자동 변환됩니다.',
  },
  {
    icon: Eye,
    title: '결과 확인 및 편집',
    desc: 'Before/After 비교 화면에서 변환 결과를 확인하고, AI가 변환한 구간이 하이라이트됩니다.',
  },
  {
    icon: CheckCircle,
    title: '검증 및 다운로드',
    desc: 'ePubCheck, 접근성 검증(KWCAG 2.1) 결과를 확인하고 최종 ePub 3.0 파일을 다운로드합니다.',
  },
];

const FAQ = [
  {
    q: 'ePub 2.0과 3.0의 차이는 무엇인가요?',
    a: 'ePub 2.0은 텍스트 중심의 정적 구조이며, ePub 3.0은 HTML5/CSS3/JavaScript를 지원하여 멀티미디어, 인터랙션, 접근성 기능을 제공합니다.',
  },
  {
    q: 'API 키 없이도 사용할 수 있나요?',
    a: '네, API 키가 없으면 Mock 모드로 동작하여 데모용 결과를 생성합니다. 실제 AI 기능은 OpenAI 등의 API 키가 필요합니다.',
  },
  {
    q: '지원하는 파일 형식은 무엇인가요?',
    a: '.epub 파일 (ePub 2.0 이하)을 지원합니다. 변환 결과는 ePub 3.0 Spec 3.2 표준을 준수합니다.',
  },
  {
    q: '접근성 기준은 어떤 것을 따르나요?',
    a: 'KWCAG 2.1 (한국형 웹 콘텐츠 접근성 지침)과 EPUB Accessibility 1.1 (W3C) 표준을 준수합니다.',
  },
  {
    q: '변환된 파일의 품질은 어떻게 검증하나요?',
    a: 'ePubCheck 4.x를 통한 구조 검증, Ace by DAISY를 통한 접근성 검증, 자체 KPI 13개 항목에 대한 자동 측정을 수행합니다.',
  },
];

const TECH_STACK = [
  { name: 'Next.js 16', desc: 'React 프레임워크', icon: Globe },
  { name: 'TypeScript', desc: '타입 안정성', icon: Code },
  { name: 'Tailwind CSS v4', desc: '스타일링', icon: Code },
  { name: 'Node.js (Express)', desc: 'API 서버', icon: Zap },
  { name: 'OpenAI GPT-4', desc: 'AI 변환 엔진', icon: Zap },
  { name: 'ElevenLabs TTS', desc: '음성 합성', icon: Volume2 },
  { name: 'ePubCheck 4.x', desc: '구조 검증', icon: FileCheck },
  { name: 'Ace by DAISY', desc: '접근성 검증', icon: Shield },
  { name: 'epub.js', desc: 'ePub 뷰어', icon: BookOpen },
];

export default function GuidePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-lg font-bold text-gray-900">사용 가이드</h1>
        <p className="text-xs text-gray-500 mt-0.5">ePub 3.0 리마스터링 도구 사용법을 안내합니다</p>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-sm text-gray-900 mb-5 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 text-indigo-600" /> 변환 과정
        </h2>
        <div className="space-y-4">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <div key={i} className="flex gap-3.5">
              <div className="shrink-0 flex flex-col items-center">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-px h-6 bg-gray-200 mt-1.5" />
                )}
              </div>
              <div className="pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">STEP {i + 1}</span>
                  <h3 className="font-semibold text-sm text-gray-900">{title}</h3>
                </div>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="w-4 h-4 text-indigo-600" />
          <h2 className="font-semibold text-sm text-gray-900">자주 묻는 질문 (FAQ)</h2>
        </div>
        <div className="space-y-1.5">
          {FAQ.map(({ q, a }, i) => (
            <div key={i} className="border border-gray-100 rounded-lg overflow-hidden hover:border-gray-200 transition-colors">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-4 py-3 text-left flex items-center justify-between"
              >
                <span className="font-medium text-sm text-gray-900">{q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ml-4 ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-200 ${openFaq === i ? 'max-h-40' : 'max-h-0'}`}>
                <p className="px-4 pb-3 text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
          <Code className="w-4 h-4 text-indigo-600" /> 기술 스택
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {TECH_STACK.map(({ name, desc, icon: Icon }) => (
            <div key={name} className="p-2.5 bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-medium text-sm text-gray-900">{name}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5 ml-[22px]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
