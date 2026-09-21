import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function OwnerAuthScreen() {
  const [email, setEmail] = useState('');
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 dir-rtl font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full space-y-6">
        <div className="text-center space-y-3">
          <img src="/clinify-logo.png" alt="Clinify" className="w-10 h-10 object-contain mx-auto" />
          <h1 className="text-xl font-bold text-white tracking-tight">Clinify</h1>
          <p className="text-slate-400 text-xs">כניסה למערכת הניהול הפנימית</p>
        </div>

        {sent ? (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-3">
            <div className="w-8 h-8 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-sm font-bold">
              ✓
            </div>
            <h2 className="text-sm font-bold text-emerald-400">קישור התחברות נשלח</h2>
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
                placeholder="name@domain.com"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 dir-ltr text-left outline-none transition-colors"
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
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-xs flex items-center justify-center"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>שלח קישור התחברות</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
