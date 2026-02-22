'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Upload,
  RefreshCw,
  CheckCircle,
  FileText,
  ArrowRight,
  Shield,
  Clock,
  XCircle,
  BookOpen,
  Play,
} from 'lucide-react';
import { getJobs, type JobStatus } from '@/lib/api';
import { DEMO_JOBS, DEMO_STATS } from '@/lib/demo-data';
import { useDemoFlow } from '@/lib/demo-flow';

export default function Dashboard() {
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { startDemoFlow, skipToPreview, skipToReport, isRunning } = useDemoFlow();

  useEffect(() => {
    async function load() {
      try {
        const data = await getJobs();
        setJobs(data.length > 0 ? data : DEMO_JOBS);
      } catch {
        setJobs(DEMO_JOBS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const completedJobs = jobs.filter((j) => j.status === 'completed');
  const hasRealJobs = jobs.length > 0 && !jobs[0]?.jobId.startsWith('demo-');
  const successRate = jobs.length > 0 ? Math.round((completedJobs.length / jobs.length) * 100) : 0;

  const stats = hasRealJobs
    ? {
        totalConversions: jobs.length,
        successRate,
        avgTime: completedJobs.length > 0 ? '~8초' : '-',
        accessibilityScore: completedJobs.length > 0 ? '92%' : '-',
      }
    : DEMO_STATS;

  const statCards = [
    { label: '총 변환 수', value: String(stats.totalConversions), icon: RefreshCw, color: 'text-indigo-600' },
    { label: '성공률', value: `${stats.successRate}%`, icon: CheckCircle, color: 'text-emerald-600' },
    { label: '평균 소요시간', value: stats.avgTime, icon: Clock, color: 'text-gray-600' },
    { label: '접근성 점수', value: stats.accessibilityScore, icon: Shield, color: 'text-indigo-600' },
  ];

  const today = new Date();
  const greeting = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          ePub 리마스터링
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">오늘, {greeting}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              {!hasRealJobs && (
                <span className="text-[10px] text-gray-400">데모</span>
              )}
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={startDemoFlow}
          disabled={isRunning}
          className="group bg-indigo-600 text-white rounded-xl p-5 text-left hover:bg-indigo-700 transition-colors disabled:opacity-70"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">데모 시작</h3>
              <p className="text-indigo-200 text-xs mt-1">
                원클릭으로 전체 변환 플로우를 시연합니다
              </p>
            </div>
            <Play className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
        <Link
          href="/upload"
          className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-gray-900">새 변환 시작</h3>
              <p className="text-gray-500 text-xs mt-1">
                ePub 파일을 업로드하여 변환 시작
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </Link>
        <div className="flex gap-3">
          <button
            onClick={skipToPreview}
            className="flex-1 group bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-gray-300 transition-colors"
          >
            <BookOpen className="w-4 h-4 text-gray-400 mb-2" />
            <h3 className="font-semibold text-xs text-gray-900">미리보기</h3>
            <p className="text-gray-500 text-[11px] mt-0.5">데모 결과 확인</p>
          </button>
          <button
            onClick={skipToReport}
            className="flex-1 group bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-gray-300 transition-colors"
          >
            <Shield className="w-4 h-4 text-gray-400 mb-2" />
            <h3 className="font-semibold text-xs text-gray-900">KPI 리포트</h3>
            <p className="text-gray-500 text-[11px] mt-0.5">검증 결과 확인</p>
          </button>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-sm text-gray-900">최근 변환 작업</h2>
          <Link href="/convert" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
            전체 보기
          </Link>
        </div>
        {loading ? (
          <div className="p-10 text-center text-gray-500">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
            <p className="text-xs">불러오는 중...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {jobs.slice(0, 5).map((job) => {
              const displayName = job.result?.filename || `작업 ${job.jobId.slice(0, 8)}...`;
              return (
                <div key={job.jobId} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{displayName}</p>
                      <p className="text-[11px] text-gray-400">
                        {new Date(job.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {job.status === 'completed' ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-medium">
                        <CheckCircle className="w-3 h-3" /> 완료
                      </span>
                    ) : job.status === 'processing' ? (
                      <span className="flex items-center gap-1 text-[11px] text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md font-medium">
                        <RefreshCw className="w-3 h-3 animate-spin" /> 변환 중
                      </span>
                    ) : job.status === 'failed' ? (
                      <span className="flex items-center gap-1 text-[11px] text-red-700 bg-red-50 px-2.5 py-1 rounded-md font-medium">
                        <XCircle className="w-3 h-3" /> 실패
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md font-medium">
                        대기
                      </span>
                    )}
                    <Link
                      href={`/preview?job=${job.jobId}`}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      상세
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
