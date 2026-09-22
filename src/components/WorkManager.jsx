import React, { useState } from 'react';
import TaskManagement from './TaskManagement';
import ProjectsManager from './ProjectsManager';
import WorkDashboard from './WorkDashboard';
import WorkOptionsManager from './WorkOptionsManager';
import WorkKanban from './WorkKanban';
import WorkTimeline from './WorkTimeline';
import { LayoutDashboard, Table2, Columns3, GanttChartSquare, FolderKanban, SlidersHorizontal } from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'סקירה', icon: LayoutDashboard },
  { id: 'board', label: 'טבלה', icon: Table2 },
  { id: 'kanban', label: 'Kanban', icon: Columns3 },
  { id: 'timeline', label: 'Timeline', icon: GanttChartSquare },
  { id: 'projects', label: 'פרויקטים', icon: FolderKanban },
  { id: 'customize', label: 'התאמה אישית', icon: SlidersHorizontal }
];

export default function WorkManager({ initialTab = 'board' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="space-y-5 dir-rtl text-start">
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-4 px-5 pt-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-emerald-700">
              WORK OS
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">עבודה</h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
              משימות, פרויקטים ותכנון ביצוע במקום אחד — עם כמה תצוגות על אותו מידע.
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-100 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto py-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-bold transition ${active ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-600'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div>
        {activeTab === 'overview' && <WorkDashboard />}
        {activeTab === 'board' && <TaskManagement />}
        {activeTab === 'kanban' && <WorkKanban />}
        {activeTab === 'timeline' && <WorkTimeline />}
        {activeTab === 'projects' && <ProjectsManager />}
        {activeTab === 'customize' && <WorkOptionsManager />}
      </div>
    </div>
  );
}
