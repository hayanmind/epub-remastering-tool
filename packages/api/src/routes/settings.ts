import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../middleware/error-handler.js';
import { isDemoMode } from '../middleware/auth.js';

export const settingsRouter = Router();

// ---------------------------------------------------------------------------
// In-memory settings store (demo purposes)
// ---------------------------------------------------------------------------

interface AppSettings {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  [key: string]: string | undefined;
}

const settings: AppSettings = {};

// Mask an API key to reveal only the last 4 characters.
function maskKey(key: string | undefined): string | null {
  if (!key) return null;
  if (key.length <= 4) return '****';
  return '*'.repeat(key.length - 4) + key.slice(-4);
}

// ---------------------------------------------------------------------------
// GET /api/health - Health check
// ---------------------------------------------------------------------------

settingsRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version ?? '1.0.0',
    demo: isDemoMode(),
  });
});

// ---------------------------------------------------------------------------
// GET /api/settings - Get current settings (masked API keys)
// ---------------------------------------------------------------------------

settingsRouter.get('/settings', (_req: Request, res: Response) => {
  res.json({
    openaiApiKey: maskKey(settings.openaiApiKey),
    anthropicApiKey: maskKey(settings.anthropicApiKey),
    hasOpenaiKey: !!settings.openaiApiKey,
    hasAnthropicKey: !!settings.anthropicApiKey,
  });
});

// ---------------------------------------------------------------------------
// POST /api/settings - Update API keys
// ---------------------------------------------------------------------------

settingsRouter.post('/settings', (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      throw ApiError.badRequest('Request body must be a JSON object');
    }

    if (typeof body.openaiApiKey === 'string') {
      settings.openaiApiKey = body.openaiApiKey || undefined;
    }
    if (typeof body.anthropicApiKey === 'string') {
      settings.anthropicApiKey = body.anthropicApiKey || undefined;
    }

    res.json({
      message: 'Settings updated',
      openaiApiKey: maskKey(settings.openaiApiKey),
      anthropicApiKey: maskKey(settings.anthropicApiKey),
      hasOpenaiKey: !!settings.openaiApiKey,
      hasAnthropicKey: !!settings.anthropicApiKey,
    });
  } catch (err) {
    next(err);
  }
});
