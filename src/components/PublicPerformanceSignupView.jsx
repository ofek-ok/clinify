import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const PublicPerformanceSignupView = () => {
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
    // Parse URL search parameters for UTM tracking
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
      setStatus({ isSubmitting: false, isSuccess: false, error: 'נא להזין שם מלא וכן כתובת דוא"ל או טלפון' });
      return;
    }

    setStatus({ isSubmitting: true, isSuccess: false, error: null });

    try {
      const { data, error } = await supabase.rpc('public_subscribe_performance_list', {
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
      console.error("Performance list signup error:", err);
      setStatus({ isSubmitting: false, isSuccess: false, error: err.message || 'אירעה שגיאה בעת ההרשמה. אנא נסה שוב.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4 dir-rtl text-start font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-500"></div>

        <div className="text-center mb-8">
          <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            Okonski Performance • Pre-Launch
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            הצטרפו לרשימת הביצועים
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            קבלו גישה מוקדמת, תכנים בלעדיים וליווי ביצועי מותאם אישית.
          </p>
        </div>

        {status.isSuccess ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-3 animate-in zoom-in-95 duration-300">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-xl font-bold text-emerald-400">ההרשמה הושלמה בהצלחה!</h3>
            <p className="text-xs text-slate-300">
              פרטיכם נשמרו בהצלחה ברשימת הביצועים של Okonski Performance. נשתמע בקרוב!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {status.error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs">
                {status.error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                שם מלא *
              </label>
              <input 
                type="text" 
                value={formData.full_name} 
                onChange={e => setFormData({ ...formData, full_name: e.target.value })} 
                required 
                placeholder="לדוגמה: אופק אוקונסקי" 
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm text-white placeholder-slate-600 transition-all" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                דואר אלקטרוני
              </label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                placeholder="name@domain.com" 
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm text-white placeholder-slate-600 transition-all" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                מספר טלפון
              </label>
              <input 
                type="tel" 
                value={formData.phone} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                placeholder="050-0000000" 
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm text-white placeholder-slate-600 transition-all" 
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={status.isSubmitting} 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all active:scale-[0.98] text-sm"
              >
                {status.isSubmitting ? 'שולח הרשמה...' : 'הצטרף ל-Performance List 🚀'}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center mt-4">
              בלחיצה על הרשמה הנך מסכים/ה לקבלת עדכונים ותכנים מ-Okonski Performance.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default PublicPerformanceSignupView;
