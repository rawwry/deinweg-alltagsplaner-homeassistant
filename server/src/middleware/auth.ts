import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/paths.js';
import { UserRole } from '../../../shared/types.js';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  locationId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(user: AuthUser, rememberMe: boolean = false): string {
  const expiresIn = rememberMe ? '90d' : '24h';
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      locationId: user.locationId,
    },
    JWT_SECRET,
    { expiresIn }
  );
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Nicht authentifiziert. Bitte einloggen.' });
  }

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sitzung abgelaufen oder ungültig.' });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
      req.user = payload;
    } catch {
      // Ignore token verification errors in optional mode
    }
  }
  next();
}
