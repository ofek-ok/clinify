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
    people,
    patients, 
    services, 
    appointments, 
    addAppointment, 
    updateAppointmentStatus,
    addPayment, 
    addTask,
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
    status: 'scheduled',
    notes: ''
  });

  const [sessionCompletionModal, setSessionCompletionModal] = useState({
    isOpen: false,
    appointment: null,
    recordPaymentNow: true,
    amount: '',
    payment_method: 'Credit Card',
    createFollowupTask: false,
    followupTaskTitle: '',
    followupDueDate: ''
  });

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    
    if (!appointmentForm.patient_id || !appointmentForm.service_id || !appointmentForm.appointment_date || !appointmentForm.appointment_time) {
      alert(t("Please fill in all required fields.", "אנא מלא את כל השדות الנדרשים."));
      return;
    }

    const dateTimeStr = `${appointmentForm.appointment_date}T${appointmentForm.appointment_time}`;
    
    if (isWithinBusinessHours && !isWithinBusinessHours(dateTimeStr)) {
      alert(t("Selected time is outside of business hours. Please select another time.", "זמן התור שנבחר נמצא מחוץ לשעות הפעילות."));
      return;
    }

    const service = services.find(s => String(s.id) === String(appointmentForm.service_id));
    const duration = service ? service.duration_minutes : 30;

    if (isTimeSlotAvailable && !isTimeSlotAvailable(dateTimeStr, duration)) {
      alert(t("Time slot conflicts with an existing appointment.", "זמן התור מתנגש עם תור קיים."));
      return;
    }

    const selectedPatient = patients.find(p => String(p.id) === String(appointmentForm.patient_id));

    await addAppointment({
      patient_id: appointmentForm.patient_id,
      person_id: selectedPatient ? selectedPatient.person_id : null,
      service_id: appointmentForm.service_id,
      appointment_date: dateTimeStr,
      status: appointmentForm.status,
      notes: appointmentForm.notes || null
    });

    setAppointmentForm({ patient_id: '', service_id: '', appointment_date: '', appointment_time: '', status: 'scheduled', notes: '' });
  };

  const openCompletionModal = (appt) => {
    const service = services.find(s => String(s.id) === String(appt.service_id));
    const patient = patients.find(p => String(p.id) === String(appt.patient_id));
    const person = people.find(p => String(p.id) === String(appt.person_id)) || (patient ? people.find(p => String(p.id) === String(patient.person_id)) : null);

    const defaultTitle = person ? `מעקב לאחר מפגש עם ${person.full_name}` : `מעקב טיפול`;
    const defaultDate = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

    setSessionCompletionModal({
      isOpen: true,
      appointment: appt,
      recordPaymentNow: true,
      amount: service ? service.default_price : 0,
      payment_method: 'Credit Card',
      createFollowupTask: true,
      followupTaskTitle: defaultTitle,
      followupDueDate: defaultDate
    });
  };

  const handleCompleteSessionSubmit = async (e) => {
    e.preventDefault();
    const { appointment, recordPaymentNow, amount, payment_method, createFollowupTask, followupTaskTitle, followupDueDate } = sessionCompletionModal;
    if (!appointment) return;

    // 1. Update status to completed
    await updateAppointmentStatus(appointment.id, 'completed');

    // 2. Add Payment if requested
    if (recordPaymentNow && amount) {
      await addPayment({
        appointment_id: appointment.id,
        patient_id: appointment.patient_id || null,
        person_id: appointment.person_id || null,
        amount: parseFloat(amount),
        payment_method: payment_method,
        status: 'paid'
      });
    }

    // 3. Add Follow-up Task if requested
    if (createFollowupTask && followupTaskTitle) {
      await addTask({
        title: followupTaskTitle,
        due_date: followupDueDate || new Date().toISOString().split('T')[0],
        status: 'todo',
        priority: 'high',
        area: 'clinical',
        person_id: appointment.person_id || null,
        patient_id: appointment.patient_id || null
      });
    }

    setSessionCompletionModal({ isOpen: false, appointment: null, recordPaymentNow: true, amount: '', payment_method: 'Credit Card', createFollowupTask: false, followupTaskTitle: '', followupDueDate: '' });
  };

  const activePatients = patients.filter(p => (p.status || 'active') === 'active');

  const translateStatus = (status) => {
    const statusMap = {
      'scheduled': t('Scheduled', 'נקבע'),
      'confirmed': t('Confirmed', 'אושר'),
      'completed': t('Completed', 'הושלם'),
      'cancelled': t('Cancelled', 'בוטל'),
      'no_show': t('No Show', 'אי הופעה'),
      'rescheduled': t('Rescheduled', 'הוזז')
    };
    return statusMap[status] || status;
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'appointment_date',
      header: () => t('Date & Time', 'תאריך ושעה'),
      cell: ({ getValue }) => {
        const dateObj = new Date(getValue());
        return (
          <div>
            <p className="font-bold text-slate-800 text-xs">{dateObj.toLocaleDateString('he-IL')}</p>
            <p className="text-[11px] text-slate-400 font-medium">{dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
          </div>
        );
      },
    },
    {
      accessorKey: 'patient_id',
      header: () => t('Patient Name', 'שם המטופל'),
      cell: ({ getValue }) => <span className="font-bold text-slate-800 text-xs">{getPatientName(getValue())}</span>,
    },
    {
      accessorKey: 'service_id',
      header: () => t('Treatment Service', 'שירות טיפול'),
      cell: ({ getValue }) => <span className="text-slate-600 text-xs font-medium">{getServiceName(getValue())}</span>,
    },
    {
      accessorKey: 'status',
      header: () => t('Status', 'סטטוס תור'),
      cell: ({ row, getValue }) => {
        const status = getValue();
        let statusBadge = status === 'completed' 
          ? "bg-emerald-100 text-emerald-800" 
          : status === 'cancelled' 
          ? "bg-rose-100 text-rose-800 font-bold" 
          : status === 'confirmed'
          ? "bg-blue-100 text-blue-800"
          : status === 'no_show'
          ? "bg-purple-100 text-purple-800"
          : status === 'rescheduled'
          ? "bg-orange-100 text-orange-800"
          : "bg-amber-100 text-amber-800";

        return (
          <select 
            value={status} 
            onChange={(e) => updateAppointmentStatus(row.original.id, e.target.value)}
            className={`px-2 py-1 rounded text-[11px] font-bold outline-none cursor-pointer ${statusBadge}`}
          >
            <option value="scheduled">{t('Scheduled', 'נקבע')}</option>
            <option value="confirmed">{t('Confirmed', 'אושר')}</option>
            <option value="completed">{t('Completed', 'הושלם')}</option>
            <option value="rescheduled">{t('Rescheduled', 'הוזז')}</option>
            <option value="no_show">{t('No Show', 'אי הופעה')}</option>
            <option value="cancelled">{t('Cancelled', 'בוטל')}</option>
          </select>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-center">{t('Actions', 'פעולות')}</div>,
      cell: ({ row }) => {
        const appt = row.original;
        const isDone = appt.status === 'completed';
        return (
          <div className="text-center flex items-center justify-center gap-2">
            {!isDone && (
              <button 
                onClick={() => openCompletionModal(appt)}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-all"
              >
                {t('Complete & Bill', 'סיים מפגש וגבה תשלום')}
              </button>
            )}
            {isDone && (
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                ✓ {t('Completed', 'מפגש הושלם')}
              </span>
            )}
          </div>
        );
      },
    },
  ], [getPatientName, getServiceName, updateAppointmentStatus, t]);

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
      {/* Session Completion & Billing Modal */}
      {sessionCompletionModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-bold text-base">{t('Complete Session & Record Operation', 'סיום מפגש ורישום תשלום')}</h3>
                <p className="text-xs text-slate-300">
                  {getPatientName(sessionCompletionModal.appointment?.patient_id)} • {getServiceName(sessionCompletionModal.appointment?.service_id)}
                </p>
              </div>
              <button onClick={() => setSessionCompletionModal({ isOpen: false, appointment: null })} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleCompleteSessionSubmit} className="p-6 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 font-medium">
                💡 <b>{t('Automatic Customer Conversion', 'המרה אוטומטית ללקוח')}:</b> {t('Completing session and receiving payment will automatically update client status to Customer and mark Lead as Won.', 'סיום המפגש וגביית תשלום ימירו את סטטוס הלקוח ל-Customer ואת הליד ל-Won.')}
              </div>

              {/* Payment Section */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t('Payment Record', 'גביית תשלום')}</span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={sessionCompletionModal.recordPaymentNow} 
                      onChange={e => setSessionCompletionModal({ ...sessionCompletionModal, recordPaymentNow: e.target.checked })} 
                      className="rounded text-slate-900 focus:ring-slate-500"
                    />
                    {t('Record payment now', 'רשום תשלום כעת')}
                  </label>
                </div>

                {sessionCompletionModal.recordPaymentNow && (
                  <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('Amount (₪)', 'סכום (₪)')}</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={sessionCompletionModal.amount} 
                        onChange={e => setSessionCompletionModal({ ...sessionCompletionModal, amount: e.target.value })} 
                        required 
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('Method', 'אמצעי תשלום')}</label>
                      <select 
                        value={sessionCompletionModal.payment_method} 
                        onChange={e => setSessionCompletionModal({ ...sessionCompletionModal, payment_method: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="Credit Card">{t('Credit Card', 'כרטיס אשראי')}</option>
                        <option value="Cash">{t('Cash', 'מזומן')}</option>
                        <option value="Bank Transfer">{t('Bank Transfer', 'העברה בנקאית')}</option>
                        <option value="Bit">Bit / Paybox</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Follow-up Task Section */}
              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t('Follow-up Task', 'משימת מעקב לקוח')}</span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={sessionCompletionModal.createFollowupTask} 
                      onChange={e => setSessionCompletionModal({ ...sessionCompletionModal, createFollowupTask: e.target.checked })} 
                      className="rounded text-slate-900 focus:ring-slate-500"
                    />
                    {t('Create follow-up task', 'צור משימת מעקב')}
                  </label>
                </div>

                {sessionCompletionModal.createFollowupTask && (
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('Task Title', 'כותרת המשימה')}</label>
                      <input 
                        type="text" 
                        value={sessionCompletionModal.followupTaskTitle} 
                        onChange={e => setSessionCompletionModal({ ...sessionCompletionModal, followupTaskTitle: e.target.value })} 
                        required 
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" 
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">{t('Due Date', 'יעד לביצוע')}</label>
                      <input 
                        type="date" 
                        value={sessionCompletionModal.followupDueDate} 
                        onChange={e => setSessionCompletionModal({ ...sessionCompletionModal, followupDueDate: e.target.value })} 
                        required 
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" 
                      />
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors text-xs mt-3">
                {t('Confirm Session Completion', 'אישור סיום מפגש וביצוע פעולות')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex justify-between items-end flex-wrap gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{t('Appointment Manager', 'ניהול תורים ומפגשים')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('Schedule new appointments and manage client sessions.', 'קבע תורים חדשים, נהל מפגשים וסדרות טיפול.')}</p>
        </div>
      </div>
      
      {/* Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Form Box */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden h-max sticky top-6">
            <h3 className="text-base font-bold mb-4 text-slate-800">
              {t('New Appointment', 'קביעת תור חדש')}
            </h3>
            
            <form onSubmit={handleAppointmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 text-start">{t('Patient', 'מטופל')}</label>
                <select value={appointmentForm.patient_id} onChange={e => setAppointmentForm({...appointmentForm, patient_id: e.target.value})} required 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none text-start text-xs">
                  <option value="">{t('Select patient...', 'בחר מטופל...')}</option>
                  {activePatients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name || getPatientName(p.id)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 text-start">{t('Service', 'שירות מטרה')}</label>
                <select value={appointmentForm.service_id} onChange={e => setAppointmentForm({...appointmentForm, service_id: e.target.value})} required 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none text-start text-xs">
                  <option value="">{t('Select service...', 'בחר סוג טיפול...')}</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} {t('min', 'דק')}')</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 text-start">{t('Initial Status', 'סטטוס ראשוני')}</label>
                <select value={appointmentForm.status} onChange={e => setAppointmentForm({...appointmentForm, status: e.target.value})} 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none text-start text-xs">
                  <option value="scheduled">{t('Scheduled', 'נקבע')}</option>
                  <option value="confirmed">{t('Confirmed', 'אושר')}</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 text-start">{t('Date', 'תאריך')}</label>
                  <input type="date" value={appointmentForm.appointment_date} onChange={e => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})} required 
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1 text-start">{t('Time', 'שעה')}</label>
                  <input type="time" value={appointmentForm.appointment_time} onChange={e => setAppointmentForm({...appointmentForm, appointment_time: e.target.value})} required 
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none text-xs" />
                </div>
              </div>

              <button type="submit" disabled={activePatients.length === 0 || services.length === 0} className="w-full mt-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98] text-xs">
                {t('Save Appointment', 'שמור תור')}
              </button>
            </form>
          </div>
        </div>
        
        {/* Table Box */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-xs">{t('All Appointments', 'כל התורים')} ({appointments.length})</h3>
              
              {/* Search */}
              <div className="relative w-64">
                <input 
                  type="text" 
                  placeholder={t('Search appointments...', 'חיפוש חופשי בתורים...')} 
                  value={globalFilter ?? ''} 
                  onChange={e => setGlobalFilter(e.target.value)} 
                  className="w-full ps-3 pe-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-slate-400" 
                />
                <svg className="w-3.5 h-3.5 text-slate-400 absolute end-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                      {headerGroup.headers.map(header => (
                        <th 
                          key={header.id} 
                          onClick={header.column.getToggleSortingHandler()}
                          className={`py-3.5 px-6 font-semibold cursor-pointer select-none text-start hover:text-slate-800 transition-colors ${
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
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
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
