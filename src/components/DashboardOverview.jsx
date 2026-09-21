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
    payments,
    todayStr,
    getPatientName,
    getServiceName,
    updateTaskStatus,
    updateLeadStatus
  } = useContext(ClinicContext);
  
  const { t } = useContext(LanguageContext);
  const [viewMode, setViewMode] = useState('overview');

  const currentDateFormatted = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, []);

  // Top Metrics
  const todayAppointments = useMemo(() => {
    return appointments.filter(appt => appt.appointment_date.startsWith(todayStr))
      .sort((a,b) => new Date(a.appointment_date) - new Date(b.appointment_date));
  }, [appointments, todayStr]);

  const openLeadsCount = useMemo(() => {
    return leads.filter(l => l.status === 'new' || l.status === 'contacted').length;
  }, [leads]);

  const tasksDueToday = useMemo(() => {
    return tasks.filter(t => t.due_date === todayStr && t.status !== 'done');
  }, [tasks, todayStr]);

  const unpaidCompletedAppointments = useMemo(() => {
    return appointments.filter(appt => {
      if (appt.status !== 'completed') return false;
      const payment = payments.find(p => p.appointment_id === appt.id && p.status === 'paid');
      return !payment;
    });
  }, [appointments, payments]);

  const pendingPaymentsTotal = useMemo(() => {
    return unpaidCompletedAppointments.reduce((sum, appt) => {
      const service = services.find(s => String(s.id) === String(appt.service_id));
      return sum + (service ? Number(service.default_price || 0) : 0);
    }, 0);
  }, [unpaidCompletedAppointments, services]);

  // Action Items (דורש טיפול)
  const overdueTasks = useMemo(() => {
    return tasks.filter(t => t.due_date < todayStr && t.status !== 'done');
  }, [tasks, todayStr]);

  const leadsAwaitingResponse = useMemo(() => {
    return leads.filter(l => l.status === 'new');
  }, [leads]);

  // Derived Business Metrics
  const totalCustomersCount = people.filter(p => p.client_status === 'customer').length;
  const totalRevenueThisMonth = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return payments
      .filter(p => p.status === 'paid' && p.payment_date?.startsWith(currentMonth))
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
              <p className="text-xs text-slate-400 mt-1">{unpaidAppointments.length} {t('unpaid sessions', 'טיפולים שלא נגבו')}</p>
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
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">{t("Upcoming Appointments", "תורים קרובים")}</h3>
                <button onClick={() => navigate('calendar')} className="text-xs text-slate-600 hover:text-slate-900 font-medium">
                  {t('View Calendar', 'לכל התורים ➔')}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-start border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-medium border-b border-slate-100">
                      <th className="py-2.5 px-4 text-start">{t('Time', 'שעה')}</th>
                      <th className="py-2.5 px-4 text-start">{t('Client', 'לקוח/מטופל')}</th>
                      <th className="py-2.5 px-4 text-start">{t('Service', 'שירות')}</th>
                      <th className="py-2.5 px-4 text-end">{t('Status', 'סטטוס')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {todayAppointments.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-slate-400 font-medium">
                          {t('No appointments scheduled for today.', 'אין תורים מתוכננים להיום.')}
                        </td>
                      </tr>
                    ) : (
                      todayAppointments.map(appt => {
                        const time = new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                          <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-700">{time}</td>
                            <td className="py-3 px-4 font-bold text-slate-800">{getPatientName(appt.patient_id)}</td>
                            <td className="py-3 px-4 text-slate-600">{getServiceName(appt.service_id)}</td>
                            <td className="py-3 px-4 text-end">
                              <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                                {translateStatus(appt.status)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Summary Sidebar */}
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <p className="text-xs font-medium text-slate-500">{t('Total Customers', 'לקוחות')}</p>
                <h4 className="text-2xl font-bold text-slate-800">{totalCustomersCount}</h4>
                <p className="text-xs text-slate-400">{patients.length} {t('total registered profiles', 'פרופילים רשומים במערכת')}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <p className="text-xs font-medium text-slate-500">{t('Monthly Revenue', 'הכנסות החודש')}</p>
                <h4 className="text-2xl font-bold text-slate-800" dir="ltr">₪{totalRevenueThisMonth.toFixed(2)}</h4>
                <p className="text-xs text-slate-400">{t('Paid transactions this month', 'תשלומים שנסגרו החודש')}</p>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default DashboardOverview;
