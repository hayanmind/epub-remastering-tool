import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { storageService } from '../services/storage-service.js';
import { ApiError } from '../middleware/error-handler.js';

export const samplesRouter = Router();

// Resolve from packages/api/ up two levels to the project root, then into fixtures/samples
const samplesDir = path.resolve(process.cwd(), '../../fixtures/samples');

// ---------------------------------------------------------------------------
// GET /api/samples - List available sample ePub files
// ---------------------------------------------------------------------------

samplesRouter.get('/samples', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const metadataPath = path.join(samplesDir, 'metadata.json');
    let samples: unknown[] = [];
    try {
      const raw = await fsp.readFile(metadataPath, 'utf-8');
      const parsed = JSON.parse(raw);
      samples = Array.isArray(parsed) ? parsed : parsed.samples ?? [];
    } catch {
      // metadata.json doesn't exist yet — return empty array
    }
    res.json({ samples });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/samples/:id/use - Copy a sample epub to uploads
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// GET /api/samples/:id/download - Download a sample ePub file directly
// ---------------------------------------------------------------------------

samplesRouter.get('/samples/:id/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const metadataPath = path.join(samplesDir, 'metadata.json');
    let samples: { id: string; filename: string; title?: string }[] = [];
    try {
      const raw = await fsp.readFile(metadataPath, 'utf-8');
      const parsed = JSON.parse(raw);
      samples = Array.isArray(parsed) ? parsed : parsed.samples ?? [];
    } catch {
      throw ApiError.notFound('No samples metadata found');
    }

    const sample = samples.find((s) => s.id === id);
    if (!sample) {
      throw ApiError.notFound(`Sample not found: ${id}`);
    }

    const epubPath = path.join(samplesDir, sample.filename);
    try {
      await fsp.access(epubPath);
    } catch {
      throw ApiError.notFound(`Sample file not found on disk: ${sample.filename}`);
    }

    res.setHeader('Content-Type', 'application/epub+zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(sample.filename)}"`);
    const { createReadStream } = await import('node:fs');
    createReadStream(epubPath).pipe(res);
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/samples/:id/use - Copy a sample epub to uploads
// ---------------------------------------------------------------------------

samplesRouter.post('/samples/:id/use', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Read metadata to find the sample
    const metadataPath = path.join(samplesDir, 'metadata.json');
    let samples: { id: string; filename: string; title?: string }[] = [];
    try {
      const raw = await fsp.readFile(metadataPath, 'utf-8');
      const parsed = JSON.parse(raw);
      samples = Array.isArray(parsed) ? parsed : parsed.samples ?? [];
    } catch {
      throw ApiError.notFound('No samples metadata found');
    }

    const sample = samples.find((s) => s.id === id);
    if (!sample) {
      throw ApiError.notFound(`Sample not found: ${id}`);
    }

    // Read the sample epub file
    const epubPath = path.join(samplesDir, sample.filename);
    let buffer: Buffer;
    try {
      buffer = await fsp.readFile(epubPath);
    } catch {
      throw ApiError.notFound(`Sample file not found on disk: ${sample.filename}`);
    }

    // Save to uploads via storage service
    const record = await storageService.saveUploadFromBuffer(
      buffer,
      sample.filename,
      'application/epub+zip',
    );

    res.status(201).json({
      id: record.id,
      filename: record.originalName,
      size: record.size,
      status: 'uploaded',
    });
  } catch (err) {
    next(err);
  }
});
