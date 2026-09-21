import React, { useContext, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const PerformanceListManager = () => {
  const { performanceList, people, subscribePerformanceList } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);

  const [filterTerm, setFilterTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    utm_source: 'internal_admin',
    utm_medium: 'manual',
    utm_campaign: 'v1_launch'
  });

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!form.full_name || (!form.email && !form.phone)) {
      alert(t("Name and either Email or Phone are required.", "שם ודוא\"ל או טלפון נדרשים להרשמה."));
      return;
    }
    try {
      await subscribePerformanceList(form);
      setModalOpen(false);
      setForm({ full_name: '', email: '', phone: '', utm_source: 'internal_admin', utm_medium: 'manual', utm_campaign: 'v1_launch' });
    } catch (err) {
      alert(err.message || 'שגיאה בהוספת נרשם לרשימת הביצועים');
    }
  };

  const subscribers = performanceList.map(item => {
    const person = people.find(p => p.id === item.person_id) || {};
    return {
      ...item,
      person
    };
  }).filter(sub => {
    if (!filterTerm) return true;
    const term = filterTerm.toLowerCase();
    return (
      (sub.person.full_name || '').toLowerCase().includes(term) ||
      (sub.person.email || '').toLowerCase().includes(term) ||
      (sub.person.phone || '').includes(term) ||
      (sub.utm_source || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="animate-in fade-in duration-500 space-y-6 text-start">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{t('Performance List Engine', 'רשימת הביצועים (Performance List)')}</h2>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{t('Pre-launch signup list and UTM attribution tracking for canonical people identity.', 'הרשמות מוקדמות, מעקב מקורות הגעה (UTM) וחיבור לזהות מרכזית.')}</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.open('/performance', '_blank')}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>🔗 {t('Public Signup Route', 'עמוד הרשמה ציבורי (/performance)')}</span>
          </button>
          <button 
            onClick={() => setModalOpen(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all"
          >
            + {t('Add Member Manually', 'הוסף נרשם ידנית')}
          </button>
        </div>
      </div>

      {/* Manual Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-base">{t('Add to Performance List', 'הרשמה לרשימת הביצועים')}</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleManualAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Full Name', 'שם מלא')}</label>
                <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Email', 'דוא"ל')}</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">{t('Phone', 'טלפון')}</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">{t('UTM Source', 'מקור הגעה (UTM Source)')}</label>
                <input type="text" value={form.utm_source} onChange={e => setForm({...form, utm_source: e.target.value})} 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm text-xs">
                {t('Confirm Subscription', 'אשר הרשמה לרשימה')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-xs">{t('Registered Members', 'רשימת נרשמים')} ({subscribers.length})</h3>
          </div>

          <div className="relative w-64">
            <input 
              type="text" 
              placeholder={t('Search performance list...', 'חיפוש ברשימת הביצועים...')} 
              value={filterTerm} 
              onChange={e => setFilterTerm(e.target.value)} 
              className="w-full ps-3 pe-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none" 
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-100">
                <th className="py-3 px-6 text-start font-semibold">{t('Member Identity', 'זהות נרשם')}</th>
                <th className="py-3 px-6 text-start font-semibold">{t('Contact Details', 'פרטי התקשרות')}</th>
                <th className="py-3 px-6 text-start font-semibold">{t('UTM Attribution', 'מקור הגעה (UTM)')}</th>
                <th className="py-3 px-6 text-start font-semibold">{t('Consent Date', 'תאריך אישור ותנאים')}</th>
                <th className="py-3 px-6 text-start font-semibold">{t('Canonical Status', 'סטטוס קנוני')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {subscribers.map(sub => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-800">
                    {sub.person.full_name || 'נרשם אנונימי'}
                    <p className="text-[10px] text-slate-400 font-mono">{sub.person_id}</p>
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    <p className="font-medium">{sub.person.email || '-'}</p>
                    <p className="text-[11px] text-slate-400">{sub.person.phone || '-'}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {sub.utm_source || 'direct'} / {sub.utm_medium || 'none'}
                    </span>
                    {sub.utm_campaign && <p className="text-[10px] text-slate-400 mt-0.5">{sub.utm_campaign}</p>}
                  </td>
                  <td className="py-4 px-6 text-slate-500 font-medium">
                    {new Date(sub.consent_timestamp || sub.created_at).toLocaleDateString('he-IL')} ({sub.privacy_version || 'v1'})
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                      {sub.person.client_status || 'lead'}
                    </span>
                  </td>
                </tr>
              ))}
              {subscribers.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 text-xs font-medium">
                    {t('No subscribers found.', 'לא נמצאו נרשמים ברשימת הביצועים.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PerformanceListManager;
