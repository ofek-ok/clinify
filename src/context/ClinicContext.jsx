import React, { createContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';

export const ClinicContext = createContext();

export const ClinicProvider = ({ children }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [patientPackages, setPatientPackages] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [forms, setForms] = useState([]);
  const [formSubmissions, setFormSubmissions] = useState([]);

  // Configurable Public Self-Booking Settings
  const [bookingSettings, setBookingSettings] = useState({
    allowPackages: true,
    allowPayAtClinic: true,
    requirePolicy: true,
    cancellationPolicyText: 'ביטול תור יתאפשר עד 24 שעות מראש.',
    welcomeMessage: 'ברוכים הבאים לעמוד זימון התורים הציבורי. אנא בחרו שירות ומועד נוח.',
    clinicAddress: '',
    logoUrl: ''
  });
  
  const [businessHours, setBusinessHours] = useState([
    { dayIndex: 0, dayOfWeek: 'Sunday', isOpen: false, startTime: '09:00', endTime: '17:00' },
    { dayIndex: 1, dayOfWeek: 'Monday', isOpen: true, startTime: '09:00', endTime: '17:00' },
    { dayIndex: 2, dayOfWeek: 'Tuesday', isOpen: true, startTime: '09:00', endTime: '17:00' },
    { dayIndex: 3, dayOfWeek: 'Wednesday', isOpen: true, startTime: '09:00', endTime: '17:00' },
    { dayIndex: 4, dayOfWeek: 'Thursday', isOpen: true, startTime: '09:00', endTime: '17:00' },
    { dayIndex: 5, dayOfWeek: 'Friday', isOpen: true, startTime: '09:00', endTime: '14:00' },
    { dayIndex: 6, dayOfWeek: 'Saturday', isOpen: false, startTime: '09:00', endTime: '13:00' },
  ]);

  // Supabase Auth State Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ONLY fetch complete internal CRM dataset when an authenticated user session exists!
  useEffect(() => {
    if (session) {
      fetchInitialData();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [
        patientsRes, servicesRes, appointmentsRes, leadsRes, 
        tasksRes, paymentsRes, formsRes, formSubRes, expensesRes, bookingSetRes, packagesRes, hoursRes
      ] = await Promise.all([
        supabase.from('patients').select('*'),
        supabase.from('services').select('*'),
        supabase.from('appointments').select('*'),
        supabase.from('leads').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('forms').select('*'),
        supabase.from('form_submissions').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('booking_settings').select('*').maybeSingle(),
        supabase.from('patient_packages').select('*'),
        supabase.from('business_hours').select('*')
      ]);

      if (patientsRes.data) setPatients(patientsRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
      if (appointmentsRes.data) setAppointments(appointmentsRes.data);
      if (leadsRes.data) setLeads(leadsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
      if (formsRes.data) setForms(formsRes.data);
      if (formSubRes.data) setFormSubmissions(formSubRes.data);
      if (expensesRes.data) setExpenses(expensesRes.data);
      if (packagesRes.data) setPatientPackages(packagesRes.data);
      if (bookingSetRes.data) setBookingSettings(prev => ({ ...prev, ...bookingSetRes.data }));
      if (hoursRes.data && hoursRes.data.length > 0) {
        setBusinessHours(hoursRes.data.map(h => ({
          dayIndex: h.day_index,
          dayOfWeek: h.day_of_week,
          isOpen: h.is_open,
          startTime: h.start_time,
          endTime: h.end_time
        })));
      }
    } catch (error) {
      console.error("Error fetching internal CRM data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setPatients([]);
    setAppointments([]);
    setLeads([]);
    setTasks([]);
    setPayments([]);
    setExpenses([]);
  };

  const updateBookingSettings = async (updates) => {
    const next = { ...bookingSettings, ...updates };
    const { error } = await supabase.from('booking_settings').upsert({ id: 'default', ...next });
    if (error) {
      console.error("Error updating booking settings:", error);
      throw error;
    }
    setBookingSettings(next);
  };

  const addPatient = async (patient) => {
    const { data, error } = await supabase.from('patients').insert([patient]).select();
    if (error) {
      console.error("Error adding patient to database:", error);
      throw error;
    }
    if (data && data[0]) {
      setPatients(prev => [...prev, data[0]]);
      return data[0];
    }
    return null;
  };

  const addService = async (service) => {
    const payload = {
      name: service.name,
      description: service.description,
      duration_minutes: parseInt(service.duration_minutes || 0),
      default_price: parseFloat(service.default_price || 0),
      type: service.type || 'service',
      session_count: service.session_count ? parseInt(service.session_count) : null
    };
    const { data, error } = await supabase.from('services').insert([payload]).select();
    if (error) {
      console.error("Error adding service:", error);
      throw error;
    }
    if (data && data[0]) {
      setServices(prev => [...prev, data[0]]);
      return data[0];
    }
    return null;
  };

  const updateService = async (serviceId, updates) => {
    const { data, error } = await supabase.from('services').update(updates).eq('id', serviceId).select();
    if (error) {
      console.error("Error updating service:", error);
      throw error;
    }
    if (data && data[0]) {
      setServices(prev => prev.map(s => s.id === serviceId ? data[0] : s));
    }
  };

  const deleteService = async (serviceId) => {
    const { error } = await supabase.from('services').delete().eq('id', serviceId);
    if (error) {
      console.error("Error deleting service:", error);
      throw error;
    }
    setServices(prev => prev.filter(s => s.id !== serviceId));
  };

  // Issue Package to Patient
  const issuePackageToPatient = async (patientId, catalogItem) => {
    const newPkg = {
      patient_id: patientId,
      name: catalogItem.name,
      total_sessions: catalogItem.session_count || 10,
      remaining_sessions: catalogItem.session_count || 10,
      purchased_date: todayStr
    };
    const { data, error } = await supabase.from('patient_packages').insert([newPkg]).select();
    if (error) {
      console.error("Error issuing package:", error);
      throw error;
    }
    if (data && data[0]) {
      setPatientPackages(prev => [...prev, data[0]]);
      return data[0];
    }
    return null;
  };

  // Redeem / Deduct Session from Patient Package
  const redeemPackageSession = async (packageId) => {
    const targetPkg = patientPackages.find(p => p.id === packageId);
    if (!targetPkg || targetPkg.remaining_sessions <= 0) return;

    const { error } = await supabase.rpc('redeem_package_session', { p_package_id: packageId });
    if (error) {
      console.error("Error redeeming package session:", error);
      throw error;
    }
    
    setPatientPackages(prev => prev.map(pkg => {
      if (pkg.id === packageId && pkg.remaining_sessions > 0) {
        return { ...pkg, remaining_sessions: pkg.remaining_sessions - 1 };
      }
      return pkg;
    }));
  };

  const addAppointment = async (appt) => {
    const { data, error } = await supabase.from('appointments').insert([appt]).select();
    if (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }
    if (data && data[0]) {
      setAppointments(prev => [...prev, data[0]]);
      return data[0];
    }
    return null;
  };

  // Update Appointment Status with Automatic Package Deduction on Completion
  const updateAppointmentStatus = async (apptId, newStatus) => {
    const appt = appointments.find(a => a.id === apptId);
    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', apptId);
    if (error) {
      console.error("Error updating appointment status:", error);
      throw error;
    }
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: newStatus } : a));

    // Auto-deduct 1 session if marked completed and patient has an active package!
    if (newStatus === 'completed' && appt?.patient_id) {
      const activePkg = patientPackages.find(p => p.patient_id === appt.patient_id && p.remaining_sessions > 0);
      if (activePkg) {
        await redeemPackageSession(activePkg.id);
      }
    }
  };

  const addLead = async (lead) => {
    const { data, error } = await supabase.from('leads').insert([lead]).select();
    if (error) {
      console.error("Error creating lead:", error);
      throw error;
    }
    if (data && data[0]) {
      setLeads(prev => [...prev, data[0]]);
      return data[0];
    }
    return null;
  };

  const addTask = async (task) => {
    const payload = { ...task };
    if (!payload.patient_id) delete payload.patient_id;
    const { data, error } = await supabase.from('tasks').insert([payload]).select();
    if (error) {
      console.error("Error creating task:", error);
      throw error;
    }
    if (data && data[0]) {
      setTasks(prev => [...prev, data[0]]);
      return data[0];
    }
    return null;
  };

  const addPayment = async (payment) => {
    const payload = {
      ...payment,
      payment_date: payment.payment_date || new Date().toISOString()
    };
    const { data, error } = await supabase.from('payments').insert([payload]).select();
    if (error) {
      console.error("Error adding payment:", error);
      throw error;
    }
    if (data && data[0]) {
      setPayments(prev => [...prev, data[0]]);
      
      // If a package item was bought for a patient, auto-issue it!
      if (payment.item_type === 'package' && payment.patient_id) {
        const catalogItem = services.find(s => s.id === payment.catalog_item_id) || { name: 'כרטיסיית טיפולים', session_count: 10 };
        await issuePackageToPatient(payment.patient_id, catalogItem);
      }
      return data[0];
    }
    return null;
  };

  const updatePayment = async (paymentId, updates) => {
    const { data, error } = await supabase.from('payments').update(updates).eq('id', paymentId).select();
    if (error) {
      console.error("Error updating payment:", error);
      throw error;
    }
    if (data && data[0]) {
      setPayments(prev => prev.map(p => p.id === paymentId ? data[0] : p));
    }
  };

  const deletePayment = async (paymentId) => {
    const { error } = await supabase.from('payments').delete().eq('id', paymentId);
    if (error) {
      console.error("Error deleting payment:", error);
      throw error;
    }
    setPayments(prev => prev.filter(p => p.id !== paymentId));
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    const { error } = await supabase.from('payments').update({ status: newStatus }).eq('id', paymentId);
    if (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
    setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: newStatus } : p));
  };

  // Expenses API
  const addExpense = async (expense) => {
    const payload = {
      title: expense.title,
      category: expense.category,
      amount: parseFloat(expense.amount),
      payment_method: expense.payment_method,
      expense_date: expense.expense_date || todayStr
    };
    const { data, error } = await supabase.from('expenses').insert([payload]).select();
    if (error) {
      console.error("Error adding expense:", error);
      throw error;
    }
    if (data && data[0]) {
      setExpenses(prev => [...prev, data[0]]);
      return data[0];
    }
    return null;
  };

  const updateExpense = async (expenseId, updates) => {
    const { data, error } = await supabase.from('expenses').update(updates).eq('id', expenseId).select();
    if (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
    if (data && data[0]) {
      setExpenses(prev => prev.map(e => e.id === expenseId ? data[0] : e));
    }
  };

  const deleteExpense = async (expenseId) => {
    const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
    if (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };

  // Forms API
  const addForm = async (form) => {
    const { data, error } = await supabase.from('forms').insert([form]).select();
    if (error) {
      console.error("Error creating form:", error);
      throw error;
    }
    if (data && data[0]) {
      setForms(prev => [...prev, data[0]]);
      return data[0];
    }
    return null;
  };

  const updateForm = async (formId, updates) => {
    const { data, error } = await supabase.from('forms').update(updates).eq('id', formId).select();
    if (error) {
      console.error("Error updating form:", error);
      throw error;
    }
    if (data && data[0]) {
      setForms(prev => prev.map(f => f.id === formId ? data[0] : f));
    }
  };

  const addFormSubmission = async (submission) => {
    const { data, error } = await supabase.from('form_submissions').insert([submission]).select();
    if (error) {
      console.error("Error submitting form:", error);
      throw error;
    }
    if (data && data[0]) {
      setFormSubmissions(prev => [...prev, data[0]]);
      return data[0];
    }
    return null;
  };

  // Updates
  const updateLeadStatus = async (leadId, newStatus) => {
    const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    if (error) {
      console.error("Error updating lead status:", error);
      throw error;
    }
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (error) {
      console.error("Error updating task status:", error);
      throw error;
    }
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const updateBusinessHour = async (dayOfWeek, updates) => {
    const target = businessHours.find(bh => bh.dayOfWeek === dayOfWeek);
    if (target) {
      const updated = { ...target, ...updates };
      await supabase.from('business_hours').upsert({
        day_index: updated.dayIndex,
        day_of_week: updated.dayOfWeek,
        is_open: updated.isOpen,
        start_time: updated.startTime,
        end_time: updated.endTime
      });
      setBusinessHours(prev => prev.map(bh => bh.dayOfWeek === dayOfWeek ? updated : bh));
    }
  };

  const getPatientName = (patientId) => {
    if (!patientId) return '';
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.full_name : '';
  };
  const getServiceName = (serviceId) => {
    const svc = services.find(s => s.id === serviceId);
    return svc ? svc.name : '';
  };
  const getPaymentForAppointment = (apptId) => payments.find(p => p.appointment_id === apptId);

  const isWithinBusinessHours = (dateTimeStr) => {
    if (!dateTimeStr) return false;
    const dt = new Date(dateTimeStr);
    const dayName = dt.toLocaleDateString('en-US', { weekday: 'long' });
    const hours = businessHours.find(h => h.dayOfWeek === dayName);
    
    if (!hours || !hours.isOpen) return false;
    
    const timeStr = dt.toTimeString().substring(0, 5);
    return timeStr >= hours.startTime && timeStr < hours.endTime;
  };

  const isTimeSlotAvailable = (dateTimeStr, durationMinutes) => {
    const dt = new Date(dateTimeStr);
    const endTime = new Date(dt.getTime() + durationMinutes * 60000);
    
    return !appointments.some(appt => {
      if(appt.status === 'cancelled') return false;
      const apptStart = new Date(appt.appointment_date);
      const service = services.find(s => s.id === appt.service_id);
      const apptDuration = service ? service.duration_minutes : 30;
      const apptEnd = new Date(apptStart.getTime() + apptDuration * 60000);
      
      return (dt < apptEnd && endTime > apptStart);
    });
  };

  const getAvailableSlotsForDate = (dateStr, durationMinutes = 30) => {
    if (!dateStr) return [];
    const dt = new Date(dateStr);
    const dayName = dt.toLocaleDateString('en-US', { weekday: 'long' });
    const hours = businessHours.find(h => h.dayOfWeek === dayName);

    if (!hours || !hours.isOpen) return [];

    const slots = [];
    let current = new Date(`${dateStr}T${hours.startTime}:00`);
    const end = new Date(`${dateStr}T${hours.endTime}:00`);

    while (current.getTime() + durationMinutes * 60000 <= end.getTime()) {
      const timeDisplay = current.toTimeString().substring(0, 5);
      const available = isTimeSlotAvailable(current.toISOString().split('T')[0] + 'T' + timeDisplay, durationMinutes);
      if (available) {
        slots.push(timeDisplay);
      }
      current = new Date(current.getTime() + 30 * 60000);
    }
    return slots;
  };

  const tasksDueToday = useMemo(() => tasks.filter(t => t.due_date === todayStr && t.status !== 'done'), [tasks, todayStr]);
  const revenueThisMonth = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return payments
      .filter(p => p.status === 'paid' && new Date(p.payment_date).getMonth() === currentMonth && new Date(p.payment_date).getFullYear() === currentYear)
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  }, [payments]);

  // Patient CRM functions
  const updatePatient = async (patientId, updates) => {
    const { data, error } = await supabase.from('patients').update(updates).eq('id', patientId).select();
    if (error) {
      console.error("Error updating patient:", error);
      throw error;
    }
    if (data && data[0]) {
      setPatients(prev => prev.map(p => p.id === patientId ? data[0] : p));
      return data[0];
    }
    return null;
  };

  const addClinicalNote = async (patientId, noteText, author = null) => {
    const defaultAuthor = author || user?.user_metadata?.full_name || 'מטפל/ת';
    const newNote = {
      patient_id: patientId,
      author: defaultAuthor,
      content: noteText,
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('patient_clinical_notes').insert([newNote]).select();
    if (error) {
      console.error("Error adding clinical note:", error);
      throw error;
    }
    if (data && data[0]) {
      setPatients(prev => prev.map(p => {
        if (p.id === patientId) {
          const notes = p.clinical_notes || [];
          return { ...p, clinical_notes: [data[0], ...notes] };
        }
        return p;
      }));
      return data[0];
    }
    return null;
  };

  const addPatientDocument = async (patientId, docName, docUrl = '#') => {
    const newDoc = {
      patient_id: patientId,
      name: docName,
      file_url: docUrl,
      file_size: '1.2 MB',
      uploaded_at: new Date().toISOString().split('T')[0]
    };
    const { data, error } = await supabase.from('patient_documents').insert([newDoc]).select();
    if (error) {
      console.error("Error adding document:", error);
      throw error;
    }
    if (data && data[0]) {
      setPatients(prev => prev.map(p => {
        if (p.id === patientId) {
          const docs = p.documents || [];
          return { ...p, documents: [data[0], ...docs] };
        }
        return p;
      }));
      return data[0];
    }
    return null;
  };

  const addLeadCommunication = async (leadId, type, note) => {
    const newComm = {
      lead_id: leadId,
      type,
      note,
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase.from('lead_communications').insert([newComm]).select();
    if (error) {
      console.error("Error adding lead communication:", error);
      throw error;
    }
    if (data && data[0]) {
      setLeads(prev => prev.map(l => {
        if (l.id === leadId) {
          const comms = l.communication_log || [];
          return { ...l, communication_log: [data[0], ...comms] };
        }
        return l;
      }));
      return data[0];
    }
    return null;
  };

  const updateLeadFollowUp = async (leadId, followUpDate, lostReason = null) => {
    const updates = { follow_up_date: followUpDate };
    if (lostReason) updates.lost_reason = lostReason;
    
    const { error } = await supabase.from('leads').update(updates).eq('id', leadId);
    if (error) {
      console.error("Error updating lead follow-up:", error);
      throw error;
    }
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
  };

  return (
    <ClinicContext.Provider value={{
      session, user, signOut, isLoading,
      patients, services, businessHours, appointments, leads, tasks, payments, expenses, forms, formSubmissions, bookingSettings, patientPackages,
      addPatient, updatePatient, addClinicalNote, addPatientDocument, addLeadCommunication, updateLeadFollowUp,
      addService, updateService, deleteService, addAppointment, updateAppointmentStatus, addLead, addTask, 
      addPayment, updatePayment, deletePayment, updatePaymentStatus, 
      addExpense, updateExpense, deleteExpense, 
      addForm, updateForm, addFormSubmission, updateBookingSettings,
      issuePackageToPatient, redeemPackageSession,
      updateLeadStatus, updateTaskStatus, updateBusinessHour, getAvailableSlotsForDate,
      getPatientName, getServiceName, getPaymentForAppointment, 
      isWithinBusinessHours, isTimeSlotAvailable,
      tasksDueToday, revenueThisMonth, todayStr, setPatients, setLeads
    }}>
      {children}
    </ClinicContext.Provider>
  );
};
