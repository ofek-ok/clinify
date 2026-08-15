import React, { useContext, useState } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const AppointmentManager = () => {
  const { patients, services, appointments, addAppointment, addPayment, getPatientName, getServiceName, isTimeSlotAvailable, isWithinBusinessHours } = useContext(ClinicContext);
  const { t } = useContext(LanguageContext);
  
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

  const activePatients = patients.filter(p => p.status === 'active');

  const translateStatus = (status) => {
    const statusMap = {
      'scheduled': t('Scheduled', 'נקבע'),
      'completed': t('Completed', 'הושלם'),
      'cancelled': t('Cancelled', 'בוטל')
    };
    return statusMap[status] || status;
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-6 relative text-start">
      {/* Payment Modal Overlay */}
      {paymentForm.appointment_id && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-teal-500 p-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">{t('Record Payment', 'רישום תשלום לתור')}</h3>
              <button onClick={() => setPaymentForm({ appointment_id: null, amount: '', payment_method: 'Credit Card'})} className="text-teal-100 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Amount to Pay (₪)', 'סכום לתשלום (₪)')}</label>
                <input type="number" step="0.01" value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} required 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-start" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Payment Method', 'אמצעי תשלום')}</label>
                <select value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-start">
                  <option value="Credit Card">{t('Credit Card', 'כרטיס אשראי')}</option>
                  <option value="Cash">{t('Cash', 'מזומן')}</option>
                  <option value="Bank Transfer">{t('Bank Transfer', 'העברה בנקאית')}</option>
                  <option value="Bit">Bit / Paybox</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors mt-2">
                {t('Confirm Payment', 'אשר תשלום')}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex justify-between items-end flex-wrap gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('Appointment Manager', 'ניהול תורים')}</h2>
          <p className="text-slate-500 text-sm mt-1">{t('Schedule new appointments and manage the clinic calendar.', 'קבע תורים חדשים ונהל את לוח הזמנים של הקליניקה.')}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100/50 relative overflow-hidden h-max sticky top-6">
            <div className="absolute top-0 end-0 w-full h-1 bg-gradient-to-s from-teal-400 to-emerald-500"></div>
            <h3 className="text-lg font-semibold mb-5 text-slate-700 flex items-center gap-2">
              <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
              {t('New Appointment', 'קביעת תור חדש')}
            </h3>
            
            <form onSubmit={handleAppointmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Patient', 'מטופל')}</label>
                <select value={appointmentForm.patient_id} onChange={e => setAppointmentForm({...appointmentForm, patient_id: e.target.value})} required 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all cursor-pointer text-start">
                  <option value="">{t('Select patient...', 'בחר מטופל...')}</option>
                  {activePatients.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
                {activePatients.length === 0 && <p className="text-[10px] text-rose-500 mt-1 text-start">{t('No active patients found.', 'לא נמצאו מטופלים פעילים.')}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Service', 'שירות מטרה')}</label>
                <select value={appointmentForm.service_id} onChange={e => setAppointmentForm({...appointmentForm, service_id: e.target.value})} required 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all cursor-pointer text-start">
                  <option value="">{t('Select service...', 'בחר סוג טיפול...')}</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} {t('min', 'דק')}')</option>
                  ))}
                </select>
                {services.length === 0 && <p className="text-[10px] text-rose-500 mt-1 text-start">{t('No services defined.', 'לא הוגדרו שירותים.')}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Date', 'תאריך')}</label>
                  <input type="date" value={appointmentForm.appointment_date} onChange={e => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})} required 
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm text-start" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 text-start">{t('Time', 'שעה')}</label>
                  <input type="time" value={appointmentForm.appointment_time} onChange={e => setAppointmentForm({...appointmentForm, appointment_time: e.target.value})} required 
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm text-start" />
                </div>
              </div>

              <button type="submit" disabled={activePatients.length === 0 || services.length === 0} className="w-full mt-2 bg-gradient-to-e from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-xl transition-all shadow-md active:scale-[0.98]">
                {t('Save Appointment', 'שמור תור')}
              </button>
            </form>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-700">{t('All Appointments', 'כל התורים')}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-6 font-semibold text-start">{t('Date & Time', 'תאריך ושעה')}</th>
                    <th className="py-3 px-6 font-semibold text-start">{t('Patient', 'מטופל')}</th>
                    <th className="py-3 px-6 font-semibold text-start">{t('Service', 'שירות')}</th>
                    <th className="py-3 px-6 font-semibold text-start">{t('Status', 'סטטוס תור')}</th>
                    <th className="py-3 px-6 font-semibold text-start">{t('Actions', 'פעולות')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {appointments.sort((a,b) => new Date(b.appointment_date) - new Date(a.appointment_date)).map(appt => {
                    const dateObj = new Date(appt.appointment_date);
                    const isPast = dateObj < new Date();
                    let statusColor = appt.status === 'completed' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : appt.status === 'cancelled' ? "bg-rose-100 text-rose-700 border-rose-200" : "bg-amber-100 text-amber-700 border-amber-200";
                    
                    return (
                      <tr key={appt.id} className={`transition-colors ${isPast && appt.status === 'scheduled' ? 'bg-rose-50/30' : 'hover:bg-slate-50/50'}`}>
                        <td className="py-4 px-6 text-start">
                          <p className="font-bold text-slate-800 text-sm">{dateObj.toLocaleDateString()}</p>
                          <p className="text-xs text-slate-500 font-medium">{dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-700 text-sm text-start">{getPatientName(appt.patient_id)}</td>
                        <td className="py-4 px-6 text-sm text-slate-600 text-start">{getServiceName(appt.service_id)}</td>
                        <td className="py-4 px-6 text-start">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
                            {translateStatus(appt.status)}
                          </span>
                          {isPast && appt.status === 'scheduled' && <p className="text-[10px] text-rose-500 mt-1 font-semibold">{t('Past due - Update', 'תור בעבר - דורש עדכון')}</p>}
                        </td>
                        <td className="py-4 px-6 text-start">
                          <button onClick={() => openPaymentModal(appt)} className="text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 px-3 py-1.5 rounded-lg shadow-sm transition-colors">
                            {t('Record Payment', 'הזן תשלום')}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                  {appointments.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-12 text-center text-slate-400 text-sm">{t('No appointments scheduled yet.', 'לא נקבעו תורים עדיין.')}</td>
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
