import React, { useState, useContext } from 'react';
import PatientDirectory from './PatientDirectory';
import LeadsPipeline from './LeadsPipeline';
import { LanguageContext } from '../context/LanguageContext';

const ClientCrmManager = ({ navigate, initialTab = 'patients' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { t } = useContext(LanguageContext);

  return (
    <div className="space-y-6 text-start">
      {/* Module Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:px-6 sm:py-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {t('Clients & Leads CRM', 'ניהול לקוחות ולידים (CRM)')}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {t('Manage patient records, track leads, and manage client conversion.', 'נהל תיקי מטופלים, עקוב אחר לידים ונהל את תהליך הפיכת ליד למטופל.')}
          </p>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('patients')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'patients'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>{t('Patients Directory', 'ספר מטופלים')}</span>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'leads'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{t('Leads Pipeline', 'צנרת לידים')}</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'patients' && <PatientDirectory />}
        {activeTab === 'leads' && <LeadsPipeline navigate={navigate} />}
      </div>
    </div>
  );
};

export default ClientCrmManager;
