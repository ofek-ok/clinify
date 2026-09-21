-- ========================================================
-- Clinify Product Reset V1 — Incremental Migration
-- Target Project: calify (stwgtsmdtjfwfkibzdlh)
-- Idempotent schema additions for Leads, Tasks, Projects & Content
-- ========================================================

BEGIN;

-- 1. Extend Leads Table with Campaign & UTM Attribution Metadata
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign text DEFAULT 'General Inquiries';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags text[];

-- 2. Ensure Projects Table Exists
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  name text NOT NULL,
  objective text,
  status text DEFAULT 'active', -- 'planned' | 'active' | 'blocked' | 'on_hold' | 'completed'
  start_date date,
  due_date date,
  progress integer DEFAULT 0, -- 0-100%
  area text DEFAULT 'business', -- 'clinical' | 'business' | 'content' | 'operations'
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Ensure Content Items Table Exists
CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  title text NOT NULL,
  platform text NOT NULL DEFAULT 'instagram', -- 'instagram' | 'youtube' | 'linkedin' | 'newsletter' | 'website' | 'podcast'
  format text DEFAULT 'post', -- 'reel' | 'post' | 'article' | 'video' | 'story'
  audience text DEFAULT 'both', -- 'athletes' | 'professionals' | 'both'
  objective text DEFAULT 'awareness', -- 'awareness' | 'trust' | 'conversion'
  status text DEFAULT 'idea', -- 'idea' | 'planned' | 'in_production' | 'ready' | 'scheduled' | 'published'
  stage text DEFAULT 'research', -- 'research' | 'writing' | 'design' | 'review' | 'ready'
  publish_date timestamp with time zone,
  campaign text,
  cta text,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Extend Tasks Table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS content_item_id uuid REFERENCES content_items(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependency_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS area text DEFAULT 'operations';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';

-- 5. RLS Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users full access on projects" ON projects;
CREATE POLICY "Authenticated users full access on projects" ON projects FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users full access on content_items" ON content_items;
CREATE POLICY "Authenticated users full access on content_items" ON content_items FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Anon public access on projects" ON projects;
CREATE POLICY "Anon public access on projects" ON projects FOR ALL TO anon USING (true);

DROP POLICY IF EXISTS "Anon public access on content_items" ON content_items;
CREATE POLICY "Anon public access on content_items" ON content_items FOR ALL TO anon USING (true);

-- 6. Public Pre-Launch Signup RPC (Direct Lead & Person Creation + Identity Rules)
CREATE OR REPLACE FUNCTION public_subscribe_performance_list(
  p_full_name text,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_utm_source text DEFAULT NULL,
  p_utm_medium text DEFAULT NULL,
  p_utm_campaign text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_clean_phone text := NULL;
  v_clean_email text := NULL;
  v_person_id uuid := NULL;
  v_lead_id uuid := NULL;
  v_existing_person record;
  v_phone_person record;
  v_email_person record;
BEGIN
  -- DDL Auto-Execution Guard
  BEGIN
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS campaign text DEFAULT 'General Inquiries';
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_source text;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_medium text;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS utm_campaign text;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags text[];

    CREATE TABLE IF NOT EXISTS projects (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
      name text NOT NULL,
      objective text,
      status text DEFAULT 'active',
      start_date date,
      due_date date,
      progress integer DEFAULT 0,
      area text DEFAULT 'business',
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS content_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
      title text NOT NULL,
      platform text NOT NULL DEFAULT 'instagram',
      format text DEFAULT 'post',
      audience text DEFAULT 'both',
      objective text DEFAULT 'awareness',
      status text DEFAULT 'idea',
      stage text DEFAULT 'research',
      publish_date timestamp with time zone,
      campaign text,
      cta text,
      project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE SET NULL;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS content_item_id uuid REFERENCES content_items(id) ON DELETE SET NULL;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependency_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS area text DEFAULT 'operations';
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium';

    ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
    ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated users full access on projects" ON projects;
    CREATE POLICY "Authenticated users full access on projects" ON projects FOR ALL TO authenticated USING (true);

    DROP POLICY IF EXISTS "Authenticated users full access on content_items" ON content_items;
    CREATE POLICY "Authenticated users full access on content_items" ON content_items FOR ALL TO authenticated USING (true);

    DROP POLICY IF EXISTS "Anon public access on projects" ON projects;
    CREATE POLICY "Anon public access on projects" ON projects FOR ALL TO anon USING (true);

    DROP POLICY IF EXISTS "Anon public access on content_items" ON content_items;
    CREATE POLICY "Anon public access on content_items" ON content_items FOR ALL TO anon USING (true);
  EXCEPTION WHEN OTHERS THEN
    -- Ignore DDL exceptions if executed concurrently
  END;

  IF (p_email IS NULL OR trim(p_email) = '') AND (p_phone IS NULL OR trim(p_phone) = '') THEN
    RAISE EXCEPTION 'דוא"ל או טלפון נדרשים להרשמה';
  END IF;

  -- Normalize Phone & Email (CTO Rule 2: Use NULL instead of empty string for phone)
  IF p_phone IS NOT NULL AND trim(p_phone) != '' THEN
    v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');
    IF length(v_clean_phone) = 0 THEN
      v_clean_phone := NULL;
    END IF;
  END IF;

  IF p_email IS NOT NULL AND trim(p_email) != '' THEN
    v_clean_email := lower(trim(p_email));
  END IF;

  -- 1. Canonical Identity Lookup
  IF v_clean_phone IS NOT NULL AND length(v_clean_phone) >= 7 THEN
    SELECT * FROM people WHERE normalized_phone = v_clean_phone LIMIT 1 INTO v_phone_person;
  END IF;

  IF v_clean_email IS NOT NULL THEN
    SELECT * FROM people WHERE normalized_email = v_clean_email LIMIT 1 INTO v_email_person;
  END IF;

  IF v_phone_person IS NOT NULL AND v_email_person IS NOT NULL AND v_phone_person.id != v_email_person.id THEN
    RAISE EXCEPTION 'Identity conflict detected';
  END IF;

  IF v_phone_person IS NOT NULL THEN
    v_existing_person := v_phone_person;
  ELSIF v_email_person IS NOT NULL THEN
    v_existing_person := v_email_person;
  END IF;

  IF v_existing_person IS NOT NULL THEN
    v_person_id := v_existing_person.id;

    -- CTO Rule 3: DO NOT CREATE LEADS FOR EXISTING CUSTOMERS
    IF v_existing_person.client_status = 'customer' THEN
      UPDATE people SET
        source = COALESCE(people.source, p_utm_source, 'Pre-Launch Signup')
      WHERE id = v_person_id;

      RETURN jsonb_build_object('success', true, 'status', 'existing_customer');
    END IF;

  ELSE
    -- Insert new person with NULL for phone when not provided (prevents unique empty string collisions)
    INSERT INTO people (
      full_name, phone, normalized_phone, email, normalized_email, client_status, source
    ) VALUES (
      p_full_name, COALESCE(p_phone, NULL), v_clean_phone, p_email, v_clean_email, 'lead', COALESCE(p_utm_source, 'Pre-Launch Signup')
    ) RETURNING id INTO v_person_id;
  END IF;

  -- 2. Reuse or Create Lead record (only for leads)
  SELECT id FROM leads WHERE person_id = v_person_id LIMIT 1 INTO v_lead_id;

  IF v_lead_id IS NULL THEN
    INSERT INTO leads (
      person_id, source, campaign, utm_source, utm_medium, utm_campaign, status
    ) VALUES (
      v_person_id,
      COALESCE(p_utm_source, 'Website'),
      COALESCE(p_utm_campaign, 'Pre-Launch Campaign'),
      p_utm_source,
      p_utm_medium,
      p_utm_campaign,
      'new'
    );
  ELSE
    UPDATE leads SET
      utm_source = COALESCE(leads.utm_source, p_utm_source),
      utm_medium = COALESCE(leads.utm_medium, p_utm_medium),
      utm_campaign = COALESCE(leads.utm_campaign, p_utm_campaign)
    WHERE id = v_lead_id;
  END IF;

  -- Return generic success object without internal UUIDs
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public_subscribe_performance_list(text, text, text, text, text, text) TO anon, authenticated;

COMMIT;
