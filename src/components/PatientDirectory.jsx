import React, { useContext, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const PatientDirectory = ({ onSelectPatient }) => {
  const { patients, addPatient } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active'); // 'active', 'inactive', 'all'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [patientForm, setPatientForm] = useState({ full_name: '', email: '', phone: '', status: 'active' });

  const handlePatientSubmit = (e) => {
    e.preventDefault();
    addPatient(patientForm);
    setPatientForm({ full_name: '', email: '', phone: '', status: 'active' });
    setIsAddModalOpen(false);
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.phone && p.phone.includes(searchTerm));
    
    const pStatus = p.status || 'active';
    if (statusFilter === 'active') return matchesSearch && pStatus === 'active';
    if (statusFilter === 'inactive') return matchesSearch && pStatus === 'inactive';
    return matchesSearch;
  });

  const activeCount = patients.filter(p => (p.status || 'active') === 'active').length;
  const inactiveCount = patients.filter(p => p.status === 'inactive').length;

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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('Patient Directory', 'ספר מטופלים')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('View, search, and manage patient records in the system.', 'צפה, חפש ונהל תיקי מטופלים במערכת.')}</p>
        </div>

        {/* Action Buttons: Add Patient & Export */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button 
            onClick={handleExportCsv}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
          >
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span>{t('Export CSV', 'ייצא לקובץ CSV')}</span>
          </button>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            <span>{t('Add New Patient', 'הוסף מטופל חדש')}</span>
          </button>
        </div>
      </div>

      {/* Main Full-Width Card Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Filter Bar: Status Tabs & Search */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Active / Inactive Tabs */}
          <div className="flex bg-slate-200/60 p-1 rounded-xl shrink-0 self-start">
            <button
              onClick={() => setStatusFilter('active')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'active' 
                  ? 'bg-white text-emerald-700 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{t('Active Patients', 'לקוחות פעילים')}</span>
              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full text-[10px]">{activeCount}</span>
            </button>

            <button
              onClick={() => setStatusFilter('inactive')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'inactive' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>{t('Inactive Patients', 'לקוחות לא פעילים')}</span>
              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">{inactiveCount}</span>
            </button>

            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{t('All', 'הכל')} ({patients.length})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <input 
              type="text" 
              placeholder={t('Search by name or phone...', 'חיפוש לפי שם או טלפון...')} 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full ps-4 pe-10 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-start" 
            />
            <svg className="w-4 h-4 text-slate-400 absolute end-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        {/* Patients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-6 font-semibold text-start">{t('Full Name', 'שם מלא')}</th>
                <th className="py-3.5 px-6 font-semibold text-start">{t('Email', 'אימייל')}</th>
                <th className="py-3.5 px-6 font-semibold text-start">{t('Phone', 'טלפון')}</th>
                <th className="py-3.5 px-6 font-semibold text-start">{t('Status', 'סטטוס')}</th>
                <th className="py-3.5 px-6 font-semibold text-center">{t('Actions', 'פעולות')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map(patient => (
                <tr 
                  key={patient.id} 
                  onClick={() => onSelectPatient && onSelectPatient(patient)}
                  className="hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                >
                  <td className="py-4 px-6 text-sm font-semibold text-slate-800 text-start group-hover:text-emerald-600 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center border border-emerald-200">
                        {patient.full_name.charAt(0)}
                      </div>
                      <span>{patient.full_name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500 text-start">{patient.email || '-'}</td>
                  <td className="py-4 px-6 text-sm text-slate-600 text-start font-medium" dir="ltr">{patient.phone}</td>
                  <td className="py-4 px-6 text-start">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      (patient.status || 'active') === 'active' 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ (patient.status || 'active') === 'active' ? 'bg-emerald-500' : 'bg-slate-400' }`}></span>
                      {(patient.status || 'active') === 'active' ? t('Active', 'פעיל') : t('Inactive', 'לא פעיל')}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className="text-xs font-bold text-emerald-600 group-hover:underline flex items-center justify-center gap-1">
                      <span>{t('View Card', 'פתח כרטיסייה')}</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                    </span>
                  </td>
                </tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 text-sm">
                    {t('No patients found matching the selected criteria.', 'לא נמצאו מטופלים תואמים לפילטר שנבחר.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Adding New Patient */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden text-start">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                  {t('Add New Patient', 'הוספת מטופל חדש למערכת')}
                </h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              <form onSubmit={handlePatientSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">{t('Full Name', 'שם מלא')}</label>
                  <input 
                    type="text" 
                    value={patientForm.full_name} 
                    onChange={e => setPatientForm({...patientForm, full_name: e.target.value})} 
                    required 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-start text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">{t('Email', 'אימייל')}</label>
                  <input 
                    type="email" 
                    value={patientForm.email} 
                    onChange={e => setPatientForm({...patientForm, email: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-start text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">{t('Phone', 'טלפון')}</label>
                  <input 
                    type="tel" 
                    value={patientForm.phone} 
                    onChange={e => setPatientForm({...patientForm, phone: e.target.value})} 
                    required 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-end text-sm" 
                    dir="ltr" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">{t('Initial Status', 'סטטוס ראשוני')}</label>
                  <select 
                    value={patientForm.status} 
                    onChange={e => setPatientForm({...patientForm, status: e.target.value})} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-start text-sm"
                  >
                    <option value="active">{t('Active', 'פעיל')}</option>
                    <option value="inactive">{t('Inactive', 'לא פעיל')}</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setIsAddModalOpen(false)}
                    className="w-1/2 py-2.5 border border-slate-200 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
                  >
                    {t('Cancel', 'ביטול')}
                  </button>
                  <button 
                    type="submit" 
                    className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                  >
                    {t('Save Patient', 'שמור מטופל')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDirectory;
