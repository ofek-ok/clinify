import React, { useState } from 'react';
import PatientDirectory from './PatientDirectory';
import LeadsPipeline from './LeadsPipeline';

export default function ClientCrmManager({ initialTab = 'leads' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="space-y-6 dir-rtl text-start">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">CRM</h1>
        
        {/* Tabs: Leads | Clients */}
        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('leads')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'leads'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            לידים
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'clients'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            לקוחות
          </button>
        </div>
      </div>

      {/* Tab View */}
      <div>
        {activeTab === 'leads' && <LeadsPipeline />}
        {activeTab === 'clients' && <PatientDirectory />}
      </div>
    </div>
  );
}
