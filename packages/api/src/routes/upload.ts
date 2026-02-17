import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { storageService } from '../services/storage-service.js';
import { ApiError } from '../middleware/error-handler.js';

export const uploadRouter = Router();

// ---------------------------------------------------------------------------
// POST /api/upload - Accept .epub file upload
// ---------------------------------------------------------------------------

uploadRouter.post('/upload', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      throw ApiError.badRequest('No file provided. Upload an .epub file with field name "file".');
    }

    // Validate MIME type or extension
    const isValidMime = file.mimetype === 'application/epub+zip';
    const isValidExt = file.originalname.toLowerCase().endsWith('.epub');
    if (!isValidMime && !isValidExt) {
      throw ApiError.badRequest(
        'Invalid file type. Only .epub files (application/epub+zip) are accepted.',
        { mimetype: file.mimetype, filename: file.originalname },
      );
    }

    const record = await storageService.saveUpload(file);

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

// ---------------------------------------------------------------------------
// GET /api/uploads - List all uploaded files
// ---------------------------------------------------------------------------

uploadRouter.get('/uploads', (_req: Request, res: Response) => {
  const uploads = storageService.listUploads().map((u) => ({
    id: u.id,
    filename: u.originalName,
    size: u.size,
    mimeType: u.mimeType,
    uploadedAt: u.uploadedAt,
  }));

  res.json({ uploads });
});

// ---------------------------------------------------------------------------
// DELETE /api/uploads/:id - Delete an uploaded file
// ---------------------------------------------------------------------------

uploadRouter.delete('/uploads/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const deleted = await storageService.deleteUpload(id);
    if (!deleted) {
      throw ApiError.notFound(`Upload not found: ${id}`);
    }
    res.json({ message: 'Upload deleted', id });
  } catch (err) {
    next(err);
  }
});
