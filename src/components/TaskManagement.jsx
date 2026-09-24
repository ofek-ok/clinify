import React, { useContext, useMemo, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import Drawer from './ui/Drawer';
import ConfirmModal from './ui/ConfirmModal';
import { useToast } from './ui/Toast';
import {
  Search,
  Plus,
  Trash2,
  SlidersHorizontal,
  X,
  CalendarDays,
  Tag,
  FolderKanban
} from 'lucide-react';

export default function TaskManagement() {
  const {
    tasks,
    projects,
    patients,
    contentItems,
    addTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    workOptions,
    todayStr
  } = useContext(ClinicContext);

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

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleteModalTask, setDeleteModalTask] = useState(null);

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(todayStr);
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [area, setArea] = useState('operations');
  const [projectId, setProjectId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [contentItemId, setContentItemId] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [labels, setLabels] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [costAmount, setCostAmount] = useState('');
  const [dependencyTaskId, setDependencyTaskId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const configuredOptions = (type, fallback) => {
    const values = (workOptions || [])
      .filter(option => option.option_type === type && option.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(option => ({ id: option.value, label: systemOptionLabel(type, option.value, option.label), color: option.color || '#64748b' }));
    return values.length ? values : fallback;
  };

  const statusOptions = configuredOptions('status', [
    { id: 'todo', label: t('To Do','לביצוע'), color: '#64748b' },
    { id: 'in_progress', label: t('In Progress','בתהליך'), color: '#3b82f6' },
    { id: 'blocked', label: t('Blocked','חסום'), color: '#f43f5e' },
    { id: 'done', label: t('Done','הושלם'), color: '#8b5cf6' }
  ]);

  const priorityOptions = configuredOptions('priority', [
    { id: 'critical', label: t('Critical','קריטי'), color: '#e11d48' },
    { id: 'high', label: t('High','גבוה'), color: '#f59e0b' },
    { id: 'medium', label: t('Medium','בינוני'), color: '#3b82f6' },
    { id: 'low', label: t('Low','נמוך'), color: '#64748b' }
  ]);

  const areaOptions = configuredOptions('area', [
    { id: 'operations', label: t('Operations','תפעול'), color: '#64748b' },
    { id: 'business', label: t('Business','עסקי'), color: '#8b5cf6' },
    { id: 'clinical', label: t('Clinical','קליני'), color: '#8b5cf6' }
  ]);

  const managedLabels = configuredOptions('label', []);

  const optionLabel = (options, value, fallback = '-') =>
    options.find(option => option.id === value)?.label || fallback;

  const optionColor = (options, value) =>
    options.find(option => option.id === value)?.color || '#64748b';

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch =
        !searchTerm ||
        String(task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(task.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (projectFilter && task.project_id !== projectFilter) return false;
      if (statusFilter && task.status !== statusFilter) return false;
      if (priorityFilter && task.priority !== priorityFilter) return false;
      if (areaFilter && task.area !== areaFilter) return false;

      if (filterMode === 'today') return task.due_date === todayStr && task.status !== 'done';
      if (filterMode === 'overdue') return task.due_date && task.due_date < todayStr && task.status !== 'done';
      if (filterMode === 'blocked') return task.status === 'blocked';
      if (filterMode === 'week') {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date + 'T12:00:00');
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 86400000);
        return taskDate >= now && taskDate <= nextWeek && task.status !== 'done';
      }
      return true;
    });
  }, [tasks, searchTerm, projectFilter, statusFilter, priorityFilter, areaFilter, filterMode, todayStr]);

  const activeAdvancedFilterCount = [projectFilter, statusFilter, priorityFilter, areaFilter].filter(Boolean).length;

  const resetAdvancedFilters = () => {
    setProjectFilter('');
    setStatusFilter('');
    setPriorityFilter('');
    setAreaFilter('');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast(t('Please enter a task title','אנא הזן כותרת משימה'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addTask({
        title: title.trim(),
        due_date: dueDate || todayStr,
        status,
        priority,
        area,
        project_id: projectId || null,
        patient_id: patientId || null,
        content_item_id: contentItemId || null,
        description: description.trim() || null,
        start_date: startDate || null,
        labels: labels.split(',').map(v => v.trim()).filter(Boolean),
        estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : null,
        cost_amount: costAmount ? Number(costAmount) : 0,
        dependency_task_id: dependencyTaskId || null
      });

      showToast(t('Task created successfully','המשימה נוצרה בהצלחה'));
      setIsAddDrawerOpen(false);
      setTitle('');
      setDescription('');
      setLabels('');
      setEstimatedMinutes('');
      setCostAmount('');
      setDependencyTaskId('');
    } catch (err) {
      showToast(err.message || t('Could not create task','שגיאה ביצירת המשימה'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSelectedTaskField = async (field, value) => {
    if (!selectedTask) return;
    try {
      const updates = { [field]: value };
      await updateTask(selectedTask.id, updates);
      setSelectedTask(prev => ({ ...prev, ...updates }));
    } catch (err) {
      showToast(err.message || t('Could not update task','לא ניתן לעדכן את המשימה'), 'error');
    }
  };

  const handleInlineStatusChange = async (task, newStatus) => {
    try {
      await updateTaskStatus(task.id, newStatus);
      if (selectedTask?.id === task.id) {
        setSelectedTask(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      showToast(t('Could not update status','שגיאה בעדכון סטטוס'), 'error');
    }
  };

  const handleInlinePriorityChange = async (task, newPriority) => {
    try {
      await updateTask(task.id, { priority: newPriority });
      if (selectedTask?.id === task.id) {
        setSelectedTask(prev => ({ ...prev, priority: newPriority }));
      }
    } catch (err) {
      showToast(t('Could not update priority','שגיאה בעדכון עדיפות'), 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalTask) return;
    try {
      await deleteTask(deleteModalTask.id);
      showToast(t('Task moved to Trash','המשימה הועברה לאשפה'));
      if (selectedTask?.id === deleteModalTask.id) setSelectedTask(null);
    } catch (err) {
      showToast(err.message || t('Could not move task to Trash','שגיאה במחיקת המשימה'), 'error');
    } finally {
      setDeleteModalTask(null);
    }
  };

  const resolveRelatedEntity = (task) => {
    if (task.patient_id) {
      const patient = patients.find(item => item.id === task.patient_id);
      return patient ? patient.full_name : t('Client','לקוח');
    }
    if (task.content_item_id) {
      const item = contentItems.find(content => content.id === task.content_item_id);
      return item ? item.title : t('Content','תוכן');
    }
    return '-';
  };

  const quickFilters = [
    { id: 'all', label: t('All','הכול') },
    { id: 'today', label: t('Today','היום') },
    { id: 'week', label: t('This Week','השבוע') },
    { id: 'overdue', label: t('Overdue','באיחור') },
    { id: 'blocked', label: t('Blocked','חסום') }
  ];

  return (
    <div className="space-y-4 text-start">
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1 lg:max-w-sm">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t("Search tasks...","חיפוש משימה...")}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pr-9 pl-3 text-xs text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
              />
            </div>

            <div className="flex min-w-0 items-center gap-1 overflow-x-auto rounded-xl bg-slate-100/80 p-1">
              {quickFilters.map(filter => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setFilterMode(filter.id)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-[11px] font-bold transition ${filterMode === filter.id ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(prev => !prev)}
              className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-bold transition ${showAdvancedFilters || activeAdvancedFilterCount ? 'border-violet-200 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t('Filter','סינון')}
              {activeAdvancedFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] text-white">
                  {activeAdvancedFilterCount}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsAddDrawerOpen(true)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-600 hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            {t('New Task','משימה חדשה')}
          </button>
        </div>

        {showAdvancedFilters && (
          <div className="border-t border-slate-100 bg-slate-50/70 p-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <FilterSelect label={t("Project","פרויקט")} value={projectFilter} onChange={setProjectFilter}>
                <option value="">{t("All Projects","כל הפרויקטים")}</option>
                {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
              </FilterSelect>

              <FilterSelect label={t("Status","סטטוס")} value={statusFilter} onChange={setStatusFilter}>
                <option value="">{t("All Statuses","כל הסטטוסים")}</option>
                {statusOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
              </FilterSelect>

              <FilterSelect label={t("Priority","עדיפות")} value={priorityFilter} onChange={setPriorityFilter}>
                <option value="">{t("All Priorities","כל העדיפויות")}</option>
                {priorityOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
              </FilterSelect>

              <FilterSelect label={t("Area","תחום")} value={areaFilter} onChange={setAreaFilter}>
                <option value="">{t("All Areas","כל התחומים")}</option>
                {areaOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
              </FilterSelect>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={resetAdvancedFilters}
                  disabled={!activeAdvancedFilterCount}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X className="h-4 w-4" />
                  {t('Clear Filters','נקה סינון')}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <p className="text-xs font-bold text-slate-900">{filteredTasks.length} {t('tasks','משימות')}</p>
            <p className="mt-0.5 text-[10px] text-slate-400">{t('Edit directly from the table','עריכה ישירה מתוך הטבלה')}</p>
          </div>
          <div className="hidden items-center gap-2 text-[10px] text-slate-400 sm:flex">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            {t('Changes save automatically','השינויים נשמרים אוטומטית')}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-start">
            <thead className="bg-slate-50/90">
              <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 text-start">{t('Task','משימה')}</th>
                <th className="px-3 py-3 text-start">{t('Status','סטטוס')}</th>
                <th className="px-3 py-3 text-start">{t('Priority','עדיפות')}</th>
                <th className="px-3 py-3 text-start">{t('Project','פרויקט')}</th>
                <th className="px-3 py-3 text-start">{t('Due Date','תאריך יעד')}</th>
                <th className="px-3 py-3 text-start">{t('Cost','עלות')}</th>
                <th className="px-3 py-3 text-start">{t('Related To','קשור ל־')}</th>
                <th className="px-3 py-3 text-start">{t('Area','תחום')}</th>
                <th className="px-3 py-3 text-start">{t('Labels','תגיות')}</th>
                <th className="sticky left-0 bg-slate-50/95 px-3 py-3 text-center">{t('Actions','פעולות')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                        <FolderKanban className="h-5 w-5 text-slate-400" />
                      </div>
                      <p className="font-bold text-slate-700">{t('No tasks to display','אין משימות להצגה')}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{t('Try changing the filters or create a new task.','נסה לשנות את הסינון או ליצור משימה חדשה.')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  const isOverdue = task.due_date && task.due_date < todayStr && task.status !== 'done';
                  const isDone = task.status === 'done';

                  return (
                    <tr
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="group cursor-pointer transition hover:bg-slate-50/80"
                    >
                      <td className="max-w-[280px] px-4 py-3.5">
                        <div className="flex items-start gap-3">
                          <span
                            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: optionColor(statusOptions, task.status || 'todo') }}
                          />
                          <div className="min-w-0">
                            <p className={`truncate font-bold ${isDone ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="mt-1 max-w-[240px] truncate text-[10px] text-slate-400">{task.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <ChipSelect
                          value={task.status || 'todo'}
                          options={statusOptions}
                          onChange={value => handleInlineStatusChange(task, value)}
                        />
                      </td>

                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <ChipSelect
                          value={task.priority || 'medium'}
                          options={priorityOptions}
                          onChange={value => handleInlinePriorityChange(task, value)}
                        />
                      </td>

                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <select
                          value={task.project_id || ''}
                          onChange={e => updateTask(task.id, { project_id: e.target.value || null })}
                          className="h-8 max-w-[190px] rounded-lg border border-transparent bg-transparent px-2 text-[11px] font-medium text-slate-600 outline-none transition hover:border-slate-200 hover:bg-white focus:border-violet-300"
                        >
                          <option value="">{t("No Project","ללא פרויקט")}</option>
                          {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                        </select>
                      </td>

                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <div className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 ${isOverdue ? 'bg-rose-50 text-rose-700' : 'text-slate-500'}`}>
                          <CalendarDays className="h-3.5 w-3.5" />
                          <input
                            type="date"
                            value={task.due_date || ''}
                            onChange={e => updateTask(task.id, { due_date: e.target.value })}
                            className="w-[105px] bg-transparent text-[11px] outline-none"
                          />
                        </div>
                      </td>

                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <div className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-2 text-[10px] text-slate-600">
                          <span className="me-1 text-slate-400">₪</span>
                          <input type="number" min="0" step="1" value={task.cost_amount || ''} onChange={e => updateTask(task.id, { cost_amount: Number(e.target.value || 0) })} className="w-20 bg-transparent outline-none" />
                        </div>
                      </td>

                      <td className="px-3 py-3 text-[11px] text-slate-500">{resolveRelatedEntity(task)}</td>

                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <ChipSelect
                          value={task.area || 'operations'}
                          options={areaOptions}
                          onChange={value => updateTask(task.id, { area: value })}
                        />
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex max-w-[180px] flex-wrap gap-1">
                          {(task.labels || []).slice(0, 3).map(label => (
                            <span key={label} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-1 text-[9px] font-semibold text-slate-600">
                              <Tag className="h-2.5 w-2.5" />
                              {label}
                            </span>
                          ))}
                          {(task.labels || []).length > 3 && (
                            <span className="rounded-md bg-slate-100 px-1.5 py-1 text-[9px] font-semibold text-slate-400">
                              +{task.labels.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="sticky left-0 bg-white/95 px-3 py-3 text-center backdrop-blur group-hover:bg-slate-50/95" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          title={t("Move to Trash","העבר לאשפה")}
                          onClick={() => setDeleteModalTask(task)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title={t("New Task","משימה חדשה")}
        width="max-w-xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsAddDrawerOpen(false)}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {t('Cancel','ביטול')}
            </button>
            <button
              type="button"
              onClick={handleCreateTask}
              disabled={isSubmitting}
              className="rounded-xl bg-slate-950 px-5 py-2 text-xs font-bold text-white transition hover:bg-violet-600 disabled:opacity-50"
            >
              {isSubmitting ? t('Saving...','שומר...') : t('Create Task','צור משימה')}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateTask} className="space-y-5">
          <Field label={t("Task Title *","כותרת משימה *")}>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t("What needs to happen?","מה צריך לקרות?")}
              className="work-input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Status","סטטוס")}>
              <select value={status} onChange={e => setStatus(e.target.value)} className="work-input">
                {statusOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </Field>
            <Field label={t("Priority","עדיפות")}>
              <select value={priority} onChange={e => setPriority(e.target.value)} className="work-input">
                {priorityOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </Field>
          </div>

          <Field label={t("Description","תיאור")}>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t("Details, desired outcome, notes...","פרטים, תוצאה רצויה, הערות...")}
              className="work-input resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Start Date","תאריך התחלה")}>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="work-input" />
            </Field>
            <Field label={t("Due Date","תאריך יעד")}>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="work-input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Area","תחום")}>
              <select value={area} onChange={e => setArea(e.target.value)} className="work-input">
                {areaOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </Field>
            <Field label={t("Time Estimate","הערכת זמן")}>
              <input type="number" min="0" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} placeholder={t("60 minutes","60 דקות")} className="work-input" />
            </Field>
            <Field label={t("Cost (₪)","עלות (₪)")}>
              <input type="number" min="0" step="1" value={costAmount} onChange={e => setCostAmount(e.target.value)} placeholder="0" className="work-input" />
            </Field>
          </div>

          <Field label={t("Labels","תגיות")}>
            <input
              list="managed-work-labels"
              value={labels}
              onChange={e => setLabels(e.target.value)}
              placeholder={t("e.g. marketing, urgent, website","למשל: שיווק, דחוף, אתר")}
              className="work-input"
            />
            <datalist id="managed-work-labels">
              {managedLabels.map(option => <option key={option.id} value={option.label} />)}
            </datalist>
          </Field>

          <Field label={t("Project","פרויקט")}>
            <select value={projectId} onChange={e => setProjectId(e.target.value)} className="work-input">
              <option value="">{t("No Project","ללא פרויקט")}</option>
              {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </Field>

          <Field label={t("Depends on Task","תלויה במשימה")}>
            <select value={dependencyTaskId} onChange={e => setDependencyTaskId(e.target.value)} className="work-input">
              <option value="">{t("No Dependency","ללא תלות")}</option>
              {tasks.filter(task => task.status !== 'done').map(task => <option key={task.id} value={task.id}>{task.title}</option>)}
            </select>
          </Field>

          <Field label={t("Related Client","קשור ללקוח")}>
            <select value={patientId} onChange={e => setPatientId(e.target.value)} className="work-input">
              <option value="">{t("No Client","ללא שיוך ללקוח")}</option>
              {patients.map(patient => <option key={patient.id} value={patient.id}>{patient.full_name}</option>)}
            </select>
          </Field>
        </form>
      </Drawer>

      <Drawer
        isOpen={Boolean(selectedTask)}
        onClose={() => setSelectedTask(null)}
        title={selectedTask ? selectedTask.title : ''}
        width="max-w-xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => selectedTask && setDeleteModalTask(selectedTask)}
              className="mr-auto inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
            >
              <Trash2 className="h-4 w-4" />
              {t('Move to Trash','העבר לאשפה')}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTask(null)}
              className="rounded-xl bg-slate-950 px-5 py-2 text-xs font-bold text-white transition hover:bg-violet-600"
            >
              {t('Close','סגור')}
            </button>
          </>
        }
      >
        {selectedTask && (
          <div className="space-y-5">
            <Field label={t("Task Title","כותרת משימה")}>
              <input
                type="text"
                value={selectedTask.title || ''}
                onChange={e => {
                  const value = e.target.value;
                  setSelectedTask(prev => ({ ...prev, title: value }));
                }}
                onBlur={e => updateSelectedTaskField('title', e.target.value)}
                className="work-input text-sm font-bold"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("Status","סטטוס")}>
                <select
                  value={selectedTask.status || 'todo'}
                  onChange={e => handleInlineStatusChange(selectedTask, e.target.value)}
                  className="work-input"
                >
                  {statusOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </Field>
              <Field label={t("Priority","עדיפות")}>
                <select
                  value={selectedTask.priority || 'medium'}
                  onChange={e => handleInlinePriorityChange(selectedTask, e.target.value)}
                  className="work-input"
                >
                  {priorityOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </Field>
            </div>

            <Field label={t("Description","תיאור")}>
              <textarea
                rows={5}
                value={selectedTask.description || ''}
                onChange={e => setSelectedTask(prev => ({ ...prev, description: e.target.value }))}
                onBlur={e => updateSelectedTaskField('description', e.target.value || null)}
                className="work-input resize-none"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("Start Date","תאריך התחלה")}>
                <input
                  type="date"
                  value={selectedTask.start_date || ''}
                  onChange={e => updateSelectedTaskField('start_date', e.target.value || null)}
                  className="work-input"
                />
              </Field>
              <Field label={t("Due Date","תאריך יעד")}>
                <input
                  type="date"
                  value={selectedTask.due_date || ''}
                  onChange={e => updateSelectedTaskField('due_date', e.target.value)}
                  className="work-input"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("Project","פרויקט")}>
                <select
                  value={selectedTask.project_id || ''}
                  onChange={e => updateSelectedTaskField('project_id', e.target.value || null)}
                  className="work-input"
                >
                  <option value="">{t("No Project","ללא פרויקט")}</option>
                  {projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </Field>
              <Field label={t("Area","תחום")}>
                <select
                  value={selectedTask.area || 'operations'}
                  onChange={e => updateSelectedTaskField('area', e.target.value)}
                  className="work-input"
                >
                  {areaOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t("Time Estimate","הערכת זמן")}>
                <input
                  type="number"
                  min="0"
                  value={selectedTask.estimated_minutes || ''}
                  onChange={e => updateSelectedTaskField('estimated_minutes', e.target.value ? Number(e.target.value) : null)}
                  className="work-input"
                />
              </Field>
              <Field label={t("Cost (₪)","עלות (₪)")}>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={selectedTask.cost_amount || ''}
                  onChange={e => updateSelectedTaskField('cost_amount', Number(e.target.value || 0))}
                  className="work-input"
                />
              </Field>
              <Field label={t("Labels","תגיות")}>
                <input
                  value={(selectedTask.labels || []).join(', ')}
                  onChange={e => setSelectedTask(prev => ({
                    ...prev,
                    labels: e.target.value.split(',').map(value => value.trim()).filter(Boolean)
                  }))}
                  onBlur={() => updateSelectedTaskField('labels', selectedTask.labels || [])}
                  className="work-input"
                />
              </Field>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500">
              {t('Status:','סטטוס:')} <strong className="text-slate-700">{optionLabel(statusOptions, selectedTask.status, t('To Do','לביצוע'))}</strong>
              {' · '}
              {t('Priority:','עדיפות:')} <strong className="text-slate-700">{optionLabel(priorityOptions, selectedTask.priority, t('Medium','בינוני'))}</strong>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmModal
        isOpen={Boolean(deleteModalTask)}
        onClose={() => setDeleteModalTask(null)}
        onConfirm={handleConfirmDelete}
        title={t("Move task to Trash?","להעביר את המשימה לאשפה?")}
        message={deleteModalTask ? t(`Task “${deleteModalTask.title}” will be removed from the board and remain available in Trash.`, `המשימה “${deleteModalTask.title}” תוסר מהלוח ותישאר זמינה לשחזור באשפה.`) : ''}
        confirmText={t("Move to Trash","העבר לאשפה")}
        cancelText={t("Cancel","ביטול")}
        isDanger
      />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold text-slate-400">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
      >
        {children}
      </select>
    </label>
  );
}

function ChipSelect({ value, options, onChange }) {
  const selected = options.find(option => option.id === value) || options[0];

  return (
    <div className="relative inline-flex">
      <span
        className="pointer-events-none absolute right-2 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
        style={{ backgroundColor: selected?.color || '#64748b' }}
      />
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-8 min-w-[96px] appearance-none rounded-lg border border-slate-200 bg-white pr-6 pl-6 text-[10px] font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-violet-400"
      >
        {options.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </div>
  );
}
