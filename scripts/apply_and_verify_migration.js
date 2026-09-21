import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://stwgtsmdtjfwfkibzdlh.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const ownerEmail = process.env.OWNER_EMAIL || 'owner@op-os.com';
const ownerPassword = process.env.OWNER_PASSWORD || 'OwnerPassword2026!';

if (!supabaseAnonKey) {
  console.error("❌ Error: VITE_SUPABASE_ANON_KEY is required.");
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseAnonKey);

async function runMigrationAndQA() {
  console.log("==================================================================");
  console.log("🚀 LIVE SUPABASE MIGRATION & REAL CANONICAL CRUD VERIFICATION (calify)");
  console.log("==================================================================\n");

  // Step 1: Owner Auth
  console.log("1. Authenticating owner session on Supabase...");
  let { data: authData, error: authErr } = await client.auth.signInWithPassword({
    email: ownerEmail,
    password: ownerPassword
  });

  if (authErr && (authErr.message?.includes('Invalid login credentials') || authErr.status === 400 || authErr.message?.includes('User not found'))) {
    console.log("   Creating owner user on Supabase Auth...");
    const signUpRes = await client.auth.signUp({
      email: ownerEmail,
      password: ownerPassword
    });
    if (signUpRes.data?.session) {
      authData = signUpRes.data;
      authErr = null;
    } else {
      const retry = await client.auth.signInWithPassword({
        email: ownerEmail,
        password: ownerPassword
      });
      authData = retry.data;
      authErr = retry.error;
    }
  }

  if (authErr || !authData?.session) {
    console.error("❌ Owner authentication failed:", authErr);
    process.exit(1);
  }
  console.log("   ✅ Owner authenticated successfully. ID:", authData.session.user.id);

  // Authenticated Supabase Client
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authData.session.access_token}`
      }
    }
  });

  // Step 2: Verify Live Schema Tables & Columns
  console.log("\n2. Verifying Live Database Schema additions on calify...");

  const [projTest, contentTest, leadsTest, tasksTest, peopleTest] = await Promise.all([
    authClient.from('projects').select('*').limit(1),
    authClient.from('content_items').select('*').limit(1),
    authClient.from('leads').select('id, campaign, utm_source, utm_medium, utm_campaign, tags').limit(1),
    authClient.from('tasks').select('id, project_id, content_item_id, dependency_task_id, area, priority').limit(1),
    authClient.from('people').select('id, phone, normalized_phone, email, normalized_email, client_status').limit(1)
  ]);

  console.log("   📊 Live Schema Verification Results:");
  console.log("      - projects table:", projTest.error ? `❌ ${projTest.error.message}` : "✅ Verified");
  console.log("      - content_items table:", contentTest.error ? `❌ ${contentTest.error.message}` : "✅ Verified");
  console.log("      - leads.campaign, utm_*, tags columns:", leadsTest.error ? `❌ ${leadsTest.error.message}` : "✅ Verified");
  console.log("      - tasks.project_id, area, priority columns:", tasksTest.error ? `❌ ${tasksTest.error.message}` : "✅ Verified");
  console.log("      - people table nullable identity columns:", peopleTest.error ? `❌ ${peopleTest.error.message}` : "✅ Verified");

  // Step 3: Perform Canonical Identity CRUD Operations (Person -> Lead -> Patient -> Appointment -> Payment)
  console.log("\n3. Performing REAL Canonical Identity Hierarchy Operations...");

  const timestamp = Date.now();
  const qaTag = `QA_CLINIFY_${timestamp}`;
  const qaEmail = `${qaTag.toLowerCase()}@clinify-qa.com`;

  // 3.1 CREATE Person
  console.log("\n   --> [1. Person CRUD]");
  const { data: personCreate, error: personErr } = await authClient.from('people').insert([{
    full_name: `${qaTag}_Person`,
    email: qaEmail,
    normalized_email: qaEmail,
    phone: null,
    normalized_phone: null,
    client_status: 'lead',
    source: 'QA Script'
  }]).select().single();

  if (personErr) throw new Error("Person CREATE failed: " + personErr.message);
  console.log("       CREATE Person ID:", personCreate.id, "| Email-Only Signup (Phone=NULL)");

  // EDIT Person
  const { data: personEdit, error: personEditErr } = await authClient.from('people').update({
    full_name: `${qaTag}_Person_Updated`
  }).eq('id', personCreate.id).select().single();

  if (personEditErr) throw new Error("Person EDIT failed: " + personEditErr.message);
  console.log("       EDIT Person verified. New Name:", personEdit.full_name);

  // 3.2 CREATE Lead (Linked to Person)
  console.log("\n   --> [2. Lead CRUD]");
  const { data: leadCreate, error: leadCreateErr } = await authClient.from('leads').insert([{
    person_id: personCreate.id,
    source: 'QA Automation',
    campaign: `${qaTag}_Campaign`,
    utm_source: 'qa_source',
    utm_medium: 'qa_medium',
    utm_campaign: 'qa_campaign',
    status: 'new',
    tags: [qaTag, 'qa_lead']
  }]).select().single();

  if (leadCreateErr) throw new Error("Lead CREATE failed: " + leadCreateErr.message);
  console.log("       CREATE Lead ID:", leadCreate.id, "| Person ID:", leadCreate.person_id);

  // EDIT Lead
  const { data: leadEdit, error: leadEditErr } = await authClient.from('leads').update({
    status: 'contacted',
    campaign: `${qaTag}_Updated_Campaign`
  }).eq('id', leadCreate.id).select().single();

  if (leadEditErr) throw new Error("Lead EDIT failed: " + leadEditErr.message);
  console.log("       EDIT Lead verified. New Campaign:", leadEdit.campaign, "Status:", leadEdit.status);

  // 3.3 CREATE Patient (Clinical Profile linked to Person)
  console.log("\n   --> [3. Patient CRUD]");
  const { data: patientCreate, error: patientCreateErr } = await authClient.from('patients').insert([{
    person_id: personCreate.id,
    full_name: personEdit.full_name,
    email: qaEmail,
    status: 'active'
  }]).select().single();

  if (patientCreateErr) throw new Error("Patient CREATE failed: " + patientCreateErr.message);
  console.log("       CREATE Patient ID:", patientCreate.id);

  // Lookup services
  const { data: services, error: servErr } = await authClient.from('services').select('id').limit(1);
  const serviceId = services && services.length > 0 ? services[0].id : null;

  // 3.4 CREATE Appointment (Linked to Patient & Person)
  console.log("\n   --> [4. Appointment CRUD]");
  const { data: apptCreate, error: apptCreateErr } = await authClient.from('appointments').insert([{
    person_id: personCreate.id,
    patient_id: patientCreate.id,
    service_id: serviceId,
    appointment_date: new Date(Date.now() + 86400000).toISOString(),
    status: 'scheduled',
    notes: `${qaTag} Appointment`
  }]).select().single();

  if (apptCreateErr) throw new Error("Appointment CREATE failed: " + apptCreateErr.message);
  console.log("       CREATE Appointment ID:", apptCreate.id);

  // EDIT Appointment
  const { data: apptEdit, error: apptEditErr } = await authClient.from('appointments').update({
    status: 'completed'
  }).eq('id', apptCreate.id).select().single();

  if (apptEditErr) throw new Error("Appointment EDIT failed: " + apptEditErr.message);
  console.log("       EDIT Appointment verified. New Status:", apptEdit.status);

  // 3.5 CREATE Payment (Linked to Appointment, Patient & Person)
  console.log("\n   --> [5. Payment CRUD]");
  const { data: payCreate, error: payCreateErr } = await authClient.from('payments').insert([{
    person_id: personCreate.id,
    patient_id: patientCreate.id,
    appointment_id: apptCreate.id,
    amount: 450.00,
    payment_method: 'Credit Card',
    status: 'pending',
    payment_date: new Date().toISOString().split('T')[0]
  }]).select().single();

  if (payCreateErr) throw new Error("Payment CREATE failed: " + payCreateErr.message);
  console.log("       CREATE Payment ID:", payCreate.id);

  // EDIT Payment
  const { data: payEdit, error: payEditErr } = await authClient.from('payments').update({
    status: 'paid'
  }).eq('id', payCreate.id).select().single();

  if (payEditErr) throw new Error("Payment EDIT failed: " + payEditErr.message);
  console.log("       EDIT Payment verified. New Status:", payEdit.status);

  // Step 4: Internal Execution Hierarchy (Project -> Content -> Task)
  console.log("\n4. Performing REAL Internal Execution Hierarchy Operations...");

  // 4.1 CREATE Project
  console.log("\n   --> [1. Project CRUD]");
  const { data: projCreate, error: projCreateErr } = await authClient.from('projects').insert([{
    name: `${qaTag}_Project`,
    objective: 'CTO Schema Verification Outcome',
    status: 'planned',
    area: 'business',
    progress: 10
  }]).select().single();

  if (projCreateErr) throw new Error("Project CREATE failed: " + projCreateErr.message);
  console.log("       CREATE Project ID:", projCreate.id);

  // EDIT Project
  const { data: projEdit, error: projEditErr } = await authClient.from('projects').update({
    status: 'active',
    progress: 50
  }).eq('id', projCreate.id).select().single();

  if (projEditErr) throw new Error("Project EDIT failed: " + projEditErr.message);
  console.log("       EDIT Project verified. New Progress:", projEdit.progress, "Status:", projEdit.status);

  // 4.2 CREATE Content Item (Linked to Project)
  console.log("\n   --> [2. Content Item CRUD]");
  const { data: contentCreate, error: contentCreateErr } = await authClient.from('content_items').insert([{
    title: `${qaTag}_ContentItem`,
    platform: 'instagram',
    format: 'reel',
    status: 'idea',
    stage: 'research',
    project_id: projCreate.id
  }]).select().single();

  if (contentCreateErr) throw new Error("Content Item CREATE failed: " + contentCreateErr.message);
  console.log("       CREATE Content Item ID:", contentCreate.id);

  // EDIT Content Item
  const { data: contentEdit, error: contentEditErr } = await authClient.from('content_items').update({
    status: 'published',
    stage: 'ready'
  }).eq('id', contentCreate.id).select().single();

  if (contentEditErr) throw new Error("Content Item EDIT failed: " + contentEditErr.message);
  console.log("       EDIT Content Item verified. New Status:", contentEdit.status);

  // 4.3 CREATE Task (Linked to Project & Content Item)
  console.log("\n   --> [3. Task CRUD]");
  const { data: taskCreate, error: taskCreateErr } = await authClient.from('tasks').insert([{
    title: `${qaTag}_Task`,
    due_date: new Date().toISOString().split('T')[0],
    status: 'todo',
    priority: 'high',
    area: 'operations',
    project_id: projCreate.id,
    content_item_id: contentCreate.id
  }]).select().single();

  if (taskCreateErr) throw new Error("Task CREATE failed: " + taskCreateErr.message);
  console.log("       CREATE Task ID:", taskCreate.id);

  // EDIT Task
  const { data: taskEdit, error: taskEditErr } = await authClient.from('tasks').update({
    status: 'done',
    priority: 'low'
  }).eq('id', taskCreate.id).select().single();

  if (taskEditErr) throw new Error("Task EDIT failed: " + taskEditErr.message);
  console.log("       EDIT Task verified. New Status:", taskEdit.status);

  console.log("\n==================================================================");
  console.log("🎉 REAL SUPABASE CANONICAL CRUD VERIFICATION SUCCESSFUL!");
  console.log("Records preserved in live calify database for CTO audit:");
  console.log("   - Person ID:", personCreate.id);
  console.log("   - Lead ID:", leadCreate.id);
  console.log("   - Patient ID:", patientCreate.id);
  console.log("   - Appointment ID:", apptCreate.id);
  console.log("   - Payment ID:", payCreate.id);
  console.log("   - Project ID:", projCreate.id);
  console.log("   - Content Item ID:", contentCreate.id);
  console.log("   - Task ID:", taskCreate.id);
  console.log("==================================================================");
}

runMigrationAndQA().catch(err => {
  console.error("❌ Migration/QA Script Error:", err);
  process.exit(1);
});
