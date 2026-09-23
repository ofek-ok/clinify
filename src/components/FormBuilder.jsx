import React, { useState, useContext, useEffect } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';
import { useToast } from './ui/Toast';
import { Trash2, Copy, ArrowUp, ArrowDown } from 'lucide-react';

const TYPE_LABELS = {
  text: ['Short Text','טקסט קצר'],
  textarea: ['Long Text','טקסט ארוך'],
  tel: ['Phone','טלפון'],
  email: ['Email','אימייל'],
  number: ['Number','מספר'],
  date: ['Date','תאריך'],
  dropdown: ['Dropdown','רשימה נפתחת'],
  checkbox: ['Checkbox / Consent','תיבת סימון / הסכמה']
};

const FormBuilder = ({ navigate }) => {
  const { forms, addForm, updateForm } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);
  const { showToast } = useToast();

  const [editingFormId, setEditingFormId] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const id = window.localStorage.getItem('clinify_edit_form_id');
    if (!id) return;
    const existing = forms.find(form => String(form.id) === String(id));
    if (!existing) return;
    setEditingFormId(existing.id);
    setTitle(existing.title || '');
    setDescription(existing.description || '');
    setFields(Array.isArray(existing.fields) ? existing.fields : []);
    setIsPublic(existing.is_public === true);
  }, [forms]);

  const addField = (type) => {
    setFields(prev => [...prev, {
      id: `f_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      type,
      label: t('New Field', 'שדה חדש'),
      required: false,
      placeholder: '',
      options: type === 'dropdown' ? [t('Option 1','אפשרות 1'), t('Option 2','אפשרות 2')] : undefined
    }]);
  };

  const updateField = (id, key, value) => setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
  const removeField = (id) => setFields(prev => prev.filter(f => f.id !== id));
  const duplicateField = (field) => setFields(prev => [...prev, { ...field, id: `f_${Date.now()}_${Math.random().toString(36).slice(2,7)}` }]);
  const moveField = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= fields.length) return;
    setFields(prev => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    if (!title.trim()) return showToast(t('Please enter a form title.', 'אנא הזן כותרת לטופס.'), 'error');
    if (fields.length === 0) return showToast(t('Please add at least one field.', 'אנא הוסף לפחות שדה אחד.'), 'error');
    if (fields.some(field => !String(field.label || '').trim())) return showToast(t('Every field must have a label','לכל שדה חייבת להיות תווית'), 'error');

    setIsSaving(true);
    try {
      const payload = { title: title.trim(), description: description.trim() || null, fields, is_public: isPublic };
      if (editingFormId) {
        await updateForm(editingFormId, payload);
        showToast(t('Form updated successfully','הטופס עודכן בהצלחה'));
      } else {
        await addForm(payload);
        showToast(t('Form created successfully','הטופס נוצר בהצלחה'));
      }
      window.localStorage.removeItem('clinify_edit_form_id');
      navigate('forms');
    } catch (err) {
      showToast(err.message || t('Could not save form','לא ניתן לשמור את הטופס'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const fieldTypes = ['text','textarea','tel','email','number','date','dropdown','checkbox'];

  return (
    <div className="animate-in fade-in duration-300 space-y-6 text-start max-w-5xl mx-auto">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-4">
          <button onClick={() => { window.localStorage.removeItem('clinify_edit_form_id'); navigate('forms'); }} className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800">←</button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{editingFormId ? t('Edit Form','עריכת טופס') : t('Form Builder','בונה טפסים')}</h2>
            <p className="text-slate-500 text-sm mt-1">{t('Build an intake, consent, follow-up or questionnaire form.','בנה טופס intake, הסכמה, מעקב או שאלון.')}</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-xl shadow-sm">
          {isSaving ? t('Saving...','שומר...') : editingFormId ? t('Save Changes','שמור שינויים') : t('Save Form','שמור טופס')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="premium-panel p-6 rounded-2xl">
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder={t("Form title","כותרת הטופס")} className="w-full text-2xl font-bold text-slate-900 bg-transparent outline-none mb-2" />
            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder={t("Form description (optional)","תיאור הטופס (אופציונלי)")} rows={2} className="w-full text-sm text-slate-500 bg-transparent outline-none resize-none" />
            <label className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-600">
              <input type="checkbox" checked={isPublic} onChange={e=>setIsPublic(e.target.checked)} className="w-4 h-4 accent-violet-600" />
              {t('Public form that can be shared by link','טופס ציבורי שניתן לשתף בקישור')}
            </label>
          </div>

          <div className="space-y-3">
            {fields.map((field,index)=>(
              <div key={field.id} className="premium-panel p-5 rounded-2xl">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <span className="text-[10px] font-black text-violet-700 bg-violet-50 border border-violet-100 px-2 py-1 rounded-lg">
                    {t(...(TYPE_LABELS[field.type] || ['Field','שדה']))}
                  </span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={()=>moveField(index,-1)} disabled={index===0} className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30"><ArrowUp className="w-4 h-4"/></button>
                    <button type="button" onClick={()=>moveField(index,1)} disabled={index===fields.length-1} className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30"><ArrowDown className="w-4 h-4"/></button>
                    <button type="button" onClick={()=>duplicateField(field)} className="p-1.5 text-slate-400 hover:text-violet-600"><Copy className="w-4 h-4"/></button>
                    <button type="button" onClick={()=>removeField(field.id)} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <label>
                    <span className="block text-[10px] font-bold text-slate-500 mb-1">{t('Field Label','תווית השדה')}</span>
                    <input value={field.label || ''} onChange={e=>updateField(field.id,'label',e.target.value)} className="work-input" />
                  </label>
                  {field.type !== 'checkbox' && (
                    <label>
                      <span className="block text-[10px] font-bold text-slate-500 mb-1">Placeholder</span>
                      <input value={field.placeholder || ''} onChange={e=>updateField(field.id,'placeholder',e.target.value)} className="work-input" />
                    </label>
                  )}
                </div>

                {field.type === 'dropdown' && (
                  <label className="block mt-3">
                    <span className="block text-[10px] font-bold text-slate-500 mb-1">{t('Options — comma separated','אפשרויות — מופרדות בפסיקים')}</span>
                    <input value={(field.options || []).join(', ')} onChange={e=>updateField(field.id,'options',e.target.value.split(',').map(v=>v.trim()).filter(Boolean))} className="work-input" />
                  </label>
                )}

                <label className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-slate-600">
                  <input type="checkbox" checked={Boolean(field.required)} onChange={e=>updateField(field.id,'required',e.target.checked)} className="w-4 h-4 accent-violet-600" />
                  {t('Required Field','שדה חובה')}
                </label>
              </div>
            ))}

            {fields.length===0 && <div className="py-14 text-center rounded-2xl border-2 border-dashed border-slate-200 text-sm text-slate-400">{t('Choose fields from the menu to get started.','בחר שדות מהתפריט כדי להתחיל.')}</div>}
          </div>
        </div>

        <div>
          <div className="premium-panel p-5 rounded-2xl sticky top-6">
            <h3 className="font-extrabold text-slate-900 mb-4">{t('Add Field','הוסף שדה')}</h3>
            <div className="grid gap-2">
              {fieldTypes.map(type=>(
                <button key={type} type="button" onClick={()=>addField(type)} className="w-full text-start px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-violet-50 hover:border-violet-200 text-xs font-bold text-slate-600 hover:text-violet-700">
                  + {t(...TYPE_LABELS[type])}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormBuilder;
