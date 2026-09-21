import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LanguageContext } from '../context/LanguageContext';

const PublicFormView = () => {
  const { id } = useParams();
  const { t } = useContext(LanguageContext);

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Dynamic form state
  const [responses, setResponses] = useState({});

  useEffect(() => {
    fetchForm();
  }, [id]);

  const fetchForm = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('forms').select('id, title, description, fields').eq('id', id).single();
      if (error || !data) {
        setError(t('Form not found.', 'הטופס לא נמצא.'));
      } else {
        setForm(data);
        
        // Initialize responses state based on fields
        const initialResponses = {};
        (data.fields || []).forEach(field => {
          initialResponses[field.id] = field.type === 'checkbox' ? false : '';
        });
        setResponses(initialResponses);
      }
    } catch (err) {
      console.error("Error loading public form:", err);
      setError(t('Form not found.', 'הטופס לא נמצא.'));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldId, value) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Save public submission directly via RLS anon insert policy
      const { error } = await supabase.from('form_submissions').insert([{
        form_id: form.id,
        responses: responses,
        submitted_at: new Date().toISOString()
      }]);

      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error("Form submission error:", err);
      setError(t('Error submitting form. Please try again.', 'שגיאה בשליחת הטופס. אנא נסה שנית.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full">
          <svg className="w-12 h-12 text-rose-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h2 className="text-xl font-bold text-slate-800">{error}</h2>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">{t('Thank You!', 'תודה רבה!')}</h2>
          <p className="text-slate-500 text-xs">{t('Your form has been submitted successfully.', 'הטופס נשלח בהצלחה.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-start font-sans">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-800">{form.title}</h1>
          {form.description && <p className="text-slate-500 text-xs mt-2">{form.description}</p>}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 sm:p-10 space-y-8">
            {(form.fields || []).map(field => (
              <div key={field.id} className="space-y-2">
                <label className="block text-sm font-bold text-slate-700">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>
                
                {field.type === 'text' && (
                  <input type="text" required={field.required} value={responses[field.id] || ''} onChange={e => handleInputChange(field.id, e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm font-medium" />
                )}
                
                {field.type === 'tel' && (
                  <input type="tel" required={field.required} value={responses[field.id] || ''} onChange={e => handleInputChange(field.id, e.target.value)} dir="ltr" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-end text-sm font-medium" />
                )}
                
                {field.type === 'textarea' && (
                  <textarea required={field.required} value={responses[field.id] || ''} onChange={e => handleInputChange(field.id, e.target.value)} rows="4" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none text-sm font-medium"></textarea>
                )}
                
                {field.type === 'dropdown' && (
                  <select required={field.required} value={responses[field.id] || ''} onChange={e => handleInputChange(field.id, e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all cursor-pointer text-sm font-medium">
                    <option value="">{t('Select an option...', 'בחר אפשרות...')}</option>
                    {(field.options || []).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                
                {field.type === 'checkbox' && (
                  <label className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                    <input type="checkbox" required={field.required} checked={responses[field.id] || false} onChange={e => handleInputChange(field.id, e.target.checked)} className="mt-0.5 w-5 h-5 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500" />
                    <span className="text-sm font-semibold text-slate-700">{field.label}</span>
                  </label>
                )}
              </div>
            ))}
          </div>
          
          <div className="p-6 sm:p-10 bg-slate-50 border-t border-slate-100">
            <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs">
              {isSubmitting ? t('Submitting...', 'שולח...') : t('Submit Form', 'שלח טופס')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublicFormView;
