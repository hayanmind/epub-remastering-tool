'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  RefreshCw,
  Download,
  Eye,
  FileCheck,
  Loader2,
  Upload,
  AlertTriangle,
  ArrowRight,
  FileCode,
  Cpu,
  Package,
  ShieldCheck,
  Wand2,
} from 'lucide-react';
import { getJobStatus, getDownloadUrl, type JobStatus } from '@/lib/api';

const STAGES = [
  { key: 'parsing', label: '파싱 및 분석', desc: 'ePub 2.0 구조 분석 중...', icon: FileCode, demoMs: 1200 },
  { key: 'restructuring', label: 'AI 재구성', desc: '콘텐츠 구조 재편성 중...', icon: Wand2, demoMs: 2000 },
  { key: 'ai_content', label: '인터랙션 삽입', desc: '퀴즈, TTS, 요약 생성 중...', icon: Cpu, demoMs: 2500 },
  { key: 'conversion', label: 'ePub 3.0 변환', desc: 'HTML5/CSS3 변환 및 패키징...', icon: Package, demoMs: 1000 },
  { key: 'validation', label: '검증', desc: 'ePubCheck + 접근성 검증...', icon: ShieldCheck, demoMs: 800 },
];

function ConvertContent() {
  const params = useSearchParams();
  const router = useRouter();
  const jobId = params.get('job');

  const [job, setJob] = useState<JobStatus | null>(null);
  const [demoStage, setDemoStage] = useState(0);
  const [demoCompleted, setDemoCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDemo = jobId?.startsWith('demo-');

  // Poll real API
  useEffect(() => {
    if (!jobId || isDemo) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const data = await getJobStatus(jobId);
        if (!cancelled) setJob(data);
        if (data.status === 'completed' || data.status === 'failed') return;
        if (!cancelled) setTimeout(poll, 1500);
      } catch {
        if (!cancelled) setError('작업 정보를 불러올 수 없습니다.');
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [jobId, isDemo]);

  // Demo mode stepper with variable timing
  useEffect(() => {
    if (!jobId || !isDemo) return;
    let cancelled = false;

    const advance = (stage: number) => {
      if (cancelled) return;
      if (stage >= STAGES.length) {
        setDemoCompleted(true);
        return;
      }
      setDemoStage(stage);
      setTimeout(() => advance(stage + 1), STAGES[stage].demoMs);
    };

    advance(0);
    return () => { cancelled = true; };
  }, [jobId, isDemo]);

  if (!jobId) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16 animate-fadeIn">
        <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-8 h-8 text-gray-300" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">진행 중인 변환 작업이 없습니다</h2>
        <p className="text-gray-500 text-sm mt-1">파일을 업로드하여 변환을 시작하세요.</p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Upload className="w-4 h-4" /> 파일 업로드
        </Link>
      </div>
    );
  }

  // Determine current state
  let currentStage = 0;
  let completed = false;
  let failed = false;
  let progress = 0;
  let errorMsg: string | null = error;

  if (isDemo) {
    currentStage = demoStage;
    completed = demoCompleted;
    progress = completed ? 100 : Math.round(((currentStage) / STAGES.length) * 100);
  } else if (job) {
    if (job.status === 'completed') {
      completed = true;
      currentStage = STAGES.length - 1;
      progress = 100;
    } else if (job.status === 'failed') {
      failed = true;
      errorMsg = job.error || '변환 중 오류가 발생했습니다.';
      currentStage = job.progress?.step ?? 0;
      progress = job.progress?.percent ?? 0;
    } else {
      currentStage = job.progress?.step ?? 0;
      progress = job.progress?.percent ?? 0;
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fadeIn">
      <div>
        <h1 className="text-lg font-bold text-gray-900">변환 진행 상황</h1>
        <p className="text-xs text-gray-500 mt-0.5 font-mono">
          {jobId.slice(0, 12)}...
          {isDemo && <span className="ml-2 text-gray-400 font-sans">(데모)</span>}
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">전체 진행률</span>
          <span className="text-xs font-bold text-indigo-600">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-indigo-600 transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stages */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {STAGES.map((stage, i) => {
          const done = i < currentStage || completed;
          const active = i === currentStage && !completed && !failed;
          const StageIcon = stage.icon;
          return (
            <div
              key={stage.key}
              className={`px-4 py-3.5 flex items-center gap-3.5 transition-colors ${
                active ? 'bg-indigo-50/50' : ''
              } ${i < STAGES.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="shrink-0">
                {done ? (
                  <div className="w-7 h-7 bg-emerald-50 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                ) : active ? (
                  <div className="w-7 h-7 bg-indigo-50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                  </div>
                ) : (
                  <div className="w-7 h-7 border border-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-[11px] font-bold text-gray-400">{i + 1}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <StageIcon className={`w-3.5 h-3.5 ${done ? 'text-emerald-500' : active ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <p className={`text-sm font-medium ${done ? 'text-emerald-700' : active ? 'text-indigo-700' : 'text-gray-500'}`}>
                    {stage.label}
                  </p>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5 ml-5.5">
                  {active ? stage.desc : done ? '완료' : '대기'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Success */}
      {completed && (
        <div className="bg-white border border-emerald-200 rounded-xl p-6 text-center space-y-3 animate-slideUp">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-gray-900">변환 완료</h3>
          <p className="text-sm text-gray-500">ePub 3.0 인터랙티브 콘텐츠가 성공적으로 생성되었습니다.</p>
          <div className="flex gap-2.5 justify-center flex-wrap pt-1">
            <Link
              href={`/preview?job=${jobId}`}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Eye className="w-4 h-4" /> 미리보기
            </Link>
            <Link
              href={`/report?job=${jobId}`}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FileCheck className="w-4 h-4" /> 리포트
            </Link>
            {!isDemo && (
              <a
                href={getDownloadUrl(jobId)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" /> 다운로드
              </a>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {failed && errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3 animate-slideUp">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
          <h3 className="text-base font-bold text-red-800">변환 실패</h3>
          <p className="text-sm text-red-600">{errorMsg}</p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          >
            다시 시도 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ConvertPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      }
    >
      <ConvertContent />
    </Suspense>
  );
}
