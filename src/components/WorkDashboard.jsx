import React, { useContext, useMemo } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { CheckCircle2, Clock3, AlertTriangle, FolderKanban } from 'lucide-react';

export default function WorkDashboard() {
  const { tasks, projects, todayStr } = useContext(ClinicContext);

  const metrics = useMemo(() => {
    const open = tasks.filter(t => t.status !== 'done');
    return {
      open: open.length,
      overdue: open.filter(t => t.due_date && t.due_date < todayStr).length,
      blocked: open.filter(t => t.status === 'blocked').length,
      projects: projects.filter(p => p.status !== 'completed').length
    };
  }, [tasks, projects, todayStr]);

  const upcoming = useMemo(() => tasks
    .filter(t => t.status !== 'done' && t.due_date)
    .sort((a,b) => String(a.due_date).localeCompare(String(b.due_date)))
    .slice(0, 8), [tasks]);

  const cards = [
    ['משימות פתוחות', metrics.open, Clock3],
    ['באיחור', metrics.overdue, AlertTriangle],
    ['חסומות', metrics.blocked, AlertTriangle],
    ['פרויקטים פעילים', metrics.projects, FolderKanban]
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map(([label,value,Icon]) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{label}</span>
              <Icon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-bold text-sm mb-3">המשימות הקרובות</h3>
          <div className="space-y-2">
            {upcoming.map(t => (
              <div key={t.id} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-50">
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{t.title}</div>
                  <div className="text-[10px] text-slate-500">{t.priority || 'medium'} · {t.status}</div>
                </div>
                <span className={`text-[11px] font-mono ${t.due_date < todayStr ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>{t.due_date}</span>
              </div>
            ))}
            {upcoming.length === 0 && <p className="text-xs text-slate-500 py-5 text-center">אין משימות קרובות.</p>}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <h3 className="font-bold text-sm mb-3">מצב פרויקטים</h3>
          <div className="space-y-3">
            {projects.filter(p => p.status !== 'completed').slice(0,8).map(p => {
              const pt = tasks.filter(t => t.project_id === p.id);
              const done = pt.filter(t => t.status === 'done').length;
              const pct = pt.length ? Math.round(done / pt.length * 100) : Number(p.progress || 0);
              return <div key={p.id}>
                <div className="flex justify-between text-xs mb-1"><span className="font-bold">{p.name}</span><span>{pct}%</span></div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-violet-500" style={{width:`${pct}%`}} /></div>
              </div>;
            })}
            {projects.filter(p => p.status !== 'completed').length === 0 && <p className="text-xs text-slate-500 py-5 text-center">אין פרויקטים פעילים.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
