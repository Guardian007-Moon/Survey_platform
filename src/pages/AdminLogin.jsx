import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/admin/login', { email, password });
      localStorage.setItem('adminToken', data.token);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-zinc-950 font-inter">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex primary-gradient items-center justify-center p-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute w-[500px] h-[500px] bg-white/30 rounded-full blur-[120px] -top-48 -left-48 animate-pulse" />
          <div className="absolute w-[400px] h-[400px] bg-indigo-400/30 rounded-full blur-[100px] bottom-10 right-10" />
        </div>
        
        <div className="relative z-10 space-y-10 max-w-lg">
          <div className="w-24 h-24 rounded-[32px] bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center shadow-2xl">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </svg>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-white tracking-tighter leading-tight">The Digital<br />Curator</h1>
            <p className="text-xl font-medium text-white/70 leading-relaxed">
              Orchestrate your curriculum assessment workflow with our high-fidelity survey & mapping suite.
            </p>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[var(--st-primary)] bg-white/20 backdrop-blur-md" />
              ))}
            </div>
            <p className="text-xs font-black text-white uppercase tracking-widest opacity-60">Trusted by Experts</p>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex items-center justify-center p-8 lg:p-20 bg-[var(--st-surface-low)]">
        <div className="w-full max-w-md space-y-12 animate-fade-in">
          <div className="space-y-2">
            <div className="lg:hidden w-12 h-12 rounded-2xl primary-gradient flex items-center justify-center mb-6 shadow-xl shadow-violet-500/20">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25" />
              </svg>
            </div>
            <h2 className="text-4xl font-black text-[var(--st-text)] tracking-tight">Portal Entry</h2>
            <p className="text-sm font-bold text-[var(--st-text-variant)] uppercase tracking-[0.2em] opacity-40">Authorize Administrative Credentials</p>
          </div>

          <div className="tonal-card p-10 space-y-8 shadow-2xl shadow-violet-500/5 border-transparent">
            {error && (
              <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center gap-4 animate-scale-in">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <p className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-widest">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Identity Vector (Email)</label>
                <div className="relative group">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full px-8 py-5 rounded-[24px] border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[var(--st-text)] focus:ring-4 focus:ring-[var(--st-primary)]/5 focus:border-[var(--st-primary)] outline-none transition-all font-black text-sm placeholder-zinc-200"
                    placeholder="admin@curator.ai"
                  />
                  <div className="absolute inset-x-4 -bottom-px h-px bg-gradient-to-r from-transparent via-[var(--st-primary)]/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Access Protocol (Password)</label>
                <div className="relative group">
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full px-8 py-5 rounded-[24px] border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[var(--st-text)] focus:ring-4 focus:ring-[var(--st-primary)]/5 focus:border-[var(--st-primary)] outline-none transition-all font-black text-sm placeholder-zinc-200"
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-x-4 -bottom-px h-px bg-gradient-to-r from-transparent via-[var(--st-primary)]/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-6 primary-gradient text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-[24px] shadow-2xl shadow-violet-500/20 hover:scale-[1.02] transition-all duration-300 active:scale-[0.98] disabled:opacity-40"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    Authorizing...
                  </span>
                ) : 'Establish Connection'}
              </button>
            </form>
          </div>

          <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-loose">
            High-Fidelity Curriculum Intelligence System<br />
            © 2026 The Digital Curator  •  Secure Multi-Factor V3
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
