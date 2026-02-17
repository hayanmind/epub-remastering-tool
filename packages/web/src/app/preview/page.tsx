'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  HelpCircle,
  Volume2,
  MessageSquare,
  Loader2,
  CheckCircle,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Upload,
} from 'lucide-react';
import { getPreview, getDownloadUrl, getSampleDownloadUrl, type PreviewData } from '@/lib/api';

// -------------------------------------------------------------------------
// Demo fallback data
// -------------------------------------------------------------------------
const DEMO_PREVIEW: PreviewData = {
  jobId: 'demo',
  original: {
    metadata: {},
    chapters: [
      {
        id: 'ch1',
        title: '제1장: 첫 번째 별',
        html: `<p>어둠이 내려앉은 밤하늘을 올려다보면, 수많은 별들이 반짝이는 모습을 볼 수 있다. 우주는 끝없이 넓고, 그 안에는 셀 수 없이 많은 천체들이 존재한다.</p>
<p>우리가 속한 태양계는 은하수 나선 팔 중 하나에 자리 잡고 있다. 태양계에는 태양을 중심으로 8개의 행성이 공전하고 있으며, 지구는 그중 세 번째 행성이다.</p>
<p>지구에서 맨눈으로 볼 수 있는 가장 밝은 별은 시리우스이다. 밤하늘의 '큰개자리'에 있는 이 별은 지구로부터 약 8.6광년 떨어져 있다.</p>`,
      },
      {
        id: 'ch2',
        title: '제2장: 행성의 탐험',
        html: `<p>태양계의 행성들은 각각 고유한 특징을 지니고 있다. 수성은 태양에 가장 가까운 행성이며, 금성은 지구와 비슷한 크기를 가지고 있다.</p>
<p>화성은 '붉은 행성'으로 알려져 있으며, 목성은 태양계에서 가장 큰 행성이다. 토성의 고리는 수백만 개의 얼음 조각으로 이루어져 있다.</p>`,
      },
    ],
  },
  converted: {
    metadata: {},
    chapters: [
      {
        id: 'ch1',
        title: '제1장: 첫 번째 별',
        html: `<p>어둠이 내려앉은 밤하늘을 올려다보면, 수많은 별들이 반짝이는 모습을 볼 수 있다. 우주는 끝없이 넓고, 그 안에는 셀 수 없이 많은 <mark class="ai-highlight">천체</mark>들이 존재한다.</p>
<p>우리가 속한 <mark class="ai-highlight">태양계</mark>는 <mark class="ai-highlight">은하수</mark> 나선 팔 중 하나에 자리 잡고 있다. 태양계에는 태양을 중심으로 8개의 행성이 공전하고 있으며, 지구는 그중 세 번째 행성이다.</p>
<p>지구에서 맨눈으로 볼 수 있는 가장 밝은 별은 <mark class="ai-highlight">시리우스</mark>이다. 밤하늘의 '큰개자리'에 있는 이 별은 지구로부터 약 8.6광년 떨어져 있다.</p>`,
      },
      {
        id: 'ch2',
        title: '제2장: 행성의 탐험',
        html: `<p>태양계의 행성들은 각각 고유한 특징을 지니고 있다. <mark class="ai-highlight">수성</mark>은 태양에 가장 가까운 행성이며, <mark class="ai-highlight">금성</mark>은 지구와 비슷한 크기를 가지고 있다.</p>
<p><mark class="ai-highlight">화성</mark>은 '붉은 행성'으로 알려져 있으며, <mark class="ai-highlight">목성</mark>은 태양계에서 가장 큰 행성이다. 토성의 고리는 수백만 개의 얼음 조각으로 이루어져 있다.</p>`,
      },
    ],
  },
  aiContent: {
    quizzes: [
      {
        chapterId: 'ch1',
        questions: [
          {
            question: '태양계에서 지구는 몇 번째 행성인가?',
            options: ['첫 번째', '두 번째', '세 번째', '네 번째'],
            correctIndex: 2,
          },
          {
            question: '지구에서 맨눈으로 볼 수 있는 가장 밝은 별은?',
            options: ['베가', '시리우스', '알타이르', '폴라리스'],
            correctIndex: 1,
          },
        ],
      },
      {
        chapterId: 'ch2',
        questions: [
          {
            question: '태양계에서 가장 큰 행성은?',
            options: ['토성', '해왕성', '목성', '천왕성'],
            correctIndex: 2,
          },
        ],
      },
    ],
    summaries: [
      {
        chapterId: 'ch1',
        text: '이 장에서는 우주의 기본 구조와 태양계, 지구에서 관측 가능한 별에 대해 소개합니다. 은하수 속 태양계의 위치와 시리우스의 특징을 다룹니다.',
      },
      {
        chapterId: 'ch2',
        text: '태양계 행성들의 고유한 특징을 살펴봅니다. 수성부터 토성까지 각 행성의 특성을 소개합니다.',
      },
    ],
    highlights: [],
  },
};

