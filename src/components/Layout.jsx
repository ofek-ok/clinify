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
import TrashView from './TrashView';
import ClientDetailDrawer from './ClientDetailDrawer';
import { LanguageContext } from '../context/LanguageContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  CheckSquare,
  Video,
  FileText,
  Settings,
  Trash2,
  Languages,
  Menu
} from 'lucide-react';

const Layout = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedType, setSelectedType] = useState('patient');

  const { language, toggleLanguage, t } = useContext(LanguageContext);

  const modules = [
    { id: 'dashboard', name: t('Dashboard', 'סקירה'), icon: LayoutDashboard },
    { id: 'crm', name: 'CRM', icon: Users },
    { id: 'calendar', name: t('Calendar', 'יומן'), icon: Calendar },
    { id: 'finance', name: t('Finance', 'כספים'), icon: CreditCard },
    { id: 'work', name: t('Work', 'עבודה'), icon: CheckSquare },
    { id: 'content', name: t('Content', 'תוכן'), icon: Video },
    { id: 'forms', name: t('Forms', 'טפסים'), icon: FileText },
    { id: 'settings', name: t('Settings', 'הגדרות'), icon: Settings },
    { id: 'trash', name: t('Trash', 'אשפה'), icon: Trash2 },
  ];

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
      case 'trash':
        return <TrashView />;
      default:
        return <DashboardOverview navigate={setActiveModule} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans text-start dir-rtl">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="סגור תפריט"
          className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 start-0 z-50 flex w-60 shrink-0 flex-col border-e border-slate-800 bg-slate-950 text-slate-300 transition-transform duration-200 lg:static lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : (language === 'he' ? 'translate-x-full' : '-translate-x-full')
      }`}>
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-800 px-5">
          <img src="/clinify-logo.png" alt="Clinify" className="h-7 w-7 object-contain" />
          <div>
            <h1 className="text-base font-semibold tracking-tight text-white">Clinify</h1>
            <p className="mt-0.5 text-[10px] text-slate-500">Business workspace</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {modules.map((mod) => {
            const Icon = mod.icon;
            const isActive = activeModule === mod.id ||
              (mod.id === 'crm' && ['leads', 'clients', 'patients'].includes(activeModule)) ||
              (mod.id === 'calendar' && activeModule === 'appointments') ||
              (mod.id === 'finance' && ['payments', 'financials', 'income', 'expenses'].includes(activeModule)) ||
              (mod.id === 'work' && ['tasks', 'projects', 'board'].includes(activeModule)) ||
              (mod.id === 'forms' && activeModule === 'formBuilder') ||
              (mod.id === 'content' && activeModule === 'content_os') ||
              (mod.id === 'settings' && activeModule === 'services');

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  setActiveModule(mod.id);
                  setIsSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="truncate">{mod.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-slate-800 p-3">
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
          >
            <span className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              <span>{language === 'he' ? 'עברית' : 'English'}</span>
            </span>
            <span className="text-[10px] text-slate-500">{language === 'he' ? 'EN' : 'HE'}</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-50">
        <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-4 lg:hidden">
          <button
            type="button"
            aria-label="פתח תפריט"
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="mr-3 flex items-center gap-2">
            <img src="/clinify-logo.png" alt="Clinify" className="h-6 w-6 object-contain" />
            <span className="text-sm font-semibold text-slate-900">Clinify</span>
          </div>
        </header>

        <main className="clinify-workspace flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1440px]">
            {renderModule()}
          </div>
        </main>
      </div>

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
