import { useEffect, useState } from 'react';
import api from '../api';

function ManageExperts() {
  const [experts, setExperts] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [form, setForm] = useState({ name: '', email: '' });
  const [inviteForm, setInviteForm] = useState({ surveyId: '', selectedExperts: [] });
  const [showInvite, setShowInvite] = useState(false);
  const [inviteResults, setInviteResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchExperts();
    api.get('/surveys').then(r => setSurveys(r.data.filter(s => s.status !== 'closed')));
  }, []);

  const fetchExperts = async () => {
    try {
      const { data } = await api.get('/experts');
      setExperts(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/experts', form);
      setForm({ name: '', email: '' });
      fetchExperts();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleBulk = async () => {
    try {
      const lines = form.bulkText?.trim().split('\n') || [];
      const rows = lines.map(line => {
        const [name, email] = line.split(',').map(s => s.trim());
        return { name, email };
      });
      await api.post('/experts/bulk', rows);
      setForm({ name: '', email: '' });
      fetchExperts();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this expert?')) return;
    await api.delete(`/experts/${id}`);
    fetchExperts();
  };

  const toggleExpert = (id) => {
    setInviteForm(prev => ({
      ...prev,
      selectedExperts: prev.selectedExperts.includes(id) ? prev.selectedExperts.filter(x => x !== id) : [...prev.selectedExperts, id],
    }));
  };

  const selectAll = () => {
    setInviteForm(prev => ({ ...prev, selectedExperts: experts.map(e => e.id) }));
  };

  const clearAll = () => {
    setInviteForm(prev => ({ ...prev, selectedExperts: [] }));
  };

  const sendInvites = async () => {
    if (!inviteForm.surveyId || inviteForm.selectedExperts.length === 0) {
      alert('Select a survey and at least one expert');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/experts/invite', { surveyId: inviteForm.surveyId, expertIds: inviteForm.selectedExperts });
      setInviteResults(data);
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="animate-fade-in space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-[var(--st-text)] tracking-tight">Expert Registry</h1>
          <p className="text-sm font-bold text-[var(--st-text-variant)] uppercase tracking-[0.2em] opacity-60">Directory & Invitation Management</p>
        </div>
      </div>

      <div className="tonal-card p-10">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Expert Name</label>
            <input placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
              className="w-full px-6 py-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[var(--st-text)] focus:ring-4 focus:ring-[var(--st-primary)]/5 focus:border-[var(--st-primary)] outline-none transition-all font-bold placeholder-zinc-300" />
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Digital Identity (Email)</label>
            <input placeholder="email@institution.edu" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required
              className="w-full px-6 py-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[var(--st-text)] focus:ring-4 focus:ring-[var(--st-primary)]/5 focus:border-[var(--st-primary)] outline-none transition-all font-bold placeholder-zinc-300" />
          </div>
          <div className="flex items-end pb-1">
            <button type="submit" disabled={submitting}
              className="px-10 py-4 primary-gradient text-white text-sm font-black rounded-2xl shadow-xl shadow-violet-500/20 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-60 whitespace-nowrap">
              Register Expert
            </button>
          </div>
        </form>
      </div>

      <div className="tonal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-[var(--st-surface-low)] dark:bg-zinc-800">
                <th className="text-left px-10 py-6 text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Expert Profile</th>
                <th className="text-left px-10 py-6 text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Email Address</th>
                <th className="text-right px-10 py-6 text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Remove</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-10 py-7"><div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                    <td className="px-10 py-7"><div className="h-4 w-40 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                    <td className="px-10 py-7"><div className="h-4 w-16 ml-auto bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  </tr>
                ))
              ) : experts.length === 0 ? (
                <tr><td colSpan={3} className="px-10 py-20 text-center">
                  <div className="w-20 h-20 rounded-[32px] prim-tonal-bg text-[var(--st-primary)] flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                  </div>
                  <p className="text-lg font-black text-[var(--st-text)]">Registry Empty</p>
                  <p className="text-sm font-bold text-[var(--st-text-variant)] opacity-60">Register experts to initiate survey invitations</p>
                </td></tr>
              ) : experts.map(e => (
                <tr key={e.id} className="tonal-row group">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl primary-gradient flex items-center justify-center text-white text-base font-black shadow-lg shadow-violet-500/20 shrink-0">
                        {e.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-base font-black text-[var(--st-text)] group-hover:text-[var(--st-primary)] transition-colors tracking-tight">{e.name}</p>
                    </div>
                  </td>
                  <td className="px-10 py-7 text-sm font-bold text-[var(--st-text-variant)] opacity-60 font-mono">{e.email}</td>
                  <td className="px-10 py-7">
                    <div className="flex items-center justify-end">
                      <button onClick={() => handleDelete(e.id)}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 text-zinc-400 hover:text-red-500 hover:shadow-lg transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {experts.length > 0 && (
        <div className="tonal-card overflow-hidden">
          <button onClick={() => setShowInvite(!showInvite)}
            className="w-full flex items-center justify-between px-10 py-8 hover:bg-[var(--st-surface-low)] dark:hover:bg-zinc-800/30 transition-colors">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-[24px] prim-tonal-bg text-[var(--st-primary)] flex items-center justify-center shrink-0 shadow-inner">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-xl font-black text-[var(--st-text)]">Survey Invitation Studio</p>
                <p className="text-sm font-bold text-[var(--st-text-variant)] uppercase tracking-[0.2em] opacity-60">Initiate bulk distribution to registered experts</p>
              </div>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-800 transition-all duration-300 ${showInvite ? 'rotate-180 bg-zinc-50 dark:bg-zinc-800' : ''}`}>
              <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </button>

          {showInvite && (
            <div className="px-10 pb-10 border-t border-zinc-50 dark:border-zinc-800 animate-fade-in">
              <div className="pt-8 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Target Assessment Project</label>
                  <select value={inviteForm.surveyId} onChange={e => setInviteForm({...inviteForm, surveyId: e.target.value})}
                    className="w-full px-6 py-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-[var(--st-surface-low)] text-[var(--st-text)] focus:ring-4 focus:ring-[var(--st-primary)]/5 focus:border-[var(--st-primary)] outline-none transition-all font-black text-sm appearance-none">
                    <option value="">Choose an active survey...</option>
                    {surveys.map(s => <option key={s.id} value={s.id}>{s.name} — Status: {s.status.toUpperCase()}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                      Selection Matrix <span className="text-zinc-300 ml-2">({inviteForm.selectedExperts.length} Curated)</span>
                    </label>
                    <div className="flex items-center gap-6">
                      <button onClick={selectAll} className="text-xs font-black text-[var(--st-primary)] uppercase tracking-wider hover:opacity-70 transition-opacity">Select Registry</button>
                      <button onClick={clearAll} className="text-xs font-black text-zinc-300 uppercase tracking-wider hover:text-red-400 transition-colors">Reset</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {experts.map(e => (
                      <label key={e.id} className={`flex items-center gap-4 px-6 py-5 cursor-pointer rounded-2xl border transition-all duration-300 ${
                        inviteForm.selectedExperts.includes(e.id) 
                          ? 'border-[var(--st-primary)] bg-[var(--st-surface-low)] shadow-lg shadow-violet-500/5' 
                          : 'border-zinc-50 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                      }`}>
                        <div className="relative">
                          <input type="checkbox" checked={inviteForm.selectedExperts.includes(e.id)} onChange={() => toggleExpert(e.id)}
                            className="peer sr-only" />
                          <div className="w-6 h-6 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 peer-checked:bg-[var(--st-primary)] peer-checked:border-[var(--st-primary)] transition-all flex items-center justify-center">
                            <svg className={`w-3.5 h-3.5 text-white transition-opacity ${inviteForm.selectedExperts.includes(e.id) ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-[var(--st-text)] truncate">{e.name}</p>
                          <p className="text-xs font-bold text-[var(--st-text-variant)] opacity-60 truncate">{e.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button onClick={sendInvites} disabled={submitting || !inviteForm.surveyId || inviteForm.selectedExperts.length === 0}
                    className="w-full py-6 primary-gradient text-white text-sm font-black rounded-2xl shadow-xl shadow-violet-500/20 hover:scale-[1.01] transition-all active:scale-[0.99] disabled:opacity-40 disabled:scale-100">
                    {submitting ? (
                      <span className="flex items-center justify-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Broadcasting Invites...
                      </span>
                    ) : `Dispatch Invitations to ${inviteForm.selectedExperts.length} Recipients`}
                  </button>
                </div>

                {inviteResults && (
                  <div className="bg-[var(--st-surface-low)] dark:bg-zinc-800/30 rounded-[32px] p-10 space-y-6 animate-scale-in border border-zinc-50 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-black text-[var(--st-text)]">Broadcast Ledger</h3>
                      <span className="px-4 py-1.5 rounded-full bg-white dark:bg-zinc-900 text-[10px] font-black text-[var(--st-primary)] uppercase tracking-widest shadow-sm">
                        {inviteResults.results.length} Dispatched
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {inviteResults.results.map((r, i) => (
                        <div key={i} className="flex flex-col gap-4 p-6 rounded-[24px] bg-white dark:bg-zinc-900 shadow-sm border border-zinc-50 dark:border-zinc-800 group hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-3 h-3 rounded-full ${r.status === 'sent' || r.status === 'link_generated' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-red-500'}`} />
                              <span className="text-base font-black text-[var(--st-text)] tracking-tight">{r.expertName || 'Expert Profile'}</span>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${
                              r.status === 'sent' || r.status === 'link_generated' 
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                            }`}>
                              {r.status === 'sent' ? 'Email Dispatched' : r.status === 'link_generated' ? 'Direct Link Ready' : 'Transmission Fault'}
                            </span>
                          </div>
                          {r.url && (
                            <div className="flex items-center gap-3">
                              <div className="flex-1 px-5 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-[11px] font-bold text-zinc-400 font-mono truncate border border-zinc-100 dark:border-zinc-800">
                                {r.url}
                              </div>
                              <button onClick={() => {
                                navigator.clipboard.writeText(r.url);
                                const btn = document.getElementById(`copy-btn-${i}`);
                                if (btn) {
                                  const originalText = btn.innerHTML;
                                  btn.innerHTML = 'COPIED';
                                  setTimeout(() => { btn.innerHTML = originalText; }, 2000);
                                }
                              }} id={`copy-btn-${i}`} className="px-6 py-3 text-[10px] font-black bg-[var(--st-primary)] text-white rounded-xl hover:opacity-80 transition-all shadow-lg shadow-violet-500/20 active:scale-95 uppercase tracking-widest">
                                Copy
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ManageExperts;
