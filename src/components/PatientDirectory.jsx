import React, { useContext, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const PatientDirectory = ({ onSelectPatient }) => {
  const { patients, addPatient } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [patientForm, setPatientForm] = useState({ full_name: '', email: '', phone: '', status: 'active' });

  const handlePatientSubmit = (e) => {
    e.preventDefault();
    addPatient(patientForm);
    setPatientForm({ full_name: '', email: '', phone: '', status: 'active' });
  };

  const filteredPatients = patients.filter(p => p.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Export to CSV function
  const handleExportCsv = () => {
    const headers = ['ID', 'Full Name', 'Phone', 'Email', 'Status'];
    const rows = filteredPatients.map(p => [
      p.id,
      `"${p.full_name || ''}"`,
      `"${p.phone || ''}"`,
      `"${p.email || ''}"`,
      p.status || 'active'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `patients_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 text-start">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('Patient Directory', 'ספר מטופלים')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('View, search, and manage patient records in the system.', 'צפה, חפש ונהל תיקי מטופלים במערכת.')}</p>
        </div>

        <button 
          onClick={handleExportCsv}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all self-start sm:self-auto"
        >
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          <span>{t('Export to CSV', 'ייצא לקובץ CSV')}</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/50 relative overflow-hidden h-max">
            <div className="absolute top-0 end-0 w-full h-1 bg-gradient-to-s from-emerald-400 to-teal-500"></div>
            <h3 className="text-lg font-semibold mb-5 text-slate-700 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              {t('New Patient', 'מטופל חדש')}
            </h3>
            <form onSubmit={handlePatientSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Full Name', 'שם מלא')}</label>
                <input type="text" value={patientForm.full_name} onChange={e => setPatientForm({...patientForm, full_name: e.target.value})} required 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-start" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Email', 'אימייל')}</label>
                <input type="email" value={patientForm.email} onChange={e => setPatientForm({...patientForm, email: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-start" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Phone', 'טלפון')}</label>
                <input type="tel" value={patientForm.phone} onChange={e => setPatientForm({...patientForm, phone: e.target.value})} required 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-end" dir="ltr" />
              </div>
              <button type="submit" className="w-full mt-2 bg-gradient-to-e from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-[0.98]">
                {t('Add Patient', 'הוסף מטופל')}
              </button>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="relative w-64">
                <input type="text" placeholder={t('Search patients...', 'חיפוש מטופלים...')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
                  className="w-full ps-4 pe-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none text-start" />
                <svg className="w-4 h-4 text-slate-400 absolute end-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <span className="text-xs font-bold text-slate-400">
                {filteredPatients.length} {t('patients', 'מטופלים')}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-start">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-6 font-semibold text-start">{t('Full Name', 'שם מלא')}</th>
                    <th className="py-3 px-6 font-semibold text-start">{t('Email', 'אימייל')}</th>
                    <th className="py-3 px-6 font-semibold text-start">{t('Phone', 'טלפון')}</th>
                    <th className="py-3 px-6 font-semibold text-start">{t('Status', 'סטטוס')}</th>
                    <th className="py-3 px-6 font-semibold text-center">{t('Actions', 'פעולות')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredPatients.map(patient => (
                    <tr 
                      key={patient.id} 
                      onClick={() => onSelectPatient && onSelectPatient(patient)}
                      className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-6 text-sm font-semibold text-slate-800 text-start group-hover:text-emerald-600 transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                            {patient.full_name.charAt(0)}
                          </div>
                          <span>{patient.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-sm text-slate-500 text-start">{patient.email || '-'}</td>
                      <td className="py-3.5 px-6 text-sm text-slate-500 text-start" dir="ltr">{patient.phone}</td>
                      <td className="py-3.5 px-6 text-start">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${patient.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {patient.status === 'active' ? t('Active', 'פעיל') : t('Inactive', 'לא פעיל')}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span className="text-xs font-bold text-emerald-600 group-hover:underline">
                          {t('View Card', 'פתח כרטיסיית לקוח ➔')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredPatients.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-400 text-sm">{t('No matching patients found.', 'לא נמצאו מטופלים תואמים.')}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDirectory;
