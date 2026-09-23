import React, { useState, useEffect, useContext } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import ServicesCatalog from './ServicesCatalog';
import { LanguageContext } from '../context/LanguageContext';
import { useToast } from './ui/Toast';
import { Copy, ExternalLink, Upload } from 'lucide-react';

export default function BusinessSettings({ activeFormSubTab }) {
  const [activeTab, setActiveTab] = useState(activeFormSubTab || 'services');
  const { businessHours, updateBusinessHour, bookingSettings, updateBookingSettings } = useContext(ClinicContext);
  const { showToast } = useToast();
  const { t } = useContext(LanguageContext);

  useEffect(() => {
    if (activeFormSubTab) {
      setActiveTab(activeFormSubTab);
    }
  }, [activeFormSubTab]);

  const copyBookingLink = () => {
    const link = `${window.location.origin}/book`;
    navigator.clipboard.writeText(link);
    showToast(t('Public booking link copied', 'הקישור הציבורי לזימון תורים הועתק ללוח'));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateBookingSettings({ logoUrl: reader.result });
        showToast(t('Logo updated', 'הלוגו עודכן'));
      };
      reader.readAsDataURL(file);
    }
  };

  const getDayName = (dayOfWeek) => {
    const dayMap = {
      Sunday: t('Sunday', 'ראשון'),
      Monday: t('Monday', 'שני'),
      Tuesday: t('Tuesday', 'שלישי'),
      Wednesday: t('Wednesday', 'רביעי'),
      Thursday: t('Thursday', 'חמישי'),
      Friday: t('Friday', 'שישי'),
      Saturday: t('Saturday', 'שבת')
    };
    return dayMap[dayOfWeek] || dayOfWeek;
  };

  return (
    <div className="space-y-6 dir-rtl text-start font-sans">
      {/* Settings Header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('Settings', 'הגדרות')}</h1>

        <div className="flex max-w-full overflow-x-auto bg-white p-1 rounded-xl border border-slate-200">
          {[
            { id: 'services', label: t('Services', 'שירותים') },
            { id: 'hours', label: t('Business Hours', 'שעות פעילות') },
            { id: 'bookingPortal', label: t('Booking Portal', 'זימון תורים') },
            { id: 'businessDetails', label: t('Business Details', 'פרטי העסק') }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {/* TAB 1: Services */}
        {activeTab === 'services' && <ServicesCatalog />}

        {/* TAB 2: Operating Hours */}
        {activeTab === 'hours' && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('Business Hours', 'שעות פעילות העסק')}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t('Set when the business is open for new appointments.', 'הגדר מתי העסק פתוח לקבלת תורים חדשים.')}</p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {businessHours
                .slice()
                .sort((a, b) => a.dayIndex - b.dayIndex)
                .map(hour => (
                  <div
                    key={hour.dayOfWeek}
                    className={`rounded-2xl border p-4 transition ${hour.isOpen ? 'border-violet-200 bg-violet-50/40' : 'border-slate-200 bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-extrabold text-slate-900">{t('Day', 'יום')} {getDayName(hour.dayOfWeek)}</div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          {hour.isOpen ? t('Open for bookings', 'פתוח לקבלת תורים') : t('Closed', 'סגור')}
                        </div>
                      </div>

                      <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-bold text-slate-600">
                        <input
                          type="checkbox"
                          checked={hour.isOpen}
                          onChange={(e) => updateBusinessHour(hour.dayOfWeek, { isOpen: e.target.checked })}
                          className="h-4 w-4 accent-violet-600"
                        />
                        {t('Open', 'פתוח')}
                      </label>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <label>
                        <span className="mb-1 block text-[10px] font-bold text-slate-400">{t('Opens', 'פתיחה')}</span>
                        <input
                          type="time"
                          value={hour.startTime}
                          disabled={!hour.isOpen}
                          onChange={(e) => updateBusinessHour(hour.dayOfWeek, { startTime: e.target.value })}
                          className="work-input disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-[10px] font-bold text-slate-400">{t('Closes', 'סגירה')}</span>
                        <input
                          type="time"
                          value={hour.endTime}
                          disabled={!hour.isOpen}
                          onChange={(e) => updateBusinessHour(hour.dayOfWeek, { endTime: e.target.value })}
                          className="work-input disabled:cursor-not-allowed disabled:opacity-40"
                        />
                      </label>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: Booking Portal */}
        {activeTab === 'bookingPortal' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900">{t('Public booking URL', 'כתובת דף הזימון הציבורי')}</h3>
                <p className="text-slate-500 text-xs font-mono dir-ltr text-right mt-0.5">{window.location.origin}/book</p>
              </div>
              <div className="flex space-x-2 space-x-reverse">
                <button onClick={copyBookingLink} className="bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 space-x-reverse">
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t('Copy Link', 'העתק קישור')}</span>
                </button>
                <a href="/book" target="_blank" rel="noreferrer" className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 space-x-reverse">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t('Preview', 'תצוגה')}</span>
                </a>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-900">{t('Booking Page Settings', 'הגדרות דף זימון תורים')}</h3>
              
              <div className="grid gap-3 md:grid-cols-3">
                <SettingToggle
                  label={t('Require cancellation policy acceptance', 'דרישת אישור מדיניות ביטול')}
                  description={t('Client must accept before booking.', 'הלקוח חייב לסמן אישור לפני קביעת התור.')}
                  checked={bookingSettings.requirePolicy}
                  onChange={value => updateBookingSettings({ requirePolicy: value })}
                />
                <SettingToggle
                  label={t('Allow pay at clinic', 'אפשר תשלום במקום')}
                  description={t('Shows an option to pay at the clinic.', 'מציג אפשרות תשלום בקליניקה.')}
                  checked={bookingSettings.allowPayAtClinic}
                  onChange={value => updateBookingSettings({ allowPayAtClinic: value })}
                />
                <SettingToggle
                  label={t('Allow packages', 'אפשר חבילות')}
                  description={t('Allows packages/products in booking.', 'מאפשר שימוש במוצרים/חבילות בזימון.')}
                  checked={bookingSettings.allowPackages}
                  onChange={value => updateBookingSettings({ allowPackages: value })}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-500">{t('Clinic Address', 'כתובת הקליניקה')}</label>
                <input
                  type="text"
                  value={bookingSettings.clinicAddress}
                  onChange={e => updateBookingSettings({ clinicAddress: e.target.value })}
                  placeholder={t('Address shown to clients and calendar events', 'הכתובת שתוצג ללקוח ותיכנס ליומן')}
                  className="work-input"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 mb-1">{t('Welcome Message', 'הודעת ברכה בדף')}</label>
                  <textarea
                    rows={3}
                    value={bookingSettings.welcomeMessage}
                    onChange={e => updateBookingSettings({ welcomeMessage: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 mb-1">{t('Cancellation Policy', 'נוסח מדיניות הביטול')}</label>
                  <textarea
                    rows={3}
                    value={bookingSettings.cancellationPolicyText}
                    onChange={e => updateBookingSettings({ cancellationPolicyText: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Business Details */}
        {activeTab === 'businessDetails' && (
          <div className="premium-panel p-5 rounded-2xl space-y-5 text-xs">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t('Public Business Details', 'פרטי העסק שיוצגו ללקוח')}</h3>
              <p className="mt-1 text-[11px] text-slate-500">{t('These details are shown on the public booking page.', 'הפרטים כאן יוצגו בדף זימון התורים הציבורי.')}</p>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-slate-500 mb-1">{t('Public Business Name', 'שם העסק הציבורי')}</label>
                <input
                  type="text"
                  value={bookingSettings.businessName || ''}
                  onChange={e => updateBookingSettings({ businessName: e.target.value })}
                  placeholder="Okonski Performance"
                  className="work-input font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">{t('Public Phone', 'טלפון ציבורי')}</label>
                <input
                  type="tel"
                  dir="ltr"
                  value={bookingSettings.publicPhone || ''}
                  onChange={e => updateBookingSettings({ publicPhone: e.target.value })}
                  placeholder="050-000-0000"
                  className="work-input text-end"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">{t('Public Email', 'אימייל ציבורי')}</label>
                <input
                  type="email"
                  dir="ltr"
                  value={bookingSettings.publicEmail || ''}
                  onChange={e => updateBookingSettings({ publicEmail: e.target.value })}
                  placeholder="hello@example.com"
                  className="work-input text-end"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">{t('Website', 'אתר')}</label>
                <input
                  type="url"
                  dir="ltr"
                  value={bookingSettings.publicWebsite || ''}
                  onChange={e => updateBookingSettings({ publicWebsite: e.target.value })}
                  placeholder="https://..."
                  className="work-input text-end"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-500 mb-1">{t('Clinic Address', 'כתובת הקליניקה')}</label>
                <input
                  type="text"
                  value={bookingSettings.clinicAddress || ''}
                  onChange={e => updateBookingSettings({ clinicAddress: e.target.value })}
                  placeholder={t('Address shown on booking page and calendar event', 'כתובת שתוצג בדף הזימון ובאירוע היומן')}
                  className="work-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-500 mb-2">{t('Public Business Logo', 'לוגו העסק הציבורי')}</label>
                <div className="flex flex-wrap items-center gap-3">
                  {bookingSettings.logoUrl && (
                    <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <img src={bookingSettings.logoUrl} alt={t('Business logo', 'לוגו העסק')} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="text-xs text-slate-500 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );


function SettingToggle({ label, description, checked, onChange }) {
  return (
    <label className={`cursor-pointer rounded-2xl border p-4 transition ${checked ? 'border-violet-200 bg-violet-50/50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-extrabold text-slate-900">{label}</div>
          <div className="mt-1 text-[10px] leading-4 text-slate-400">{description}</div>
        </div>
        <input
          type="checkbox"
          checked={Boolean(checked)}
          onChange={e => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-violet-600"
        />
      </div>
    </label>
  );
}
}
