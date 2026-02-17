import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadRecord {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  buffer: Buffer;
  uploadedAt: string;
}

export type JobStage =
  | 'queued'
  | 'parsing'
  | 'restructuring'
  | 'ai_content'
  | 'conversion'
  | 'validation'
  | 'completed'
  | 'failed';

export interface JobProgress {
  step: number;
  totalSteps: number;
  percent: number;
  currentStage: JobStage;
}

export interface ConversionJob {
  jobId: string;
  uploadId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: JobProgress;
  options: Record<string, boolean>;
  result?: { filename: string; size: number };
  error?: string;
  createdAt: string;
  updatedAt: string;
  startedAt: number; // Date.now() for time-based progress
}

export interface ConversionResult {
  epub: Buffer;
  report: unknown;
  metadata?: unknown;
  stats?: unknown;
  previewData?: unknown;
}

export interface SampleMeta {
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
// In-memory stores (persist during Vercel warm starts)
// ---------------------------------------------------------------------------

const uploads = new Map<string, UploadRecord>();
const jobs = new Map<string, ConversionJob>();
const results = new Map<string, ConversionResult>();
const settings: Record<string, string | undefined> = {};

// ---------------------------------------------------------------------------
// Upload Service
// ---------------------------------------------------------------------------

export function saveUpload(buffer: Buffer, originalName: string, mimeType: string): UploadRecord {
  const id = randomUUID();
  const record: UploadRecord = {
    id,
    originalName,
    size: buffer.length,
    mimeType,
    buffer,
    uploadedAt: new Date().toISOString(),
  };
  uploads.set(id, record);
  return record;
}

export function getUpload(id: string): UploadRecord | undefined {
  return uploads.get(id);
}

export function listUploads(): UploadRecord[] {
  return Array.from(uploads.values());
}

// ---------------------------------------------------------------------------
// Conversion Service — time-based progress for serverless
// ---------------------------------------------------------------------------

// Stage timeline (seconds from start)
const STAGE_TIMELINE: { stage: JobStage; startSec: number; step: number }[] = [
  { stage: 'parsing', startSec: 0, step: 1 },
  { stage: 'restructuring', startSec: 1.0, step: 2 },
  { stage: 'ai_content', startSec: 2.5, step: 3 },
  { stage: 'conversion', startSec: 4.5, step: 4 },
  { stage: 'validation', startSec: 6.0, step: 5 },
  { stage: 'completed', startSec: 7.5, step: 5 },
];

export function startConversion(uploadId: string, options: Record<string, boolean>): ConversionJob {
  const upload = uploads.get(uploadId);
  if (!upload) throw new Error(`Upload not found: ${uploadId}`);

  const jobId = randomUUID();
  const now = new Date().toISOString();

  const job: ConversionJob = {
    jobId,
    uploadId,
    status: 'queued',
    progress: { step: 0, totalSteps: 5, percent: 0, currentStage: 'queued' },
    options,
    createdAt: now,
    updatedAt: now,
    startedAt: Date.now(),
  };

  jobs.set(jobId, job);
  return job;
}

/** Calculate current job state based on elapsed time. */
export function getJob(jobId: string): ConversionJob | undefined {
  const job = jobs.get(jobId);
  if (!job || job.status === 'completed' || job.status === 'failed') return job;

  const elapsed = (Date.now() - job.startedAt) / 1000;

  // Find current stage
  let current = STAGE_TIMELINE[0];
  for (const s of STAGE_TIMELINE) {
    if (elapsed >= s.startSec) current = s;
  }

  if (current.stage === 'completed') {
    // Generate result data and mark as completed
    buildResult(job);
    job.status = 'completed';
    job.progress = { step: 5, totalSteps: 5, percent: 100, currentStage: 'completed' };
  } else {
    job.status = 'processing';
    const nextIdx = STAGE_TIMELINE.findIndex((s) => s.stage === current.stage) + 1;
    const nextStart = nextIdx < STAGE_TIMELINE.length ? STAGE_TIMELINE[nextIdx].startSec : current.startSec + 2;
    const stageProgress = Math.min(1, (elapsed - current.startSec) / (nextStart - current.startSec));
    const basePercent = ((current.step - 1) / 5) * 100;
    const percent = Math.round(basePercent + stageProgress * 20);

    job.progress = {
      step: current.step,
      totalSteps: 5,
      percent: Math.min(percent, 99),
      currentStage: current.stage,
    };
  }

  job.updatedAt = new Date().toISOString();
  return job;
}

export function listJobs(): ConversionJob[] {
  // Update all jobs before returning
  for (const jobId of jobs.keys()) {
    getJob(jobId);
  }
  return Array.from(jobs.values());
}

/** Build mock result data when job completes. */
function buildResult(job: ConversionJob): void {
  if (results.has(job.jobId)) return;

  const upload = uploads.get(job.uploadId);
  if (!upload) return;

  const originalName = upload.originalName;
  const title = originalName.replace(/\.epub$/i, '');

  const mockChapters = [
    { id: 'ch1', title: 'Chapter 1', content: '<p>Content of chapter 1</p>' },
    { id: 'ch2', title: 'Chapter 2', content: '<p>Content of chapter 2</p>' },
  ];

  const previewData = {
    jobId: job.jobId,
    original: {
      metadata: { title, author: 'Unknown Author', language: 'ko' },
      chapters: mockChapters.map((ch) => ({ id: ch.id, title: ch.title, html: ch.content })),
      filename: originalName,
      size: upload.size,
    },
    converted: {
      metadata: { title, author: 'Unknown Author', language: 'ko', format: 'ePub 3.0', interactive: 'true' },
      chapters: mockChapters.map((ch) => ({
        id: ch.id,
        title: ch.title,
        html: ch.content
          .replace(/<p>/g, '<section epub:type="bodymatter"><p>')
          .replace(/<\/p>/g, '</p></section>'),
      })),
      filename: `converted-${job.jobId}.epub`,
      size: upload.size,
    },
    aiContent: {
      quizzes: job.options.enableQuiz !== false
        ? mockChapters.map((ch) => ({
            chapterId: ch.id,
            questions: [{
              question: `${ch.title}의 주요 내용은 무엇인가요?`,
              options: ['핵심 개념 소개', '심화 주제 탐구', '요약 및 정리', '부록'],
              correctIndex: 0,
            }],
          }))
        : [],
      summaries: mockChapters.map((ch) => ({
        chapterId: ch.id,
        text: `이 챕터(${ch.title})는 출판 콘텐츠의 핵심 주제를 다루고 있습니다. AI가 자동으로 생성한 요약입니다.`,
      })),
      highlights: [],
    },
  };

  const report = {
    epubcheck: { passed: true, errors: [], warnings: [] },
    accessibility: {
      score: 92,
      issues: [{ code: 'ACC-001', message: 'Some images may need alt-text review', location: 'ch1.xhtml', severity: 'info' }],
    },
    interactionCount: job.options.enableQuiz ? 3 : 0,
    kpi: {
      epubCheckPass: true,
      accessibilityScore: 92,
      structureScore: 95,
      metadataCompleteness: 88,
      interactiveElements: job.options.enableQuiz ? 3 : 0,
      ttsReady: job.options.enableTts ?? false,
      conversionTimeMs: 7500,
    },
  };

  results.set(job.jobId, {
    epub: upload.buffer,
    report,
    metadata: { title, author: 'Unknown Author', language: 'ko' },
    stats: { chapterCount: 2, resourceCount: 0, totalSize: upload.size, conversionTimeMs: 7500 },
    previewData,
  });

  job.result = { filename: `converted-${job.jobId}.epub`, size: upload.size };
}

export function getResult(jobId: string): ConversionResult | undefined {
  return results.get(jobId);
}

// ---------------------------------------------------------------------------
// Samples
// ---------------------------------------------------------------------------

let cachedSamples: SampleMeta[] | null = null;

/** Resolve the samples directory. Works in both dev and Vercel. */
function getSamplesDir(): string {
  // Try monorepo structure: packages/web -> ../../fixtures/samples
  return path.join(process.cwd(), '..', '..', 'fixtures', 'samples');
}

export async function loadSampleMetadata(): Promise<SampleMeta[]> {
  if (cachedSamples) return cachedSamples;

  const metadataPath = path.join(getSamplesDir(), 'metadata.json');
  try {
    const raw = await fs.readFile(metadataPath, 'utf-8');
    const parsed = JSON.parse(raw);
    cachedSamples = Array.isArray(parsed) ? parsed : parsed.samples ?? [];
    return cachedSamples!;
  } catch {
    return [];
  }
}

export async function getSampleBuffer(filename: string): Promise<Buffer | null> {
  const filePath = path.join(getSamplesDir(), filename);
  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

function maskKey(key: string | undefined): string | null {
  if (!key) return null;
  if (key.length <= 4) return '****';
  return '*'.repeat(key.length - 4) + key.slice(-4);
}

export function getSettings() {
  return {
    openaiApiKey: maskKey(settings.openaiApiKey),
    anthropicApiKey: maskKey(settings.anthropicApiKey),
    hasOpenaiKey: !!settings.openaiApiKey,
    hasAnthropicKey: !!settings.anthropicApiKey,
  };
}

export function updateSettings(body: Record<string, string>) {
  if (typeof body.openaiApiKey === 'string') {
    settings.openaiApiKey = body.openaiApiKey || undefined;
  }
  if (typeof body.anthropicApiKey === 'string') {
    settings.anthropicApiKey = body.anthropicApiKey || undefined;
  }
  return getSettings();
}

// ---------------------------------------------------------------------------
// Auth (demo-mode only for serverless)
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

const DEMO_USER: AuthUser = { id: 'demo-user', email: 'demo@example.com', name: '데모 사용자' };

export function getDemoUser(): AuthUser {
  return DEMO_USER;
}
