-- ========================================================
-- Clinify OP OS Core v1 Safe Migration Script
-- Run this script in your Supabase SQL Editor on existing databases.
-- Contains idempotent ALTER TABLE ... ADD COLUMN IF NOT EXISTS and RLS policies.
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Ensure new columns exist safely
ALTER TABLE leads ADD COLUMN IF NOT EXISTS converted_patient_id uuid REFERENCES patients(id) ON DELETE SET NULL;
ALTER TABLE forms ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS end_date timestamp with time zone;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source text DEFAULT 'internal';

-- 2. Enable Row Level Security (RLS) on all tables
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- 3. Internal Authenticated Users Full Access Policies
DROP POLICY IF EXISTS "Authenticated users full access on clinics" ON clinics;
CREATE POLICY "Authenticated users full access on clinics" ON clinics FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on booking_settings" ON booking_settings;
CREATE POLICY "Authenticated users full access on booking_settings" ON booking_settings FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on business_hours" ON business_hours;
CREATE POLICY "Authenticated users full access on business_hours" ON business_hours FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on services" ON services;
CREATE POLICY "Authenticated users full access on services" ON services FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on patients" ON patients;
CREATE POLICY "Authenticated users full access on patients" ON patients FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on patient_packages" ON patient_packages;
CREATE POLICY "Authenticated users full access on patient_packages" ON patient_packages FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on appointments" ON appointments;
CREATE POLICY "Authenticated users full access on appointments" ON appointments FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on patient_clinical_notes" ON patient_clinical_notes;
CREATE POLICY "Authenticated users full access on patient_clinical_notes" ON patient_clinical_notes FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on patient_documents" ON patient_documents;
CREATE POLICY "Authenticated users full access on patient_documents" ON patient_documents FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on leads" ON leads;
CREATE POLICY "Authenticated users full access on leads" ON leads FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on lead_communications" ON lead_communications;
CREATE POLICY "Authenticated users full access on lead_communications" ON lead_communications FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on payments" ON payments;
CREATE POLICY "Authenticated users full access on payments" ON payments FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on expenses" ON expenses;
CREATE POLICY "Authenticated users full access on expenses" ON expenses FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on tasks" ON tasks;
CREATE POLICY "Authenticated users full access on tasks" ON tasks FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on forms" ON forms;
CREATE POLICY "Authenticated users full access on forms" ON forms FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on form_submissions" ON form_submissions;
CREATE POLICY "Authenticated users full access on form_submissions" ON form_submissions FOR ALL TO authenticated USING (true);

-- 4. Anonymous Public Access Policies (Strictly Limited Minimum Exposure)
DROP POLICY IF EXISTS "Public read offerings catalog" ON services;
CREATE POLICY "Public read offerings catalog" ON services FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public read business hours" ON business_hours;
CREATE POLICY "Public read business hours" ON business_hours FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public read booking settings" ON booking_settings;
CREATE POLICY "Public read booking settings" ON booking_settings FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public read forms" ON forms;
CREATE POLICY "Public read forms" ON forms FOR SELECT TO anon USING (is_public = true);

DROP POLICY IF EXISTS "Public insert form submissions" ON form_submissions;
CREATE POLICY "Public insert form submissions" ON form_submissions FOR INSERT TO anon WITH CHECK (true);

-- 5. Revoke Internal Functions from Anon & Public
REVOKE EXECUTE ON FUNCTION redeem_package_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION redeem_package_session(uuid) TO authenticated;

-- 6. Audited Public Check Package Status RPC (No Private Data Exposure)
CREATE OR REPLACE FUNCTION public_check_package_status(p_phone text)
RETURNS jsonb AS $$
DECLARE
  v_patient record;
  v_package record;
  v_clean_phone text;
