import React, { useState } from 'react';
import TaskManagement from './TaskManagement';
import ProjectsManager from './ProjectsManager';

export default function WorkManager({ initialTab = 'board' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="space-y-6 dir-rtl text-start">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white tracking-tight">עבודה</h1>
        
        {/* Tabs: Board | Projects */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('board')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'board'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            לוח
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'projects'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            פרויקטים
          </button>
        </div>
      </div>

      {/* Tab View */}
      <div>
        {activeTab === 'board' && <TaskManagement />}
        {activeTab === 'projects' && <ProjectsManager />}
      </div>
    </div>
  );
}
