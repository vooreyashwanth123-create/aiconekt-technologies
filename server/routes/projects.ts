import { Router } from 'express';
import { query, get, run } from '../db/index.js';
import { authenticate, optionalAuth, requireRole, logAuditAction, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

function formatProject(p: any) {
  return {
    ...p,
    tags: p.tags ? JSON.parse(p.tags) : [],
    metrics: p.metrics ? JSON.parse(p.metrics) : [],
  };
}

// GET /api/projects - Public view lists only published & public projects
router.get('/', optionalAuth, (req: AuthenticatedRequest, res) => {
  const isPrivileged = req.user && ['Founder', 'Administrator', 'Department Lead', 'Project Lead'].includes(req.user.role);

  let sql = 'SELECT * FROM projects';
  let params: any[] = [];

  if (!isPrivileged) {
    sql += " WHERE visibility = 'public' AND status != 'Draft'";
  }

  sql += ' ORDER BY created_at DESC';

  const rows = query(sql, params);
  return res.json({ projects: rows.map(formatProject) });
});

// GET /api/projects/:id
router.get('/:id', optionalAuth, (req: AuthenticatedRequest, res) => {
  const p = get('SELECT * FROM projects WHERE id = ? OR slug = ?', [req.params.id, req.params.id]);
  if (!p) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const isPrivileged = req.user && ['Founder', 'Administrator', 'Department Lead', 'Project Lead'].includes(req.user.role);
  if (!isPrivileged && (p.visibility !== 'public' || p.status === 'Draft')) {
    return res.status(403).json({ error: 'Access denied to this project.' });
  }

  return res.json({ project: formatProject(p) });
});

// POST /api/projects - Create real project
router.post('/', authenticate, requireRole('Founder', 'Administrator', 'Project Lead', 'Department Lead'), (req: AuthenticatedRequest, res) => {
  const { title, tagline, description, category, status, visibility, github_url, demo_url, tags, metrics } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ error: 'Title, description, and category are required.' });
  }

  const id = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 5);
  const now = new Date().toISOString();

  run(
    `INSERT INTO projects (
      id, title, slug, tagline, description, category, status, visibility,
      lead_user_id, lead_name, github_url, demo_url, tags, metrics, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      title.trim(),
      slug,
      tagline ? tagline.trim() : null,
      description.trim(),
      category,
      status || 'Planned',
      visibility || 'public',
      req.user!.id,
      req.user!.full_name,
      github_url ? github_url.trim() : null,
      demo_url ? demo_url.trim() : null,
      tags ? JSON.stringify(tags) : JSON.stringify([]),
      metrics ? JSON.stringify(metrics) : JSON.stringify([]),
      now,
      now,
    ]
  );

  const created = get('SELECT * FROM projects WHERE id = ?', [id]);
  logAuditAction(req.user!.id, 'CREATE_PROJECT', 'project', id, { title }, req.ip);

  return res.status(201).json({ project: formatProject(created) });
});

// PUT /api/projects/:id
router.put('/:id', authenticate, requireRole('Founder', 'Administrator', 'Project Lead'), (req: AuthenticatedRequest, res) => {
  const existing = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  if (!existing) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  const { title, tagline, description, category, status, visibility, github_url, demo_url, tags, metrics } = req.body;
  const now = new Date().toISOString();

  run(
    `UPDATE projects SET
      title = COALESCE(?, title),
      tagline = COALESCE(?, tagline),
      description = COALESCE(?, description),
      category = COALESCE(?, category),
      status = COALESCE(?, status),
      visibility = COALESCE(?, visibility),
      github_url = COALESCE(?, github_url),
      demo_url = COALESCE(?, demo_url),
      tags = COALESCE(?, tags),
      metrics = COALESCE(?, metrics),
      updated_at = ?
    WHERE id = ?`,
    [
      title,
      tagline,
      description,
      category,
      status,
      visibility,
      github_url,
      demo_url,
      tags ? JSON.stringify(tags) : null,
      metrics ? JSON.stringify(metrics) : null,
      now,
      req.params.id,
    ]
  );

  const updated = get('SELECT * FROM projects WHERE id = ?', [req.params.id]);
  logAuditAction(req.user!.id, 'UPDATE_PROJECT', 'project', req.params.id, null, req.ip);

  return res.json({ project: formatProject(updated) });
});

// DELETE /api/projects/:id
router.delete('/:id', authenticate, requireRole('Founder', 'Administrator'), (req: AuthenticatedRequest, res) => {
  const existing = get('SELECT id FROM projects WHERE id = ?', [req.params.id]);
  if (!existing) {
    return res.status(404).json({ error: 'Project not found.' });
  }

  run('DELETE FROM projects WHERE id = ?', [req.params.id]);
  logAuditAction(req.user!.id, 'DELETE_PROJECT', 'project', req.params.id, null, req.ip);

  return res.json({ success: true, message: 'Project removed.' });
});

export default router;