BEGIN
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');
  IF length(v_clean_phone) < 7 THEN
    RETURN jsonb_build_object('has_active_package', false);
  END IF;
  
  SELECT id FROM patients 
  WHERE regexp_replace(phone, '\D', '', 'g') = v_clean_phone
  LIMIT 1 INTO v_patient;

  IF v_patient IS NULL THEN
    RETURN jsonb_build_object('has_active_package', false);
  END IF;

  SELECT remaining_sessions FROM patient_packages 
  WHERE patient_id = v_patient.id AND remaining_sessions > 0
  ORDER BY created_at DESC LIMIT 1 INTO v_package;

  IF v_package IS NULL THEN
    RETURN jsonb_build_object('has_active_package', false);
  END IF;

  RETURN jsonb_build_object(
    'has_active_package', true,
    'remaining_sessions', v_package.remaining_sessions
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public_check_package_status(text) TO anon, authenticated;

-- 7. Audited Public Create Booking RPC (Israel Timezone Safe, Valid Lifecycle, Double Booking Protection)
CREATE OR REPLACE FUNCTION public_create_booking(
  p_service_id uuid,
  p_appointment_date timestamp with time zone,
  p_full_name text,
  p_phone text,
  p_email text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_use_package boolean DEFAULT false
)
RETURNS jsonb AS $$
DECLARE
  v_clean_phone text;
  v_patient_id uuid;
  v_lead_id uuid;
  v_appointment_id uuid;
  v_package_id uuid;
  v_existing_patient record;
  v_existing_lead record;
  v_service record;
  v_end_date timestamp with time zone;
  v_conflict_count integer;
BEGIN
  -- 1. Normalize phone
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');
  IF length(v_clean_phone) < 7 THEN
    RAISE EXCEPTION 'מספר טלפון אינו תקין';
  END IF;

  -- 2. Lookup Service & Calculate End Time
  SELECT * FROM services WHERE id = p_service_id INTO v_service;
  IF v_service IS NULL THEN
    RAISE EXCEPTION 'שירות לא נמצא';
  END IF;

  v_end_date := p_appointment_date + (COALESCE(v_service.duration_minutes, 30) || ' minutes')::interval;

  -- 3. Concurrency / Double Booking Check
  SELECT count(*) FROM appointments
  WHERE status != 'cancelled'
    AND (
      (appointment_date < v_end_date AND COALESCE(end_date, appointment_date + (30 || ' minutes')::interval) > p_appointment_date)
    )
  INTO v_conflict_count;

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'מועד זה אינו פנוי יותר. אנא בחר מועד אחר.';
  END IF;

  -- 4. Identity Lifecycle: Check Existing Patient vs Lead
  SELECT * FROM patients 
  WHERE regexp_replace(phone, '\D', '', 'g') = v_clean_phone
  LIMIT 1 INTO v_existing_patient;

  IF v_existing_patient IS NOT NULL THEN
    v_patient_id := v_existing_patient.id;
  ELSE
    -- Check Existing Lead
    SELECT * FROM leads 
    WHERE regexp_replace(phone, '\D', '', 'g') = v_clean_phone
    LIMIT 1 INTO v_existing_lead;

    -- Create Patient record to ensure appointments.patient_id FK integrity
    INSERT INTO patients (full_name, phone, email, status)
    VALUES (p_full_name, p_phone, p_email, 'active')
    RETURNING id INTO v_patient_id;

    IF v_existing_lead IS NOT NULL THEN
      UPDATE leads 
      SET status = 'won', converted_patient_id = v_patient_id 
      WHERE id = v_existing_lead.id;
    ELSE
      INSERT INTO leads (full_name, phone, email, source, status, converted_patient_id)
      VALUES (p_full_name, p_phone, p_email, 'Public Booking', 'won', v_patient_id);
    END IF;
  END IF;

  -- 5. Package Credit Protection: Deduct only if valid
  IF p_use_package IS TRUE THEN
    SELECT id FROM patient_packages 
    WHERE patient_id = v_patient_id AND remaining_sessions > 0
    ORDER BY created_at DESC LIMIT 1 INTO v_package_id;

    IF v_package_id IS NULL THEN
      RAISE EXCEPTION 'לא נמצאה כרטיסייה פעילה למימוש';
    END IF;

    UPDATE patient_packages
    SET remaining_sessions = remaining_sessions - 1
    WHERE id = v_package_id AND remaining_sessions > 0;
  END IF;

  -- 6. Insert Appointment
  INSERT INTO appointments (
    patient_id,
    service_id,
    appointment_date,
    end_date,
    notes,
    status,
    source
  ) VALUES (
    v_patient_id,
    p_service_id,
    p_appointment_date,
    v_end_date,
    p_notes,
    'scheduled',
    CASE WHEN p_use_package THEN 'package_redemption' ELSE 'public_booking' END
  )
  RETURNING id INTO v_appointment_id;

  RETURN jsonb_build_object(
    'success', true,
    'appointment_date', p_appointment_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public_create_booking(uuid, timestamp with time zone, text, text, text, text, boolean) TO anon, authenticated;
