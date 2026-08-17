import React, { useState, useContext } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import AppointmentManager from './AppointmentManager';

const CalendarView = ({ initialTab = 'grid' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { appointments, getPatientName, getServiceName } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);

  const days = [
    t('Sunday', 'ראשון'), t('Monday', 'שני'), t('Tuesday', 'שלישי'), 
    t('Wednesday', 'רביעי'), t('Thursday', 'חמישי'), t('Friday', 'שישי'), t('Saturday', 'שבת')
  ];
  
  const hours = Array.from({length: 10}, (_, i) => i + 9); // 9:00 to 18:00

  const handleSyncClick = () => {
    alert(t("Google Calendar Sync coming soon!", "סנכרון עם יומן גוגל (Google Calendar) יגיע בקרוב!"));
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 text-start">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:px-6 sm:py-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {t('Calendar & Appointments', 'יומן ותורים')}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {t('View schedule grid, manage appointments and client sessions.', 'צפה בלוח הזמנים השבועי, נהל תורים ופגישות טיפול.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sub-Tabs Switcher */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 shrink-0">
            <button
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'grid'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{t('Calendar View', 'תצוגת יומן')}</span>
            </button>

            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === 'list'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span>{t('Appointments List', 'ניהול רשימת תורים')}</span>
            </button>
          </div>

          {activeTab === 'grid' && (
            <button onClick={handleSyncClick} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-1.5 px-3.5 rounded-xl shadow-sm transition-colors flex items-center gap-2 text-xs">
              <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="#fff"/>
                <path d="M12.446 11.238l-4.14-4.14c-1.303 1.303-1.63 3.23-.742 4.887l3.87 3.87c.928-.277 1.636-1.045 1.83-2.002.138-.675.05-1.378-.234-1.996l-.584-.62z" fill="#fbbc05"/>
                <path d="M17.067 15.35c.677-.87.876-1.986.533-3.033l-5.154-5.153c-1.28.31-2.223 1.385-2.454 2.68l4.475 4.475c.983.336 2.06.18 2.6-.97z" fill="#ea4335"/>
                <path d="M10.134 18.068l4.637-4.636c1.192.518 2.61.168 3.42-1.01l-6.84 6.84c-1.066.046-2.072-.375-2.73-1.156l1.513-1.038z" fill="#34a853"/>
                <path d="M14.77 8.432c-1.192-.518-2.61-.168-3.42 1.01L18.19 2.6c-2.316-2.128-5.836-2.247-8.293-.277L4.172 8.046c-1.634 1.815-1.957 4.542-.782 6.56l7.4-7.4c.54-.78 1.48-1.22 2.443-1.127l1.536-1.01z" fill="#4285f4"/>
              </svg>
              <span>{t('Sync Google', 'סנכרן גוגל')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      {activeTab === 'grid' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-start">
              <thead>
                <tr>
                  <th className="py-3 px-4 bg-slate-50 border-b border-s border-slate-100 w-20 text-center text-xs font-bold text-slate-400 uppercase">{t('Time', 'שעה')}</th>
                  {days.map(day => (
                    <th key={day} className="py-3 px-4 bg-slate-50 border-b border-s border-slate-100 text-center text-sm font-semibold text-slate-700 w-[14%]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hours.map(hour => (
                  <tr key={hour} className="group">
                    <td className="py-4 px-2 border-b border-s border-slate-100 text-center text-xs font-bold text-slate-400 bg-slate-50/30">
                      {hour}:00
                    </td>
                    {days.map((day, idx) => {
                      const dayAppts = appointments.filter(a => {
                        const d = new Date(a.appointment_date);
                        return d.getHours() === hour && (d.getDay() === idx);
                      });

                      return (
                        <td key={`${hour}-${day}`} className="border-b border-s border-slate-100 relative h-20 p-1 hover:bg-slate-50/50 transition-colors">
                          {dayAppts.map(appt => {
                            const isCompleted = appt.status === 'completed';
                            return (
                              <div key={appt.id} className={`absolute inset-x-1 top-1 bottom-1 p-2 rounded-lg border text-[11px] overflow-hidden flex flex-col justify-between shadow-sm cursor-pointer hover:shadow-md transition-shadow ${isCompleted ? 'bg-emerald-50 border-emerald-200 z-10' : 'bg-blue-50 border-blue-200 z-20'}`}>
                                <div>
                                  <p className={`font-bold truncate text-start ${isCompleted ? 'text-emerald-800' : 'text-blue-800'}`}>{getPatientName(appt.patient_id)}</p>
                                  <p className={`truncate font-medium mt-0.5 text-start ${isCompleted ? 'text-emerald-600' : 'text-blue-600'}`}>{getServiceName(appt.service_id)}</p>
                                </div>
                                <span className={`text-[9px] uppercase font-bold tracking-widest mt-1 text-start ${isCompleted ? 'text-emerald-500' : 'text-blue-500'}`}>{isCompleted ? t('Done', 'הושלם') : t('Scheduled', 'נקבע')}</span>
                              </div>
                            )
                          })}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <AppointmentManager />
      )}
    </div>
  );
};

export default CalendarView;
