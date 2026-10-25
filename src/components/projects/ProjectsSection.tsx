import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Code,
  ExternalLink,
  Plus,
  Filter,
  Layers,
  Sparkles,
  Zap,
  Activity,
  CheckCircle2,
  X,
  Trash2,
  FolderGit2
} from 'lucide-react';
import { GithubIcon } from '../common/SocialIcons';

export const ProjectsSection: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalProject, setActiveModalProject] = useState<any | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // New Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newTagline, setNewTagline] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState<string>('ai-ml');
  const [newTags, setNewTags] = useState('');
  const [newGithub, setNewGithub] = useState('');
  const [newDemo, setNewDemo] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await api.projects.getAll();
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const categories = [
    { id: 'all', label: 'All Innovations' },
    { id: 'ai-ml', label: 'AI & Machine Learning' },
    { id: 'fullstack', label: 'Full-Stack Systems' },
    { id: 'cloud-devops', label: 'Cloud & Infrastructure' },
    { id: 'research', label: 'Simulation & R&D' },
  ];

  const filteredProjects = selectedCategory === 'all'
    ? projects
    : projects.filter((p) => p.category === selectedCategory);

  const handleSubmitNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!newTitle.trim() || !newDescription.trim()) return;

    try {
      const payload = {
        title: newTitle.trim(),
        tagline: newTagline.trim() || null,
        description: newDescription.trim(),
        category: newCategory,
        status: 'In Progress',
        visibility: 'public',
        tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
        github_url: newGithub.trim() || null,
        demo_url: newDemo.trim() || null,
      };

      await api.projects.create(payload);
      setIsSubmitModalOpen(false);
      setNewTitle('');
      setNewTagline('');
      setNewDescription('');
      setNewTags('');
      setNewGithub('');
      setNewDemo('');
      await fetchProjects();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit project.');
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.projects.delete(id);
      await fetchProjects();
      if (activeModalProject?.id === id) setActiveModalProject(null);
    } catch (err) {
      console.error('Failed to delete project', err);
    }
  };

  const isPrivileged = user && ['Founder', 'Administrator', 'Project Lead'].includes(user.role);

  return (
    <section id="projects" className="py-24 bg-[#030712] relative min-h-screen">
      {/* Background Decor */}
      <div className="absolute top-1/3 left-0 w-80 h-80 bg-blue-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-900/10 blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono text-cyan-400">
              <Zap className="w-3.5 h-3.5" />
              <span>INNOVATION PIPELINE & CODEBASES</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-5xl text-white">
              Engineering Practical Intelligence.
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Explore open-source frameworks, systems software, and production-ready applications engineered by researchers and student innovators at AICONEKT.
            </p>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="self-start md:self-end flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold text-xs tracking-wider uppercase hover:opacity-95 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Propose Project Idea</span>
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <Filter className="w-4 h-4 text-slate-500 shrink-0 mr-1" />
          {categories.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-850 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Projects Content / Zero-Demo-Data Honest Empty State */}
        {loading ? (
          <div className="p-16 text-center text-slate-400 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block mr-2"></span>
            Querying persistent database records...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-cyan-400">
              <FolderGit2 className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-xl text-white">No projects available at the moment.</h3>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
              Our engineering roster is actively working on cutting-edge systems.
              Propose a new project initiative or authenticate as an administrator to publish research to the pipeline.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-mono transition-colors"
              >
                + Propose First Project
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group bg-slate-950/80 rounded-2xl border border-slate-800/80 hover:border-cyan-500/50 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5 backdrop-blur-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider ${
                        project.status === 'Completed' || project.status === 'Released'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : project.status === 'In Progress'
                          ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                          : 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {project.status}
                    </span>

                    {project.lead_name && (
                      <span className="text-[11px] font-mono text-slate-500">
                        Lead: {project.lead_name.split(' ')[0]}
                      </span>
                    )}
                  </div>

                  <h3 className="font-display font-bold text-xl text-white group-hover:text-cyan-300 transition-colors">
                    {project.title}
                  </h3>
                  {project.tagline && (
                    <p className="font-mono text-xs text-cyan-400/90 mt-1">{project.tagline}</p>
                  )}
                  <p className="text-slate-400 text-xs mt-3 leading-relaxed line-clamp-3">
                    {project.description}
                  </p>

                  {/* Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {project.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Links */}
                <div className="mt-6 pt-4 border-t border-slate-850 flex items-center justify-between">
                  <button
                    onClick={() => setActiveModalProject(project)}
                    className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <span>Detailed Architecture</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-3">
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="GitHub Repository"
                      >
                        <GithubIcon className="w-4 h-4" />
                      </a>
                    )}
                    {project.demo_url && (
                      <a
                        href={project.demo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                        title="Live Prototype"
                      >
                        <Activity className="w-4 h-4" />
                      </a>
                    )}
                    {isPrivileged && (
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      {activeModalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveModalProject(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-mono mb-2">
                <span>{activeModalProject.status}</span>
                <span>•</span>
                <span>Category: {activeModalProject.category.toUpperCase()}</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-white">{activeModalProject.title}</h3>
              {activeModalProject.tagline && (
                <p className="font-mono text-sm text-cyan-400 mt-1">{activeModalProject.tagline}</p>
              )}
            </div>

            <div className="space-y-3 text-slate-300 text-sm leading-relaxed">
              <h5 className="font-display font-bold text-white text-base">System Architecture Overview</h5>
              <p className="whitespace-pre-wrap">{activeModalProject.description}</p>
            </div>

            {/* Tech Stack */}
            {activeModalProject.tags && activeModalProject.tags.length > 0 && (
              <div>
                <div className="font-mono text-xs text-slate-400 mb-2">Core Technologies:</div>
                <div className="flex flex-wrap gap-2">
                  {activeModalProject.tags.map((t: string) => (
                    <span key={t} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <div>Project Lead: <strong className="text-white">{activeModalProject.lead_name || 'AICONEKT Roster'}</strong></div>
              {activeModalProject.github_url && (
                <a href={activeModalProject.github_url} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
                  Visit Repository →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Propose New Project Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="font-display font-bold text-2xl text-white">Propose Project Initiative</h3>
              <p className="text-slate-400 text-xs mt-1">Submit your engineering proposal directly to the persistent database pipeline.</p>
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmitNewProject} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Key-Value Core"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. High-throughput distributed state machine"
                  value={newTagline}
                  onChange={(e) => setNewTagline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Domain Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="ai-ml">AI & ML</option>
                    <option value="fullstack">Full-Stack Systems</option>
                    <option value="cloud-devops">Cloud & DevOps</option>
                    <option value="research">Simulation & R&D</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">GitHub URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://github.com/..."
                    value={newGithub}
                    onChange={(e) => setNewGithub(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Architecture Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the technical architecture, problem statement, and planned milestones..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  placeholder="Rust, WebAssembly, gRPC, React"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider hover:opacity-95 shadow-md shadow-cyan-500/20"
                >
                  Save to Pipeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
