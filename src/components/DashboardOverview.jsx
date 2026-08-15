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
  const activePatientsCount = patients.filter(p => p.status === 'active').length;
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
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-8 pb-12 text-start">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{t('Master Dashboard', 'דשבורד ניהול ראשי')}</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">{t('Your clinical operations overview for today.', 'הסקירה הכללית של תפעול הקליניקה שלך להיום.')}</p>
        </div>
        <div className="bg-slate-200/50 p-1 rounded-xl flex gap-1 border border-slate-200/50">
          <button onClick={() => setViewMode('overview')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${viewMode === 'overview' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>{t('Operations', 'פעילות')}</button>
          <button onClick={() => setViewMode('analytics')} className={`px-5 py-2 text-sm font-bold rounded-lg transition-all duration-200 flex items-center gap-2 ${viewMode === 'analytics' ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
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
          {/* 1. Top KPI Cards (Summary bar) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Active Patients */}
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 flex items-center justify-between transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-white/90 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('Active Patients', 'מטופלים פעילים')}</p>
                <p className="text-4xl font-extrabold text-slate-800 tracking-tight">{activePatientsCount}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200/50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
            </div>
            
            {/* New Leads */}
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 flex items-center justify-between transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-white/90 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('New Leads', 'לידים חדשים')}</p>
                <p className="text-4xl font-extrabold text-slate-800 tracking-tight">{newLeads.length}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200/50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
              </div>
            </div>

            {/* Appointments Today */}
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-slate-200/60 flex items-center justify-between transition-all duration-300 ease-out hover:scale-[1.02] hover:bg-white/90 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('Appointments Today', 'תורים להיום')}</p>
                <p className="text-4xl font-extrabold text-slate-800 tracking-tight">{todayAppointments.length}</p>
              </div>
              <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200/50">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-[#0f172a] p-6 rounded-2xl border border-slate-800 flex items-center justify-between text-white relative overflow-hidden transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
              <div className="absolute top-0 start-0 -ms-4 -mt-4 opacity-10">
                <svg className="w-32 h-32 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              </div>
              <div className="relative z-10">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t('Revenue This Month', 'הכנסות החודש')}</p>
                <p className="text-4xl font-extrabold tracking-tight text-white"><span className="text-2xl opacity-50 me-1">₪</span>{revenueThisMonth.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Main Layout Grid (Bento) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            
            {/* Center/Left: Today's Operations */}
            <div className="xl:col-span-2 space-y-5">
              
              {/* Appointments Table */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 overflow-hidden transition-all duration-300 ease-out hover:bg-white/90">
                <div className="p-6 border-b border-slate-200/50 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {t("Today's Appointments", "התורים של היום")}
                  </h3>
                  <button onClick={() => navigate('appointments')} className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors uppercase tracking-widest">{t('View All', 'הצג הכל')}</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('Time', 'שעה')}</th>
                        <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('Patient', 'מטופל')}</th>
                        <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start">{t('Service', 'שירות')}</th>
                        <th className="py-4 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-end">{t('Status', 'סטטוס')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/50">
                      {todayAppointments.length === 0 ? (
                        <tr><td colSpan="4" className="py-10 text-center text-sm font-medium text-slate-400">{t('No appointments scheduled for today.', 'אין תורים להיום.')}</td></tr>
                      ) : (
                        todayAppointments.map(appt => {
                          const time = new Date(appt.appointment_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                          let statusColor = appt.status === 'completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : appt.status === 'cancelled' ? "bg-slate-50 text-slate-500 border-slate-200" : "bg-blue-50 text-blue-700 border-blue-200/50";
                          return (
                            <tr key={appt.id} className="hover:bg-slate-50/50 transition-colors group">
                              <td className="py-4 px-6 text-sm font-semibold text-slate-500 text-start">{time}</td>
                              <td className="py-4 px-6 font-bold text-slate-800 text-start">{getPatientName(appt.patient_id)}</td>
                              <td className="py-4 px-6 text-sm text-slate-500 font-medium text-start">{getServiceName(appt.service_id)}</td>
                              <td className="py-4 px-6 text-end">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${statusColor}`}>
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
              <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 overflow-hidden transition-all duration-300 ease-out hover:bg-white/90">
                <div className="p-6 border-b border-slate-200/50 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                    {t("Today's Tasks", "משימות להיום")}
                  </h3>
                  <span className="bg-slate-100 text-slate-600 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md">{tasksDueToday.length} {t('pending', 'ממתינות')}</span>
                </div>
                <div className="p-6">
                  <div className="space-y-2.5">
                    {tasksDueToday.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-slate-400 text-sm font-medium">{t('All caught up for today! 🎉', 'סיימת הכל להיום! 🎉')}</p>
                      </div>
                    ) : (
                      tasksDueToday.map(task => (
                        <div key={task.id} className="flex items-center gap-4 p-4 bg-white/50 border border-slate-200/60 hover:border-slate-300 hover:shadow-sm transition-all duration-200 rounded-xl group">
                          <div className="relative flex items-center justify-center me-2">
                            <input type="checkbox" checked={task.status === 'done'} onChange={() => updateTaskStatus(task.id, 'done')} className="peer w-5 h-5 text-emerald-500 bg-white border-2 border-slate-300 rounded focus:ring-emerald-500/20 cursor-pointer transition-all" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-slate-800 leading-tight">{task.title}</p>
                            {task.patient_id && <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{t('For:', 'עבור:')} {getPatientName(task.patient_id)}</p>}
                          </div>
                          <span className={`text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md ${task.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-500'}`}>{translatePriority(task.priority)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Section: Sales & Financials */}
            <div className="xl:col-span-1 space-y-5">
              
              {/* Sales & Pipeline Widget */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 overflow-hidden transition-all duration-300 ease-out hover:bg-white/90 flex flex-col h-full">
                <div className="p-6 border-b border-slate-200/50 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {t('Recent Leads', 'לידים אחרונים')}
                  </h3>
                  <button onClick={() => navigate('leads')} className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest">{t('Pipeline', 'צנרת')}</button>
                </div>
                <div className="p-6 space-y-3 flex-1">
                  {newLeads.length === 0 ? (
                    <p className="text-center text-sm font-medium text-slate-400 py-6">{t('No new leads awaiting follow-up.', 'אין לידים חדשים כרגע.')}</p>
                  ) : (
                    newLeads.slice(0, 4).map(lead => (
                      <div key={lead.id} className="flex flex-col gap-3 p-4 bg-white/60 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-colors group">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm tracking-tight">{lead.full_name}</h4>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5" dir="ltr">{lead.phone}</p>
                          </div>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{translateSource(lead.source)}</span>
                        </div>
                        <div className="flex gap-2">
                          <a href={`tel:${lead.phone}`} className="flex-1 flex justify-center items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-[11px] uppercase tracking-widest font-bold py-2 rounded-lg transition-all">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                            {t('Call', 'חייג')}
                          </a>
                          <button onClick={() => { updateLeadStatus(lead.id, 'contacted'); navigate('leads'); }} className="flex-1 bg-slate-800 hover:bg-slate-900 text-white text-[11px] uppercase tracking-widest font-bold py-2 rounded-lg transition-all shadow-sm">
                            {t('Follow Up', 'פולו-אפ')}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Financial Widget: Pending Payments */}
              <div className="bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/60 overflow-hidden transition-all duration-300 ease-out hover:bg-white/90">
                <div className="p-6 border-b border-slate-200/50">
                  <h3 className="font-extrabold text-slate-800 tracking-tight flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      {t('Pending Payments', 'תשלומים ממתינים')}
                    </span>
                    <span className="text-xl font-black text-emerald-600" dir="ltr"><span className="opacity-50">₪</span>{pendingPaymentsTotal.toFixed(2)}</span>
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-2.5 max-h-[250px] overflow-y-auto ps-1 pe-1">
                    {unpaidAppointments.length === 0 ? (
                      <p className="text-center text-sm font-medium text-slate-400 py-4">{t('No pending payments! 🎉', 'אין תשלומים ממתינים! 🎉')}</p>
                    ) : (
                      unpaidAppointments.map(appt => {
                        const service = services.find(s => s.id === appt.service_id);
                        const amount = service ? service.default_price : 0;
                        return (
                          <div key={appt.id} className="flex justify-between items-center p-4 bg-white/60 border border-slate-200/60 rounded-xl hover:border-emerald-200 transition-colors group">
                            <div>
                              <p className="font-bold text-slate-800 text-sm tracking-tight">{getPatientName(appt.patient_id)}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(appt.appointment_date).toLocaleDateString()}</p>
                            </div>
                            <div className="text-end flex flex-col items-end gap-1.5">
                              <span className="font-extrabold text-slate-800 text-sm" dir="ltr"><span className="opacity-50">₪</span>{amount.toFixed(2)}</span>
                              <button onClick={() => navigate('appointments')} className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded transition-colors">{t('Record Payment', 'גבה תשלום')}</button>
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
