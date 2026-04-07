import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const statConfig = [
  {
    label: 'Total Courses',
    key: 'courses',
    to: '/admin/courses',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    color: 'violet',
  },
  {
    label: 'Total Skills',
    key: 'skills',
    to: '/admin/skills',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    color: 'blue',
  },
  {
    label: 'Total Surveys',
    key: 'surveys',
    to: '/admin/surveys',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
    color: 'emerald',
  },
  {
    label: 'Total Experts',
    key: 'experts',
    to: '/admin/experts',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    color: 'amber',
  },
];

const colorMap = {
  violet: { bg: 'bg-violet-100 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' },
  blue: { bg: 'bg-blue-100 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
  emerald: { bg: 'bg-emerald-100 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
  amber: { bg: 'bg-amber-100 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
};

function AdminDashboard() {
  const [stats, setStats] = useState({ courses: 0, skills: 0, surveys: 0, experts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [courses, skills, surveys, experts] = await Promise.all([
          api.get('/courses'), api.get('/skills'), api.get('/surveys'), api.get('/experts'),
        ]);
        setStats({
          courses: courses.data.length,
          skills: skills.data.length,
          surveys: surveys.data.length,
          experts: experts.data.length,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="animate-fade-in space-y-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black text-[var(--st-text)] tracking-tight">Curator Studio</h1>
        <p className="text-base text-[var(--st-text-variant)] font-bold uppercase tracking-[0.2em] opacity-60">Platform Intelligence Overview</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="tonal-card p-8 animate-pulse">
              <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 mb-6" />
              <div className="h-10 w-20 bg-zinc-100 dark:bg-zinc-800 rounded mb-3" />
              <div className="h-5 w-28 bg-zinc-100 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statConfig.map(stat => {
            return (
              <Link
                key={stat.key}
                to={stat.to}
                className="tonal-card p-8 group transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl prim-tonal-bg text-[var(--st-primary)] flex items-center justify-center transition-all duration-500 group-hover:primary-gradient group-hover:text-white group-hover:shadow-lg group-hover:shadow-violet-500/20">
                    <span className="scale-125">{stat.icon}</span>
                  </div>
                  <svg className="w-5 h-5 text-zinc-300 group-hover:text-[var(--st-primary)] group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
                <p className="text-4xl font-black text-[var(--st-text)] tracking-tighter mb-1">{stats[stat.key]}</p>
                <p className="text-sm font-bold text-[var(--st-text-variant)] uppercase tracking-widest opacity-60">{stat.label}</p>
              </Link>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 tonal-card p-10">
          <div className="mb-8 overflow-hidden">
            <h2 className="text-2xl font-black text-[var(--st-text)] tracking-tight mb-2">Workspace Setup</h2>
            <p className="text-base text-[var(--st-text-variant)] leading-relaxed max-w-lg">Follow the curator protocol to initialize your academic mapping platform.</p>
          </div>
          
          <div className="grid gap-2">
            {[
              { step: 1, title: 'Course Catalog', desc: 'Import academic courses and metadata', to: '/admin/courses', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /> },
              { step: 2, title: 'Skill Taxonomy', desc: 'Define technical skills and outcomes', to: '/admin/skills', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /> },
              { step: 3, title: 'Survey Mapping', desc: 'Create matrix for course-to-skill mapping', to: '/admin/surveys', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /> },
              { step: 4, title: 'Expert Invitations', desc: 'Securely authenticate and invite curators', to: '/admin/experts', icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /> },
            ].map(item => (
              <Link
                key={item.step}
                to={item.to}
                className="tonal-row flex items-center gap-6 p-6 group"
              >
                <div className="w-12 h-12 rounded-2xl prim-tonal-bg text-[var(--st-primary)] flex items-center justify-center text-lg font-black shrink-0 shadow-sm transition-all duration-300 group-hover:scale-110">
                  {item.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] font-black text-[var(--st-text)] tracking-tight group-hover:text-[var(--st-primary)] transition-colors">{item.title}</p>
                  <p className="text-sm text-[var(--st-text-variant)] font-medium opacity-70">{item.desc}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                  <svg className="w-5 h-5 text-[var(--st-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="primary-gradient p-10 rounded-[var(--st-radius-lg)] text-white shadow-2xl shadow-violet-500/20">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-8 backdrop-blur-md">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black mb-4 tracking-tight leading-tight">Digital Curator Intelligence</h3>
          <p className="text-white/80 font-medium leading-relaxed mb-8">Your platform is currently tracking <span className="text-white font-black underline decoration-2 underline-offset-4">{stats.skills} skills</span> across <span className="text-white font-black underline decoration-2 underline-offset-4">{stats.courses} academic courses</span>.</p>
          <div className="space-y-4">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white w-[65%] rounded-full shadow-[0_0_12px_rgba(255,255,255,0.5)]"></div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">System Stability: Optimal</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
