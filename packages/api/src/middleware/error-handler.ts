import type { Request, Response, NextFunction } from 'express';

/**
 * Custom API error class with HTTP status code.
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, message, details);
  }

  static notFound(message: string): ApiError {
    return new ApiError(404, message);
  }

  static internal(message: string): ApiError {
    return new ApiError(500, message);
  }
}

/**
 * Global error-handling middleware for Express.
 *
 * Must have 4 parameters so Express recognises it as an error handler.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[API Error]', err);

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // Multer-specific errors
  if (err.name === 'MulterError') {
    const multerErr = err as Error & { code: string };
    const status = multerErr.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    res.status(status).json({
      error: {
        message: multerErr.code === 'LIMIT_FILE_SIZE'
          ? 'File too large. Maximum size is 50 MB.'
          : multerErr.message,
      },
    });
    return;
  }

  // Fallback: unknown error
  res.status(500).json({
    error: {
      message: 'Internal server error',
    },
  });
}
