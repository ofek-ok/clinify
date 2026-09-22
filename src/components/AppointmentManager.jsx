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
import { useToast } from './ui/Toast';

const BUSINESS_TIME_ZONE = 'Asia/Jerusalem';

const getIsraelDateKey = (value = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(value instanceof Date ? value : new Date(value));
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return map.year + '-' + map.month + '-' + map.day;
};

const getIsraelOffsetString = (dateStr) => {
  const probe = new Date(dateStr + 'T12:00:00Z');
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
  }).formatToParts(probe);
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const asUtc = Date.UTC(Number(map.year), Number(map.month)-1, Number(map.day), Number(map.hour), Number(map.minute), Number(map.second));
  const offsetMinutes = Math.round((asUtc - probe.getTime()) / 60000);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  return sign + String(Math.floor(absolute / 60)).padStart(2,'0') + ':' + String(absolute % 60).padStart(2,'0');
};

const buildIsraelIsoTimestamp = (dateStr, timeStr) => dateStr + 'T' + timeStr + ':00' + getIsraelOffsetString(dateStr);

const AppointmentManager = () => {
  const { 
    people,
    patients,
    leads, 
    services, 
    appointments, 
    addAppointment, 
    updateAppointmentStatus,
    deleteAppointment,
    addPayment, 
    addTask,
    getPatientName,
    getPersonName,
    getServiceName,
    getAvailableSlotsForDate,
    isTimeSlotAvailable,
    isWithinBusinessHours 
  } = useContext(ClinicContext);

  const { t } = useContext(LanguageContext);
  const { showToast } = useToast();
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [deletingAppointmentId, setDeletingAppointmentId] = useState(null);

  const [appointmentForm, setAppointmentForm] = useState({
    person_id: '',
    service_id: '',
    appointment_date: '',
    appointment_time: '',
    status: 'scheduled',
    notes: ''
  });

  const selectedService = useMemo(
    () => services.find(service => String(service.id) === String(appointmentForm.service_id)) || null,
    [services, appointmentForm.service_id]
  );

  const availableSlots = useMemo(() => {
    if (!appointmentForm.appointment_date || !selectedService) return [];
    return getAvailableSlotsForDate(
      appointmentForm.appointment_date,
      Number(selectedService.duration_minutes || 30)
    );
  }, [appointmentForm.appointment_date, selectedService, getAvailableSlotsForDate]);

  React.useEffect(() => {
    if (!appointmentForm.service_id || !appointmentForm.appointment_date) return;

    setAppointmentForm(prev => {
      if (availableSlots.length === 0) {
        return prev.appointment_time ? { ...prev, appointment_time: '' } : prev;
      }

      if (!prev.appointment_time || !availableSlots.includes(prev.appointment_time)) {
        return { ...prev, appointment_time: availableSlots[0] };
      }

      return prev;
    });
  }, [appointmentForm.service_id, appointmentForm.appointment_date, availableSlots]);

  const getAppointmentPersonName = (appt) =>
    getPersonName(appt?.person_id) ||
    getPatientName(appt?.patient_id) ||
    t('Client', 'לקוח');

  const [sessionCompletionModal, setSessionCompletionModal] = useState({
    isOpen: false,
    appointment: null,
    recordPaymentNow: true,
    amount: '',
    payment_method: 'PayBox',
    createFollowupTask: false,
    followupTaskTitle: '',
    followupDueDate: ''
  });

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    
    if (!appointmentForm.person_id || !appointmentForm.service_id || !appointmentForm.appointment_date || !appointmentForm.appointment_time) {
      showToast(t('Please fill in all required fields.', 'אנא מלא את כל השדות הנדרשים.'), 'error');
      return;
    }

    const service = selectedService;
    const duration = Number(service?.duration_minutes || 30);
    const dateTimeStr = buildIsraelIsoTimestamp(appointmentForm.appointment_date, appointmentForm.appointment_time);

    if (isWithinBusinessHours && !isWithinBusinessHours(dateTimeStr, duration)) {
      showToast(t('Selected time is outside of business hours. Please select another time.', 'זמן התור שנבחר נמצא מחוץ לשעות הפעילות.'), 'error');
      return;
    }

    if (isTimeSlotAvailable && !isTimeSlotAvailable(dateTimeStr, duration)) {
      showToast(t('Time slot conflicts with an existing appointment.', 'זמן התור מתנגש עם תור קיים.'), 'error');
      return;
    }

    const selectedPatient = patients.find(p => String(p.person_id) === String(appointmentForm.person_id));

    try {
      await addAppointment({
        patient_id: selectedPatient?.id || null,
        person_id: appointmentForm.person_id,
        service_id: appointmentForm.service_id,
        appointment_date: dateTimeStr,
        status: appointmentForm.status,
        notes: appointmentForm.notes || null
      });

      showToast(t('Appointment saved.', 'התור נשמר בהצלחה'));
      setAppointmentForm({ person_id: '', service_id: '', appointment_date: '', appointment_time: '', status: 'scheduled', notes: '' });
    } catch (err) {
      showToast(err.message || t('Could not save appointment.', 'לא ניתן היה לשמור את התור.'), 'error');
    }
  };

  const openCompletionModal = (appt) => {
    const service = services.find(s => String(s.id) === String(appt.service_id));
    const patient = patients.find(p => String(p.id) === String(appt.patient_id));
    const person = people.find(p => String(p.id) === String(appt.person_id)) || (patient ? people.find(p => String(p.id) === String(patient.person_id)) : null);

    const defaultTitle = person ? `מעקב לאחר מפגש עם ${person.full_name}` : `מעקב טיפול`;
    const defaultDate = getIsraelDateKey(new Date(Date.now() + 86400000 * 3));

    setSessionCompletionModal({
      isOpen: true,
      appointment: appt,
      recordPaymentNow: true,
      amount: service ? service.default_price : 0,
      payment_method: 'PayBox',
      createFollowupTask: true,
      followupTaskTitle: defaultTitle,
      followupDueDate: defaultDate
    });
  };

  const handleCompleteSessionSubmit = async (e) => {
    e.preventDefault();
    const { appointment, recordPaymentNow, amount, payment_method, createFollowupTask, followupTaskTitle, followupDueDate } = sessionCompletionModal;
    if (!appointment) return;

    try {
      await updateAppointmentStatus(appointment.id, 'completed');

      if (recordPaymentNow && amount) {
        await addPayment({
          appointment_id: appointment.id,
          patient_id: appointment.patient_id || null,
          person_id: appointment.person_id || null,
          amount: parseFloat(amount),
          payment_method,
          status: 'paid'
        });
      }

      if (createFollowupTask && followupTaskTitle) {
        await addTask({
          title: followupTaskTitle,
          due_date: followupDueDate || getIsraelDateKey(),
          status: 'todo',
          priority: 'high',
          area: 'clinical',
          person_id: appointment.person_id || null,
          patient_id: appointment.patient_id || null
        });
      }

      showToast(t('Session completed.', 'המפגש הושלם בהצלחה'));
      setSessionCompletionModal({ isOpen: false, appointment: null, recordPaymentNow: true, amount: '', payment_method: 'PayBox', createFollowupTask: false, followupTaskTitle: '', followupDueDate: '' });
    } catch (err) {
      showToast(err.message || t('Could not complete session.', 'לא ניתן היה להשלים את המפגש.'), 'error');
    }
  };

  const bookablePeople = people.filter(person => {
    if (person.client_status === 'customer') return true;
    const lead = leads?.find?.(item => item.person_id === person.id);
    return lead && lead.status !== 'lost' && lead.status !== 'won';
  });

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

  const handleDeleteAppointment = async (appt) => {
    const clientName = getAppointmentPersonName(appt);
    const confirmed = window.confirm(`להעביר את התור של ${clientName} לאשפה? ניתן יהיה לשחזר אותו בהמשך.`);
    if (!confirmed) return;

    setDeletingAppointmentId(appt.id);
    try {
      await deleteAppointment(appt.id);
      showToast(t('Appointment moved to trash.', 'התור הועבר לאשפה'));
    } catch (err) {
      showToast(err.message || t('Could not delete appointment.', 'לא ניתן למחוק את התור.'), 'error');
    } finally {
      setDeletingAppointmentId(null);
    }
  };

  const columns = useMemo(() => [
    {
      accessorKey: 'appointment_date',
      header: () => t('Date & Time', 'תאריך ושעה'),
      cell: ({ getValue }) => {
        const dateObj = new Date(getValue());
        return (
          <div>
            <p className="font-bold text-slate-800 text-xs">{dateObj.toLocaleDateString('he-IL', { timeZone: BUSINESS_TIME_ZONE })}</p>
            <p className="text-[11px] text-slate-400 font-medium">{dateObj.toLocaleTimeString('he-IL', { timeZone: BUSINESS_TIME_ZONE, hour: '2-digit', minute:'2-digit' })}</p>
          </div>
        );
      },
    },
    {
      id: 'client_name',
      header: () => t('Client Name', 'שם הלקוח'),
      accessorFn: row => getAppointmentPersonName(row),
      cell: ({ row }) => <span className="font-bold text-slate-800 text-xs">{getAppointmentPersonName(row.original)}</span>,
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
            onChange={async (e) => {
              try {
                await updateAppointmentStatus(row.original.id, e.target.value);
                showToast(t('Appointment status updated.', 'סטטוס התור עודכן'));
              } catch (err) {
                showToast(err.message || t('Could not update appointment status.', 'לא ניתן לעדכן את סטטוס התור.'), 'error');
              }
            }}
            className={`px-2 py-1 rounded text-[11px] font-bold outline-none cursor-pointer ${statusBadge}`}
          >
            <option value="scheduled">{t('Scheduled', 'נקבע')}</option>
            <option value="confirmed">{t('Confirmed', 'אושר')}</option>
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
            <button
              type="button"
              disabled={deletingAppointmentId === appt.id}
              onClick={() => handleDeleteAppointment(appt)}
              className="text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-all disabled:opacity-50"
            >
              {deletingAppointmentId === appt.id ? t('Deleting...', 'מוחק...') : t('Delete', 'מחיקה')}
            </button>
          </div>
        );
      },
    },
  ], [getAppointmentPersonName, getServiceName, updateAppointmentStatus, showToast, t, deletingAppointmentId, deleteAppointment]);

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
                  {getAppointmentPersonName(sessionCompletionModal.appointment)} • {getServiceName(sessionCompletionModal.appointment?.service_id)}
                </p>
              </div>
              <button onClick={() => setSessionCompletionModal({ isOpen: false, appointment: null })} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleCompleteSessionSubmit} className="p-6 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 font-medium">
                <b>{t('Automatic Customer Conversion', 'המרה אוטומטית ללקוח')}:</b> {t('Completing the session and recording payment will update the CRM relationship when eligible.', 'סיום המפגש ורישום תשלום יעדכנו את סטטוס ה-CRM כאשר תנאי ההמרה מתקיימים.')}
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
                        <option value="PayBox">PayBox</option>
                        <option value="תשלום במקום">{t('Pay on site', 'תשלום במקום')}</option>
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
                <select value={appointmentForm.person_id} onChange={e => setAppointmentForm({...appointmentForm, person_id: e.target.value})} required 
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none text-start text-xs">
                  <option value="">{t('Select client or lead...', 'בחר לקוח או ליד...')}</option>
                  {bookablePeople.map(person => (
                    <option key={person.id} value={person.id}>{person.full_name}</option>
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
                  <select
                    value={appointmentForm.appointment_time}
                    onChange={e => setAppointmentForm({...appointmentForm, appointment_time: e.target.value})}
                    required
                    disabled={!appointmentForm.service_id || !appointmentForm.appointment_date || availableSlots.length === 0}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none text-xs disabled:opacity-60"
                  >
                    {availableSlots.length === 0 ? (
                      <option value="">אין שעות פנויות</option>
                    ) : (
                      availableSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)
                    )}
                  </select>
                </div>
              </div>

              <button type="submit" disabled={bookablePeople.length === 0 || services.length === 0} className="w-full mt-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm active:scale-[0.98] text-xs">
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
                              asc: ' ↑',
                              desc: ' ↓',
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
