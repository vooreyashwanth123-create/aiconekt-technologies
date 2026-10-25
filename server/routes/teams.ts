import { Router } from 'express';
import { query, get, run, transaction } from '../db/index.js';
import { authenticate, optionalAuth, requireRole, logAuditAction, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// ==========================================
// 1. DEPARTMENTS
// ==========================================

// GET /api/departments
router.get('/departments', (_req, res) => {
  const departments = query(`
    SELECT d.*, u.full_name as lead_name
    FROM departments d
    LEFT JOIN users u ON d.lead_user_id = u.id
    WHERE d.status = 'active'
    ORDER BY d.name ASC
  `);

  const withCounts = departments.map((d) => {
    const memberCount = get<{ count: number }>(
      `SELECT COUNT(DISTINCT tm.user_id) as count
       FROM team_members tm
       JOIN teams t ON tm.team_id = t.id
       WHERE t.department_id = ?`,
      [d.id]
    )?.count || 0;

    return {
      ...d,
      member_count: memberCount,
    };
  });

  return res.json({ departments: withCounts });
});

// POST /api/departments - Admin creates department
router.post('/departments', authenticate, requireRole('Founder', 'Administrator'), (req: AuthenticatedRequest, res) => {
  const { name, code, description, icon_name, lead_user_id } = req.body;

  if (!name || !code) {
    return res.status(400).json({ error: 'Department name and code are required.' });
  }

  const id = `dept-${code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const now = new Date().toISOString();

  run(
    `INSERT INTO departments (id, name, code, description, icon_name, lead_user_id, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name.trim(), code.trim().toUpperCase(), description || '', icon_name || 'Cpu', lead_user_id || null, 'active', now]
  );

  const created = get('SELECT * FROM departments WHERE id = ?', [id]);
  logAuditAction(req.user!.id, 'CREATE_DEPARTMENT', 'department', id, { name }, req.ip);

  return res.status(201).json({ department: created });
});

// ==========================================
// 2. ORGANISATION TEAMS
// ==========================================

// GET /api/teams - List organisation teams
router.get('/teams', (_req, res) => {
  const teams = query(`
    SELECT t.*, d.name as department_name, u.full_name as lead_name
    FROM teams t
    LEFT JOIN departments d ON t.department_id = d.id
    LEFT JOIN users u ON t.lead_user_id = u.id
    WHERE t.status = 'active'
    ORDER BY t.name ASC
  `);

  const teamsWithMembers = teams.map((team) => {
    const members = query(`
      SELECT tm.id as membership_id, tm.role_in_team, tm.joined_at, u.id as user_id, u.full_name, u.email, u.avatar_url
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
    `, [team.id]);

    return {
      ...team,
      members,
    };
  });

  return res.json({ teams: teamsWithMembers });
});

// POST /api/teams - Create organisation team
router.post('/teams', authenticate, requireRole('Founder', 'Administrator', 'Department Lead'), (req: AuthenticatedRequest, res) => {
  const { name, department_id, lead_user_id, purpose } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Team name is required.' });
  }

  const id = `team-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  run(
    `INSERT INTO teams (id, name, department_id, lead_user_id, purpose, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, name.trim(), department_id || null, lead_user_id || req.user!.id, purpose || '', 'active', now]
  );

  const created = get('SELECT * FROM teams WHERE id = ?', [id]);
  logAuditAction(req.user!.id, 'CREATE_TEAM', 'team', id, { name }, req.ip);

  return res.status(201).json({ team: created });
});

// POST /api/teams/:id/members - Assign member to organisation team
router.post('/teams/:id/members', authenticate, requireRole('Founder', 'Administrator', 'Department Lead'), (req: AuthenticatedRequest, res) => {
  const { user_id, role_in_team } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const user = get('SELECT id FROM users WHERE id = ?', [user_id]);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const team = get('SELECT id FROM teams WHERE id = ?', [req.params.id]);
  if (!team) {
    return res.status(404).json({ error: 'Team not found.' });
  }

  const id = `tm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  run(
    `INSERT INTO team_members (id, team_id, user_id, role_in_team, joined_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(team_id, user_id) DO UPDATE SET role_in_team = excluded.role_in_team`,
    [id, req.params.id, user_id, role_in_team || 'Member', now]
  );

  logAuditAction(req.user!.id, 'ADD_TEAM_MEMBER', 'team', req.params.id, { user_id, role: role_in_team }, req.ip);
  return res.status(201).json({ success: true, message: 'Member assigned to organisation team.' });
});

// DELETE /api/teams/:id/members/:userId - Remove member from team
// Prompt Section 8: Removing someone from a team must remove that membership only.
// It must NOT delete their account or erase historical project contributions!
router.delete('/teams/:id/members/:userId', authenticate, requireRole('Founder', 'Administrator', 'Department Lead'), (req: AuthenticatedRequest, res) => {
  run('DELETE FROM team_members WHERE team_id = ? AND user_id = ?', [req.params.id, req.params.userId]);
  logAuditAction(req.user!.id, 'REMOVE_TEAM_MEMBER', 'team', req.params.id, { removed_user_id: req.params.userId }, req.ip);

  return res.json({ success: true, message: 'Member removed from team (user account and history preserved).' });
});

// ==========================================
// 3. MEMBERS DIRECTORY
// ==========================================

// GET /api/members - Public / Internal directory of active organisation members
router.get('/members', (_req, res) => {
  const members = query(`
    SELECT id, email, full_name, role, avatar_url, bio, status, created_at
    FROM users
    WHERE status = 'active'
    ORDER BY
      CASE
        WHEN role = 'Founder' THEN 1
        WHEN role = 'Administrator' THEN 2
        WHEN role = 'Department Lead' THEN 3
        ELSE 4
      END,
      full_name ASC
  `);

  return res.json({ members });
});

export default router;
