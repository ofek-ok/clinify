import React, { useState, useEffect, useContext } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import ServicesCatalog from './ServicesCatalog';
import { useToast } from './ui/Toast';
import { Copy, ExternalLink, Upload } from 'lucide-react';

export default function BusinessSettings({ activeFormSubTab }) {
  const [activeTab, setActiveTab] = useState(activeFormSubTab || 'services');
  const { businessHours, updateBusinessHour, bookingSettings, updateBookingSettings } = useContext(ClinicContext);
  const { showToast } = useToast();

  useEffect(() => {
    if (activeFormSubTab) {
      setActiveTab(activeFormSubTab);
    }
  }, [activeFormSubTab]);

  const copyBookingLink = () => {
    const link = `${window.location.origin}/book`;
    navigator.clipboard.writeText(link);
    showToast('הקישור הציבורי לזימון תורים הועתק ללוח');
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateBookingSettings({ logoUrl: reader.result });
        showToast('הלוגו עודכן');
      };
      reader.readAsDataURL(file);
    }
  };

  const getDayName = (dayOfWeek) => {
    const dayMap = {
      'Sunday': 'ראשון',
      'Monday': 'שני',
      'Tuesday': 'שלישי',
      'Wednesday': 'רביעי',
      'Thursday': 'חמישי',
      'Friday': 'שישי',
      'Saturday': 'שבת'
    };
    return dayMap[dayOfWeek] || dayOfWeek;
  };

  return (
    <div className="space-y-6 dir-rtl text-start font-sans">
      {/* Settings Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h1 className="text-xl font-bold text-white tracking-tight">הגדרות</h1>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'services', label: 'שירותים' },
            { id: 'hours', label: 'שעות פעילות' },
            { id: 'bookingPortal', label: 'זימון תורים' },
            { id: 'businessDetails', label: 'פרטי העסק' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">שעות פעילות העסק</h3>
              <p className="text-xs text-slate-400 mt-0.5">הגדר מתי העסק פתוח לקבלת תורים חדשים.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-4 text-start font-bold">יום בשבוע</th>
                    <th className="py-3 px-4 text-center font-bold">פתוח</th>
                    <th className="py-3 px-4 text-start font-bold">שעת התחלה</th>
                    <th className="py-3 px-4 text-start font-bold">שעת סיום</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {businessHours.map(hour => (
                    <tr key={hour.dayOfWeek} className={`hover:bg-slate-800/40 ${!hour.isOpen ? 'opacity-50' : ''}`}>
                      <td className="py-3 px-4 font-bold text-white">{getDayName(hour.dayOfWeek)}</td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={hour.isOpen}
                          onChange={(e) => updateBusinessHour(hour.dayOfWeek, { isOpen: e.target.checked })}
                          className="w-4 h-4 text-emerald-500 bg-slate-950 border-slate-800 rounded focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="time"
                          value={hour.startTime}
                          disabled={!hour.isOpen}
                          onChange={(e) => updateBusinessHour(hour.dayOfWeek, { startTime: e.target.value })}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white disabled:opacity-50 focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="time"
                          value={hour.endTime}
                          disabled={!hour.isOpen}
                          onChange={(e) => updateBusinessHour(hour.dayOfWeek, { endTime: e.target.value })}
                          className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white disabled:opacity-50 focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Booking Portal */}
        {activeTab === 'bookingPortal' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white">כתובת דף הזימון הציבורי</h3>
                <p className="text-slate-400 text-xs font-mono dir-ltr text-right mt-0.5">{window.location.origin}/book</p>
              </div>
              <div className="flex space-x-2 space-x-reverse">
                <button onClick={copyBookingLink} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 space-x-reverse">
                  <Copy className="w-3.5 h-3.5" />
                  <span>העתק קישור</span>
                </button>
                <a href="/book" target="_blank" rel="noreferrer" className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1 space-x-reverse">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>תצוגה</span>
                </a>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-bold text-white">הגדרות דף זימון תורים</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">הודעת ברכה בדף</label>
                  <textarea
                    rows={3}
                    value={bookingSettings.welcomeMessage}
                    onChange={e => updateBookingSettings({ welcomeMessage: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">נוסח מדיניות הביטול</label>
                  <textarea
                    rows={3}
                    value={bookingSettings.cancellationPolicyText}
                    onChange={e => updateBookingSettings({ cancellationPolicyText: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Business Details */}
        {activeTab === 'businessDetails' && (
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4 text-xs">
            <h3 className="text-xs font-bold text-white">פרטי העסק והמותג</h3>
            
            <div className="space-y-3 max-w-md">
              <div>
                <label className="block text-slate-400 mb-1">שם העסק הציבורי</label>
                <input
                  type="text"
                  readOnly
                  value="Okonski Performance"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">לוגו העסק הציבורי</label>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="text-xs text-slate-400 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
