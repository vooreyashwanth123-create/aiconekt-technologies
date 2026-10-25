import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/home/HeroSection';
import { BrandShowcase } from './components/brand/BrandShowcase';
import { ProjectsSection } from './components/projects/ProjectsSection';
import { EventsSection } from './components/events/EventsSection';
import { TeamsSection } from './components/teams/TeamsSection';
import { ContactSection } from './components/contact/ContactSection';
import { Dashboard } from './components/dashboard/Dashboard';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { JoinModal } from './components/teams/JoinModal';
import { BrandLogo } from './components/brand/BrandLogo';
import { api } from './services/api';
import { useAuth } from './context/AuthContext';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Compass,
  FolderGit2,
  Calendar,
  Layers,
  Plus
} from 'lucide-react';

export const App: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [homeProjects, setHomeProjects] = useState<any[]>([]);
  const [homeEvents, setHomeEvents] = useState<any[]>([]);
  const [loadingHomeData, setLoadingHomeData] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // URL Path Synchronization
  useEffect(() => {
    const pathToTabMap: Record<string, string> = {
      '/': 'home',
      '/projects': 'projects',
      '/innovation': 'projects',
      '/events': 'events',
      '/hackathons': 'events',
      '/teams': 'teams',
      '/labs': 'teams',
      '/brand': 'brand',
      '/identity': 'brand',
      '/dashboard': 'dashboard',
      '/portal': 'dashboard',
      '/contact': 'contact',
      '/connect': 'contact',
    };

    const pathname = window.location.pathname.toLowerCase();
    if (pathToTabMap[pathname]) {
      setCurrentTab(pathToTabMap[pathname]);
    }

    const handlePopState = () => {
      const currentPath = window.location.pathname.toLowerCase();
      if (pathToTabMap[currentPath]) {
        setCurrentTab(pathToTabMap[currentPath]);
      } else {
        setCurrentTab('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    const targetPath = tab === 'home' ? '/' : `/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  // Fetch real database records for Home preview
  const fetchHomeData = async () => {
    try {
      setLoadingHomeData(true);
      const [projRes, evtRes] = await Promise.all([
        api.projects.getAll().catch(() => ({ projects: [] })),
        api.events.getAll().catch(() => ({ events: [] })),
      ]);
      setHomeProjects(projRes.projects || []);
      setHomeEvents(evtRes.events || []);
    } catch (err) {
      console.error('Failed to fetch home preview data', err);
    } finally {
      setLoadingHomeData(false);
    }
  };

  useEffect(() => {
    if (currentTab === 'home') {
      fetchHomeData();
    }
  }, [currentTab]);

  return (
    <div className="bg-[#030712] text-slate-100 min-h-screen selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Global Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenJoinModal={() => setIsJoinModalOpen(true)}
      />

      {/* Main Tab Routing */}
      <main>
        {currentTab === 'home' && (
          <>
            {/* Cinematic 3D Scroll-Controlled Hero */}
            <HeroSection
              onExploreWork={() => {
                const elem = document.getElementById('featured-work');
                if (elem) elem.scrollIntoView({ behavior: 'smooth' });
              }}
              onDiscoverIdentity={() => {
                handleSelectTab('brand');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onOpenJoinModal={() => setIsJoinModalOpen(true)}
            />

            {/* Featured Innovation Preview */}
            <section id="featured-work" className="py-20 bg-[#040816] relative border-t border-slate-900">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Selected Works</div>
                    <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mt-1">
                      Featured Engineering Initiatives
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      handleSelectTab('projects');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <span>
                      {homeProjects.length > 0
                        ? `View All ${homeProjects.length} Initiatives`
                        : 'Open Innovation Pipeline'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {homeProjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {homeProjects.slice(0, 3).map((project) => (
                      <div
                        key={project.id}
                        className="bg-slate-950/80 rounded-2xl border border-slate-800/80 p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-all shadow-lg"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-mono mb-3">
                            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                              {project.status || 'Active'}
                            </span>
                            <span className="text-slate-500">
                              Lead: {project.lead_name ? project.lead_name.split(' ')[0] : 'Team'}
                            </span>
                          </div>
                          <h3 className="font-display font-bold text-xl text-white">{project.title}</h3>
                          <p className="font-mono text-xs text-cyan-400 mt-1">{project.tagline}</p>
                          <p className="text-slate-400 text-xs mt-3 line-clamp-3 leading-relaxed">
                            {project.description}
                          </p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-850 flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {project.tags
                              ? project.tags.split(',').slice(0, 2).map((t: string) => (
                                  <span key={t} className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-slate-400">
                                    {t.trim()}
                                  </span>
                                ))
                              : (
                                  <span className="px-2 py-0.5 rounded bg-slate-900 text-[10px] font-mono text-slate-400">
                                    Engineering
                                  </span>
                                )}
                          </div>
                          <button
                            onClick={() => {
                              handleSelectTab('projects');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="text-xs font-mono text-cyan-400 hover:underline"
                          >
                            Details →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-950/60 rounded-3xl border border-slate-800/80 p-12 text-center max-w-2xl mx-auto space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-cyan-400 shadow-inner">
                      <FolderGit2 className="w-7 h-7" />
                    </div>
                    <h3 className="font-display font-bold text-xl text-white">
                      Zero Published Codebases in Active Roster
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
                      All production repositories are currently undergoing internal peer evaluation.
                      Founder and authenticated leads can submit new engineering initiatives directly through the portal.
                    </p>
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          handleSelectTab('projects');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-md shadow-cyan-500/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Submit Engineering Initiative</span>
                      </button>
                      <button
                        onClick={() => {
                          handleSelectTab('brand');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono"
                      >
                        <Compass className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Inspect 3D Brand Model</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Brand Identity Spotlight Banner */}
            <section className="py-20 bg-gradient-to-r from-slate-950 via-[#070d1e] to-slate-950 border-y border-slate-900 relative overflow-hidden">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-10">
                <div className="space-y-4 max-w-xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono">
                    <Compass className="w-3.5 h-3.5" />
                    <span>THE NEW AICONEKT BRAND IDENTITY</span>
                  </div>
                  <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
                    Engineered Geometry. Genuine 3D Presence.
                  </h2>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Explore the 6 conceptual emblem directions, inspect the 3D model in full 360-degree real-time CAD mode,
                    and download the official SVG asset suite.
                  </p>
                  <button
                    onClick={() => {
                      handleSelectTab('brand');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-md shadow-cyan-500/20"
                  >
                    <span>Launch 3D Brand Showcase</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-slate-950/80 p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center text-center">
                  <BrandLogo variant="full-artwork" size="lg" />
                </div>
              </div>
            </section>

            {/* HackNation & Events Banner */}
            <section className="py-20 bg-[#030712]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Collegiate Arenas</div>
                    <h2 className="font-display font-bold text-3xl sm:text-4xl text-white mt-1">
                      Upcoming Flagship Events
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      handleSelectTab('events');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-300"
                  >
                    <span>
                      {homeEvents.length > 0
                        ? `Manage All ${homeEvents.length} Events & Rosters`
                        : 'Explore Event Scheduling'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {homeEvents.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {homeEvents.slice(0, 2).map((evt) => (
                      <div
                        key={evt.id}
                        className="bg-slate-950 rounded-2xl border border-slate-800/90 p-8 flex flex-col justify-between space-y-6"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold">
                              {evt.category || 'Hackathon'}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              {evt.start_date || evt.date || 'TBA'}
                            </span>
                          </div>
                          <h3 className="font-display font-bold text-2xl text-white mt-4">{evt.title}</h3>
                          <p className="font-mono text-xs text-cyan-400 mt-1">{evt.tagline}</p>
                          <p className="text-slate-300 text-xs mt-3 leading-relaxed">{evt.description}</p>
                        </div>

                        <div className="pt-4 border-t border-slate-850 flex items-center justify-between">
                          <span className="text-xs font-mono text-slate-400">
                            {evt.venue || 'Virtual Arena'}
                          </span>
                          <button
                            onClick={() => {
                              handleSelectTab('events');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-cyan-300 text-xs font-mono font-semibold transition-colors"
                          >
                            Register Team →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-950/60 rounded-3xl border border-slate-800/80 p-12 text-center max-w-2xl mx-auto space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-cyan-400 shadow-inner">
                      <Calendar className="w-7 h-7" />
                    </div>
                    <h3 className="font-display font-bold text-xl text-white">
                      No Scheduled Hackathons in Calendar
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
                      All prior collegiate arenas have concluded. The next hackathon cycle is being architected.
                      Founders and authorized coordinators can schedule new events or register teams.
                    </p>
                    <div className="pt-2 flex justify-center">
                      <button
                        onClick={() => {
                          handleSelectTab('events');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:opacity-95 shadow-md shadow-cyan-500/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Schedule New Event Arena</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {currentTab === 'projects' && <ProjectsSection />}

        {currentTab === 'events' && <EventsSection />}

        {currentTab === 'teams' && <TeamsSection />}

        {currentTab === 'brand' && <BrandShowcase />}

        {currentTab === 'dashboard' && (
          <Dashboard
            onLogout={() => {
              logout();
              handleSelectTab('home');
              showToast('Signed out of organization portal.');
            }}
          />
        )}

        {currentTab === 'contact' && <ContactSection />}
      </main>

      {/* Global Footer */}
      <Footer
        onSelectTab={(tab) => {
          handleSelectTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Global Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          showToast(`Logged into organization portal.`);
          handleSelectTab('dashboard');
        }}
      />

      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onApply={(app) => {
          showToast(`Membership application recorded for ${app.name}`);
        }}
      />

      {/* Global Floating Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 border border-cyan-500/60 text-white text-xs font-mono shadow-2xl shadow-cyan-500/20 animate-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default App;
