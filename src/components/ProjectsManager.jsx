import React, { useContext, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import Drawer from './ui/Drawer';
import ConfirmModal from './ui/ConfirmModal';
import { useToast } from './ui/Toast';
import { Plus, Trash2 } from 'lucide-react';

export default function ProjectsManager() {
  const { 
    projects, 
    tasks, 
    addProject, 
    updateProject, 
    deleteProject, 
    todayStr 
  } = useContext(ClinicContext);

  const { showToast } = useToast();

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deleteModalProj, setDeleteModalProj] = useState(null);

  // New Project Form State
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [area, setArea] = useState('business');
  const [status, setStatus] = useState('active');
  const [startDate, setStartDate] = useState(todayStr);
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('אנא הזן שם פרויקט', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await addProject({
        name: name.trim(),
        objective: objective.trim() || null,
        area,
        status,
        start_date: startDate || todayStr,
        due_date: dueDate || null,
        progress: 0
      });
      showToast('הפרויקט נוצר בהצלחה');
      setIsAddDrawerOpen(false);
      setName('');
      setObjective('');
    } catch (err) {
      showToast(err.message || 'שגיאה ביצירת פרויקט', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalProj) return;
    try {
      await deleteProject(deleteModalProj.id);
      showToast('הפרויקט נמחק');
      if (selectedProject?.id === deleteModalProj.id) {
        setSelectedProject(null);
      }
    } catch (err) {
      showToast('שגיאה במחיקת פרויקט', 'error');
    } finally {
      setDeleteModalProj(null);
    }
  };

  return (
    <div className="space-y-4 dir-rtl text-start font-sans">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
        <div className="text-xs text-slate-500">
          סה״כ פרויקטים פתוחים: <span className="text-slate-900 font-bold">{projects.filter(p => p.status !== 'completed').length}</span>
        </div>

        <button
          onClick={() => setIsAddDrawerOpen(true)}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>פרויקט חדש</span>
        </button>
      </div>

      {/* Projects Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                <th className="py-3 px-4 text-start">שם הפרויקט</th>
                <th className="py-3 px-4 text-start">סטטוס</th>
                <th className="py-3 px-4 text-start">תחום</th>
                <th className="py-3 px-4 text-start">תאריך יעד</th>
                <th className="py-3 px-4 text-start">התקדמות משימות</th>
                <th className="py-3 px-4 text-start">משימות פתוחות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    אין פרויקטים להצגה.
                  </td>
                </tr>
              ) : (
                projects.map(proj => {
                  const projTasks = tasks.filter(t => t.project_id === proj.id);
                  const completedTasksCount = projTasks.filter(t => t.status === 'done').length;
                  const openTasksCount = projTasks.length - completedTasksCount;
                  const progressPct = projTasks.length > 0 ? Math.round((completedTasksCount / projTasks.length) * 100) : proj.progress || 0;

                  return (
                    <tr
                      key={proj.id}
                      onClick={() => setSelectedProject(proj)}
                      className="hover:bg-slate-100/50 transition-colors cursor-pointer"
                    >
                      {/* Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {proj.name}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {proj.status === 'active' ? 'פעיל' : proj.status === 'planned' ? 'מתוכנן' : proj.status === 'completed' ? 'הושלם' : 'חסום'}
                        </span>
                      </td>

                      {/* Area */}
                      <td className="py-3.5 px-4 text-slate-500">
                        {proj.area === 'clinical' ? 'קליני' : proj.area === 'business' ? 'עסקי' : 'תפעול'}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {proj.due_date || '-'}
                      </td>

                      {/* Progress */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2 space-x-reverse min-w-[140px]">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                          </div>
                          <span className="text-[11px] font-medium text-slate-700">
                            {completedTasksCount} / {projTasks.length} ({progressPct}%)
                          </span>
                        </div>
                      </td>

                      {/* Open Tasks Count */}
                      <td className="py-3.5 px-4 font-bold text-slate-700">
                        {openTasksCount}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Project Drawer */}
      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title="יצירת פרויקט חדש"
        footer={
          <>
            <button
              onClick={() => setIsAddDrawerOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 bg-slate-100"
            >
              ביטול
            </button>
            <button
              onClick={handleCreateProject}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
            >
              {isSubmitting ? 'שומר...' : 'שמור פרויקט'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">שם הפרויקט *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="שם הפרויקט..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">יעד / מטרה</label>
            <textarea
              rows={2}
              value={objective}
              onChange={e => setObjective(e.target.value)}
              placeholder="תיאור מטרת הפרויקט..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">תחום</label>
              <select
                value={area}
                onChange={e => setArea(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="business">עסקי</option>
                <option value="clinical">קליני</option>
                <option value="operations">תפעול</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">סטטוס</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="planned">מתוכנן</option>
                <option value="active">פעיל</option>
                <option value="blocked">חסום</option>
                <option value="completed">הושלם</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">תאריך התחלה</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">תאריך יעד</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </form>
      </Drawer>

      {/* Selected Project Detail Drawer */}
      {selectedProject && (
        <Drawer
          isOpen={Boolean(selectedProject)}
          onClose={() => setSelectedProject(null)}
          title={`פרויקט: ${selectedProject.name}`}
          width="max-w-xl"
          footer={
            <div className="flex justify-end items-center w-full">
              <button
                onClick={() => setSelectedProject(null)}
                className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                סגור
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">שם הפרויקט</label>
              <input
                type="text"
                value={selectedProject.name}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedProject(prev => ({ ...prev, name: val }));
                  updateProject(selectedProject.id, { name: val });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
              />
            </div>

            {selectedProject.objective && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block mb-0.5">יעד:</span>
                <p className="text-xs text-slate-900">{selectedProject.objective}</p>
              </div>
            )}

            {/* Linked Tasks List */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-slate-700">משימות בפרויקט זה</h4>
              <div className="space-y-1.5">
                {tasks.filter(t => t.project_id === selectedProject.id).map(t => (
                  <div key={t.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                    <span className={t.status === 'done' ? 'line-through text-slate-500' : 'text-slate-900'}>
                      {t.title}
                    </span>
                    <span className="text-[10px] text-slate-500">{t.due_date || '-'}</span>
                  </div>
                ))}
                {tasks.filter(t => t.project_id === selectedProject.id).length === 0 && (
                  <p className="text-xs text-slate-500 py-2">אין משימות שמשויכות לפרויקט זה.</p>
                )}
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
