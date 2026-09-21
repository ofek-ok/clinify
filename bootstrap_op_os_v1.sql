-- ========================================================
-- OP OS V1 Master Database Bootstrap & Schema Extension
-- Project: calify (stwgtsmdtjfwfkibzdlh)
-- Canonical Identity Architecture (people) & Complete Business Engine
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

BEGIN;

-- --------------------------------------------------------
-- 1. Safely Create or Update Core Application Tables
-- --------------------------------------------------------

-- 1. Clinics (Multi-tenant Organization Profiles)
CREATE TABLE IF NOT EXISTS clinics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Booking Settings (Public Portal Config)
CREATE TABLE IF NOT EXISTS booking_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  allow_packages boolean DEFAULT false,
  allow_pay_at_clinic boolean DEFAULT true,
  require_policy boolean DEFAULT true,
  cancellation_policy_text text DEFAULT 'ביטול תור יתאפשר עד 24 שעות מראש.',
  welcome_message text DEFAULT 'ברוכים הבאים לעמוד זימון התורים הציבורי. אנא בחרו שירות ומועד נוח.',
  clinic_address text DEFAULT '',
  logo_url text DEFAULT '',
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Business Hours (Clinic Operating Schedule)
CREATE TABLE IF NOT EXISTS business_hours (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  day_index integer UNIQUE NOT NULL, -- 0=Sunday, 6=Saturday
  day_of_week text NOT NULL,
  is_open boolean DEFAULT true,
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '17:00'
);

-- 4. Offerings Catalog (Services, Packages, Products, Subscriptions)
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 45,
  default_price numeric(10,2) NOT NULL DEFAULT 0.00,
  type text NOT NULL DEFAULT 'service',
  session_count integer,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Canonical People Table (Single Stable Identity Across OP OS)
