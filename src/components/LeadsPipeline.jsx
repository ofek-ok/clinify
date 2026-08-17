import React, { useContext } from 'react';
import { useForm } from 'react-hook-form';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const LeadsPipeline = ({ navigate, onSelectLead }) => {
  const { leads, addLead, addPatient, updateLeadStatus } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);

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

  const handleLeadSubmit = (data) => {
    addLead(data);
    reset();
  };

  const convertToPatient = (lead, e) => {
    if (e) e.stopPropagation();
    addPatient({ full_name: lead.full_name, email: lead.email, phone: lead.phone, status: 'active' });
    updateLeadStatus(lead.id, 'converted');
    if(window.confirm(t('Lead successfully converted to patient! Schedule an appointment now?', 'הליד הומר למטופל בהצלחה! האם תרצה לקבוע לו תור עכשיו?'))) {
      navigate('appointments');
    }
  };

  const statusColumns = [
    { id: 'new', title: t('New Lead', 'ליד חדש'), color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'contacted', title: t('Contacted', 'נוצר קשר'), color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { id: 'converted', title: t('Converted', 'הומר למטופל'), color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
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
            React Hook Form Powered
          </span>
        </div>
        <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">{t('Track leads, set follow-ups, and manage conversions.', 'עקוב אחר לידים, נהל משימות מעקב (Follow-up) והמר אותם למטופלים.')}</p>
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

            <form onSubmit={handleSubmit(handleLeadSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 text-start">{t('Full Name', 'שם מלא')}</label>
                <input 
                  type="text" 
                  {...register('full_name', { required: t('Full Name is required', 'שם מלא הוא שדה חובה') })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-start text-xs font-medium" 
                />
                {errors.full_name && <p className="text-[11px] text-red-500 font-bold mt-1">{errors.full_name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 text-start">{t('Phone', 'טלפון')}</label>
                <input 
                  type="tel" 
                  {...register('phone', { required: t('Phone is required', 'מספר טלפון הוא שדה חובה') })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-end text-xs font-medium" 
                  dir="ltr" 
                />
                {errors.phone && <p className="text-[11px] text-red-500 font-bold mt-1">{errors.phone.message}</p>}
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
                className="w-full mt-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-extrabold py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-[0.98] text-xs disabled:opacity-50"
              >
                {t('Save Lead', 'שמור ליד')}
              </button>
            </form>
          </div>
        </div>

        {/* Pipeline Columns */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 h-full">
            {statusColumns.map(column => (
              <div key={column.id} className="glass-card rounded-3xl p-4 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-extrabold text-xs text-slate-800">{column.title}</h4>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${column.color}`}>
                    {leads.filter(l => l.status === column.id).length}
                  </span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {leads.filter(l => l.status === column.id).map(lead => (
                    <div 
                      key={lead.id} 
                      onClick={() => onSelectLead && onSelectLead(lead)}
                      className="bg-white/80 p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:border-violet-300"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-bold text-xs text-slate-900 text-start group-hover:text-violet-600 transition-colors">{lead.full_name}</h5>
                        <span className="text-[9px] uppercase tracking-wider font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{translateSource(lead.source)}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mb-2 text-start" dir="ltr">{lead.phone}</p>
                      
                      {lead.lost_reason && column.id === 'lost' && (
                        <p className="text-[10px] text-red-600 font-bold mb-2 text-start bg-red-50 p-1.5 rounded-lg border border-red-100">
                          {t('Reason', 'סיבה')}: {lead.lost_reason}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100">
                        {lead.status !== 'converted' && (
                          <select 
                            value={lead.status} 
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                            className="text-[10px] font-bold border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-slate-700 outline-none cursor-pointer text-start"
                          >
                            <option value="new">{t('New', 'חדש')}</option>
                            <option value="contacted">{t('Contacted', 'נוצר קשר')}</option>
                            <option value="lost">{t('Lost', 'אבוד')}</option>
                          </select>
                        )}

                        {lead.status !== 'converted' && (
                          <button 
                            onClick={(e) => convertToPatient(lead, e)} 
                            className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors shrink-0 flex items-center gap-1" 
                            title={t("Convert to Patient", "המר למטופל")}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                            <span>{t('Convert', 'המר')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsPipeline;