// -------------------------------------------------------------------------
// ePub Viewer component
// -------------------------------------------------------------------------
function EpubViewer({ jobId }: { jobId: string }) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState('');

  useEffect(() => {
    if (!viewerRef.current) return;
    let cancelled = false;

    async function loadEpub() {
      try {
        // Dynamically import epub.js
        const ePub = (await import('epubjs')).default;

        // Try the converted epub first, fall back to a sample epub for demo
        const urls = [
          getDownloadUrl(jobId),
          getSampleDownloadUrl('alice-in-wonderland'),
        ];

        let arrayBuffer: ArrayBuffer | null = null;
        for (const url of urls) {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const blob = await res.blob();
              arrayBuffer = await blob.arrayBuffer();
              break;
            }
          } catch {
            // Try next URL
          }
        }

        if (!arrayBuffer) throw new Error('ePub 파일을 불러올 수 없습니다');
        if (cancelled || !viewerRef.current) return;

        const book = ePub(arrayBuffer);
        const rendition = book.renderTo(viewerRef.current, {
          width: '100%',
          height: '100%',
          spread: 'none',
        });

        renditionRef.current = rendition;
        rendition.display();

        rendition.on('relocated', (location: { start?: { cfi?: string } }) => {
          setCurrentPage(location?.start?.cfi ?? '');
        });

        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError('ePub 뷰어를 로드하는데 실패했습니다. 변환된 파일이 필요합니다.');
          setLoading(false);
        }
      }
    }

    loadEpub();
    return () => { cancelled = true; };
  }, [jobId]);

  const prev = () => {
    if (renditionRef.current) (renditionRef.current as { prev: () => void }).prev();
  };

  const next = () => {
    if (renditionRef.current) (renditionRef.current as { next: () => void }).next();
  };

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">{error}</p>
        <p className="text-sm text-gray-500 mt-1">실제 변환 작업을 실행하면 ePub 뷰어에서 결과를 확인할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="relative" style={{ height: '600px' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">ePub 로딩 중...</p>
            </div>
          </div>
        )}
        <div ref={viewerRef} className="w-full h-full" />
      </div>
      <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50">
        <button
          onClick={prev}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> 이전
        </button>
        <span className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
          {currentPage ? currentPage.slice(0, 30) + '...' : ''}
        </span>
        <button
          onClick={next}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
        >
          다음 <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------------
