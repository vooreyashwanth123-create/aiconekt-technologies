import { Request, Response, NextFunction } from 'express';
import { verifyToken, User } from '../services/auth.js';
import { get, run } from '../db/index.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }

  const user = get<User>(
    'SELECT id, email, full_name, role, avatar_url, bio, status, created_at, updated_at FROM users WHERE id = ?',
    [payload.sub]
  );

  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'User account is suspended or inactive.' });
  }

  req.user = user;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (payload) {
      const user = get<User>(
        'SELECT id, email, full_name, role, avatar_url, bio, status, created_at, updated_at FROM users WHERE id = ?',
        [payload.sub]
      );
      if (user && user.status === 'active') {
        req.user = user;
      }
    }
  }
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Founders have universal permissions
    if (req.user.role === 'Founder') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}

export function logAuditAction(userId: string | undefined, action: string, entityType: string, entityId: string, details?: any, ip?: string) {
  try {
    const id = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    run(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId || 'system',
        action,
        entityType,
        entityId,
        details ? JSON.stringify(details) : null,
        ip || '127.0.0.1',
        new Date().toISOString(),
      ]
    );
  } catch (err) {
    console.error('[Audit Log Error]', err);
  }
}
