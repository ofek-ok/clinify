import React, { useState, useContext } from 'react';
import DashboardOverview from './DashboardOverview';
import CalendarView from './CalendarView';
import ClientCrmManager from './ClientCrmManager';
import FinanceView from './FinanceView';
import TaskManagement from './TaskManagement';
import BusinessSettings from './BusinessSettings';
import { LanguageContext } from '../context/LanguageContext';
import { ClinicContext } from '../context/ClinicContext';

const Layout = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { language, toggleLanguage, t } = useContext(LanguageContext);
  const { isLoading } = useContext(ClinicContext);

  const modules = [
    { 
      id: 'dashboard', 
      name: t('Dashboard', 'דשבורד ראשי'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    { 
      id: 'calendar', 
      name: t('Calendar & Appointments', 'יומן ותורים'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: 'crm', 
      name: t('Clients & Leads', 'ניהול לקוחות ולידים'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      id: 'finance', 
      name: t('Finance & Billing', 'כספים ופיננסים'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 8v2m0-6c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'tasks', 
      name: t('Tasks', 'משימות ויומן עבודה'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    { 
      id: 'settings', 
      name: t('Settings & Setup', 'הגדרות ותשתית'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        </svg>
      )
    },
  ];

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': 
        return <DashboardOverview navigate={setActiveModule} />;
      case 'calendar': 
        return <CalendarView initialTab="grid" />;
      case 'appointments': 
        return <CalendarView initialTab="list" />;
      case 'crm': 
        return <ClientCrmManager navigate={setActiveModule} initialTab="patients" />;
      case 'patients': 
        return <ClientCrmManager navigate={setActiveModule} initialTab="patients" />;
      case 'leads': 
        return <ClientCrmManager navigate={setActiveModule} initialTab="leads" />;
      case 'finance': 
        return <FinanceView />;
      case 'tasks': 
        return <TaskManagement />;
      case 'forms': 
        return <BusinessSettings navigate={setActiveModule} activeFormSubTab="forms" />;
      case 'formBuilder': 
        return <BusinessSettings navigate={setActiveModule} activeFormSubTab="formBuilder" />;
      case 'services': 
        return <BusinessSettings navigate={setActiveModule} activeFormSubTab="services" />;
      case 'settings': 
        return <BusinessSettings navigate={setActiveModule} activeFormSubTab="hours" />;
      default: 
        return <DashboardOverview navigate={setActiveModule} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans text-start">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Clean Dark Sidebar */}
      <aside className={`fixed inset-y-0 start-0 z-50 w-64 bg-[#0f172a] text-slate-300 transform transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : (language === 'he' ? 'translate-x-full' : '-translate-x-full')} border-e border-slate-800 flex flex-col shrink-0`}>
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 h-20 px-6 border-b border-slate-800 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 font-black">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Clinify</h1>
            <p className="text-[10px] text-slate-400 font-medium">{t('Medical CRM System', 'מערכת ניהול מרפאה')}</p>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t('Navigation', 'תפריט ניווט')}</p>
          {modules.map((mod) => {
            const isActive = activeModule === mod.id || 
              (mod.id === 'calendar' && activeModule === 'appointments') ||
              (mod.id === 'crm' && (activeModule === 'patients' || activeModule === 'leads')) ||
              (mod.id === 'settings' && (activeModule === 'services' || activeModule === 'forms' || activeModule === 'formBuilder'));

            return (
              <button
                key={mod.id}
                onClick={() => { setActiveModule(mod.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive 
                    ? 'text-white bg-slate-800 font-bold border border-slate-700' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className={isActive ? 'text-sky-400' : 'text-slate-400'}>
                  {mod.icon}
                </span>
                <span className="truncate">{mod.name}</span>
              </button>
            )
          })}
        </nav>
        
        {/* User Profile & Language Switcher */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <button 
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-800/60 hover:bg-slate-800 rounded-xl transition-colors mb-3 border border-slate-700/50"
          >
            <span className="text-xs font-semibold text-slate-300">{t('Language', 'שפה')}</span>
            <span className="text-xs font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">{language === 'en' ? 'EN' : 'HE'}</span>
          </button>

          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-white">
              OK
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{t('Dr. Okonski', 'ד"ר אוקונסקי')}</p>
              <p className="text-[10px] text-slate-400 font-medium truncate">{t('Clinic Admin', 'מנהל מערכת')}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main App Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-30 sticky top-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 hover:text-slate-900 p-1.5 rounded-lg border border-slate-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <span className="font-bold text-xs text-slate-800">{modules.find(m => m.id === activeModule)?.name}</span>
          </div>
          <span className="text-xs font-bold text-slate-800">Clinify</span>
        </header>
        
        {/* Main Workspace */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-80 space-y-3">
                <div className="w-10 h-10 border-4 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium text-xs">{t('Loading...', 'טוען נתונים...')}</p>
              </div>
            ) : (
              renderModule()
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
