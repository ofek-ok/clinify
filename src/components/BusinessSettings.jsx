import React, { useContext } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const BusinessSettings = () => {
  const { businessHours, updateBusinessHour } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);

  const getDayName = (dayOfWeek) => {
    const dayMap = {
      'Sunday': t('Sunday', 'ראשון'),
      'Monday': t('Monday', 'שני'),
      'Tuesday': t('Tuesday', 'שלישי'),
      'Wednesday': t('Wednesday', 'רביעי'),
      'Thursday': t('Thursday', 'חמישי'),
      'Friday': t('Friday', 'שישי'),
      'Saturday': t('Saturday', 'שבת')
    };
    return dayMap[dayOfWeek] || dayOfWeek;
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 max-w-4xl text-start">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{t('Business Settings', 'הגדרות עסק')}</h2>
        <p className="text-slate-500 text-sm mt-1">{t('Manage clinic operating hours and availability.', 'נהל את שעות הפעילות והזמינות של הקליניקה לקביעת תורים.')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {t('Operating Hours', 'שעות פעילות')}
          </h3>
          <p className="text-sm text-slate-500 mt-1">{t('Set when the clinic is open for new appointments.', 'הגדר מתי הקליניקה פתוחה לקבלת תורים חדשים.')}</p>
        </div>
        
        <div className="p-0">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="py-3 px-6 font-semibold border-b border-slate-100 text-start">{t('Day of Week', 'יום בשבוע')}</th>
                <th className="py-3 px-6 font-semibold border-b border-slate-100 text-center">{t('Open', 'פתוח')}</th>
                <th className="py-3 px-6 font-semibold border-b border-slate-100 text-start">{t('Start Time', 'שעת התחלה')}</th>
                <th className="py-3 px-6 font-semibold border-b border-slate-100 text-start">{t('End Time', 'שעת סיום')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {businessHours.map(hour => (
                <tr key={hour.dayOfWeek} className={`transition-colors hover:bg-slate-50/50 ${!hour.isOpen ? 'opacity-60 bg-slate-50' : ''}`}>
                  <td className="py-4 px-6 font-medium text-slate-700 text-start">{getDayName(hour.dayOfWeek)}</td>
                  <td className="py-4 px-6 text-center">
                    <input 
                      type="checkbox" 
                      checked={hour.isOpen} 
                      onChange={(e) => updateBusinessHour(hour.dayOfWeek, { isOpen: e.target.checked })}
                      className="w-5 h-5 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-4 px-6 text-start">
                    <input 
                      type="time" 
                      value={hour.startTime}
                      disabled={!hour.isOpen}
                      onChange={(e) => updateBusinessHour(hour.dayOfWeek, { startTime: e.target.value })}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </td>
                  <td className="py-4 px-6 text-start">
                    <input 
                      type="time" 
                      value={hour.endTime}
                      disabled={!hour.isOpen}
                      onChange={(e) => updateBusinessHour(hour.dayOfWeek, { endTime: e.target.value })}
                      className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm disabled:bg-slate-100 disabled:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BusinessSettings;
