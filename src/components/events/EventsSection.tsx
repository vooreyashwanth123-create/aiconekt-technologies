import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Trophy,
  Plus,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  X,
  UserPlus,
  Trash2,
  AlertCircle
} from 'lucide-react';

export const EventsSection: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedEventForTeam, setSelectedEventForTeam] = useState<any | null>(null);
  const [selectedEventForReg, setSelectedEventForReg] = useState<any | null>(null);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [viewTeamsForEvent, setViewTeamsForEvent] = useState<any | null>(null);

  // New Event Form
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('Hackathon');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [prizePool, setPrizePool] = useState('');
  const [tags, setTags] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Team Registration Form
  const [teamName, setTeamName] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [member2Name, setMember2Name] = useState('');
  const [member2Role, setMember2Role] = useState('Developer');
  const [member3Name, setMember3Name] = useState('');
  const [member3Role, setMember3Role] = useState('Designer');
  const [projectPitch, setProjectPitch] = useState('');
  const [teamRegError, setTeamRegError] = useState<string | null>(null);

  // Individual Attendee Registration Form
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.events.getAll();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = activeTab === 'all'
    ? events
    : events.filter((e) => e.category === activeTab);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!title.trim() || !venue.trim() || !startDate.trim()) return;

    try {
      await api.events.create({
        title: title.trim(),
        category,
        tagline: tagline.trim() || null,
        description: description.trim(),
        start_date: startDate.trim(),
        end_date: endDate.trim() || null,
        venue: venue.trim(),
        capacity: Number(capacity) || 100,
        prize_pool: prizePool.trim() || null,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        status: 'Registration Open',
        publication_status: 'published',
      });

      setIsCreateEventModalOpen(false);
      setTitle('');
      setTagline('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setVenue('');
      setPrizePool('');
      setTags('');
      await fetchEvents();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create event.');
    }
  };

  const handleRegisterTeamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeamRegError(null);

    if (!selectedEventForTeam || !teamName.trim() || !leadName.trim() || !leadEmail.trim()) return;

    const members: any[] = [];
    if (member2Name.trim()) {
      members.push({ name: member2Name.trim(), email: `${member2Name.toLowerCase().replace(/\s+/g, '.')}@campus.edu`, role: member2Role });
    }
    if (member3Name.trim()) {
      members.push({ name: member3Name.trim(), email: `${member3Name.toLowerCase().replace(/\s+/g, '.')}@campus.edu`, role: member3Role });
    }

    try {
      await api.events.createEventTeam(selectedEventForTeam.id, {
        team_name: teamName.trim(),
        lead_name: leadName.trim(),
        lead_email: leadEmail.trim(),
        project_pitch: projectPitch.trim() || null,
        members,
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00F2FE', '#2563EB', '#8B5CF6'],
      });

      setSelectedEventForTeam(null);
      setTeamName('');
      setLeadName('');
      setLeadEmail('');
      setMember2Name('');
      setMember3Name('');
      setProjectPitch('');
      await fetchEvents();
    } catch (err: any) {
      setTeamRegError(err.message || 'Failed to register team.');
    }
  };

  const handleRegisterAttendeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!selectedEventForReg || !attendeeName.trim() || !attendeeEmail.trim()) return;

    try {
      const res = await api.events.registerAttendee(selectedEventForReg.id, {
        attendee_name: attendeeName.trim(),
        attendee_email: attendeeEmail.trim(),
      });

      setRegSuccess(res.message);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#00F2FE', '#38BDF8'],
      });

      setTimeout(() => {
        setSelectedEventForReg(null);
        setAttendeeName('');
        setAttendeeEmail('');
        setRegSuccess(null);
        fetchEvents();
      }, 2000);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await api.events.delete(id);
      await fetchEvents();
    } catch (err) {
      console.error('Failed to delete event', err);
    }
  };

  const isPrivileged = user && ['Founder', 'Administrator', 'Event Lead'].includes(user.role);

  return (
    <section id="events" className="py-24 bg-[#030712] relative min-h-screen">
      {/* Glow Backdrop */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-violet-900/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-cyan-900/10 blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono text-cyan-400">
              <Trophy className="w-3.5 h-3.5" />
              <span>COLLEGIATE HACKATHONS & SYMPOSIUMS</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl text-white">
              Events & Competitive Arenas
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Participate in 36-hour hackathons, deep dive into GPU transformer bootcamps, or create and register your team for upcoming engineering challenges.
            </p>
          </div>

          <button
            onClick={() => setIsCreateEventModalOpen(true)}
            className="self-start md:self-end flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold text-xs tracking-wider uppercase hover:opacity-95 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Host / Create Event</span>
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2">
          {['all', 'Hackathon', 'Workshop', 'Tech Summit'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                activeTab === tab
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab === 'all' ? 'All Events' : tab}
            </button>
          ))}
        </div>

        {/* Events Content / Zero-Demo-Data Honest Empty State */}
        {loading ? (
          <div className="p-16 text-center text-slate-400 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block mr-2"></span>
            Loading authorized event records...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-cyan-400">
              <Trophy className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-xl text-white">No events have been published yet.</h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
              Our hackathon command center is actively organizing upcoming collegiate engineering arenas, bootcamps, and technical symposiums.
              Check back soon or authenticate to schedule an event.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsCreateEventModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-mono transition-colors"
              >
                + Schedule First Event
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-slate-950/80 rounded-2xl border border-slate-800/80 hover:border-cyan-500/40 overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-xl backdrop-blur-sm"
              >
                {/* Header Banner */}
                <div className={`p-6 bg-gradient-to-br ${evt.banner_gradient || 'from-cyan-900/60 via-blue-900/40 to-slate-950'} border-b border-slate-800 relative`}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-slate-700 text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                      {evt.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>{evt.status}</span>
                      </span>
                      {isPrivileged && (
                        <button
                          onClick={() => handleDeleteEvent(evt.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-xl sm:text-2xl text-white mt-3">
                    {evt.title}
                  </h3>
                  {evt.tagline && (
                    <p className="text-cyan-200/90 font-mono text-xs mt-1">{evt.tagline}</p>
                  )}
                </div>

                {/* Body Details */}
                <div className="p-6 space-y-4 flex-1">
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                    {evt.description}
                  </p>

                  <div className="space-y-2 text-xs font-mono text-slate-300 pt-2 border-t border-slate-850">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{evt.start_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-violet-400 shrink-0" />
                      <span className="truncate">{evt.venue}</span>
                    </div>
                    {evt.prize_pool && (
                      <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Prize Pool: {evt.prize_pool}</span>
                      </div>
                    )}
                  </div>

                  {/* Registered Stats */}
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2 text-slate-400">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span>Registered Teams:</span>
                    </div>
                    <span className="text-cyan-300 font-bold">{evt.registered_teams_count || 0} Teams</span>
                  </div>

                  {/* Tags */}
                  {evt.tags && evt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {evt.tags.map((t: string) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 pt-0 border-t border-slate-850/50 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedEventForTeam(evt)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-md shadow-cyan-500/20 transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create Team</span>
                    </button>
                    <button
                      onClick={() => setSelectedEventForReg(evt)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-xs uppercase tracking-wider transition-all"
                    >
                      <span>Join Solo</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Register Team Modal */}
      {selectedEventForTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedEventForTeam(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="font-mono text-xs text-cyan-400">EVENT-SPECIFIC ROSTER REGISTRATION</div>
              <h3 className="font-display font-bold text-2xl text-white mt-1">
                Register Team for {selectedEventForTeam.title}
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Isolated event team membership. Max size: {selectedEventForTeam.max_team_size || 4} members.
              </p>
            </div>

            {teamRegError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {teamRegError}
              </div>
            )}

            <form onSubmit={handleRegisterTeamSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neural Apex"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Team Lead Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Lead Full Name"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Lead Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="lead@campus.edu"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="font-mono text-xs text-slate-400">Team Members:</div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Member 2 Name"
                    value={member2Name}
                    onChange={(e) => setMember2Name(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                  <select
                    value={member2Role}
                    onChange={(e) => setMember2Role(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Developer">Developer</option>
                    <option value="Designer">Designer</option>
                    <option value="ML Specialist">ML Specialist</option>
                    <option value="Operations">Operations</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Project Solution Pitch</label>
                <textarea
                  rows={2}
                  placeholder="What are you aiming to engineer during this hackathon?"
                  value={projectPitch}
                  onChange={(e) => setProjectPitch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedEventForTeam(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider hover:opacity-95 shadow-md shadow-cyan-500/20"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Solo Attendee Registration Modal */}
      {selectedEventForReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedEventForReg(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="font-mono text-xs text-cyan-400">INDIVIDUAL REGISTRATION</div>
              <h3 className="font-display font-bold text-2xl text-white mt-1">
                Attend {selectedEventForReg.title}
              </h3>
            </div>

            {regError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {regError}
              </div>
            )}

            {regSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white text-base">{regSuccess}</h4>
              </div>
            ) : (
              <form onSubmit={handleRegisterAttendeeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={attendeeName}
                    onChange={(e) => setAttendeeName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="you@campus.edu"
                    value={attendeeEmail}
                    onChange={(e) => setAttendeeEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEventForReg(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider hover:opacity-95 shadow-md shadow-cyan-500/20"
                  >
                    Confirm Attendance
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Host / Create Event Modal */}
      {isCreateEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsCreateEventModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="font-display font-bold text-2xl text-white">Create / Host Technology Event</h3>
              <p className="text-slate-400 text-xs mt-1">Add a new hackathon or technical workshop directly to the persistent database.</p>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AICONEKT HackNation 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Hackathon">Hackathon</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Tech Summit">Tech Summit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Start Date *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nov 14–16, 2026"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Venue / Platform *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Auditorium Complex & Discord"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Event overview, tracks, eligibility criteria, and objectives..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Prize Pool (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹1,50,000 + Incubation"
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Tags</label>
                  <input
                    type="text"
                    placeholder="AI, Systems, Cloud"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateEventModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider hover:opacity-95 shadow-md shadow-cyan-500/20"
                >
                  Publish Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
