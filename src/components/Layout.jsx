import React, { useState, useContext } from 'react';
import DashboardOverview from './DashboardOverview';
import CalendarView from './CalendarView';
import ClientCrmManager from './ClientCrmManager';
import WorkManager from './WorkManager';
import FinanceView from './FinanceView';
import ContentManager from './ContentManager';
import BusinessSettings from './BusinessSettings';
import FormManager from './FormManager';
import FormBuilder from './FormBuilder';
import ClientDetailDrawer from './ClientDetailDrawer';
import { LanguageContext } from '../context/LanguageContext';
import { ClinicContext } from '../context/ClinicContext';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  CheckSquare, 
  Video, 
  FileText, 
  Settings,
  Languages,
  Menu
} from 'lucide-react';

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
    { id: 'dashboard', name: t('Dashboard', 'סקירה'), icon: LayoutDashboard },
    { id: 'crm', name: t('CRM', 'CRM'), icon: Users },
    { id: 'calendar', name: t('Calendar', 'יומן'), icon: Calendar },
    { id: 'finance', name: t('Finance', 'כספים'), icon: CreditCard },
    { id: 'work', name: t('Work', 'עבודה'), icon: CheckSquare },
    { id: 'content', name: t('Content', 'תוכן'), icon: Video },
    { id: 'forms', name: t('Forms', 'טפסים'), icon: FileText },
    { id: 'settings', name: t('Settings', 'הגדרות'), icon: Settings },
  ];

  const handleSelectClient = (client, type = 'patient') => {
    setSelectedClient(client);
    setSelectedType(type);
  };

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard': 
        return <DashboardOverview navigate={setActiveModule} />;
      case 'crm':
      case 'leads': 
      case 'clients': 
      case 'patients': 
        return <ClientCrmManager initialTab={activeModule === 'patients' || activeModule === 'clients' ? 'clients' : 'leads'} />;
      case 'calendar': 
      case 'appointments': 
        return <CalendarView initialTab="grid" />;
      case 'finance':
      case 'payments':
      case 'financials':
      case 'income':
      case 'expenses': 
        return <FinanceView initialTab={activeModule === 'income' ? 'income' : activeModule === 'expenses' ? 'expenses' : 'overview'} />;
      case 'work':
      case 'tasks': 
      case 'projects':
      case 'board':
        return <WorkManager initialTab={activeModule === 'projects' ? 'projects' : 'board'} />;
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
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans text-start dir-rtl">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 start-0 z-50 w-60 bg-slate-900 text-slate-300 transform transition-transform duration-300 lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : (language === 'he' ? 'translate-x-full' : '-translate-x-full')} border-e border-slate-800 flex flex-col shrink-0`}>
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 h-16 px-5 border-b border-slate-800 shrink-0">
          <img src="/clinify-logo.png" alt="Clinify" className="w-7 h-7 object-contain" />
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Clinify</h1>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const isActive = activeModule === mod.id || 
              (mod.id === 'crm' && (activeModule === 'leads' || activeModule === 'clients' || activeModule === 'patients')) ||
              (mod.id === 'calendar' && activeModule === 'appointments') ||
              (mod.id === 'finance' && (activeModule === 'payments' || activeModule === 'financials' || activeModule === 'income' || activeModule === 'expenses')) ||
              (mod.id === 'work' && (activeModule === 'tasks' || activeModule === 'projects' || activeModule === 'board')) ||
              (mod.id === 'forms' && activeModule === 'formBuilder') ||
              (mod.id === 'content' && activeModule === 'content_os') ||
              (mod.id === 'settings' && activeModule === 'services');

            return (
              <button
                key={mod.id}
                onClick={() => { setActiveModule(mod.id); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive 
                    ? 'text-white bg-emerald-600 shadow-xs' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{mod.name}</span>
              </button>
            );
          })}
        </nav>
        
        {/* Language Switcher Footer */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <button 
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 text-slate-300 text-xs font-medium transition-colors border border-slate-800"
          >
            <span className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-slate-400" />
              <span>{language === 'he' ? 'עברית (HE)' : 'English (EN)'}</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
              {language === 'he' ? 'EN' : 'HE'}
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
        
        {/* Top Header Bar for Mobile Toggle */}
        <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 lg:hidden shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/clinify-logo.png" alt="Clinify" className="w-6 h-6 object-contain" />
              <span className="font-bold text-white text-sm">Clinify</span>
            </div>
          </div>
        </header>

        {/* Main Scrolling Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950">
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
