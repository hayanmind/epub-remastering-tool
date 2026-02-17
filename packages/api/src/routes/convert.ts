import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { conversionService } from '../services/conversion-service.js';
import { storageService } from '../services/storage-service.js';
import { ApiError } from '../middleware/error-handler.js';

export const convertRouter = Router();

// ---------------------------------------------------------------------------
// POST /api/convert/:uploadId - Start conversion
// ---------------------------------------------------------------------------

convertRouter.post('/convert/:uploadId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uploadId } = req.params;

    // Verify the upload exists
    const upload = storageService.getUploadRecord(uploadId);
    if (!upload) {
      throw ApiError.notFound(`Upload not found: ${uploadId}`);
    }

    const options = req.body?.options ?? {};

    const job = conversionService.startConversion(uploadId, {
      enableTts: options.enableTts ?? false,
      enableQuiz: options.enableQuiz ?? false,
      enableImageGen: options.enableImageGen ?? false,
      enableSummary: options.enableSummary ?? false,
      templateId: options.templateId ?? 'default',
    });

    res.status(202).json({
      jobId: job.jobId,
      status: 'processing',
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/jobs - List all jobs
// ---------------------------------------------------------------------------

convertRouter.get('/jobs', (_req: Request, res: Response) => {
  const jobs = conversionService.listJobs().map((j) => ({
    jobId: j.jobId,
    uploadId: j.uploadId,
    status: j.status,
    progress: j.progress,
    result: j.result,
    error: j.error,
    createdAt: j.createdAt,
    updatedAt: j.updatedAt,
  }));

  res.json({ jobs });
});

// ---------------------------------------------------------------------------
// GET /api/jobs/:jobId - Get job status
// ---------------------------------------------------------------------------

convertRouter.get('/jobs/:jobId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const job = conversionService.getJob(jobId);
    if (!job) {
      throw ApiError.notFound(`Job not found: ${jobId}`);
    }

    res.json({
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});
