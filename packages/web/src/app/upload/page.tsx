'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  Loader2,
  BookOpen,
  Globe,
  HardDrive,
  MessageSquare,
  Volume2,
  Image,
  HelpCircle,
  Download,
} from 'lucide-react';
import { getSamples, useSample, uploadFile, startConversion, getSampleDownloadUrl, type SampleFile } from '@/lib/api';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
  const router = useRouter();

  // Samples
  const [samples, setSamples] = useState<SampleFile[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(true);
  const [usingSampleId, setUsingSampleId] = useState<string | null>(null);

  // Upload
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Conversion options
  const [options, setOptions] = useState({
    enableQuiz: true,
    enableTts: true,
    enableSummary: true,
    enableImageGen: false,
  });

  useEffect(() => {
    async function loadSamples() {
      try {
        const data = await getSamples();
        setSamples(data);
      } catch {
        setSamples([]);
      } finally {
        setLoadingSamples(false);
      }
    }
    loadSamples();
  }, []);

  const handleUseSample = async (sampleId: string) => {
    setUsingSampleId(sampleId);
    setError(null);
    try {
      const uploadResult = await useSample(sampleId);
      const convResult = await startConversion(uploadResult.id, options);
      router.push(`/convert?job=${convResult.jobId}`);
    } catch {
      const demoId = 'demo-' + Date.now();
      router.push(`/convert?job=${demoId}`);
    } finally {
      setUsingSampleId(null);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.name.endsWith('.epub') || f.type === 'application/epub+zip')) {
      setFile(f);
      setError(null);
    } else {
      setError('.epub 파일만 업로드할 수 있습니다.');
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError(null);
    }
  };

  const handleUploadAndConvert = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploadResult = await uploadFile(file);
      const convResult = await startConversion(uploadResult.id, options);
      router.push(`/convert?job=${convResult.jobId}`);
    } catch {
      const demoId = 'demo-' + Date.now();
      router.push(`/convert?job=${demoId}`);
    } finally {
      setUploading(false);
    }
  };

  const langColor = (lang: string) => {
    const l = lang.toLowerCase();
    if (l === 'en') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (l === 'ko') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const langLabel = (lang: string) => {
    const l = lang.toLowerCase();
    if (l === 'en') return 'English';
    if (l === 'ko') return '한국어';
    return lang;
  };

  const optionItems = [
    { key: 'enableQuiz', label: '퀴즈 자동 생성', desc: 'LLM 기반 챕터별 퀴즈', icon: HelpCircle, color: 'text-indigo-500' },
    { key: 'enableTts', label: 'TTS 음성 변환', desc: '미디어 오버레이 싱크', icon: Volume2, color: 'text-indigo-500' },
    { key: 'enableSummary', label: '챕터 요약', desc: 'AI 기반 요약문 생성', icon: MessageSquare, color: 'text-indigo-500' },
    { key: 'enableImageGen', label: '이미지 생성', desc: 'AI 이미지 추천/생성', icon: Image, color: 'text-indigo-500' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Section 1: Sample Picker */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            샘플 파일로 시작하기
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">미리 준비된 ePub 파일로 변환 기능을 바로 체험해보세요</p>
        </div>

        {loadingSamples ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse-slow">
                <div className="h-5 bg-gray-100 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : samples.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">샘플 파일이 아직 준비되지 않았습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {samples.map((sample) => (
              <div
                key={sample.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 transition-colors flex flex-col"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-gray-50 rounded-lg shrink-0">
                    <FileText className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug truncate">{sample.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{sample.author}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1 line-clamp-2">{sample.description}</p>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${langColor(sample.language)}`}>
                    {langLabel(sample.language)}
                  </span>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <HardDrive className="w-3 h-3" /> {formatFileSize(sample.fileSize)}
                  </span>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {sample.source}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUseSample(sample.id)}
                    disabled={usingSampleId !== null}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {usingSampleId === sample.id ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 처리 중...</>
                    ) : (
                      '이 샘플 사용'
                    )}
                  </button>
                  <a
                    href={getSampleDownloadUrl(sample.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    title="다운로드"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 text-sm text-gray-500 font-medium" style={{ background: 'var(--bg-base)' }}>또는 직접 파일을 업로드하세요</span>
        </div>
      </div>

      {/* Section 2: File Upload */}
      <section className="space-y-5">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
            dragOver
              ? 'border-indigo-400 bg-indigo-50/50'
              : file
              ? 'border-emerald-300 bg-emerald-50/30'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => !file && document.getElementById('file-input')?.click()}
        >
          {file ? (
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <FileText className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{formatFileSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1 font-medium"
              >
                <X className="w-3.5 h-3.5" /> 파일 제거
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-gray-50 rounded-xl">
                <Upload className="w-7 h-7 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-700">ePub 파일을 드래그하거나 클릭하여 선택</p>
                <p className="text-sm text-gray-400 mt-1">ePub 2.0 이하 파일 지원 (최대 50MB)</p>
              </div>
            </div>
          )}
          <input id="file-input" type="file" accept=".epub" onChange={handleFileSelect} className="hidden" />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm border border-red-100">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Conversion options */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-sm text-gray-900 mb-4">변환 옵션</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {optionItems.map(({ key, label, desc, icon: Icon }) => (
              <label
                key={key}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  options[key as keyof typeof options]
                    ? 'border-indigo-200 bg-indigo-50/40'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={options[key as keyof typeof options]}
                    onChange={(e) => setOptions((o) => ({ ...o, [key]: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-9 h-5 rounded-full transition-colors ${options[key as keyof typeof options] ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                    <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transition-transform mt-[3px] ${options[key as keyof typeof options] ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                  </div>
                </div>
                <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-[11px] text-gray-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Upload button */}
        <button
          onClick={handleUploadAndConvert}
          disabled={!file || uploading}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> 업로드 및 변환 시작 중...</>
          ) : (
            <><Upload className="w-4 h-4" /> 변환 시작</>
          )}
        </button>
      </section>
    </div>
  );
}
