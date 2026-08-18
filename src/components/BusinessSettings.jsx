import React, { useState, useContext } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import ServicesCatalog from './ServicesCatalog';
import FormManager from './FormManager';
import FormBuilder from './FormBuilder';

const BusinessSettings = ({ navigate, activeFormSubTab }) => {
  const [activeTab, setActiveTab] = useState(activeFormSubTab || 'hours');
  const { businessHours, updateBusinessHour, bookingSettings, updateBookingSettings } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);

  const copyBookingLink = () => {
    const link = `${window.location.origin}/book`;
    navigator.clipboard.writeText(link);
    alert(t('Public Booking link copied to clipboard!', 'הקישור הציבורי לזימון תורים הועתק ללוח!'));
  };

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
            {t('Manage clinic operating hours, booking portal features, services catalog, and forms.', 'נהל שעות פעילות, הגדרות דף זימון ציבורי, קטלוג שירותים וטפסים.')}
          </p>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex flex-wrap bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 shrink-0 gap-1">
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
            onClick={() => setActiveTab('bookingPortal')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'bookingPortal'
                ? 'bg-white text-emerald-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{t('Public Booking Page', 'דף זימון ציבורי')}</span>
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
        
        {/* TAB 1: Business Hours */}
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

        {/* TAB 2: Public Booking Page Settings */}
        {activeTab === 'bookingPortal' && (
          <div className="space-y-6">
            
            {/* Quick Share Link Box */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-md">
              <div>
                <h3 className="text-lg font-extrabold tracking-tight text-white">{t('Public Booking Page URL', 'קישור לעמוד הזימון העצמאי')}</h3>
                <p className="text-slate-400 text-xs mt-1" dir="ltr">{window.location.origin}/book</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={copyBookingLink}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                  {t('Copy Link', 'העתק קישור ללוח')}
                </button>
                <a 
                  href="/book" 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center gap-2 border border-slate-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  {t('Preview Portal', 'תצוגה מקדימה')}
                </a>
              </div>
            </div>

            {/* Configurable Features Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">
                {t('Configure Booking Link Capabilities', 'ניהול פיצ׳רים בעמוד הזימון הציבורי')}
              </h3>

              {/* Toggles */}
              <div className="space-y-4">
                
                {/* Package Redemption Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50/70 rounded-xl border border-slate-200/60">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{t('Allow Package / Punch-Card Redemption', 'מאפשר ניצול כרטיסיות/חבילות במעמד הזימון')}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{t('Existing patients with active sessions can book without paying.', 'מטופלים קיבלו כרטיסייה פעילה יוכלו לממש טיפול ללא חיוב נוסף.')}</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={bookingSettings.allowPackages} 
                    onChange={e => updateBookingSettings({ allowPackages: e.target.checked })}
                    className="w-5 h-5 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Pay at Clinic Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50/70 rounded-xl border border-slate-200/60">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{t('Allow Pay at Clinic', 'אפשר תשלום במקום בקליניקה')}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{t('Patients can choose to pay via Cash/Bit at the appointment.', 'המטופל יוכל לבחור לשלם בקליניקה במקום תשלום מראש.')}</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={bookingSettings.allowPayAtClinic} 
                    onChange={e => updateBookingSettings({ allowPayAtClinic: e.target.checked })}
                    className="w-5 h-5 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Require Policy Acceptance Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50/70 rounded-xl border border-slate-200/60">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{t('Require Cancellation Policy Acceptance', 'דרוש אישור מדיניות ביטולים')}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{t('Displays a mandatory checkbox for terms before completing booking.', 'מציג תיבת סימון של אישור התנאים ומדיניות הביטול.')}</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={bookingSettings.requirePolicy} 
                    onChange={e => updateBookingSettings({ requirePolicy: e.target.checked })}
                    className="w-5 h-5 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

              </div>

              {/* Text Fields Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Welcome / Header Message', 'הודעת ברכה בראש הדף')}</label>
                  <textarea 
                    rows="3"
                    value={bookingSettings.welcomeMessage}
                    onChange={e => updateBookingSettings({ welcomeMessage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Clinic Location & Arrival Instructions', 'כתובת הקליניקה והוראות הגעה')}</label>
                  <textarea 
                    rows="3"
                    value={bookingSettings.clinicAddress}
                    onChange={e => updateBookingSettings({ clinicAddress: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Cancellation Policy Text', 'נוסח מדיניות הביטול')}</label>
                  <textarea 
                    rows="3"
                    value={bookingSettings.cancellationPolicyText}
                    onChange={e => updateBookingSettings({ cancellationPolicyText: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
                  />
                </div>
              </div>

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
