-- ========================================================
-- Clinify Master Supabase PostgreSQL Database Schema
-- Run this script in your Supabase SQL Editor to generate the full database structure.
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  allow_packages boolean DEFAULT true,
  allow_pay_at_clinic boolean DEFAULT true,
  require_policy boolean DEFAULT true,
  cancellation_policy_text text DEFAULT 'ביטול תור יתאפשר עד 24 שעות מראש. ביטול במעמד קצר יותר יחויב במחצית משווי הטיפול.',
  welcome_message text DEFAULT 'ברוכים הבאים לעמוד זימון התורים הציבורי. אנא בחרו שירות ומועד נוח.',
  clinic_address text DEFAULT 'הרצל 15, תל אביב (בניין B, קומה 3)',
  logo_url text DEFAULT '/clinify-logo.png',
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Business Hours (Clinic Operating Schedule)
CREATE TABLE IF NOT EXISTS business_hours (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  day_index integer NOT NULL, -- 0=Sunday, 6=Saturday
  day_of_week text NOT NULL,
  is_open boolean DEFAULT true,
  start_time time NOT NULL DEFAULT '09:00',
  end_time time NOT NULL DEFAULT '17:00'
);

-- 4. Unified Offerings Catalog (Services, Packages, Products, Subscriptions)
CREATE TABLE IF NOT EXISTS services (
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
CREATE TABLE IF NOT EXISTS patients (
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
CREATE TABLE IF NOT EXISTS patient_packages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  name text NOT NULL,
  total_sessions integer NOT NULL DEFAULT 10,
  remaining_sessions integer NOT NULL DEFAULT 10,
  purchased_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  appointment_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  notes text,
  status text DEFAULT 'scheduled', -- 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  source text DEFAULT 'internal', -- 'internal' | 'public_booking'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Patient SOAP Clinical Notes
CREATE TABLE IF NOT EXISTS patient_clinical_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  author text DEFAULT 'ד"ר אוקונסקי',
  subjective text,
  objective text,
  assessment text,
  plan text,
  content text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Patient Documents (Medical Files & Attachments)
CREATE TABLE IF NOT EXISTS patient_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  file_size text,
  mime_type text,
  uploaded_at date DEFAULT CURRENT_DATE
);

-- 10. Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text NOT NULL,
  source text DEFAULT 'Website',
  status text DEFAULT 'new', -- 'new' | 'contacted' | 'scheduled' | 'won' | 'lost'
  follow_up_date date,
  lost_reason text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Lead Communications Log
CREATE TABLE IF NOT EXISTS lead_communications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'call' | 'whatsapp' | 'email'
  note text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Payments Ledger (Universal Checkout Income)
CREATE TABLE IF NOT EXISTS payments (
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
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  amount numeric(10,2) NOT NULL,
  payment_method text NOT NULL,
  expense_date date DEFAULT CURRENT_DATE
);

-- 14. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date NOT NULL,
  status text DEFAULT 'todo', -- 'todo' | 'done'
  priority text DEFAULT 'medium', -- 'low' | 'medium' | 'high'
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Forms Table (Dynamic Intake Questionnaires)
CREATE TABLE IF NOT EXISTS forms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Form Submissions Table
CREATE TABLE IF NOT EXISTS form_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id uuid REFERENCES forms(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- Atomic Stored Procedures (RPC Functions)
-- ========================================================

-- Redeem 1 session from active package
CREATE OR REPLACE FUNCTION redeem_package_session(p_package_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE patient_packages
  SET remaining_sessions = remaining_sessions - 1
  WHERE id = p_package_id AND remaining_sessions > 0;
END;
$$ LANGUAGE plpgsql;

-- Issue package to patient upon purchase
CREATE OR REPLACE FUNCTION issue_package_to_patient(p_patient_id uuid, p_catalog_item_id uuid)
RETURNS uuid AS $$
DECLARE
  v_item record;
  v_new_id uuid;
BEGIN
  SELECT name, session_count FROM services WHERE id = p_catalog_item_id INTO v_item;
  INSERT INTO patient_packages (patient_id, name, total_sessions, remaining_sessions)
  VALUES (p_patient_id, v_item.name, COALESCE(v_item.session_count, 10), COALESCE(v_item.session_count, 10))
  RETURNING id INTO v_new_id;
  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;

-- Initial Demo Data Seed
INSERT INTO services (name, description, duration_minutes, default_price, type, session_count) VALUES
('טיפול פיזיותרפיה מקיף', 'אבחון וטיפול 45 דק', 45, 250.00, 'service', NULL),
('כרטיסיית 10 טיפולים', 'חבילה מוזלת של 10 מפגשים', 45, 2100.00, 'package', 10),
('משחת תנועה ושיקום 100 מ"ל', 'ציוד נלווה לטיפול בבית', 0, 85.00, 'product', NULL),
('תוכנית ליווי חודשית VIP', 'סדרת טיפולים ומעקב זמין ב-WhatsApp', 60, 1500.00, 'subscription', NULL)
ON CONFLICT DO NOTHING;
