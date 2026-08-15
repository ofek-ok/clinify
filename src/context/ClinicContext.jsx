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
  const [forms, setForms] = useState([]);
  const [formSubmissions, setFormSubmissions] = useState([]);
  
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
        tasksRes, paymentsRes, formsRes, formSubRes
      ] = await Promise.all([
        supabase.from('patients').select('*'),
        supabase.from('services').select('*'),
        supabase.from('appointments').select('*'),
        supabase.from('leads').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('forms').select('*'),
        supabase.from('form_submissions').select('*')
      ]);

      if (patientsRes.data) setPatients(patientsRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
      if (appointmentsRes.data) setAppointments(appointmentsRes.data);
      if (leadsRes.data) setLeads(leadsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
      if (formsRes.data) setForms(formsRes.data);
      if (formSubRes.data) setFormSubmissions(formSubRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
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
    if (!error && data) setAppointments([...appointments, data[0]]);
  };

  const addLead = async (lead) => {
    const { data, error } = await supabase.from('leads').insert([lead]).select();
    if (!error && data) {
      setLeads([...leads, data[0]]);
      return data[0];
    }
    return null;
  };

  const addTask = async (task) => {
    const payload = { ...task };
    if (!payload.patient_id) delete payload.patient_id;
    const { data, error } = await supabase.from('tasks').insert([payload]).select();
    if (!error && data) setTasks([...tasks, data[0]]);
  };

  const addPayment = async (payment) => {
    const { data, error } = await supabase.from('payments').insert([{...payment, payment_date: new Date().toISOString()}]).select();
    if (!error && data) setPayments([...payments, data[0]]);
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

  const tasksDueToday = useMemo(() => tasks.filter(t => t.due_date === todayStr && t.status !== 'done'), [tasks, todayStr]);
  const revenueThisMonth = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return payments
      .filter(p => p.status === 'paid' && new Date(p.payment_date).getMonth() === currentMonth && new Date(p.payment_date).getFullYear() === currentYear)
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  }, [payments]);

  return (
    <ClinicContext.Provider value={{
      isLoading,
      patients, services, businessHours, appointments, leads, tasks, payments, forms, formSubmissions,
      addPatient, addService, addAppointment, addLead, addTask, addPayment, addForm, updateForm, addFormSubmission,
      updateLeadStatus, updateTaskStatus, updateBusinessHour,
      getPatientName, getServiceName, getPaymentForAppointment, 
      isWithinBusinessHours, isTimeSlotAvailable,
      tasksDueToday, revenueThisMonth, todayStr, setPatients, setLeads
    }}>
      {children}
    </ClinicContext.Provider>
  );
};
