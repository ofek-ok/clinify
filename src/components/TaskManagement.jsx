import React, { useContext, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const TaskManagement = () => {
  const { 
    tasks, 
    projects,
    patients, 
    people,
    addTask, 
    updateTask,
    updateTaskStatus, 
    deleteTask,
    addProject,
    updateProject,
    deleteProject,
    todayStr, 
    getPatientName 
  } = useContext(ClinicContext);

  const { t } = useContext(LanguageContext);

  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'projects'
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'today' | 'week' | 'overdue' | 'blocked'

  // Task Form State
  const [taskForm, setTaskForm] = useState({
    title: '',
    due_date: todayStr,
    status: 'todo',
    priority: 'medium',
    area: 'operations',
    project_id: '',
    patient_id: ''
  });

  // Project Form State
  const [projectForm, setProjectForm] = useState({
    name: '',
    objective: '',
    status: 'active',
    start_date: todayStr,
    due_date: '',
    progress: 0,
    area: 'business'
  });

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskForm.title) return;
    await addTask({
      ...taskForm,
      project_id: taskForm.project_id || null,
      patient_id: taskForm.patient_id || null
    });
    setTaskForm({
      title: '',
      due_date: todayStr,
      status: 'todo',
      priority: 'medium',
      area: 'operations',
      project_id: '',
      patient_id: ''
    });
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (!projectForm.name) return;
    await addProject(projectForm);
    setProjectForm({
      name: '',
      objective: '',
      status: 'active',
      start_date: todayStr,
      due_date: '',
      progress: 0,
      area: 'business'
    });
  };

  // Filter tasks based on view mode
  const filteredTasks = tasks.filter(task => {
    if (filterMode === 'today') return task.due_date === todayStr && task.status !== 'done';
    if (filterMode === 'overdue') return task.due_date < todayStr && task.status !== 'done';
    if (filterMode === 'blocked') return task.status === 'blocked';
    if (filterMode === 'week') {
      const taskDate = new Date(task.due_date);
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 86400000);
      return taskDate >= now && taskDate <= nextWeek && task.status !== 'done';
    }
    return true;
  });

  const statusColumns = [
    { id: 'todo', title: t('To Do', 'לביצוע'), color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { id: 'in_progress', title: t('In Progress', 'בתהליך'), color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'blocked', title: t('Blocked', 'חסום'), color: 'bg-rose-100 text-rose-700 border-rose-200' },
    { id: 'done', title: t('Done', 'בוצע'), color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-6 text-start">
      {/* Header & Main Switcher */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{t('Tasks & Projects Engine', 'מנוע ביצוע: משימות ופרויקטים')}</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{t('Manage strategic projects and operational execution tasks.', 'נהל פרויקטים אסטרטגיים ומשימות ביצוע יומיומיות.')}</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 border border-slate-200">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'tasks' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('Tasks Execution', 'משימות ביצוע')} ({tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'projects' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('Projects Manager', 'מנהל פרויקטים')} ({projects.length})
          </button>
        </div>
      </div>

      {activeTab === 'tasks' ? (
        <div className="space-y-6">
          {/* Quick Filter Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: t('All Tasks', 'כל המשימות') },
              { id: 'today', label: t('Today', 'להיום'), count: tasks.filter(t => t.due_date === todayStr && t.status !== 'done').length },
              { id: 'week', label: t('This Week', 'השבוע') },
              { id: 'overdue', label: t('Overdue', 'באיחור'), count: tasks.filter(t => t.due_date < todayStr && t.status !== 'done').length },
              { id: 'blocked', label: t('Blocked', 'חסומות'), count: tasks.filter(t => t.status === 'blocked').length }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setFilterMode(filter.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  filterMode === filter.id 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{filter.label}</span>
                {filter.count > 0 && (
                  <span className={`px-1.5 py-0.2 text-[10px] rounded-full ${
                    filterMode === filter.id ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* New Task Form */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-6">
                <h3 className="text-base font-bold mb-4 text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  {t('Create Task', 'משימה חדשה')}
                </h3>
                <form onSubmit={handleTaskSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('Title', 'כותרת המשימה')}</label>
                    <input type="text" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('Due Date', 'יעד לביצוע')}</label>
                      <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} required 
                        className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('Priority', 'עדיפות')}</label>
                      <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})} 
                        className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs">
                        <option value="low">{t('Low', 'נמוכה')}</option>
                        <option value="medium">{t('Medium', 'בינונית')}</option>
                        <option value="high">{t('High', 'גבוהה')}</option>
                        <option value="critical">{t('Critical', 'קריטית')}</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('Area', 'תחום')}</label>
                      <select value={taskForm.area} onChange={e => setTaskForm({...taskForm, area: e.target.value})} 
                        className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs">
                        <option value="operations">{t('Operations', 'תפעול')}</option>
                        <option value="clinical">{t('Clinical', 'קליני')}</option>
                        <option value="business">{t('Business', 'עסקי')}</option>
                        <option value="content">{t('Content', 'תוכן')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('Link Project', 'קישור לפרויקט')}</label>
                      <select value={taskForm.project_id} onChange={e => setTaskForm({...taskForm, project_id: e.target.value})} 
                        className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs">
                        <option value="">{t('None', 'ללא פרויקט')}</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{t('Link Patient', 'קישור למטופל')}</label>
                    <select value={taskForm.patient_id} onChange={e => setTaskForm({...taskForm, patient_id: e.target.value})} 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs">
                      <option value="">{t('None', 'ללא קישור למטופל')}</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.full_name || getPatientName(p.id)}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all text-xs">
                    {t('Add Task', 'הוסף משימה')}
                  </button>
                </form>
              </div>
            </div>

            {/* Kanban Columns */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {statusColumns.map(column => {
                  const colTasks = filteredTasks.filter(t => t.status === column.id);
                  return (
                    <div key={column.id} className="bg-slate-50/70 rounded-2xl border border-slate-200 p-3 flex flex-col min-h-[450px]">
                      <div className="flex justify-between items-center mb-3 px-1">
                        <h4 className="font-bold text-slate-700 text-xs">{column.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${column.color}`}>
                          {colTasks.length}
                        </span>
                      </div>
                      <div className="space-y-3 flex-1 overflow-y-auto">
                        {colTasks.map(task => {
                          const linkedProject = projects.find(p => p.id === task.project_id);
                          return (
                            <div key={task.id} className={`bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all group ${
                              task.priority === 'critical' ? 'border-s-4 border-s-rose-600' :
                              task.priority === 'high' ? 'border-s-4 border-s-amber-500' : 'border-s-4 border-s-slate-300'
                            }`}>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h5 className="font-bold text-xs text-slate-800 leading-snug">{task.title}</h5>
                                <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  ✕
                                </button>
                              </div>

                              {linkedProject && (
                                <p className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded w-max mb-1.5">
                                  📁 {linkedProject.name}
                                </p>
                              )}

                              {task.patient_id && (
                                <p className="text-[11px] font-medium text-slate-500 mb-2">
                                  👤 {getPatientName(task.patient_id)}
                                </p>
                              )}

                              <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  task.due_date < todayStr && task.status !== 'done' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {task.due_date === todayStr ? t('Today', 'היום') : task.due_date}
                                </span>
                                
                                <select 
                                  value={task.status} 
                                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                                  className="text-[11px] font-semibold border border-slate-200 rounded-lg px-2 py-0.5 bg-white text-slate-700 outline-none cursor-pointer"
                                >
                                  <option value="todo">{t('To Do', 'לביצוע')}</option>
                                  <option value="in_progress">{t('In Progress', 'בתהליך')}</option>
                                  <option value="blocked">{t('Blocked', 'חסום')}</option>
                                  <option value="done">{t('Done', 'בוצע')}</option>
                                </select>
                              </div>
                            </div>
                          );
                        })}
                        {colTasks.length === 0 && (
                          <div className="text-center py-8 opacity-40">
                            <p className="text-xs text-slate-500">{t('No tasks', 'אין משימות')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Projects Manager View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-6">
              <h3 className="text-base font-bold mb-4 text-slate-800">{t('Create New Project', 'פרויקט אסטרטגי חדש')}</h3>
              <form onSubmit={handleProjectSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Project Name', 'שם הפרויקט')}</label>
                  <input type="text" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} required 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Objective', 'יעד / מטרת הפרויקט')}</label>
                  <textarea value={projectForm.objective} onChange={e => setProjectForm({...projectForm, objective: e.target.value})} rows="2" 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Area', 'תחום')}</label>
                    <select value={projectForm.area} onChange={e => setProjectForm({...projectForm, area: e.target.value})} 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none">
                      <option value="business">{t('Business', 'עסקי')}</option>
                      <option value="clinical">{t('Clinical', 'קליני')}</option>
                      <option value="content">{t('Content', 'תוכן')}</option>
                      <option value="operations">{t('Operations', 'תפעול')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Progress (%)', 'התקדמות (%)')}</label>
                    <input type="number" min="0" max="100" value={projectForm.progress} onChange={e => setProjectForm({...projectForm, progress: e.target.value})} 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Start Date', 'תאריך התחלה')}</label>
                    <input type="date" value={projectForm.start_date} onChange={e => setProjectForm({...projectForm, start_date: e.target.value})} 
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Target Due Date', 'תאריך יעד')}</label>
                    <input type="date" value={projectForm.due_date} onChange={e => setProjectForm({...projectForm, due_date: e.target.value})} 
                      className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-all text-xs">
                  {t('Save Project', 'שמור פרויקט')}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t('Active Projects Engine', 'פרויקטים פעילים במערכת')} ({projects.length})</h3>
            <div className="grid grid-cols-1 gap-4">
              {projects.map(proj => {
                const projectTasks = tasks.filter(t => t.project_id === proj.id);
                const completedCount = projectTasks.filter(t => t.status === 'done').length;
                const calculatedProgress = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : proj.progress;

                return (
                  <div key={proj.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {proj.area}
                        </span>
                        <h4 className="font-bold text-base text-slate-800 mt-1">{proj.name}</h4>
                        {proj.objective && <p className="text-xs text-slate-500 mt-0.5">{proj.objective}</p>}
                      </div>
                      <button onClick={() => deleteProject(proj.id)} className="text-slate-300 hover:text-rose-500 text-xs">
                        {t('Delete', 'מחק')}
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                        <span>{t('Progress', 'התקדמות משימות')}</span>
                        <span>{calculatedProgress}% ({completedCount}/{projectTasks.length} {t('tasks', 'משימות')})</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-900 rounded-full transition-all duration-500" style={{ width: `${calculatedProgress}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {projects.length === 0 && (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                  {t('No projects defined yet.', 'עדיין לא הוגדרו פרויקטים.')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;
