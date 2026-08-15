import React, { useState, useContext } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const FormBuilder = ({ navigate }) => {
  const { addForm } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([]);

  const addField = (type) => {
    setFields([...fields, { 
      id: `f_${Date.now()}`, 
      type, 
      label: t('New Field', 'שדה חדש'), 
      required: false, 
      options: type === 'dropdown' ? ['Option 1', 'Option 2'] : undefined
    }]);
  };

  const updateField = (id, key, value) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  const removeField = (id) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSave = async () => {
    if(!title.trim()) return alert(t('Please enter a form title.', 'אנא הזן כותרת לטופס.'));
    if(fields.length === 0) return alert(t('Please add at least one field.', 'אנא הוסף לפחות שדה אחד.'));

    await addForm({ title, description, fields });
    navigate('forms');
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 text-start max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('forms')} className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 text-slate-500 hover:text-slate-800 transition-colors">
            <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{t('Form Builder', 'בונה טפסים')}</h2>
            <p className="text-slate-500 text-sm mt-1">{t('Design your custom form.', 'עצב את הטופס המותאם אישית שלך.')}</p>
          </div>
        </div>
        <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm transition-all flex items-center gap-2">
          {t('Save Form', 'שמור טופס')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <input 
              type="text" 
              placeholder={t('Form Title', 'כותרת הטופס')} 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="w-full text-2xl font-bold text-slate-800 border-none outline-none placeholder:text-slate-300 mb-2 bg-transparent"
            />
            <textarea 
              placeholder={t('Form description (optional)', 'תיאור הטופס (אופציונלי)')}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full text-sm text-slate-500 border-none outline-none placeholder:text-slate-300 resize-none bg-transparent"
              rows="2"
            />
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 relative group animate-in slide-in-from-bottom-2 duration-300">
                <button onClick={() => removeField(field.id)} className="absolute top-4 end-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{t('Field Label', 'תווית השדה')}</label>
                    <input 
                      type="text" 
                      value={field.label} 
                      onChange={e => updateField(field.id, 'label', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none font-semibold text-slate-700"
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={field.required} 
                        onChange={e => updateField(field.id, 'required', e.target.checked)}
                        className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-bold text-slate-600">{t('Required', 'שדה חובה')}</span>
                    </label>
                  </div>
                </div>

                {field.type === 'dropdown' && (
                  <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{t('Dropdown Options (Comma separated)', 'אפשרויות לבחירה (מופרד בפסיקים)')}</label>
                    <input 
                      type="text" 
                      value={field.options.join(', ')} 
                      onChange={e => updateField(field.id, 'options', e.target.value.split(',').map(s => s.trim()))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none text-sm text-slate-600"
                    />
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-1 rounded">
                    {field.type === 'text' ? t('Short Text', 'טקסט קצר') : 
                     field.type === 'textarea' ? t('Long Text', 'טקסט ארוך') : 
                     field.type === 'dropdown' ? t('Dropdown', 'רשימה נפתחת') : 
                     field.type === 'tel' ? t('Phone', 'טלפון') : 'Checkbox'}
                  </span>
                </div>
              </div>
            ))}
            
            {fields.length === 0 && (
              <div className="py-12 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">{t('Add fields from the menu to start building your form.', 'הוסף שדות מהתפריט כדי להתחיל לבנות את הטופס.')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-6">
            <h3 className="font-extrabold text-slate-800 mb-4 tracking-tight">{t('Add Fields', 'הוסף שדות')}</h3>
            <div className="space-y-2.5">
              <button onClick={() => addField('text')} className="w-full flex items-center gap-3 p-3 text-start bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl transition-colors text-sm font-bold text-slate-600 hover:text-emerald-700">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                {t('Short Text', 'טקסט קצר')}
              </button>
              <button onClick={() => addField('textarea')} className="w-full flex items-center gap-3 p-3 text-start bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl transition-colors text-sm font-bold text-slate-600 hover:text-emerald-700">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg>
                {t('Long Text (Paragraph)', 'טקסט ארוך (פסקה)')}
              </button>
              <button onClick={() => addField('tel')} className="w-full flex items-center gap-3 p-3 text-start bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl transition-colors text-sm font-bold text-slate-600 hover:text-emerald-700">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                {t('Phone Number', 'מספר טלפון')}
              </button>
              <button onClick={() => addField('dropdown')} className="w-full flex items-center gap-3 p-3 text-start bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl transition-colors text-sm font-bold text-slate-600 hover:text-emerald-700">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                {t('Dropdown', 'רשימה נפתחת')}
              </button>
              <button onClick={() => addField('checkbox')} className="w-full flex items-center gap-3 p-3 text-start bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 rounded-xl transition-colors text-sm font-bold text-slate-600 hover:text-emerald-700">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {t('Checkbox', 'תיבת סימון')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
