import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'node:path';

import { storageService } from './services/storage-service.js';
import { errorHandler } from './middleware/error-handler.js';
import { optionalAuth } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { uploadRouter } from './routes/upload.js';
import { convertRouter } from './routes/convert.js';
import { downloadRouter } from './routes/download.js';
import { settingsRouter } from './routes/settings.js';
import { samplesRouter } from './routes/samples.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PORT = Number(process.env.PORT) || 3001;

// ---------------------------------------------------------------------------
// Express app setup
// ---------------------------------------------------------------------------

const app = express();

// CORS — allow all origins for development
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Multer file upload middleware
// ---------------------------------------------------------------------------

const upload = multer({
  dest: path.resolve(process.cwd(), 'uploads'),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
});

// Attach multer for the upload route
app.use('/api/upload', upload.single('file'));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Auth routes (no auth middleware needed — they handle their own auth)
app.use('/api', authRouter);

// Apply optional auth to all other API routes (attaches user if present, never blocks)
app.use('/api', optionalAuth);

app.use('/api', uploadRouter);
app.use('/api', convertRouter);
app.use('/api', downloadRouter);
app.use('/api', settingsRouter);
app.use('/api', samplesRouter);

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function start(): Promise<void> {
  // Ensure the uploads directory exists before accepting requests
  await storageService.ensureUploadsDir();

  app.listen(PORT, () => {
    console.log(`[api] Server listening on http://localhost:${PORT}`);
    console.log(`[api] Health check: http://localhost:${PORT}/api/health`);
  });
}

start().catch((err) => {
  console.error('[api] Failed to start server:', err);
  process.exit(1);
});

export { app };
