import React, { useContext, useMemo, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import AnalyticsView from './AnalyticsView';

const DashboardOverview = ({ navigate }) => {
  const { 
    patients, 
    leads, 
    appointments, 
    services,
    tasksDueToday, 
    revenueThisMonth, 
    todayStr,
    getPatientName,
    getServiceName,
    getPaymentForAppointment,
    updateTaskStatus,
    updateLeadStatus
  } = useContext(ClinicContext);
  
  const { t } = useContext(LanguageContext);
  const [viewMode, setViewMode] = useState('overview');

  // Derived metrics
  const activePatientsCount = patients.filter(p => (p.status || 'active') === 'active').length;
  const newLeads = leads.filter(l => l.status === 'new');
  
  const todayAppointments = useMemo(() => {
    return appointments.filter(appt => appt.appointment_date.startsWith(todayStr))
      .sort((a,b) => new Date(a.appointment_date) - new Date(b.appointment_date));
  }, [appointments, todayStr]);

  const unpaidAppointments = useMemo(() => {
    return appointments.filter(appt => {
      return !getPaymentForAppointment(appt.id);
    });
  }, [appointments, getPaymentForAppointment]);

  const pendingPaymentsTotal = unpaidAppointments.reduce((sum, appt) => {
    const service = services.find(s => s.id === appt.service_id);
    return sum + (service ? service.default_price : 0);
  }, 0);

  const translateStatus = (status) => {
    const statusMap = {
      'scheduled': t('Scheduled', 'מתוכנן'),
      'completed': t('Completed', 'בוצע'),
      'cancelled': t('Cancelled', 'בוטל')
    };
    return statusMap[status] || status;
  };

  const translatePriority = (priority) => {
    const map = { 'high': t('High', 'דחוף'), 'medium': t('Medium', 'בינוני'), 'low': t('Low', 'רגיל') };
    return map[priority] || priority;
  };

  const translateSource = (source) => {
    const map = { 'Facebook': t('Facebook', 'פייסבוק'), 'Website': t('Website', 'אתר הקליניקה'), 'WhatsApp': t('WhatsApp', 'ווטסאפ'), 'Direct': t('Direct', 'המלצה / ישיר') };
    return map[source] || source;
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 pb-12 text-start">
      
      {/* Executive Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('Therapy Management Center', 'מרכז ניהול הקליניקה והטיפולים')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('Overview of today\'s sessions, client follow-ups, and clinic tasks.', 'מבט כולל על מפגשי היום, מעקבי מטופלים ומשימות הקליניקה.')}</p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl shrink-0 self-start sm:self-auto">
          <button 
            onClick={() => setViewMode('overview')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'overview'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('Daily Sessions', 'פעילות שוטפת')}
          </button>

          <button 
            onClick={() => setViewMode('analytics')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'analytics'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('Clinic Analytics', 'נתוני אנליטיקה')}
          </button>
        </div>
      </div>

      {viewMode === 'analytics' ? (
        <div className="mt-4">
          <AnalyticsView />
        </div>
      ) : (
        <>
          {/* 4 Clean Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Active Patients */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('Active Patients', 'מטופלים ונועצים פעילים')}</p>
              <h3 className="text-3xl font-extrabold text-slate-800">{activePatientsCount}</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">{t('Active in clinic', 'בתהליך טיפולי רציף')}</p>
            </div>

            {/* New Leads */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('New Inquiries', 'פניות חדשות לקליניקה')}</p>
              <h3 className="text-3xl font-extrabold text-slate-800">{newLeads.length}</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">{t('Awaiting response', 'ממתינים לשיחת היכרות')}</p>
            </div>

            {/* Appointments Today */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('Sessions Today', 'מפגשים להיום')}</p>
              <h3 className="text-3xl font-extrabold text-slate-800">{todayAppointments.length}</h3>
              <p className="text-xs text-slate-500 mt-2 font-medium">{todayAppointments.filter(a => a.status === 'completed').length} {t('completed', 'הושלמו')}</p>
            </div>

            {/* Monthly Revenue */}
            <div className="bg-slate-900 p-5 rounded-2xl text-white shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('Monthly Income', 'הכנסות הקליניקה החודש')}</p>
              <h3 className="text-3xl font-extrabold text-white" dir="ltr">₪{revenueThisMonth.toFixed(2)}</h3>
              <p className="text-xs text-emerald-400 mt-2 font-semibold">+12.4% {t('vs last month', 'מהחודש שעבר')}</p>
            </div>

          </div>

          {/* Operations Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Today's Appointments & Tasks */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Today's Appointments */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-sm">{t("Today's Sessions", "מפגשי הטיפול של היום")}</h3>
                  <button 
                    onClick={() => navigate('appointments')}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline"
                  >
                    {t('View All', 'לכל המפגשים ➔')}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="py-3 px-6 text-start">{t('Time', 'שעה')}</th>
                        <th className="py-3 px-6 text-start">{t('Patient', 'שם המטופל/ת')}</th>
                        <th className="py-3 px-6 text-start">{t('Session Type', 'סוג המפגש')}</th>
                        <th className="py-3 px-6 text-end">{t('Status', 'סטטוס')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {todayAppointments.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-10 text-center text-slate-400 text-xs font-medium">
                            {t('No sessions scheduled for today.', 'אין מפגשי טיפול מתוכננים להיום.')}
                          </td>
                        </tr>
                      ) : (
                        todayAppointments.map(appt => {
                          const time = new Date(appt.appointment_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                          let statusBadge = appt.status === 'completed' 
                            ? "bg-emerald-100 text-emerald-700" 
                            : appt.status === 'cancelled' 
                            ? "bg-slate-100 text-slate-500" 
                            : "bg-blue-100 text-blue-700";

                          return (
                            <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3.5 px-6 text-xs font-bold text-slate-600 text-start">{time}</td>
                              <td className="py-3.5 px-6 font-bold text-slate-800 text-start">
                                {getPatientName(appt.patient_id)}
                              </td>
                              <td className="py-3.5 px-6 text-xs font-medium text-slate-600 text-start">{getServiceName(appt.service_id)}</td>
                              <td className="py-3.5 px-6 text-end">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusBadge}`}>
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

              {/* Today's Tasks */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-sm">{t("Today's Tasks", "משימות ומעקבי טיפול להיום")}</h3>
                  <span className="text-xs text-slate-500 font-bold">{tasksDueToday.length} {t('pending', 'ממתינות')}</span>
                </div>

                <div className="p-5 space-y-2.5">
                  {tasksDueToday.length === 0 ? (
                    <p className="text-center py-6 text-slate-400 text-xs font-medium">{t('All caught up for today! 🎉', 'אין משימות או מעקבים ממתינים להיום.')}</p>
                  ) : (
                    tasksDueToday.map(task => (
                      <div key={task.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <input 
                          type="checkbox" 
                          checked={task.status === 'done'} 
                          onChange={() => updateTaskStatus(task.id, 'done')} 
                          className="w-4 h-4 text-slate-800 rounded border-slate-300 focus:ring-slate-500 cursor-pointer" 
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{task.title}</p>
                          {task.patient_id && <p className="text-[10px] text-slate-400">{t('Patient:', 'מטופל/ת:')} {getPatientName(task.patient_id)}</p>}
                        </div>
                        <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${
                          task.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {translatePriority(task.priority)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Right Section: Recent Leads & Pending Payments */}
            <div className="xl:col-span-1 space-y-6">
              
              {/* Recent Leads Widget */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 text-sm">{t('Recent Inquiries', 'פניות אחרונות לקליניקה')}</h3>
                  <button 
                    onClick={() => navigate('leads')} 
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 hover:underline"
                  >
                    {t('Pipeline', 'לפניות ➔')}
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  {newLeads.length === 0 ? (
                    <p className="text-center text-xs font-medium text-slate-400 py-6">{t('No new inquiries awaiting response.', 'אין פניות חדשות כרגע.')}</p>
                  ) : (
                    newLeads.slice(0, 4).map(lead => (
                      <div key={lead.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">{lead.full_name}</h4>
                            <p className="text-[10px] text-slate-500" dir="ltr">{lead.phone}</p>
                          </div>
                          <span className="text-[9px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">{translateSource(lead.source)}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <a 
                            href={`tel:${lead.phone}`} 
                            className="flex-1 text-center bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                          >
                            {t('Call', 'חייג')}
                          </a>
                          <button 
                            onClick={() => { updateLeadStatus(lead.id, 'contacted'); navigate('leads'); }} 
                            className="flex-1 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold py-1.5 rounded-lg transition-colors"
                          >
                            {t('Follow Up', 'צור קשר')}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pending Payments Widget */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 text-xs">{t('Pending Payments', 'תשלומים בהמתנה לגבייה')}</h3>
                  <span className="text-sm font-bold text-slate-800" dir="ltr">₪{pendingPaymentsTotal.toFixed(2)}</span>
                </div>
                <div className="p-4 space-y-2.5">
                  {unpaidAppointments.length === 0 ? (
                    <p className="text-center text-xs font-medium text-slate-400 py-4">{t('No pending payments! 🎉', 'אין תשלומים ממתינים!')}</p>
                  ) : (
                    unpaidAppointments.map(appt => {
                      const service = services.find(s => s.id === appt.service_id);
                      const amount = service ? service.default_price : 0;
                      return (
                        <div key={appt.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                          <div>
                            <p className="font-bold text-slate-800 text-xs">{getPatientName(appt.patient_id)}</p>
                            <p className="text-[10px] text-slate-400">{new Date(appt.appointment_date).toLocaleDateString('he-IL')}</p>
                          </div>
                          <div className="text-end flex flex-col items-end gap-1">
                            <span className="font-bold text-slate-800 text-xs" dir="ltr">₪{amount.toFixed(2)}</span>
                            <button 
                              onClick={() => navigate('appointments')} 
                              className="text-[9px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded transition-colors"
                            >
                              {t('Collect', 'גבה תשלום')}
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default DashboardOverview;
