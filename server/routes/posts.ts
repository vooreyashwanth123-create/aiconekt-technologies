import { Router } from 'express';
import { query, get, run } from '../db/index.js';
import { authenticate, optionalAuth, requireRole, logAuditAction, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/posts - Public listings of published posts/announcements
router.get('/', optionalAuth, (req: AuthenticatedRequest, res) => {
  const isPrivileged = req.user && ['Founder', 'Administrator', 'Content Editor'].includes(req.user.role);

  let sql = `
    SELECT p.*, u.full_name as author_name
    FROM posts p
    LEFT JOIN users u ON p.author_id = u.id
  `;

  if (!isPrivileged) {
    sql += " WHERE p.publication_status = 'published'";
  }

  sql += ' ORDER BY p.created_at DESC';
  const posts = query(sql);
  return res.json({ posts });
});

// GET /api/posts/:id
router.get('/:id', optionalAuth, (req: AuthenticatedRequest, res) => {
  const post = get(
    `SELECT p.*, u.full_name as author_name
     FROM posts p
     LEFT JOIN users u ON p.author_id = u.id
     WHERE p.id = ? OR p.slug = ?`,
    [req.params.id, req.params.id]
  );

  if (!post) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  const isPrivileged = req.user && ['Founder', 'Administrator', 'Content Editor'].includes(req.user.role);
  if (!isPrivileged && post.publication_status !== 'published') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  return res.json({ post });
});

// POST /api/posts - Create post
router.post('/', authenticate, requireRole('Founder', 'Administrator', 'Content Editor'), (req: AuthenticatedRequest, res) => {
  const { title, summary, content, category, publication_status } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  const id = `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 5);
  const now = new Date().toISOString();

  run(
    `INSERT INTO posts (id, title, slug, summary, content, category, author_id, publication_status, published_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      title.trim(),
      slug,
      summary ? summary.trim() : null,
      content.trim(),
      category || 'Announcement',
      req.user!.id,
      publication_status || 'published',
      publication_status === 'published' ? now : null,
      now,
      now,
    ]
  );

  const created = get('SELECT * FROM posts WHERE id = ?', [id]);
  logAuditAction(req.user!.id, 'CREATE_POST', 'post', id, { title }, req.ip);

  return res.status(201).json({ post: created });
});

// PUT /api/posts/:id
router.put('/:id', authenticate, requireRole('Founder', 'Administrator', 'Content Editor'), (req: AuthenticatedRequest, res) => {
  const existing = get('SELECT id FROM posts WHERE id = ?', [req.params.id]);
  if (!existing) {
    return res.status(404).json({ error: 'Post not found.' });
  }

  const { title, summary, content, category, publication_status } = req.body;
  const now = new Date().toISOString();

  run(
    `UPDATE posts SET
      title = COALESCE(?, title),
      summary = COALESCE(?, summary),
      content = COALESCE(?, content),
      category = COALESCE(?, category),
      publication_status = COALESCE(?, publication_status),
      updated_at = ?
    WHERE id = ?`,
    [title, summary, content, category, publication_status, now, req.params.id]
  );

  const updated = get('SELECT * FROM posts WHERE id = ?', [req.params.id]);
  logAuditAction(req.user!.id, 'UPDATE_POST', 'post', req.params.id, null, req.ip);

  return res.json({ post: updated });
});

// DELETE /api/posts/:id
router.delete('/:id', authenticate, requireRole('Founder', 'Administrator'), (req: AuthenticatedRequest, res) => {
  run('DELETE FROM posts WHERE id = ?', [req.params.id]);
  logAuditAction(req.user!.id, 'DELETE_POST', 'post', req.params.id, null, req.ip);

  return res.json({ success: true, message: 'Post removed.' });
});

export default router;
