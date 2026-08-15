import React, { useContext, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const LeadsPipeline = ({ navigate }) => {
  const { leads, addLead, addPatient, updateLeadStatus } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);
  const [leadForm, setLeadForm] = useState({ full_name: '', phone: '', email: '', source: 'Website', status: 'new' });

  const handleLeadSubmit = (e) => {
    e.preventDefault();
    addLead(leadForm);
    setLeadForm({ full_name: '', phone: '', email: '', source: 'Website', status: 'new' });
  };

  const convertToPatient = (lead) => {
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
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6 text-start">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{t('Leads Pipeline', 'צנרת לידים (Pipeline)')}</h2>
        <p className="text-slate-500 text-sm mt-1">{t('Track leads and manage the conversion process to patients.', 'עקוב אחר לידים ונהל את תהליך ההמרה למטופלים.')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/50 relative overflow-hidden h-max">
            <div className="absolute top-0 end-0 w-full h-1 bg-gradient-to-s from-violet-400 to-fuchsia-500"></div>
            <h3 className="text-lg font-semibold mb-5 text-slate-700 flex items-center gap-2">
              <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
              {t('Add Manual Lead', 'הוספת ליד ידנית')}
            </h3>
            <form onSubmit={handleLeadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Full Name', 'שם מלא')}</label>
                <input type="text" value={leadForm.full_name} onChange={e => setLeadForm({...leadForm, full_name: e.target.value})} required 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-start" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Phone', 'טלפון')}</label>
                <input type="tel" value={leadForm.phone} onChange={e => setLeadForm({...leadForm, phone: e.target.value})} required 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all text-end" dir="ltr" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Source', 'מקור הגעה')}</label>
                <select value={leadForm.source} onChange={e => setLeadForm({...leadForm, source: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all cursor-pointer text-start">
                  <option value="Website">{t('Website', 'אתר')}</option>
                  <option value="Facebook">{t('Facebook', 'פייסבוק')}</option>
                  <option value="WhatsApp">{t('WhatsApp', 'ווטסאפ')}</option>
                  <option value="Direct">{t('Direct', 'ישיר')}</option>
                </select>
              </div>
              <button type="submit" className="w-full mt-2 bg-gradient-to-e from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-[0.98]">
                {t('Save Lead', 'שמור ליד')}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 h-full">
            {statusColumns.map(column => (
              <div key={column.id} className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-slate-700">{column.title}</h4>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${column.color}`}>
                    {leads.filter(l => l.status === column.id).length}
                  </span>
                </div>
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {leads.filter(l => l.status === column.id).map(lead => (
                    <div key={lead.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-bold text-sm text-slate-800 text-start">{lead.full_name}</h5>
                        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{translateSource(lead.source)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3 text-start" dir="ltr">{lead.phone}</p>
                      
                      <div className="flex gap-2">
                        {lead.status !== 'converted' && (
                          <select 
                            value={lead.status} 
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-600 outline-none w-full cursor-pointer text-start"
                          >
                            <option value="new">{t('New', 'חדש')}</option>
                            <option value="contacted">{t('Contacted', 'נוצר קשר')}</option>
                            <option value="lost">{t('Lost', 'אבוד')}</option>
                          </select>
                        )}
                        {lead.status !== 'converted' && (
                          <button onClick={() => convertToPatient(lead)} className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors shrink-0 tooltip" title={t("Convert to Patient", "המר למטופל")}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
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
