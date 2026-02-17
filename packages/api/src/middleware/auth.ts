import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const JWT_SECRET = process.env.JWT_SECRET || '';
const DEMO_MODE = process.env.DEMO_MODE === 'true' || !JWT_SECRET;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isDemoMode(): boolean {
  return DEMO_MODE;
}

export function signToken(user: AuthUser): string {
  const secret = JWT_SECRET || 'demo-secret';
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, secret, {
    expiresIn: '7d',
  });
}

function verifyToken(token: string): AuthUser | null {
  try {
    const secret = JWT_SECRET || 'demo-secret';
    const payload = jwt.verify(token, secret) as AuthUser;
    return { id: payload.id, email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Middleware: strict auth (blocks if not authenticated, skips in demo mode)
// ---------------------------------------------------------------------------

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // In demo mode, skip authentication entirely
  if (DEMO_MODE) {
    req.user = { id: 'demo-user', email: 'demo@example.com', name: '데모 사용자' };
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: { message: '인증이 필요합니다.' } });
    return;
  }

  const token = authHeader.slice(7);
  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ error: { message: '유효하지 않은 토큰입니다.' } });
    return;
  }

  req.user = user;
  next();
}

// ---------------------------------------------------------------------------
// Middleware: optional auth (attaches user if present, never blocks)
// ---------------------------------------------------------------------------

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  // In demo mode, always attach a demo user
  if (DEMO_MODE) {
    req.user = { id: 'demo-user', email: 'demo@example.com', name: '데모 사용자' };
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const user = verifyToken(token);
    if (user) {
      req.user = user;
    }
  }

  next();
}
