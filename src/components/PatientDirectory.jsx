import React, { useContext, useState, useMemo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getSortedRowModel, 
  getFilteredRowModel, 
  flexRender 
} from '@tanstack/react-table';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const PatientDirectory = ({ onSelectPatient }) => {
  const { patients, addPatient } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);
  
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [statusFilter, setStatusFilter] = useState('active');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Patient Form State
  const [newPatientForm, setNewPatientForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    status: 'active'
  });

  const handlePatientSubmit = (e) => {
    e.preventDefault();
    if (!newPatientForm.full_name || !newPatientForm.phone) {
      alert(t('Please enter full name and phone number.', 'אנא מלא שם מלא ומספר טלפון.'));
      return;
    }
    addPatient(newPatientForm);
    setNewPatientForm({ full_name: '', email: '', phone: '', status: 'active' });
    setIsAddModalOpen(false);
  };

  // Filter patients by active status tab
  const filteredData = useMemo(() => {
    return patients.filter(patient => {
      if (statusFilter === 'all') return true;
      return (patient.status || 'active') === statusFilter;
    });
  }, [patients, statusFilter]);

  // TanStack Table Column Definitions
  const columns = useMemo(() => [
    {
      accessorKey: 'full_name',
      header: t('Full Name', 'שם מלא'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
            {row.original.full_name ? row.original.full_name.charAt(0) : 'P'}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{row.original.full_name}</p>
            <p className="text-[10px] text-slate-400 font-mono">{row.original.id ? row.original.id.substring(0, 8) : ''}</p>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'phone',
      header: t('Phone', 'טלפון'),
      cell: ({ row }) => (
        <span className="font-medium text-slate-700 text-xs" dir="ltr">{row.original.phone || '-'}</span>
      )
    },
    {
      accessorKey: 'email',
      header: t('Email', 'אימייל'),
      cell: ({ row }) => (
        <span className="text-slate-500 text-xs font-normal">{row.original.email || '-'}</span>
      )
    },
    {
      accessorKey: 'status',
      header: t('Status', 'סטטוס'),
      cell: ({ row }) => {
        const isAct = (row.original.status || 'active') === 'active';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            isAct ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
          }`}>
            {isAct ? t('Active', 'פעיל') : t('Inactive', 'לא פעיל')}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="text-end">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectPatient) onSelectPatient(row.original);
            }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg border border-emerald-200 transition-colors"
          >
            {t('View File', 'פתח תיק')}
          </button>
        </div>
      )
    }
  ], [t, onSelectPatient]);

  // TanStack Table React Hook
  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-6 text-start">
      
      {/* Top Action Bar & Filter Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:px-6 sm:py-5 rounded-2xl border border-slate-100 shadow-sm">
        
        {/* Status Filter Tabs */}
        <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shrink-0">
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'active' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('Active Patients', 'מטופלים פעילים')} ({patients.filter(p => (p.status || 'active') === 'active').length})
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t('All Patients', 'כל המטופלים')} ({patients.length})
          </button>
        </div>

        {/* Search Input & Add Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input 
              type="text"
              placeholder={t('Search patient name, phone...', 'חיפוש לפי שם, טלפון...')}
              value={globalFilter ?? ''}
              onChange={e => setGlobalFilter(e.target.value)}
              className="w-full ps-9 pe-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
            <svg className="w-4 h-4 text-slate-400 absolute start-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl shadow-xs transition-colors flex items-center gap-2 text-xs shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
            {t('Add Patient', 'הוסף מטופל')}
          </button>
        </div>

      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="bg-slate-50 border-b border-slate-200/60">
                  {headerGroup.headers.map(header => (
                    <th 
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className="py-3.5 px-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-start cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted()] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-12 text-center text-sm text-slate-400 font-medium">
                    {t('No patients found matching your query.', 'לא נמצאו מטופלים התואמים את החיפוש.')}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr 
                    key={row.id}
                    onClick={() => onSelectPatient && onSelectPatient(row.original)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="py-4 px-6">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden text-start">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800">
                  {t('Add New Patient', 'הוספת מטופל חדש למערכת')}
                </h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handlePatientSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">{t('Full Name', 'שם מלא')} *</label>
                  <input 
                    type="text" 
                    required
                    value={newPatientForm.full_name}
                    onChange={e => setNewPatientForm({ ...newPatientForm, full_name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none text-start text-sm" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">{t('Email', 'אימייל')}</label>
                  <input 
                    type="email" 
                    value={newPatientForm.email}
                    onChange={e => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none text-start text-sm" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">{t('Phone', 'טלפון')} *</label>
                  <input 
                    type="tel" 
                    required
                    value={newPatientForm.phone}
                    onChange={e => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none text-end text-sm" 
                    dir="ltr" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">{t('Initial Status', 'סטטוס ראשוני')}</label>
                  <select 
                    value={newPatientForm.status}
                    onChange={e => setNewPatientForm({ ...newPatientForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none text-start text-sm"
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
                    className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
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
