import React, { useContext, useMemo, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import { useToast } from './ui/Toast';
import { CalendarDays, GripVertical, Search } from 'lucide-react';

export default function WorkKanban() {
  const { tasks, workOptions, updateTask, projects } = useContext(ClinicContext);
  const [groupBy, setGroupBy] = useState('status');
  const [projectFilter, setProjectFilter] = useState('');
  const [search, setSearch] = useState('');
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
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

  const getOptions = (type) => (workOptions || [])
    .filter(o => o.option_type === type && o.is_active)
    .sort((a,b) => a.sort_order - b.sort_order)
    .map(o => ({ ...o, label: systemOptionLabel(type, o.value, o.label) }));

  const statuses = useMemo(() => {
    const configured = getOptions('status');
    return configured.length ? configured : [
      { value:'todo', label:t('To Do','לביצוע'), color:'#64748b' },
      { value:'in_progress', label:t('In Progress','בתהליך'), color:'#3b82f6' },
      { value:'blocked', label:t('Blocked','חסום'), color:'#f43f5e' },
      { value:'done', label:t('Done','הושלם'), color:'#8b5cf6' }
    ];
  }, [workOptions, language]);

  const priorities = useMemo(() => {
    const configured = getOptions('priority');
    return configured.length ? configured : [
      { value:'critical', label:t('Critical','קריטי'), color:'#e11d48' },
      { value:'high', label:t('High','גבוה'), color:'#f97316' },
      { value:'medium', label:t('Medium','בינוני'), color:'#3b82f6' },
      { value:'low', label:t('Low','נמוך'), color:'#94a3b8' }
    ];
  }, [workOptions, language]);

  const filteredTasks = useMemo(() => tasks.filter(task => {
    if (projectFilter && task.project_id !== projectFilter) return false;
    if (search && !String(task.title || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [tasks, projectFilter, search]);

  const groups = useMemo(() => {
    if (groupBy === 'status') return statuses;
    if (groupBy === 'priority') return priorities;
    if (groupBy === 'area') return getOptions('area');
    if (groupBy === 'project') return [
      { value:'__none__', label:t('No Project','ללא פרויקט'), color:'#94a3b8' },
      ...projects.map(p => ({ value:p.id, label:p.name, color:p.color || '#64748b' }))
    ];
    return statuses;
  }, [groupBy, statuses, priorities, workOptions, projects, language]);

  const groupValueForTask = (task) => {
    if (groupBy === 'status') return task.status || 'todo';
    if (groupBy === 'priority') return task.priority || 'medium';
    if (groupBy === 'area') return task.area || 'operations';
    if (groupBy === 'project') return task.project_id || '__none__';
    return 'todo';
  };

  const sortedColumnTasks = (value) => filteredTasks
    .filter(task => groupValueForTask(task) === value)
    .sort((a,b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || new Date(a.created_at) - new Date(b.created_at));

  const patchForGroup = (value) => {
    if (groupBy === 'status') return { status: value };
    if (groupBy === 'priority') return { priority: value };
    if (groupBy === 'area') return { area: value };
    if (groupBy === 'project') return { project_id: value === '__none__' ? null : value };
    return {};
  };

  const persistOrder = async (orderedTasks, movedTask, targetGroup) => {
    const updates = orderedTasks.map((task, index) => {
      const patch = { sort_order: (index + 1) * 100 };
      if (task.id === movedTask.id) Object.assign(patch, patchForGroup(targetGroup));
      return updateTask(task.id, patch);
    });
    await Promise.all(updates);
  };

  const handleDrop = async (targetGroup, targetIndex) => {
    if (!draggedTaskId) return;
    const movedTask = tasks.find(task => task.id === draggedTaskId);
    if (!movedTask) return;

    const sourceGroup = groupValueForTask(movedTask);
    const targetTasks = sortedColumnTasks(targetGroup).filter(task => task.id !== movedTask.id);
    const safeIndex = Math.max(0, Math.min(targetIndex, targetTasks.length));
    targetTasks.splice(safeIndex, 0, movedTask);

    try {
      await persistOrder(targetTasks, movedTask, targetGroup);
      if (sourceGroup !== targetGroup) {
        const sourceTasks = sortedColumnTasks(sourceGroup).filter(task => task.id !== movedTask.id);
        await Promise.all(sourceTasks.map((task, index) => updateTask(task.id, { sort_order: (index + 1) * 100 })));
      }
      showToast(t('Task order updated','סדר המשימות עודכן'));
    } catch (err) {
      showToast(err.message || t('Could not reorder task','לא ניתן לסדר את המשימה'), 'error');
    } finally {
      setDraggedTaskId(null);
      setDropTarget(null);
    }
  };

  const updateField = async (task, field, value) => {
    try {
      await updateTask(task.id, { [field]: value });
    } catch (err) {
      showToast(err.message || t('Could not update task','לא ניתן לעדכן את המשימה'), 'error');
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-950">{t('Execution Board','לוח ביצוע')}</h2>
            <p className="mt-1 text-[11px] text-slate-500">{t('Drag tasks between groups or reorder them freely inside each column.','גרור משימות בין קבוצות או סדר אותן ידנית בתוך כל עמודה.')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={groupBy} onChange={e=>setGroupBy(e.target.value)} className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold">
              <option value="status">{t('Group by Status','קבץ לפי סטטוס')}</option>
              <option value="priority">{t('Group by Priority','קבץ לפי עדיפות')}</option>
              <option value="area">{t('Group by Area','קבץ לפי תחום')}</option>
              <option value="project">{t('Group by Project','קבץ לפי פרויקט')}</option>
            </select>
            <select value={projectFilter} onChange={e=>setProjectFilter(e.target.value)} className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold">
              <option value="">{t('All Projects','כל הפרויקטים')}</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label className="relative">
              <Search className="absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('Search tasks...','חיפוש משימות...')} className="h-9 min-w-[190px] rounded-xl border border-slate-200 bg-slate-50 ps-9 pe-3 text-xs outline-none focus:border-violet-400" />
            </label>
          </div>
        </div>
      </section>

      <div className="overflow-x-auto pb-3">
        <div className="grid min-w-max auto-cols-[300px] grid-flow-col gap-3">
          {groups.map(group => {
            const columnTasks = sortedColumnTasks(group.value);
            return (
              <section
                key={group.value}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80"
                onDragOver={e => e.preventDefault()}
                onDrop={() => handleDrop(group.value, columnTasks.length)}
              >
                <div className="flex items-center justify-between border-b border-slate-200 bg-white p-3.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: group.color || '#64748b'}} />
                    <span className="text-xs font-extrabold text-slate-900">{group.label}</span>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{columnTasks.length}</span>
                </div>

                <div className="min-h-[420px] space-y-2 p-2">
                  {columnTasks.map((task, index) => {
                    const project = projects.find(p => p.id === task.project_id);
                    const priority = priorities.find(p => p.value === (task.priority || 'medium'));
                    const overdue = task.due_date && task.status !== 'done' && task.due_date < new Date().toISOString().slice(0,10);
                    const isTarget = dropTarget === `${group.value}:${index}`;
                    return (
                      <React.Fragment key={task.id}>
                        <div
                          className={`h-1 rounded-full transition ${isTarget ? 'bg-violet-500' : 'bg-transparent'}`}
                          onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDropTarget(`${group.value}:${index}`); }}
                          onDrop={e => { e.preventDefault(); e.stopPropagation(); handleDrop(group.value, index); }}
                        />
                        <article
                          draggable
                          onDragStart={() => setDraggedTaskId(task.id)}
                          onDragEnd={() => { setDraggedTaskId(null); setDropTarget(null); }}
                          className={`group rounded-xl border bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${draggedTaskId === task.id ? 'opacity-45 ring-2 ring-violet-300' : 'border-slate-200'}`}
                        >
                          <div className="flex items-start gap-2">
                            <GripVertical className="mt-0.5 h-4 w-4 shrink-0 cursor-grab text-slate-300 group-hover:text-slate-500" />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-extrabold leading-5 text-slate-900">{task.title}</div>
                              {task.description && <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500">{task.description}</p>}
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <select
                              value={task.priority || 'medium'}
                              onChange={e => updateField(task, 'priority', e.target.value)}
                              onMouseDown={e => e.stopPropagation()}
                              className="h-7 min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold"
                              style={{ color: priority?.color || '#475569' }}
                            >
                              {priorities.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                            </select>
                            <label className={`flex h-7 items-center gap-1 rounded-lg border px-2 ${overdue ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                              <CalendarDays className="h-3 w-3" />
                              <input
                                type="date"
                                value={task.due_date || ''}
                                onChange={e => updateField(task, 'due_date', e.target.value)}
                                onMouseDown={e => e.stopPropagation()}
                                className="w-[92px] bg-transparent text-[9px] outline-none"
                              />
                            </label>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[9px] text-slate-400">
                            <span className="max-w-[160px] truncate">{project?.name || t('No Project','ללא פרויקט')}</span>
                            <span>{task.estimated_minutes ? `${task.estimated_minutes}m` : ''}</span>
                          </div>
                        </article>
                      </React.Fragment>
                    );
                  })}
                  <div
                    className={`h-2 rounded-full transition ${dropTarget === `${group.value}:${columnTasks.length}` ? 'bg-violet-500' : 'bg-transparent'}`}
                    onDragOver={e => { e.preventDefault(); e.stopPropagation(); setDropTarget(`${group.value}:${columnTasks.length}`); }}
                    onDrop={e => { e.preventDefault(); e.stopPropagation(); handleDrop(group.value, columnTasks.length); }}
                  />
                  {columnTasks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 py-10 text-center text-[11px] text-slate-400">
                      {t('Drop tasks here','גרור משימות לכאן')}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
