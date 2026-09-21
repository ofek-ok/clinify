import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function OwnerAuthScreen() {
  const [email, setEmail] = useState('ofek@clinify.co');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) {
        throw error;
      }

      setSent(true);
    } catch (err) {
      console.error("Magic link request error:", err);
      setErrorMsg(err.message || 'אירעה שגיאה בשיגור קישור ההתחברות. אנא ודא שהמייל מורשה.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 dir-rtl font-sans">
      <div className="bg-slate-800 border border-slate-700/80 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
            C
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Clinify OS</h1>
          <p className="text-slate-400 text-xs">כניסה למערכת הניהול הפנימית</p>
        </div>

        {sent ? (
          <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-6 text-center space-y-3">
            <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              ✓
            </div>
            <h2 className="text-base font-bold text-emerald-300">קישור התחברות נשלח!</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              נשלח הודעת דוא״ל לכתובת <span className="font-mono text-emerald-400 font-bold">{email}</span>. לחץ על הקישור במייל כדי להיכנס למערכת.
            </p>
            <button
              onClick={() => setSent(false)}
              className="text-xs text-slate-400 hover:text-slate-200 underline pt-2"
            >
              שלח קישור נוסף
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                כתובת דוא״ל מנהל
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ofek@clinify.co"
                className="w-full bg-slate-900/90 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 dir-ltr text-left transition-all outline-none"
              />
            </div>

            {errorMsg && (
              <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center space-x-2 space-x-reverse"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>שלח לי קישור התחברות ✉️</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
