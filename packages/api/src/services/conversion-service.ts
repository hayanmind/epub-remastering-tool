import { v4 as uuidv4 } from 'uuid';
import { storageService } from './storage-service.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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
  options: ConversionJobOptions;
  result?: {
    filename: string;
    size: number;
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversionJobOptions {
  enableTts?: boolean;
  enableQuiz?: boolean;
  enableImageGen?: boolean;
  enableSummary?: boolean;
  templateId?: string;
}

// ---------------------------------------------------------------------------
// Try loading the real @gov-epub/core pipeline
// ---------------------------------------------------------------------------

let coreAvailable = false;
let corePipeline: {
  parse: (buf: Buffer) => Promise<unknown>;
  convert: (parsed: unknown, options: unknown) => Promise<{ epub: Buffer; report: unknown; metadata: unknown; stats: unknown }>;
} | null = null;

async function tryLoadCore(): Promise<void> {
  try {
    const core = await import('@gov-epub/core');
    if (core && typeof core.parse === 'function' && typeof core.convert === 'function') {
      corePipeline = core as typeof corePipeline;
      coreAvailable = true;
      console.log('[conversion-service] @gov-epub/core loaded successfully');
    }
  } catch {
    console.log('[conversion-service] @gov-epub/core not available — using mock pipeline');
  }
}

// Eagerly attempt to load core (non-blocking)
tryLoadCore();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Conversion Service
// ---------------------------------------------------------------------------

class ConversionService {
  private jobs = new Map<string, ConversionJob>();

  /** Create a new job and start conversion asynchronously. */
  startConversion(uploadId: string, options: ConversionJobOptions): ConversionJob {
    const upload = storageService.getUploadRecord(uploadId);
    if (!upload) {
      throw new Error(`Upload not found: ${uploadId}`);
    }

    const jobId = uuidv4();
    const now = new Date().toISOString();

    const job: ConversionJob = {
      jobId,
      uploadId,
      status: 'queued',
      progress: { step: 0, totalSteps: 5, percent: 0, currentStage: 'queued' },
      options,
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.set(jobId, job);

    // Fire-and-forget — the caller receives the job immediately.
    this.runPipeline(job).catch((err) => {
      console.error(`[conversion-service] Pipeline failed for job ${jobId}:`, err);
      job.status = 'failed';
      job.error = err instanceof Error ? err.message : String(err);
      job.updatedAt = new Date().toISOString();
    });

    return job;
  }

  getJob(jobId: string): ConversionJob | undefined {
    return this.jobs.get(jobId);
  }

  listJobs(): ConversionJob[] {
    return Array.from(this.jobs.values());
  }

  // -----------------------------------------------------------------------
  // Pipeline execution
  // -----------------------------------------------------------------------

  private async runPipeline(job: ConversionJob): Promise<void> {
    const updateProgress = (step: number, stage: JobStage) => {
      job.progress = {
        step,
        totalSteps: 5,
        percent: Math.round((step / 5) * 100),
        currentStage: stage,
      };
      job.status = 'processing';
      job.updatedAt = new Date().toISOString();
    };

    try {
      const upload = storageService.getUploadRecord(job.uploadId);
      if (!upload) throw new Error('Upload record disappeared');

      const inputBuffer = await storageService.getUploadBuffer(job.uploadId);
      if (!inputBuffer) throw new Error('Upload file not found on disk');

      if (coreAvailable && corePipeline) {
        await this.runRealPipeline(job, inputBuffer, updateProgress);
      } else {
        await this.runMockPipeline(job, inputBuffer, upload.originalName, updateProgress);
      }
    } catch (err) {
      job.status = 'failed';
      job.error = err instanceof Error ? err.message : String(err);
      job.progress.currentStage = 'failed';
      job.updatedAt = new Date().toISOString();
    }
  }

  // -----------------------------------------------------------------------
  // Real pipeline (requires @gov-epub/core)
  // -----------------------------------------------------------------------

  private async runRealPipeline(
    job: ConversionJob,
    inputBuffer: Buffer,
    updateProgress: (step: number, stage: JobStage) => void,
  ): Promise<void> {
    if (!corePipeline) throw new Error('Core pipeline unavailable');

    updateProgress(1, 'parsing');
    const parsed = await corePipeline.parse(inputBuffer);

    updateProgress(2, 'restructuring');
    // restructuring is part of convert in core

    updateProgress(3, 'ai_content');
    // AI content generation would be driven by core

    updateProgress(4, 'conversion');
    const result = await corePipeline.convert(parsed, job.options);

    updateProgress(5, 'validation');
    // Validation report comes from the converter

    // Store result
    storageService.saveResult(job.jobId, result.epub, result.report, result.metadata, result.stats);

    job.status = 'completed';
    job.progress = { step: 5, totalSteps: 5, percent: 100, currentStage: 'completed' };
    job.result = { filename: `converted-${job.jobId}.epub`, size: result.epub.length };
    job.updatedAt = new Date().toISOString();
  }

  // -----------------------------------------------------------------------
  // Mock pipeline (fallback when core is not built)
  // -----------------------------------------------------------------------

  private async runMockPipeline(
    job: ConversionJob,
    inputBuffer: Buffer,
    originalName: string,
    updateProgress: (step: number, stage: JobStage) => void,
  ): Promise<void> {
    // Stage 1: Parsing (1 s)
    updateProgress(1, 'parsing');
    await sleep(1000);
    const mockParsed = {
      metadata: {
        title: originalName.replace(/\.epub$/i, ''),
        author: 'Unknown Author',
        language: 'ko',
        publisher: '',
        date: new Date().toISOString(),
        isbn: '',
        description: '',
        coverImage: '',
        extra: {},
      },
      toc: [
        { id: 'ch1', title: 'Chapter 1', href: 'ch1.xhtml', children: [] },
        { id: 'ch2', title: 'Chapter 2', href: 'ch2.xhtml', children: [] },
      ],
      chapters: [
        { id: 'ch1', title: 'Chapter 1', href: 'ch1.xhtml', content: '<p>Content of chapter 1</p>', elements: [] },
        { id: 'ch2', title: 'Chapter 2', href: 'ch2.xhtml', content: '<p>Content of chapter 2</p>', elements: [] },
      ],
      resources: [],
      errors: [],
    };

    // Stage 2: Restructuring (2 s)
    updateProgress(2, 'restructuring');
    await sleep(2000);
    const _mockRestructured = {
      ...mockParsed,
      chapters: mockParsed.chapters.map((ch) => ({
        ...ch,
        content: ch.content
          .replace('<p>', '<section epub:type="bodymatter"><p>')
          .replace('</p>', '</p></section>'),
      })),
    };

    // Stage 3: AI Content Generation (3 s)
    updateProgress(3, 'ai_content');
    await sleep(3000);
    const _mockAiContent = {
      summaries: {
        ch1: 'This chapter introduces the core concepts of the publication.',
        ch2: 'This chapter expands on the foundational topics presented earlier.',
      },
      quizzes: job.options.enableQuiz
        ? {
            ch1: JSON.stringify([
              {
                question: 'What is the main topic of Chapter 1?',
                options: ['Core concepts', 'Advanced topics', 'Summary', 'Appendix'],
                answer: 0,
              },
            ]),
          }
        : undefined,
      altTexts: {},
    };

    // Stage 4: Conversion (2 s)
    updateProgress(4, 'conversion');
    await sleep(2000);
    // The mock conversion result is simply the original input file
    const epubBuffer = inputBuffer;

    // Stage 5: Validation (1 s)
    updateProgress(5, 'validation');
    await sleep(1000);
    const mockReport = {
      epubcheck: {
        passed: true,
        errors: [],
        warnings: [],
      },
      accessibility: {
        score: 92,
        issues: [
          {
            code: 'ACC-001',
            message: 'Some images may need alt-text review',
            location: 'ch1.xhtml',
            severity: 'info' as const,
          },
        ],
      },
      interactionCount: job.options.enableQuiz ? 3 : 0,
      kpi: {
        epubCheckPass: true,
        accessibilityScore: 92,
        structureScore: 95,
        metadataCompleteness: 88,
        interactiveElements: job.options.enableQuiz ? 3 : 0,
        ttsReady: job.options.enableTts ?? false,
        conversionTimeMs: 9000,
      },
    };

    const mockMetadata = mockParsed.metadata;
    const mockStats = {
      chapterCount: mockParsed.chapters.length,
      resourceCount: mockParsed.resources.length,
      totalSize: epubBuffer.length,
      conversionTimeMs: 9000,
    };

    // Build preview data for the frontend
    const previewData = {
      jobId: job.jobId,
      original: {
        metadata: mockParsed.metadata,
        chapters: mockParsed.chapters.map((ch) => ({
          id: ch.id,
          title: ch.title,
          html: ch.content,
        })),
        filename: originalName,
        size: inputBuffer.length,
      },
      converted: {
        metadata: { ...mockParsed.metadata, format: 'ePub 3.0', interactive: 'true' },
        chapters: mockParsed.chapters.map((ch) => ({
          id: ch.id,
          title: ch.title,
          html: ch.content
            .replace(/<p>/g, '<section epub:type="bodymatter"><p>')
            .replace(/<\/p>/g, '</p></section>'),
        })),
        filename: `converted-${job.jobId}.epub`,
        size: epubBuffer.length,
      },
      aiContent: {
        quizzes: job.options.enableQuiz !== false
          ? mockParsed.chapters.map((ch) => ({
              chapterId: ch.id,
              questions: [
                {
                  question: `${ch.title}의 주요 내용은 무엇인가요?`,
                  options: ['핵심 개념 소개', '심화 주제 탐구', '요약 및 정리', '부록'],
                  correctIndex: 0,
                },
              ],
            }))
          : [],
        summaries: mockParsed.chapters.map((ch) => ({
          chapterId: ch.id,
          text: `이 챕터(${ch.title})는 출판 콘텐츠의 핵심 주제를 다루고 있습니다. AI가 자동으로 생성한 요약입니다.`,
        })),
        highlights: [],
      },
    };

    // Persist result
    storageService.saveResult(job.jobId, epubBuffer, mockReport, mockMetadata, mockStats, previewData);

    job.status = 'completed';
    job.progress = { step: 5, totalSteps: 5, percent: 100, currentStage: 'completed' };
    job.result = { filename: `converted-${job.jobId}.epub`, size: epubBuffer.length };
    job.updatedAt = new Date().toISOString();
  }
}

export const conversionService = new ConversionService();
