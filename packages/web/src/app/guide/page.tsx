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
  Sparkles,
  ArrowRight,
  Zap,
  Code,
  Globe,
} from 'lucide-react';

const STEPS = [
  {
    icon: Upload,
    title: 'ePub 파일 업로드',
    desc: 'ePub 2.0 이하 형식의 전자책 파일을 드래그 앤 드롭으로 업로드합니다. 최대 50MB까지 지원하며, 샘플 파일로 바로 시작할 수도 있습니다.',
    color: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-50',
  },
  {
    icon: Sparkles,
    title: '변환 옵션 선택',
    desc: '퀴즈 생성, TTS 음성 변환, 챕터 요약, 이미지 생성 등 원하는 인터랙티브 기능을 선택합니다.',
    color: 'from-indigo-500 to-purple-500',
    bg: 'bg-indigo-50',
  },
  {
    icon: RefreshCw,
    title: 'AI 자동 변환',
    desc: '5단계 파이프라인(파싱 → 재구성 → 인터랙션 삽입 → 변환 → 검증)을 통해 ePub 3.0으로 자동 변환됩니다.',
    color: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-50',
  },
  {
    icon: Eye,
    title: '결과 확인 및 편집',
    desc: 'Before/After 비교 화면에서 변환 결과를 확인하고, AI가 변환한 구간이 하이라이트됩니다.',
    color: 'from-pink-500 to-rose-500',
    bg: 'bg-pink-50',
  },
  {
    icon: CheckCircle,
    title: '검증 및 다운로드',
    desc: 'ePubCheck, 접근성 검증(KWCAG 2.1) 결과를 확인하고 최종 ePub 3.0 파일을 다운로드합니다.',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
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
  { name: 'Tailwind CSS v4', desc: '스타일링', icon: Sparkles },
  { name: 'Node.js (Express)', desc: 'API 서버', icon: Zap },
  { name: 'OpenAI GPT-4', desc: 'AI 변환 엔진', icon: Sparkles },
  { name: 'ElevenLabs TTS', desc: '음성 합성', icon: Sparkles },
  { name: 'ePubCheck 4.x', desc: '구조 검증', icon: CheckCircle },
  { name: 'Ace by DAISY', desc: '접근성 검증', icon: CheckCircle },
  { name: 'epub.js', desc: 'ePub 뷰어', icon: BookOpen },
];

export default function GuidePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">사용 가이드</h1>
        <p className="text-sm text-gray-600 mt-1">ePub 3.0 리마스터링 도구 사용법을 안내합니다</p>
      </div>

      {/* Steps */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-indigo-500" /> 변환 과정
        </h2>
        <div className="space-y-4">
          {STEPS.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <div key={i} className="flex gap-4 group animate-slideUp" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="shrink-0 flex flex-col items-center">
                <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6" style={{ color: color.includes('blue') ? '#4f46e5' : color.includes('indigo') ? '#7c3aed' : color.includes('purple') ? '#c026d3' : color.includes('pink') ? '#e11d48' : '#10b981' }} />
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-0.5 h-8 bg-gray-200 mt-2" />
                )}
              </div>
              <div className="pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">STEP {i + 1}</span>
                  <h3 className="font-semibold text-gray-900">{title}</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="w-5 h-5 text-indigo-500" />
          <h2 className="font-semibold text-gray-900">자주 묻는 질문 (FAQ)</h2>
        </div>
        <div className="space-y-2">
          {FAQ.map(({ q, a }, i) => (
            <div key={i} className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-all">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full px-5 py-4 text-left flex items-center justify-between"
              >
                <span className="font-medium text-sm text-gray-900">{q}</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 shrink-0 ml-4 ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-200 ${openFaq === i ? 'max-h-40' : 'max-h-0'}`}>
                <p className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Code className="w-5 h-5 text-indigo-500" /> 기술 스택
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {TECH_STACK.map(({ name, desc, icon: Icon }) => (
            <div key={name} className="p-3 bg-gray-50/80 rounded-xl hover:bg-indigo-50/40 hover:border-indigo-200 border border-transparent transition-all">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-indigo-500" />
                <span className="font-medium text-sm text-gray-900">{name}</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 ml-6">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
