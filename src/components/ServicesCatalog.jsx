import React, { useContext, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const ServicesCatalog = () => {
  const { services, addService } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    duration_minutes: 30,
    default_price: ''
  });

  const handleServiceSubmit = (e) => {
    e.preventDefault();
    addService({
      ...serviceForm,
      duration_minutes: parseInt(serviceForm.duration_minutes),
      default_price: parseFloat(serviceForm.default_price)
    });
    setServiceForm({ name: '', description: '', duration_minutes: 30, default_price: '' });
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 text-start">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{t('Services Catalog', 'קטלוג שירותים')}</h2>
        <p className="text-slate-500 text-sm mt-1">{t('Manage treatments, durations, and pricing.', 'נהל את סוגי הטיפולים, משך הזמן והתמחור שלהם.')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/50 relative overflow-hidden h-max">
            <div className="absolute top-0 end-0 w-full h-1 bg-gradient-to-s from-indigo-400 to-purple-500"></div>
            <h3 className="text-lg font-semibold mb-5 text-slate-700 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              {t('Add New Service', 'הוספת שירות חדש')}
            </h3>
            <form onSubmit={handleServiceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Service Name', 'שם השירות')}</label>
                <input type="text" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} required 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-start" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Description (Optional)', 'תיאור (אופציונלי)')}</label>
                <textarea value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} rows="2"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none text-start"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Duration (Mins)', 'משך זמן (דקות)')}</label>
                  <input type="number" min="5" step="5" value={serviceForm.duration_minutes} onChange={e => setServiceForm({...serviceForm, duration_minutes: e.target.value})} required 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-start" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Price (₪)', 'מחיר (₪)')}</label>
                  <input type="number" min="0" step="0.01" value={serviceForm.default_price} onChange={e => setServiceForm({...serviceForm, default_price: e.target.value})} required 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-start" />
                </div>
              </div>
              <button type="submit" className="w-full mt-2 bg-gradient-to-e from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-[0.98]">
                {t('Save Service', 'שמור שירות')}
              </button>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map(service => (
              <div key={service.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-800 text-lg text-start">{service.name}</h4>
                  <span className="font-extrabold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg" dir="ltr"><span className="opacity-50 me-1">₪</span>{service.default_price.toFixed(2)}</span>
                </div>
                <p className="text-sm text-slate-500 mb-4 h-10 overflow-hidden line-clamp-2 text-start">{service.description || t('No description', 'ללא תיאור')}</p>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 w-fit px-2 py-1 rounded-md">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {service.duration_minutes} {t('mins', 'דקות')}
                </div>
              </div>
            ))}
            {services.length === 0 && (
              <div className="col-span-2 py-12 text-center text-slate-400">
                {t('No services defined yet.', 'לא הוגדרו שירותים עדיין.')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesCatalog;
