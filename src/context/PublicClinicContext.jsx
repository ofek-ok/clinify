import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export const PublicClinicContext = createContext();

export const PublicClinicProvider = ({ children }) => {
  const [services, setServices] = useState([]);
  const [businessHours, setBusinessHours] = useState([]);
  const [bookingSettings, setBookingSettings] = useState({
    allowPackages: true,
    allowPayAtClinic: true,
    requirePolicy: true,
    cancellationPolicyText: 'ביטול תור יתאפשר עד 24 שעות מראש.',
    welcomeMessage: 'ברוכים הבאים לעמוד זימון התורים הציבורי. אנא בחרו שירות ומועד נוח.',
    clinicAddress: '',
    logoUrl: ''
  });
  const [forms, setForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchPublicData() {
      setIsLoading(true);
      try {
        const [servicesRes, hoursRes, settingsRes, formsRes] = await Promise.all([
          supabase.from('services').select('*'),
          supabase.from('business_hours').select('*'),
          supabase.from('booking_settings').select('*').maybeSingle(),
          supabase.from('forms').select('*').eq('is_public', true)
        ]);

        if (isMounted) {
          if (servicesRes.data) setServices(servicesRes.data);
          if (hoursRes.data) setBusinessHours(hoursRes.data);
          if (settingsRes.data) setBookingSettings(prev => ({ ...prev, ...settingsRes.data }));
          if (formsRes.data) setForms(formsRes.data);
        }
      } catch (err) {
        console.error("Public data fetch error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchPublicData();

    return () => {
      isMounted = false;
    };
  }, []);

  const subscribePerformanceList = async (input) => {
    const { data, error } = await supabase.rpc('public_subscribe_performance_list', {
      p_full_name: input.full_name || input.fullName,
      p_email: input.email || null,
      p_phone: input.phone || null,
      p_utm_source: input.utm_source || null,
      p_utm_medium: input.utm_medium || null,
      p_utm_campaign: input.utm_campaign || null
    });

    if (error) {
      console.error("Error submitting public signup:", error);
      throw error;
    }
    return data;
  };

  const createPublicBooking = async (input) => {
    const { data, error } = await supabase.rpc('public_create_booking', {
      p_service_id: input.serviceId || input.service_id,
      p_appointment_date: input.appointmentDate || input.appointment_date,
      p_full_name: input.fullName || input.full_name,
      p_phone: input.phone,
      p_email: input.email || null,
      p_notes: input.notes || null,
      p_use_package: input.usePackage || false
    });

    if (error) {
      console.error("Public booking error:", error);
      throw error;
    }
    return data;
  };

  return (
    <PublicClinicContext.Provider value={{
      services,
      businessHours,
      bookingSettings,
      forms,
      isLoading,
      subscribePerformanceList,
      createPublicBooking
    }}>
      {children}
    </PublicClinicContext.Provider>
  );
};
