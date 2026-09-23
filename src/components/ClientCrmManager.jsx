import React, { useContext, useEffect, useMemo, useState } from 'react';
import PatientDirectory from './PatientDirectory';
import LeadsPipeline from './LeadsPipeline';
import { ClinicContext } from '../context/ClinicContext';

export default function ClientCrmManager({ initialTab = 'leads' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { leads = [], people = [] } = useContext(ClinicContext);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const openLeadsCount = useMemo(
    () => leads.filter(lead => ['new', 'contacted', 'qualified', 'scheduled'].includes(lead.status)).length,
    [leads]
  );

  const customersCount = useMemo(
    () => people.filter(person => person.client_status === 'customer').length,
    [people]
  );

  return (
    <div className="space-y-6 dir-rtl text-start">
      {/* Page Header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">CRM</h1>
        
        {/* Tabs: Leads | Clients */}
        <div className="flex max-w-full overflow-x-auto bg-white p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('leads')}
            className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'leads'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            לידים <span className="mr-1 text-[10px] opacity-75">{openLeadsCount}</span>
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'clients'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            לקוחות <span className="mr-1 text-[10px] opacity-75">{customersCount}</span>
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
