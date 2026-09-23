import React, { useContext, useMemo, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import { useToast } from './ui/Toast';

export default function WorkKanban() {
  const { tasks, workOptions, updateTaskStatus, updateTask, projects } = useContext(ClinicContext);
  const [groupBy, setGroupBy] = useState('status');
  const [projectFilter, setProjectFilter] = useState('');
  const [search, setSearch] = useState('');
  const { showToast } = useToast();
  const { t, language } = useContext(LanguageContext);
  const systemOptionLabel = (type, value, fallback) => {
    const map = {
      status: {
        todo: { en: 'To Do', he: 'לביצוע' },
        in_progress: { en: 'In Progress', he: 'בתהליך' },
        blocked: { en: 'Blocked', he: 'חסום' },
        done: { en: 'Done', he: 'הושלם' }
      },
      priority: {
        critical: { en: 'Critical', he: 'קריטי' },
        high: { en: 'High', he: 'גבוה' },
        medium: { en: 'Medium', he: 'בינוני' },
        low: { en: 'Low', he: 'נמוך' }
      },
      area: {
        operations: { en: 'Operations', he: 'תפעול' },
        business: { en: 'Business', he: 'עסקי' },
        clinical: { en: 'Clinical', he: 'קליני' }
      }
    };
    const systemValue = map[type]?.[value];
    if (!systemValue) return fallback;
    const isSystemLabel = fallback === systemValue.he || fallback === systemValue.en;
    return isSystemLabel ? systemValue[language] : fallback;
  };

  const statuses = useMemo(() => {
    const configured = (workOptions || [])
      .filter(o => o.option_type === 'status' && o.is_active)
      .sort((a,b) => a.sort_order - b.sort_order)
      .map(o => ({ ...o, label: systemOptionLabel('status', o.value, o.label) }));
    if (configured.length) return configured;
    return [
      { value:'todo', label:t('To Do','לביצוע'), color:'#64748b' },
      { value:'in_progress', label:t('In Progress','בתהליך'), color:'#3b82f6' },
      { value:'blocked', label:t('Blocked','חסום'), color:'#f43f5e' },
      { value:'done', label:t('Done','הושלם'), color:'#8b5cf6' }
    ];
  }, [workOptions]);

  const getOptions = (type) => (workOptions || [])
    .filter(o => o.option_type === type && o.is_active)
    .sort((a,b) => a.sort_order - b.sort_order)
    .map(o => ({ ...o, label: systemOptionLabel(type, o.value, o.label) }));

  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (projectFilter && task.project_id !== projectFilter) return false;
    if (search && !String(task.title || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [tasks, projectFilter, search]);

  const groups = useMemo(() => {
    if (groupBy === 'status') return statuses;
    if (groupBy === 'priority') return getOptions('priority').map(o => ({...o}));
    if (groupBy === 'area') return getOptions('area').map(o => ({...o}));
    if (groupBy === 'project') return [
      { value:'__none__', label:t('No Project','ללא פרויקט'), color:'#94a3b8' },
      ...projects.map(p => ({ value:p.id, label:p.name, color:p.color || '#64748b' }))
    ];
    return statuses;
  }, [groupBy, statuses, workOptions, projects]);

  const moveTask = async (task, value) => {
    try {
      if (groupBy === 'status') await updateTaskStatus(task.id, value);
      if (groupBy === 'priority') await updateTask(task.id, { priority: value });
      if (groupBy === 'area') await updateTask(task.id, { area: value });
      if (groupBy === 'project') await updateTask(task.id, { project_id: value === '__none__' ? null : value });
      showToast(t('Task moved','המשימה הועברה'));
    } catch (err) {
      showToast(err.message || t('Could not move task','לא ניתן להעביר את המשימה'), 'error');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl p-3">
        <select value={groupBy} onChange={e=>setGroupBy(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
          <option value="status">{t('Group by Status','קבץ לפי סטטוס')}</option>
          <option value="priority">{t('Group by Priority','קבץ לפי עדיפות')}</option>
          <option value="area">{t('Group by Area','קבץ לפי תחום')}</option>
          <option value="project">{t('Group by Project','קבץ לפי פרויקט')}</option>
        </select>
        <select value={projectFilter} onChange={e=>setProjectFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
          <option value="">{t('All Projects','כל הפרויקטים')}</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t("Search...","חיפוש...")} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs min-w-[180px]" />
      </div>
      <div className="overflow-x-auto pb-2">
      <div className="grid auto-cols-[280px] grid-flow-col gap-3 min-w-max">
        {groups.map(status => {
          const columnTasks = filteredTasks.filter(t => {
            if (groupBy === 'status') return (t.status || 'todo') === status.value;
            if (groupBy === 'priority') return (t.priority || 'medium') === status.value;
            if (groupBy === 'area') return (t.area || 'operations') === status.value;
            if (groupBy === 'project') return (t.project_id || '__none__') === status.value;
            return false;
          });
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
                        <span>{project?.name || t('No Project','ללא פרויקט')}</span>
                        <span>{task.due_date || '-'}</span>
                      </div>
                      <select
                        value={groupBy === 'status' ? (task.status || 'todo') : groupBy === 'priority' ? (task.priority || 'medium') : groupBy === 'area' ? (task.area || 'operations') : (task.project_id || '__none__')}
                        onChange={e => moveTask(task, e.target.value)}
                        className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px]"
                      >
                        {groups.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </article>
                  );
                })}
                {columnTasks.length === 0 && <div className="py-8 text-center text-[11px] text-slate-400">{t('No tasks','אין משימות')}</div>}
              </div>
            </section>
          );
        })}
      </div>
      </div>
    </div>
  );
}
