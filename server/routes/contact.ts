import { Router } from 'express';
import { query, get, run } from '../db/index.js';
import { sendInquiryNotification } from '../services/email.js';
import { authenticate, requireRole, logAuditAction, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/contact - Real public submission
router.post('/', async (req, res) => {
  const { name, email, subject, category, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const id = `inq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  // 1. Store in persistent database
  run(
    `INSERT INTO contact_inquiries (id, name, email, subject, category, message, status, priority, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      name.trim(),
      email.trim().toLowerCase(),
      subject ? subject.trim() : 'General Inquiry',
      category || 'General Inquiry',
      message.trim(),
      'New',
      'Normal',
      now,
      now,
    ]
  );

  // 2. Trigger real email notification to aiconekttechnologies@gmail.com
  const emailResult = await sendInquiryNotification({
    id,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    subject: subject ? subject.trim() : 'General Inquiry',
    category: category || 'General Inquiry',
    message: message.trim(),
  });

  return res.status(201).json({
    success: true,
    message: 'Inquiry received and logged to the AICONEKT Organization Portal.',
    inquiry_id: id,
    notification: emailResult,
  });
});

// GET /api/contact/inquiries - Admin Inbox
router.get('/inquiries', authenticate, requireRole('Founder', 'Administrator'), (req: AuthenticatedRequest, res) => {
  const { status, category, search } = req.query;

  let sql = 'SELECT * FROM contact_inquiries WHERE 1=1';
  const params: any[] = [];

  if (status && status !== 'all') {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (category && category !== 'all') {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    sql += ' AND (name LIKE ? OR email LIKE ? OR subject LIKE ? OR message LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }

  sql += ' ORDER BY created_at DESC';

  const inquiries = query(sql, params);
  return res.json({ inquiries });
});

// GET /api/contact/inquiries/:id
router.get('/inquiries/:id', authenticate, requireRole('Founder', 'Administrator'), (req: AuthenticatedRequest, res) => {
  const inq = get('SELECT * FROM contact_inquiries WHERE id = ?', [req.params.id]);
  if (!inq) {
    return res.status(404).json({ error: 'Inquiry not found.' });
  }

  // Auto mark as Read if status is New
  if (inq.status === 'New') {
    const now = new Date().toISOString();
    run('UPDATE contact_inquiries SET status = ?, updated_at = ? WHERE id = ?', ['Read', now, inq.id]);
    inq.status = 'Read';
  }

  // Also fetch delivery log if available
  const recipient = process.env.NOTIFICATION_RECIPIENT || 'aiconekttechnologies@gmail.com';
  const logs = query('SELECT * FROM notification_logs WHERE recipient = ? ORDER BY created_at DESC LIMIT 5', [recipient]);

  return res.json({
    inquiry: inq,
    notification_logs: logs,
  });
});

// PUT /api/contact/inquiries/:id - Update status / notes
router.put('/inquiries/:id', authenticate, requireRole('Founder', 'Administrator'), (req: AuthenticatedRequest, res) => {
  const { status, priority, admin_notes } = req.body;
  const now = new Date().toISOString();

  run(
    `UPDATE contact_inquiries SET
      status = COALESCE(?, status),
      priority = COALESCE(?, priority),
      admin_notes = COALESCE(?, admin_notes),
      updated_at = ?
    WHERE id = ?`,
    [status, priority, admin_notes, now, req.params.id]
  );

  const updated = get('SELECT * FROM contact_inquiries WHERE id = ?', [req.params.id]);
  logAuditAction(req.user!.id, 'UPDATE_INQUIRY', 'contact_inquiry', req.params.id, { status, priority }, req.ip);

  return res.json({ inquiry: updated });
});

// DELETE /api/contact/inquiries/:id
router.delete('/inquiries/:id', authenticate, requireRole('Founder', 'Administrator'), (req: AuthenticatedRequest, res) => {
  run('DELETE FROM contact_inquiries WHERE id = ?', [req.params.id]);
  logAuditAction(req.user!.id, 'DELETE_INQUIRY', 'contact_inquiry', req.params.id, null, req.ip);

  return res.json({ success: true, message: 'Inquiry removed.' });
});

export default router;