CREATE TABLE IF NOT EXISTS people (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  normalized_email text,
  phone text NOT NULL,
  normalized_phone text NOT NULL,
  client_status text NOT NULL DEFAULT 'lead', -- 'lead' | 'qualified' | 'customer' | 'inactive'
  customer_since timestamp with time zone,
  source text DEFAULT 'Website',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_people_normalized_phone ON people (normalized_phone);
CREATE UNIQUE INDEX IF NOT EXISTS idx_people_normalized_email ON people (normalized_email) WHERE normalized_email IS NOT NULL;

-- 6. Patients Table (Clinical Profile Linked to Canonical Person)
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id uuid UNIQUE NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  status text DEFAULT 'active',
  medical_history text,
  allergies text,
  emergency_contact text,
  tags text[],
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Patient Packages (Punch Cards & Session Balances)
CREATE TABLE IF NOT EXISTS patient_packages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  name text NOT NULL,
  total_sessions integer NOT NULL DEFAULT 10,
  remaining_sessions integer NOT NULL DEFAULT 10,
  purchased_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  appointment_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  notes text,
  status text DEFAULT 'scheduled', -- 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled'
  source text DEFAULT 'internal', -- 'internal' | 'public_booking'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Patient SOAP Clinical Notes
CREATE TABLE IF NOT EXISTS patient_clinical_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id uuid REFERENCES people(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  author text DEFAULT 'מטפל/ת',
  subjective text,
  objective text,
  assessment text,
  plan text,
  content text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Patient Documents
CREATE TABLE IF NOT EXISTS patient_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id uuid REFERENCES people(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  file_size text,
  mime_type text,
  uploaded_at date DEFAULT CURRENT_DATE
);

-- 11. Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  source text DEFAULT 'Website',
  status text DEFAULT 'new', -- 'new' | 'contacted' | 'scheduled' | 'won' | 'lost'
  follow_up_date date,
  lost_reason text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Lead Communications Log
CREATE TABLE IF NOT EXISTS lead_communications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'phone_call' | 'whatsapp' | 'email'
  note text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Payments Ledger
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id uuid REFERENCES people(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  appointment_id uuid REFERENCES appointments(id) ON DELETE SET NULL,
  catalog_item_id uuid REFERENCES services(id) ON DELETE SET NULL,
  item_type text DEFAULT 'service',
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL,
  status text DEFAULT 'paid', -- 'paid' | 'pending' | 'failed' | 'refunded'
  payment_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  invoice_number text
);

-- 14. Expenses Ledger
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL,
  expense_date date DEFAULT CURRENT_DATE
);

-- 15. Projects Table (Central Outcomes Engine - Block 2)
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  objective text,
  status text DEFAULT 'active', -- 'planned' | 'active' | 'blocked' | 'completed' | 'on_hold'
  start_date date,
  due_date date,
  progress integer DEFAULT 0, -- 0-100%
  area text DEFAULT 'business', -- 'clinical' | 'business' | 'content' | 'operations'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Content Items Table (Content OS - Block 4)
CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  title text NOT NULL,
  platform text NOT NULL, -- 'instagram' | 'youtube' | 'linkedin' | 'newsletter' | 'website' | 'podcast'
  format text, -- 'reel' | 'post' | 'article' | 'video' | 'story'
  audience text DEFAULT 'both', -- 'athletes' | 'professionals' | 'both'
  objective text DEFAULT 'awareness', -- 'awareness' | 'trust' | 'conversion'
  status text DEFAULT 'idea', -- 'idea' | 'planned' | 'in_production' | 'ready' | 'scheduled' | 'published' | 'archived'
  stage text DEFAULT 'research', -- 'research' | 'writing' | 'design' | 'review' | 'ready'
  publish_date timestamp with time zone,
  campaign text,
  cta text,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 17. Tasks Table (Central Action Engine - Block 2)
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  person_id uuid REFERENCES people(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date NOT NULL,
  status text DEFAULT 'todo', -- 'todo' | 'in_progress' | 'blocked' | 'done'
  priority text DEFAULT 'medium', -- 'critical' | 'high' | 'medium' | 'low'
  area text DEFAULT 'operations', -- 'clinical' | 'business' | 'content' | 'operations'
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  content_item_id uuid REFERENCES content_items(id) ON DELETE SET NULL,
  dependency_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 18. Performance List Table (Pre-launch Acquisition - Block 3)
CREATE TABLE IF NOT EXISTS performance_list (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id uuid UNIQUE NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  consent_timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  privacy_version text DEFAULT 'v1',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 19. Forms Table
CREATE TABLE IF NOT EXISTS forms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 20. Form Submissions Table
CREATE TABLE IF NOT EXISTS form_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id uuid REFERENCES forms(id) ON DELETE CASCADE,
  person_id uuid REFERENCES people(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------------------
-- 2. Row Level Security & Access Policies
-- --------------------------------------------------------
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Authenticated Full Access Policies
DROP POLICY IF EXISTS "Authenticated users full access on clinics" ON clinics;
CREATE POLICY "Authenticated users full access on clinics" ON clinics FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on booking_settings" ON booking_settings;
CREATE POLICY "Authenticated users full access on booking_settings" ON booking_settings FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on business_hours" ON business_hours;
CREATE POLICY "Authenticated users full access on business_hours" ON business_hours FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on services" ON services;
CREATE POLICY "Authenticated users full access on services" ON services FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on people" ON people;
CREATE POLICY "Authenticated users full access on people" ON people FOR ALL TO authenticated USING (true);

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

DROP POLICY IF EXISTS "Authenticated users full access on projects" ON projects;
CREATE POLICY "Authenticated users full access on projects" ON projects FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on content_items" ON content_items;
CREATE POLICY "Authenticated users full access on content_items" ON content_items FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on tasks" ON tasks;
CREATE POLICY "Authenticated users full access on tasks" ON tasks FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on performance_list" ON performance_list;
CREATE POLICY "Authenticated users full access on performance_list" ON performance_list FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on forms" ON forms;
CREATE POLICY "Authenticated users full access on forms" ON forms FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on form_submissions" ON form_submissions;
CREATE POLICY "Authenticated users full access on form_submissions" ON form_submissions FOR ALL TO authenticated USING (true);

-- Public Anonymous Policies
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

-- --------------------------------------------------------
-- 3. Security Definer RPC Functions
-- --------------------------------------------------------

-- Internal Package Session Deduction Function
CREATE OR REPLACE FUNCTION redeem_package_session(p_package_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE patient_packages
  SET remaining_sessions = remaining_sessions - 1
  WHERE id = p_package_id AND remaining_sessions > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION redeem_package_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION redeem_package_session(uuid) TO authenticated;

-- Internal Customer Conversion Function (Executes when First Session is Completed + Paid)
CREATE OR REPLACE FUNCTION convert_lead_to_customer(p_person_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE people
  SET client_status = 'customer',
      customer_since = COALESCE(customer_since, timezone('utc'::text, now())),
      updated_at = timezone('utc'::text, now())
  WHERE id = p_person_id;

  UPDATE leads
  SET status = 'won'
  WHERE person_id = p_person_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION convert_lead_to_customer(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION convert_lead_to_customer(uuid) TO authenticated;

-- Public Booking RPC Function
CREATE OR REPLACE FUNCTION public_create_booking(
  p_service_id uuid,
  p_appointment_date timestamp with time zone,
  p_full_name text,
  p_phone text,
  p_email text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_clean_phone text;
  v_clean_email text;
  v_person_id uuid;
  v_patient_id uuid;
  v_lead_id uuid;
  v_appointment_id uuid;
  v_phone_person record;
  v_email_person record;
  v_service record;
  v_end_date timestamp with time zone;
  v_conflict_count integer;
BEGIN
  v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');
  IF length(v_clean_phone) < 7 THEN
    RAISE EXCEPTION 'מספר טלפון אינו תקין';
  END IF;

  IF p_email IS NOT NULL AND trim(p_email) != '' THEN
    v_clean_email := lower(trim(p_email));
  END IF;

  SELECT * FROM services WHERE id = p_service_id INTO v_service;
  IF v_service IS NULL THEN
    RAISE EXCEPTION 'שירות לא נמצא';
  END IF;

  v_end_date := p_appointment_date + (COALESCE(v_service.duration_minutes, 30) || ' minutes')::interval;

  SELECT count(*) FROM appointments
  WHERE status != 'cancelled'
    AND (
      (appointment_date < v_end_date AND COALESCE(end_date, appointment_date + (30 || ' minutes')::interval) > p_appointment_date)
    )
  INTO v_conflict_count;

  IF v_conflict_count > 0 THEN
    RAISE EXCEPTION 'מועד זה אינו פנוי יותר. אנא בחר מועד אחר.';
  END IF;

  SELECT * FROM people WHERE normalized_phone = v_clean_phone LIMIT 1 INTO v_phone_person;
  IF v_clean_email IS NOT NULL THEN
    SELECT * FROM people WHERE normalized_email = v_clean_email LIMIT 1 INTO v_email_person;
  END IF;

  IF v_phone_person IS NOT NULL AND v_email_person IS NOT NULL AND v_phone_person.id != v_email_person.id THEN
    RAISE EXCEPTION 'Identity Conflict: Phone and Email belong to two different existing profiles.';
  END IF;

  IF v_phone_person IS NOT NULL THEN
    v_person_id := v_phone_person.id;
  ELSIF v_email_person IS NOT NULL THEN
    v_person_id := v_email_person.id;
  ELSE
    INSERT INTO people (
      full_name, phone, normalized_phone, email, normalized_email, client_status, source
    ) VALUES (
      p_full_name, p_phone, v_clean_phone, p_email, v_clean_email, 'lead', 'Public Booking'
    )
    RETURNING id INTO v_person_id;
  END IF;

  SELECT id FROM patients WHERE person_id = v_person_id LIMIT 1 INTO v_patient_id;
  IF v_patient_id IS NULL THEN
    INSERT INTO patients (person_id, status)
    VALUES (v_person_id, 'active')
    RETURNING id INTO v_patient_id;
  END IF;

  SELECT id FROM leads WHERE person_id = v_person_id LIMIT 1 INTO v_lead_id;
  IF v_lead_id IS NULL THEN
    INSERT INTO leads (person_id, source, status)
    VALUES (v_person_id, 'Public Booking', 'scheduled')
    RETURNING id INTO v_lead_id;
  ELSE
    UPDATE leads 
    SET status = 'scheduled'
    WHERE id = v_lead_id AND status IN ('new', 'contacted');
  END IF;

  INSERT INTO appointments (
    person_id, patient_id, service_id, appointment_date, end_date, notes, status, source
  ) VALUES (
    v_person_id, v_patient_id, p_service_id, p_appointment_date, v_end_date, p_notes, 'scheduled', 'public_booking'
  )
  RETURNING id INTO v_appointment_id;

  RETURN jsonb_build_object(
    'success', true,
    'appointment_date', p_appointment_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public_create_booking(uuid, timestamp with time zone, text, text, text, text) TO anon, authenticated;

-- Public Performance List Pre-launch Signup RPC (Block 3)
CREATE OR REPLACE FUNCTION public_subscribe_performance_list(
  p_full_name text,
  p_email text,
  p_phone text DEFAULT NULL,
  p_utm_source text DEFAULT NULL,
  p_utm_medium text DEFAULT NULL,
  p_utm_campaign text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_clean_phone text;
  v_clean_email text;
  v_person_id uuid;
  v_phone_person record;
  v_email_person record;
BEGIN
  IF (p_email IS NULL OR trim(p_email) = '') AND (p_phone IS NULL OR trim(p_phone) = '') THEN
    RAISE EXCEPTION 'דוא"ל או טלפון נדרשים להרשמה';
  END IF;

  IF p_phone IS NOT NULL AND trim(p_phone) != '' THEN
    v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');
  END IF;

  IF p_email IS NOT NULL AND trim(p_email) != '' THEN
    v_clean_email := lower(trim(p_email));
  END IF;

  IF v_clean_phone IS NOT NULL THEN
    SELECT * FROM people WHERE normalized_phone = v_clean_phone LIMIT 1 INTO v_phone_person;
  END IF;

  IF v_clean_email IS NOT NULL THEN
    SELECT * FROM people WHERE normalized_email = v_clean_email LIMIT 1 INTO v_email_person;
  END IF;

  IF v_phone_person IS NOT NULL THEN
    v_person_id := v_phone_person.id;
  ELSIF v_email_person IS NOT NULL THEN
    v_person_id := v_email_person.id;
  ELSE
    INSERT INTO people (
      full_name, phone, normalized_phone, email, normalized_email, client_status, source
    ) VALUES (
      p_full_name, COALESCE(p_phone, ''), COALESCE(v_clean_phone, ''), p_email, v_clean_email, 'lead', 'Performance List'
    ) RETURNING id INTO v_person_id;
  END IF;

  INSERT INTO performance_list (
    person_id, utm_source, utm_medium, utm_campaign
  ) VALUES (
    v_person_id, p_utm_source, p_utm_medium, p_utm_campaign
  ) ON CONFLICT (person_id) DO UPDATE SET
    utm_source = EXCLUDED.utm_source,
    utm_medium = EXCLUDED.utm_medium,
    utm_campaign = EXCLUDED.utm_campaign;

  RETURN jsonb_build_object('success', true, 'person_id', v_person_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public_subscribe_performance_list(text, text, text, text, text, text) TO anon, authenticated;

COMMIT;
