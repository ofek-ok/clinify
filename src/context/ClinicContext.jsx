import React, { createContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';

export const ClinicContext = createContext();

export const ClinicProvider = ({ children }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [isLoading, setIsLoading] = useState(true);
  
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([
    { id: 'exp_1', title: 'שכירות קליניקה', category: 'Rent', amount: 4500, payment_method: 'Bank Transfer', expense_date: todayStr },
    { id: 'exp_2', title: 'ציוד מתכלה ותחבושות', category: 'Equipment', amount: 650, payment_method: 'Credit Card', expense_date: todayStr }
  ]);
  const [forms, setForms] = useState([]);
  const [formSubmissions, setFormSubmissions] = useState([]);

  // Configurable Public Self-Booking Settings
  const [bookingSettings, setBookingSettings] = useState({
    allowPackages: true,
    allowPayAtClinic: true,
    requirePolicy: true,
    cancellationPolicyText: 'ביטול תור יתאפשר עד 24 שעות מראש. ביטול במעמד קצר יותר יחויב במחצית משווי הטיפול.',
    welcomeMessage: 'ברוכים הבאים לעמוד זימון התורים הציבורי. אנא בחרו שירות ומועד נוח.',
    clinicAddress: 'הרצל 15, תל אביב (בניין B, קומה 3)'
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

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [
        patientsRes, servicesRes, appointmentsRes, leadsRes, 
        tasksRes, paymentsRes, formsRes, formSubRes, expensesRes, bookingSetRes
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
        supabase.from('booking_settings').select('*').single()
      ]);

      if (patientsRes.data) setPatients(patientsRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
      if (appointmentsRes.data) setAppointments(appointmentsRes.data);
      if (leadsRes.data) setLeads(leadsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
      if (formsRes.data) setForms(formsRes.data);
      if (formSubRes.data) setFormSubmissions(formSubRes.data);
      if (expensesRes.data && expensesRes.data.length > 0) setExpenses(expensesRes.data);
      if (bookingSetRes.data) setBookingSettings(prev => ({ ...prev, ...bookingSetRes.data }));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookingSettings = async (updates) => {
    setBookingSettings(prev => {
      const next = { ...prev, ...updates };
      supabase.from('booking_settings').upsert({ id: 'default', ...next }).then();
      return next;
    });
  };

  const addPatient = async (patient) => {
    const { data, error } = await supabase.from('patients').insert([patient]).select();
    if (!error && data) {
      setPatients([...patients, data[0]]);
      return data[0];
    }
    return null;
  };

  const addService = async (service) => {
    const { data, error } = await supabase.from('services').insert([{
      name: service.name,
      description: service.description,
      duration_minutes: parseInt(service.duration_minutes),
      default_price: parseFloat(service.default_price)
    }]).select();
    if (!error && data) setServices([...services, data[0]]);
  };

  const addAppointment = async (appt) => {
    const { data, error } = await supabase.from('appointments').insert([appt]).select();
    if (!error && data) {
      setAppointments([...appointments, data[0]]);
      return data[0];
    } else {
      const fallback = { id: 'appt_' + Date.now(), ...appt };
      setAppointments([...appointments, fallback]);
      return fallback;
    }
  };

  const addLead = async (lead) => {
    const { data, error } = await supabase.from('leads').insert([lead]).select();
    if (!error && data) {
      setLeads([...leads, data[0]]);
      return data[0];
    } else {
      const fallback = { id: 'lead_' + Date.now(), ...lead };
      setLeads([...leads, fallback]);
      return fallback;
    }
  };

  const addTask = async (task) => {
    const payload = { ...task };
    if (!payload.patient_id) delete payload.patient_id;
    const { data, error } = await supabase.from('tasks').insert([payload]).select();
    if (!error && data) setTasks([...tasks, data[0]]);
  };

  const addPayment = async (payment) => {
    const payload = {
      ...payment,
      payment_date: payment.payment_date || new Date().toISOString()
    };
    const { data, error } = await supabase.from('payments').insert([payload]).select();
    if (!error && data) {
      setPayments([...payments, data[0]]);
    } else {
      setPayments(prev => [...prev, { id: 'pay_' + Date.now(), ...payload }]);
    }
  };

  const updatePayment = async (paymentId, updates) => {
    const { data, error } = await supabase.from('payments').update(updates).eq('id', paymentId).select();
    setPayments(prev => prev.map(p => p.id === paymentId ? (data && data[0] ? data[0] : { ...p, ...updates }) : p));
  };

  const deletePayment = async (paymentId) => {
    await supabase.from('payments').delete().eq('id', paymentId);
    setPayments(prev => prev.filter(p => p.id !== paymentId));
  };

  const updatePaymentStatus = async (paymentId, newStatus) => {
    const { error } = await supabase.from('payments').update({ status: newStatus }).eq('id', paymentId);
    setPayments(payments.map(p => p.id === paymentId ? { ...p, status: newStatus } : p));
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
    if (!error && data) {
      setExpenses(prev => [...prev, data[0]]);
      return data[0];
    } else {
      const fallback = { id: 'exp_' + Date.now(), ...payload };
      setExpenses(prev => [...prev, fallback]);
      return fallback;
    }
  };

  const updateExpense = async (expenseId, updates) => {
    const { data, error } = await supabase.from('expenses').update(updates).eq('id', expenseId).select();
    setExpenses(prev => prev.map(e => e.id === expenseId ? (data && data[0] ? data[0] : { ...e, ...updates }) : e));
  };

  const deleteExpense = async (expenseId) => {
    await supabase.from('expenses').delete().eq('id', expenseId);
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };

  // Forms API
  const addForm = async (form) => {
    const { data, error } = await supabase.from('forms').insert([form]).select();
    if (!error && data) {
      setForms([...forms, data[0]]);
      return data[0];
    }
    return null;
  };

  const updateForm = async (formId, updates) => {
    const { data, error } = await supabase.from('forms').update(updates).eq('id', formId).select();
    if (!error && data) {
      setForms(forms.map(f => f.id === formId ? data[0] : f));
    }
  };

  const addFormSubmission = async (submission) => {
    const { data, error } = await supabase.from('form_submissions').insert([submission]).select();
    if (!error && data) {
      setFormSubmissions([...formSubmissions, data[0]]);
      return data[0];
    }
    return null;
  };

  // Updates
  const updateLeadStatus = async (leadId, newStatus) => {
    const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    if (!error) setLeads(leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    const { error } = await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    if (!error) setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const updateBusinessHour = (dayOfWeek, updates) => {
    setBusinessHours(prev => prev.map(bh => bh.dayOfWeek === dayOfWeek ? { ...bh, ...updates } : bh));
  };

  const getPatientName = (patientId) => {
    if (!patientId) return '';
    const patient = patients.find(p => p.id === patientId);
    return patient ? patient.full_name : 'Unknown Patient';
  };
  const getServiceName = (serviceId) => {
    const svc = services.find(s => s.id === serviceId);
    return svc ? svc.name : 'Unknown Service';
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

  // Helper to generate open time slots for a given date and service duration
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
      const timeIso = current.toISOString();
      const timeDisplay = current.toTimeString().substring(0, 5);
      
      // Check collision
      const available = isTimeSlotAvailable(current.toISOString().split('T')[0] + 'T' + timeDisplay, durationMinutes);
      if (available) {
        slots.push(timeDisplay);
      }
      // Step by 30 mins
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
    if (!error && data) {
      setPatients(prev => prev.map(p => p.id === patientId ? data[0] : p));
      return data[0];
    } else {
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, ...updates } : p));
      const current = patients.find(p => p.id === patientId);
      return { ...current, ...updates };
    }
  };

  const addClinicalNote = async (patientId, noteText, author = 'ד"ר אוקונסקי') => {
    const newNote = {
      id: 'note_' + Date.now(),
      patient_id: patientId,
      created_at: new Date().toISOString(),
      author,
      content: noteText
    };
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        const notes = p.clinical_notes || [];
        return { ...p, clinical_notes: [newNote, ...notes] };
      }
      return p;
    }));
    return newNote;
  };

  const addPatientDocument = async (patientId, docName, docUrl = '#') => {
    const newDoc = {
      id: 'doc_' + Date.now(),
      name: docName,
      uploaded_at: new Date().toISOString().split('T')[0],
      url: docUrl,
      size: '1.2 MB'
    };
    setPatients(prev => prev.map(p => {
      if (p.id === patientId) {
        const docs = p.documents || [];
        return { ...p, documents: [newDoc, ...docs] };
      }
      return p;
    }));
    return newDoc;
  };

  const addLeadCommunication = async (leadId, type, note) => {
    const newComm = {
      id: 'comm_' + Date.now(),
      type,
      created_at: new Date().toISOString(),
      note
    };
    setLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        const comms = l.communication_log || [];
        return { ...l, communication_log: [newComm, ...comms] };
      }
      return l;
    }));
    return newComm;
  };

  const updateLeadFollowUp = async (leadId, followUpDate, lostReason = null) => {
    const updates = { follow_up_date: followUpDate };
    if (lostReason) updates.lost_reason = lostReason;
    
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
  };

  return (
    <ClinicContext.Provider value={{
      isLoading,
      patients, services, businessHours, appointments, leads, tasks, payments, expenses, forms, formSubmissions, bookingSettings,
      addPatient, updatePatient, addClinicalNote, addPatientDocument, addLeadCommunication, updateLeadFollowUp,
      addService, addAppointment, addLead, addTask, 
      addPayment, updatePayment, deletePayment, updatePaymentStatus, 
      addExpense, updateExpense, deleteExpense, 
      addForm, updateForm, addFormSubmission, updateBookingSettings,
      updateLeadStatus, updateTaskStatus, updateBusinessHour, getAvailableSlotsForDate,
      getPatientName, getServiceName, getPaymentForAppointment, 
      isWithinBusinessHours, isTimeSlotAvailable,
      tasksDueToday, revenueThisMonth, todayStr, setPatients, setLeads
    }}>
      {children}
    </ClinicContext.Provider>
  );
};
