import React, { useContext } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { useToast } from './ui/Toast';
import { Plus, Copy, ExternalLink, Trash2 } from 'lucide-react';

export default function FormManager({ navigate }) {
  const { forms, formSubmissions, updateForm, softDeleteRecord } = useContext(ClinicContext);
  const { showToast } = useToast();

  const copyToClipboard = (formId) => {
    const url = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(url);
    showToast('הקישור הועתק ללוח');
  };

  return (
    <div className="space-y-4 dir-rtl text-start font-sans">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">טפסים</h1>
        <button
          onClick={() => navigate('formBuilder')}
          className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 space-x-reverse transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>טופס חדש</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                <th className="py-3 px-4 text-start">שם הטופס</th>
                <th className="py-3 px-4 text-start">סוג / ציבורי</th>
                <th className="py-3 px-4 text-start">מספר תשובות</th>
                <th className="py-3 px-4 text-start">עודכן</th>
                <th className="py-3 px-4 text-end">פעולות</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {forms.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    אין עדיין טפסים. <button onClick={() => navigate('formBuilder')} className="text-violet-400 underline font-bold mr-1">צור טופס</button>
                  </td>
                </tr>
              ) : (
                forms.map(form => {
                  const subsCount = formSubmissions.filter(s => s.form_id === form.id).length;
                  return (
                    <tr key={form.id} className="hover:bg-slate-100 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {form.title}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await updateForm(form.id, { is_public: form.is_public === false });
                              showToast(form.is_public === false ? 'הטופס הוגדר כציבורי' : 'הטופס הוגדר כפנימי');
                            } catch (err) {
                              showToast(err.message || 'לא ניתן לעדכן את הטופס', 'error');
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          form.is_public !== false
                            ? 'bg-violet-50 text-violet-700 border border-violet-200'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {form.is_public !== false ? 'ציבורי' : 'פנימי'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-bold">
                        {subsCount}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {form.created_at ? new Date(form.created_at).toLocaleDateString('he-IL') : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-end">
                        <div className="flex items-center justify-end space-x-2 space-x-reverse">
                          <button
                            onClick={() => copyToClipboard(form.id)}
                            className="text-slate-500 hover:text-slate-900 p-1 rounded hover:bg-slate-100"
                            title="העתק קישור"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <a
                            href={`/form/${form.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:text-violet-400 p-1 rounded hover:bg-slate-100"
                            title="תצוגה"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            type="button"
                            onClick={async () => {
                              if (!window.confirm(`להעביר את הטופס "${form.title}" לאשפה?`)) return;
                              try {
                                await softDeleteRecord('forms', form.id);
                                showToast('הטופס הועבר לאשפה');
                              } catch (err) {
                                showToast(err.message || 'לא ניתן למחוק את הטופס', 'error');
                              }
                            }}
                            className="text-slate-500 hover:text-rose-600 p-1 rounded hover:bg-rose-50"
                            title="מחיקה"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
