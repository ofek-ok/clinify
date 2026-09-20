import React, { useState, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { LanguageContext } from '../context/LanguageContext';

const AuthView = () => {
  const { t } = useContext(LanguageContext);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName }
          }
        });

        if (error) throw error;

        if (data.session) {
          setSuccessMessage(t('Registration successful! Redirecting...', 'הרשמה בוצעה בהצלחה! מעביר למערכת...'));
        } else {
          setSuccessMessage(t('Registration successful! Please check your email to confirm.', 'הרשמה בוצעה! אנא בדוק את תיבת הדוא"ל שלך לאישור החשבון.'));
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
      }
    } catch (err) {
      console.error("Auth error:", err);
      let translatedErr = err.message;
      if (err.message.includes('Invalid login credentials')) {
        translatedErr = t('Invalid email or password.', 'אימייל או סיסמה שגויים. אנא נסה שוב.');
      } else if (err.message.includes('User already registered')) {
        translatedErr = t('User already registered. Please sign in.', 'משתמש זה כבר רשום במערכת. אנא התחבר.');
      }
      setErrorMessage(translatedErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4 font-sans text-start relative overflow-hidden">
      
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-1/4 start-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 end-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/90 backdrop-blur-xl p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6 relative z-10 animate-in zoom-in-95 duration-200">
        
        {/* Clinify Logo Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-sky-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Clinify</h1>
          <p className="text-xs text-slate-400 font-medium">
            {t('Private Therapy & Clinic Practice CRM', 'מערכת ניהול קליניקה ומטפלים פרטיים')}
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60">
          <button 
            onClick={() => { setIsSignUp(false); setErrorMessage(''); setSuccessMessage(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isSignUp ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t('Sign In', 'התחברות למערכת')}
          </button>
          <button 
            onClick={() => { setIsSignUp(true); setErrorMessage(''); setSuccessMessage(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isSignUp ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {t('Register Clinic', 'הרשמת קליניקה חדשה')}
          </button>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                {t('Full Name / Clinic Name', 'שם מלא / שם הקליניקה')} *
              </label>
              <input 
                type="text"
                required
                placeholder={t('e.g. Clinic Name', 'למשל: קליניקת פיזיו-שיקום')}
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm font-medium text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              {t('Email Address', 'כתובת אימייל')} *
            </label>
            <input 
              type="email"
              required
              placeholder="therapist@clinic.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm font-medium text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              {t('Password', 'סיסמה')} *
            </label>
            <input 
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm font-medium text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
              dir="ltr"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all text-xs flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{isSignUp ? t('Create Clinic Account', 'צור חשבון קליניקה חדש') : t('Sign In to Dashboard', 'התחבר לדאשבורד')}</span>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="pt-2 text-center text-[11px] text-slate-500 border-t border-slate-800">
          🔒 {t('Secured Auth & Database Encryption', 'חיבור מאובטח ומוצפן ב-Supabase Auth')}
        </div>

      </div>
    </div>
  );
};

export default AuthView;
