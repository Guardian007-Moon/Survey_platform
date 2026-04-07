import { useEffect, useState } from 'react';
import api from '../api';

function CreateSurvey() {
  const [surveys, setSurveys] = useState([]);
  const [courses, setCourses] = useState([]);
  const [skills, setSkills] = useState([]);
  const [form, setForm] = useState({ name: '', courseIds: [], skillIds: [] });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSurveys();
    api.get('/courses').then(r => setCourses(r.data));
    api.get('/skills').then(r => setSkills(r.data));
  }, []);

  const fetchSurveys = async () => {
    try {
      const { data } = await api.get('/surveys');
      setSurveys(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/surveys', form);
      setForm({ name: '', courseIds: [], skillIds: [] });
      fetchSurveys();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const toggleCourse = (id) => {
    setForm(prev => ({
      ...prev,
      courseIds: prev.courseIds.includes(id) ? prev.courseIds.filter(x => x !== id) : [...prev.courseIds, id],
    }));
  };

  const toggleSkill = (id) => {
    setForm(prev => ({
      ...prev,
      skillIds: prev.skillIds.includes(id) ? prev.skillIds.filter(x => x !== id) : [...prev.skillIds, id],
    }));
  };

  const toggleStatus = async (survey) => {
    const next = survey.status === 'draft' ? 'active' : survey.status === 'active' ? 'closed' : 'draft';
    await api.put(`/surveys/${survey.id}`, { status: next });
    fetchSurveys();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this survey?')) return;
    await api.delete(`/surveys/${id}`);
    fetchSurveys();
  };

  const statusConfig = {
    draft: { label: 'Development', classes: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400', dot: 'bg-zinc-300' },
    active: { label: 'Live Assessment', classes: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' },
    closed: { label: 'Archived', classes: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400', dot: 'bg-red-500' },
  };

  return (
    <div className="animate-fade-in space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-[var(--st-text)] tracking-tight">Survey Architect</h1>
          <p className="text-sm font-bold text-[var(--st-text-variant)] uppercase tracking-[0.2em] opacity-60">Construct & Manage Assessment Projects</p>
        </div>
      </div>

      <div className="tonal-card p-10">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Assessment Nomenclature</label>
            <input placeholder="e.g., Q2 2026 Curriculum Competency Review" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
              className="w-full px-8 py-5 rounded-[24px] border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[var(--st-text)] focus:ring-4 focus:ring-[var(--st-primary)]/5 focus:border-[var(--st-primary)] outline-none transition-all font-black text-lg placeholder-zinc-200" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  Course Anthology <span className="text-zinc-300 ml-2">({form.courseIds.length} Curated)</span>
                </label>
                <button type="button" onClick={() => setForm(prev => ({ ...prev, courseIds: courses.map(c => c.id) }))}
                  className="text-[10px] font-black text-[var(--st-primary)] uppercase tracking-widest hover:opacity-70 transition-opacity">Select All</button>
              </div>
              <div className="border border-zinc-50 dark:border-zinc-800 rounded-[32px] max-h-64 overflow-y-auto bg-[var(--st-surface-low)] p-2 space-y-1 custom-scrollbar">
                {courses.length === 0 ? (
                  <p className="p-8 text-sm font-bold text-zinc-300 text-center uppercase tracking-widest">Repository Empty</p>
                ) : courses.map(c => (
                  <label key={c.id} className={`flex items-center gap-4 px-6 py-4 cursor-pointer rounded-2xl transition-all duration-300 ${
                    form.courseIds.includes(c.id) ? 'bg-white dark:bg-zinc-900 shadow-lg shadow-violet-500/5 ring-1 ring-[var(--st-primary)]/10' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                  }`}>
                    <div className="relative">
                      <input type="checkbox" checked={form.courseIds.includes(c.id)} onChange={() => toggleCourse(c.id)}
                        className="peer sr-only" />
                      <div className="w-5 h-5 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 peer-checked:bg-[var(--st-primary)] peer-checked:border-[var(--st-primary)] transition-all flex items-center justify-center">
                        <svg className={`w-3 h-3 text-white transition-opacity ${form.courseIds.includes(c.id) ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-[10px] font-black text-[var(--st-primary)] bg-[var(--st-primary)]/5 px-2 py-0.5 rounded-md uppercase shrink-0">{c.code}</span>
                      <span className="text-sm font-black text-[var(--st-text)] truncate">{c.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                  Competency Taxonomy <span className="text-zinc-300 ml-2">({form.skillIds.length} Curated)</span>
                </label>
                <button type="button" onClick={() => setForm(prev => ({ ...prev, skillIds: skills.map(s => s.id) }))}
                  className="text-[10px] font-black text-[var(--st-primary)] uppercase tracking-widest hover:opacity-70 transition-opacity">Select All</button>
              </div>
              <div className="border border-zinc-50 dark:border-zinc-800 rounded-[32px] max-h-64 overflow-y-auto bg-[var(--st-surface-low)] p-2 space-y-1 custom-scrollbar">
                {skills.length === 0 ? (
                  <p className="p-8 text-sm font-bold text-zinc-300 text-center uppercase tracking-widest">Taxonomy Empty</p>
                ) : skills.map(s => (
                  <label key={s.id} className={`flex items-center gap-4 px-6 py-4 cursor-pointer rounded-2xl transition-all duration-300 ${
                    form.skillIds.includes(s.id) ? 'bg-white dark:bg-zinc-900 shadow-lg shadow-violet-500/5 ring-1 ring-[var(--st-primary)]/10' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
                  }`}>
                    <div className="relative">
                      <input type="checkbox" checked={form.skillIds.includes(s.id)} onChange={() => toggleSkill(s.id)}
                        className="peer sr-only" />
                      <div className="w-5 h-5 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 peer-checked:bg-[var(--st-primary)] peer-checked:border-[var(--st-primary)] transition-all flex items-center justify-center">
                        <svg className={`w-3 h-3 text-white transition-opacity ${form.skillIds.includes(s.id) ? 'opacity-100' : 'opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-[var(--st-text)] truncate">{s.name}</p>
                      {s.category && <p className="text-xs font-bold text-[var(--st-text-variant)] opacity-40 uppercase tracking-widest truncate">{s.category}</p>}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={submitting || !form.name || form.courseIds.length === 0 || form.skillIds.length === 0}
              className="w-full py-6 primary-gradient text-white text-sm font-black rounded-[24px] shadow-xl shadow-violet-500/20 hover:scale-[1.01] transition-all active:scale-[0.99] disabled:opacity-40 disabled:scale-100">
              {submitting ? 'Finalizing Blueprint...' : 'Finalize Assessment Blueprint'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Assessment Ledger</label>
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="tonal-card p-8 animate-pulse flex items-center justify-between">
              <div className="space-y-3">
                <div className="h-6 w-64 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
                <div className="h-4 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-lg opacity-50" />
              </div>
              <div className="h-10 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
            </div>
          ))
        ) : surveys.length === 0 ? (
          <div className="tonal-card p-20 text-center">
            <div className="w-20 h-20 rounded-[32px] prim-tonal-bg text-[var(--st-primary)] flex items-center justify-center mx-auto mb-8">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <p className="text-xl font-black text-[var(--st-text)]">Ledger Empty</p>
            <p className="text-sm font-bold text-[var(--st-text-variant)] opacity-60">Design your first curriculum assessment above</p>
          </div>
        ) : surveys.map(s => {
          const status = statusConfig[s.status];
          return (
            <div key={s.id} className="tonal-card p-5 pl-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:shadow-xl hover:shadow-violet-500/5 transition-all duration-300 group">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-black text-[var(--st-text)] tracking-tight group-hover:text-[var(--st-primary)] transition-colors">{s.name}</h3>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${status.classes} shadow-sm`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>
                <p className="text-[10px] font-black text-[var(--st-text-variant)] opacity-40 uppercase tracking-[0.2em]">{new Date(s.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
                <div className="flex items-center gap-3">
                  {s.status === 'active' && (
                    <button onClick={() => {
                      const url = `${window.location.origin}/survey/p/${s.public_id}`;
                      navigator.clipboard.writeText(url);
                      const btn = document.getElementById(`share-btn-${s.id}`);
                      if (btn) {
                        const originalContent = btn.innerHTML;
                        btn.innerHTML = '<span class="flex items-center gap-2 tracking-widest">COPIED</span>';
                        setTimeout(() => { btn.innerHTML = originalContent; }, 2000);
                      }
                    }} id={`share-btn-${s.id}`}
                      className="px-6 py-3 text-[10px] font-black text-white primary-gradient rounded-xl shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 transition-all flex items-center gap-3 uppercase tracking-widest active:scale-95">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                      </svg>
                      Public Link
                    </button>
                  )}
                  <button onClick={() => toggleStatus(s)}
                    className={`px-6 py-3 text-[10px] font-black rounded-xl border transition-all uppercase tracking-widest active:scale-95 ${
                      s.status === 'draft' ? 'border-emerald-100 text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50' : 
                      s.status === 'active' ? 'border-zinc-200 text-zinc-400 bg-zinc-50 dark:bg-zinc-800' : 
                      'border-violet-100 text-[var(--st-primary)] bg-violet-50 hover:bg-violet-100'
                    }`}>
                    {s.status === 'draft' ? 'Authorize' : s.status === 'active' ? 'Archive' : 'Restore'}
                  </button>
                  <button onClick={() => handleDelete(s.id)}
                    className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 text-zinc-400 hover:text-red-500 hover:border-red-100 border border-transparent shadow-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CreateSurvey;
