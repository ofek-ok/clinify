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
      
      {/* 🌟 ULTRA-PREMIUM HERO WELCOME BANNER */}
      <div className="relative rounded-3xl bg-slate-900 p-6 sm:p-8 text-white overflow-hidden shadow-2xl border border-white/10">
        {/* Glowing Background Meshes */}
        <div className="absolute top-0 end-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 start-1/3 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/30">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-2xl font-black text-white">
                  OK
                </div>
              </div>
              <span className="absolute bottom-0 end-0 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping"></span>
              <span className="absolute bottom-0 end-0 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-900"></span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{t('Welcome back, Dr. Okonski', 'שלום רב, ד"ר אוקונסקי')} 👋</h2>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 font-medium flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>{t('Clinic Operations System', 'מערכת ניהול המרפאה בסינכרון מלא')}</span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-400 font-bold">{new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </p>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-white/10 self-start md:self-auto shadow-inner">
            <button 
              onClick={() => setViewMode('overview')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 flex items-center gap-2 ${
                viewMode === 'overview'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-lg shadow-cyan-500/25 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              <span>{t('Operations', 'תפעול שוטף')}</span>
            </button>

            <button 
              onClick={() => setViewMode('analytics')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300 flex items-center gap-2 ${
                viewMode === 'analytics'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 shadow-lg shadow-cyan-500/25 scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 012-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              <span>{t('Analytics Data', 'נתוני אנליטיקה')}</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'analytics' ? (
        <div className="mt-4">
          <AnalyticsView />
        </div>
      ) : (
        <>
          {/* 💎 4 HIGH-IMPACT KPI METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Active Patients */}
            <div className="glass-card p-6 rounded-3xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">{t('Active Patients', 'מטופלים פעילים')}</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">{activePatientsCount}</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                  +8.2%
                </span>
                <span className="text-slate-400 font-medium">{t('Active in clinic', 'בטיפול רציף')}</span>
              </div>
            </div>

            {/* New Leads */}
            <div className="glass-card p-6 rounded-3xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">{t('New Leads', 'לידים חדשים בצנרת')}</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">{newLeads.length}</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-extrabold text-violet-600">{newLeads.length} {t('new today', 'פניות חדשות')}</span>
                <span className="text-slate-400 font-medium">{t('Pipeline', 'ממתין למענה')}</span>
              </div>
            </div>

            {/* Appointments Today */}
            <div className="glass-card p-6 rounded-3xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">{t('Appointments Today', 'תורים מתוכננים להיום')}</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tight">{todayAppointments.length}</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-extrabold text-emerald-600">{todayAppointments.filter(a => a.status === 'completed').length} {t('completed', 'הושלמו')}</span>
                <span className="text-slate-400 font-medium">{todayAppointments.filter(a => a.status === 'scheduled').length} {t('upcoming', 'ממתינים')}</span>
              </div>
            </div>

            {/* Revenue Card */}
            <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-cyan-950 p-6 rounded-3xl relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl text-white border border-white/10 group">
              <div className="absolute top-0 end-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">{t('Monthly Revenue', 'הכנסות המרפאה החודש')}</p>
                  <h3 className="text-3xl font-black text-white tracking-tight"><span className="text-xl text-cyan-400 me-1">₪</span>{revenueThisMonth.toFixed(2)}</h3>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 8v2m0-6c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs relative z-10">
                <span className="font-extrabold text-cyan-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                  +12.4%
                </span>
                <span className="text-slate-400 font-medium">{t('vs last month', 'מהחודש הקודם')}</span>
              </div>
            </div>

          </div>

          {/* 🍱 BENTO GRID OPERATIONS CONTAINER */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Center/Left: Today's Appointments & Tasks */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Today's Appointments Card */}
              <div className="glass-card rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-base tracking-tight flex items-center gap-2.5">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span>{t("Today's Appointments", "התורים של היום")}</span>
                  </h3>
                  <button 
                    onClick={() => navigate('appointments')}
                    className="text-xs font-extrabold text-cyan-600 hover:text-cyan-700 transition-colors flex items-center gap-1 hover:underline"
                  >
                    <span>{t('View All Appointments', 'לכל התורים ➔')}</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-start border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                        <th className="py-3.5 px-6 text-start">{t('Time', 'שעה')}</th>
                        <th className="py-3.5 px-6 text-start">{t('Patient Name', 'שם המטופל')}</th>
                        <th className="py-3.5 px-6 text-start">{t('Treatment Service', 'שירות טיפול')}</th>
                        <th className="py-3.5 px-6 text-end">{t('Status', 'סטטוס')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {todayAppointments.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-12 text-center text-slate-400 text-xs font-medium">
                            {t('No appointments scheduled for today.', 'אין תורים מתוכננים להיום.')}
                          </td>
                        </tr>
                      ) : (
                        todayAppointments.map(appt => {
                          const time = new Date(appt.appointment_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                          let statusBadge = appt.status === 'completed' 
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
                            : appt.status === 'cancelled' 
                            ? "bg-slate-100 text-slate-500 border-slate-200" 
                            : "bg-cyan-100 text-cyan-800 border-cyan-200";

                          return (
                            <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="py-4 px-6 text-xs font-bold text-slate-600 text-start">{time}</td>
                              <td className="py-4 px-6 font-bold text-slate-900 text-start group-hover:text-cyan-600 transition-colors">
                                {getPatientName(appt.patient_id)}
                              </td>
                              <td className="py-4 px-6 text-xs font-medium text-slate-600 text-start">{getServiceName(appt.service_id)}</td>
                              <td className="py-4 px-6 text-end">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBadge}`}>
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

              {/* Today's Tasks Card */}
              <div className="glass-card rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-base tracking-tight flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-slate-900"></span>
                    <span>{t("Today's Tasks", "משימות מתוכננות להיום")}</span>
                  </h3>
                  <span className="bg-slate-200 text-slate-800 text-[10px] font-black px-2.5 py-1 rounded-full">{tasksDueToday.length} {t('pending', 'ממתינות')}</span>
                </div>

                <div className="p-6">
                  <div className="space-y-3">
                    {tasksDueToday.length === 0 ? (
                      <p className="text-center py-8 text-slate-400 text-xs font-medium">{t('All caught up for today! 🎉', 'כל המשימות להיום הושלמו! 🎉')}</p>
                    ) : (
                      tasksDueToday.map(task => (
                        <div key={task.id} className="flex items-center gap-4 p-4 bg-slate-50/60 border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all rounded-2xl group">
                          <input 
                            type="checkbox" 
                            checked={task.status === 'done'} 
                            onChange={() => updateTaskStatus(task.id, 'done')} 
                            className="w-5 h-5 text-cyan-600 bg-white border-2 border-slate-300 rounded-lg focus:ring-cyan-500 cursor-pointer transition-all" 
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{task.title}</p>
                            {task.patient_id && <p className="text-[10px] font-bold text-slate-400 mt-0.5">{t('Patient:', 'מטופל:')} {getPatientName(task.patient_id)}</p>}
                          </div>
                          <span className={`text-[9px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full ${
                            task.priority === 'high' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {translatePriority(task.priority)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Section: Recent Leads & Pending Payments */}
            <div className="xl:col-span-1 space-y-6">
              
              {/* Recent Leads Widget */}
              <div className="glass-card rounded-3xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 text-base tracking-tight flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-violet-500"></span>
                    <span>{t('Recent Leads', 'לידים אחרונים בצנרת')}</span>
                  </h3>
                  <button 
                    onClick={() => navigate('leads')} 
                    className="text-xs font-extrabold text-violet-600 hover:text-violet-700 transition-colors hover:underline"
                  >
                    {t('Pipeline', 'לצנרת ➔')}
                  </button>
                </div>

                <div className="p-6 space-y-3 flex-1">
                  {newLeads.length === 0 ? (
                    <p className="text-center text-xs font-medium text-slate-400 py-8">{t('No new leads awaiting follow-up.', 'אין לידים חדשים כרגע.')}</p>
                  ) : (
                    newLeads.slice(0, 4).map(lead => (
                      <div key={lead.id} className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/80 hover:border-violet-300 transition-all group">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-slate-900 text-xs tracking-tight">{lead.full_name}</h4>
                            <p className="text-[10px] text-slate-500 font-medium" dir="ltr">{lead.phone}</p>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">{translateSource(lead.source)}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <a 
                            href={`tel:${lead.phone}`} 
                            className="flex-1 flex justify-center items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[10px] font-bold py-2 rounded-xl transition-all shadow-sm"
                          >
                            <svg className="w-3.5 h-3.5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                            {t('Call', 'חייג')}
                          </a>
                          <button 
                            onClick={() => { updateLeadStatus(lead.id, 'contacted'); navigate('leads'); }} 
                            className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-2 rounded-xl transition-all shadow-sm"
                          >
                            {t('Follow Up', 'פולואו-אפ')}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pending Payments Widget */}
              <div className="glass-card rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-extrabold text-slate-800 text-xs tracking-tight flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    {t('Pending Payments', 'תשלומים ממתינים לגבייה')}
                  </h3>
                  <span className="text-base font-black text-emerald-700" dir="ltr">
                    <span className="opacity-50">₪</span>{pendingPaymentsTotal.toFixed(2)}
                  </span>
                </div>
                <div className="p-6">
                  <div className="space-y-3 max-h-[220px] overflow-y-auto">
                    {unpaidAppointments.length === 0 ? (
                      <p className="text-center text-xs font-medium text-slate-400 py-6">{t('No pending payments! 🎉', 'אין תשלומים ממתינים! 🎉')}</p>
                    ) : (
                      unpaidAppointments.map(appt => {
                        const service = services.find(s => s.id === appt.service_id);
                        const amount = service ? service.default_price : 0;
                        return (
                          <div key={appt.id} className="flex justify-between items-center p-3.5 bg-slate-50/60 border border-slate-200/80 rounded-2xl hover:border-emerald-300 transition-colors">
                            <div>
                              <p className="font-bold text-slate-900 text-xs">{getPatientName(appt.patient_id)}</p>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{new Date(appt.appointment_date).toLocaleDateString('he-IL')}</p>
                            </div>
                            <div className="text-end flex flex-col items-end gap-1">
                              <span className="font-black text-slate-900 text-xs" dir="ltr">₪{amount.toFixed(2)}</span>
                              <button 
                                onClick={() => navigate('appointments')} 
                                className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-full transition-colors"
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
