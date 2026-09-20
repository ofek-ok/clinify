import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const LeadsPipeline = ({ navigate, onSelectLead }) => {
  const { leads, addLead, addPatient, updateLeadStatus, updateLeadFollowUp, addLeadCommunication } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);

  const [formError, setFormError] = useState('');
  const [commModalLead, setCommModalLead] = useState(null);
  const [commType, setCommType] = useState('call');
  const [commNote, setCommNote] = useState('');

  // React Hook Form for manual lead entry
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      source: 'Website',
      status: 'new'
    }
  });

  const handleLeadSubmit = async (data) => {
    setFormError('');
    try {
      await addLead(data);
      reset();
    } catch (err) {
      console.error("Error creating lead:", err);
      setFormError(err.message || t('Failed to create lead', 'שגיאה ביצירת הליד'));
    }
  };

  const handleCreateClinicalProfile = async (lead, e) => {
    if (e) e.stopPropagation();
    try {
      await addPatient({ full_name: lead.full_name, email: lead.email, phone: lead.phone, status: 'active' });
      if(window.confirm(t('Clinical profile created! Schedule an appointment now?', 'תיק טיפולי נפתח בהצלחה! האם תרצה לקבוע תור עכשיו?'))) {
        navigate('appointments');
      }
    } catch (err) {
      alert(err.message || t('Failed to create clinical profile', 'שגיאה בפתיחת תיק טיפולי'));
    }
  };

  const handleStatusChange = async (lead, newStatus) => {
    let lostReason = lead.lost_reason;
    if (newStatus === 'lost' && !lostReason) {
      const reason = window.prompt(t('Please enter reason for lost lead:', 'אנא ציין סיבה לאובדן הליד:'));
      if (reason) lostReason = reason.trim();
    }
    await updateLeadStatus(lead.id, newStatus);
    if (newStatus === 'lost' && lostReason) {
      await updateLeadFollowUp(lead.id, lead.follow_up_date, lostReason);
    }
  };

  const handleFollowUpDateChange = async (lead, newDate) => {
    await updateLeadFollowUp(lead.id, newDate || null, lead.lost_reason);
  };

  const handleLogCommSubmit = async (e) => {
    e.preventDefault();
    if (!commModalLead || !commNote.trim()) return;
    await addLeadCommunication(commModalLead.id, commType, commNote.trim());
    setCommModalLead(null);
    setCommNote('');
  };

  // V1 Approved Lead Stages
  const statusColumns = [
    { id: 'new', title: t('New Lead', 'ליד חדש'), color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'contacted', title: t('Contacted', 'נוצר קשר'), color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { id: 'qualified', title: t('Qualified', 'כשיר/מותאם'), color: 'bg-teal-100 text-teal-700 border-teal-200' },
    { id: 'scheduled', title: t('Scheduled', 'נקבע תור'), color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 'lost', title: t('Lost', 'אבוד'), color: 'bg-slate-100 text-slate-600 border-slate-200' }
  ];

  const translateSource = (source) => {
    const map = { 'Facebook': t('Facebook', 'פייסבוק'), 'Website': t('Website', 'אתר'), 'WhatsApp': t('WhatsApp', 'ווטסאפ'), 'Direct': t('Direct', 'ישיר') };
    return map[source] || source;
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 text-start">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('Leads Pipeline', 'צנרת לידים (Pipeline)')}</h2>
          <span className="text-[10px] font-black bg-violet-100 text-violet-800 px-2.5 py-0.5 rounded-full border border-violet-200">
            OP OS Core v1
          </span>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">{t('Track leads, manage stages, and set follow-ups on canonical Person identity.', 'עקוב אחר לידים, נהל שלבי צנרת ותאריכי מעקב על פני זהות Person מרכזית.')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Manual Lead Form Box */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 rounded-3xl relative overflow-hidden h-max">
            <div className="absolute top-0 end-0 w-full h-1 bg-gradient-to-s from-violet-500 to-fuchsia-500"></div>
            <h3 className="text-base font-extrabold mb-5 text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
              {t('Add Manual Lead', 'הוספת ליד ידנית')}
            </h3>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(handleLeadSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 text-start">{t('Full Name', 'שם מלא')} *</label>
                <input 
                  type="text" 
                  {...register('full_name', { required: t('Full Name is required', 'שם מלא הוא שדה חובה') })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-start text-xs font-medium" 
                />
                {errors.full_name && <p className="text-[11px] text-red-500 font-bold mt-1">{errors.full_name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 text-start">{t('Phone', 'טלפון')} *</label>
                <input 
                  type="tel" 
                  {...register('phone', { required: t('Phone is required', 'מספר טלפון הוא שדה חובה') })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-end text-xs font-medium" 
                  dir="ltr" 
                />
                {errors.phone && <p className="text-[11px] text-red-500 font-bold mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 text-start">{t('Email', 'אימייל')}</label>
                <input 
                  type="email" 
                  {...register('email')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-start text-xs font-medium" 
                  dir="ltr" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 text-start">{t('Source', 'מקור הגעה')}</label>
                <select 
                  {...register('source')}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-start text-xs font-medium cursor-pointer"
                >
                  <option value="Website">{t('Website', 'אתר')}</option>
                  <option value="Facebook">{t('Facebook', 'פייסבוק')}</option>
                  <option value="WhatsApp">{t('WhatsApp', 'ווטסאפ')}</option>
                  <option value="Direct">{t('Direct', 'ישיר')}</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full mt-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-extrabold py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-[0.98] text-xs disabled:opacity-50 cursor-pointer"
              >
                {t('Save Lead', 'שמור ליד')}
              </button>
            </form>
          </div>
        </div>

        {/* Pipeline Columns */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 h-full">
            {statusColumns.map(column => (
              <div key={column.id} className="glass-card rounded-3xl p-4 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-extrabold text-xs text-slate-800">{column.title}</h4>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${column.color}`}>
                    {leads.filter(l => (l.status || 'new') === column.id).length}
                  </span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {leads.filter(l => (l.status || 'new') === column.id).map(lead => {
                    const isOverdue = lead.follow_up_date && new Date(lead.follow_up_date) < new Date(new Date().setHours(0,0,0,0));

                    return (
                      <div 
                        key={lead.id} 
                        onClick={() => onSelectLead && onSelectLead(lead)}
                        className="bg-white/90 p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-violet-300 relative"
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <h5 className="font-bold text-xs text-slate-900 text-start group-hover:text-violet-600 transition-colors">{lead.full_name}</h5>
                          <span className="text-[9px] uppercase tracking-wider font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{translateSource(lead.source)}</span>
                        </div>
                        
                        <p className="text-[11px] text-slate-500 font-medium mb-1 text-start" dir="ltr">{lead.phone}</p>
                        {lead.email && <p className="text-[10px] text-slate-400 font-normal mb-2 text-start truncate" dir="ltr">{lead.email}</p>}
                        
                        {/* Follow up date indicator */}
                        {lead.follow_up_date && (
                          <div className={`text-[10px] font-bold mb-2 p-1.5 rounded-lg border flex items-center justify-between ${
                            isOverdue 
                              ? 'bg-rose-50 text-rose-700 border-rose-200' 
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          }`}>
                            <span>📅 {t('Follow-up', 'מעקב')}: {lead.follow_up_date}</span>
                            {isOverdue && <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded font-black">{t('Overdue', 'באיחור')}</span>}
                          </div>
                        )}

                        {lead.lost_reason && column.id === 'lost' && (
                          <p className="text-[10px] text-red-600 font-bold mb-2 text-start bg-red-50 p-1.5 rounded-lg border border-red-100">
                            {t('Reason', 'סיבה')}: {lead.lost_reason}
                          </p>
                        )}

                        {/* Card Actions Footer */}
                        <div className="space-y-2 mt-3 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between gap-1">
                            <select 
                              value={lead.status || 'new'} 
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleStatusChange(lead, e.target.value)}
                              className="text-[10px] font-bold border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-slate-700 outline-none cursor-pointer text-start flex-1"
                            >
                              <option value="new">{t('New', 'חדש')}</option>
                              <option value="contacted">{t('Contacted', 'נוצר קשר')}</option>
                              <option value="qualified">{t('Qualified', 'כשיר/מותאם')}</option>
                              <option value="scheduled">{t('Scheduled', 'נקבע תור')}</option>
                              <option value="lost">{t('Lost', 'אבוד')}</option>
                            </select>

                            <button 
                              onClick={(e) => handleCreateClinicalProfile(lead, e)} 
                              className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[10px] font-black px-2 py-1 rounded-lg border border-emerald-200 transition-colors shrink-0 flex items-center gap-1 cursor-pointer" 
                              title={t("Create Clinical Profile", "פתח תיק רפואי")}
                            >
                              <span>{t('Profile', 'תיק רפואי')}</span>
                            </button>
                          </div>

                          {/* Quick Communication & Follow Up Trigger */}
                          <div className="flex items-center justify-between gap-1 pt-1 text-[10px]" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setCommModalLead(lead)}
                              className="text-violet-600 hover:text-violet-800 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              💬 {t('Log Comm', 'תעד תקשורת')}
                            </button>

                            <input 
                              type="date"
                              value={lead.follow_up_date || ''}
                              onChange={(e) => handleFollowUpDateChange(lead, e.target.value)}
                              className="text-[9px] border border-slate-200 rounded px-1 py-0.5 bg-slate-50 text-slate-600 outline-none cursor-pointer"
                              title={t('Set Follow-up Date', 'קבע תאריך מעקב')}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Communication Log Modal */}
      {commModalLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-sm text-slate-800">
                {t('Log Communication with', 'תיעוד תקשורת עם')} {commModalLead.full_name}
              </h3>
              <button onClick={() => setCommModalLead(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleLogCommSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{t('Interaction Type', 'סוג תקשורת')}</label>
                <select 
                  value={commType} 
                  onChange={(e) => setCommType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                >
                  <option value="call">📞 {t('Phone Call', 'שיחת טלפון')}</option>
                  <option value="whatsapp">🟢 WhatsApp</option>
                  <option value="email">✉️ {t('Email', 'אימייל')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">{t('Summary / Note', 'סיכום התקשורת')}</label>
                <textarea 
                  rows={3}
                  required
                  placeholder={t('Enter details of the conversation...', 'הזן תיאור קצר של השיחה...')}
                  value={commNote}
                  onChange={(e) => setCommNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setCommModalLead(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  {t('Cancel', 'ביטול')}
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-extrabold rounded-xl text-xs shadow-md"
                >
                  {t('Save Entry', 'שמור תיעוד')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPipeline;
