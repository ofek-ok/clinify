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
  const [viewMode, setViewMode] = useState('overview'); // 'overview' or 'analytics'

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
      'scheduled': t('Scheduled', 'נקבע'),
      'completed': t('Completed', 'הושלם'),
      'cancelled': t('Cancelled', 'בוטל')
    };
    return statusMap[status] || status;
  };

  const translatePriority = (priority) => {
    const map = { 'high': t('High', 'גבוה'), 'medium': t('Medium', 'בינוני'), 'low': t('Low', 'נמוך') };
    return map[priority] || priority;
  };

  const translateSource = (source) => {
    const map = { 'Facebook': t('Facebook', 'פייסבוק'), 'Website': t('Website', 'אתר'), 'WhatsApp': t('WhatsApp', 'ווטסאפ'), 'Direct': t('Direct', 'ישיר') };
    return map[source] || source;
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8 pb-12 text-start">
      {/* Header & Mode Switcher */}
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{t('Master Dashboard', 'דשבורד ניהול ראשי')}</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">{t('Your clinical operations overview for today.', 'הסקירה הכללית של תפעול הקליניקה שלך להיום.')}</p>
        </div>
        <div className="bg-slate-200/60 p-1.5 rounded-xl flex gap-1 border border-slate-300/50">
          <button 
            onClick={() => setViewMode('overview')} 
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              viewMode === 'overview' 
                ? 'bg-white text-cyan-800 shadow-sm border border-slate-200' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('Operations', 'פעילות שוטפת')}
          </button>
          <button 
            onClick={() => setViewMode('analytics')} 
            className={`px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 flex items-center gap-2 ${
              viewMode === 'analytics' 
                ? 'bg-white text-cyan-700 shadow-sm border border-slate-200' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            {t('Analytics Data', 'נתוני אנליטיקה')}
          </button>
        </div>
      </div>
      
      {viewMode === 'analytics' ? (
        <div className="mt-4 pt-4">
          <AnalyticsView />
        </div>
      ) : (
        <>
          {/* 1. Top KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Active Patients */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group">
              <div className="absolute top-0 end-0 w-24 h-24 -me-8 -mt-8 bg-cyan-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-cyan-500/20 transition-all"></div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('Active Patients', 'מטופלים פעילים')}</p>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{activePatientsCount}</p>
              </div>
              <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600 gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                <span>+8.2% {t('growth', 'צמיחה')}</span>
              </div>
            </div>
            
            {/* New Leads */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group">
              <div className="absolute top-0 end-0 w-24 h-24 -me-8 -mt-8 bg-violet-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/20 transition-all"></div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('New Leads', 'לידים חדשים')}</p>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{newLeads.length}</p>
              </div>
              <div className="mt-3 flex items-center text-xs font-semibold text-violet-600 gap-1">
                <span>{t('Awaiting response', 'ממתינים למענה')}</span>
              </div>
            </div>

            {/* Appointments Today */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md group">
              <div className="absolute top-0 end-0 w-24 h-24 -me-8 -mt-8 bg-emerald-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/20 transition-all"></div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('Appointments Today', 'תורים להיום')}</p>
                <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{todayAppointments.length}</p>
              </div>
              <div className="mt-3 flex items-center text-xs font-semibold text-emerald-600 gap-1">
                <span>{todayAppointments.filter(a => a.status === 'completed').length} {t('completed', 'הושלמו')}</span>
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 text-white">
              <div className="absolute top-0 end-0 w-28 h-28 -me-8 -mt-8 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative z-10">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t('Revenue This Month', 'הכנסות החודש')}</p>
                <p className="text-3xl font-extrabold tracking-tight text-white"><span className="text-xl opacity-60 me-1">₪</span>{revenueThisMonth.toFixed(2)}</p>
                <div className="mt-3 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                  <span>+12.4% {t('vs last month', 'מהחודש שעבר')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Layout Grid (Bento) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            
            {/* Center/Left: Today's Operations */}
            <div className="xl:col-span-2 space-y-5">
              
              {/* Appointments Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    {t("Today's Appointments", "התורים של היום")}
                  </h3>
                  <button 
                    onClick={() => navigate('appointments')} 
                    className="text-xs font-bold text-cyan-700 hover:text-cyan-800 transition-colors tracking-wide hover:underline"
                  >
                    {t('View All', 'הצג הכל ➔')}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-6 text-start">{t('Time', 'שעה')}</th>
                        <th className="py-3 px-6 text-start">{t('Patient', 'מטופל')}</th>
                        <th className="py-3 px-6 text-start">{t('Service', 'שירות')}</th>
                        <th className="py-3 px-6 text-end">{t('Status', 'סטטוס')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {todayAppointments.length === 0 ? (
                        <tr><td colSpan="4" className="py-10 text-center text-sm font-medium text-slate-400">{t('No appointments scheduled for today.', 'אין תורים להיום.')}</td></tr>
                      ) : (
                        todayAppointments.map(appt => {
                          const time = new Date(appt.appointment_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                          let statusColor = appt.status === 'completed' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : appt.status === 'cancelled' ? "bg-slate-100 text-slate-500 border-slate-200" : "bg-cyan-100 text-cyan-800 border-cyan-200";
                          return (
                            <tr key={appt.id} className="hover:bg-slate-50/60 transition-colors group">
                              <td className="py-4 px-6 text-xs font-bold text-slate-500 text-start">{time}</td>
                              <td className="py-4 px-6 font-bold text-slate-800 text-start">{getPatientName(appt.patient_id)}</td>
                              <td className="py-4 px-6 text-slate-600 text-xs font-medium text-start">{getServiceName(appt.service_id)}</td>
                              <td className="py-4 px-6 text-end">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
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
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-800"></span>
                    {t("Today's Tasks", "משימות להיום")}
                  </h3>
                  <span className="bg-slate-100 text-slate-700 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full">{tasksDueToday.length} {t('pending', 'ממתינות')}</span>
                </div>
                <div className="p-6">
                  <div className="space-y-2.5">
                    {tasksDueToday.length === 0 ? (
                      <div className="text-center py-6">
                        <p className="text-slate-400 text-xs font-medium">{t('All caught up for today! 🎉', 'סיימת הכל להיום! 🎉')}</p>
                      </div>
                    ) : (
                      tasksDueToday.map(task => (
                        <div key={task.id} className="flex items-center gap-4 p-3.5 bg-slate-50/60 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all rounded-xl group">
                          <div className="relative flex items-center justify-center me-1">
                            <input 
                              type="checkbox" 
                              checked={task.status === 'done'} 
                              onChange={() => updateTaskStatus(task.id, 'done')} 
                              className="w-5 h-5 text-emerald-600 bg-white border-2 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer transition-all" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{task.title}</p>
                            {task.patient_id && <p className="text-[10px] font-bold text-slate-400 mt-0.5">{t('For:', 'עבור:')} {getPatientName(task.patient_id)}</p>}
                          </div>
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-600'}`}>
                            {translatePriority(task.priority)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Section: Leads & Pending Payments */}
            <div className="xl:col-span-1 space-y-5">
              
              {/* Sales & Pipeline Widget */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
                    {t('Recent Leads', 'לידים אחרונים')}
                  </h3>
                  <button 
                    onClick={() => navigate('leads')} 
                    className="text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors tracking-wide hover:underline"
                  >
                    {t('Pipeline', 'צנרת ➔')}
                  </button>
                </div>
                <div className="p-5 space-y-3 flex-1">
                  {newLeads.length === 0 ? (
                    <p className="text-center text-xs font-medium text-slate-400 py-6">{t('No new leads awaiting follow-up.', 'אין לידים חדשים כרגע.')}</p>
                  ) : (
                    newLeads.slice(0, 4).map(lead => (
                      <div key={lead.id} className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200/80 hover:border-violet-300 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs tracking-tight">{lead.full_name}</h4>
                            <p className="text-[10px] text-slate-500 font-medium" dir="ltr">{lead.phone}</p>
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{translateSource(lead.source)}</span>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <a 
                            href={`tel:${lead.phone}`} 
                            className="flex-1 flex justify-center items-center gap-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold py-1.5 rounded-lg transition-all"
                          >
                            <svg className="w-3 h-3 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                            {t('Call', 'חייג')}
                          </a>
                          <button 
                            onClick={() => { updateLeadStatus(lead.id, 'contacted'); navigate('leads'); }} 
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-1.5 rounded-lg transition-all shadow-sm"
                          >
                            {t('Follow Up', 'פולואו-אפ')}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Financial Widget: Pending Payments */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    {t('Pending Payments', 'תשלומים ממתינים לגבייה')}
                  </h3>
                  <span className="text-base font-extrabold text-emerald-700" dir="ltr">
                    <span className="opacity-50">₪</span>{pendingPaymentsTotal.toFixed(2)}
                  </span>
                </div>
                <div className="p-5">
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
                    {unpaidAppointments.length === 0 ? (
                      <p className="text-center text-xs font-medium text-slate-400 py-4">{t('No pending payments! 🎉', 'אין תשלומים ממתינים! 🎉')}</p>
                    ) : (
                      unpaidAppointments.map(appt => {
                        const service = services.find(s => s.id === appt.service_id);
                        const amount = service ? service.default_price : 0;
                        return (
                          <div key={appt.id} className="flex justify-between items-center p-3 bg-slate-50/60 border border-slate-200/80 rounded-xl hover:border-emerald-300 transition-colors">
                            <div>
                              <p className="font-bold text-slate-800 text-xs">{getPatientName(appt.patient_id)}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{new Date(appt.appointment_date).toLocaleDateString('he-IL')}</p>
                            </div>
                            <div className="text-end flex flex-col items-end gap-1">
                              <span className="font-bold text-slate-900 text-xs" dir="ltr">₪{amount.toFixed(2)}</span>
                              <button 
                                onClick={() => navigate('appointments')} 
                                className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded transition-colors"
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
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardOverview;
