import { Router } from 'express';
import { query, get, run } from '../db/index.js';
import { authenticate, optionalAuth, requireRole, logAuditAction, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/careers - Public listing of active openings
router.get('/', optionalAuth, (req: AuthenticatedRequest, res) => {
  const isPrivileged = req.user && ['Founder', 'Administrator', 'Recruitment Manager'].includes(req.user.role);

  let sql = 'SELECT c.*, d.name as department_name FROM careers c LEFT JOIN departments d ON c.department_id = d.id';
  if (!isPrivileged) {
    sql += " WHERE c.status = 'open'";
  }
  sql += ' ORDER BY c.created_at DESC';

  const careers = query(sql);
  return res.json({ careers });
});

// POST /api/careers - Create opening
router.post('/', authenticate, requireRole('Founder', 'Administrator', 'Recruitment Manager'), (req: AuthenticatedRequest, res) => {
  const { title, department_id, location, job_type, description, requirements, deadline, status } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  const id = `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 5);
  const now = new Date().toISOString();

  run(
    `INSERT INTO careers (id, title, slug, department_id, location, job_type, description, requirements, status, deadline, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      title.trim(),
      slug,
      department_id || null,
      location || 'Remote / Hybrid',
      job_type || 'Collegiate / Volunteer',
      description.trim(),
      requirements ? requirements.trim() : null,
      status || 'open',
      deadline || null,
      now,
    ]
  );

  const created = get('SELECT * FROM careers WHERE id = ?', [id]);
  logAuditAction(req.user!.id, 'CREATE_CAREER_OPENING', 'career', id, { title }, req.ip);

  return res.status(201).json({ career: created });
});

// POST /api/careers/apply - Submit real application
router.post('/apply', (req, res) => {
  const { career_id, department_name, applicant_name, applicant_email, skills, cover_note, portfolio_url } = req.body;

  if (!applicant_name || !applicant_email) {
    return res.status(400).json({ error: 'Applicant name and email are required.' });
  }

  const id = `app-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  run(
    `INSERT INTO career_applications (id, career_id, department_name, applicant_name, applicant_email, skills, cover_note, portfolio_url, status, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      career_id || null,
      department_name || null,
      applicant_name.trim(),
      applicant_email.trim().toLowerCase(),
      skills ? (Array.isArray(skills) ? skills.join(', ') : skills.trim()) : null,
      cover_note ? cover_note.trim() : null,
      portfolio_url ? portfolio_url.trim() : null,
      'pending',
      now,
    ]
  );

  return res.status(201).json({
    success: true,
    message: 'Application submitted successfully. It has been recorded in the organization recruitment queue.',
    application_id: id,
  });
});

// GET /api/careers/applications - Admin review
router.get('/applications', authenticate, requireRole('Founder', 'Administrator', 'Recruitment Manager'), (_req, res) => {
  const applications = query(`
    SELECT ca.*, c.title as career_title
    FROM career_applications ca
    LEFT JOIN careers c ON ca.career_id = c.id
    ORDER BY ca.submitted_at DESC
  `);

  return res.json({ applications });
});

// PUT /api/careers/applications/:id - Update application status
router.put('/applications/:id', authenticate, requireRole('Founder', 'Administrator', 'Recruitment Manager'), (req: AuthenticatedRequest, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  run('UPDATE career_applications SET status = ? WHERE id = ?', [status, req.params.id]);
  logAuditAction(req.user!.id, 'UPDATE_APPLICATION_STATUS', 'career_application', req.params.id, { status }, req.ip);

  return res.json({ success: true, message: 'Application status updated.' });
});

export default router;
