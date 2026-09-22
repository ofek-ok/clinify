import React, { useContext, useMemo, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { ChevronRight, ChevronLeft } from 'lucide-react';

const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
const key=d=>d.toISOString().slice(0,10);

export default function WorkTimeline() {
  const { tasks, projects } = useContext(ClinicContext);
  const [offset,setOffset]=useState(0);
  const [projectFilter,setProjectFilter]=useState('');
  const [statusFilter,setStatusFilter]=useState('');

  const days = useMemo(() => {
    const start = addDays(new Date(), offset * 14);
    return Array.from({length:14},(_,i)=>addDays(start,i));
  }, [offset]);

  const datedTasks = useMemo(() => tasks.filter(t => {
    if (!(t.start_date || t.due_date)) return false;
    if (projectFilter && t.project_id !== projectFilter) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    return true;
  }), [tasks, projectFilter, statusFilter]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3">
        <div>
          <div className="text-xs font-bold text-slate-900">Timeline · 14 ימים</div>
          <div className="text-[11px] text-slate-500">תאריכי התחלה ויעד של המשימות</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={projectFilter} onChange={e=>setProjectFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px]">
            <option value="">כל הפרויקטים</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px]">
            <option value="">כל הסטטוסים</option>
            <option value="todo">לביצוע</option>
            <option value="in_progress">בתהליך</option>
            <option value="blocked">חסום</option>
            <option value="done">הושלם</option>
          </select>
          <button onClick={()=>setOffset(v=>v-1)} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronRight className="w-4 h-4"/></button>
          <button onClick={()=>setOffset(0)} className="px-2 py-1 text-[11px] font-bold text-violet-700">היום</button>
          <button onClick={()=>setOffset(v=>v+1)} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeft className="w-4 h-4"/></button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <div className="min-w-[1100px]">
          <div className="grid border-b border-slate-200 bg-slate-50" style={{gridTemplateColumns:'220px repeat(14,minmax(60px,1fr))'}}>
            <div className="p-2 text-[11px] font-bold text-slate-500 border-l border-slate-200">משימה</div>
            {days.map(d=><div key={key(d)} className="p-2 text-center text-[10px] border-l border-slate-200 text-slate-500">{d.toLocaleDateString('he-IL',{day:'2-digit',month:'2-digit'})}</div>)}
          </div>
          <div className="divide-y divide-slate-100">
            {datedTasks.map(task => {
              const startKey=task.start_date || task.due_date;
              const endKey=task.due_date || task.start_date;
              const project=projects.find(p=>p.id===task.project_id);
              return (
                <div key={task.id} className="grid min-h-12" style={{gridTemplateColumns:'220px repeat(14,minmax(60px,1fr))'}}>
                  <div className="p-2 border-l border-slate-200">
                    <div className="text-[11px] font-bold text-slate-900 truncate">{task.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{project?.name || 'ללא פרויקט'}</div>
                  </div>
                  {days.map(d=>{
                    const k=key(d);
                    const active=k>=startKey && k<=endKey;
                    return <div key={k} className="border-l border-slate-100 p-1">{active && <div className="h-full min-h-7 rounded-md bg-violet-100 border border-violet-200" title={task.title} />}</div>;
                  })}
                </div>
              );
            })}
            {datedTasks.length===0 && <div className="p-8 text-center text-xs text-slate-500">אין משימות עם תאריכים.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
