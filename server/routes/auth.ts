import { Router } from 'express';
import { get, run } from '../db/index.js';
import { hashPassword, verifyPassword, generateToken, User } from '../services/auth.js';
import { authenticate, logAuditAction, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/demo - Secure credential-free demo access
router.post('/demo', (req, res) => {
  const { role } = req.body;
  const demoRole = role === 'Administrator' ? 'Administrator' : role === 'Team Member' ? 'Team Member' : 'Viewer';

  const demoUser: User = {
    id: `usr-demo-${Date.now()}`,
    email: `demo.${demoRole.toLowerCase().replace(/\s+/g, '')}@aiconekt.org`,
    full_name: `Demo ${demoRole}`,
    role: demoRole as any,
    bio: 'Interactive guest demo session with organization access.',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const token = generateToken(demoUser);
  logAuditAction(demoUser.id, 'DEMO_LOGIN', 'user', demoUser.id, { role: demoRole }, req.ip);

  return res.json({
    token,
    user: demoUser,
  });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = get<any>(
    'SELECT id, email, password_hash, salt, full_name, role, avatar_url, bio, status, created_at, updated_at FROM users WHERE email = ?',
    [email.trim().toLowerCase()]
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password credentials.' });
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'Your account has been suspended or is pending invitation approval.' });
  }

  const isMatch = verifyPassword(password, user.password_hash, user.salt);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password credentials.' });
  }

  const userProfile: User = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    avatar_url: user.avatar_url,
    bio: user.bio,
    status: user.status,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };

  const token = generateToken(userProfile);
  logAuditAction(user.id, 'LOGIN', 'user', user.id, { email: user.email }, req.ip);

  return res.json({
    token,
    user: userProfile,
  });
});

// POST /api/auth/register (Standard Member Onboarding)
router.post('/register', (req, res) => {
  const { email, password, full_name } = req.body;

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'Email, password, and full name are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const id = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();

  run(
    `INSERT INTO users (id, email, password_hash, salt, full_name, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, normalizedEmail, hash, salt, full_name.trim(), 'Team Member', 'active', now, now]
  );

  const newUser: User = {
    id,
    email: normalizedEmail,
    full_name: full_name.trim(),
    role: 'Team Member',
    status: 'active',
    created_at: now,
    updated_at: now,
  };

  const token = generateToken(newUser);
  logAuditAction(id, 'REGISTER', 'user', id, { email: normalizedEmail }, req.ip);

  return res.status(201).json({
    token,
    user: newUser,
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  return res.json({ user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', authenticate, (req: AuthenticatedRequest, res) => {
  const { full_name, bio, avatar_url } = req.body;
  const now = new Date().toISOString();

  run(
    `UPDATE users
     SET full_name = COALESCE(?, full_name),
         bio = COALESCE(?, bio),
         avatar_url = COALESCE(?, avatar_url),
         updated_at = ?
     WHERE id = ?`,
    [full_name, bio, avatar_url, now, req.user!.id]
  );

  const updatedUser = get<User>(
    'SELECT id, email, full_name, role, avatar_url, bio, status, created_at, updated_at FROM users WHERE id = ?',
    [req.user!.id]
  );

  logAuditAction(req.user!.id, 'UPDATE_PROFILE', 'user', req.user!.id, null, req.ip);
  return res.json({ user: updatedUser });
});

export default router;
