import React, { useContext, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const TaskManagement = () => {
  const { tasks, patients, addTask, updateTaskStatus, todayStr, getPatientName } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    due_date: todayStr,
    status: 'todo',
    priority: 'medium',
    patient_id: ''
  });

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    addTask(taskForm);
    setTaskForm({ ...taskForm, title: '', patient_id: '' });
  };

  const statusColumns = [
    { id: 'todo', title: t('To Do', 'לביצוע'), color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { id: 'in_progress', title: t('In Progress', 'בתהליך'), color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'done', title: t('Done', 'בוצע'), color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
  ];

  return (
    <div className="animate-in fade-in duration-500 space-y-6 text-start">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('Task Management', 'ניהול משימות')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('Manage daily tasks and clinic operations.', 'נהל את המשימות והמטלות היומיומיות של הקליניקה.')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/50 relative overflow-hidden h-max">
            <div className="absolute top-0 end-0 w-full h-1 bg-gradient-to-s from-amber-400 to-orange-500"></div>
            <h3 className="text-lg font-semibold mb-5 text-slate-700 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              {t('New Task', 'משימה חדשה')}
            </h3>
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Task Title', 'כותרת המשימה')}</label>
                <input type="text" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-start" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Due Date', 'תאריך יעד')}</label>
                <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({...taskForm, due_date: e.target.value})} required 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all text-start" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Priority', 'עדיפות')}</label>
                <select value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all cursor-pointer text-start">
                  <option value="low">{t('Low', 'נמוכה')}</option>
                  <option value="medium">{t('Medium', 'בינונית')}</option>
                  <option value="high">{t('High', 'גבוהה')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Link to Patient (Optional)', 'קישור למטופל (אופציונלי)')}</label>
                <select value={taskForm.patient_id} onChange={e => setTaskForm({...taskForm, patient_id: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all cursor-pointer text-start">
                  <option value="">{t('No link', 'ללא קישור')}</option>
                  {patients.filter(p => p.status === 'active').map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full mt-2 bg-gradient-to-e from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-[0.98]">
                {t('Add Task', 'הוסף משימה')}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {statusColumns.map(column => (
              <div key={column.id} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-700">{column.title}</h4>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${column.color}`}>
                    {tasks.filter(t => t.status === column.id).length}
                  </span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {tasks.filter(t => t.status === column.id).map(task => (
                    <div key={task.id} className={`bg-white p-4 rounded-xl border-e-4 border-y border-s border-y-slate-200 border-s-slate-200 shadow-sm hover:shadow-md transition-shadow group ${task.priority === 'high' ? 'border-e-rose-500' : task.priority === 'medium' ? 'border-e-amber-500' : 'border-e-blue-400'}`}>
                      <h5 className="font-bold text-sm text-slate-800 mb-1 text-start">{task.title}</h5>
                      {task.patient_id && (
                        <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                          {getPatientName(task.patient_id)}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${task.due_date < todayStr && task.status !== 'done' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                          {task.due_date === todayStr ? t('Today', 'היום') : new Date(task.due_date).toLocaleDateString()}
                        </span>
                        
                        <select 
                          value={task.status} 
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-slate-600 outline-none cursor-pointer"
                        >
                          <option value="todo">{t('To Do', 'לביצוע')}</option>
                          <option value="in_progress">{t('In Progress', 'בתהליך')}</option>
                          <option value="done">{t('Done', 'בוצע')}</option>
                        </select>
                      </div>
                    </div>
                  ))}
                  {tasks.filter(t => t.status === column.id).length === 0 && (
                    <div className="text-center py-8 opacity-50">
                      <p className="text-sm text-slate-500">{t('No tasks', 'אין משימות')}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskManagement;
