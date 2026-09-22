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
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [labels, setLabels] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [dependencyTaskId, setDependencyTaskId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status mapping
  const statusOptions = [
    { id: 'todo', label: 'לביצוע', color: 'bg-slate-100 text-slate-700' },
    { id: 'in_progress', label: 'בתהליך', color: 'bg-blue-50 text-blue-700 border border-blue-200' },
    { id: 'blocked', label: 'חסום', color: 'bg-rose-50 text-rose-700 border border-rose-200' },
    { id: 'done', label: 'הושלם', color: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
  ];

  // Priority mapping
  const priorityOptions = [
    { id: 'critical', label: 'קריטי', color: 'text-rose-400 font-bold' },
    { id: 'high', label: 'גבוה', color: 'text-amber-400 font-bold' },
    { id: 'medium', label: 'בינוני', color: 'text-blue-400' },
    { id: 'low', label: 'נמוך', color: 'text-slate-500' }
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
        content_item_id: contentItemId || null,
        description: description.trim() || null,
        start_date: startDate || null,
        labels: labels.split(',').map(v => v.trim()).filter(Boolean),
        estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : null,
        dependency_task_id: dependencyTaskId || null
      });
      showToast('המשימה נוצרה בהצלחה');
      setIsAddDrawerOpen(false);
      setTitle('');
      setDescription('');
      setLabels('');
      setEstimatedMinutes('');
      setDependencyTaskId('');
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
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-3 space-x-reverse flex-1 min-w-[280px]">
          {/* Quick Filters */}
          <div className="flex items-center space-x-1 space-x-reverse bg-slate-50 p-1 rounded-xl border border-slate-200">
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
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="חיפוש משימה..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-1.5 text-xs text-slate-900 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
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
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                <th className="py-3 px-4 text-start">משימה</th>
                <th className="py-3 px-4 text-start">סטטוס</th>
                <th className="py-3 px-4 text-start">עדיפות</th>
                <th className="py-3 px-4 text-start">פרויקט</th>
                <th className="py-3 px-4 text-start">תאריך יעד</th>
                <th className="py-3 px-4 text-start">קשור ל-</th>
                <th className="py-3 px-4 text-start">תחום</th>
                <th className="py-3 px-4 text-start">תגיות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
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
                      className="hover:bg-slate-100/50 transition-colors cursor-pointer group"
                    >
                      {/* Title */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <span className={isDone ? 'line-through text-slate-500 font-normal' : ''}>
                          {task.title}
                        </span>
                      </td>

                      {/* Inline Editable Status */}
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <select
                          value={task.status || 'todo'}
                          onChange={e => handleInlineStatusChange(task, e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
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
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                        >
                          {priorityOptions.map(p => (
                            <option key={p.id} value={p.id} className={p.color}>{p.label}</option>
                          ))}
                        </select>
                      </td>

                      {/* Project */}
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {resolveProjectName(task.project_id)}
                      </td>

                      {/* Due Date */}
                      <td className={`py-3 px-4 font-mono ${isOverdue ? 'text-rose-400 font-bold' : 'text-slate-700'}`}>
                        {task.due_date || '-'}
                      </td>

                      {/* Related Entity */}
                      <td className="py-3 px-4 text-slate-500">
                        {resolveRelatedEntity(task)}
                      </td>

                      {/* Area */}
                      <td className="py-3 px-4 text-slate-500">
                        {task.area === 'clinical' ? 'קליני' : task.area === 'business' ? 'עסקי' : 'תפעול'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(task.labels || []).slice(0,3).map(label => <span key={label} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600">{label}</span>)}
                        </div>
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
              className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-900 bg-slate-100"
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
            <label className="block text-xs font-medium text-slate-700 mb-1">כותרת משימה *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="תיאור המשימה..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">סטטוס</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                {statusOptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">עדיפות</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                {priorityOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">תיאור</label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900" placeholder="פרטים, תוצאה רצויה, הערות..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">תאריך התחלה</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900" />
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

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">תחום</label>
              <select
                value={area}
                onChange={e => setArea(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
              >
                <option value="operations">תפעול</option>
                <option value="business">עסקי</option>
                <option value="clinical">קליני</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">הערכת זמן בדקות</label>
              <input type="number" min="0" value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900" placeholder="60" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">תגיות</label>
              <input value={labels} onChange={e => setLabels(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900" placeholder="שיווק, דחוף, אתר" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">שיוך לפרויקט</label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
            >
              <option value="">ללא פרויקט</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">תלויה במשימה</label>
            <select value={dependencyTaskId} onChange={e => setDependencyTaskId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900">
              <option value="">ללא תלות</option>
              {tasks.filter(t => t.status !== 'done').map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">קשור ללקוח</label>
            <select
              value={patientId}
              onChange={e => setPatientId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
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
              <label className="block text-xs text-slate-500 mb-1">כותרת משימה</label>
              <input
                type="text"
                value={selectedTask.title}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedTask(prev => ({ ...prev, title: val }));
                  updateTask(selectedTask.id, { title: val });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">סטטוס</label>
                <select
                  value={selectedTask.status || 'todo'}
                  onChange={e => handleInlineStatusChange(selectedTask, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                >
                  {statusOptions.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">עדיפות</label>
                <select
                  value={selectedTask.priority || 'medium'}
                  onChange={e => handleInlinePriorityChange(selectedTask, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                >
                  {priorityOptions.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">תיאור</label>
              <textarea rows={3} value={selectedTask.description || ''} onChange={e => { const val=e.target.value; setSelectedTask(prev=>({...prev,description:val})); updateTask(selectedTask.id,{description:val||null}); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">תאריך התחלה</label>
                <input type="date" value={selectedTask.start_date || ''} onChange={e => { const val=e.target.value; setSelectedTask(prev=>({...prev,start_date:val})); updateTask(selectedTask.id,{start_date:val||null}); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900" />
              </div>
              <div>
              <label className="block text-xs text-slate-500 mb-1">תאריך יעד</label>
              <input
                type="date"
                value={selectedTask.due_date || ''}
                onChange={e => {
                  const val = e.target.value;
                  setSelectedTask(prev => ({ ...prev, due_date: val }));
                  updateTask(selectedTask.id, { due_date: val });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
              />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">הערכת זמן</label>
                <input type="number" min="0" value={selectedTask.estimated_minutes || ''} onChange={e => { const val=e.target.value; setSelectedTask(prev=>({...prev,estimated_minutes:val})); updateTask(selectedTask.id,{estimated_minutes:val ? Number(val) : null}); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">תגיות</label>
                <input value={(selectedTask.labels || []).join(', ')} onChange={e => { const val=e.target.value.split(',').map(v=>v.trim()).filter(Boolean); setSelectedTask(prev=>({...prev,labels:val})); updateTask(selectedTask.id,{labels:val}); }} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900" />
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
