import React, { useContext } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const FormManager = ({ navigate }) => {
  const { forms, formSubmissions } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);

  const copyToClipboard = (formId) => {
    const url = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(url);
    alert(t('Form link copied to clipboard!', 'קישור לטופס הועתק ללוח!'));
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 text-start">
      <div className="flex justify-between items-end flex-wrap gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('Forms & Questionnaires', 'טפסים ושאלונים')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('Manage public forms and view patient submissions.', 'נהל טפסים ציבוריים וצפה בתשובות מטופלים.')}</p>
        </div>
        <button 
          onClick={() => navigate('formBuilder')} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          {t('Create New Form', 'צור טופס חדש')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {forms.map(form => {
          const subs = formSubmissions.filter(s => s.form_id === form.id).length;
          return (
            <div key={form.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-md">{subs} {t('Submissions', 'תשובות')}</span>
              </div>
              <h3 className="font-extrabold text-lg text-slate-800 mb-2">{form.title}</h3>
              <p className="text-slate-500 text-sm mb-6 flex-1 line-clamp-2">{form.description}</p>
              
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button onClick={() => copyToClipboard(form.id)} className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2 rounded-lg text-xs transition-colors border border-slate-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                  {t('Copy Link', 'העתק קישור')}
                </button>
                <a href={`/form/${form.id}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-4 py-2 rounded-lg text-xs transition-colors border border-emerald-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                  {t('Preview', 'תצוגה')}
                </a>
              </div>
            </div>
          )
        })}
        {forms.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            <h3 className="font-bold text-slate-600 mb-1">{t('No forms yet', 'אין טפסים עדיין')}</h3>
            <p className="text-sm text-slate-400">{t('Create your first form to start collecting data.', 'צור את הטופס הראשון שלך כדי להתחיל לאסוף נתונים.')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormManager;
