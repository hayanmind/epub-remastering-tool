import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { isDemoMode, signToken, authMiddleware, type AuthUser } from '../middleware/auth.js';

export const authRouter = Router();

// ---------------------------------------------------------------------------
// In-memory user store (for simplicity; replace with DB in production)
// ---------------------------------------------------------------------------

interface StoredUser extends AuthUser {
  passwordHash: string;
}

const users = new Map<string, StoredUser>();

// Pre-populate the demo user
users.set('demo@example.com', {
  id: 'demo-user',
  email: 'demo@example.com',
  name: '데모 사용자',
  passwordHash: hashPassword('demo1234'),
});

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

authRouter.post('/auth/login', (req: Request, res: Response, _next: NextFunction) => {
  const { email, password } = req.body ?? {};

  // In demo mode, always return a demo user
  if (isDemoMode()) {
    const demoUser: AuthUser = { id: 'demo-user', email: email || 'demo@example.com', name: '데모 사용자' };
    const token = signToken(demoUser);
    res.json({ token, user: demoUser });
    return;
  }

  if (!email || !password) {
    res.status(400).json({ error: { message: '이메일과 비밀번호를 입력해주세요.' } });
    return;
  }

  const storedUser = users.get(email);
  if (!storedUser || storedUser.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: { message: '이메일 또는 비밀번호가 올바르지 않습니다.' } });
    return;
  }

  const userPayload: AuthUser = { id: storedUser.id, email: storedUser.email, name: storedUser.name };
  const token = signToken(userPayload);
  res.json({ token, user: userPayload });
});

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

authRouter.post('/auth/register', (req: Request, res: Response, _next: NextFunction) => {
  const { email, password, name } = req.body ?? {};

  // In demo mode, always return a demo user
  if (isDemoMode()) {
    const demoUser: AuthUser = { id: 'demo-user', email: email || 'demo@example.com', name: name || '데모 사용자' };
    const token = signToken(demoUser);
    res.json({ token, user: demoUser });
    return;
  }

  if (!email || !password || !name) {
    res.status(400).json({ error: { message: '이메일, 비밀번호, 이름을 모두 입력해주세요.' } });
    return;
  }

  if (users.has(email)) {
    res.status(409).json({ error: { message: '이미 등록된 이메일입니다.' } });
    return;
  }

  const id = crypto.randomUUID();
  const newUser: StoredUser = { id, email, name, passwordHash: hashPassword(password) };
  users.set(email, newUser);

  const userPayload: AuthUser = { id, email, name };
  const token = signToken(userPayload);
  res.status(201).json({ token, user: userPayload });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

authRouter.get('/auth/me', authMiddleware, (req: Request, res: Response) => {
  res.json({ user: req.user });
});
