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
      badge: null,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    { 
      id: 'calendar', 
      name: t('Calendar & Appointments', 'יומן ותורים'), 
      badge: 'LIVE',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: 'crm', 
      name: t('Clients & Leads', 'ניהול לקוחות ולידים'), 
      badge: 'CRM',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      id: 'finance', 
      name: t('Finance & Billing', 'כספים ופיננסים'), 
      badge: 'NEW',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 8v2m0-6c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'tasks', 
      name: t('Tasks', 'משימות ויומן עבודה'), 
      badge: null,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    { 
      id: 'settings', 
      name: t('Settings & Setup', 'הגדרות ותשתית'), 
      badge: null,
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
    <div className="flex h-screen bg-light-mesh text-slate-900 overflow-hidden font-sans text-start">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 lg:hidden animate-in fade-in duration-200" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* High-End Dark Sidebar */}
      <aside className={`fixed inset-y-0 start-0 z-50 w-72 bg-[#070b14] text-slate-300 transform transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : (language === 'he' ? 'translate-x-full' : '-translate-x-full')} border-e border-white/10 flex flex-col shadow-2xl relative overflow-hidden`}>
        
        {/* Glow ambient background element */}
        <div className="absolute top-0 start-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Brand Header */}
        <div className="flex items-center gap-3.5 h-20 px-6 border-b border-white/10 shrink-0 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/20 shrink-0">
            <div className="w-full h-full bg-[#070b14] rounded-[10px] flex items-center justify-center">
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">Clinify</h1>
              <span className="text-[9px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">PRO</span>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">{t('Medical CRM System', 'מערכת ניהול מרפאה')}</p>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto relative z-10">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{t('Navigation Menu', 'תפריט ראשי')}</p>
          {modules.map((mod) => {
            const isActive = activeModule === mod.id || 
              (mod.id === 'calendar' && activeModule === 'appointments') ||
              (mod.id === 'crm' && (activeModule === 'patients' || activeModule === 'leads')) ||
              (mod.id === 'settings' && (activeModule === 'services' || activeModule === 'forms' || activeModule === 'formBuilder'));

            return (
              <button
                key={mod.id}
                onClick={() => { setActiveModule(mod.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all duration-200 group relative overflow-hidden ${
                  isActive 
                    ? 'text-white bg-gradient-to-r from-cyan-500/20 to-teal-500/10 border border-cyan-500/40 shadow-lg shadow-cyan-500/10' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {isActive && (
                  <div className="absolute start-0 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-teal-400 rounded-e-md shadow-glow-cyan"></div>
                )}
                
                <div className="flex items-center gap-3.5">
                  <span className={`transition-all duration-200 ${isActive ? 'text-cyan-400 scale-110' : 'text-slate-500 group-hover:text-slate-300'}`}>
                    {mod.icon}
                  </span>
                  <span className="truncate tracking-wide">{mod.name}</span>
                </div>

                {mod.badge && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                    mod.badge === 'LIVE' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse' 
                      : mod.badge === 'NEW' 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-white/10 text-slate-300'
                  }`}>
                    {mod.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
        
        {/* User Profile & Language Switcher */}
        <div className="p-4 border-t border-white/10 shrink-0 relative z-10 bg-white/[0.02]">
          <button 
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between px-3.5 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all mb-4 border border-white/10"
          >
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>
              <span>{t('System Language', 'שפת המערכת')}</span>
            </span>
            <span className="text-xs font-black text-cyan-400 bg-cyan-500/20 px-2 py-0.5 rounded-md border border-cyan-500/30">{language === 'en' ? 'EN' : 'HE'}</span>
          </button>

          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-xs font-extrabold text-slate-950 shadow-md">
              OK
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{t('Dr. Okonski', 'ד"ר אוקונסקי')}</p>
              <p className="text-[10px] text-emerald-400 font-semibold truncate tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                <span>{t('Clinic Admin', 'מנהל מערכת ראשי')}</span>
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main App Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Mobile Top Header */}
        <header className="lg:hidden h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-30 sticky top-0 text-white">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-300 hover:text-white p-2 rounded-lg bg-slate-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <span className="font-bold text-sm tracking-tight">{modules.find(m => m.id === activeModule)?.name}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-300">Clinify</span>
          </div>
        </header>
        
        {/* Main Scrollable Workspace */}
        <main className="flex-1 overflow-auto z-10">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin shadow-glow-cyan"></div>
                <p className="text-slate-500 font-bold text-sm animate-pulse">{t('Loading Clinify Workspace...', 'טוען את סביבת העבודה Clinify...')}</p>
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
