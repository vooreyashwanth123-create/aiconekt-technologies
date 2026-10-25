-- AICONEKT TECHNOLOGIES Database Schema
-- Production Schema for SQLite & PostgreSQL compatibility

PRAGMA foreign_keys = ON;

-- Users and Authentication Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Viewer',
  avatar_url TEXT,
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_name TEXT,
  lead_user_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  FOREIGN KEY (lead_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Organisation Teams Table
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  department_id TEXT,
  lead_user_id TEXT,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (lead_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Organisation Team Memberships (Strictly separated from event teams)
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role_in_team TEXT NOT NULL DEFAULT 'Member',
  joined_at TEXT NOT NULL,
  UNIQUE(team_id, user_id),
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Planned',
  visibility TEXT NOT NULL DEFAULT 'public',
  lead_user_id TEXT,
  lead_name TEXT,
  github_url TEXT,
  demo_url TEXT,
  tags TEXT,
  metrics TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (lead_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_visibility ON projects(visibility);

-- Project Memberships
CREATE TABLE IF NOT EXISTS project_members (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Contributor',
  joined_at TEXT NOT NULL,
  UNIQUE(project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  tagline TEXT,
  description TEXT NOT NULL,
  banner_gradient TEXT DEFAULT 'from-cyan-900/60 via-blue-900/40 to-slate-950',
  start_date TEXT NOT NULL,
  end_date TEXT,
  time_zone TEXT DEFAULT 'IST',
  venue TEXT NOT NULL,
  is_virtual INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Upcoming',
  publication_status TEXT NOT NULL DEFAULT 'published',
  capacity INTEGER DEFAULT 100,
  min_team_size INTEGER DEFAULT 1,
  max_team_size INTEGER DEFAULT 4,
  prize_pool TEXT,
  tags TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_publication ON events(publication_status);

-- Event Registrations (Individual attendee tracking)
CREATE TABLE IF NOT EXISTS event_registrations (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id TEXT,
  attendee_name TEXT NOT NULL,
  attendee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  registered_at TEXT NOT NULL,
  UNIQUE(event_id, attendee_email),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Event-Specific Teams (Completely isolated from Organisation Teams)
CREATE TABLE IF NOT EXISTS event_teams (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  team_name TEXT NOT NULL,
  lead_name TEXT NOT NULL,
  lead_email TEXT NOT NULL,
  project_pitch TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  UNIQUE(event_id, team_name),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Event-Specific Team Members
CREATE TABLE IF NOT EXISTS event_team_members (
  id TEXT PRIMARY KEY,
  event_team_id TEXT NOT NULL,
  user_id TEXT,
  member_name TEXT NOT NULL,
  member_email TEXT NOT NULL,
  role_in_team TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  FOREIGN KEY (event_team_id) REFERENCES event_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Posts & Announcements Table
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Announcement',
  author_id TEXT,
  publication_status TEXT NOT NULL DEFAULT 'published',
  published_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Careers & Openings Table
CREATE TABLE IF NOT EXISTS careers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  department_id TEXT,
  location TEXT DEFAULT 'Remote / Hybrid',
  job_type TEXT DEFAULT 'Collegiate / Volunteer',
  description TEXT NOT NULL,
  requirements TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  deadline TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Applications Table (Career & Roster Applications)
CREATE TABLE IF NOT EXISTS career_applications (
  id TEXT PRIMARY KEY,
  career_id TEXT,
  department_name TEXT,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  skills TEXT,
  cover_note TEXT,
  portfolio_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TEXT NOT NULL,
  FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE SET NULL
);

-- Contact Inquiries Table
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'New',
  priority TEXT NOT NULL DEFAULT 'Normal',
  admin_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_inquiries(status);

-- Notification Delivery Logs Table
CREATE TABLE IF NOT EXISTS notification_logs (
  id TEXT PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  status TEXT NOT NULL,
  provider_response TEXT,
  created_at TEXT NOT NULL
);

-- Security & Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL
);

-- Organization Settings Table
CREATE TABLE IF NOT EXISTS organization_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
