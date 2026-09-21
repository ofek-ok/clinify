import React, { useState, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const LeadsPipeline = ({ navigate, onSelectLead }) => {
  const { leads, people, addLead, addPatient, updateLeadStatus, updateLeadFollowUp, addLeadCommunication } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);

  const [formError, setFormError] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [commModalLead, setCommModalLead] = useState(null);
  const [commType, setCommType] = useState('call');
  const [commNote, setCommNote] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      full_name: '',
      phone: '',
      email: '',
      source: 'Website',
      campaign: 'General Inquiries',
      status: 'new'
    }
  });

  const handleLeadSubmit = async (data) => {
    setFormError('');
    setIsSubmittingForm(true);
    try {
      await addLead(data);
      reset();
    } catch (err) {
      console.error("Error creating lead:", err);
      setFormError(err.message || t('Could not create lead. Please try again.', 'לא הצלחנו ליצור את הליד. נסה שוב.'));
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const handleStatusChange = async (lead, newStatus) => {
    if (newStatus === 'lost') {
      let lostReason = lead.lost_reason;
      if (!lostReason || !lostReason.trim()) {
        const reason = window.prompt(t('Please enter reason for lost lead:', 'אנא ציין סיבה לאובדן הליד:'));
        if (!reason || !reason.trim()) {
          return;
        }
        lostReason = reason.trim();
      }
      await updateLeadStatus(lead.id, 'lost');
      await updateLeadFollowUp(lead.id, lead.follow_up_date, lostReason);
      return;
    }
    await updateLeadStatus(lead.id, newStatus);
  };

  const handleFollowUpDateChange = async (lead, newDate) => {
    await updateLeadFollowUp(lead.id, newDate || null, lead.lost_reason);
  };

  const handleLogCommSubmit = async (e) => {
    e.preventDefault();
    if (!commModalLead || !commNote.trim()) return;
    try {
      await addLeadCommunication(commModalLead.id, commType, commNote.trim());
      setCommModalLead(null);
      setCommNote('');
    } catch (err) {
      console.error("Communication log error:", err);
    }
  };

  // V1 Approved Lead Stages (Won is NOT manually selectable)
  const statusColumns = [
    { id: 'new', title: t('New', 'חדש') },
    { id: 'contacted', title: t('Contacted', 'יצרנו קשר') },
    { id: 'qualified', title: t('Qualified', 'מתאים') },
    { id: 'scheduled', title: t('Scheduled', 'נקבע תור') },
    { id: 'lost', title: t('Lost', 'אבוד') }
  ];

  const translateSource = (source) => {
    const map = {
      'Website': t('Website', 'אתר'),
      'Facebook': t('Facebook', 'פייסבוק'),
      'Instagram': t('Instagram', 'אינסטגרם'),
      'LinkedIn': t('LinkedIn', 'לינקדאין'),
      'TikTok': t('TikTok', 'טיקטוק'),
      'WhatsApp': t('WhatsApp', 'ווטסאפ'),
      'Referral': t('Referral', 'המלצה'),
      'Direct': t('Direct', 'ישיר')
    };
    return map[source] || source;
  };

  return (
    <div className="space-y-6 text-start font-sans">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{t('Leads', 'לידים')}</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">{t('Manage inquiries, lead status, follow-up dates and communication logs.', 'ניהול פניות, סטטוסים ותאריכי מעקב.')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* New Lead Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs sticky top-6">
            <h3 className="text-sm font-bold mb-4 text-slate-800">
              {t('Add New Lead', 'הוספת ליד חדש')}
            </h3>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit(handleLeadSubmit)} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('Full Name', 'שם מלא')} *</label>
                <input 
                  type="text" 
                  {...register('full_name', { required: t('Full Name is required', 'שם מלא הוא שדה חובה') })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-slate-400" 
                />
                {errors.full_name && <p className="text-[11px] text-rose-600 mt-0.5">{errors.full_name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('Phone', 'טלפון')} *</label>
                <input 
                  type="tel" 
                  {...register('phone', { required: t('Phone is required', 'מספר טלפון הוא שדה חובה') })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-slate-400 text-end" 
                  dir="ltr" 
                />
                {errors.phone && <p className="text-[11px] text-rose-600 mt-0.5">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('Email', 'דוא"ל')}</label>
                <input 
                  type="email" 
                  {...register('email')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-slate-400" 
                  dir="ltr" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('Source', 'מקור הגעה')}</label>
                <select 
                  {...register('source')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none cursor-pointer"
                >
                  <option value="Website">{t('Website', 'אתר')}</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="TikTok">TikTok</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Referral">{t('Referral', 'המלצה')}</option>
                  <option value="Direct">{t('Direct', 'ישיר')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('Campaign', 'קמפיין')}</label>
                <input 
                  type="text" 
                  {...register('campaign')}
                  placeholder="קמפיין ינואר / Pre-Launch"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-slate-400" 
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmittingForm}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-xs text-xs mt-2"
              >
                {isSubmittingForm ? t('Saving...', 'שומר...') : t('Save Lead', 'שמור ליד')}
              </button>
            </form>
          </div>
        </div>

        {/* Pipeline Columns */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 h-full">
            {statusColumns.map(column => {
              const colLeads = leads.filter(l => (l.status || 'new') === column.id);
              return (
                <div key={column.id} className="bg-slate-50 rounded-xl border border-slate-200 p-3 h-full flex flex-col min-h-[450px]">
                  <div className="flex justify-between items-center mb-3 px-1">
                    <h4 className="font-bold text-xs text-slate-700">{column.title}</h4>
                    <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {colLeads.length}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto">
                    {colLeads.map(lead => {
                      const person = people.find(p => p.id === lead.person_id) || {};
                      const leadName = lead.full_name || person.full_name || 'ליד';
                      const leadPhone = lead.phone || person.phone || '';
                      const leadEmail = lead.email || person.email || '';
                      const isOverdue = lead.follow_up_date && new Date(lead.follow_up_date) < new Date(new Date().setHours(0,0,0,0));

                      return (
                        <div 
                          key={lead.id} 
                          onClick={() => onSelectLead && onSelectLead(lead)}
                          className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition-all cursor-pointer space-y-2"
                        >
                          <div className="flex justify-between items-start gap-1">
                            <h5 className="font-bold text-xs text-slate-800">{leadName}</h5>
                            <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                              {translateSource(lead.source)}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-slate-500" dir="ltr">{leadPhone}</p>
                          {leadEmail && <p className="text-[10px] text-slate-400 truncate" dir="ltr">{leadEmail}</p>}
                          
                          {lead.campaign && (
                            <p className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                              קמפיין: {lead.campaign}
                            </p>
                          )}

                          {lead.follow_up_date && (
                            <div className={`text-[10px] font-medium p-1 rounded border flex items-center justify-between ${
                              isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}>
                              <span>מעקב: {lead.follow_up_date}</span>
                              {isOverdue && <span className="text-rose-600 font-bold">באיחור</span>}
                            </div>
                          )}

                          {lead.lost_reason && column.id === 'lost' && (
                            <p className="text-[10px] text-rose-600 font-medium bg-rose-50 p-1 rounded border border-rose-100">
                              סיבה: {lead.lost_reason}
                            </p>
                          )}

                          {/* Footer Actions */}
                          <div className="pt-2 border-t border-slate-100 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                            <select 
                              value={lead.status || 'new'} 
                              onChange={(e) => handleStatusChange(lead, e.target.value)}
                              className="w-full text-[11px] font-medium border border-slate-200 rounded px-1.5 py-1 bg-white text-slate-700 outline-none cursor-pointer"
                            >
                              <option value="new">{t('New', 'חדש')}</option>
                              <option value="contacted">{t('Contacted', 'יצרנו קשר')}</option>
                              <option value="qualified">{t('Qualified', 'מתאים')}</option>
                              <option value="scheduled">{t('Scheduled', 'נקבע תור')}</option>
                              <option value="lost">{t('Lost', 'אבוד')}</option>
                            </select>

                            <div className="flex items-center justify-between gap-1 text-[10px]">
                              <button
                                onClick={() => setCommModalLead(lead)}
                                className="text-slate-600 hover:text-slate-900 font-medium"
                              >
                                {t('Log Communication', 'תעד תקשורת')}
                              </button>

                              <input 
                                type="date"
                                value={lead.follow_up_date || ''}
                                onChange={(e) => handleFollowUpDateChange(lead, e.target.value)}
                                className="text-[10px] border border-slate-200 rounded px-1 py-0.5 bg-white text-slate-600 outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {colLeads.length === 0 && (
                      <div className="text-center py-8 opacity-40">
                        <p className="text-xs text-slate-500">{t('No leads', 'אין לידים')}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Log Communication Modal */}
      {commModalLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-md w-full shadow-lg border border-slate-200 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-bold text-xs text-slate-800">
                {t('Log Communication with', 'תקשורת עם')} {commModalLead.full_name}
              </h3>
              <button onClick={() => setCommModalLead(null)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
            </div>

            <form onSubmit={handleLogCommSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('Type', 'סוג תקשורת')}</label>
                <select 
                  value={commType} 
                  onChange={(e) => setCommType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                >
                  <option value="call">{t('Phone Call', 'שיחת טלפון')}</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">{t('Email', 'דוא"ל')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('Summary', 'תקציר / הערה')}</label>
                <textarea 
                  rows={3}
                  required
                  placeholder={t('Enter details of the conversation...', 'הזן תיאור קצר...')}
                  value={commNote}
                  onChange={(e) => setCommNote(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button 
                  type="button" 
                  onClick={() => setCommModalLead(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                >
                  {t('Cancel', 'ביטול')}
                </button>
                <button 
                  type="submit" 
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium"
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
