import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { conversionService } from '../services/conversion-service.js';
import { storageService } from '../services/storage-service.js';
import { ApiError } from '../middleware/error-handler.js';

export const downloadRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/download/:jobId - Download converted ePub file
// ---------------------------------------------------------------------------

downloadRouter.get('/download/:jobId', (req: Request<{ jobId: string }>, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const job = conversionService.getJob(jobId);
    if (!job) {
      throw ApiError.notFound(`Job not found: ${jobId}`);
    }

    if (job.status !== 'completed') {
      throw ApiError.badRequest(`Job is not completed yet. Current status: ${job.status}`);
    }

    const result = storageService.getResult(jobId);
    if (!result) {
      throw ApiError.internal('Conversion result not found in storage');
    }

    const filename = job.result?.filename ?? `converted-${jobId}.epub`;
    res.setHeader('Content-Type', 'application/epub+zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', result.epub.length);
    res.send(result.epub);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/preview/:jobId - Get preview data
// ---------------------------------------------------------------------------

downloadRouter.get('/preview/:jobId', (req: Request<{ jobId: string }>, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const job = conversionService.getJob(jobId);
    if (!job) {
      throw ApiError.notFound(`Job not found: ${jobId}`);
    }

    if (job.status !== 'completed') {
      throw ApiError.badRequest(`Job is not completed yet. Current status: ${job.status}`);
    }

    const result = storageService.getResult(jobId);
    if (!result) {
      throw ApiError.internal('Conversion result not found in storage');
    }

    // If previewData was stored by the pipeline, return it directly
    if (result.previewData) {
      res.json(result.previewData);
    } else {
      // Fallback: return minimal data
      const upload = storageService.getUploadRecord(job.uploadId);
      res.json({
        jobId,
        original: {
          metadata: {},
          chapters: [],
          filename: upload?.originalName ?? 'unknown',
          size: upload?.size ?? 0,
        },
        converted: {
          metadata: {},
          chapters: [],
          filename: job.result?.filename,
          size: job.result?.size ?? 0,
        },
        metadata: result.metadata ?? {},
        stats: result.stats ?? {},
        aiContent: { quizzes: [], summaries: [], highlights: [] },
      });
    }
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/report/:jobId - Get validation report (KPI metrics)
// ---------------------------------------------------------------------------

downloadRouter.get('/report/:jobId', (req: Request<{ jobId: string }>, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const job = conversionService.getJob(jobId);
    if (!job) {
      throw ApiError.notFound(`Job not found: ${jobId}`);
    }

    if (job.status !== 'completed') {
      throw ApiError.badRequest(`Job is not completed yet. Current status: ${job.status}`);
    }

    const result = storageService.getResult(jobId);
    if (!result) {
      throw ApiError.internal('Conversion result not found in storage');
    }

    res.json({
      jobId,
      report: result.report,
    });
  } catch (err) {
    next(err);
  }
});
