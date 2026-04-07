import { useEffect, useState } from 'react';
import api from '../api';

function ViewResults() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/surveys').then(r => { setSurveys(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const downloadFile = async (id, format = 'xlsx') => {
    try {
      const response = await api.get(`/export/survey/${id}${format === 'csv' ? '/csv' : ''}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `survey_results_${id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download results. Please try again.');
    }
  };

  const statusConfig = {
    draft: { label: 'In Development', classes: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400', dot: 'bg-zinc-300' },
    active: { label: 'Active Insights', classes: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' },
    closed: { label: 'Archived Ledger', classes: 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500', dot: 'bg-zinc-300' },
  };

  return (
    <div className="animate-fade-in space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-[var(--st-text)] tracking-tight">Insights Studio</h1>
          <p className="text-sm font-bold text-[var(--st-text-variant)] uppercase tracking-[0.2em] opacity-60">Data Analytics & Professional Export Center</p>
        </div>
      </div>

      <div className="space-y-6">
        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Results Archive</label>
        
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="tonal-card p-10 animate-pulse flex items-center justify-between">
                <div className="space-y-3">
                  <div className="h-6 w-80 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
                  <div className="h-4 w-40 bg-zinc-100 dark:bg-zinc-800 rounded-lg opacity-50" />
                </div>
                <div className="flex gap-4">
                  <div className="h-12 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-3xl" />
                  <div className="h-12 w-32 bg-zinc-100 dark:bg-zinc-800 rounded-3xl" />
                </div>
              </div>
            ))}
          </div>
        ) : surveys.length === 0 ? (
          <div className="tonal-card p-20 text-center">
            <div className="w-24 h-24 rounded-[40px] bg-zinc-50 dark:bg-zinc-800/50 text-zinc-200 dark:text-zinc-700 flex items-center justify-center mx-auto mb-8">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-[var(--st-text)] mb-2">Intelligence Library Empty</h3>
            <p className="text-sm font-bold text-[var(--st-text-variant)] opacity-50 uppercase tracking-widest">Share assessment links to begin data collection</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {surveys.map(s => {
              const status = statusConfig[s.status];
              return (
                <div key={s.id} className="tonal-card p-8 pl-12 flex flex-col lg:flex-row lg:items-center justify-between gap-10 hover:shadow-2xl hover:shadow-violet-500/5 transition-all duration-500 group border border-transparent hover:border-violet-500/5">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-4">
                      <h3 className="text-xl font-black text-[var(--st-text)] tracking-tight group-hover:text-[var(--st-primary)] transition-colors duration-300">{s.name}</h3>
                      <span className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${status.classes} shadow-sm ring-1 ring-black/5 dark:ring-white/5`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3 text-[10px] font-black text-[var(--st-text-variant)] opacity-40 uppercase tracking-[0.2em]">
                        <svg className="w-4 h-4 text-[var(--st-primary)] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Initiated {new Date(s.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 pt-8 lg:pt-0 border-t lg:border-none border-zinc-50 dark:border-zinc-800/50">
                    <button 
                      onClick={() => downloadFile(s.id, 'xlsx')}
                      className="px-8 py-4 text-[11px] font-black text-white primary-gradient rounded-[20px] shadow-xl shadow-violet-500/10 hover:shadow-violet-500/30 transition-all uppercase tracking-widest active:scale-95 flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                      XLSX Export
                    </button>
                    <button 
                      onClick={() => downloadFile(s.id, 'csv')}
                      className="px-8 py-4 text-[11px] font-black text-[var(--st-text)] bg-white dark:bg-zinc-800 hover:bg-zinc-50 border border-zinc-100 dark:border-zinc-700/50 rounded-[20px] shadow-sm hover:shadow-md transition-all uppercase tracking-widest active:scale-95 flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                      CSV Logic
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewResults;
