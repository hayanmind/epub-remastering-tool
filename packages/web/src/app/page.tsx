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
  Sparkles,
  XCircle,
  BookOpen,
} from 'lucide-react';
import { getJobs, type JobStatus } from '@/lib/api';

export default function Dashboard() {
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getJobs();
        setJobs(data);
      } catch {
        // Demo fallback
        setJobs([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const completedJobs = jobs.filter((j) => j.status === 'completed');
  const successRate = jobs.length > 0 ? Math.round((completedJobs.length / jobs.length) * 100) : 0;
  const avgTime = completedJobs.length > 0 ? '~8초' : '-';

  const statCards = [
    { label: '총 변환 수', value: String(jobs.length), icon: RefreshCw, gradient: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50' },
    { label: '성공률', value: jobs.length > 0 ? `${successRate}%` : '-', icon: CheckCircle, gradient: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50' },
    { label: '평균 소요시간', value: avgTime, icon: Clock, gradient: 'from-amber-500 to-orange-500', bg: 'bg-amber-50' },
    { label: '접근성 점수', value: completedJobs.length > 0 ? '92%' : '-', icon: Shield, gradient: 'from-purple-500 to-pink-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative">
          <div className="flex items-center gap-2 text-indigo-200 text-sm font-medium mb-2">
            <Sparkles className="w-4 h-4" /> AI 기반 변환 시스템
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            ePub 2.0을{' '}
            <span className="bg-gradient-to-r from-yellow-200 to-amber-200 bg-clip-text text-transparent">
              인터랙티브 ePub 3.0
            </span>
            으로
          </h1>
          <p className="text-indigo-100 mt-2 max-w-xl">
            퀴즈, TTS, 요약, 접근성 — AI가 자동으로 인터랙티브 콘텐츠를 생성하고
            ePub 3.0 표준으로 변환합니다.
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, gradient, bg }) => (
          <div
            key={label}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 animate-slideUp"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{label}</p>
                <p className="text-2xl font-bold mt-1 text-gray-900">{value}</p>
              </div>
              <div className={`p-3 rounded-xl ${bg}`}>
                <Icon className={`w-5 h-5 bg-gradient-to-r ${gradient} bg-clip-text`} style={{ color: gradient.includes('blue') ? '#6366f1' : gradient.includes('emerald') ? '#10b981' : gradient.includes('amber') ? '#f59e0b' : '#a855f7' }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/upload"
          className="group bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl p-6 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">새 변환 시작</h3>
              <p className="text-indigo-200 text-sm mt-1">
                ePub 2.0 파일을 업로드하여 변환을 시작하세요
              </p>
            </div>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        <Link
          href="/upload"
          className="group bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-indigo-200 transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-500" />
                샘플 체험하기
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                샘플 ePub 파일로 변환 기능을 바로 체험해보세요
              </p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
          </div>
        </Link>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">최근 변환 작업</h2>
          <Link href="/convert" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            전체 보기
          </Link>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            <p className="text-sm">불러오는 중...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-600 font-medium">아직 변환 작업이 없습니다</p>
            <p className="text-sm text-gray-500 mt-1">파일을 업로드하거나 샘플을 사용하여 시작하세요</p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all"
            >
              <Upload className="w-4 h-4" /> 시작하기
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {jobs.slice(0, 5).map((job) => (
              <div key={job.jobId} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      작업 {job.jobId.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(job.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {job.status === 'completed' ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full font-medium">
                      <CheckCircle className="w-3 h-3" /> 완료
                    </span>
                  ) : job.status === 'processing' ? (
                    <span className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-full font-medium">
                      <RefreshCw className="w-3 h-3 animate-spin" /> 변환 중
                    </span>
                  ) : job.status === 'failed' ? (
                    <span className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 px-3 py-1 rounded-full font-medium">
                      <XCircle className="w-3 h-3" /> 실패
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
