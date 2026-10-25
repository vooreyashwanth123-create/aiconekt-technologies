import React, { useState } from 'react';
import { BrandLogo } from '../brand/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, User, Key, X, Sparkles, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, demoLogin, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login({ email, password });
      } else {
        await register({ email, password, full_name: fullName });
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async (role: 'Administrator' | 'Team Member') => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(role);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize demo session.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-8 relative shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-slate-850 rounded-full"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Brand Lockup */}
        <div className="flex flex-col items-center text-center space-y-2">
          <BrandLogo variant="vertical" size="sm" showTagline={false} />
          <h3 className="font-display font-bold text-xl text-white pt-2">Organization Access Portal</h3>
          <p className="text-slate-400 text-xs">
            Authenticate to manage projects, hackathon teams, and departmental rosters.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              mode === 'login' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              mode === 'register' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register Account
          </button>
        </div>

        {/* Interactive Demo Access (Preserves demo functionality without embedded credentials) */}
        {mode === 'login' && (
          <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                Instant Interactive Demo:
              </label>
              <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Secure Guest Access
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoAccess('Administrator')}
                className="p-2 rounded-xl text-left border transition-all bg-slate-900 border-slate-800 text-slate-300 hover:border-cyan-500/60 hover:text-white"
              >
                <div className="font-bold text-xs truncate">Admin Demo</div>
                <div className="text-[10px] font-mono text-cyan-400">Full Dashboard Access</div>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoAccess('Team Member')}
                className="p-2 rounded-xl text-left border transition-all bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-500/60 hover:text-white"
              >
                <div className="font-bold text-xs truncate">Member Demo</div>
                <div className="text-[10px] font-mono text-blue-400">Team Member Access</div>
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Account Email *</label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@aiconekt.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Password *</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <Key className="w-4 h-4 text-slate-500 absolute right-3.5 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider hover:opacity-95 shadow-md shadow-cyan-500/20 transition-all mt-2 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{loading ? 'Authenticating...' : mode === 'login' ? 'Authenticate Into Portal' : 'Create Account'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
