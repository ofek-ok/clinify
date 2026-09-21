import React, { useContext, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const ProjectsManager = () => {
  const { 
    projects, 
    tasks, 
    addProject, 
    updateProject, 
    deleteProject, 
    todayStr 
  } = useContext(ClinicContext);

  const { t } = useContext(LanguageContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const [projectForm, setProjectForm] = useState({
    name: '',
    objective: '',
    status: 'active',
    start_date: todayStr,
    due_date: '',
    progress: 0,
    area: 'business'
  });

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    if (!projectForm.name) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
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
    } catch (err) {
      console.error("Project add error:", err);
      setErrorMessage(t("Could not save project. Please try again.", "לא הצלחנו לשמור את הפרויקט. נסה שוב."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const translateProjectStatus = (status) => {
    const map = {
      'planned': t('Planned', 'מתוכנן'),
      'active': t('Active', 'פעיל'),
      'blocked': t('Blocked', 'חסום'),
      'on_hold': t('On Hold', 'בהמתנה'),
      'completed': t('Completed', 'הושלם')
    };
    return map[status] || status;
  };

  const translateArea = (area) => {
    const map = {
      'business': t('Business', 'עסקי'),
      'clinical': t('Clinical', 'קליני'),
      'content': t('Content', 'תוכן'),
      'operations': t('Operations', 'תפעול')
    };
    return map[area] || area;
  };

  return (
    <div className="space-y-6 text-start">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{t('Projects', 'פרויקטים')}</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{t('Manage strategic outcomes and project milestones.', 'ניהול פרויקטים אסטרטגיים ויעדים מרכזיים.')}</p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Project Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 sticky top-6">
            <h3 className="text-sm font-bold mb-4 text-slate-800">{t('Create Project', 'פרויקט חדש')}</h3>
            <form onSubmit={handleProjectSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('Project Name', 'שם הפרויקט')}</label>
                <input 
                  type="text" 
                  value={projectForm.name} 
                  onChange={e => setProjectForm({...projectForm, name: e.target.value})} 
                  required 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-slate-400" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('Objective', 'מטרה / יעד')}</label>
                <textarea 
                  value={projectForm.objective} 
                  onChange={e => setProjectForm({...projectForm, objective: e.target.value})} 
                  rows="2" 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-slate-400" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('Area', 'תחום')}</label>
                  <select 
                    value={projectForm.area} 
                    onChange={e => setProjectForm({...projectForm, area: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  >
                    <option value="business">{t('Business', 'עסקי')}</option>
                    <option value="clinical">{t('Clinical', 'קליני')}</option>
                    <option value="content">{t('Content', 'תוכן')}</option>
                    <option value="operations">{t('Operations', 'תפעול')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('Initial Status', 'סטטוס')}</label>
                  <select 
                    value={projectForm.status} 
                    onChange={e => setProjectForm({...projectForm, status: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                  >
                    <option value="planned">{t('Planned', 'מתוכנן')}</option>
                    <option value="active">{t('Active', 'פעיל')}</option>
                    <option value="blocked">{t('Blocked', 'חסום')}</option>
                    <option value="on_hold">{t('On Hold', 'בהמתנה')}</option>
                    <option value="completed">{t('Completed', 'הושלם')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('Start Date', 'תאריך התחלה')}</label>
                  <input 
                    type="date" 
                    value={projectForm.start_date} 
                    onChange={e => setProjectForm({...projectForm, start_date: e.target.value})} 
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{t('Due Date', 'תאריך יעד')}</label>
                  <input 
                    type="date" 
                    value={projectForm.due_date} 
                    onChange={e => setProjectForm({...projectForm, due_date: e.target.value})} 
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none" 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg text-xs transition-colors shadow-xs mt-2"
              >
                {isSubmitting ? t('Saving...', 'שומר...') : t('Save Project', 'שמור פרויקט')}
              </button>
            </form>
          </div>
        </div>

        {/* Projects List */}
        <div className="lg:col-span-2 space-y-3">
          {projects.map(proj => {
            const projectTasks = tasks.filter(t => t.project_id === proj.id);
            const completedCount = projectTasks.filter(t => t.status === 'done').length;
            const progressPercent = projectTasks.length > 0 ? Math.round((completedCount / projectTasks.length) * 100) : proj.progress;

            return (
              <div key={proj.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-800">{proj.name}</h4>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                        {translateArea(proj.area)}
                      </span>
                    </div>
                    {proj.objective && <p className="text-xs text-slate-500 mt-1">{proj.objective}</p>}
                  </div>

                  <div className="flex items-center gap-2">
                    <select 
                      value={proj.status} 
                      onChange={e => updateProject(proj.id, { status: e.target.value })}
                      className="text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 outline-none"
                    >
                      <option value="planned">{t('Planned', 'מתוכנן')}</option>
                      <option value="active">{t('Active', 'פעיל')}</option>
                      <option value="blocked">{t('Blocked', 'חסום')}</option>
                      <option value="on_hold">{t('On Hold', 'בהמתנה')}</option>
                      <option value="completed">{t('Completed', 'הושלם')}</option>
                    </select>

                    <button 
                      onClick={() => deleteProject(proj.id)} 
                      className="text-slate-400 hover:text-rose-600 text-xs px-1.5 py-1"
                    >
                      {t('Delete', 'מחק')}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>{t('Tasks Progress', 'התקדמות משימות')}</span>
                    <span>{progressPercent}% ({completedCount}/{projectTasks.length})</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-800 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}

          {projects.length === 0 && (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs font-medium">
              {t('No projects found.', 'אין פרויקטים להצגה.')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectsManager;
