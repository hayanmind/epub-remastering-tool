const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadResult {
  id: string;
  filename: string;
  size: number;
  status: string;
}

export interface JobStatus {
  jobId: string;
  uploadId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: {
    step: number;
    totalSteps: number;
    percent: number;
    currentStage: string;
    stageName: string;
  };
  result?: {
    downloadUrl: string;
    previewUrl: string;
    reportUrl: string;
    filename?: string;
    size?: number;
  };
  error?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ValidationReport {
  epubcheck: { passed: boolean; errors: number; warnings: number; details: string[] };
  accessibility: { score: number; issues: string[]; passed: string[] };
  interactionCount: number;
  kpiSummary: Record<string, { value: number; target: number; unit: string; passed: boolean }>;
}

export interface PreviewData {
  jobId: string;
  original: { metadata: Record<string, string>; chapters: { id: string; title: string; html: string }[]; filename?: string; size?: number };
  converted: { metadata: Record<string, string>; chapters: { id: string; title: string; html: string }[]; filename?: string; size?: number };
  metadata?: Record<string, unknown>;
  stats?: Record<string, unknown>;
  aiContent: {
    quizzes: { chapterId: string; questions: { question: string; options: string[]; correctIndex: number }[] }[];
    summaries: { chapterId: string; text: string }[];
    highlights: { chapterId: string; type: string }[];
  };
}

export interface SampleFile {
  id: string;
  title: string;
  author: string;
  language: string;
  description: string;
  filename: string;
  fileSize: number;
  source: string;
  sourceUrl?: string;
}

// ---------------------------------------------------------------------------
// Fetch helper
// ---------------------------------------------------------------------------

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.error?.message || `API Error: ${res.status}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Samples
// ---------------------------------------------------------------------------

export async function getSamples(): Promise<SampleFile[]> {
  const data = await apiFetch<{ samples: SampleFile[] }>('/api/samples');
  return data.samples;
}

export async function useSample(sampleId: string): Promise<UploadResult> {
  return apiFetch<UploadResult>('/api/samples/' + sampleId + '/use', {
    method: 'POST',
  });
}

export function getSampleDownloadUrl(sampleId: string): string {
  return `${API_BASE}/api/samples/${sampleId}/download`;
}

// ---------------------------------------------------------------------------
// Upload & Convert
// ---------------------------------------------------------------------------

export async function uploadFile(file: File, options?: Record<string, boolean>): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function startConversion(
  uploadId: string,
  options: Record<string, boolean> = {}
): Promise<{ jobId: string; status: string }> {
  return apiFetch('/api/convert/' + uploadId, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ options }),
  });
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export async function getJobs(): Promise<JobStatus[]> {
  const data = await apiFetch<{ jobs: JobStatus[] }>('/api/jobs');
  return data.jobs ?? [];
}

export async function getJobStatus(jobId: string): Promise<JobStatus> {
  return apiFetch('/api/jobs/' + jobId);
}

// ---------------------------------------------------------------------------
// Preview / Report / Download
// ---------------------------------------------------------------------------

export async function getPreview(jobId: string): Promise<PreviewData> {
  return apiFetch('/api/preview/' + jobId);
}

export async function getReport(jobId: string): Promise<{ jobId: string; report: ValidationReport }> {
  return apiFetch('/api/report/' + jobId);
}

export function getDownloadUrl(jobId: string): string {
  return `${API_BASE}/api/download/${jobId}`;
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

export async function getHealth(): Promise<{ status: string; mode: string }> {
  return apiFetch('/api/health');
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function saveSettings(keys: Record<string, string>): Promise<void> {
  await apiFetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keys }),
  });
}
