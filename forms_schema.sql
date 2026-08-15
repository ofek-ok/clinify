-- Run this entire script in your Supabase SQL Editor to create the Forms tables.

-- 1. Create Forms Table
CREATE TABLE forms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Form Submissions Table
CREATE TABLE form_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id uuid REFERENCES forms(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES patients(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Disable Row Level Security (RLS) for initial MVP development
-- Warning: In a production app, you should enable RLS and write policies.
ALTER TABLE forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions DISABLE ROW LEVEL SECURITY;

-- 4. Insert a default demo form to get started
INSERT INTO forms (title, description, fields) VALUES
('Medical History Intake', 'Please fill out your basic medical history before your first appointment.', 
'[
  {"id": "f1", "type": "text", "label": "Full Name", "required": true},
  {"id": "f2", "type": "tel", "label": "Phone Number", "required": true},
  {"id": "f3", "type": "textarea", "label": "Current Medications", "required": false},
  {"id": "f4", "type": "dropdown", "label": "Blood Type", "required": false, "options": ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]},
  {"id": "f5", "type": "checkbox", "label": "Do you smoke?", "required": false}
]'::jsonb);
