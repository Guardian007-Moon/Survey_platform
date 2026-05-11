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
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [formStep, setFormStep] = useState('IDENTITY'); // IDENTITY, SELECTION, MAPPING
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
            map[key] = { rating: r.rating || 0, notes: r.notes || '' };
          });
          setMappings(map);
          
          // Auto-select courses that already have responses
          const respondedCourses = [...new Set((data.existingResponses || []).map(r => r.course_id))];
          setSelectedCourseIds(respondedCourses);
          
          if (data.existingResponses?.length > 0) {
            setFormStep('MAPPING');
          } else {
            setFormStep(token ? 'SELECTION' : 'IDENTITY');
          }
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

  const updateMapping = useCallback((courseId, skillId, rating) => {
    const key = `${courseId}:${skillId}`;
    setMappings(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { notes: '' }), rating: Number(rating) }
    }));
  }, []);

  const updateNotes = useCallback((courseId, skillId, notes) => {
    const key = `${courseId}:${skillId}`;
    setMappings(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { rating: 0 }), notes },
    }));
  }, []);

  const saveDraft = async () => {
    if (publicId) return alert('Drafts are not supported for public links. Please complete and submit.');
    setSaving(true);
    try {
      const rows = Object.entries(mappings).filter(([, v]) => v.rating > 0).map(([key, val]) => {
        const [courseId, skillId] = key.split(':');
        return { courseId, skillId, rating: val.rating, notes: val.notes };
      });
      await api.post('/responses/save-draft', { token, mappings: rows });
      alert('Draft saved!');
    } catch (err) {
      alert('Failed to save draft');
    }
    setSaving(false);
  };

  const submitSurvey = async () => {
    const rows = Object.entries(mappings).filter(([, v]) => v.rating > 0).map(([key, val]) => {
      const [courseId, skillId] = key.split(':');
      return { courseId, skillId, rating: val.rating, notes: val.notes };
    });

    if (rows.length === 0 && !confirm('No mappings selected. Submit anyway?')) return;
    if (!confirm(`Submit ${rows.length} mapping(s)? You won't be able to edit after submission.`)) return;

    try {
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--st-surface)]">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 border-4 border-zinc-100 border-t-[var(--st-primary)] rounded-full animate-spin" />
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest animate-pulse">Synchronizing Studio...</p>
      </div>
    </div>
  );

  if (!surveyData) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--st-surface)]">
      <div className="tonal-card p-10 max-w-md w-full text-center space-y-6">
        <div className="text-red-500 text-5xl">⚠️</div>
        <h2 className="text-2xl font-black text-[var(--st-text)]">Survey Not Found</h2>
        <p className="text-sm font-bold text-[var(--st-text-variant)]">This assessment link may have expired or is incorrect.</p>
      </div>
    </div>
  );

  const invitation = surveyData?.invitation;
  const courses = surveyData?.courses || [];
  const skills = surveyData?.skills || [];
  const filteredSkills = skills.filter(s => s?.name?.toLowerCase().includes(searchSkill.toLowerCase()));

  // Render Step 1: Identity Collection (for Public)
  const renderIdentityStep = () => (
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
        <form onSubmit={(e) => { e.preventDefault(); setFormStep('SELECTION'); }} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
            <input placeholder="Ex: Dr. Jane Cooper" value={identity.name} onChange={e => setIdentity({...identity, name: e.target.value})} required
              className="w-full px-6 py-4 rounded-2xl border border-zinc-200 bg-white text-[var(--st-text)] focus:border-[var(--st-primary)] outline-none transition-all font-bold" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Academic Email</label>
            <input type="email" placeholder="jane@university.edu" value={identity.email} onChange={e => setIdentity({...identity, email: e.target.value})} required
              className="w-full px-6 py-4 rounded-2xl border border-zinc-200 bg-white text-[var(--st-text)] focus:border-[var(--st-primary)] outline-none transition-all font-bold" />
          </div>
          <button type="submit"
            className="w-full py-4 primary-gradient text-white font-black rounded-2xl shadow-xl shadow-violet-500/20 hover:scale-[1.02] transition-all">
            Continue to Course Selection
          </button>
        </form>
      </div>
    </div>
  );

  // Render Step 2: Course Responsibility Selection
  const renderSelectionStep = () => (
    <div className="min-h-screen bg-[var(--st-surface)] p-6 sm:p-10 flex items-center justify-center">
      <div className="max-w-4xl w-full space-y-10 animate-scale-in">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-black text-[var(--st-text)] tracking-tight">Select Your Courses</h1>
          <p className="text-lg text-[var(--st-text-variant)] max-w-2xl mx-auto font-bold">
            Which courses are you currently responsible for in this survey? 
            We will only show these in your mapping matrix.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[50vh] overflow-auto p-2">
          {courses.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-white/50 rounded-[32px] border-2 border-dashed border-zinc-200">
              <p className="text-zinc-400 font-bold">No courses found in this survey.</p>
            </div>
          ) : (
            courses.map(course => {
              if (!course) return null;
              const isSelected = selectedCourseIds.includes(course.id);
              return (
                <button 
                  key={course.id}
                  onClick={() => {
                    setSelectedCourseIds(prev => isSelected ? prev.filter(id => id !== course.id) : [...prev, course.id]);
                  }}
                  className={`flex items-start gap-5 p-6 rounded-[28px] border-2 transition-all text-left group ${
                    isSelected ? 'border-[var(--st-primary)] bg-white shadow-xl shadow-violet-500/10' : 'border-zinc-200 bg-white/50 hover:border-zinc-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center transition-all ${
                    isSelected ? 'primary-gradient text-white' : 'bg-zinc-100 text-zinc-400 group-hover:bg-zinc-200'
                  }`}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-[var(--st-primary)]' : 'text-zinc-400'}`}>
                      {course.code || 'NO CODE'}
                    </span>
                    <h3 className="text-lg font-black text-[var(--st-text)] leading-tight mt-1">{course.name || 'Untitled Course'}</h3>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex flex-col items-center gap-6 pt-6">
          <button 
            disabled={selectedCourseIds.length === 0}
            onClick={() => setFormStep('MAPPING')}
            className="px-12 py-5 primary-gradient text-white font-black rounded-full shadow-2xl shadow-violet-500/20 hover:scale-[1.05] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
          >
            Start Mapping ({selectedCourseIds.length} Courses Selected)
          </button>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">You can change your selection later</p>
        </div>
      </div>
    </div>
  );

  // Render Step 3: The Curation Matrix
  const renderMappingStep = () => {
    const coursesToRender = courses.filter(c => selectedCourseIds.includes(c.id)).filter(c =>
      c.name?.toLowerCase().includes(searchCourse.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchCourse.toLowerCase())
    );
    
    const tableRows = isTransposed ? filteredSkills : coursesToRender;
    const tableCols = isTransposed ? coursesToRender : filteredSkills;

    const checkedCount = Object.values(mappings).filter(v => v.rating > 0).length;
    const totalMatrixCount = coursesToRender.length * filteredSkills.length;
    const progressPercent = totalMatrixCount > 0 ? Math.round((checkedCount / totalMatrixCount) * 100) : 0;

    return (
      <div className="min-h-screen bg-[var(--st-surface)] font-sans antialiased text-[var(--st-text)]">
        <header className="glass-header sticky top-0 z-40 h-20 flex items-center border-b border-zinc-200/40">
          <div className="max-w-screen-2xl mx-auto w-full px-6 sm:px-10">
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-5 overflow-hidden">
                <div className="w-12 h-12 rounded-2xl primary-gradient flex items-center justify-center shrink-0 shadow-[0_8px_20px_-6px_rgba(99,14,212,0.3)]">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="truncate">
                  <h1 className="text-xl font-black text-[var(--st-text)] tracking-tight mb-1 truncate">{invitation?.surveys?.name}</h1>
                  <button onClick={() => setFormStep('SELECTION')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--st-primary)] hover:underline">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                    Edit Course Selection
                  </button>
                </div>
              </div>

              <div className="hidden lg:flex items-center gap-4 px-6 py-2.5 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Matrix Progress</p>
                <div className="w-32 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                  <div className="h-full primary-gradient rounded-full transition-all duration-700" style={{ width: `${progressPercent}%` }} />
                </div>
                <p className="text-sm font-black text-[var(--st-primary)]">{progressPercent}%</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button onClick={saveDraft} disabled={saving} className="px-5 py-3 text-sm font-bold text-zinc-500 hover:text-[var(--st-primary)] transition-all">
                  Save Draft
                </button>
                <button onClick={submitSurvey} className="px-8 py-3.5 primary-gradient text-white text-sm font-bold rounded-full shadow-lg shadow-violet-500/20 transition-all active:scale-95">
                  Submit Mapping
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-screen-2xl mx-auto px-6 sm:px-10 py-10">
          <div className="flex flex-col md:flex-row gap-4 mb-10">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input placeholder="Filter your courses..." value={searchCourse} onChange={e => setSearchCourse(e.target.value)}
                className="w-full px-8 py-5 bg-white border border-zinc-200 rounded-full text-sm font-bold shadow-sm focus:border-[var(--st-primary)] outline-none transition-all" />
              <input placeholder="Search skills..." value={searchSkill} onChange={e => setSearchSkill(e.target.value)}
                className="w-full px-8 py-5 bg-white border border-zinc-200 rounded-full text-sm font-bold shadow-sm focus:border-[var(--st-primary)] outline-none transition-all" />
            </div>
            <button onClick={() => setIsTransposed(!isTransposed)} className="flex items-center gap-3 px-8 py-5 bg-white border border-zinc-200 rounded-full text-sm font-black uppercase tracking-widest transition-all hover:border-[var(--st-primary)]">
              <svg className={`w-5 h-5 transition-transform ${isTransposed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>
              Transpose
            </button>
          </div>

          <div className="tonal-card overflow-hidden shadow-2xl bg-white border border-zinc-100">
            <div className="overflow-auto max-h-[calc(100vh-320px)]">
              <table className="w-full border-separate border-spacing-0">
                <thead className="sticky top-0 z-20">
                  <tr className="bg-white border-b border-zinc-200">
                    <th className="sticky left-0 z-30 bg-white px-8 py-10 border-r border-zinc-100">
                      <div className="flex flex-col gap-2">
                        <span className="text-[11px] font-black text-zinc-900 uppercase tracking-widest">{isTransposed ? 'Skills' : 'Your Courses'}</span>
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">(Row Context)</span>
                      </div>
                    </th>
                    {tableCols.map(col => (
                      <th key={col.id} className="px-6 py-6 text-center min-w-[140px] border-b border-zinc-100">
                        <span className="font-black text-zinc-900 text-[10px] uppercase tracking-widest block leading-relaxed line-clamp-3">
                          {col.name}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map(row => (
                    <tr key={row.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="sticky left-0 z-10 bg-white px-8 py-8 border-r border-zinc-100 min-w-[240px] shadow-sm">
                        <div className="space-y-1">
                          {row.code && <span className="text-[10px] font-black text-[var(--st-primary)] uppercase">{row.code}</span>}
                          <p className="text-sm font-black text-zinc-900 leading-tight">{row.name}</p>
                        </div>
                      </td>
                    {tableCols.map(col => {
                      const courseId = isTransposed ? col.id : row.id;
                      const skillId = isTransposed ? row.id : col.id;
                      const key = `${courseId}:${skillId}`;
                      const rating = mappings[key]?.rating || 0;
                      const heatmapStyle = {
                        backgroundColor: rating > 0 ? `rgba(99, 14, 212, ${rating / 100 * 0.15})` : 'transparent',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                      };
                      return (
                        <td 
                          key={col.id} 
                          style={heatmapStyle}
                          className="px-4 py-7 text-center align-top border-b border-zinc-50"
                        >
                          <div className="flex flex-col items-center gap-4">
                            <div className="relative group/rating flex flex-col items-center">
                              <input 
                                type="range" min="0" max="100" step="10" 
                                value={rating} onChange={(e) => updateMapping(courseId, skillId, e.target.value)}
                                className="w-24 h-1.5 bg-zinc-100 rounded-full appearance-none cursor-pointer accent-[var(--st-primary)] hover:scale-110 transition-transform"
                              />
                              <div 
                                className="mt-3 text-[11px] font-black transition-all flex flex-col items-center"
                                style={{ color: rating > 0 ? 'var(--st-primary)' : '#d1d5db' }}
                              >
                                <span className="text-sm">{rating}%</span>
                                <span className="text-[8px] opacity-60 tracking-[0.1em] font-black">IMPORTANCE</span>
                              </div>
                            </div>
                            {rating > 0 && (
                              <textarea 
                                placeholder="Add note..."
                                value={mappings[key]?.notes || ''}
                                onChange={(e) => updateNotes(courseId, skillId, e.target.value)}
                                className="w-[124px] px-3 py-2 bg-white/80 border border-zinc-100 rounded-xl text-[10px] font-bold text-[var(--st-text)] focus:ring-4 focus:ring-[var(--st-primary)]/5 transition-all outline-none min-h-[40px] resize-none animate-scale-in"
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
        </main>
      </div>
    );
  };

  if (formStep === 'IDENTITY') return renderIdentityStep();
  if (formStep === 'SELECTION') return renderSelectionStep();
  return renderMappingStep();
}

export default SurveyPage;


