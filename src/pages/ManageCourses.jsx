import { useEffect, useState } from 'react';
import api from '../api';

function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', description: '', credits: '' });
  const [editing, setEditing] = useState(null);
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/courses/${editing}`, form);
      } else {
        await api.post('/courses', form);
      }
      setForm({ code: '', name: '', description: '', credits: '' });
      setEditing(null);
      fetchCourses();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleBulk = async () => {
    try {
      const lines = bulkText.trim().split('\n');
      const rows = lines.map(line => {
        const [code, name, description, credits] = line.split(',').map(s => s.trim());
        return { code, name, description: description || '', credits: credits ? parseInt(credits) : null };
      });
      await api.post('/courses/bulk', rows);
      setBulkText('');
      setShowBulk(false);
      fetchCourses();
    } catch (err) { alert(err.response?.data?.error || 'Failed'); }
  };

  const handleEdit = (course) => {
    setForm({ code: course.code, name: course.name, description: course.description || '', credits: course.credits || '' });
    setEditing(course.id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this course?')) return;
    await api.delete(`/courses/${id}`);
    fetchCourses();
  };

  return (
    <div className="animate-fade-in space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-[var(--st-text)] tracking-tight">Course Catalog</h1>
          <p className="text-sm font-bold text-[var(--st-text-variant)] uppercase tracking-[0.2em] opacity-60">Academic Asset Management</p>
        </div>
        <button type="button" onClick={() => setShowBulk(!showBulk)}
          className="flex items-center gap-2 px-6 py-3 text-sm font-black text-[var(--st-primary)] bg-[var(--st-surface-low)] hover:bg-[var(--st-surface-lowest)] rounded-2xl transition-all active:scale-95">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {showBulk ? 'Hide Import Interface' : 'Bulk Curator Import'}
        </button>
      </div>

      <div className="tonal-card p-10">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Course Code</label>
              <input placeholder="Ex: CS101" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required
                className="w-full px-6 py-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[var(--st-text)] focus:ring-4 focus:ring-[var(--st-primary)]/5 focus:border-[var(--st-primary)] outline-none transition-all font-bold placeholder-zinc-300" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Full Nomenclature</label>
              <input placeholder="Ex: Machine Learning" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
                className="w-full px-6 py-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[var(--st-text)] focus:ring-4 focus:ring-[var(--st-primary)]/5 focus:border-[var(--st-primary)] outline-none transition-all font-bold placeholder-zinc-300" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Brief Narrative</label>
              <input placeholder="Optional metadata..." value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[var(--st-text)] focus:ring-4 focus:ring-[var(--st-primary)]/5 focus:border-[var(--st-primary)] outline-none transition-all font-bold placeholder-zinc-300" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Credits</label>
              <input placeholder="Valuation" type="number" value={form.credits} onChange={e => setForm({...form, credits: e.target.value})}
                className="w-full px-6 py-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[var(--st-text)] focus:ring-4 focus:ring-[var(--st-primary)]/5 focus:border-[var(--st-primary)] outline-none transition-all font-bold placeholder-zinc-300" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button type="submit" disabled={submitting}
              className="px-10 py-4 primary-gradient text-white text-sm font-black rounded-2xl shadow-xl shadow-violet-500/20 hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-60">
              {editing ? 'Update Course Metadata' : 'Append to Catalog'}
            </button>
            {editing && (
              <button type="button" onClick={() => { setEditing(null); setForm({ code: '', name: '', description: '', credits: '' }); }}
                className="px-8 py-4 text-sm font-black text-[var(--st-text-variant)] bg-[var(--st-surface-low)] hover:bg-[var(--st-surface-lowest)] rounded-2xl transition-all">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {showBulk && (
        <div className="tonal-card p-10 animate-scale-in">
          <div className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-2xl prim-tonal-bg text-[var(--st-primary)] flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-black text-[var(--st-text)]">Bulk Curation Protocol</h3>
                <p className="text-sm font-bold text-[var(--st-text-variant)] opacity-60">Paste CSV: code, name, description, credits</p>
              </div>
            </div>
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={6} placeholder="CS101, Intro to CS, Basic concepts, 3&#10;CS201, Data Structures, Advanced topics, 4"
              className="w-full px-8 py-6 rounded-[32px] border border-zinc-100 dark:border-zinc-800 bg-[var(--st-surface-low)] text-[var(--st-text)] focus:ring-4 focus:ring-[var(--st-primary)]/5 focus:border-[var(--st-primary)] outline-none transition-all font-mono text-sm resize-none" />
            <button onClick={handleBulk}
              className="w-full py-5 primary-gradient text-white text-sm font-black rounded-2xl shadow-xl shadow-violet-500/20 hover:scale-[1.01] transition-all">
              Initiate Bulk Curaton
            </button>
          </div>
        </div>
      )}

      {/* The No-Line Table */}
      <div className="tonal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-[var(--st-surface-low)] dark:bg-zinc-800">
                <th className="text-left px-10 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Asset Code</th>
                <th className="text-left px-10 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Nomenclature</th>
                <th className="text-left px-10 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Valuation</th>
                <th className="text-right px-10 py-6 text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Edit / Remove</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-zinc-900">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-10 py-7"><div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                    <td className="px-10 py-7"><div className="h-4 w-40 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                    <td className="px-10 py-7"><div className="h-4 w-8 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                    <td className="px-10 py-7"><div className="h-4 w-20 ml-auto bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  </tr>
                ))
              ) : courses.length === 0 ? (
                <tr><td colSpan={4} className="px-10 py-20 text-center">
                  <div className="w-20 h-20 rounded-[32px] prim-tonal-bg text-[var(--st-primary)] flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <p className="text-lg font-black text-[var(--st-text)]">Catalog Empty</p>
                  <p className="text-sm font-bold text-[var(--st-text-variant)] opacity-60">Add academic courses to begin curation</p>
                </td></tr>
              ) : courses.map(c => (
                <tr key={c.id} className="tonal-row group">
                  <td className="px-10 py-7">
                    <span className="px-3 py-1.5 rounded-lg bg-[var(--st-surface-low)] text-[11px] font-black text-[var(--st-primary)] uppercase tracking-wider">{c.code}</span>
                  </td>
                  <td className="px-10 py-7">
                    <div>
                      <p className="text-base font-black text-[var(--st-text)] group-hover:text-[var(--st-primary)] transition-colors tracking-tight">{c.name}</p>
                      {c.description && <p className="text-xs font-bold text-[var(--st-text-variant)] opacity-60 mt-1 truncate max-w-sm">{c.description}</p>}
                    </div>
                  </td>
                  <td className="px-10 py-7 text-sm font-black text-[var(--st-text-variant)]">{c.credits ?? '—'} Credits</td>
                  <td className="px-10 py-7">
                    <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      <button onClick={() => handleEdit(c)}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 text-zinc-400 hover:text-[var(--st-primary)] hover:shadow-lg transition-all flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(c.id)}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 text-zinc-400 hover:text-red-500 hover:shadow-lg transition-all flex items-center justify-center">
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
    </div>
  );
}

export default ManageCourses;
