import { Router } from 'express';
import { query, get } from '../db/index.js';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/dashboard/stats - Real-time Database Metrics (Zero-Demo-Data Policy)
router.get('/stats', authenticate, requireRole('Founder', 'Administrator', 'Department Lead', 'Project Lead', 'Event Lead'), (_req: AuthenticatedRequest, res) => {
  // 1. Members
  const totalMembers = get<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE status = ?', ['active'])?.count || 0;

  // 2. Projects & Status Breakdown
  const totalProjects = get<{ count: number }>('SELECT COUNT(*) as count FROM projects')?.count || 0;
  const projectsByStatus = query<{ status: string; count: number }>(
    'SELECT status, COUNT(*) as count FROM projects GROUP BY status'
  );

  // 3. Events & Registrations
  const totalEvents = get<{ count: number }>('SELECT COUNT(*) as count FROM events')?.count || 0;
  const totalEventRegistrations = get<{ count: number }>('SELECT COUNT(*) as count FROM event_registrations')?.count || 0;
  const totalEventTeams = get<{ count: number }>('SELECT COUNT(*) as count FROM event_teams')?.count || 0;

  // 4. Departments & Org Teams
  const totalDepartments = get<{ count: number }>('SELECT COUNT(*) as count FROM departments WHERE status = ?', ['active'])?.count || 0;
  const totalTeams = get<{ count: number }>('SELECT COUNT(*) as count FROM teams WHERE status = ?', ['active'])?.count || 0;

  // 5. Inquiries
  const totalInquiries = get<{ count: number }>('SELECT COUNT(*) as count FROM contact_inquiries')?.count || 0;
  const unreadInquiries = get<{ count: number }>('SELECT COUNT(*) as count FROM contact_inquiries WHERE status = ?', ['New'])?.count || 0;

  // 6. Recruitment Applications
  const totalApplications = get<{ count: number }>('SELECT COUNT(*) as count FROM career_applications')?.count || 0;

  // 7. Recent Genuine Activity from Audit Logs
  const recentActivity = query(`
    SELECT a.*, u.full_name as user_name
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT 8
  `);

  // System Configuration Status
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  return res.json({
    metrics: {
      total_members: totalMembers,
      total_projects: totalProjects,
      projects_by_status: projectsByStatus,
      total_events: totalEvents,
      total_event_registrations: totalEventRegistrations,
      total_event_teams: totalEventTeams,
      total_departments: totalDepartments,
      total_teams: totalTeams,
      total_inquiries: totalInquiries,
      unread_inquiries: unreadInquiries,
      total_applications: totalApplications,
    },
    recent_activity: recentActivity,
    system_status: {
      database: 'SQLite 3 (Persistent WAL Mode)',
      smtp_configured: smtpConfigured,
      zero_demo_data: true,
    },
  });
});

export default router;
