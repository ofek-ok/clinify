import React, { useState, useContext, useMemo } from 'react';
import { ClinicContext } from '../context/ClinicContext';
import { LanguageContext } from '../context/LanguageContext';

const PublicBookingView = () => {
  const { 
    services = [], 
    bookingSettings = {}, 
    getAvailableSlotsForDate, 
    addAppointment, 
    addLead, 
    patients = [],
    patientPackages = [],
    redeemPackageSession
  } = useContext(ClinicContext);
  
  const { t } = useContext(LanguageContext);

  const [step, setStep] = useState(1); // 1: Service, 2: Date/Slot, 3: Patient Info, 4: Confirmation
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  
  const [patientInfo, setPatientInfo] = useState({
    phone: '',
    fullName: '',
    email: '',
    notes: '',
    acceptedTerms: false,
    usePackage: false,
    selectedPackageId: ''
  });

  const [existingPatient, setExistingPatient] = useState(null);
  const [activePackage, setActivePackage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedAppointment, setCompletedAppointment] = useState(null);

  // Available slots calculation
  const availableSlots = useMemo(() => {
    if (!selectedDate || !selectedService) return [];
    return getAvailableSlotsForDate(selectedDate, selectedService.duration_minutes || 30);
  }, [selectedDate, selectedService, getAvailableSlotsForDate]);

  // Handle phone blur to check for existing patient and active package
  const handlePhoneBlur = () => {
    if (!patientInfo.phone) return;
    const cleanPhone = patientInfo.phone.trim();
    const found = patients.find(p => p.phone && p.phone.trim() === cleanPhone);
    
    if (found) {
      setExistingPatient(found);
      if (found.full_name && !patientInfo.fullName) {
        setPatientInfo(prev => ({ ...prev, fullName: found.full_name, email: found.email || prev.email }));
      }
      // Check active package
      const pkg = patientPackages.find(p => p.patient_id === found.id && p.remaining_sessions > 0);
      if (pkg) {
        setActivePackage(pkg);
        setPatientInfo(prev => ({ ...prev, usePackage: true, selectedPackageId: pkg.id }));
      } else {
        setActivePackage(null);
      }
    } else {
      setExistingPatient(null);
      setActivePackage(null);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (bookingSettings.requirePolicy && !patientInfo.acceptedTerms) {
      alert(t('Please accept the cancellation policy to proceed.', 'אנא אישור את מדיניות הביטולים כדי להמשיך.'));
      return;
    }
    if (!selectedService || !selectedDate || !selectedSlot) {
      alert(t('Please complete slot selection.', 'אנא השלם את בחירת המועד.'));
      return;
    }

    setIsSubmitting(true);
    try {
      let patientId = existingPatient ? existingPatient.id : null;

      // If new patient, create a Lead record automatically
      if (!existingPatient) {
        const newLead = await addLead({
          full_name: patientInfo.fullName,
          phone: patientInfo.phone,
          email: patientInfo.email || null,
          source: 'Public Self-Booking',
          status: 'new'
        });
        if (newLead) patientId = newLead.id;
      }

      // If patient selected to redeem session credit
      if (patientInfo.usePackage && activePackage) {
        await redeemPackageSession(activePackage.id);
      }

      // Create Appointment
      const apptDateIso = `${selectedDate}T${selectedSlot}:00`;
      const newAppt = await addAppointment({
        patient_id: patientId,
        service_id: selectedService.id,
        appointment_date: apptDateIso,
        notes: patientInfo.notes || (patientInfo.usePackage ? 'Self-booked via package credit' : 'Self-booked via online portal'),
        status: 'scheduled',
        source: patientInfo.usePackage ? 'package_redemption' : 'public_booking'
      });

      setCompletedAppointment(newAppt || { appointment_date: apptDateIso });
      setStep(4);
    } catch (err) {
      console.error(err);
      alert(t('Error completing booking. Please try again.', 'שגיאה ברישום התור. אנא נסה שנית.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google Calendar Export Link
  const googleCalendarUrl = useMemo(() => {
    if (!selectedService || !selectedDate || !selectedSlot) return '#';
    const startStr = `${selectedDate.replace(/-/g, '')}T${selectedSlot.replace(':', '')}00`;
    const dtEnd = new Date(new Date(`${selectedDate}T${selectedSlot}:00`).getTime() + (selectedService.duration_minutes || 30) * 60000);
    const endStr = `${dtEnd.toISOString().split('T')[0].replace(/-/g, '')}T${dtEnd.toTimeString().substring(0, 5).replace(':', '')}00`;
    
    const title = encodeURIComponent(`${selectedService.name} - Clinify`);
    const details = encodeURIComponent(bookingSettings.clinicAddress || 'Clinify Clinic');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${details}`;
  }, [selectedService, selectedDate, selectedSlot, bookingSettings]);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-start font-sans">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Brand & Clinic Header */}
        <div className="text-center bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-md shrink-0">
            {bookingSettings.logoUrl ? (
              <img src={bookingSettings.logoUrl} alt="Clinic Logo" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-900 flex items-center justify-center text-sky-400 font-extrabold text-xl">C</div>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Clinify</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1.5 font-medium max-w-md mx-auto">
            {bookingSettings.welcomeMessage || t('Online Appointment Booking Portal', 'פורטל זימון תורים עצמאי לקליניקה')}
          </p>
          {bookingSettings.clinicAddress && (
            <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
              {bookingSettings.clinicAddress}
            </span>
          )}
        </div>

        {/* STEP 1: Select Service */}
        {step === 1 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">{t('Step 1: Choose a Treatment / Service', 'שלב 1: בחר טיפול או שירות')}</h2>
              <span className="text-xs font-bold text-slate-400">1 / 3</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {services.map(svc => (
                <div 
                  key={svc.id}
                  onClick={() => {
                    setSelectedService(svc);
                    setStep(2);
                  }}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center group ${
                    selectedService?.id === svc.id 
                      ? 'border-emerald-500 bg-emerald-50/30 shadow-sm' 
                      : 'border-slate-100 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-slate-800 text-base group-hover:text-emerald-700 transition-colors">{svc.name}</h3>
                    {svc.description && <p className="text-xs text-slate-500 line-clamp-1">{svc.description}</p>}
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400 pt-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      {svc.duration_minutes || 30} {t('minutes', 'דקות')}
                    </span>
                  </div>
                  <div className="text-end shrink-0">
                    <span className="text-xl font-black text-slate-800" dir="ltr">₪{svc.default_price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Select Date & Time Slot */}
        {step === 2 && (
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-700 transition-colors">
                  <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">{t('Step 2: Select Date & Open Time Slot', 'שלב 2: בחר תאריך ושעה פנויה')}</h2>
                  <p className="text-xs text-emerald-600 font-bold mt-0.5">{selectedService?.name} ({selectedService?.duration_minutes} דק')</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400">2 / 3</span>
            </div>

            {/* Date Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{t('Select Appointment Date', 'בחר תאריך לטיפול')}</label>
              <input 
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={e => {
                  setSelectedDate(e.target.value);
                  setSelectedSlot('');
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>

            {/* Time Slot Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">{t('Available Time Slots', 'חלונות זמן פנויים בזמן אמת')}</label>
              {availableSlots.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm font-medium">
                  {t('No available slots for this date. Please pick another date.', 'אין תורים פנויים בתאריך שנבחר. אנא בחר תאריך אחר.')}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {availableSlots.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-3 rounded-xl text-sm font-black transition-all border ${
                        selectedSlot === slot
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.03]'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedSlot && (
              <button 
                onClick={() => setStep(3)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition-all text-sm mt-4"
              >
                {t('Continue to Confirmation', 'המשך להזנת פרטים')}
              </button>
            )}
          </div>
        )}

        {/* STEP 3: Patient Info & Confirmation */}
        {step === 3 && (
          <form onSubmit={handleBookingSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setStep(2)} className="text-slate-400 hover:text-slate-700 transition-colors">
                  <svg className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                </button>
                <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">{t('Step 3: Your Personal Details', 'שלב 3: הזנת פרטי המטופל')}</h2>
              </div>
              <span className="text-xs font-bold text-slate-400">3 / 3</span>
            </div>

            {/* Selected Summary Card */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-xs text-emerald-400 font-bold">{selectedService?.name}</p>
                <p className="text-sm font-black text-white mt-0.5">{selectedDate} ({selectedSlot})</p>
              </div>
              <span className="text-lg font-black text-white" dir="ltr">
                {patientInfo.usePackage ? '₪0 (מכרטיסייה)' : `₪${selectedService?.default_price}`}
              </span>
            </div>

            {/* Patient Inputs */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Phone Number', 'מספר טלפון')} *</label>
                <input 
                  type="tel"
                  required
                  placeholder="050-0000000"
                  value={patientInfo.phone}
                  onChange={e => setPatientInfo({ ...patientInfo, phone: e.target.value })}
                  onBlur={handlePhoneBlur}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              {/* Package Banner & Checkbox if active package found */}
              {existingPatient && activePackage && bookingSettings.allowPackages && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-extrabold text-sm text-amber-900">🎟️ {t('Active Package Found!', 'שלום ' + existingPatient.full_name + ', נמצאה כרטיסייה פעילה!')}</p>
                      <p className="text-xs text-amber-700 mt-0.5">{activePackage.name} — נותרו {activePackage.remaining_sessions} מתוך {activePackage.total_sessions} טיפולים</p>
                    </div>
                    <span className="bg-amber-600 text-white font-black px-2.5 py-1 rounded-md text-[10px] uppercase">
                      {activePackage.remaining_sessions} {t('Left', 'נותרו')}
                    </span>
                  </div>

                  <label className="flex items-center gap-2.5 pt-2 border-t border-amber-200/80 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={patientInfo.usePackage}
                      onChange={e => setPatientInfo({ ...patientInfo, usePackage: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                    />
                    <span className="text-xs font-bold text-amber-900">
                      {t('Deduct 1 session credit from active package (Pay ₪0 now)', 'נכה 1 טיפול מהכרטיסייה (תשלום: ₪0 במעמד הזימון)')}
                    </span>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Full Name', 'שם מלא')} *</label>
                <input 
                  type="text"
                  required
                  value={patientInfo.fullName}
                  onChange={e => setPatientInfo({ ...patientInfo, fullName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Email Address (Optional)', 'כתובת אימייל (אופציונלי)')}</label>
                <input 
                  type="email"
                  value={patientInfo.email}
                  onChange={e => setPatientInfo({ ...patientInfo, email: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t('Notes for Therapist (Optional)', 'הערות למטפל/ת (אופציונלי)')}</label>
                <textarea 
                  rows="2"
                  value={patientInfo.notes}
                  onChange={e => setPatientInfo({ ...patientInfo, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none"
                />
              </div>

              {/* Cancellation Policy Acceptance Checkbox */}
              {bookingSettings.requirePolicy && (
                <label className="flex items-start gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input 
                    type="checkbox"
                    required
                    checked={patientInfo.acceptedTerms}
                    onChange={e => setPatientInfo({ ...patientInfo, acceptedTerms: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 mt-0.5"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed font-medium">
                    {t('I agree to the cancellation policy: ', 'אני מאשר/ת את מדיניות הביטולים: ')} 
                    <strong className="text-slate-800">{bookingSettings.cancellationPolicyText}</strong>
                  </span>
                </label>
              )}
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl shadow-md transition-all text-sm flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>{patientInfo.usePackage ? t('Confirm Package Redemption & Booking', 'אישור זימון ומימוש טיפול מהכרטיסייה (₪0)') : t('Confirm & Complete Booking', 'אישור וקביעת תור')}</span>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: Success & Export to Calendar */}
        {step === 4 && (
          <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-md text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('Appointment Confirmed!', 'התור נקבע בהצלחה!')}</h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1 font-medium">{t('We look forward to seeing you at the clinic.', 'התור נרשם ביומן הקליניקה. נשמח לראותך!')}</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-start space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-400 font-bold">{t('Service', 'שירות/טיפול')}:</span>
                <span className="font-extrabold text-slate-800">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200/60 pb-2">
                <span className="text-slate-400 font-bold">{t('Date & Time', 'תאריך ושעה')}:</span>
                <span className="font-black text-emerald-700">{selectedDate} ({selectedSlot})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">{t('Patient', 'מטופל/ת')}:</span>
                <span className="font-bold text-slate-800">{patientInfo.fullName} ({patientInfo.phone})</span>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="space-y-3 pt-2">
              <a 
                href={googleCalendarUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                {t('Add to Google Calendar', 'הוסף ליומן Google Calendar')}
              </a>

              <button 
                onClick={() => {
                  setStep(1);
                  setSelectedService(null);
                  setSelectedDate('');
                  setSelectedSlot('');
                  setPatientInfo({ phone: '', fullName: '', email: '', notes: '', acceptedTerms: false, usePackage: false, selectedPackageId: '' });
                }}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold underline"
              >
                {t('Book Another Appointment', 'קבע תור נוסף')}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default PublicBookingView;
