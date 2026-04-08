import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

function SurveyPage() {
  const { token, publicId } = useParams();
  const [surveyData, setSurveyData] = useState(null);
  const [mappings, setMappings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [searchSkill, setSearchSkill] = useState('');
  const [searchCourse, setSearchCourse] = useState('');
  
  // For Public Surveys
  const [identity, setIdentity] = useState({ name: '', email: '' });
  const [identitySubmitted, setIdentitySubmitted] = useState(false);
  const [isTransposed, setIsTransposed] = useState(false);

  useEffect(() => {
    const validate = async () => {
      try {
        if (token) {
          // Private invitation
          const { data } = await api.get(`/responses/validate/${token}`);
          setSurveyData(data);
          setSubmitted(data.invitation.status === 'submitted');

          const map = {};
          (data.existingResponses || []).forEach(r => {
            const key = `${r.course_id}:${r.skill_id}`;
            map[key] = { checked: true, notes: r.notes || '' };
          });
          setMappings(map);
        } else if (publicId) {
          // Public survey
          const { data } = await api.get(`/responses/public/${publicId}`);
          setSurveyData({
            invitation: { surveys: data.survey, experts: { name: 'Guest' } },
            courses: data.courses,
            skills: data.skills
          });
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load survey');
      }
      setLoading(false);
    };
    validate();
  }, [token, publicId]);

  const toggleMapping = useCallback((courseId, skillId) => {
    const key = `${courseId}:${skillId}`;
    setMappings(prev => {
      const exists = prev[key]?.checked;
      const next = { ...prev };
      if (exists) {
        delete next[key];
      } else {
        next[key] = { checked: true, notes: '' };
      }
      return next;
    });
  }, []);

  const updateNotes = useCallback((courseId, skillId, notes) => {
    const key = `${courseId}:${skillId}`;
    setMappings(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { checked: false }), notes },
    }));
  }, []);

  const saveDraft = async () => {
    if (publicId) return alert('Drafts are not supported for public links. Please complete and submit.');
    setSaving(true);
    try {
      const rows = Object.entries(mappings).filter(([, v]) => v.checked).map(([key, val]) => {
        const [courseId, skillId] = key.split(':');
        return { courseId, skillId, notes: val.notes };
      });
      await api.post('/responses/save-draft', { token, mappings: rows });
      alert('Draft saved!');
    } catch (err) {
      alert('Failed to save draft');
    }
    setSaving(false);
  };

  const submitSurvey = async () => {
    const count = Object.values(mappings).filter(v => v.checked).length;
    if (count === 0 && !confirm('No mappings selected. Submit anyway?')) return;
    if (!confirm(`Submit ${count} mapping(s)? You won't be able to edit after submission.`)) return;

    try {
      const rows = Object.entries(mappings).filter(([, v]) => v.checked).map(([key, val]) => {
        const [courseId, skillId] = key.split(':');
        return { courseId, skillId, notes: val.notes };
      });

      if (token) {
        await api.post('/responses/submit', { token, mappings: rows });
      } else if (publicId) {
        await api.post('/responses/submit-public', { 
          surveyId: surveyData.invitation.surveys.id,
          name: identity.name,
          email: identity.email,
          mappings: rows 
        });
      }
      setSubmitted(true);
    } catch (err) {
      alert('Failed to submit: ' + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--st-surface)]">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--st-primary)]/10"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-[var(--st-primary)] animate-spin"></div>
        </div>
        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest animate-pulse">Loading Workspace</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--st-surface)]">
      <div className="text-center max-w-sm px-6">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-[var(--st-text)] mb-2">Access Error</h2>
        <p className="text-sm text-red-600/80 font-bold">{error}</p>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--st-surface)]">
      <div className="tonal-card p-12 text-center max-w-md mx-4 animate-scale-in">
        <div className="w-24 h-24 mx-auto mb-8 rounded-[32px] primary-gradient flex items-center justify-center shadow-xl shadow-violet-500/20">
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-[var(--st-text)] tracking-tight mb-4">Submission Received</h1>
        <p className="text-lg text-[var(--st-text-variant)] leading-relaxed mb-8">Your expert mapping has been securely recorded. Thank you for contributing to the academic taxonomy.</p>
        <button onClick={() => window.location.reload()} className="px-8 py-3.5 bg-[var(--st-surface-low)] hover:bg-[var(--st-surface-lowest)] text-[var(--st-primary)] font-black rounded-2xl transition-all">
          View Summary
        </button>
      </div>
    </div>
  );

  // New Identity Collection Step for Public Surveys
  if (publicId && !identitySubmitted) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--st-surface)]">
      <div className="tonal-card p-10 max-w-md w-full mx-4 animate-scale-in">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 rounded-3xl primary-gradient mx-auto mb-6 flex items-center justify-center shadow-lg shadow-violet-500/10">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-[var(--st-text)] tracking-tight">{surveyData?.invitation?.surveys?.name}</h1>
          <p className="text-[var(--st-text-variant)] font-bold text-sm mt-2 uppercase tracking-widest">Enter the Curator Studio</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setIdentitySubmitted(true); }} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
            <input placeholder="Ex: Dr. Jane Cooper" value={identity.name} onChange={e => setIdentity({...identity, name: e.target.value})} required
              className="w-full px-6 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white text-[var(--st-text)] focus:ring-4 focus:ring-[var(--st-primary)]/5 focus:border-[var(--st-primary)] outline-none transition-all font-bold" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Academic Email</label>
            <input type="email" placeholder="jane@university.edu" value={identity.email} onChange={e => setIdentity({...identity, email: e.target.value})} required
              className="w-full px-6 py-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white text-[var(--st-text)] focus:ring-4 focus:ring-[var(--st-primary)]/5 focus:border-[var(--st-primary)] outline-none transition-all font-bold" />
          </div>
          <button type="submit"
            className="w-full py-4 primary-gradient text-white font-black rounded-2xl shadow-xl shadow-violet-500/20 hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-[0.98]">
            Begin Curation
          </button>
        </form>
      </div>
    </div>
  );

  const { invitation, courses, skills } = surveyData;
  const filteredCourses = courses.filter(c =>
    c.name.toLowerCase().includes(searchCourse.toLowerCase()) ||
    c.code?.toLowerCase().includes(searchCourse.toLowerCase())
  );
  const filteredSkills = skills.filter(s =>
    s.name.toLowerCase().includes(searchSkill.toLowerCase())
  );

  const checkedCount = Object.values(mappings).filter(v => v.checked).length;
  const totalCount = filteredCourses.length * filteredSkills.length;
  const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  // Transpose Logic: Define Rows and Cols based on orientation
  const tableRows = isTransposed ? filteredSkills : filteredCourses;
  const tableCols = isTransposed ? filteredCourses : filteredSkills;

  return (
    <div className="min-h-screen bg-[var(--st-surface)] font-sans antialiased text-[var(--st-text)]">
      {/* Glassmorphism Header */}
      <header className="glass-header sticky top-0 z-40 h-20 flex items-center border-b border-zinc-200/40 dark:border-zinc-800/40">
        <div className="max-w-screen-2xl mx-auto w-full px-6 sm:px-10">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-5 overflow-hidden">
              <div className="w-12 h-12 rounded-2xl primary-gradient flex items-center justify-center shrink-0 shadow-[0_8px_20px_-6px_rgba(99,14,212,0.3)]">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="truncate">
                <h1 className="text-xl font-black text-[var(--st-text)] tracking-tight leading-none mb-1 truncate">
                  {invitation?.surveys?.name}
                </h1>
                <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-[var(--st-text-variant)]">
                  <span className="text-[var(--st-primary)]">{invitation?.experts?.name}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-300 shrink-0" />
                  <span>Expert Studio</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6 shrink-0">
              <div className="hidden lg:flex items-center gap-4 px-5 py-2 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Curation Progress</p>
                <div className="w-32 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full primary-gradient rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-sm font-black text-[var(--st-primary)] leading-none">{progressPercent}%</p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={saveDraft} 
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-3 text-sm font-bold text-[var(--st-text-variant)] hover:text-[var(--st-primary)] hover:bg-[var(--st-primary)]/5 rounded-full transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? (
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  ) : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>}
                  <span className="hidden sm:inline">Save Draft</span>
                </button>
                <button 
                  onClick={submitSurvey}
                  className="flex items-center gap-2 px-8 py-3.5 primary-gradient text-white text-sm font-bold rounded-full shadow-lg shadow-violet-500/20 hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95"
                >
                  Finalize Mapping
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 sm:px-10 py-10 sm:py-16">
        {/* Tonal Guide Box */}
        <div className="mb-12 tonal-card p-10 flex items-start gap-8 animate-scale-in">
          <div className="w-16 h-16 rounded-3xl primary-gradient flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/10">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-[var(--st-text)] tracking-tight">The Digital Curator Protocol</h2>
            <p className="text-lg text-[var(--st-text-variant)] leading-relaxed max-w-4xl">
              Map academic courses to their corresponding skills with precision. Use the "No-Line" matrix below to record your expertise. 
              Drafts are preserved in real-time.
            </p>
          </div>
        </div>

        {/* Search Experience */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-400 transition-colors group-focus-within:text-[var(--st-primary)]">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              </div>
              <input 
                placeholder="Filter courses..." 
                value={searchCourse} onChange={e => setSearchCourse(e.target.value)}
                className="w-full pl-16 pr-8 py-5 bg-white border border-zinc-200 dark:border-zinc-700 focus:border-[var(--st-primary)] rounded-full text-sm font-bold text-[var(--st-text)] shadow-sm focus:shadow-xl focus:shadow-violet-500/5 transition-all outline-none placeholder-zinc-400" 
              />
            </div>
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-zinc-400 transition-colors group-focus-within:text-[var(--st-primary)]">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              </div>
              <input 
                placeholder="Search skills..." 
                value={searchSkill} onChange={e => setSearchSkill(e.target.value)}
                className="w-full pl-16 pr-8 py-5 bg-white border border-zinc-200 dark:border-zinc-700 focus:border-[var(--st-primary)] rounded-full text-sm font-bold text-[var(--st-text)] shadow-sm focus:shadow-xl focus:shadow-violet-500/5 transition-all outline-none placeholder-zinc-400" 
              />
            </div>
          </div>
          <button 
            onClick={() => setIsTransposed(!isTransposed)}
            className="flex items-center justify-center gap-3 px-8 py-5 bg-white border border-zinc-200 dark:border-zinc-700 rounded-full hover:border-[var(--st-primary)] hover:text-[var(--st-primary)] transition-all shadow-sm active:scale-95 group"
          >
            <svg className={`w-5 h-5 transition-transform duration-500 ${isTransposed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
            <span className="text-sm font-black uppercase tracking-widest whitespace-nowrap">Transpose Matrix</span>
          </button>
        </div>

        {/* The Unified No-Line Matrix */}
        <div className="tonal-card overflow-hidden shadow-xl shadow-zinc-200/50 dark:shadow-none bg-white">
          <div className="overflow-auto max-h-[calc(100vh-340px)]">
            <table className="w-full border-separate border-spacing-0">
              <thead className="sticky top-0 z-20">
                <tr className="bg-white border-b border-zinc-200">
                  <th className="sticky left-0 z-30 bg-white px-6 sm:px-10 py-8 text-left text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] border-r border-zinc-200/40 dark:border-zinc-800/40">
                    {isTransposed ? 'Professional Skills' : 'Academic Courses'}
                  </th>
                  {tableCols.map(col => (
                    <th key={col.id} className="relative px-4 py-24 text-center min-w-[124px] sm:min-w-[130px] bg-white">
                      <div className="absolute inset-0 flex items-end justify-center pb-12">
                        <span 
                          className="origin-bottom-left -rotate-45 block font-black text-[var(--st-text)] text-[10px] uppercase tracking-wider w-[180px] text-left leading-tight transition-all"
                        >
                          {col.name}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white">
                {tableRows.map(row => (
                  <tr key={row.id} className="tonal-row group hover:bg-[var(--st-primary)]/5 transition-colors duration-300">
                    <td className="sticky left-0 z-10 bg-white px-6 sm:px-10 py-7 transition-colors border-r border-[#e8eaed] dark:border-zinc-800 min-w-[180px] sm:min-w-[280px] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-zinc-200/50 shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-none">
                      <div className="space-y-2">
                        {row.code && <span className="inline-block px-2 py-0.5 rounded-md bg-white shadow-sm text-[10px] font-black text-[var(--st-primary)] uppercase tracking-widest">{row.code}</span>}
                        <p className="text-sm font-bold text-[var(--st-text)] group-hover:text-[var(--st-primary)] transition-colors leading-tight">{row.name}</p>
                      </div>
                    </td>
                    {tableCols.map(col => {
                      const courseId = isTransposed ? col.id : row.id;
                      const skillId = isTransposed ? row.id : col.id;
                      const key = `${courseId}:${skillId}`;
                      const isChecked = mappings[key]?.checked;
                      return (
                        <td key={col.id} className="px-4 py-7 text-center align-top bg-white">
                          <div className="flex flex-col items-center gap-4">
                            <label className="relative inline-flex items-center justify-center cursor-pointer group/check">
                              <input 
                                type="checkbox" 
                                checked={!!isChecked} 
                                onChange={() => toggleMapping(courseId, skillId)}
                                className="sr-only peer" 
                              />
                              <div className="w-7 h-7 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 peer-checked:bg-[var(--st-primary)] peer-checked:border-[var(--st-primary)] flex items-center justify-center transition-all duration-300 group-hover/check:border-[var(--st-primary)] peer-checked:shadow-lg peer-checked:shadow-violet-500/20">
                                <svg className="w-4 h-4 text-white opacity-0 scale-50 peer-checked:opacity-100 peer-checked:scale-100 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            </label>
                            
                            {isChecked && (
                              <textarea 
                                placeholder="Add note..."
                                value={mappings[key]?.notes || ''}
                                onChange={(e) => updateNotes(courseId, skillId, e.target.value)}
                                className="w-[124px] px-3 py-2 bg-white border border-zinc-100 dark:border-zinc-800 rounded-xl text-[10px] font-bold text-[var(--st-text)] focus:ring-4 focus:ring-[var(--st-primary)]/5 transition-all outline-none min-h-[40px] resize-none animate-scale-in"
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Floating Action Bar for Mobile */}
        <div className="lg:hidden mt-8 sticky bottom-6 z-40">
          <div className="bg-white/90 backdrop-blur-xl text-[var(--st-text)] rounded-[32px] p-2.5 pl-8 flex items-center justify-between shadow-2xl border border-zinc-200/50">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--st-text-variant)]">Total Progress</span>
              <span className="text-sm font-black tracking-tight text-[var(--st-primary)]">{progressPercent}% DONE</span>
            </div>
            <button onClick={submitSurvey} className="primary-gradient px-8 py-4 rounded-[24px] text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-violet-500/20 active:scale-95 transition-all">
              Submit Mapping
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SurveyPage;


