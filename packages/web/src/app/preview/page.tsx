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
import { DEMO_PREVIEW } from '@/lib/demo-data';
import Waveform from '@/components/ui/waveform';

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
        const ePub = (await import('epubjs')).default;
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
      } catch {
        if (!cancelled) {
          setError('ePub 뷰어를 로드할 수 없습니다. 실제 변환 작업이 필요합니다.');
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
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-600 text-sm font-medium">{error}</p>
        <p className="text-xs text-gray-400 mt-1">실제 변환 작업을 실행하면 ePub 뷰어에서 결과를 확인할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="relative" style={{ height: '600px' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500">ePub 로딩 중...</p>
            </div>
          </div>
        )}
        <div ref={viewerRef} className="w-full h-full" />
      </div>
      <div className="flex items-center justify-between p-3 border-t border-gray-100 bg-gray-50">
        <button onClick={prev} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> 이전
        </button>
        <span className="text-[10px] text-gray-400 font-mono truncate max-w-[200px]">
          {currentPage ? currentPage.slice(0, 30) + '...' : ''}
        </span>
        <button onClick={next} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          다음 <ChevronRight className="w-3.5 h-3.5" />
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
    if (!jobId) { setLoading(false); return; }
    async function load() {
      try {
        const preview = await getPreview(jobId!);
        setData(preview);
      } catch {
        setData(DEMO_PREVIEW);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jobId]);

  // Load demo data when no jobId
  useEffect(() => {
    if (!jobId) setData(DEMO_PREVIEW);
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  const preview = data ?? DEMO_PREVIEW;
  const chapters = preview.original.chapters;
  const convertedChapters = preview.converted.chapters;
  const quizzes = preview.aiContent.quizzes;
  const summaries = preview.aiContent.summaries;

  const isNoJob = !jobId;

  const tabs = [
    { key: 'compare' as const, icon: BookOpenCheck, label: 'Before/After' },
    { key: 'quiz' as const, icon: HelpCircle, label: '퀴즈' },
    { key: 'tts' as const, icon: Volume2, label: 'TTS' },
    { key: 'summary' as const, icon: MessageSquare, label: '요약' },
    { key: 'epub' as const, icon: BookOpen, label: 'ePub 뷰어' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-4 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">미리보기</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            원본과 변환 결과를 비교하고 AI 콘텐츠를 확인합니다
            {(isNoJob || jobId?.startsWith('demo')) && <span className="ml-1.5 text-gray-400">(데모)</span>}
          </p>
        </div>
        {!isNoJob && !jobId?.startsWith('demo') && (
          <Link
            href={`/report?job=${jobId}`}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
          >
            리포트 보기 →
          </Link>
        )}
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-white rounded-lg border border-gray-200 p-1">
        {tabs.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === key
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Chapter selector */}
      {(activeTab === 'compare' || activeTab === 'quiz' || activeTab === 'summary' || activeTab === 'tts') && chapters.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {chapters.map((ch, i) => (
            <button
              key={ch.id}
              onClick={() => setSelectedChapter(i)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                selectedChapter === i
                  ? 'bg-gray-900 text-white'
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">원본 (ePub 2.0)</span>
            </div>
            <div
              className="p-5 prose prose-gray prose-sm max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: chapters[selectedChapter]?.html ?? '' }}
            />
          </div>
          <div className="bg-white rounded-xl border border-indigo-200 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-indigo-100 bg-indigo-50/30 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wide">변환 결과 (ePub 3.0)</span>
              <span className="text-[10px] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded font-medium">AI 하이라이트</span>
            </div>
            <div
              className="p-5 prose prose-gray prose-sm max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: convertedChapters[selectedChapter]?.html ?? '' }}
            />
          </div>
        </div>
      )}

      {/* TAB: Quiz */}
      {activeTab === 'quiz' && (
        <div className="space-y-3">
          {(quizzes.find((q) => q.chapterId === chapters[selectedChapter]?.id)?.questions ?? []).map((q, i) => {
            const qKey = `${selectedChapter}-${i}`;
            const answered = showAnswers[qKey];
            const selected = quizAnswers[qKey];
            return (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-md flex items-center justify-center text-[11px] font-bold">Q{i + 1}</span>
                  {q.question}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, j) => {
                    const isCorrect = j === q.correctIndex;
                    const isSelected = selected === j;
                    let style = 'border-gray-200 hover:border-gray-300';
                    if (answered) {
                      if (isCorrect) style = 'border-emerald-300 bg-emerald-50 text-emerald-800';
                      else if (isSelected && !isCorrect) style = 'border-red-300 bg-red-50 text-red-700';
                    } else if (isSelected) {
                      style = 'border-indigo-300 bg-indigo-50 text-indigo-700';
                    }
                    return (
                      <button
                        key={j}
                        onClick={() => !answered && setQuizAnswers((a) => ({ ...a, [qKey]: j }))}
                        className={`p-3 rounded-lg border text-sm text-left transition-colors ${style}`}
                        disabled={!!answered}
                      >
                        <span className="font-medium mr-2">{String.fromCharCode(65 + j)}.</span>
                        {opt}
                        {answered && isCorrect && <CheckCircle className="w-3.5 h-3.5 inline ml-2 text-emerald-500" />}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={() => setShowAnswers((a) => ({ ...a, [qKey]: true }))}
                    disabled={selected === undefined || !!answered}
                    className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
                  >
                    정답 확인
                  </button>
                  {answered && (
                    <span className={`text-xs font-medium ${selected === q.correctIndex ? 'text-emerald-600' : 'text-red-500'}`}>
                      {selected === q.correctIndex ? '정답입니다!' : '오답입니다. 다시 확인해보세요.'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {(quizzes.find((q) => q.chapterId === chapters[selectedChapter]?.id)?.questions ?? []).length === 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <HelpCircle className="w-6 h-6 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">이 챕터에 대한 퀴즈가 없습니다</p>
            </div>
          )}
        </div>
      )}

      {/* TAB: TTS */}
      {activeTab === 'tts' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-indigo-600" /> TTS 음성 및 미디어 오버레이
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => setTtsPlaying(!ttsPlaying)}
                className="p-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {ttsPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <div className="flex-1 space-y-1">
                <Waveform playing={ttsPlaying} progress={ttsProgress} barCount={24} />
                <div className="flex justify-between">
                  <span className="text-[10px] text-gray-400">1:24</span>
                  <span className="text-[10px] text-gray-400">4:02</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed bg-white rounded-lg p-3 border border-gray-100">
              <span className="border-b-2 border-indigo-400 pb-px">새침하게 흐린 품이 눈이 올 듯하더니</span> 눈은 아니 오고 얼다가 만 북풍이 핫바람으로 문풍지를 거칠게 때리며 나왔다...
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-md">
              SMIL 3.0 싱크: <strong className="text-gray-700">42개</strong>
            </span>
            <span className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-md">
              오디오: <strong className="text-gray-700">4분 2초</strong>
            </span>
          </div>
          <p className="text-[11px] text-gray-400">* 데모 모드: 실제 TTS 음성은 ElevenLabs API 키 설정 후 생성됩니다</p>
        </div>
      )}

      {/* TAB: Summary */}
      {activeTab === 'summary' && (
        <div className="space-y-3">
          {summaries.length > 0 ? (
            summaries.map((s, i) => {
              const chapter = chapters.find((c) => c.id === s.chapterId);
              return (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-semibold text-sm text-gray-900">{chapter?.title ?? `챕터 ${i + 1}`}</h4>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3">{s.text}</p>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <MessageSquare className="w-6 h-6 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">요약 데이터가 없습니다</p>
            </div>
          )}
        </div>
      )}

      {/* TAB: ePub Viewer */}
      {activeTab === 'epub' && <EpubViewer jobId={jobId || 'demo'} />}
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      }
    >
      <PreviewContent />
    </Suspense>
  );
}