// Main preview page
// -------------------------------------------------------------------------
function PreviewContent() {
  const params = useSearchParams();
  const jobId = params.get('job');
  const [activeTab, setActiveTab] = useState<'compare' | 'quiz' | 'tts' | 'summary' | 'epub'>('compare');
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChapter, setSelectedChapter] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({});
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsProgress, setTtsProgress] = useState(35);

  useEffect(() => {
    if (!jobId) return;
    async function load() {
      try {
        const preview = await getPreview(jobId!);
        setData(preview);
      } catch {
        // Use demo data
        setData(DEMO_PREVIEW);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jobId]);

  if (!jobId) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16 animate-fadeIn">
        <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <BookOpen className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">미리보기할 작업을 선택하세요</h2>
        <p className="text-gray-600 mt-2">변환 완료 후 미리보기를 사용할 수 있습니다.</p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all"
        >
          <Upload className="w-4 h-4" /> 파일 업로드
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const preview = data ?? DEMO_PREVIEW;
  const chapters = preview.original.chapters;
  const convertedChapters = preview.converted.chapters;
  const quizzes = preview.aiContent.quizzes;
  const summaries = preview.aiContent.summaries;

  const tabs = [
    { key: 'compare' as const, icon: BookOpenCheck, label: 'Before/After' },
    { key: 'quiz' as const, icon: HelpCircle, label: '퀴즈' },
    { key: 'tts' as const, icon: Volume2, label: 'TTS' },
    { key: 'summary' as const, icon: MessageSquare, label: '요약' },
    { key: 'epub' as const, icon: BookOpen, label: 'ePub 뷰어' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">미리보기</h1>
          <p className="text-sm text-gray-600 mt-1">원본과 변환 결과를 비교하고 AI 콘텐츠를 확인합니다</p>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-white rounded-2xl border border-gray-100 p-1.5 shadow-sm">
        {tabs.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === key
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Chapter selector (for compare, quiz, summary) */}
      {(activeTab === 'compare' || activeTab === 'quiz' || activeTab === 'summary' || activeTab === 'tts') && chapters.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {chapters.map((ch, i) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChapter(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedChapter === i
                  ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {ch.title}
            </button>
          ))}
        </div>
      )}

      {/* TAB: Before/After */}
      {activeTab === 'compare' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">원본 (ePub 2.0)</span>
            </div>
            <div
              className="p-6 prose prose-gray prose-sm max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: chapters[selectedChapter]?.html ?? '' }}
            />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-hidden">
            <div className="px-5 py-3 border-b border-indigo-100 bg-indigo-50/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">변환 결과 (ePub 3.0)</span>
              <span className="text-[10px] text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full font-medium">AI 변환 구간 하이라이트</span>
            </div>
            <style>{`
              .ai-highlight { background: linear-gradient(120deg, #dbeafe 0%, #e0e7ff 100%); padding: 1px 4px; border-radius: 4px; border-bottom: 2px solid #818cf8; }
            `}</style>
            <div
              className="p-6 prose prose-gray prose-sm max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: convertedChapters[selectedChapter]?.html ?? '' }}
            />
          </div>
        </div>
      )}

      {/* TAB: Quiz */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          {(quizzes.find((q) => q.chapterId === chapters[selectedChapter]?.id)?.questions ?? []).map((q, i) => {
            const qKey = `${selectedChapter}-${i}`;
            const answered = showAnswers[qKey];
            const selected = quizAnswers[qKey];
            return (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slideUp" style={{ animationDelay: `${i * 100}ms` }}>
                <p className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-bold">Q{i + 1}</span>
                  {q.question}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, j) => {
                    const isCorrect = j === q.correctIndex;
                    const isSelected = selected === j;
                    let style = 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30';
                    if (answered) {
                      if (isCorrect) style = 'border-emerald-400 bg-emerald-50 text-emerald-800';
                      else if (isSelected && !isCorrect) style = 'border-red-300 bg-red-50 text-red-700';
                    } else if (isSelected) {
                      style = 'border-indigo-400 bg-indigo-50 text-indigo-700';
                    }
                    return (
                      <button
                        key={j}
                        onClick={() => !answered && setQuizAnswers((a) => ({ ...a, [qKey]: j }))}
                        className={`p-3 rounded-xl border text-sm text-left transition-all ${style}`}
                        disabled={!!answered}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + j)}.</span>
                        {opt}
                        {answered && isCorrect && <CheckCircle className="w-4 h-4 inline ml-2 text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => setShowAnswers((a) => ({ ...a, [qKey]: true }))}
                    disabled={selected === undefined || !!answered}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    정답 확인
                  </button>
                  {answered && (
                    <span className={`text-sm font-medium ${selected === q.correctIndex ? 'text-emerald-600' : 'text-red-500'}`}>
                      {selected === q.correctIndex ? '정답입니다!' : '오답입니다. 다시 확인해보세요.'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {(quizzes.find((q) => q.chapterId === chapters[selectedChapter]?.id)?.questions ?? []).length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <HelpCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">이 챕터에 대한 퀴즈가 없습니다</p>
            </div>
          )}
        </div>
      )}

      {/* TAB: TTS */}
      {activeTab === 'tts' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-indigo-500" /> TTS 음성 및 미디어 오버레이
          </h3>
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setTtsPlaying(!ttsPlaying)}
                className="p-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-full hover:shadow-md transition-all"
              >
                {ttsPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <div className="flex-1">
                <div className="w-full bg-white/60 rounded-full h-2.5 cursor-pointer">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-blue-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${ttsProgress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">1:24</span>
                  <span className="text-xs text-gray-500">4:02</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed bg-white/50 rounded-xl p-4">
              <span className="bg-yellow-200/70 px-0.5 rounded">어둠이 내려앉은 밤하늘을</span> 올려다보면, 수많은 별들이 반짝이는 모습을 볼 수 있다. 우주는 끝없이 넓고, 그 안에는 셀 수 없이 많은 천체들이 존재한다...
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg">
              SMIL 3.0 싱크 포인트: <strong className="text-gray-700">42개</strong>
            </span>
            <span className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg">
              오디오 길이: <strong className="text-gray-700">4분 2초</strong>
            </span>
          </div>
          <p className="text-xs text-gray-500 italic">* 데모 모드: 실제 TTS 음성은 ElevenLabs API 키 설정 후 생성됩니다</p>
        </div>
      )}

      {/* TAB: Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          {summaries.length > 0 ? (
            summaries.map((s, i) => {
              const chapter = chapters.find((c) => c.id === s.chapterId);
              return (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-slideUp" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-indigo-50 rounded-lg">
                      <MessageSquare className="w-4 h-4 text-indigo-500" />
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">{chapter?.title ?? `챕터 ${i + 1}`}</h4>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gradient-to-r from-indigo-50/40 to-blue-50/40 rounded-xl p-4">{s.text}</p>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600">요약 데이터가 없습니다</p>
            </div>
          )}
        </div>
      )}

      {/* TAB: ePub Viewer */}
      {activeTab === 'epub' && <EpubViewer jobId={jobId} />}
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
