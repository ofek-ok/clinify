import React, { useContext, useMemo, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import AnalyticsView from './AnalyticsView';

const DashboardOverview = ({ navigate }) => {
  const { 
    people = [],
    patients = [], 
    leads = [], 
    appointments = [], 
    services = [],
    tasks = [],
    payments = [],
    todayStr = new Date().toISOString().split('T')[0],
    getPatientName = () => 'מטופל',
    getServiceName = () => 'שירות',
    updateTaskStatus,
    updateLeadStatus
  } = useContext(ClinicContext) || {};
  
  const { t } = useContext(LanguageContext);
  const [viewMode, setViewMode] = useState('overview');

  const currentDateFormatted = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, []);

  // Top Metrics
  const todayAppointments = useMemo(() => {
    if (!Array.isArray(appointments)) return [];
    return appointments.filter(appt => appt && appt.appointment_date && String(appt.appointment_date).startsWith(todayStr))
      .sort((a,b) => new Date(a.appointment_date) - new Date(b.appointment_date));
  }, [appointments, todayStr]);

  const openLeadsCount = useMemo(() => {
    if (!Array.isArray(leads)) return 0;
    return leads.filter(l => l && (l.status === 'new' || l.status === 'contacted')).length;
  }, [leads]);

  const tasksDueToday = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    return tasks.filter(t => t && t.due_date === todayStr && t.status !== 'done');
  }, [tasks, todayStr]);

  const unpaidCompletedAppointments = useMemo(() => {
    if (!Array.isArray(appointments) || !Array.isArray(payments)) return [];
    return appointments.filter(appt => {
      if (!appt || appt.status !== 'completed') return false;
      const payment = payments.find(p => p && p.appointment_id === appt.id && p.status === 'paid');
      return !payment;
    });
  }, [appointments, payments]);

  const pendingPaymentsTotal = useMemo(() => {
    if (!Array.isArray(unpaidCompletedAppointments) || !Array.isArray(services)) return 0;
    return unpaidCompletedAppointments.reduce((sum, appt) => {
      const service = services.find(s => s && String(s.id) === String(appt.service_id));
      return sum + (service ? Number(service.default_price || 0) : 0);
    }, 0);
  }, [unpaidCompletedAppointments, services]);

  // Action Items (דורש טיפול)
  const overdueTasks = useMemo(() => {
    if (!Array.isArray(tasks)) return [];
    return tasks.filter(t => t && t.due_date < todayStr && t.status !== 'done');
  }, [tasks, todayStr]);

  const leadsAwaitingResponse = useMemo(() => {
    if (!Array.isArray(leads)) return [];
    return leads.filter(l => l && l.status === 'new');
  }, [leads]);

  // Derived Business Metrics
  const totalCustomersCount = useMemo(() => {
    if (!Array.isArray(people)) return 0;
    return people.filter(p => p && p.client_status === 'customer').length;
  }, [people]);

  const totalRevenueThisMonth = useMemo(() => {
    if (!Array.isArray(payments)) return 0;
    const currentMonth = new Date().toISOString().slice(0, 7);
    return payments
      .filter(p => p && p.status === 'paid' && p.payment_date && String(p.payment_date).startsWith(currentMonth))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [payments]);

  const translateStatus = (status) => {
    const map = {
      'scheduled': t('Scheduled', 'נקבע'),
      'confirmed': t('Confirmed', 'אושר'),
      'completed': t('Completed', 'הושלם'),
      'cancelled': t('Cancelled', 'בוטל'),
      'no_show': t('No Show', 'לא הגיע'),
      'rescheduled': t('Rescheduled', 'נקבע מחדש')
    };
    return map[status] || status;
  };

  return (
    <div className="space-y-6 text-start font-sans">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {t('Good morning, Ofek', 'בוקר טוב, אופק')}
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            {currentDateFormatted}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg shrink-0 border border-slate-200">
          <button 
            onClick={() => setViewMode('overview')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              viewMode === 'overview' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('Overview', 'סקירה')}
          </button>
          <button 
            onClick={() => setViewMode('analytics')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
              viewMode === 'analytics' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('Analytics', 'אנליטיקה')}
          </button>
        </div>
      </div>

      {viewMode === 'analytics' ? (
        <AnalyticsView />
      ) : (
        <div className="space-y-6">

          {/* Top 4 Operational Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-medium text-slate-500">{t("Today's Appointments", 'תורים היום')}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{todayAppointments.length}</h3>
              <p className="text-xs text-slate-400 mt-1">{todayAppointments.filter(a => a.status === 'completed').length} {t('completed', 'הושלמו')}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-medium text-slate-500">{t('Open Leads', 'לידים פתוחים')}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{openLeadsCount}</h3>
              <p className="text-xs text-slate-400 mt-1">{leadsAwaitingResponse.length} {t('new inquiries', 'חדשים')}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-medium text-slate-500">{t("Tasks Due Today", 'משימות להיום')}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">{tasksDueToday.length}</h3>
              <p className="text-xs text-slate-400 mt-1">{overdueTasks.length} {t('overdue', 'באיחור')}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <p className="text-xs font-medium text-slate-500">{t('Pending Payments', 'תשלומים פתוחים')}</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1" dir="ltr">₪{pendingPaymentsTotal.toFixed(2)}</h3>
              <p className="text-xs text-slate-400 mt-1">{unpaidCompletedAppointments.length} {t('unpaid sessions', 'טיפולים שלא נגבו')}</p>
            </div>
          </div>

          {/* Action Required (דורש טיפול) */}
          {(leadsAwaitingResponse.length > 0 || overdueTasks.length > 0 || unpaidCompletedAppointments.length > 0) && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">
                  {t('Action Required', 'דורש טיפול')}
                </h3>
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {leadsAwaitingResponse.length + overdueTasks.length + unpaidCompletedAppointments.length} {t('items', 'פריטים')}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {leadsAwaitingResponse.length > 0 && (
                  <div onClick={() => navigate('leads')} className="p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                    <p className="text-xs font-bold text-slate-800">{t('New Leads Awaiting Response', 'לידים חדשים שממתינים לחזרה')}</p>
                    <p className="text-lg font-bold text-slate-700 mt-1">{leadsAwaitingResponse.length}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t('Click to open Leads pipeline', 'לחץ למעבר ללידים')}</p>
                  </div>
                )}

                {overdueTasks.length > 0 && (
                  <div onClick={() => navigate('tasks')} className="p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                    <p className="text-xs font-bold text-slate-800">{t('Overdue Tasks', 'משימות באיחור')}</p>
                    <p className="text-lg font-bold text-slate-700 mt-1">{overdueTasks.length}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t('Click to open Tasks', 'לחץ למעבר למשימות')}</p>
                  </div>
                )}

                {unpaidCompletedAppointments.length > 0 && (
                  <div onClick={() => navigate('calendar')} className="p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                    <p className="text-xs font-bold text-slate-800">{t('Unpaid Completed Sessions', 'טיפולים שהושלמו ועדיין לא שולמו')}</p>
                    <p className="text-lg font-bold text-slate-700 mt-1">{unpaidCompletedAppointments.length}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{t('Click to record payment', 'לחץ לרישום תשלום')}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Business Snapshot Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Today & Upcoming Appointments */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-800">{t("Today's Schedule & Sessions", 'לוח מפגשים להיום')}</h3>
                <button 
                  onClick={() => navigate('calendar')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {t('Open Calendar View', 'פתח תצוגת יומן מלאה →')}
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {todayAppointments.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-medium">
                    {t('No appointments scheduled for today.', 'אין תורים מתוכננים להיום.')}
                  </div>
                ) : (
                  todayAppointments.map((appt) => (
                    <div key={appt.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                          {appt.appointment_date ? new Date(appt.appointment_date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{getPatientName(appt.patient_id)}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{getServiceName(appt.service_id)}</p>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                        appt.status === 'completed' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {translateStatus(appt.status)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Metrics Snapshot */}
            <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">{t('Business Performance Snapshot', 'תמונת מצב עסקית')}</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">{t('Total Active Clients', 'סך מטופלים פעילים')}</span>
                  <span className="text-sm font-bold text-slate-800">{totalCustomersCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">{t('Revenue This Month', 'הכנסות החודש')}</span>
                  <span className="text-sm font-bold text-emerald-600" dir="ltr">₪{totalRevenueThisMonth.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
