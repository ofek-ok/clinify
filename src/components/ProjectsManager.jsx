import React, { useContext, useMemo, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import Drawer from './ui/Drawer';
import ConfirmModal from './ui/ConfirmModal';
import { useToast } from './ui/Toast';
import { CalendarDays, ChevronRight, CirclePlus, FolderKanban, Plus, Trash2 } from 'lucide-react';

export default function ProjectsManager() {
  const {
    projects, tasks, addProject, updateProject, deleteProject,
    addTask, updateTask, deleteTask, workOptions, todayStr
  } = useContext(ClinicContext);
  const { showToast } = useToast();
  const { t, language } = useContext(LanguageContext);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [deleteModalProj, setDeleteModalProj] = useState(null);
  const [deleteModalTask, setDeleteModalTask] = useState(null);
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [area, setArea] = useState('business');
  const [status, setStatus] = useState('active');
  const [startDate, setStartDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState('');
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectStatusFilter, setProjectStatusFilter] = useState('all');

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

  const systemOptionLabel = (type, value, fallback) => {
    const map = {
      status: {
        todo: { en:'To Do', he:'לביצוע' }, in_progress: { en:'In Progress', he:'בתהליך' },
        blocked: { en:'Blocked', he:'חסום' }, done: { en:'Done', he:'הושלם' }
      },
      priority: {
        critical: { en:'Critical', he:'קריטי' }, high: { en:'High', he:'גבוה' },
        medium: { en:'Medium', he:'בינוני' }, low: { en:'Low', he:'נמוך' }
      }
    };
    const v = map[type]?.[value];
    return v && (fallback === v.he || fallback === v.en) ? v[language] : fallback;
  };

  const optionSet = (type, fallback) => {
    const configured = (workOptions || []).filter(o => o.option_type === type && o.is_active)
      .sort((a,b) => a.sort_order - b.sort_order)
      .map(o => ({ value:o.value, label:systemOptionLabel(type,o.value,o.label), color:o.color }));
    return configured.length ? configured : fallback;
  };

  const statusOptions = useMemo(() => optionSet('status', [
    {value:'todo',label:t('To Do','לביצוע'),color:'#64748b'},
    {value:'in_progress',label:t('In Progress','בתהליך'),color:'#3b82f6'},
    {value:'blocked',label:t('Blocked','חסום'),color:'#f43f5e'},
    {value:'done',label:t('Done','הושלם'),color:'#8b5cf6'}
  ]), [workOptions, language]);

  const priorityOptions = useMemo(() => optionSet('priority', [
    {value:'critical',label:t('Critical','קריטי'),color:'#e11d48'},
    {value:'high',label:t('High','גבוה'),color:'#f97316'},
    {value:'medium',label:t('Medium','בינוני'),color:'#3b82f6'},
    {value:'low',label:t('Low','נמוך'),color:'#94a3b8'}
  ]), [workOptions, language]);

  const projectTasks = (projectId) => tasks
    .filter(task => task.project_id === projectId)
    .sort((a,b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || String(a.due_date || '9999').localeCompare(String(b.due_date || '9999')));

  const progressFor = (projectId) => {
    const list = projectTasks(projectId);
    const done = list.filter(task => task.status === 'done').length;
    return { total:list.length, done, pct:list.length ? Math.round(done / list.length * 100) : 0 };
  };

  const projectCost = (projectId) =>
    projectTasks(projectId).reduce((sum, task) => sum + Number(task.cost_amount || 0), 0);

  const projectStatusLabel = (value) =>
    value === 'planned' ? t('To Do','לביצוע') :
    value === 'active' ? t('In Progress','בתהליך') :
    value === 'blocked' ? t('On Hold','מושהה') :
    t('Completed','הושלם');

  const filteredProjects = projects.filter(project =>
    projectStatusFilter === 'all' ? true : project.status === projectStatusFilter
  );

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) return showToast(t('Please enter a project name','אנא הזן שם פרויקט'),'error');
    setIsSubmitting(true);
    try {
      await addProject({ name:name.trim(), objective:objective.trim() || null, area, status, start_date:startDate || todayStr, due_date:dueDate || null, progress:0 });
      showToast(t('Project created successfully','הפרויקט נוצר בהצלחה'));
      setIsAddDrawerOpen(false); setName(''); setObjective(''); setDueDate('');
    } catch (err) {
      showToast(err.message || t('Could not create project','שגיאה ביצירת פרויקט'),'error');
    } finally { setIsSubmitting(false); }
  };

  const handleQuickTask = async () => {
    if (!selectedProject || !quickTaskTitle.trim()) return;
    const existing = projectTasks(selectedProject.id);
    try {
      await addTask({
        title: quickTaskTitle.trim(),
        project_id: selectedProject.id,
        area: selectedProject.area || 'business',
        status:'todo', priority:'medium',
        start_date: todayStr,
        due_date: selectedProject.due_date || todayStr,
        sort_order: (existing.length + 1) * 100
      });
      setQuickTaskTitle('');
      showToast(t('Task added to project','המשימה נוספה לפרויקט'));
    } catch (err) {
      showToast(err.message || t('Could not add task','לא ניתן להוסיף משימה'),'error');
    }
  };

  const handleConfirmDeleteProject = async () => {
    if (!deleteModalProj) return;
    try {
      await deleteProject(deleteModalProj.id);
      if (selectedProjectId === deleteModalProj.id) setSelectedProjectId(null);
      showToast(t('Project moved to Trash','הפרויקט הועבר לאשפה'));
    } catch (err) { showToast(t('Could not move project to Trash','לא ניתן להעביר את הפרויקט לאשפה'),'error'); }
    finally { setDeleteModalProj(null); }
  };

  const handleConfirmDeleteTask = async () => {
    if (!deleteModalTask) return;
    try {
      await deleteTask(deleteModalTask.id);
      showToast(t('Task moved to Trash','המשימה הועברה לאשפה'));
    } catch (err) { showToast(t('Could not move task to Trash','לא ניתן להעביר את המשימה לאשפה'),'error'); }
    finally { setDeleteModalTask(null); }
  };

  return (
    <div className="space-y-4 text-start">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-950"><FolderKanban className="h-4 w-4 text-violet-600" />{t('Projects','פרויקטים')}</h2>
            <p className="mt-1 text-[11px] text-slate-500">{t('Manage delivery from the project level — tasks, priorities and deadlines together.','נהל את הביצוע מתוך הפרויקט — משימות, עדיפויות ודדליינים במקום אחד.')}</p>
          </div>
          <button onClick={() => setIsAddDrawerOpen(true)} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-xs font-bold text-white hover:bg-violet-500">
            <Plus className="h-4 w-4" />{t('New Project','פרויקט חדש')}
          </button>
        </div>
      </section>

      <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
        {[
          ['all', t('All','הכול')],
          ['planned', t('To Do','לביצוע')],
          ['active', t('In Progress','בתהליך')],
          ['blocked', t('On Hold','מושהה')],
          ['completed', t('Completed','הושלם')]
        ].map(([value,label]) => (
          <button key={value} type="button" onClick={() => setProjectStatusFilter(value)}
            className={`shrink-0 rounded-xl border px-3 py-2 text-[11px] font-bold transition ${projectStatusFilter===value ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filteredProjects.map(project => {
          const progress = progressFor(project.id);
          const nextDeadline = projectTasks(project.id).filter(task => task.status !== 'done' && task.due_date).sort((a,b)=>a.due_date.localeCompare(b.due_date))[0];
          const totalCost = projectCost(project.id);
          return (
            <button key={project.id} onClick={() => setSelectedProjectId(project.id)} className="group w-full rounded-2xl border border-slate-200 bg-white p-4 text-start shadow-sm transition hover:border-violet-200 hover:shadow-md">
              <div className="grid gap-4 lg:grid-cols-[minmax(220px,1.35fr)_110px_145px_130px_165px_36px] lg:items-center">
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-slate-950">{project.name}</div>
                  <div className="mt-1 truncate text-[10px] text-slate-400">{project.objective || t('No objective defined','לא הוגדר יעד')}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{t('Status','סטטוס')}</div>
                  <div className="mt-1 text-[11px] font-bold text-slate-700">{projectStatusLabel(project.status)}</div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[9px] font-bold text-slate-400"><span>{t('Progress','התקדמות')}</span><span>{progress.pct}%</span></div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{width:`${progress.pct}%`}} /></div>
                  <div className="mt-1 text-[9px] text-slate-400">{progress.done}/{progress.total} {t('tasks done','משימות הושלמו')}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{t('Tracked Cost','עלות מתועדת')}</div>
                  <div className="mt-1 text-[12px] font-extrabold text-slate-800">₪{totalCost.toLocaleString(language === 'he' ? 'he-IL' : 'en-US')}</div>
                  <div className="mt-1 text-[9px] text-slate-400">{t('Operational tracking, not accounting','מעקב ניהולי, לא הנהלת חשבונות')}</div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{t('Next Deadline','הדדליין הבא')}</div>
                  <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-slate-700"><CalendarDays className="h-3.5 w-3.5" />{nextDeadline?.due_date || project.due_date || '-'}</div>
                  {nextDeadline && <div className="mt-1 max-w-[160px] truncate text-[9px] text-slate-400">{nextDeadline.title}</div>}
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:text-violet-500 rtl:rotate-180" />
              </div>
            </button>
          );
        })}
        {filteredProjects.length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center text-xs text-slate-400">{t('No projects in this status','אין פרויקטים בסטטוס הזה')}</div>}
      </div>

      <Drawer isOpen={isAddDrawerOpen} onClose={() => setIsAddDrawerOpen(false)} title={t('Create New Project','יצירת פרויקט חדש')} width="max-w-xl"
        footer={<>
          <button onClick={() => setIsAddDrawerOpen(false)} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600">{t('Cancel','ביטול')}</button>
          <button onClick={handleCreateProject} disabled={isSubmitting} className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">{isSubmitting ? t('Saving...','שומר...') : t('Save Project','שמור פרויקט')}</button>
        </>}>
        <form onSubmit={handleCreateProject} className="space-y-4">
          <Field label={t('Project Name *','שם הפרויקט *')}><input required value={name} onChange={e=>setName(e.target.value)} className="work-input" /></Field>
          <Field label={t('Goal / Objective','יעד / מטרה')}><textarea rows={3} value={objective} onChange={e=>setObjective(e.target.value)} className="work-input resize-none" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('Area','תחום')}><select value={area} onChange={e=>setArea(e.target.value)} className="work-input"><option value="business">{t('Business','עסקי')}</option><option value="clinical">{t('Clinical','קליני')}</option><option value="operations">{t('Operations','תפעול')}</option></select></Field>
            <Field label={t('Status','סטטוס')}><select value={status} onChange={e=>setStatus(e.target.value)} className="work-input"><option value="planned">{t('To Do','לביצוע')}</option><option value="active">{t('In Progress','בתהליך')}</option><option value="blocked">{t('On Hold','מושהה')}</option><option value="completed">{t('Completed','הושלם')}</option></select></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('Start Date','תאריך התחלה')}><input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="work-input" /></Field>
            <Field label={t('Due Date','תאריך יעד')}><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="work-input" /></Field>
          </div>
        </form>
      </Drawer>

      {selectedProject && (
        <Drawer isOpen onClose={() => setSelectedProjectId(null)} title={selectedProject.name} width="max-w-5xl"
          footer={<div className="flex w-full items-center justify-between">
            <button onClick={() => setDeleteModalProj(selectedProject)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"><Trash2 className="h-4 w-4" />{t('Move Project to Trash','העבר פרויקט לאשפה')}</button>
            <button onClick={() => setSelectedProjectId(null)} className="rounded-xl bg-slate-950 px-5 py-2 text-xs font-bold text-white">{t('Close','סגור')}</button>
          </div>}>
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-[1.5fr_150px_150px]">
              <Field label={t('Project Name','שם הפרויקט')}><input value={selectedProject.name} onChange={e=>updateProject(selectedProject.id,{name:e.target.value})} className="work-input font-bold" /></Field>
              <Field label={t('Status','סטטוס')}><select value={selectedProject.status} onChange={e=>updateProject(selectedProject.id,{status:e.target.value})} className="work-input"><option value="planned">{t('To Do','לביצוע')}</option><option value="active">{t('In Progress','בתהליך')}</option><option value="blocked">{t('On Hold','מושהה')}</option><option value="completed">{t('Completed','הושלם')}</option></select></Field>
              <Field label={t('Project Deadline','דדליין פרויקט')}><input type="date" value={selectedProject.due_date || ''} onChange={e=>updateProject(selectedProject.id,{due_date:e.target.value || null})} className="work-input" /></Field>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-col gap-3 border-b border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900">{t('Project Tasks','משימות הפרויקט')}</h3>
                  <p className="mt-0.5 text-[10px] text-slate-400">{t('Edit status, priority and deadline directly here.','ערוך סטטוס, עדיפות ודדליין ישירות מכאן.')}</p>
                </div>
                <div className="flex min-w-0 gap-2">
                  <input value={quickTaskTitle} onChange={e=>setQuickTaskTitle(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();handleQuickTask();}}} placeholder={t('Add a task...','הוסף משימה...')} className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs outline-none focus:border-violet-400 sm:w-64" />
                  <button onClick={handleQuickTask} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-violet-600 px-3 text-xs font-bold text-white"><CirclePlus className="h-4 w-4" />{t('Add','הוסף')}</button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-start">
                  <thead><tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-extrabold uppercase tracking-wide text-slate-400">
                    <th className="px-3 py-2.5 text-start">{t('Task','משימה')}</th><th className="px-3 py-2.5 text-start">{t('Status','סטטוס')}</th><th className="px-3 py-2.5 text-start">{t('Priority','עדיפות')}</th><th className="px-3 py-2.5 text-start">{t('Cost','עלות')}</th><th className="px-3 py-2.5 text-start">{t('Deadline','דדליין')}</th><th className="px-3 py-2.5 text-start">{t('Start','התחלה')}</th><th className="w-12 px-3 py-2.5"></th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {projectTasks(selectedProject.id).map(task => (
                      <tr key={task.id} className="group hover:bg-slate-50/70">
                        <td className="px-3 py-2.5"><input value={task.title} onChange={e=>updateTask(task.id,{title:e.target.value})} className={`w-full min-w-[220px] bg-transparent text-xs font-bold outline-none ${task.status==='done'?'text-slate-400 line-through':'text-slate-800'}`} /></td>
                        <td className="px-3 py-2.5"><select value={task.status || 'todo'} onChange={e=>updateTask(task.id,{status:e.target.value})} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold">{statusOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                        <td className="px-3 py-2.5"><select value={task.priority || 'medium'} onChange={e=>updateTask(task.id,{priority:e.target.value})} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold">{priorityOptions.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                        <td className="px-3 py-2.5"><div className="flex h-8 items-center rounded-lg border border-slate-200 bg-white px-2 text-[10px]"><span className="me-1 text-slate-400">₪</span><input type="number" min="0" step="1" value={task.cost_amount || ''} onChange={e=>updateTask(task.id,{cost_amount:Number(e.target.value || 0)})} className="w-20 bg-transparent outline-none" /></div></td>
                        <td className="px-3 py-2.5"><input type="date" value={task.due_date || ''} onChange={e=>updateTask(task.id,{due_date:e.target.value})} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[10px]" /></td>
                        <td className="px-3 py-2.5"><input type="date" value={task.start_date || ''} onChange={e=>updateTask(task.id,{start_date:e.target.value || null})} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[10px]" /></td>
                        <td className="px-3 py-2.5"><button onClick={()=>setDeleteModalTask(task)} title={t('Move to Trash','העבר לאשפה')} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-3.5 w-3.5" /></button></td>
                      </tr>
                    ))}
                    {projectTasks(selectedProject.id).length===0 && <tr><td colSpan={7} className="py-10 text-center text-xs text-slate-400">{t('No tasks in this project yet. Add the first one above.','אין עדיין משימות בפרויקט. הוסף את הראשונה למעלה.')}</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Drawer>
      )}

      <ConfirmModal isOpen={Boolean(deleteModalProj)} onClose={()=>setDeleteModalProj(null)} onConfirm={handleConfirmDeleteProject} title={t('Move project to Trash?','להעביר את הפרויקט לאשפה?')} message={deleteModalProj ? t(`Project “${deleteModalProj.name}” will remain recoverable from Trash.`,`הפרויקט “${deleteModalProj.name}” יישאר ניתן לשחזור מהאשפה.`) : ''} confirmText={t('Move to Trash','העבר לאשפה')} cancelText={t('Cancel','ביטול')} isDanger />
      <ConfirmModal isOpen={Boolean(deleteModalTask)} onClose={()=>setDeleteModalTask(null)} onConfirm={handleConfirmDeleteTask} title={t('Move task to Trash?','להעביר את המשימה לאשפה?')} message={deleteModalTask?.title || ''} confirmText={t('Move to Trash','העבר לאשפה')} cancelText={t('Cancel','ביטול')} isDanger />
    </div>
  );
}

function Field({label,children}) {
  return <label className="block"><span className="mb-1.5 block text-[10px] font-bold text-slate-500">{label}</span>{children}</label>;
}
