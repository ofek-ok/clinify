import React, { useState } from 'react';
import TaskManagement from './TaskManagement';
import ProjectsManager from './ProjectsManager';
import WorkDashboard from './WorkDashboard';
import WorkOptionsManager from './WorkOptionsManager';
import WorkKanban from './WorkKanban';
import WorkTimeline from './WorkTimeline';

export default function WorkManager({ initialTab = 'board' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="space-y-6 dir-rtl text-start">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">עבודה</h1>
        
        {/* Tabs: Board | Projects */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'overview' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
          >
            סקירה
          </button>
          <button
            onClick={() => setActiveTab('board')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'board'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            טבלה
          </button>
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'kanban' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Kanban
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'timeline' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Timeline
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'projects'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            פרויקטים
          </button>
          <button
            onClick={() => setActiveTab('customize')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'customize' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
          >
            התאמה אישית
          </button>
        </div>
      </div>

      {/* Tab View */}
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
