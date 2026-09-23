import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { LanguageContext } from '../context/LanguageContext';

const PublicPerformanceSignupView = () => {
  const { t } = useContext(LanguageContext);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: ''
  });

  const [status, setStatus] = useState({ isSubmitting: false, isSuccess: false, error: null });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFormData(prev => ({
      ...prev,
      utm_source: params.get('utm_source') || 'direct',
      utm_medium: params.get('utm_medium') || 'web',
      utm_campaign: params.get('utm_campaign') || 'pre_launch'
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.full_name || (!formData.email && !formData.phone)) {
      setStatus({ isSubmitting: false, isSuccess: false, error: t('Please enter your full name and either an email address or phone number','נא להזין שם מלא וכן כתובת דוא"ל או טלפון') });
      return;
    }

    setStatus({ isSubmitting: true, isSuccess: false, error: null });

    try {
      const { error } = await supabase.rpc('public_subscribe_performance_list', {
        p_full_name: formData.full_name,
        p_email: formData.email || null,
        p_phone: formData.phone || null,
        p_utm_source: formData.utm_source,
        p_utm_medium: formData.utm_medium,
        p_utm_campaign: formData.utm_campaign
      });

      if (error) {
        throw error;
      }

      setStatus({ isSubmitting: false, isSuccess: true, error: null });
    } catch (err) {
      console.error("Public signup error:", err);
      setStatus({ isSubmitting: false, isSuccess: false, error: t('Something went wrong during signup. Please try again.','אירעה שגיאה בעת ההרשמה. אנא נסה שוב.') });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 dir-rtl text-start font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl relative overflow-hidden">
        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-xs font-semibold mb-3">
            Okonski Performance
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            הצטרפות לעדכונים
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            אני רוצה לקבל עדכון כשהטיפולים נפתחים ולקבל גישה מוקדמת.
          </p>
        </div>

        {status.isSuccess ? (
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 text-center space-y-2">
            <div className="w-10 h-10 bg-violet-500/20 text-violet-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="text-lg font-bold text-white">{t('Signup received successfully!','ההרשמה התקבלה בהצלחה!')}</h3>
            <p className="text-xs text-slate-300">
              תודה רבה. נעדכן אותך ברגע שההרשמה לטיפולים תיפתח.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status.error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-lg text-xs">
                {status.error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                שם מלא *
              </label>
              <input 
                type="text" 
                value={formData.full_name} 
                onChange={e => setFormData({ ...formData, full_name: e.target.value })} 
                required 
                placeholder={t("e.g. John Doe","לדוגמה: אופק אוקונסקי")} 
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:border-slate-600 outline-none text-sm text-white placeholder-slate-600 transition-colors" 
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                דואר אלקטרוני
              </label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                placeholder="name@domain.com" 
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:border-slate-600 outline-none text-sm text-white placeholder-slate-600 transition-colors" 
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                מספר טלפון
              </label>
              <input 
                type="tel" 
                value={formData.phone} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                placeholder="050-0000000" 
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg focus:border-slate-600 outline-none text-sm text-white placeholder-slate-600 transition-colors" 
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={status.isSubmitting} 
                className="w-full bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-bold py-3 px-4 rounded-lg transition-colors text-xs"
              >
                {status.isSubmitting ? t('Sending...','שולח...') : t('Notify Me','אני רוצה לקבל עדכון')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PublicPerformanceSignupView;
