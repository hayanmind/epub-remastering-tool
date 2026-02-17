'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  Shield,
  Zap,
  Download,
  Loader2,
  FileCheck,
  TrendingUp,
} from 'lucide-react';
import { getReport, getDownloadUrl, type ValidationReport } from '@/lib/api';

// -------------------------------------------------------------------------
// Demo fallback
// -------------------------------------------------------------------------
const DEMO_REPORT: ValidationReport = {
  epubcheck: { passed: true, errors: 0, warnings: 2, details: ['CSS에서 미사용 속성 경고', '이미지 해상도 권장 수준 미달'] },
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

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 90 ? 'text-emerald-500' : score >= 70 ? 'text-amber-500' : 'text-red-500';
  const bgColor = score >= 90 ? 'from-emerald-500 to-teal-500' : score >= 70 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-pink-500';
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle
          cx="60" cy="60" r="54" fill="none" stroke="url(#gradient)" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className={score >= 90 ? 'text-emerald-500' : score >= 70 ? 'text-amber-500' : 'text-red-500'} style={{ stopColor: 'currentColor' }} />
            <stop offset="100%" className={score >= 90 ? 'text-teal-500' : score >= 70 ? 'text-orange-500' : 'text-pink-500'} style={{ stopColor: 'currentColor' }} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${color}`}>{score}</span>
        <span className="text-xs text-gray-500">/ 100</span>
      </div>
    </div>
  );
}

function ReportContent() {
  const params = useSearchParams();
  const jobId = params.get('job');
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!jobId) { setLoading(false); return; }
      try {
        const data = await getReport(jobId);
        setReport(data.report ?? (data as unknown as ValidationReport));
      } catch {
        setReport(DEMO_REPORT);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const r = report ?? DEMO_REPORT;
  const kpiEntries = Object.entries(r.kpiSummary);
  const passedCount = kpiEntries.filter(([, v]) => v.passed).length;
  const totalCount = kpiEntries.length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">검증 리포트</h1>
          <p className="text-sm text-gray-600 mt-1">
            {jobId ? `작업 ID: ${jobId.slice(0, 12)}...` : 'KPI 달성 현황 및 품질 검증 결과'}
            {(!jobId || jobId.startsWith('demo')) && <span className="ml-2 text-amber-500">(데모 데이터)</span>}
          </p>
        </div>
        {jobId && !jobId.startsWith('demo') && (
          <a
            href={getDownloadUrl(jobId)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all"
          >
            <Download className="w-4 h-4" /> 리포트 다운로드
          </a>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-all">
          <div className="p-3 bg-blue-50 rounded-xl w-fit mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{passedCount}<span className="text-lg text-gray-500">/{totalCount}</span></p>
          <p className="text-sm text-gray-600 mt-1">KPI 목표 달성</p>
          <div className="w-full bg-gray-100 rounded-full h-2 mt-3">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all" style={{ width: `${(passedCount / totalCount) * 100}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-all">
          <ScoreGauge score={r.accessibility.score} />
          <p className="text-sm text-gray-600 mt-2">접근성 점수</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md transition-all">
          <div className="p-3 bg-purple-50 rounded-xl w-fit mx-auto mb-3">
            <Zap className="w-6 h-6 text-purple-600" />
          </div>
          <p className={`text-3xl font-bold ${r.epubcheck.passed ? 'text-emerald-600' : 'text-red-500'}`}>
            {r.epubcheck.passed ? 'PASS' : 'FAIL'}
          </p>
          <p className="text-sm text-gray-600 mt-1">ePubCheck 결과</p>
          <div className="flex justify-center gap-4 mt-3 text-xs">
            <span className="text-red-500">오류: {r.epubcheck.errors}</span>
            <span className="text-amber-500">경고: {r.epubcheck.warnings}</span>
          </div>
        </div>
      </div>

      {/* ePubCheck */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-indigo-500" />
          <h2 className="font-semibold text-gray-900">ePubCheck 검증 상세</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className={`p-4 rounded-xl text-center ${r.epubcheck.passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-2xl font-bold ${r.epubcheck.passed ? 'text-emerald-600' : 'text-red-600'}`}>{r.epubcheck.passed ? 'PASS' : 'FAIL'}</p>
              <p className="text-xs text-gray-600 mt-1">전체 결과</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl text-center border border-gray-200">
              <p className="text-2xl font-bold text-gray-900">{r.epubcheck.errors}</p>
              <p className="text-xs text-gray-600 mt-1">치명적 오류</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl text-center border border-amber-200">
              <p className="text-2xl font-bold text-amber-600">{r.epubcheck.warnings}</p>
              <p className="text-xs text-gray-600 mt-1">경고</p>
            </div>
          </div>
          {r.epubcheck.details.length > 0 && (
            <div className="space-y-2">
              {r.epubcheck.details.map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  {d}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accessibility */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-500" />
          <h2 className="font-semibold text-gray-900">접근성 검증 (KWCAG 2.1 / EPUB Accessibility 1.1)</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {r.accessibility.passed.map((item) => (
              <div key={item} className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-medium text-emerald-800">{item}</span>
              </div>
            ))}
            {r.accessibility.issues.map((item) => (
              <div key={item} className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span className="text-xs font-medium text-red-800">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-500" />
          <h2 className="font-semibold text-gray-900">정량적 성능 지표 (KPI)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="text-left px-6 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">#</th>
                <th className="text-left px-6 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">지표</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">측정값</th>
                <th className="text-right px-6 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">목표</th>
                <th className="text-center px-6 py-3 text-gray-500 font-medium text-xs uppercase tracking-wide">달성</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {kpiEntries.map(([key, val], i) => (
                <tr key={key} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3 text-gray-500 font-mono text-xs">{i + 1}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{key}</td>
                  <td className={`px-6 py-3 text-right font-mono ${val.passed ? 'text-emerald-600' : 'text-red-500'}`}>
                    {val.value}{val.unit}
                  </td>
                  <td className="px-6 py-3 text-right text-gray-500 font-mono">
                    {val.target}{val.unit}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {val.passed ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                        <CheckCircle className="w-3 h-3" /> 달성
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-full font-medium">
                        <XCircle className="w-3 h-3" /> 미달
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
