import crypto from 'node:crypto';
import { query, get, run } from '../db/index.js';

let _ephemeralSecret: string | null = null;
function getEphemeralSecret(): string {
  if (!_ephemeralSecret) {
    _ephemeralSecret = crypto.randomBytes(32).toString('hex');
    console.warn('[Security Notice] No valid JWT_SECRET configured in environment. Using generated ephemeral session key.');
  }
  return _ephemeralSecret;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        '[Security] FATAL: JWT_SECRET environment variable is missing or shorter than 32 characters. Production startup halted.'
      );
    }
    return getEphemeralSecret();
  }
  return secret;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'Founder' | 'Administrator' | 'Department Lead' | 'Project Lead' | 'Event Lead' | 'Team Member' | 'Viewer';
  avatar_url?: string;
  bio?: string;
  status: 'active' | 'suspended' | 'invited';
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

// Secure Password Hashing using PBKDF2 with SHA-512
export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'));
}

// Generate Secure Signed Token
export function generateToken(user: User): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    })
  ).toString('base64url');

  const secret = getJwtSecret();
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

// Verify Signed Token
export function verifyToken(token: string): { sub: string; email: string; role: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;

    const secret = getJwtSecret();
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return data;
  } catch {
    return null;
  }
}

// Bootstrap Founders & Initial Admin Setup from Secure Environment
export function ensureFoundersInitialized() {
  const now = new Date().toISOString();

  // 1. Founder & CEO: KOLLOJU RAVI CHARAN
  const raviEmail = 'ravicharan@aiconekt.org';
  const existingRavi = get('SELECT id FROM users WHERE email = ?', [raviEmail]);
  if (!existingRavi) {
    const initialFounderPass = process.env.INITIAL_FOUNDER_PASSWORD;
    if (initialFounderPass) {
      const { hash, salt } = hashPassword(initialFounderPass);
      run(
        `INSERT INTO users (id, email, password_hash, salt, full_name, role, bio, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'usr-founder-ravi',
          raviEmail,
          hash,
          salt,
          'KOLLOJU RAVI CHARAN',
          'Founder',
          'Founder & Chief Executive Officer (CEO) of AICONEKT TECHNOLOGIES.',
          'active',
          now,
          now,
        ]
      );
      console.log('[Auth] Initialized Founder & CEO: KOLLOJU RAVI CHARAN');
    } else {
      console.warn('[Auth] INITIAL_FOUNDER_PASSWORD not set. Founder account will not be auto-seeded.');
    }
  }

  // 2. Co-Founder & Chief Manager: VOORE YASHWANTH
  const yashwanthEmail = 'yashwanth@aiconekt.org';
  const existingYashwanth = get('SELECT id FROM users WHERE email = ?', [yashwanthEmail]);
  if (!existingYashwanth) {
    const initialManagerPass = process.env.INITIAL_MANAGER_PASSWORD || process.env.INITIAL_FOUNDER_PASSWORD;
    if (initialManagerPass) {
      const { hash, salt } = hashPassword(initialManagerPass);
      run(
        `INSERT INTO users (id, email, password_hash, salt, full_name, role, bio, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'usr-founder-yashwanth',
          yashwanthEmail,
          hash,
          salt,
          'VOORE YASHWANTH',
          'Founder',
          'Co-Founder & Chief Manager of AICONEKT TECHNOLOGIES.',
          'active',
          now,
          now,
        ]
      );
      console.log('[Auth] Initialized Co-Founder & Chief Manager: VOORE YASHWANTH');
    } else {
      console.warn('[Auth] INITIAL_MANAGER_PASSWORD not set. Manager account will not be auto-seeded.');
    }
  }
}
