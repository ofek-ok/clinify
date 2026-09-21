import React, { useState, useContext } from 'react';
import DashboardOverview from './DashboardOverview';
import CalendarView from './CalendarView';
import LeadsPipeline from './LeadsPipeline';
import PatientDirectory from './PatientDirectory';
import ClientDetailDrawer from './ClientDetailDrawer';
import TaskManagement from './TaskManagement';
import ProjectsManager from './ProjectsManager';
import ContentManager from './ContentManager';
import BusinessSettings from './BusinessSettings';
import FormManager from './FormManager';
import FormBuilder from './FormBuilder';
import FinancialManager from './FinancialManager';
import { LanguageContext } from '../context/LanguageContext';
import { ClinicContext } from '../context/ClinicContext';

const Layout = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedType, setSelectedType] = useState('patient');
  
  const { language, toggleLanguage, t } = useContext(LanguageContext);
  const { isLoading, user, signOut } = useContext(ClinicContext);

  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || t('Ofek Okonski', 'אופק אוקונסקי');
  const userInitial = userDisplayName.charAt(0).toUpperCase();

  const modules = [
    { 
      id: 'dashboard', 
      name: t('Dashboard', 'סקירה'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    { 
      id: 'leads', 
      name: t('Leads', 'לידים'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: 'clients', 
      name: t('Clients', 'לקוחות'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    { 
      id: 'calendar', 
      name: t('Calendar', 'יומן'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: 'payments', 
      name: t('Payments', 'תשלומים'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 8v2m0-6c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      id: 'tasks', 
      name: t('Tasks', 'משימות'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 01-2-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    },
    { 
      id: 'projects', 
      name: t('Projects', 'פרויקטים'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    { 
      id: 'content', 
      name: t('Content', 'תוכן'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      id: 'forms', 
      name: t('Forms', 'טפסים'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: 'settings', 
      name: t('Settings', 'הגדרות'), 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        </svg>
      )
    },
  ];

  const handleSelectClient = (client, type = 'patient') => {
    setSelectedClient(client);
    setSelectedType(type);
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': 
        return <DashboardOverview navigate={setActiveModule} />;
      case 'leads': 
        return <LeadsPipeline navigate={setActiveModule} onSelectLead={(lead) => handleSelectClient(lead, 'lead')} />;
      case 'clients': 
      case 'patients': 
        return <PatientDirectory onSelectPatient={(patient) => handleSelectClient(patient, 'patient')} />;
      case 'calendar': 
      case 'appointments': 
        return <CalendarView initialTab="grid" />;
      case 'payments':
      case 'financials':
      case 'finance': 
        return <FinancialManager />;
      case 'tasks': 
        return <TaskManagement />;
      case 'projects':
        return <ProjectsManager />;
      case 'content':
      case 'content_os':
        return <ContentManager />;
      case 'forms': 
        return <FormManager navigate={setActiveModule} />;
      case 'formBuilder': 
        return <FormBuilder navigate={setActiveModule} />;
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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 start-0 z-50 w-64 bg-slate-900 text-slate-300 transform transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : (language === 'he' ? 'translate-x-full' : '-translate-x-full')} border-e border-slate-800 flex flex-col shrink-0`}>
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-800 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
            C
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Clinify</h1>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {modules.map((mod) => {
            const isActive = activeModule === mod.id || 
              (mod.id === 'clients' && activeModule === 'patients') ||
              (mod.id === 'calendar' && activeModule === 'appointments') ||
              (mod.id === 'payments' && (activeModule === 'financials' || activeModule === 'finance')) ||
              (mod.id === 'forms' && activeModule === 'formBuilder') ||
              (mod.id === 'content' && activeModule === 'content_os');

            return (
              <button
                key={mod.id}
                onClick={() => { setActiveModule(mod.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive 
                    ? 'text-white bg-slate-800 font-bold border border-slate-700 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>
                  {mod.icon}
                </span>
                <span className="truncate">{mod.name}</span>
              </button>
            )
          })}
        </nav>
        
        {/* User Profile & Language Switcher */}
        <div className="p-4 border-t border-slate-800 shrink-0 space-y-3">
          <button 
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors border border-slate-700/60"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              <span>{language === 'he' ? 'עברית (HE)' : 'English (EN)'}</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-700 px-1.5 py-0.5 rounded">
              {language === 'he' ? 'EN' : 'HE'}
            </span>
          </button>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-xs">
                {userInitial}
              </div>
              <div className="truncate max-w-[110px]">
                <p className="text-xs font-semibold text-white truncate">{userDisplayName}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email || 'ofek@clinify.co'}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Header Bar for Mobile Toggle */}
        <header className="h-14 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 sm:px-6 lg:hidden shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-slate-500 hover:text-slate-800 p-1 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                C
              </div>
              <span className="font-bold text-slate-900 text-sm">Clinify</span>
            </div>
          </div>
        </header>

        {/* Main Scrolling Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            {renderModule()}
          </div>
        </main>
      </div>

      {/* Slide-Over Client Detail Drawer */}
      {selectedClient && (
        <ClientDetailDrawer 
          item={selectedClient} 
          type={selectedType} 
          onClose={() => setSelectedClient(null)} 
        />
      )}
    </div>
  );
};

export default Layout;
