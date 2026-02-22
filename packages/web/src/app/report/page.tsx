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
import { DEMO_REPORT } from '@/lib/demo-data';

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 90 ? 'text-emerald-600' : score >= 70 ? 'text-amber-600' : 'text-red-600';
  const strokeColor = score >= 90 ? '#059669' : score >= 70 ? '#d97706' : '#dc2626';
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#f3f4f6" strokeWidth="7" />
        <circle
          cx="60" cy="60" r="54" fill="none" stroke={strokeColor} strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${color}`}>{score}</span>
        <span className="text-[10px] text-gray-400">/ 100</span>
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
      if (!jobId) {
        setReport(DEMO_REPORT);
        setLoading(false);
        return;
      }
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
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  const r = report ?? DEMO_REPORT;
  const kpiEntries = Object.entries(r.kpiSummary);
  const passedCount = kpiEntries.filter(([, v]) => v.passed).length;
  const totalCount = kpiEntries.length;

  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">검증 리포트</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {jobId ? `작업 ID: ${jobId.slice(0, 12)}...` : 'KPI 달성 현황 및 품질 검증 결과'}
            {(!jobId || jobId.startsWith('demo')) && <span className="ml-1.5 text-gray-400">(데모)</span>}
          </p>
        </div>
        {jobId && !jobId.startsWith('demo') && (
          <a
            href={getDownloadUrl(jobId)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Download className="w-4 h-4" /> 다운로드
          </a>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="p-2.5 bg-gray-50 rounded-lg w-fit mx-auto mb-3">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{passedCount}<span className="text-base text-gray-400">/{totalCount}</span></p>
          <p className="text-xs text-gray-500 mt-1">KPI 목표 달성</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
            <div className="bg-indigo-600 h-1.5 rounded-full transition-all" style={{ width: `${(passedCount / totalCount) * 100}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <ScoreGauge score={r.accessibility.score} />
          <p className="text-xs text-gray-500 mt-2">접근성 점수</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
          <div className="p-2.5 bg-gray-50 rounded-lg w-fit mx-auto mb-3">
            <Zap className="w-5 h-5 text-indigo-600" />
          </div>
          <p className={`text-2xl font-bold ${r.epubcheck.passed ? 'text-emerald-600' : 'text-red-500'}`}>
            {r.epubcheck.passed ? 'PASS' : 'FAIL'}
          </p>
          <p className="text-xs text-gray-500 mt-1">ePubCheck 결과</p>
          <div className="flex justify-center gap-4 mt-2.5 text-[11px]">
            <span className="text-red-500">오류: {r.epubcheck.errors}</span>
            <span className="text-amber-500">경고: {r.epubcheck.warnings}</span>
          </div>
        </div>
      </div>

      {/* ePubCheck */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-indigo-600" />
          <h2 className="font-semibold text-sm text-gray-900">ePubCheck 검증 상세</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className={`p-3 rounded-lg text-center ${r.epubcheck.passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`text-xl font-bold ${r.epubcheck.passed ? 'text-emerald-600' : 'text-red-600'}`}>{r.epubcheck.passed ? 'PASS' : 'FAIL'}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">전체 결과</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg text-center border border-gray-200">
              <p className="text-xl font-bold text-gray-900">{r.epubcheck.errors}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">치명적 오류</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg text-center border border-amber-200">
              <p className="text-xl font-bold text-amber-600">{r.epubcheck.warnings}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">경고</p>
            </div>
          </div>
          {r.epubcheck.details.length > 0 && (
            <div className="space-y-1.5">
              {r.epubcheck.details.map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-2.5 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  {d}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Accessibility */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" />
          <h2 className="font-semibold text-sm text-gray-900">접근성 검증 (KWCAG 2.1 / EPUB Accessibility 1.1)</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {r.accessibility.passed.map((item) => (
              <div key={item} className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-[11px] font-medium text-emerald-800">{item}</span>
              </div>
            ))}
            {r.accessibility.issues.map((item) => (
              <div key={item} className="p-2.5 rounded-lg bg-red-50 border border-red-200 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="text-[11px] font-medium text-red-800">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <h2 className="font-semibold text-sm text-gray-900">정량적 성능 지표 (KPI)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="text-left px-5 py-2.5 text-gray-500 font-medium text-[11px] uppercase tracking-wide">#</th>
                <th className="text-left px-5 py-2.5 text-gray-500 font-medium text-[11px] uppercase tracking-wide">지표</th>
                <th className="text-right px-5 py-2.5 text-gray-500 font-medium text-[11px] uppercase tracking-wide">측정값</th>
                <th className="text-right px-5 py-2.5 text-gray-500 font-medium text-[11px] uppercase tracking-wide">목표</th>
                <th className="text-center px-5 py-2.5 text-gray-500 font-medium text-[11px] uppercase tracking-wide">달성</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {kpiEntries.map(([key, val], i) => (
                <tr key={key} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-2.5 text-gray-400 font-mono text-[11px]">{i + 1}</td>
                  <td className="px-5 py-2.5 font-medium text-gray-900 text-sm">{key}</td>
                  <td className={`px-5 py-2.5 text-right font-mono text-sm ${val.passed ? 'text-emerald-600' : 'text-red-500'}`}>
                    {val.value}{val.unit}
                  </td>
                  <td className="px-5 py-2.5 text-right text-gray-400 font-mono text-sm">
                    {val.target}{val.unit}
                  </td>
                  <td className="px-5 py-2.5 text-center">
                    {val.passed ? (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-medium">
                        <CheckCircle className="w-3 h-3" /> 달성
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-red-50 text-red-700 px-2 py-0.5 rounded-md font-medium">
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
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
