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

const AppointmentManager = () => {
  const { 
    patients, 
    services, 
    appointments, 
    addAppointment, 
    addPayment, 
    getPatientName, 
    getServiceName, 
    isTimeSlotAvailable, 
    isWithinBusinessHours 
  } = useContext(ClinicContext);

  const { t } = useContext(LanguageContext);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);

  const [appointmentForm, setAppointmentForm] = useState({
    patient_id: '',
    service_id: '',
    appointment_date: '',
    appointment_time: '',
    status: 'scheduled'
  });

  const [paymentForm, setPaymentForm] = useState({
    appointment_id: null,
    amount: '',
    payment_method: 'Credit Card'
  });

  const handleAppointmentSubmit = (e) => {
    e.preventDefault();
    
    if (!appointmentForm.patient_id || !appointmentForm.service_id || !appointmentForm.appointment_date || !appointmentForm.appointment_time) {
      alert(t("Please fill in all required fields.", "אנא מלא את כל השדות הנדרשים."));
      return;
    }

    const dateTimeStr = `${appointmentForm.appointment_date}T${appointmentForm.appointment_time}`;
    
    if (!isWithinBusinessHours(dateTimeStr)) {
      alert(t("Selected time is outside of business hours. Please select another time or update business hours in Settings.", "זמן התור שנבחר נמצא מחוץ לשעות הפעילות של הקליניקה. אנא בחר זמן אחר או עדכן את שעות הפעילות בהגדרות."));
      return;
    }

    const service = services.find(s => s.id === appointmentForm.service_id);
    const duration = service ? service.duration_minutes : 30;

    if (!isTimeSlotAvailable(dateTimeStr, duration)) {
      alert(t("Time slot conflicts with an existing appointment.", "זמן התור מתנגש עם תור קיים. אנא בחר שעה אחרת."));
      return;
    }

    addAppointment({
      patient_id: appointmentForm.patient_id,
      service_id: appointmentForm.service_id,
      appointment_date: dateTimeStr,
      status: appointmentForm.status
    });

    setAppointmentForm({ patient_id: '', service_id: '', appointment_date: '', appointment_time: '', status: 'scheduled' });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if(paymentForm.appointment_id) {
      addPayment({
        appointment_id: paymentForm.appointment_id,
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        status: 'paid'
      });
      setPaymentForm({ appointment_id: null, amount: '', payment_method: 'Credit Card' });
      alert(t("Payment recorded successfully!", "תשלום נרשם בהצלחה!"));
    }
  };

  const openPaymentModal = (appt) => {
    const service = services.find(s => s.id === appt.service_id);
    setPaymentForm({
      appointment_id: appt.id,
      amount: service ? service.default_price : 0,
      payment_method: 'Credit Card'
    });
  };

  const activePatients = patients.filter(p => (p.status || 'active') === 'active');

  const translateStatus = (status) => {
    const statusMap = {
      'scheduled': t('Scheduled', 'נקבע'),
      'completed': t('Completed', 'הושלם'),
      'cancelled': t('Cancelled', 'בוטל')
    };
    return statusMap[status] || status;
  };

  // TanStack Table Column Definitions
  const columns = useMemo(() => [
    {
      accessorKey: 'appointment_date',
      header: () => t('Date & Time', 'תאריך ושעה'),
      cell: ({ getValue }) => {
        const dateObj = new Date(getValue());
        return (
          <div>
            <p className="font-extrabold text-slate-900 text-xs">{dateObj.toLocaleDateString('he-IL')}</p>
            <p className="text-[10px] text-slate-400 font-medium">{dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'patient_id',
      header: () => t('Patient Name', 'שם המטופל'),
      cell: ({ getValue }) => <span className="font-bold text-slate-900">{getPatientName(getValue())}</span>,
    },
    {
      accessorKey: 'service_id',
      header: () => t('Treatment Service', 'שירות טיפול'),
      cell: ({ getValue }) => <span className="text-slate-600 text-xs font-medium">{getServiceName(getValue())}</span>,
    },
    {
      accessorKey: 'status',
      header: () => t('Status', 'סטטוס תור'),
      cell: ({ getValue }) => {
        const status = getValue();
        let statusBadge = status === 'completed' 
          ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
          : status === 'cancelled' 
          ? "bg-rose-100 text-rose-800 border-rose-200" 
          : "bg-amber-100 text-amber-800 border-amber-200";

        return (
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusBadge}`}>
            {translateStatus(status)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-center">{t('Actions', 'פעולות')}</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <button 
            onClick={() => openPaymentModal(row.original)}
            className="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl shadow-sm transition-all"
          >
            {t('Record Payment', 'הזן תשלום')}
          </button>
        </div>
      ),
    },
  ], [getPatientName, getServiceName, t]);

  const table = useReactTable({
    data: appointments,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="animate-in fade-in duration-500 space-y-6 relative text-start">
      {/* Payment Modal */}
      {paymentForm.appointment_id && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-5 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">{t('Record Payment', 'רישום תשלום לתור')}</h3>
              <button onClick={() => setPaymentForm({ appointment_id: null, amount: '', payment_method: 'Credit Card'})} className="text-teal-100 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 text-start">{t('Amount to Pay (₪)', 'סכום לתשלום (₪)')}</label>
                <input type="number" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} required 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-start text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 text-start">{t('Payment Method', 'אמצעי תשלום')}</label>
                <select value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-start text-sm font-medium">
                  <option value="Credit Card">{t('Credit Card', 'כרטיס אשראי')}</option>
                  <option value="Cash">{t('Cash', 'מזומן')}</option>
                  <option value="Bank Transfer">{t('Bank Transfer', 'העברה בנקאית')}</option>
                  <option value="Bit">Bit / Paybox</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-xl shadow-md transition-colors text-xs mt-2">
                {t('Confirm Payment', 'אשר תשלום')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex justify-between items-end flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('Appointment Manager', 'ניהול תורים')}</h2>
            <span className="text-[10px] font-black bg-cyan-100 text-cyan-800 px-2.5 py-0.5 rounded-full border border-cyan-200">
              TanStack Table Powered
            </span>
          </div>
          <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">{t('Schedule new appointments and manage the clinic calendar.', 'קבע תורים חדשים ונהל את לוח הזמנים של הקליניקה בזמן אמת.')}</p>
        </div>
      </div>
      
      {/* Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Form Box */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 rounded-3xl relative overflow-hidden h-max sticky top-6">
            <div className="absolute top-0 end-0 w-full h-1 bg-gradient-to-s from-teal-400 to-emerald-500"></div>
            <h3 className="text-base font-extrabold mb-5 text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              {t('New Appointment', 'קביעת תור חדש')}
            </h3>
            
            <form onSubmit={handleAppointmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 text-start">{t('Patient', 'מטופל')}</label>
                <select value={appointmentForm.patient_id} onChange={e => setAppointmentForm({...appointmentForm, patient_id: e.target.value})} required 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-start text-xs font-medium">
                  <option value="">{t('Select patient...', 'בחר מטופל...')}</option>
                  {activePatients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 text-start">{t('Service', 'שירות מטרה')}</label>
                <select value={appointmentForm.service_id} onChange={e => setAppointmentForm({...appointmentForm, service_id: e.target.value})} required 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-start text-xs font-medium">
                  <option value="">{t('Select service...', 'בחר סוג טיפול...')}</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} {t('min', 'דק')}')</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 text-start">{t('Date', 'תאריך')}</label>
                  <input type="date" value={appointmentForm.appointment_date} onChange={e => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})} required 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-xs font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 text-start">{t('Time', 'שעה')}</label>
                  <input type="time" value={appointmentForm.appointment_time} onChange={e => setAppointmentForm({...appointmentForm, appointment_time: e.target.value})} required 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-xs font-medium" />
                </div>
              </div>

              <button type="submit" disabled={activePatients.length === 0 || services.length === 0} className="w-full mt-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white font-extrabold py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-[0.98] text-xs">
                {t('Save Appointment', 'שמור תור')}
              </button>
            </form>
          </div>
        </div>
        
        {/* Table Box */}
        <div className="lg:col-span-3">
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-extrabold text-slate-800 text-xs tracking-tight">{t('All Appointments', 'כל התורים')} ({appointments.length})</h3>
              
              {/* TanStack Table Search */}
              <div className="relative w-64">
                <input 
                  type="text" 
                  placeholder={t('Search appointments...', 'חיפוש חופשי בתורים...')} 
                  value={globalFilter ?? ''} 
                  onChange={e => setGlobalFilter(e.target.value)} 
                  className="w-full ps-3 pe-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-cyan-500/20" 
                />
                <svg className="w-3.5 h-3.5 text-slate-400 absolute end-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} className="bg-slate-50/80 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                      {headerGroup.headers.map(header => (
                        <th 
                          key={header.id} 
                          onClick={header.column.getToggleSortingHandler()}
                          className={`py-3.5 px-6 font-extrabold cursor-pointer select-none text-start hover:text-slate-800 transition-colors ${
                            header.id === 'actions' ? 'text-center' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1">
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
                <tbody className="divide-y divide-slate-100 text-sm">
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="py-4 px-6">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {table.getRowModel().rows.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className="py-12 text-center text-slate-400 text-xs font-medium">
                        {t('No appointments found.', 'לא נמצאו תורים תואמים.')}
                      </td>
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

export default AppointmentManager;
