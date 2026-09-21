import React, { createContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';

export const ClinicContext = createContext();

export const ClinicProvider = ({ children }) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [people, setPeople] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [patientPackages, setPatientPackages] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [leads, setLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [contentItems, setContentItems] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [forms, setForms] = useState([]);
  const [formSubmissions, setFormSubmissions] = useState([]);
  const [leadCommunications, setLeadCommunications] = useState([]);

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

  // Supabase Auth Initialization (Strict Secure Session check)
  // Temporary No-Login Mode: Fetch live DB data immediately on mount without auth session
  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        await fetchInitialData();
      } catch (err) {
        console.error("Error fetching initial data on mount:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, []);

  const mapBookingSettingsFromDb = (dbRow) => {
    if (!dbRow) return null;
    return {
      id: dbRow.id,
      clinicId: dbRow.clinic_id,
      allowPackages: dbRow.allow_packages ?? true,
      allowPayAtClinic: dbRow.allow_pay_at_clinic ?? true,
      requirePolicy: dbRow.require_policy ?? true,
      cancellationPolicyText: dbRow.cancellation_policy_text || 'ביטול תור יתאפשר עד 24 שעות מראש.',
      welcomeMessage: dbRow.welcome_message || 'ברוכים הבאים לעמוד זימון התורים הציבורי. אנא בחרו שירות ומועד נוח.',
      clinicAddress: dbRow.clinic_address || '',
      logoUrl: dbRow.logo_url || ''
    };
  };

  const mapBookingSettingsToDb = (settings) => {
    return {
      allow_packages: settings.allowPackages,
      allow_pay_at_clinic: settings.allowPayAtClinic,
      require_policy: settings.requirePolicy,
      cancellation_policy_text: settings.cancellationPolicyText,
      welcome_message: settings.welcomeMessage,
      clinic_address: settings.clinicAddress,
      logo_url: settings.logoUrl,
      updated_at: new Date().toISOString()
    };
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [
        peopleRes, patientsRes, servicesRes, appointmentsRes, leadsRes, 
        tasksRes, projectsRes, contentItemsRes, paymentsRes, formsRes, formSubRes, expensesRes, bookingSetRes, packagesRes, hoursRes, leadCommsRes
      ] = await Promise.all([
        supabase.from('people').select('*'),
        supabase.from('patients').select('*'),
        supabase.from('services').select('*'),
        supabase.from('appointments').select('*'),
        supabase.from('leads').select('*'),
        supabase.from('tasks').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('content_items').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('forms').select('*'),
        supabase.from('form_submissions').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('booking_settings').select('*').maybeSingle(),
        supabase.from('patient_packages').select('*'),
        supabase.from('business_hours').select('*'),
        supabase.from('lead_communications').select('*')
      ]);

      if (peopleRes.data) setPeople(peopleRes.data);
      if (patientsRes.data) setPatients(patientsRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
      if (appointmentsRes.data) setAppointments(appointmentsRes.data);
      if (leadsRes.data) setLeads(leadsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (contentItemsRes.data) setContentItems(contentItemsRes.data);
      if (paymentsRes.data) setPayments(paymentsRes.data);
      if (formsRes.data) setForms(formsRes.data);
      if (formSubRes.data) setFormSubmissions(formSubRes.data);
      if (expensesRes.data) setExpenses(expensesRes.data);
      if (packagesRes.data) setPatientPackages(packagesRes.data);
      if (leadCommsRes?.data) setLeadCommunications(leadCommsRes.data);

      if (bookingSetRes.data) {
        const mapped = mapBookingSettingsFromDb(bookingSetRes.data);
        if (mapped) setBookingSettings(mapped);
      }
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
      console.error("Error fetching internal OP OS data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setPeople([]);
    setPatients([]);
    setAppointments([]);
    setLeads([]);
    setTasks([]);
    setProjects([]);
    setContentItems([]);
    setPayments([]);
    setExpenses([]);
  };

  // Customer Conversion Trigger (First Completed + Paid Session)
  const triggerCustomerConversionIfEligible = async (personId) => {
    if (!personId) return;
    const person = people.find(p => p.id === personId);
    if (!person || person.client_status === 'customer') return;

    try {
      const { error } = await supabase.rpc('convert_lead_to_customer', { p_person_id: personId });
      if (error) {
        console.warn("RPC convert_lead_to_customer fallback to manual update:", error.message);
        await supabase.from('people').update({
          client_status: 'customer',
          customer_since: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('id', personId);
        await supabase.from('leads').update({ status: 'won' }).eq('person_id', personId);
      }
      const nowIso = new Date().toISOString();
      setPeople(prev => prev.map(p => p.id === personId ? { ...p, client_status: 'customer', customer_since: nowIso } : p));
      setLeads(prev => prev.map(l => l.person_id === personId ? { ...l, status: 'won' } : l));
    } catch (err) {
      console.error("Customer conversion error:", err);
    }
  };

  const updateBookingSettings = async (updates) => {
    const nextSettings = { ...bookingSettings, ...updates };
    const dbPayload = mapBookingSettingsToDb(nextSettings);

    let data, error;
    if (bookingSettings.id) {
      const res = await supabase.from('booking_settings').update(dbPayload).eq('id', bookingSettings.id).select();
      data = res.data;
      error = res.error;
    } else {
      const { data: existingRow } = await supabase.from('booking_settings').select('id').maybeSingle();
      if (existingRow?.id) {
        const res = await supabase.from('booking_settings').update(dbPayload).eq('id', existingRow.id).select();
        data = res.data;
        error = res.error;
      } else {
        const res = await supabase.from('booking_settings').insert([dbPayload]).select();
        data = res.data;
        error = res.error;
      }
    }

    if (error) {
      console.error("Error updating booking settings:", error);
      throw error;
    }

    if (data && data[0]) {
      const updatedMapped = mapBookingSettingsFromDb(data[0]);
      setBookingSettings(updatedMapped);
    }
  };

  const upsertPerson = async ({ full_name, fullName, phone, email, source = 'Website', clientStatus = 'lead' }) => {
    const nameVal = (full_name || fullName || '').trim();
    const phoneVal = (phone || '').trim();
    const emailVal = email ? email.trim() : null;
    const cleanPhone = phoneVal.replace(/\D/g, '');
    const cleanEmail = emailVal ? emailVal.toLowerCase() : null;

    if (!cleanPhone || cleanPhone.length < 7) {
      throw new Error('מספר טלפון תקין נדרש ליצירת זהות');
    }

    let phonePerson = people.find(p => p.normalized_phone === cleanPhone);
    if (!phonePerson) {
      const { data: dbPhonePerson } = await supabase
        .from('people')
        .select('*')
        .eq('normalized_phone', cleanPhone)
        .maybeSingle();
      if (dbPhonePerson) phonePerson = dbPhonePerson;
    }

    let emailPerson = null;
    if (cleanEmail) {
      emailPerson = people.find(p => p.normalized_email === cleanEmail);
      if (!emailPerson) {
        const { data: dbEmailPerson } = await supabase
          .from('people')
          .select('*')
          .eq('normalized_email', cleanEmail)
          .maybeSingle();
        if (dbEmailPerson) emailPerson = dbEmailPerson;
      }
    }

    if (phonePerson && emailPerson && phonePerson.id !== emailPerson.id) {
      throw new Error(`Identity Conflict: Phone (${phoneVal}) belongs to ${phonePerson.full_name} and Email (${emailVal}) belongs to ${emailPerson.full_name}. Merging different profiles is not allowed.`);
    }

    const targetPerson = phonePerson || emailPerson;

    if (targetPerson) {
      const updates = {};
      if (nameVal && nameVal !== targetPerson.full_name) updates.full_name = nameVal;
      if (cleanPhone && cleanPhone !== targetPerson.normalized_phone) {
        updates.phone = phoneVal;
        updates.normalized_phone = cleanPhone;
      }
      if (cleanEmail && cleanEmail !== targetPerson.normalized_email) {
        updates.email = emailVal;
        updates.normalized_email = cleanEmail;
      }
      if (clientStatus === 'customer' && targetPerson.client_status !== 'customer') {
        updates.client_status = 'customer';
        updates.customer_since = new Date().toISOString();
      }

      if (Object.keys(updates).length > 0) {
        const { data: updatedData, error } = await supabase
          .from('people')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', targetPerson.id)
          .select();

        if (error) {
          console.error("Error updating person:", error);
          throw error;
        }

        if (updatedData && updatedData[0]) {
          const updated = updatedData[0];
          setPeople(prev => prev.map(p => p.id === updated.id ? updated : p));
          return updated;
        }
      }
      return targetPerson;
    }

    const newPersonPayload = {
      full_name: nameVal,
      phone: phoneVal,
      normalized_phone: cleanPhone,
      email: emailVal,
      normalized_email: cleanEmail,
      client_status: clientStatus || 'lead',
      source: source || 'Website'
    };

    const { data: createdData, error: createErr } = await supabase
      .from('people')
      .insert([newPersonPayload])
      .select();

    if (createErr) throw createErr;
    if (createdData && createdData[0]) {
      const newPerson = createdData[0];
      setPeople(prev => [...prev, newPerson]);
      return newPerson;
    }
    return null;
  };

  const addPatient = async (input) => {
    const person = await upsertPerson({
      full_name: input.full_name || input.fullName,
      phone: input.phone,
      email: input.email,
      source: input.source || 'Internal',
      clientStatus: 'lead'
    });

    if (!person) throw new Error('נכשל ביצירת זהות מרכזית');

    const existingPatient = patients.find(p => p.person_id === person.id);
    if (existingPatient) return existingPatient;

    const patientPayload = {
      person_id: person.id,
      status: input.status || 'active',
      medical_history: input.medical_history || null,
      allergies: input.allergies || null,
      emergency_contact: input.emergency_contact || null,
      tags: input.tags || []
    };

    const { data, error } = await supabase.from('patients').insert([patientPayload]).select();
    if (error) {
      console.error("Error adding patient profile:", error);
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

  const issuePackageToPatient = async (patientId, catalogItem) => {
    const patient = patients.find(p => p.id === patientId);
    const personId = patient ? patient.person_id : null;

    const newPkg = {
      person_id: personId,
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
    let personId = appt.person_id;
    if (!personId && appt.patient_id) {
      const patient = patients.find(p => p.id === appt.patient_id);
      if (patient) personId = patient.person_id;
    }

    const payload = {
      ...appt,
      person_id: personId
    };

    const { data, error } = await supabase.from('appointments').insert([payload]).select();
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

  const updateAppointmentStatus = async (apptId, newStatus) => {
    const appt = appointments.find(a => a.id === apptId);
    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', apptId);
    if (error) {
      console.error("Error updating appointment status:", error);
      throw error;
    }
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: newStatus } : a));

    if (newStatus === 'completed' && appt) {
      const payment = payments.find(p => p.appointment_id === apptId && p.status === 'paid');
      if (payment && appt.person_id) {
        await triggerCustomerConversionIfEligible(appt.person_id);
      }

      if (appt.patient_id) {
        const activePkg = patientPackages.find(p => p.patient_id === appt.patient_id && p.remaining_sessions > 0);
        if (activePkg) {
          await redeemPackageSession(activePkg.id);
        }
      }
    }
  };

  const addLead = async (input) => {
    const person = await upsertPerson({
      full_name: input.full_name || input.fullName,
      phone: input.phone,
      email: input.email,
      source: input.source || 'Website',
      clientStatus: 'lead'
    });

    if (!person) throw new Error('נכשל ביצירת זהות מרכזית');

    const existingLead = leads.find(l => l.person_id === person.id);
    if (existingLead) return existingLead;

    const leadPayload = {
      person_id: person.id,
      source: input.source || 'Website',
      status: input.status || 'new',
      follow_up_date: input.follow_up_date || null,
      lost_reason: input.lost_reason || null
    };

    const { data, error } = await supabase.from('leads').insert([leadPayload]).select();
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

  // Central Execution Engine: Tasks & Projects (Block 2)
  const addProject = async (proj) => {
    const payload = {
      name: proj.name,
      objective: proj.objective || null,
      status: proj.status || 'active',
      start_date: proj.start_date || todayStr,
      due_date: proj.due_date || null,
      progress: proj.progress ? parseInt(proj.progress) : 0,
      area: proj.area || 'business'
    };
    const { data, error } = await supabase.from('projects').insert([payload]).select();
    if (error) {
      console.error("Error creating project:", error);
      throw error;
    }
    if (data && data[0]) {
      setProjects(prev => [...prev, data[0]]);
      return data[0];
    }
    return null;
  };

  const updateProject = async (projectId, updates) => {
    const { data, error } = await supabase.from('projects').update(updates).eq('id', projectId).select();
    if (error) {
      console.error("Error updating project:", error);
      throw error;
    }
    if (data && data[0]) {
      setProjects(prev => prev.map(p => p.id === projectId ? data[0] : p));
      return data[0];
    }
    return null;
  };

  const deleteProject = async (projectId) => {
    const { error } = await supabase.from('projects').delete().eq('id', projectId);
    if (error) {
      console.error("Error deleting project:", error);
      throw error;
    }
    setProjects(prev => prev.filter(p => p.id !== projectId));
  };

  const addTask = async (task) => {
    let personId = task.person_id;
    if (!personId && task.patient_id) {
      const patient = patients.find(p => p.id === task.patient_id);
      if (patient) personId = patient.person_id;
    }

    const payload = {
      title: task.title,
      due_date: task.due_date || todayStr,
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      area: task.area || 'operations',
      person_id: personId || null,
      patient_id: task.patient_id || null,
      project_id: task.project_id || null,
      content_item_id: task.content_item_id || null,
      dependency_task_id: task.dependency_task_id || null
    };

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

  const updateTask = async (taskId, updates) => {
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', taskId).select();
    if (error) {
      console.error("Error updating task:", error);
      throw error;
    }
    if (data && data[0]) {
      setTasks(prev => prev.map(t => t.id === taskId ? data[0] : t));
    }
  };

  const deleteTask = async (taskId) => {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    await updateTask(taskId, { status: newStatus });
  };

  // Pre-launch Acquisition: Performance List (Block 3)
  const subscribePerformanceList = async (input) => {
    const { data, error } = await supabase.rpc('public_subscribe_performance_list', {
      p_full_name: input.full_name || input.fullName,
      p_email: input.email,
      p_phone: input.phone || null,
      p_utm_source: input.utm_source || null,
      p_utm_medium: input.utm_medium || null,
      p_utm_campaign: input.utm_campaign || null
    });

    if (error) {
      console.error("Error subscribing to performance list:", error);
      throw error;
    }

    fetchInitialData();
    return data;
  };

  // Content OS (Block 4)
  const addContentItem = async (item) => {
    const payload = {
      title: item.title,
      platform: item.platform || 'instagram',
      format: item.format || 'post',
      audience: item.audience || 'both',
      objective: item.objective || 'awareness',
      status: item.status || 'idea',
      stage: item.stage || 'research',
      publish_date: item.publish_date || null,
      campaign: item.campaign || null,
      cta: item.cta || null,
      project_id: item.project_id || null
    };

    const { data, error } = await supabase.from('content_items').insert([payload]).select();
    if (error) {
      console.error("Error adding content item:", error);
      throw error;
    }
    if (data && data[0]) {
      setContentItems(prev => [...prev, data[0]]);
      return data[0];
    }
    return null;
  };

  const updateContentItem = async (itemId, updates) => {
    const { data, error } = await supabase.from('content_items').update(updates).eq('id', itemId).select();
    if (error) {
      console.error("Error updating content item:", error);
      throw error;
    }
    if (data && data[0]) {
      setContentItems(prev => prev.map(c => c.id === itemId ? data[0] : c));
    }
  };

  const deleteContentItem = async (itemId) => {
    const { error } = await supabase.from('content_items').delete().eq('id', itemId);
    if (error) {
      console.error("Error deleting content item:", error);
      throw error;
    }
    setContentItems(prev => prev.filter(c => c.id !== itemId));
  };

  const addPayment = async (payment) => {
    let personId = payment.person_id;
    let patientId = payment.patient_id;

    if (payment.appointment_id) {
      const appt = appointments.find(a => a.id === payment.appointment_id);
      if (appt) {
        if (!patientId && appt.patient_id) patientId = appt.patient_id;
        if (!personId && appt.person_id) personId = appt.person_id;
        if (!personId && appt.patient_id) {
          const patient = patients.find(p => p.id === appt.patient_id);
          if (patient) personId = patient.person_id;
        }
      }
    }

    if (!personId && patientId) {
      const patient = patients.find(p => p.id === patientId);
      if (patient) personId = patient.person_id;
    }

    const payload = {
      ...payment,
      person_id: personId || null,
      patient_id: patientId || null,
      payment_date: payment.payment_date || new Date().toISOString()
    };
    const { data, error } = await supabase.from('payments').insert([payload]).select();
    if (error) {
      console.error("Error adding payment:", error);
      throw error;
    }
    if (data && data[0]) {
      const createdPayment = data[0];
      setPayments(prev => [...prev, createdPayment]);

      if (createdPayment.status === 'paid' && createdPayment.appointment_id) {
        const appt = appointments.find(a => a.id === createdPayment.appointment_id);
        if (appt && appt.status === 'completed' && appt.person_id) {
          await triggerCustomerConversionIfEligible(appt.person_id);
        }
      }

      if (payment.item_type === 'package' && payment.patient_id) {
        const catalogItem = services.find(s => s.id === payment.catalog_item_id) || { name: 'כרטיסיית טיפולים', session_count: 10 };
        await issuePackageToPatient(payment.patient_id, catalogItem);
      }
      return createdPayment;
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

  const updateLeadStatus = async (leadId, newStatus) => {
    const { error } = await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    if (error) {
      console.error("Error updating lead status:", error);
      throw error;
    }
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
  };

  const updateBusinessHour = async (dayOfWeek, updates) => {
    const target = businessHours.find(bh => bh.dayOfWeek === dayOfWeek);
    if (!target) return;

    const updated = { ...target, ...updates };
    const dbPayload = {
      day_index: updated.dayIndex,
      day_of_week: updated.dayOfWeek,
      is_open: updated.isOpen,
      start_time: updated.startTime,
      end_time: updated.endTime
    };

    const { data, error } = await supabase
      .from('business_hours')
      .upsert(dbPayload, { onConflict: 'day_index' })
      .select();

    if (error) {
      console.error(`Error updating business hours for ${dayOfWeek}:`, error);
      throw error;
    }

    if (data && data[0]) {
      setBusinessHours(prev => prev.map(bh => bh.dayOfWeek === dayOfWeek ? {
        dayIndex: data[0].day_index,
        dayOfWeek: data[0].day_of_week,
        isOpen: data[0].is_open,
        startTime: data[0].start_time,
        endTime: data[0].end_time
      } : bh));
    }
  };

  const enrichedPatients = useMemo(() => {
    const peopleMap = new Map(people.map(p => [p.id, p]));
    return patients.map(pt => {
      const person = peopleMap.get(pt.person_id) || {};
      return {
        ...pt,
        full_name: person.full_name || '',
        phone: person.phone || '',
        normalized_phone: person.normalized_phone || '',
        email: person.email || '',
        normalized_email: person.normalized_email || '',
        client_status: person.client_status || 'customer',
        customer_since: person.customer_since
      };
    });
  }, [patients, people]);

  const enrichedLeads = useMemo(() => {
    const peopleMap = new Map(people.map(p => [p.id, p]));
    return leads.map(l => {
      const person = peopleMap.get(l.person_id) || {};
      return {
        ...l,
        full_name: person.full_name || '',
        phone: person.phone || '',
        normalized_phone: person.normalized_phone || '',
        email: person.email || '',
        normalized_email: person.normalized_email || '',
        client_status: person.client_status || 'lead'
      };
    });
  }, [leads, people]);

  const getPatientName = (patientId) => {
    if (!patientId) return '';
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return '';
    const person = people.find(p => p.id === patient.person_id);
    return person ? person.full_name : '';
  };

  const getPersonName = (personId) => {
    if (!personId) return '';
    const person = people.find(p => p.id === personId);
    return person ? person.full_name : '';
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
    const patient = patients.find(p => p.id === patientId);
    const personId = patient ? patient.person_id : null;

    const newNote = {
      person_id: personId,
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
    const patient = patients.find(p => p.id === patientId);
    const personId = patient ? patient.person_id : null;

    const newDoc = {
      person_id: personId,
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
    let targetLead = leads.find(l => l.id === leadId || l.person_id === leadId);
    if (!targetLead) {
      throw new Error('לא נמצא ליד תקין לשיוך תקשורת');
    }

    const newComm = {
      lead_id: targetLead.id,
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
      const createdComm = data[0];
      setLeadCommunications(prev => [createdComm, ...prev]);
      setLeads(prev => prev.map(l => {
        if (l.id === targetLead.id) {
          const comms = l.communication_log || [];
          return { ...l, communication_log: [createdComm, ...comms] };
        }
        return l;
      }));
      return createdComm;
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
      people, upsertPerson, getPersonName,
      patients: enrichedPatients, services, businessHours, appointments, leads: enrichedLeads,
      tasks, projects, contentItems, payments, expenses, forms, formSubmissions, leadCommunications, bookingSettings, patientPackages,

      addPatient, updatePatient, addClinicalNote, addPatientDocument, addLeadCommunication, updateLeadFollowUp,
      addService, updateService, deleteService, addAppointment, updateAppointmentStatus, addLead,
      addProject, updateProject, deleteProject,
      addTask, updateTask, updateTaskStatus, deleteTask,
      subscribePerformanceList,
      addContentItem, updateContentItem, deleteContentItem,
      addPayment, updatePayment, deletePayment, updatePaymentStatus, 
      addExpense, updateExpense, deleteExpense, 
      addForm, updateForm, addFormSubmission, updateBookingSettings,
      issuePackageToPatient, redeemPackageSession, triggerCustomerConversionIfEligible,
      updateLeadStatus, updateBusinessHour, getAvailableSlotsForDate,
      getPatientName, getServiceName, getPaymentForAppointment, 
      isWithinBusinessHours, isTimeSlotAvailable,
      tasksDueToday, revenueThisMonth, todayStr, setPatients, setLeads
    }}>
      {children}
    </ClinicContext.Provider>
  );
};
