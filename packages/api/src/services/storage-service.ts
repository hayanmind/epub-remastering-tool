import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadRecord {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface ConversionResultRecord {
  epub: Buffer;
  report: unknown;
  metadata?: unknown;
  stats?: unknown;
  previewData?: unknown;
}

// ---------------------------------------------------------------------------
// Storage Service (in-memory index + filesystem)
// ---------------------------------------------------------------------------

class StorageService {
  private uploads = new Map<string, UploadRecord>();
  private results = new Map<string, ConversionResultRecord>();
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.resolve(process.cwd(), 'uploads');
  }

  /** Ensure the uploads directory exists on disk. */
  async ensureUploadsDir(): Promise<void> {
    if (!fs.existsSync(this.uploadsDir)) {
      await fsp.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  getUploadsDir(): string {
    return this.uploadsDir;
  }

  // -----------------------------------------------------------------------
  // Uploads
  // -----------------------------------------------------------------------

  async saveUpload(file: Express.Multer.File): Promise<UploadRecord> {
    const id = uuidv4();
    const record: UploadRecord = {
      id,
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(),
    };
    this.uploads.set(id, record);
    return record;
  }

  async saveUploadFromBuffer(buffer: Buffer, originalName: string, mimeType: string): Promise<UploadRecord> {
    await this.ensureUploadsDir();
    const id = uuidv4();
    const filename = `${id}-${originalName}`;
    const filePath = path.join(this.uploadsDir, filename);
    await fsp.writeFile(filePath, buffer);
    const record: UploadRecord = {
      id,
      originalName,
      filename,
      path: filePath,
      size: buffer.length,
      mimeType,
      uploadedAt: new Date().toISOString(),
    };
    this.uploads.set(id, record);
    return record;
  }

  getUploadRecord(id: string): UploadRecord | undefined {
    return this.uploads.get(id);
  }

  async getUploadBuffer(id: string): Promise<Buffer | undefined> {
    const record = this.uploads.get(id);
    if (!record) return undefined;
    try {
      return await fsp.readFile(record.path);
    } catch {
      return undefined;
    }
  }

  listUploads(): UploadRecord[] {
    return Array.from(this.uploads.values());
  }

  async deleteUpload(id: string): Promise<boolean> {
    const record = this.uploads.get(id);
    if (!record) return false;
    try {
      await fsp.unlink(record.path);
    } catch {
      // File may already be gone — that is fine
    }
    this.uploads.delete(id);
    return true;
  }

  // -----------------------------------------------------------------------
  // Conversion results
  // -----------------------------------------------------------------------

  saveResult(jobId: string, epub: Buffer, report: unknown, metadata?: unknown, stats?: unknown, previewData?: unknown): void {
    this.results.set(jobId, { epub, report, metadata, stats, previewData });
  }

  getResult(jobId: string): ConversionResultRecord | undefined {
    return this.results.get(jobId);
  }
}

export const storageService = new StorageService();
