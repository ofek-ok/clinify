import React, { useState, useContext } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import ServicesCatalog from './ServicesCatalog';
import FormManager from './FormManager';
import FormBuilder from './FormBuilder';

const BusinessSettings = ({ navigate, activeFormSubTab, formBuilderNav }) => {
  const [activeTab, setActiveTab] = useState(activeFormSubTab || 'hours');
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
    <div className="animate-in fade-in duration-500 space-y-6 text-start">
      {/* Settings Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:px-6 sm:py-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            {t('Business Settings Hub', 'מרכז הגדרות ותשתית')}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {t('Manage clinic operating hours, services catalog, and intake forms.', 'נהל שעות פעילות, קטלוג שירותים וטפסי קבלה.')}
          </p>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex flex-wrap bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 shrink-0">
          <button
            onClick={() => setActiveTab('hours')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'hours'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('Operating Hours', 'שעות פעילות')}</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'services'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span>{t('Services Catalog', 'קטלוג שירותים')}</span>
          </button>

          <button
            onClick={() => setActiveTab('forms')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'forms' || activeTab === 'formBuilder'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{t('Forms Manager', 'ניהול טפסים')}</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'hours' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {t('Operating Hours', 'שעות פעילות המרפאה')}
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
        )}

        {activeTab === 'services' && <ServicesCatalog />}
        {activeTab === 'forms' && <FormManager navigate={(target) => {
          if (target === 'formBuilder') setActiveTab('formBuilder');
          else if (navigate) navigate(target);
        }} />}
        {activeTab === 'formBuilder' && <FormBuilder navigate={(target) => {
          if (target === 'forms') setActiveTab('forms');
          else if (navigate) navigate(target);
        }} />}
      </div>
    </div>
  );
};

export default BusinessSettings;
