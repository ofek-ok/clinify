import React, { useContext, useMemo } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { useToast } from './ui/Toast';

export default function WorkKanban() {
  const { tasks, workOptions, updateTaskStatus, projects } = useContext(ClinicContext);
  const { showToast } = useToast();

  const statuses = useMemo(() => {
    const configured = (workOptions || [])
      .filter(o => o.option_type === 'status' && o.is_active)
      .sort((a,b) => a.sort_order - b.sort_order);
    if (configured.length) return configured;
    return [
      { value:'todo', label:'לביצוע', color:'#64748b' },
      { value:'in_progress', label:'בתהליך', color:'#3b82f6' },
      { value:'blocked', label:'חסום', color:'#f43f5e' },
      { value:'done', label:'הושלם', color:'#10b981' }
    ];
  }, [workOptions]);

  const moveTask = async (task, status) => {
    try {
      await updateTaskStatus(task.id, status);
      showToast('המשימה הועברה');
    } catch (err) {
      showToast(err.message || 'לא ניתן להעביר את המשימה', 'error');
    }
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid auto-cols-[280px] grid-flow-col gap-3 min-w-max">
        {statuses.map(status => {
          const columnTasks = tasks.filter(t => (t.status || 'todo') === status.value);
          return (
            <section key={status.value} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: status.color || '#64748b'}} />
                  <span className="text-xs font-bold text-slate-900">{status.label}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{columnTasks.length}</span>
              </div>
              <div className="p-2 space-y-2 min-h-[320px]">
                {columnTasks.map(task => {
                  const project = projects.find(p => p.id === task.project_id);
                  return (
                    <article key={task.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                      <div className="text-xs font-bold text-slate-900">{task.title}</div>
                      {task.description && <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{task.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {(task.labels || []).slice(0,3).map(label => <span key={label} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600">{label}</span>)}
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                        <span>{project?.name || 'ללא פרויקט'}</span>
                        <span>{task.due_date || '-'}</span>
                      </div>
                      <select
                        value={task.status || 'todo'}
                        onChange={e => moveTask(task, e.target.value)}
                        className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px]"
                      >
                        {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </article>
                  );
                })}
                {columnTasks.length === 0 && <div className="py-8 text-center text-[11px] text-slate-400">אין משימות</div>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
