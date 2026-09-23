import React, { useContext, useMemo, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import { useToast } from './ui/Toast';
import Drawer from './ui/Drawer';
import { Plus, Copy, ExternalLink, Trash2, Pencil, Inbox, ArrowRight } from 'lucide-react';

export default function FormManager({ navigate }) {
  const {
    forms,
    formSubmissions,
    people,
    updateForm,
    updateFormSubmission,
    deleteFormSubmission,
    softDeleteRecord
  } = useContext(ClinicContext);

  const { showToast } = useToast();
  const { t, language } = useContext(LanguageContext);
  const [selectedForm, setSelectedForm] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const copyToClipboard = async (formId) => {
    try {
      const url = `${window.location.origin}/form/${formId}`;
      await navigator.clipboard.writeText(url);
      showToast(t('Link copied to clipboard','הקישור הועתק ללוח'));
    } catch {
      showToast(t('Could not copy link','לא ניתן להעתיק את הקישור'), 'error');
    }
  };

  const editForm = (form) => {
    window.localStorage.setItem('clinify_edit_form_id', form.id);
    navigate('formBuilder');
  };

  const getSubmissions = (formId) =>
    formSubmissions
      .filter(s => s.form_id === formId)
      .sort((a,b) => new Date(b.submitted_at) - new Date(a.submitted_at));

  const getResponseLabel = (form, fieldId) =>
    (form?.fields || []).find(field => String(field.id) === String(fieldId))?.label || fieldId;

  const linkedPersonName = (submission) =>
    people.find(person => person.id === submission?.person_id)?.full_name || null;

  const submissionDisplayName = (form, submission) => {
    if (linkedPersonName(submission)) return linkedPersonName(submission);
    const entries = Object.entries(submission?.responses || {});
    const nameField = (form?.fields || []).find(field => /שם|name/i.test(field.label || ''));
    if (nameField && submission.responses?.[nameField.id]) return String(submission.responses[nameField.id]);
    const firstText = entries.find(([,value]) => typeof value === 'string' && value.trim());
    return firstText ? String(firstText[1]).slice(0,45) : t('Unnamed submission','מענה ללא שם');
  };

  const selectedSubmissions = useMemo(
    () => selectedForm ? getSubmissions(selectedForm.id) : [],
    [selectedForm, formSubmissions]
  );

  const closeDrawer = () => {
    setSelectedSubmission(null);
    setSelectedForm(null);
  };

  return (
    <div className="space-y-4 dir-rtl text-start font-sans">
      <div className="premium-panel flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('Forms','טפסים')}</h1>
          <p className="mt-1 text-xs text-slate-500">{t('Intake, consent, questionnaires and follow-up forms.','Intake, הסכמות, שאלונים וטפסי מעקב.')}</p>
        </div>
        <button onClick={() => { window.localStorage.removeItem('clinify_edit_form_id'); navigate('formBuilder'); }}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> {t('New Form','טופס חדש')}
        </button>
      </div>

      <div className="premium-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                <th className="py-3 px-4 text-start">{t('Form Name','שם הטופס')}</th>
                <th className="py-3 px-4 text-start">{t('Access','גישה')}</th>
                <th className="py-3 px-4 text-start">{t('Responses','תשובות')}</th>
                <th className="py-3 px-4 text-start">{t('Created','נוצר')}</th>
                <th className="py-3 px-4 text-end">{t('Actions','פעולות')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {forms.length === 0 ? (
                <tr><td colSpan={5} className="py-14 text-center text-slate-500">
                  {t('No forms yet.','אין עדיין טפסים.')} <button onClick={() => navigate('formBuilder')} className="text-violet-600 font-bold">{t('Create the first one','צור את הראשון')}</button>
                </td></tr>
              ) : forms.map(form => {
                const subsCount = getSubmissions(form.id).length;
                return (
                  <tr key={form.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{form.title}</div>
                      {form.description && <div className="mt-0.5 max-w-sm truncate text-[10px] text-slate-400">{form.description}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <button type="button"
                        onClick={async () => {
                          try {
                            await updateForm(form.id,{is_public:form.is_public !== true});
                            showToast(form.is_public === true ? t('Form set to internal','הטופס הוגדר כפנימי') : t('Form set to public','הטופס הוגדר כציבורי'));
                          } catch(err) { showToast(err.message || t('Could not update','לא ניתן לעדכן'), 'error'); }
                        }}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${form.is_public === true ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {form.is_public === true ? t('Public','ציבורי') : t('Internal','פנימי')}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <button type="button" onClick={() => { setSelectedForm(form); setSelectedSubmission(null); }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-violet-50 hover:text-violet-700">
                        <Inbox className="w-3.5 h-3.5" /> {subsCount}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">{form.created_at ? new Date(form.created_at).toLocaleDateString('he-IL') : '-'}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => editForm(form)} title={t("Edit","עריכה")} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50"><Pencil className="w-4 h-4"/></button>
                        {form.is_public === true && <>
                          <button onClick={() => copyToClipboard(form.id)} title={t("Copy Link","העתק קישור")} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100"><Copy className="w-4 h-4"/></button>
                          <a href={`/form/${form.id}`} target="_blank" rel="noreferrer" title={t("Public Preview","תצוגה ציבורית")} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50"><ExternalLink className="w-4 h-4"/></a>
                        </>}
                        <button type="button" onClick={async()=>{
                          if(!window.confirm(t(`Move form "${form.title}" to Trash?`, `להעביר את הטופס "${form.title}" לאשפה?`))) return;
                          try { await softDeleteRecord('forms',form.id); showToast(t('Form moved to Trash','הטופס הועבר לאשפה')); }
                          catch(err){ showToast(err.message || t('Could not move to Trash','לא ניתן להעביר לאשפה'),'error'); }
                        }} title={t("Move to Trash","העבר לאשפה")} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer isOpen={Boolean(selectedForm)} onClose={closeDrawer}
        title={selectedSubmission ? t('Submission Details','פרטי מענה') : selectedForm?.title || t('Responses','תשובות')}
        width="max-w-2xl"
        footer={<button type="button" onClick={closeDrawer} className="px-4 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold">{t('Close','סגור')}</button>}>
        {selectedForm && !selectedSubmission && (
          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-500">
              {selectedSubmissions.length} {t('responses received','תשובות התקבלו')}
            </div>
            {selectedSubmissions.length===0 ? (
              <div className="py-12 text-center text-xs text-slate-400">{t('No responses to this form yet.','עדיין אין תשובות לטופס הזה.')}</div>
            ) : selectedSubmissions.map(submission=>(
              <button key={submission.id} type="button" onClick={()=>setSelectedSubmission(submission)}
                className="w-full flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-start hover:border-violet-200 hover:bg-violet-50/40">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{submissionDisplayName(selectedForm,submission)}</div>
                  <div className="mt-1 text-[10px] text-slate-400">{new Date(submission.submitted_at).toLocaleString(language === 'he' ? 'he-IL' : 'en-US')}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 rotate-180" />
              </button>
            ))}
          </div>
        )}

        {selectedForm && selectedSubmission && (
          <div className="space-y-5">
            <button type="button" onClick={()=>setSelectedSubmission(null)} className="text-xs font-bold text-violet-700">← {t('Back to all responses','חזרה לכל התשובות')}</button>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">{t('Link to Client / Lead','שיוך ללקוח / ליד')}</label>
              <select value={selectedSubmission.person_id || ''} onChange={async e=>{
                try {
                  const updated=await updateFormSubmission(selectedSubmission.id,{person_id:e.target.value || null});
                  setSelectedSubmission(updated);
                  showToast(t('Link updated','השייכות עודכנה'));
                } catch(err){ showToast(err.message || t('Could not link','לא ניתן לשייך'),'error'); }
              }} className="work-input">
                <option value="">{t("No Link","ללא שיוך")}</option>
                {people.slice().sort((a,b)=>String(a.full_name||'').localeCompare(String(b.full_name||''),'he')).map(person=><option key={person.id} value={person.id}>{person.full_name}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              {(selectedForm.fields || []).map(field=>{
                const value=selectedSubmission.responses?.[field.id];
                return (
                  <div key={field.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-[10px] font-bold text-slate-400">{field.label}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-800 whitespace-pre-wrap">
                      {typeof value === 'boolean' ? (value ? t('Yes','כן') : t('No','לא')) : (value || '-')}
                    </div>
                  </div>
                );
              })}
            </div>

            <button type="button" onClick={async()=>{
              if(!window.confirm(t('Move this submission to Trash?','להעביר את המענה לאשפה?'))) return;
              try {
                await deleteFormSubmission(selectedSubmission.id);
                showToast(t('Submission moved to Trash','המענה הועבר לאשפה'));
                setSelectedSubmission(null);
              } catch(err){ showToast(err.message || t('Could not move submission to Trash','לא ניתן למחוק את המענה'),'error'); }
            }} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
              <Trash2 className="w-4 h-4" /> {t('Move Submission to Trash','העבר מענה לאשפה')}
            </button>
          </div>
        )}
      </Drawer>
    </div>
  );
}
