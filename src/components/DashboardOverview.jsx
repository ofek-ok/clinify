import React, { useContext, useMemo, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import AnalyticsView from './AnalyticsView';

const DashboardOverview = ({ navigate }) => {
  const { 
    people,
    patients, 
    leads, 
    appointments, 
    services,
    tasks,
    projects,
    contentItems,
    performanceList,
    payments,
    todayStr,
    getPatientName,
    getServiceName,
    updateTaskStatus,
    updateLeadStatus
  } = useContext(ClinicContext);
  
  const { t } = useContext(LanguageContext);
  const [viewMode, setViewMode] = useState('command_center');

  // Operational Attention Center Indicators
  const overdueTasks = useMemo(() => {
    return tasks.filter(t => t.due_date < todayStr && t.status !== 'done');
  }, [tasks, todayStr]);

  const blockedTasks = useMemo(() => {
    return tasks.filter(t => t.status === 'blocked');
  }, [tasks]);

  const unpaidCompletedAppointments = useMemo(() => {
    return appointments.filter(appt => {
      if (appt.status !== 'completed') return false;
      const payment = payments.find(p => p.appointment_id === appt.id && p.status === 'paid');
      return !payment;
    });
  }, [appointments, payments]);

  const leadsNeedingFollowup = useMemo(() => {
    return leads.filter(l => l.status === 'new' || l.status === 'contacted');
  }, [leads]);

  // Derived Business Metrics
  const totalCustomersCount = people.filter(p => p.client_status === 'customer').length;
  const totalActivePatients = patients.filter(p => (p.status || 'active') === 'active').length;
  const totalRevenue = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalPerformanceListSignups = performanceList.length;

  return (
    <div className="animate-in fade-in duration-500 space-y-6 pb-12 text-start">
      
      {/* OP Command Center Executive Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping"></span>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{t('OP Command Center', 'OP Command Center — מרכז השליטה האופרטיבי')}</h2>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            {t('Okonski Performance Operational OS • High-level overview & Attention Center.', 'מערכת הפעלה מרכזית לניהול ביצועים, קהלים, משימות ואנליטיקה.')}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 border border-slate-200">
          <button 
            onClick={() => setViewMode('command_center')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'command_center' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('Command Center', 'מרכז שליטה')}
          </button>
          <button 
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'analytics' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('Financial & Operations Analytics', 'אנליטיקה ודוחות')}
          </button>
        </div>
      </div>

      {viewMode === 'analytics' ? (
        <AnalyticsView />
      ) : (
        <div className="space-y-6">

          {/* ATTENTION CENTER (Operational Alerts) */}
          {(overdueTasks.length > 0 || blockedTasks.length > 0 || unpaidCompletedAppointments.length > 0 || leadsNeedingFollowup.length > 0) && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  ⚡ {t('Attention Center', 'Attention Center — פריטים הנדרשים לטיפול מידי')}
                </h3>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  {overdueTasks.length + blockedTasks.length + unpaidCompletedAppointments.length + leadsNeedingFollowup.length} {t('action items', 'פעולות ממתינות')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Overdue Tasks Alert */}
                {overdueTasks.length > 0 && (
                  <div onClick={() => navigate('tasks')} className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs cursor-pointer hover:border-rose-400 transition-all">
                    <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">{t('Overdue Tasks', 'משימות באיחור')}</p>
                    <p className="text-xl font-extrabold text-slate-800 mt-1">{overdueTasks.length}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t('Click to review overdue tasks', 'לחץ לצפייה במשימות')}</p>
                  </div>
                )}

                {/* Blocked Tasks Alert */}
                {blockedTasks.length > 0 && (
                  <div onClick={() => navigate('tasks')} className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs cursor-pointer hover:border-amber-400 transition-all">
                    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">{t('Blocked Tasks', 'משימות חסומות')}</p>
                    <p className="text-xl font-extrabold text-slate-800 mt-1">{blockedTasks.length}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t('Unblock dependencies', 'לחץ להתרת חסמים')}</p>
                  </div>
                )}

                {/* Unpaid Completed Sessions Alert */}
                {unpaidCompletedAppointments.length > 0 && (
                  <div onClick={() => navigate('appointments')} className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-xs cursor-pointer hover:border-purple-400 transition-all">
                    <p className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">{t('Unpaid Completed Sessions', 'מפגשים שלא נגבו')}</p>
                    <p className="text-xl font-extrabold text-slate-800 mt-1">{unpaidCompletedAppointments.length}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t('Complete billing to convert to Customer', 'לחץ לרישום תשלום')}</p>
                  </div>
                )}

                {/* Leads Needing Followup */}
                {leadsNeedingFollowup.length > 0 && (
                  <div onClick={() => navigate('leads')} className="bg-white p-3.5 rounded-xl border border-blue-200 shadow-xs cursor-pointer hover:border-blue-400 transition-all">
                    <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">{t('Open Leads', 'לידים בטיפול')}</p>
                    <p className="text-xl font-extrabold text-slate-800 mt-1">{leadsNeedingFollowup.length}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t('Open CRM Pipeline', 'לחץ לפתיחת ה-CRM')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Real Derived Core Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('Total Customers', 'לקוחות משלמים (Customers)')}</p>
              <h3 className="text-3xl font-extrabold text-slate-800">{totalCustomersCount}</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">{totalActivePatients} {t('active clinical profiles', 'פרופילים קליניים פעילים')}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('Performance List Signups', 'רשימת ביצועים (Signups)')}</p>
              <h3 className="text-3xl font-extrabold text-slate-800">{totalPerformanceListSignups}</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">{t('Pre-launch acquisition list', 'הרשמות מוקדמות ב-UTM')}</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('Active Strategic Projects', 'פרויקטים אסטרטגיים')}</p>
              <h3 className="text-3xl font-extrabold text-slate-800">{projects.length}</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">{tasks.filter(t => t.status !== 'done').length} {t('active tasks in queue', 'משימות פעילות בתור')}</p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl text-white shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('Total Real Revenue', 'סה"כ הכנסות שנגבו (Paid)')}</p>
              <h3 className="text-3xl font-extrabold text-white" dir="ltr">₪{totalRevenue.toFixed(2)}</h3>
              <p className="text-xs text-emerald-400 mt-2 font-semibold">100% {t('real Supabase ledger', 'מאומת מול מסד הנתונים')}</p>
            </div>
          </div>

          {/* Module Snapshots Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Active Projects Snapshot */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">📁 {t('Active Projects', 'פרויקטים פעילים')}</h3>
                <button onClick={() => navigate('tasks')} className="text-xs font-bold text-blue-600 hover:underline">{t('View All', 'לכל הפרויקטים')}</button>
              </div>
              <div className="space-y-3">
                {projects.slice(0, 3).map(p => (
                  <div key={p.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex justify-between text-xs font-bold text-slate-800">
                      <span>{p.name}</span>
                      <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded">{p.area}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-slate-900 rounded-full" style={{ width: `${p.progress}%` }}></div>
                    </div>
                  </div>
                ))}
                {projects.length === 0 && <p className="text-xs text-slate-400 text-center py-4">{t('No active projects', 'אין פרויקטים פעילים')}</p>}
              </div>
            </div>

            {/* Content OS Snapshot */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">📱 {t('Content OS Pipeline', 'צינור הפקת התוכן')}</h3>
                <button onClick={() => navigate('content_os')} className="text-xs font-bold text-blue-600 hover:underline">{t('View Content OS', 'למערכת התוכן')}</button>
              </div>
              <div className="space-y-2">
                {[
                  { status: 'in_production', label: t('In Production', 'בהפקה') },
                  { status: 'ready', label: t('Ready to Publish', 'מוכן לפרסום') },
                  { status: 'published', label: t('Published', 'פורסם') }
                ].map(st => {
                  const count = contentItems.filter(c => c.status === st.status).length;
                  return (
                    <div key={st.status} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-700">{st.label}</span>
                      <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Performance List Snapshot */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">🔥 {t('Performance List Latest', 'נרשמים אחרונים')}</h3>
                <button onClick={() => navigate('performance_list')} className="text-xs font-bold text-blue-600 hover:underline">{t('View List', 'לרשימה המלאה')}</button>
              </div>
              <div className="space-y-2">
                {performanceList.slice(0, 3).map(item => {
                  const person = people.find(p => p.id === item.person_id) || {};
                  return (
                    <div key={item.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-800">{person.full_name || 'נרשם'}</p>
                        <p className="text-[10px] text-slate-400">{person.email || person.phone || '-'}</p>
                      </div>
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                        {item.utm_source || 'direct'}
                      </span>
                    </div>
                  );
                })}
                {performanceList.length === 0 && <p className="text-xs text-slate-400 text-center py-4">{t('No signups yet', 'אין נרשמים עדיין')}</p>}
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
