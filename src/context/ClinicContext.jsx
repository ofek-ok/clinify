import React, { createContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';

export const ClinicContext = createContext();

const BUSINESS_TIME_ZONE = 'Asia/Jerusalem';

const getIsraelDateParts = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    weekday: map.weekday,
    hour: map.hour,
    minute: map.minute
  };
};

const getIsraelDateKey = (value = new Date()) => {
  const { year, month, day } = getIsraelDateParts(value);
  return `${year}-${month}-${day}`;
};

const getIsraelOffsetString = (dateStr) => {
  const probe = new Date(`${dateStr}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: BUSINESS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(probe);
  const map = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
  const offsetMinutes = Math.round((asUtc - probe.getTime()) / 60000);
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const minutes = String(absolute % 60).padStart(2, '0');
  return `${sign}${hours}:${minutes}`;
};

const buildIsraelIsoTimestamp = (dateStr, timeStr) =>
  `${dateStr}T${timeStr}:00${getIsraelOffsetString(dateStr)}`;


const normalizeContactPhone = (value) => {
  if (!value) return null;
  let digits = String(value).replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('00972')) {
    digits = `972${digits.slice(5)}`;
  } else if (digits.startsWith('9720')) {
    digits = `972${digits.slice(4)}`;
  } else if (digits.startsWith('0') && digits.length >= 9 && digits.length <= 10) {
    digits = `972${digits.slice(1)}`;
  }

  return digits;
};

export const ClinicProvider = ({ children }) => {
  const todayStr = getIsraelDateKey();

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
  const [clinicalNotes, setClinicalNotes] = useState([]);
  const [patientDocuments, setPatientDocuments] = useState([]);
  const [calendarBlocks, setCalendarBlocks] = useState([]);
  const [workOptions, setWorkOptions] = useState([]);

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

  const clearData = () => {
    setPeople([]);
    setPatients([]);
    setServices([]);
    setPatientPackages([]);
    setAppointments([]);
    setLeads([]);
    setTasks([]);
    setProjects([]);
    setContentItems([]);
    setPayments([]);
    setExpenses([]);
    setForms([]);
    setFormSubmissions([]);
    setLeadCommunications([]);
    setClinicalNotes([]);
    setPatientDocuments([]);
    setCalendarBlocks([]);
    setWorkOptions([]);
  };

  // Supabase Auth Initialization
  useEffect(() => {
    let isMounted = true;

    const loadAuthenticatedData = async (nextSession) => {
      if (!isMounted) return;
      setSession(nextSession || null);
      setUser(nextSession?.user || null);

      if (nextSession) {
        try {
          await fetchInitialData();
        } catch (err) {
          console.error("Error fetching authenticated data:", err);
        }
      } else {
        clearData();
      }

      if (isMounted) setIsLoading(false);
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Error reading auth session:", error);
        if (isMounted) {
          setSession(null);
          setUser(null);
          clearData();
          setIsLoading(false);
        }
        return;
      }
      return loadAuthenticatedData(data?.session || null);
    }).catch(err => {
      console.error("Auth initialization failed:", err);
      if (isMounted) {
        setSession(null);
        setUser(null);
        clearData();
        setIsLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setIsLoading(true);
      loadAuthenticatedData(nextSession || null);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
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
        tasksRes, projectsRes, contentItemsRes, paymentsRes, formsRes, formSubRes, expensesRes, bookingSetRes, packagesRes, hoursRes, leadCommsRes,
        clinicalNotesRes, patientDocumentsRes, calendarBlocksRes, workOptionsRes
      ] = await Promise.all([
        supabase.from('people').select('*').is('deleted_at', null),
        supabase.from('patients').select('*').is('deleted_at', null),
        supabase.from('services').select('*').is('deleted_at', null),
        supabase.from('appointments').select('*').is('deleted_at', null),
        supabase.from('leads').select('*').is('deleted_at', null),
        supabase.from('tasks').select('*').is('deleted_at', null),
        supabase.from('projects').select('*').is('deleted_at', null),
        supabase.from('content_items').select('*').is('deleted_at', null),
        supabase.from('payments').select('*').is('deleted_at', null),
        supabase.from('forms').select('*').is('deleted_at', null),
        supabase.from('form_submissions').select('*').is('deleted_at', null),
        supabase.from('expenses').select('*').is('deleted_at', null),
        supabase.from('booking_settings').select('*').maybeSingle(),
        supabase.from('patient_packages').select('*').is('deleted_at', null),
        supabase.from('business_hours').select('*'),
        supabase.from('lead_communications').select('*').is('deleted_at', null),
        supabase.from('patient_clinical_notes').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.from('patient_documents').select('*').is('deleted_at', null).order('uploaded_at', { ascending: false }),
        supabase.from('calendar_blocks').select('*').is('deleted_at', null).eq('busy', true),
        supabase.from('work_options').select('*').order('option_type').order('sort_order')
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
      if (clinicalNotesRes?.data) setClinicalNotes(clinicalNotesRes.data);
      if (patientDocumentsRes?.data) setPatientDocuments(patientDocumentsRes.data);
      if (calendarBlocksRes?.data) setCalendarBlocks(calendarBlocksRes.data);
      if (workOptionsRes?.data) setWorkOptions(workOptionsRes.data);

      if (bookingSetRes.data) {
        const mapped = mapBookingSettingsFromDb(bookingSetRes.data);
        if (mapped) setBookingSettings(mapped);
      }
      if (hoursRes.data) {
        const fallbackHours = [
          { dayIndex: 0, dayOfWeek: 'Sunday', isOpen: false, startTime: '09:00', endTime: '17:00' },
          { dayIndex: 1, dayOfWeek: 'Monday', isOpen: true, startTime: '09:00', endTime: '17:00' },
          { dayIndex: 2, dayOfWeek: 'Tuesday', isOpen: true, startTime: '09:00', endTime: '17:00' },
          { dayIndex: 3, dayOfWeek: 'Wednesday', isOpen: true, startTime: '09:00', endTime: '17:00' },
          { dayIndex: 4, dayOfWeek: 'Thursday', isOpen: true, startTime: '09:00', endTime: '17:00' },
          { dayIndex: 5, dayOfWeek: 'Friday', isOpen: true, startTime: '09:00', endTime: '14:00' },
          { dayIndex: 6, dayOfWeek: 'Saturday', isOpen: false, startTime: '09:00', endTime: '13:00' }
        ];

        const dbHoursByIndex = new Map(
          hoursRes.data.map(h => [Number(h.day_index), h])
        );

        setBusinessHours(
          fallbackHours.map(day => {
            const h = dbHoursByIndex.get(day.dayIndex);
            if (!h) return day;
            return {
              dayIndex: day.dayIndex,
              dayOfWeek: h.day_of_week || day.dayOfWeek,
              isOpen: Boolean(h.is_open),
              startTime: String(h.start_time || day.startTime).slice(0, 5),
              endTime: String(h.end_time || day.endTime).slice(0, 5)
            };
          })
        );
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
    clearData();
    setIsLoading(false);
  };

  const removeFromLocalState = (table, id) => {
    const handlers = {
      people: setPeople,
      patients: setPatients,
      services: setServices,
      appointments: setAppointments,
      leads: setLeads,
      tasks: setTasks,
      projects: setProjects,
      content_items: setContentItems,
      payments: setPayments,
      expenses: setExpenses,
      forms: setForms,
      form_submissions: setFormSubmissions,
      patient_packages: setPatientPackages,
      lead_communications: setLeadCommunications,
      patient_clinical_notes: setClinicalNotes,
      patient_documents: setPatientDocuments,
      calendar_blocks: setCalendarBlocks
    };
    const setter = handlers[table];
    if (setter) setter(prev => prev.filter(item => item.id !== id));
  };

  const softDeleteRecord = async (table, id) => {
    const allowedTables = new Set([
      'people','patients','services','appointments','leads','tasks','projects',
      'content_items','payments','expenses','forms','form_submissions',
      'patient_packages','lead_communications','patient_clinical_notes',
      'patient_documents','calendar_blocks'
    ]);
    if (!allowedTables.has(table)) throw new Error('סוג הרשומה אינו נתמך למחיקה');

    const { error } = await supabase
      .from(table)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    removeFromLocalState(table, id);
    return true;
  };

  const restoreRecord = async (table, id) => {
    const { data, error } = await supabase
      .from(table)
      .update({ deleted_at: null })
      .eq('id', id)
      .select();

    if (error) throw error;
    await fetchInitialData();
    return data?.[0] || null;
  };

  // Customer Conversion Trigger (First Completed + Paid Session)
  const triggerCustomerConversionIfEligible = async (personId) => {
    if (!personId) return false;
    const person = people.find(p => p.id === personId);
    if (!person || person.client_status === 'customer') return true;

    const nowIso = new Date().toISOString();

    try {
      let convertedByRpc = false;

      if (user) {
        const { error: rpcError } = await supabase.rpc('convert_lead_to_customer', { p_person_id: personId });
        convertedByRpc = !rpcError;
      }

      if (!convertedByRpc) {
        const { error: personError } = await supabase
          .from('people')
          .update({
            client_status: 'customer',
            customer_since: person.customer_since || nowIso,
            updated_at: nowIso
          })
          .eq('id', personId);

        if (personError) throw personError;

        const { error: leadError } = await supabase
          .from('leads')
          .update({ status: 'won', follow_up_date: null })
          .eq('person_id', personId);

        if (leadError) throw leadError;
      }

      setPeople(prev => prev.map(p =>
        p.id === personId
          ? { ...p, client_status: 'customer', customer_since: p.customer_since || nowIso }
          : p
      ));
      setLeads(prev => prev.map(l =>
        l.person_id === personId
          ? { ...l, status: 'won', follow_up_date: null }
          : l
      ));

      return true;
    } catch (err) {
      console.error("Customer conversion error:", err);
      return false;
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
    const phoneVal = phone ? String(phone).trim() : '';
    const emailVal = email ? String(email).trim() : null;
    const cleanPhone = normalizeContactPhone(phoneVal);
    const cleanEmail = emailVal ? emailVal.toLowerCase() : null;

    if (!nameVal) {
      throw new Error('שם מלא נדרש ליצירת זהות');
    }

    if (phoneVal && (!cleanPhone || cleanPhone.length < 7)) {
      throw new Error('מספר הטלפון שהוזן אינו תקין');
    }

    if (!cleanPhone && !cleanEmail) {
      throw new Error('יש להזין לפחות טלפון או דוא״ל');
    }

    let phonePerson = null;
    if (cleanPhone) {
      phonePerson = people.find(p => p.normalized_phone === cleanPhone) || null;
      if (!phonePerson) {
        const { data: dbPhonePerson } = await supabase
          .from('people')
          .select('*')
          .eq('normalized_phone', cleanPhone)
          .maybeSingle();
        if (dbPhonePerson) phonePerson = dbPhonePerson;
      }
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
      phone: phoneVal || null,
      normalized_phone: cleanPhone || null,
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
    return softDeleteRecord('services', serviceId);
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

    const service = services.find(s => String(s.id) === String(appt.service_id));
    const durationMinutes = Number(service?.duration_minutes || 30);

    if (!isWithinBusinessHours(appt.appointment_date, durationMinutes)) {
      throw new Error('התור נמצא מחוץ לשעות הפעילות');
    }

    if (!isTimeSlotAvailable(appt.appointment_date, durationMinutes)) {
      throw new Error('המועד שנבחר מתנגש עם תור קיים');
    }

    const appointmentStart = new Date(appt.appointment_date);
    const appointmentEnd = new Date(appointmentStart.getTime() + durationMinutes * 60000);

    const payload = {
      ...appt,
      person_id: personId,
      end_date: appointmentEnd.toISOString()
    };

    const { data, error } = await supabase.from('appointments').insert([payload]).select();
    if (error) {
      console.error("Error creating appointment:", error);
      const message = String(error.message || '');
      if (message.includes('appointments_no_overlap') || message.includes('exclusion')) {
        throw new Error('המועד שנבחר כבר תפוס. בחר שעה אחרת.');
      }
      throw error;
    }
    if (data && data[0]) {
      const createdAppointment = data[0];
      setAppointments(prev => [...prev, createdAppointment]);

      if (personId) {
        const person = people.find(p => p.id === personId);
        if (person?.client_status !== 'customer') {
          const linkedLead = leads.find(l => l.person_id === personId);
          if (linkedLead && ['new', 'contacted', 'qualified'].includes(linkedLead.status)) {
            const { error: leadStatusError } = await supabase
              .from('leads')
              .update({ status: 'scheduled' })
              .eq('id', linkedLead.id);

            if (leadStatusError) {
              console.error("Error syncing lead status after appointment creation:", leadStatusError);
            } else {
              setLeads(prev => prev.map(l => l.id === linkedLead.id ? { ...l, status: 'scheduled' } : l));
            }
          }
        }
      }

      return createdAppointment;
    }
    return null;
  };

  const updateAppointment = async (apptId, updates) => {
    const existing = appointments.find(a => a.id === apptId);
    if (!existing) throw new Error('התור לא נמצא');

    const nextServiceId = updates.service_id ?? existing.service_id;
    const nextStart = updates.appointment_date ?? existing.appointment_date;
    const nextStatus = updates.status ?? existing.status;
    const service = services.find(s => String(s.id) === String(nextServiceId));
    const durationMinutes = Number(service?.duration_minutes || 30);

    if (!['cancelled', 'rescheduled'].includes(nextStatus)) {
      if (!isWithinBusinessHours(nextStart, durationMinutes)) {
        throw new Error('התור נמצא מחוץ לשעות הפעילות');
      }
      if (!isTimeSlotAvailable(nextStart, durationMinutes, apptId)) {
        throw new Error('המועד שנבחר מתנגש עם תור או זמן תפוס');
      }
    }

    const startDate = new Date(nextStart);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    const nextPersonId = updates.person_id ?? existing.person_id;
    const linkedPatient = patients.find(p => String(p.person_id) === String(nextPersonId));

    const payload = {
      ...updates,
      person_id: nextPersonId,
      patient_id: linkedPatient?.id || null,
      appointment_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    };

    const { data, error } = await supabase
      .from('appointments')
      .update(payload)
      .eq('id', apptId)
      .select();

    if (error) {
      console.error("Error updating appointment:", error);
      const message = String(error.message || '');
      if (message.includes('appointments_no_overlap') || message.includes('exclusion')) {
        throw new Error('המועד שנבחר כבר תפוס. בחר שעה אחרת.');
      }
      throw error;
    }

    if (data?.[0]) {
      setAppointments(prev => prev.map(a => a.id === apptId ? data[0] : a));
      return data[0];
    }
    return null;
  };

  const deleteAppointment = async (apptId) => {
    return softDeleteRecord('appointments', apptId);
  };

  const updateAppointmentStatus = async (apptId, newStatus) => {
    const appt = appointments.find(a => a.id === apptId);
    if (!appt) throw new Error('התור לא נמצא');
    if (appt.status === newStatus) return appt;

    const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', apptId);
    if (error) {
      console.error("Error updating appointment status:", error);
      throw error;
    }
    setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: newStatus } : a));

    if (newStatus === 'completed' && appt) {
      const payment = payments.find(p => p.appointment_id === apptId && p.status === 'paid');
      let appointmentPersonId = appt.person_id || payment?.person_id || null;

      if (!appointmentPersonId && appt.patient_id) {
        appointmentPersonId = patients.find(patient => patient.id === appt.patient_id)?.person_id || null;
      }

      if (payment && appointmentPersonId) {
        await triggerCustomerConversionIfEligible(appointmentPersonId);
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

    if (person.client_status === 'customer') {
      throw new Error('האדם כבר קיים כלקוח במערכת');
    }

    let existingLead = leads.find(l => l.person_id === person.id) || null;
    if (!existingLead) {
      const { data: dbLead, error: lookupError } = await supabase
        .from('leads')
        .select('*')
        .eq('person_id', person.id)
        .maybeSingle();

      if (lookupError) {
        console.error("Error checking existing lead:", lookupError);
        throw lookupError;
      }

      existingLead = dbLead || null;
    }

    if (existingLead) {
      return {
        ...existingLead,
        full_name: person.full_name || '',
        phone: person.phone || '',
        email: person.email || '',
        _existing: true
      };
    }

    const leadPayload = {
      person_id: person.id,
      source: input.source || 'Website',
      status: input.status || 'new',
      follow_up_date: input.follow_up_date || null,
      lost_reason: input.lost_reason || null,
      campaign: input.campaign || 'General Inquiries',
      utm_source: input.utm_source || null,
      utm_medium: input.utm_medium || null,
      utm_campaign: input.utm_campaign || null,
      tags: Array.isArray(input.tags) ? input.tags : null
    };

    const { data, error } = await supabase.from('leads').insert([leadPayload]).select();
    if (error) {
      console.error("Error creating lead:", error);
      throw error;
    }
    if (data && data[0]) {
      setLeads(prev => [...prev, data[0]]);
      return {
        ...data[0],
        full_name: person.full_name || '',
        phone: person.phone || '',
        email: person.email || '',
        _existing: false
      };
    }
    return null;
  };

  const deleteLead = async (leadId) => softDeleteRecord('leads', leadId);
  const deletePatient = async (patientId) => softDeleteRecord('patients', patientId);
  const deletePerson = async (personId) => softDeleteRecord('people', personId);

  // Central Execution Engine: Tasks & Projects (Block 2)
  const addWorkOption = async (option) => {
    const normalizedValue = (option.value || option.label || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_\u0590-\u05ff-]/g, '');

    if (!normalizedValue || !option.label?.trim()) throw new Error('יש להזין שם לאפשרות');

    const payload = {
      option_type: option.option_type,
      value: normalizedValue,
      label: option.label.trim(),
      color: option.color || '#64748b',
      sort_order: Number(option.sort_order || 0),
      is_active: option.is_active !== false
    };

    const { data, error } = await supabase.from('work_options').insert([payload]).select();
    if (error) throw error;
    if (data?.[0]) {
      setWorkOptions(prev => [...prev, data[0]].sort((a,b) =>
        a.option_type.localeCompare(b.option_type) || a.sort_order - b.sort_order
      ));
      return data[0];
    }
    return null;
  };

  const updateWorkOption = async (optionId, updates) => {
    const { data, error } = await supabase
      .from('work_options')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', optionId)
      .select();

    if (error) throw error;
    if (data?.[0]) {
      setWorkOptions(prev => prev.map(item => item.id === optionId ? data[0] : item));
      return data[0];
    }
    return null;
  };

  const addProject = async (proj) => {
    const payload = {
      name: proj.name,
      objective: proj.objective || null,
      status: proj.status || 'active',
      start_date: proj.start_date || todayStr,
      due_date: proj.due_date || null,
      progress: proj.progress ? parseInt(proj.progress) : 0,
      area: proj.area || 'business',
      labels: Array.isArray(proj.labels) ? proj.labels : [],
      color: proj.color || null,
      notes: proj.notes || null
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

  const deleteProject = async (projectId) => softDeleteRecord('projects', projectId);

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
      dependency_task_id: task.dependency_task_id || null,
      description: task.description || null,
      start_date: task.start_date || null,
      labels: Array.isArray(task.labels) ? task.labels : [],
      estimated_minutes: task.estimated_minutes ? Number(task.estimated_minutes) : null,
      sort_order: Number(task.sort_order || 0)
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

  const deleteTask = async (taskId) => softDeleteRecord('tasks', taskId);

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

  const deleteContentItem = async (itemId) => softDeleteRecord('content_items', itemId);

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
        let appt = appointments.find(a => a.id === createdPayment.appointment_id) || null;

        // Completing a session and recording its payment happen back-to-back in the UI.
        // React state may still contain the pre-completion appointment status, so verify
        // the source of truth before deciding whether customer conversion is eligible.
        if (!appt || appt.status !== 'completed') {
          const { data: dbAppointment, error: appointmentLookupError } = await supabase
            .from('appointments')
            .select('id, status, person_id, patient_id')
            .eq('id', createdPayment.appointment_id)
            .maybeSingle();

          if (appointmentLookupError) {
            console.error("Error checking appointment after payment:", appointmentLookupError);
          } else if (dbAppointment) {
            appt = dbAppointment;
          }
        }

        if (appt?.status === 'completed') {
          let conversionPersonId = createdPayment.person_id || appt.person_id || null;

          if (!conversionPersonId && appt.patient_id) {
            conversionPersonId = patients.find(patient => patient.id === appt.patient_id)?.person_id || null;
          }

          if (conversionPersonId) {
            await triggerCustomerConversionIfEligible(conversionPersonId);
          }
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
    const payload = { ...updates };
    if (updates.patient_id) {
      const patient = patients.find(p => p.id === updates.patient_id);
      if (patient?.person_id) payload.person_id = patient.person_id;
    }
    const { data, error } = await supabase.from('payments').update(payload).eq('id', paymentId).select();
    if (error) {
      console.error("Error updating payment:", error);
      throw error;
    }
    if (data && data[0]) {
      const updatedPayment = data[0];
      setPayments(prev => prev.map(p => p.id === paymentId ? updatedPayment : p));

      if (updatedPayment.status === 'paid' && updatedPayment.appointment_id) {
        const appt = appointments.find(a => a.id === updatedPayment.appointment_id);
        if (appt && appt.status === 'completed') {
          let personId = updatedPayment.person_id || appt.person_id || null;
          if (!personId && appt.patient_id) {
            const patient = patients.find(p => p.id === appt.patient_id);
            personId = patient?.person_id || null;
          }
          if (personId) {
            await triggerCustomerConversionIfEligible(personId);
          }
        }
      }
    }
  };

  const deletePayment = async (paymentId) => softDeleteRecord('payments', paymentId);

  const updatePaymentStatus = async (paymentId, newStatus) => {
    const existingPayment = payments.find(p => p.id === paymentId);
    const { data, error } = await supabase
      .from('payments')
      .update({ status: newStatus })
      .eq('id', paymentId)
      .select();

    if (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }

    const updatedPayment = data?.[0] || (existingPayment ? { ...existingPayment, status: newStatus } : null);
    setPayments(prev => prev.map(p => p.id === paymentId ? (updatedPayment || { ...p, status: newStatus }) : p));

    if (newStatus === 'paid' && updatedPayment?.appointment_id) {
      const appt = appointments.find(a => a.id === updatedPayment.appointment_id);
      if (appt && appt.status === 'completed') {
        let personId = updatedPayment.person_id || appt.person_id || null;
        if (!personId && appt.patient_id) {
          const patient = patients.find(p => p.id === appt.patient_id);
          personId = patient?.person_id || null;
        }
        if (personId) {
          await triggerCustomerConversionIfEligible(personId);
        }
      }
    }
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

  const deleteExpense = async (expenseId) => softDeleteRecord('expenses', expenseId);

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

  const updateFormSubmission = async (submissionId, updates) => {
    const payload = { ...updates };

    if (updates.person_id !== undefined) {
      const personId = updates.person_id || null;
      payload.person_id = personId;
      const linkedPatient = personId ? patients.find(p => p.person_id === personId) : null;
      const linkedLead = personId ? leads.find(l => l.person_id === personId) : null;
      payload.patient_id = linkedPatient?.id || null;
      payload.lead_id = linkedLead?.id || null;
    }

    const { data, error } = await supabase
      .from('form_submissions')
      .update(payload)
      .eq('id', submissionId)
      .select();

    if (error) {
      console.error("Error updating form submission:", error);
      throw error;
    }

    if (data?.[0]) {
      setFormSubmissions(prev => prev.map(item => item.id === submissionId ? data[0] : item));
      return data[0];
    }
    return null;
  };

  const deleteFormSubmission = async (submissionId) => softDeleteRecord('form_submissions', submissionId);

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
    const notesByPatient = new Map();
    const documentsByPatient = new Map();

    clinicalNotes.forEach(note => {
      if (!note?.patient_id) return;
      const current = notesByPatient.get(note.patient_id) || [];
      current.push(note);
      notesByPatient.set(note.patient_id, current);
    });

    patientDocuments.forEach(document => {
      if (!document?.patient_id) return;
      const current = documentsByPatient.get(document.patient_id) || [];
      current.push(document);
      documentsByPatient.set(document.patient_id, current);
    });

    return patients.map(pt => {
      const person = peopleMap.get(pt.person_id) || {};
      return {
        ...pt,
        full_name: person.full_name || '',
        phone: person.phone || '',
        normalized_phone: person.normalized_phone || '',
        email: person.email || '',
        normalized_email: person.normalized_email || '',
        client_status: person.client_status || 'lead',
        customer_since: person.customer_since,
        clinical_notes: notesByPatient.get(pt.id) || [],
        documents: documentsByPatient.get(pt.id) || []
      };
    });
  }, [patients, people, clinicalNotes, patientDocuments]);

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

  const isWithinBusinessHours = (dateTimeStr, durationMinutes = 0) => {
    if (!dateTimeStr) return false;
    const dt = new Date(dateTimeStr);
    if (Number.isNaN(dt.getTime())) return false;

    const startParts = getIsraelDateParts(dt);
    const endParts = getIsraelDateParts(new Date(dt.getTime() + Number(durationMinutes || 0) * 60000));
    const hours = businessHours.find(h => h.dayOfWeek === startParts.weekday);

    if (!hours || !hours.isOpen) return false;

    const startTime = `${startParts.hour}:${startParts.minute}`;
    const endTime = `${endParts.hour}:${endParts.minute}`;
    const sameBusinessDate =
      startParts.year === endParts.year &&
      startParts.month === endParts.month &&
      startParts.day === endParts.day;

    return sameBusinessDate && startTime >= hours.startTime && endTime <= hours.endTime;
  };

  const isTimeSlotAvailable = (dateTimeStr, durationMinutes = 30, excludeAppointmentId = null) => {
    const dt = new Date(dateTimeStr);
    if (Number.isNaN(dt.getTime())) return false;
    const endTime = new Date(dt.getTime() + Number(durationMinutes || 30) * 60000);

    const conflictsWithAppointment = appointments.some(appt => {
      if (!appt || appt.id === excludeAppointmentId) return false;
      if (appt.status === 'cancelled' || appt.status === 'rescheduled') return false;

      const apptStart = new Date(appt.appointment_date);
      if (Number.isNaN(apptStart.getTime())) return false;

      let apptEnd = appt.end_date ? new Date(appt.end_date) : null;
      if (!apptEnd || Number.isNaN(apptEnd.getTime())) {
        const service = services.find(s => String(s.id) === String(appt.service_id));
        const apptDuration = Number(service?.duration_minutes || 30);
        apptEnd = new Date(apptStart.getTime() + apptDuration * 60000);
      }

      return dt < apptEnd && endTime > apptStart;
    });

    if (conflictsWithAppointment) return false;

    const conflictsWithExternalBusy = calendarBlocks.some(block => {
      if (!block || block.deleted_at || block.busy === false) return false;
      const blockStart = new Date(block.starts_at);
      const blockEnd = new Date(block.ends_at);
      if (Number.isNaN(blockStart.getTime()) || Number.isNaN(blockEnd.getTime())) return false;
      return dt < blockEnd && endTime > blockStart;
    });

    return !conflictsWithExternalBusy;
  };

  const getAvailableSlotsForDate = (dateStr, durationMinutes = 30) => {
    if (!dateStr) return [];

    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_TIME_ZONE,
      weekday: 'long'
    }).format(new Date(`${dateStr}T12:00:00Z`));

    const hours = businessHours.find(h => h.dayOfWeek === weekday);
    if (!hours || !hours.isOpen) return [];

    const toMinutes = (time) => {
      const [hour, minute] = String(time).split(':').map(Number);
      return hour * 60 + minute;
    };
    const toTime = (minutes) =>
      `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

    const startMinutes = toMinutes(hours.startTime);
    const endMinutes = toMinutes(hours.endTime);
    const slots = [];

    for (let current = startMinutes; current + Number(durationMinutes || 30) <= endMinutes; current += 30) {
      const timeDisplay = toTime(current);
      const candidateIso = buildIsraelIsoTimestamp(dateStr, timeDisplay);
      if (isTimeSlotAvailable(candidateIso, durationMinutes)) {
        slots.push(timeDisplay);
      }
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
      setClinicalNotes(prev => [data[0], ...prev]);
      return data[0];
    }
    return null;
  };

  const addPatientDocument = async (patientId, docName, docUrl) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) throw new Error('לא נמצא תיק טיפולי תקין');
    if (!docName?.trim()) throw new Error('שם המסמך נדרש');
    if (!docUrl || docUrl === '#') {
      throw new Error('יש לצרף קישור או קובץ אמיתי לפני שמירת מסמך');
    }

    const newDoc = {
      person_id: patient.person_id || null,
      patient_id: patientId,
      name: docName.trim(),
      file_url: docUrl,
      uploaded_at: todayStr
    };
    const { data, error } = await supabase.from('patient_documents').insert([newDoc]).select();
    if (error) {
      console.error("Error adding document:", error);
      throw error;
    }
    if (data && data[0]) {
      setPatientDocuments(prev => [data[0], ...prev]);
      return data[0];
    }
    return null;
  };

  const addLeadCommunication = async (leadOrPersonId, type, note) => {
    const targetLead = leads.find(l => l.id === leadOrPersonId || l.person_id === leadOrPersonId) || null;
    const targetPersonId =
      targetLead?.person_id ||
      people.find(person => person.id === leadOrPersonId)?.id ||
      null;

    if (!targetLead && !targetPersonId) {
      throw new Error('לא נמצא איש קשר תקין לשיוך התקשורת');
    }

    const newComm = {
      lead_id: targetLead?.id || null,
      person_id: targetPersonId,
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
      if (targetLead) {
        setLeads(prev => prev.map(l => {
          if (l.id === targetLead.id) {
            const comms = l.communication_log || [];
            return { ...l, communication_log: [createdComm, ...comms] };
          }
          return l;
        }));
      }
      return createdComm;
    }
    return null;
  };

  const updateLeadFollowUp = async (leadId, followUpDate, lostReason = null) => {
    const updates = {
      follow_up_date: followUpDate || null,
      lost_reason: lostReason || null
    };
    
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
      tasks, projects, contentItems, payments, expenses, forms, formSubmissions, leadCommunications, bookingSettings, patientPackages, calendarBlocks, workOptions,

      addPatient, updatePatient, deletePatient, deletePerson, addClinicalNote, addPatientDocument, addLeadCommunication, updateLeadFollowUp,
      addService, updateService, deleteService, addAppointment, updateAppointment, deleteAppointment, updateAppointmentStatus, addLead, deleteLead,
      addWorkOption, updateWorkOption,
      addProject, updateProject, deleteProject,
      addTask, updateTask, updateTaskStatus, deleteTask,
      subscribePerformanceList,
      addContentItem, updateContentItem, deleteContentItem,
      addPayment, updatePayment, deletePayment, updatePaymentStatus, 
      addExpense, updateExpense, deleteExpense, 
      addForm, updateForm, addFormSubmission, updateFormSubmission, deleteFormSubmission, updateBookingSettings,
      issuePackageToPatient, redeemPackageSession, triggerCustomerConversionIfEligible,
      updateLeadStatus, updateBusinessHour, getAvailableSlotsForDate,
      getPatientName, getServiceName, getPaymentForAppointment, 
      isWithinBusinessHours, isTimeSlotAvailable,
      tasksDueToday, revenueThisMonth, todayStr, setPatients, setLeads,
      softDeleteRecord, restoreRecord, refreshData: fetchInitialData
    }}>
      {children}
    </ClinicContext.Provider>
  );
};
