import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../brand/BrandLogo';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Inbox,
  FolderGit2,
  CheckCircle2,
  Shield,
  LogOut,
  Mail,
  UserCheck,
  Search,
  Check,
  Trash2,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface DashboardProps {
  onLogout: () => void;
  onOpenCreateProject?: () => void;
  onOpenCreateEvent?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'projects' | 'inbox' | 'applications'>('overview');
  const [stats, setStats] = useState<any | null>(null);
  const [inbox, setInbox] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [inboxFilter, setInboxFilter] = useState<'all' | 'unread'>('all');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, inqRes, projRes, evtRes, appRes] = await Promise.all([
        api.dashboard.getStats(),
        api.contact.getInquiries(),
        api.projects.getAll(),
        api.events.getAll(),
        api.careers.getApplications(),
      ]);

      setStats(statsRes);
      setInbox(inqRes.inquiries || []);
      setProjects(projRes.projects || []);
      setEvents(evtRes.events || []);
      setApplications(appRes.applications || []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateInquiryStatus = async (id: string, newStatus: string) => {
    try {
      await api.contact.updateInquiry(id, { status: newStatus });
      await fetchDashboardData();
      if (selectedMessage?.id === id) {
        setSelectedMessage({ ...selectedMessage, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update inquiry status', err);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
    try {
      await api.contact.deleteInquiry(id);
      setSelectedMessage(null);
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to delete inquiry', err);
    }
  };

  const metrics = stats?.metrics || {
    total_members: 0,
    total_projects: 0,
    total_events: 0,
    total_event_registrations: 0,
    total_event_teams: 0,
    total_inquiries: 0,
    unread_inquiries: 0,
    total_applications: 0,
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col pt-20">
      {/* Dashboard Top Banner */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandLogo variant="emblem-only" size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-lg text-white">AICONEKT Organization Portal</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Production v2.4
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Zero-Demo-Data Active
                </span>
              </div>
              <p className="font-mono text-xs text-slate-400">
                Authenticated as <strong className="text-white">{user?.full_name || 'Administrator'}</strong> • Role: <strong className="text-cyan-300">{user?.role || 'Founder'}</strong>
              </p>
            </div>
          </div>

          {/* User Status & Sign Out */}
          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 text-xs font-mono transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Exit Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col md:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          {[
            { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
            { id: 'events', label: 'Event Teams & Rosters', icon: Trophy, badge: metrics.total_event_teams },
            { id: 'projects', label: 'Project Pipeline', icon: FolderGit2, badge: metrics.total_projects },
            { id: 'inbox', label: 'Inbound Inbox', icon: Inbox, badge: metrics.unread_inquiries > 0 ? metrics.unread_inquiries : undefined, badgeColor: 'bg-cyan-500 text-slate-950 font-bold' },
            { id: 'applications', label: 'Roster Applications', icon: Users, badge: metrics.total_applications },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-mono transition-all ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Content Panel */}
        <div className="flex-1 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
          {loading ? (
            <div className="p-16 text-center text-slate-400 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block mr-2"></span>
              Synchronizing verified database telemetry...
            </div>
          ) : (
            <>
              {/* TAB 1: EXECUTIVE OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div>
                    <h2 className="font-display font-bold text-2xl text-white">Executive Innovation Dashboard</h2>
                    <p className="text-slate-400 text-xs mt-1">Live operational telemetry calculated from persistent database tables.</p>
                  </div>

                  {/* Real Metric Cards (Zero-Demo-Data Policy) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                        <span>Active Projects</span>
                        <FolderGit2 className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="font-display font-bold text-3xl text-white mt-2">{metrics.total_projects}</div>
                      <div className="text-[10px] font-mono text-cyan-400 mt-1">Persistent DB Records</div>
                    </div>

                    <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                        <span>Published Events</span>
                        <Trophy className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="font-display font-bold text-3xl text-white mt-2">{metrics.total_events}</div>
                      <div className="text-[10px] font-mono text-blue-400 mt-1">{metrics.total_event_teams} Registered Teams</div>
                    </div>

                    <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                        <span>Roster Applications</span>
                        <Users className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="font-display font-bold text-3xl text-white mt-2">{metrics.total_applications}</div>
                      <div className="text-[10px] font-mono text-violet-400 mt-1">Recruitment Queue</div>
                    </div>

                    <div className="bg-slate-900/60 p-5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                        <span>Inbound Inquiries</span>
                        <Mail className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="font-display font-bold text-3xl text-white mt-2">{metrics.total_inquiries}</div>
                      <div className="text-[10px] font-mono text-emerald-400 mt-1">{metrics.unread_inquiries} Unread Inquiries</div>
                    </div>
                  </div>

                  {/* System & Notification Engine Telemetry */}
                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-850 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span>Database: SQLite 3 Persistent WAL Mode (Zero-Demo-Data Compliant)</span>
                    </div>
                    <div>
                      <span>SMTP Relay: </span>
                      <strong className={stats?.system_status?.smtp_configured ? 'text-emerald-400' : 'text-amber-400'}>
                        {stats?.system_status?.smtp_configured ? 'Configured & Active' : 'Pending .env Credentials (Inquiries safely saved in DB)'}
                      </strong>
                    </div>
                  </div>

                  {/* Recent Genuine Audit Log Activity */}
                  <div className="space-y-4 pt-4 border-t border-slate-850">
                    <h3 className="font-display font-bold text-lg text-white">Audit Log & System Activity</h3>

                    {stats?.recent_activity?.length === 0 ? (
                      <div className="p-6 text-center text-xs font-mono text-slate-500 bg-slate-900/40 rounded-xl border border-slate-850">
                        No administrative actions recorded yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {stats?.recent_activity?.map((act: any) => (
                          <div key={act.id} className="bg-slate-900/50 p-3 rounded-xl border border-slate-850 flex items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                              <strong className="text-white">{act.action}</strong>
                              <span className="text-slate-400">on {act.entity_type}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">{act.created_at}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: EVENTS & ROSTERS */}
              {activeTab === 'events' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display font-bold text-2xl text-white">Event Teams & Roster Directory</h2>
                    <p className="text-slate-400 text-xs mt-1">Review event-specific teams registered for hackathons.</p>
                  </div>

                  {events.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs font-mono bg-slate-900/40 rounded-2xl border border-slate-850">
                      No events registered in database.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {events.map((evt) => (
                        <div key={evt.id} className="bg-slate-900/50 p-5 rounded-xl border border-slate-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-display font-bold text-base text-white">{evt.title}</h4>
                            <span className="text-xs font-mono text-cyan-400">{evt.registered_teams_count || 0} Registered Teams</span>
                          </div>
                          <p className="text-xs text-slate-400 font-mono">{evt.venue} • {evt.start_date}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PROJECT PIPELINE */}
              {activeTab === 'projects' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display font-bold text-2xl text-white">Project Pipeline</h2>
                    <p className="text-slate-400 text-xs mt-1">All verified engineering initiatives in the database.</p>
                  </div>

                  {projects.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs font-mono bg-slate-900/40 rounded-2xl border border-slate-850">
                      No projects currently registered in the database.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {projects.map((p) => (
                        <div key={p.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-display font-bold text-base text-white">{p.title}</h4>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                                {p.status}
                              </span>
                            </div>
                            {p.tagline && <p className="text-xs text-slate-400 font-mono mt-0.5">{p.tagline}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: INBOUND INBOX */}
              {activeTab === 'inbox' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display font-bold text-2xl text-white">Inbound Inquiries</h2>
                      <p className="text-slate-400 text-xs mt-1">Transmissions from research partners, prospective members, and sponsors.</p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                      <button
                        onClick={() => setInboxFilter('all')}
                        className={`px-3 py-1 rounded-md ${inboxFilter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                      >
                        All ({inbox.length})
                      </button>
                      <button
                        onClick={() => setInboxFilter('unread')}
                        className={`px-3 py-1 rounded-md ${inboxFilter === 'unread' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                      >
                        Unread ({metrics.unread_inquiries})
                      </button>
                    </div>
                  </div>

                  {inbox.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs font-mono bg-slate-900/40 rounded-2xl border border-slate-850">
                      No contact inquiries received yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inbox
                        .filter((m) => (inboxFilter === 'unread' ? m.status === 'New' : true))
                        .map((msg) => (
                          <div
                            key={msg.id}
                            onClick={() => setSelectedMessage(msg)}
                            className={`cursor-pointer p-4 rounded-xl border transition-all ${
                              msg.status === 'New'
                                ? 'bg-slate-900/90 border-cyan-500/50 shadow-sm'
                                : 'bg-slate-950/60 border-slate-850 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {msg.status === 'New' && <span className="w-2 h-2 rounded-full bg-cyan-400"></span>}
                                <span className="font-display font-bold text-sm text-white">{msg.name}</span>
                                <span className="text-slate-500 text-xs font-mono">&lt;{msg.email}&gt;</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500">{msg.created_at}</span>
                            </div>

                            <div className="font-medium text-xs text-cyan-300 mt-1">{msg.subject}</div>
                            <p className="text-slate-400 text-xs mt-1 line-clamp-1">{msg.message}</p>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Message Detail Modal */}
                  {selectedMessage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 relative shadow-2xl">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                              {selectedMessage.category}
                            </span>
                            <h3 className="font-display font-bold text-xl text-white mt-2">{selectedMessage.subject}</h3>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                              From: {selectedMessage.name} ({selectedMessage.email}) • {selectedMessage.created_at}
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedMessage(null)}
                            className="text-slate-400 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {selectedMessage.message}
                        </div>

                        {/* Status Controls */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
                          <span className="text-slate-400">Status:</span>
                          {['New', 'Read', 'In Progress', 'Responded', 'Closed'].map((s) => (
                            <button
                              key={s}
                              onClick={() => handleUpdateInquiryStatus(selectedMessage.id, s)}
                              className={`px-2.5 py-1 rounded-lg ${
                                selectedMessage.status === s ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <button
                            onClick={() => handleDeleteInquiry(selectedMessage.id)}
                            className="flex items-center gap-1.5 text-xs font-mono text-rose-400 hover:text-rose-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Inquiry</span>
                          </button>

                          <a
                            href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                            className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider"
                          >
                            Reply via Email
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: ROSTER APPLICATIONS */}
              {activeTab === 'applications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-display font-bold text-2xl text-white">Roster Applications</h2>
                    <p className="text-slate-400 text-xs mt-1">Student applications recorded from the website join modal.</p>
                  </div>

                  {applications.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs font-mono bg-slate-900/40 rounded-2xl border border-slate-850">
                      No membership applications recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {applications.map((app) => (
                        <div key={app.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-display font-bold text-white text-base">{app.applicant_name}</div>
                            <span className="text-xs font-mono text-cyan-400">{app.department_name}</span>
                          </div>
                          <div className="text-xs font-mono text-slate-400">{app.applicant_email}</div>
                          {app.skills && <div className="text-xs text-slate-300">Skills: {app.skills}</div>}
                          {app.cover_note && <p className="text-xs text-slate-400 italic bg-slate-950 p-2 rounded">"{app.cover_note}"</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
