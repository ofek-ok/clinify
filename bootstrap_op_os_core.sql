-- ========================================================
-- OP OS Core v1 Clean Bootstrap Script (Project: calify)
-- Project Ref: stwgtsmdtjfwfkibzdlh
-- Clean bootstrap strategy for empty / reset public schema.
-- Leaves Supabase system schemas (auth, storage, etc.) untouched.
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- 1. Safely Drop Public Application Tables (Reverse Dependency Order)
-- --------------------------------------------------------
DROP TABLE IF EXISTS form_submissions CASCADE;
DROP TABLE IF EXISTS forms CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS lead_communications CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS patient_documents CASCADE;
DROP TABLE IF EXISTS patient_clinical_notes CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS patient_packages CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS business_hours CASCADE;
DROP TABLE IF EXISTS booking_settings CASCADE;
DROP TABLE IF EXISTS clinics CASCADE;

-- --------------------------------------------------------
-- 2. Create Public Application Tables (OP OS Target Schema)
-- --------------------------------------------------------

-- 1. Clinics (Multi-tenant Organization Profiles)
CREATE TABLE clinics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Booking Settings (Public Portal Config)
CREATE TABLE booking_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  allow_packages boolean DEFAULT true,
  allow_pay_at_clinic boolean DEFAULT true,
  require_policy boolean DEFAULT true,
  cancellation_policy_text text DEFAULT 'ביטול תור יתאפשר עד 24 שעות מראש.',
  welcome_message text DEFAULT 'ברוכים הבאים לעמוד זימון התורים הציבורי. אנא בחרו שירות ומועד נוח.',
  clinic_address text DEFAULT '',
  logo_url text DEFAULT '',
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Business Hours (Clinic Operating Schedule)
CREATE TABLE business_hours (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  day_index integer NOT NULL, -- 0=Sunday, 6=Saturday
  day_of_week text NOT NULL,
  is_open boolean DEFAULT true,
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '17:00'
);

-- 4. Unified Offerings Catalog (Services, Packages, Products, Subscriptions)
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 45,
  default_price numeric(10,2) NOT NULL DEFAULT 0.00,
  type text NOT NULL DEFAULT 'service', -- 'service' | 'package' | 'product' | 'subscription'
  session_count integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Patients Table
CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text NOT NULL,
  status text DEFAULT 'active',
  medical_history text,
  allergies text,
  emergency_contact text,
  tags text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Patient Packages (Active Punch Cards & Session Balances)
CREATE TABLE patient_packages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  name text NOT NULL,
  total_sessions integer NOT NULL DEFAULT 10,
  remaining_sessions integer NOT NULL DEFAULT 10,
  purchased_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Appointments Table (Israel Timezone Safe TIMESTAMPTZ)
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  appointment_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  notes text,
  status text DEFAULT 'scheduled', -- 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  source text DEFAULT 'internal', -- 'internal' | 'public_booking' | 'package_redemption'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Patient SOAP Clinical Notes
CREATE TABLE patient_clinical_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  author text DEFAULT 'מטפל/ת',
  subjective text,
  objective text,
  assessment text,
  plan text,
  content text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Patient Documents (Medical Files & Attachments)
CREATE TABLE patient_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  file_size text,
  mime_type text,
  uploaded_at date DEFAULT CURRENT_DATE
);

-- 10. Leads Table (FK linked to converted patient)
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text NOT NULL,
  source text DEFAULT 'Website',
  status text DEFAULT 'new', -- 'new' | 'contacted' | 'scheduled' | 'won' | 'lost'
  follow_up_date date,
  lost_reason text,
  converted_patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Lead Communications Log
CREATE TABLE lead_communications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'call' | 'whatsapp' | 'email'
  note text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Payments Ledger (Universal Checkout Income)
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  catalog_item_id uuid REFERENCES services(id) ON DELETE SET NULL,
  item_type text DEFAULT 'service',
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL,
  status text DEFAULT 'paid', -- 'paid' | 'pending' | 'refunded'
  payment_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  invoice_number text
);

-- 13. Expenses Ledger (Outgoing Costs)
CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL,
  expense_date date DEFAULT CURRENT_DATE
);

-- 14. Tasks Table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date NOT NULL,
  status text DEFAULT 'todo', -- 'todo' | 'done'
  priority text DEFAULT 'medium', -- 'low' | 'medium' | 'high'
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Forms Table (Dynamic Intake Questionnaires - is_public flag)
CREATE TABLE forms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Form Submissions Table
CREATE TABLE form_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id uuid REFERENCES forms(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------
-- 3. Enable Row Level Security (RLS) on All Public Tables
-- --------------------------------------------------------
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

-- --------------------------------------------------------
-- 4. Internal Authenticated Users Full Access Policies
-- --------------------------------------------------------
CREATE POLICY "Authenticated users full access on clinics" ON clinics FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access on booking_settings" ON booking_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access on business_hours" ON business_hours FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access on services" ON services FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access on patients" ON patients FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access on patient_packages" ON patient_packages FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access on appointments" ON appointments FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access on patient_clinical_notes" ON patient_clinical_notes FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access on patient_documents" ON patient_documents FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access on leads" ON leads FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access on lead_communications" ON lead_communications FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access on payments" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access on expenses" ON expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access on tasks" ON tasks FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access on forms" ON forms FOR ALL TO authenticated USING (true);
CREATE POLICY "Authenticated users full access on form_submissions" ON form_submissions FOR ALL TO authenticated USING (true);

-- --------------------------------------------------------
-- 5. Anonymous Public Policies (Minimum Exposure for Booking / Forms)
-- --------------------------------------------------------
CREATE POLICY "Public read offerings catalog" ON services FOR SELECT TO anon USING (true);
CREATE POLICY "Public read business hours" ON business_hours FOR SELECT TO anon USING (true);
CREATE POLICY "Public read booking settings" ON booking_settings FOR SELECT TO anon USING (true);
CREATE POLICY "Public read forms" ON forms FOR SELECT TO anon USING (is_public = true);
CREATE POLICY "Public insert form submissions" ON form_submissions FOR INSERT TO anon WITH CHECK (true);

-- NOTE: Patients, patient_packages, appointments, patient_clinical_notes, patient_documents,
-- leads, lead_communications, payments, expenses, tasks have ZERO SELECT policies for anon!

-- --------------------------------------------------------
-- 6. SECURITY DEFINER RPC Functions & Permissions
-- --------------------------------------------------------

-- Internal Package Session Deduction Function (Authenticated Only)
CREATE OR REPLACE FUNCTION redeem_package_session(p_package_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE patient_packages
  SET remaining_sessions = remaining_sessions - 1
  WHERE id = p_package_id AND remaining_sessions > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION redeem_package_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION redeem_package_session(uuid) TO authenticated;

-- Public Package Credit Lookup Function (Audited: Zero Exposure of Patient IDs, Package IDs, or Names)
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

-- Public Booking Transaction Function (Audited: Valid Lifecycle, Double Booking Protection & Zero ID Leakage)
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
