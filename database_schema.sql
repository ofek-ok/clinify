-- Run this entire script in your Supabase SQL Editor to generate your database.

-- 1. Create Patients Table
CREATE TABLE patients (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  email text,
  phone text NOT NULL,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Services Table
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 30,
  default_price numeric NOT NULL DEFAULT 0.00
);

-- 3. Create Appointments Table
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE CASCADE,
  appointment_date timestamp without time zone NOT NULL,
  status text DEFAULT 'scheduled',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Leads Table
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL,
  email text,
  phone text NOT NULL,
  source text DEFAULT 'Website',
  status text DEFAULT 'new',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Tasks Table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  due_date date NOT NULL,
  status text DEFAULT 'todo',
  priority text DEFAULT 'medium',
  patient_id uuid REFERENCES patients(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create Payments Table
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id uuid REFERENCES appointments(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  payment_method text NOT NULL,
  status text DEFAULT 'paid',
  payment_date timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Disable Row Level Security (RLS) for initial MVP development
-- Warning: In a production app with auth, you should enable RLS and write policies.
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Insert some dummy data to get started
INSERT INTO services (name, description, duration_minutes, default_price) VALUES
('General Consultation', 'Initial or standard checkup', 30, 150.00),
('Specialist Review', 'In-depth specialist analysis', 60, 300.00);
