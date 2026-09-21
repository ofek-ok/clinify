import React, { useState, useContext } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import Drawer from './ui/Drawer';
import ConfirmModal from './ui/ConfirmModal';
import { useToast } from './ui/Toast';
import { Search, Plus, Trash2 } from 'lucide-react';

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
    todayStr 
  } = useContext(ClinicContext);

  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'today' | 'week' | 'overdue' | 'blocked'
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [deleteModalTask, setDeleteModalTask] = useState(null);

  // New Task Form State
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(todayStr);
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [area, setArea] = useState('operations');
  const [projectId, setProjectId] = useState('');
  const [patientId, setPatientId] = useState('');
  const [contentItemId, setContentItemId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status mapping
  const statusOptions = [
    { id: 'todo', label: 'לביצוע', color: 'bg-slate-800 text-slate-300' },
    { id: 'in_progress', label: 'בתהליך', color: 'bg-blue-950/80 text-blue-300 border border-blue-800' },
    { id: 'blocked', label: 'חסום', color: 'bg-rose-950/80 text-rose-300 border border-rose-800' },
    { id: 'done', label: 'הושלם', color: 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' }
  ];

  // Priority mapping
  const priorityOptions = [
    { id: 'critical', label: 'קריטי', color: 'text-rose-400 font-bold' },
    { id: 'high', label: 'גבוה', color: 'text-amber-400 font-bold' },
    { id: 'medium', label: 'בינוני', color: 'text-blue-400' },
    { id: 'low', label: 'נמוך', color: 'text-slate-400' }
  ];

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchTerm || (task.title && task.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;

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

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('אנא הזן כותרת משימה', 'error');
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
        content_item_id: contentItemId || null
      });
      showToast('המשימה נוצרה בהצלחה');
      setIsAddDrawerOpen(false);
      setTitle('');
    } catch (err) {
      showToast(err.message || 'שגיאה ביצירת המשימה', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInlineStatusChange = async (task, newStatus) => {
    try {
      await updateTaskStatus(task.id, newStatus);
      showToast('סטטוס המשימה עודכן');
    } catch (err) {
      showToast('שגיאה בעדכון סטטוס', 'error');
    }
  };

  const handleInlinePriorityChange = async (task, newPriority) => {
    try {
      await updateTask(task.id, { priority: newPriority });
      showToast('עדיפות המשימה עודכנה');
    } catch (err) {
      showToast('שגיאה בעדכון עדיפות', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalTask) return;
    try {
      await deleteTask(deleteModalTask.id);
      showToast('המשימה נמחקה');
      if (selectedTask?.id === deleteModalTask.id) {
        setSelectedTask(null);
      }
    } catch (err) {
      showToast('שגיאה במחיקת המשימה', 'error');
    } finally {
      setDeleteModalTask(null);
    }
  };

  const resolveRelatedEntity = (task) => {
    if (task.patient_id) {
      const p = patients.find(pat => pat.id === task.patient_id);
      return p ? `לקוח: ${p.full_name}` : 'לקוח';
    }
    if (task.content_item_id) {
      const c = contentItems.find(ci => ci.id === task.content_item_id);
      return c ? `תוכן: ${c.title}` : 'תוכן';
    }
    return '-';
  };

  const resolveProjectName = (projId) => {
    if (!projId) return '-';
    const proj = projects.find(p => p.id === projId);
    return proj ? proj.name : '-';
  };

  return (
    <div className="space-y-4 dir-rtl text-start font-sans">
      {/* Top Filter & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-[280px]">
          {/* Quick Filters */}
          <div className="flex items-center space-x-1 space-x-reverse bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'all', label: 'הכול' },
              { id: 'today', label: 'היום' },
              { id: 'week', label: 'השבוע' },
              { id: 'overdue', label: 'באיחור' },
              { id: 'blocked', label: 'חסום' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterMode(f.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === f.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="חיפוש משימה..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => setIsAddDrawerOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>משימה חדשה</span>
        </button>
      </div>

      {/* Monday-Style Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400">
                <th className="py-3 px-4 text-start">משימה</th>
                <th className="py-3 px-4 text-start">סטטוס</th>
                <th className="py-3 px-4 text-start">עדיפות</th>
                <th className="py-3 px-4 text-start">פרויקט</th>
                <th className="py-3 px-4 text-start">תאריך יעד</th>
                <th className="py-3 px-4 text-start">קשור ל-</th>
                <th className="py-3 px-4 text-start">תחום</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    אין משימות להצגה.
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
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      {/* Title */}
                      <td className="py-3 px-4 font-bold text-white">
                        <span className={isDone ? 'line-through text-slate-500 font-normal' : ''}>
                          {task.title}
                        </span>
                      </td>

                      {/* Inline Editable Status */}
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <select
                          value={task.status || 'todo'}
                          onChange={e => handleInlineStatusChange(task, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          {statusOptions.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* Inline Editable Priority */}
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <select
                          value={task.priority || 'medium'}
                          onChange={e => handleInlinePriorityChange(task, e.target.value)}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs focus:outline-none"
                        >
                          {priorityOptions.map(p => (
                            <option key={p.id} value={p.id} className={p.color}>{p.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* Project */}
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {resolveProjectName(task.project_id)}
                      </td>

                      {/* Due Date */}
                      <td className={`py-3 px-4 font-mono ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                        {task.due_date || '-'}
                      </td>

                      {/* Related Entity */}
                      <td className="py-3 px-4 text-slate-400">
                        {resolveRelatedEntity(task)}
                      </td>

                      {/* Area */}
                      <td className="py-3 px-4 text-slate-400">
                        {task.area === 'clinical' ? 'קליני' : task.area === 'business' ? 'עסקי' : 'תפעול'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Task Drawer */}
      <Drawer
        isOpen={isAddDrawerOpen}
        onClose={() => setIsAddDrawerOpen(false)}
        title="יצירת משימה חדשה"
        footer={
          <>
            <button
              onClick={() => setIsAddDrawerOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800"
            >
              ביטול
            </button>
            <button
              onClick={handleCreateTask}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
            >
              {isSubmitting ? 'שומר...' : 'שמור משימה'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">כותרת משימה *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="תיאור המשימה..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">סטטוס</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {statusOptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">עדיפות</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {priorityOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">תאריך יעד</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">תחום</label>
              <select
                value={area}
                onChange={e => setArea(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                <option value="operations">תפעול</option>
                <option value="business">עסקי</option>
                <option value="clinical">קליני</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">שיוך לפרויקט</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="">ללא פרויקט</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">קשור ללקוח</label>
            <select
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="">ללא שיוך ללקוח</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
        </form>
      </Drawer>

      {/* Selected Task Detail / Edit Drawer */}
      {selectedTask && (
        <Drawer
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          title={`משימה: ${selectedTask.title}`}
          footer={
            <div className="flex justify-end items-center w-full">
              <button
                onClick={() => setSelectedTask(null)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                סגור
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">כותרת משימה</label>
              <input
                type="text"
                value={selectedTask.title}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedTask(prev => ({ ...prev, title: val }));
                  updateTask(selectedTask.id, { title: val });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">סטטוס</label>
                <select
                  value={selectedTask.status || 'todo'}
                  onChange={e => handleInlineStatusChange(selectedTask, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {statusOptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">עדיפות</label>
                <select
                  value={selectedTask.priority || 'medium'}
                  onChange={e => handleInlinePriorityChange(selectedTask, e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {priorityOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">תאריך יעד</label>
              <input
                type="date"
                value={selectedTask.due_date || ''}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedTask(prev => ({ ...prev, due_date: val }));
                  updateTask(selectedTask.id, { due_date: val });
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
