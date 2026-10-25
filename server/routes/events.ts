import { Router } from 'express';
import { query, get, run, transaction } from '../db/index.js';
import { authenticate, optionalAuth, requireRole, logAuditAction, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

function formatEvent(e: any) {
  return {
    ...e,
    tags: e.tags ? JSON.parse(e.tags) : [],
    is_virtual: Boolean(e.is_virtual),
  };
}

// GET /api/events - Public listing of published events
router.get('/', optionalAuth, (req: AuthenticatedRequest, res) => {
  const isPrivileged = req.user && ['Founder', 'Administrator', 'Event Lead'].includes(req.user.role);

  let sql = 'SELECT * FROM events';
  if (!isPrivileged) {
    sql += " WHERE publication_status = 'published'";
  }
  sql += ' ORDER BY start_date ASC';

  const rows = query(sql);

  // Attach registration counts to each event
  const events = rows.map((evt) => {
    const regCount = get<{ count: number }>(
      'SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?',
      [evt.id]
    )?.count || 0;

    const teamCount = get<{ count: number }>(
      'SELECT COUNT(*) as count FROM event_teams WHERE event_id = ?',
      [evt.id]
    )?.count || 0;

    return {
      ...formatEvent(evt),
      registered_attendees_count: regCount,
      registered_teams_count: teamCount,
    };
  });

  return res.json({ events });
});

// GET /api/events/:id - Event details + event teams
router.get('/:id', optionalAuth, (req: AuthenticatedRequest, res) => {
  const evt = get('SELECT * FROM events WHERE id = ? OR slug = ?', [req.params.id, req.params.id]);
  if (!evt) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  const isPrivileged = req.user && ['Founder', 'Administrator', 'Event Lead'].includes(req.user.role);
  if (!isPrivileged && evt.publication_status !== 'published') {
    return res.status(403).json({ error: 'Access denied.' });
  }

  // Get Event-Specific Teams
  const teams = query('SELECT * FROM event_teams WHERE event_id = ? ORDER BY created_at ASC', [evt.id]);
  const teamsWithMembers = teams.map((team) => {
    const members = query('SELECT * FROM event_team_members WHERE event_team_id = ?', [team.id]);
    return {
      ...team,
      members,
    };
  });

  const regCount = get<{ count: number }>(
    'SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?',
    [evt.id]
  )?.count || 0;

  return res.json({
    event: {
      ...formatEvent(evt),
      registered_attendees_count: regCount,
      registered_teams_count: teams.length,
      teams: teamsWithMembers,
    },
  });
});

// POST /api/events - Create new event
router.post('/', authenticate, requireRole('Founder', 'Administrator', 'Event Lead'), (req: AuthenticatedRequest, res) => {
  const {
    title,
    category,
    tagline,
    description,
    banner_gradient,
    start_date,
    end_date,
    time_zone,
    venue,
    is_virtual,
    status,
    publication_status,
    capacity,
    min_team_size,
    max_team_size,
    prize_pool,
    tags,
  } = req.body;

  if (!title || !category || !start_date || !venue) {
    return res.status(400).json({ error: 'Title, category, start date, and venue are required.' });
  }

  const id = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 5);
  const now = new Date().toISOString();

  run(
    `INSERT INTO events (
      id, title, slug, category, tagline, description, banner_gradient,
      start_date, end_date, time_zone, venue, is_virtual, status, publication_status,
      capacity, min_team_size, max_team_size, prize_pool, tags, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      title.trim(),
      slug,
      category,
      tagline ? tagline.trim() : null,
      description ? description.trim() : '',
      banner_gradient || 'from-cyan-900/60 via-blue-900/40 to-slate-950',
      start_date,
      end_date || null,
      time_zone || 'IST',
      venue.trim(),
      is_virtual ? 1 : 0,
      status || 'Upcoming',
      publication_status || 'published',
      Number(capacity) || 100,
      Number(min_team_size) || 1,
      Number(max_team_size) || 4,
      prize_pool ? prize_pool.trim() : null,
      tags ? JSON.stringify(tags) : JSON.stringify([]),
      req.user!.id,
      now,
      now,
    ]
  );

  const created = get('SELECT * FROM events WHERE id = ?', [id]);
  logAuditAction(req.user!.id, 'CREATE_EVENT', 'event', id, { title }, req.ip);

  return res.status(201).json({ event: formatEvent(created) });
});

// PUT /api/events/:id
router.put('/:id', authenticate, requireRole('Founder', 'Administrator', 'Event Lead'), (req: AuthenticatedRequest, res) => {
  const existing = get('SELECT id FROM events WHERE id = ?', [req.params.id]);
  if (!existing) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  const {
    title,
    category,
    tagline,
    description,
    banner_gradient,
    start_date,
    end_date,
    venue,
    is_virtual,
    status,
    publication_status,
    capacity,
    min_team_size,
    max_team_size,
    prize_pool,
    tags,
  } = req.body;
  const now = new Date().toISOString();

  run(
    `UPDATE events SET
      title = COALESCE(?, title),
      category = COALESCE(?, category),
      tagline = COALESCE(?, tagline),
      description = COALESCE(?, description),
      banner_gradient = COALESCE(?, banner_gradient),
      start_date = COALESCE(?, start_date),
      end_date = COALESCE(?, end_date),
      venue = COALESCE(?, venue),
      is_virtual = COALESCE(?, is_virtual),
      status = COALESCE(?, status),
      publication_status = COALESCE(?, publication_status),
      capacity = COALESCE(?, capacity),
      min_team_size = COALESCE(?, min_team_size),
      max_team_size = COALESCE(?, max_team_size),
      prize_pool = COALESCE(?, prize_pool),
      tags = COALESCE(?, tags),
      updated_at = ?
    WHERE id = ?`,
    [
      title,
      category,
      tagline,
      description,
      banner_gradient,
      start_date,
      end_date,
      venue,
      is_virtual !== undefined ? (is_virtual ? 1 : 0) : null,
      status,
      publication_status,
      capacity ? Number(capacity) : null,
      min_team_size ? Number(min_team_size) : null,
      max_team_size ? Number(max_team_size) : null,
      prize_pool,
      tags ? JSON.stringify(tags) : null,
      now,
      req.params.id,
    ]
  );

  const updated = get('SELECT * FROM events WHERE id = ?', [req.params.id]);
  logAuditAction(req.user!.id, 'UPDATE_EVENT', 'event', req.params.id, null, req.ip);

  return res.json({ event: formatEvent(updated) });
});

// DELETE /api/events/:id
router.delete('/:id', authenticate, requireRole('Founder', 'Administrator'), (req: AuthenticatedRequest, res) => {
  const existing = get('SELECT id FROM events WHERE id = ?', [req.params.id]);
  if (!existing) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  run('DELETE FROM events WHERE id = ?', [req.params.id]);
  logAuditAction(req.user!.id, 'DELETE_EVENT', 'event', req.params.id, null, req.ip);

  return res.json({ success: true, message: 'Event deleted.' });
});

// POST /api/events/:id/register - Individual registration with capacity check
router.post('/:id/register', optionalAuth, (req: AuthenticatedRequest, res) => {
  const evt = get<any>('SELECT * FROM events WHERE id = ?', [req.params.id]);
  if (!evt) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  if (evt.status !== 'Upcoming' && evt.status !== 'Registration Open') {
    return res.status(400).json({ error: `Registrations are not open for this event (current status: ${evt.status}).` });
  }

  const { attendee_name, attendee_email } = req.body;
  if (!attendee_name || !attendee_email) {
    return res.status(400).json({ error: 'Attendee name and email are required.' });
  }

  const emailNorm = attendee_email.trim().toLowerCase();

  // Duplicate Check
  const existing = get(
    'SELECT id FROM event_registrations WHERE event_id = ? AND attendee_email = ?',
    [evt.id, emailNorm]
  );
  if (existing) {
    return res.status(409).json({ error: 'You are already registered for this event.' });
  }

  // Capacity Check
  const currentCount = get<{ count: number }>(
    'SELECT COUNT(*) as count FROM event_registrations WHERE event_id = ?',
    [evt.id]
  )?.count || 0;

  if (evt.capacity && currentCount >= evt.capacity) {
    return res.status(400).json({ error: 'Event capacity has been reached. Registrations are full.' });
  }

  const regId = `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  run(
    `INSERT INTO event_registrations (id, event_id, user_id, attendee_name, attendee_email, status, registered_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [regId, evt.id, req.user?.id || null, attendee_name.trim(), emailNorm, 'confirmed', now]
  );

  return res.status(201).json({
    success: true,
    message: `Registration confirmed for ${evt.title}.`,
    registration_id: regId,
  });
});

// POST /api/events/:id/teams - Register / Create Event-Specific Team
// CRITICAL: Strictly separates event team from organisation team per Section 11!
router.post('/:id/teams', optionalAuth, (req: AuthenticatedRequest, res) => {
  const evt = get<any>('SELECT * FROM events WHERE id = ?', [req.params.id]);
  if (!evt) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  const { team_name, lead_name, lead_email, project_pitch, members } = req.body;

  if (!team_name || !lead_name || !lead_email) {
    return res.status(400).json({ error: 'Team name, lead name, and lead email are required.' });
  }

  // Duplicate team name check for this event
  const existingTeam = get(
    'SELECT id FROM event_teams WHERE event_id = ? AND LOWER(team_name) = ?',
    [evt.id, team_name.trim().toLowerCase()]
  );
  if (existingTeam) {
    return res.status(409).json({ error: 'A team with this name is already registered for this event.' });
  }

  const teamId = `evteam-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  transaction(() => {
    run(
      `INSERT INTO event_teams (id, event_id, team_name, lead_name, lead_email, project_pitch, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [teamId, evt.id, team_name.trim(), lead_name.trim(), lead_email.trim().toLowerCase(), project_pitch || null, 'active', now]
    );

    // Insert Team Lead as first member
    run(
      `INSERT INTO event_team_members (id, event_team_id, user_id, member_name, member_email, role_in_team, joined_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [`evtm-${Date.now()}-lead`, teamId, req.user?.id || null, lead_name.trim(), lead_email.trim().toLowerCase(), 'Event Lead', now]
    );

    // Insert additional roster members if provided
    if (Array.isArray(members)) {
      members.forEach((m: any, idx: number) => {
        if (m.name && m.email) {
          run(
            `INSERT INTO event_team_members (id, event_team_id, user_id, member_name, member_email, role_in_team, joined_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              `evtm-${Date.now()}-${idx}`,
              teamId,
              null,
              m.name.trim(),
              m.email.trim().toLowerCase(),
              m.role || 'Developer',
              now,
            ]
          );
        }
      });
    }
  });

  const createdTeam = get('SELECT * FROM event_teams WHERE id = ?', [teamId]);
  const teamMembers = query('SELECT * FROM event_team_members WHERE event_team_id = ?', [teamId]);

  return res.status(201).json({
    team: {
      ...createdTeam,
      members: teamMembers,
    },
  });
});

export default router;
