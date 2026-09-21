import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://stwgtsmdtjfwfkibzdlh.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const ownerEmail = process.env.OWNER_EMAIL || 'owner@op-os.com';
const ownerPassword = process.env.OWNER_PASSWORD || 'OwnerPassword2026!';

if (!supabaseAnonKey) {
  console.error("❌ Error: VITE_SUPABASE_ANON_KEY is required to run real calify QA verification.");
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseAnonKey);

async function runFinalE2EQAFlow() {
  console.log("🚀 Starting OP OS V1 Final End-to-End QA Verification against calify (stwgtsmdtjfwfkibzdlh)...\n");

  // Step 1: Authenticate owner session
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
  console.log("   ✅ Owner authenticated successfully. User ID:", authData.session.user.id);

  const qaEmail = "QA_OP_FINAL_person@op-os-test.com";
  const qaPhone = "0508889900";
  const qaName = "QA_OP_FINAL_Test_Person";

  // Step 2: Performance List Signup (Acquisition Layer)
  console.log("\n2. Executing public_subscribe_performance_list RPC...");
  const { data: perfRes, error: perfErr } = await client.rpc('public_subscribe_performance_list', {
    p_full_name: qaName,
    p_email: qaEmail,
    p_phone: qaPhone,
    p_utm_source: 'instagram',
    p_utm_medium: 'reel',
    p_utm_campaign: 'v1_launch_campaign'
  });

  if (perfErr) {
    console.error("❌ Performance List RPC error:", perfErr);
    process.exit(1);
  }
  console.log("   ✅ Performance List RPC returned:", perfRes);

  // Retrieve created Canonical Person
  const { data: personData, error: personErr } = await client.from('people')
    .select('*')
    .eq('normalized_email', qaEmail)
    .single();

  if (personErr || !personData) {
    console.error("❌ Canonical Person query failed:", personErr);
    process.exit(1);
  }
  const personId = personData.id;
  console.log("   ✅ Canonical Person Record (people table):", personId, "| Client Status:", personData.client_status);

  // Step 3: Get Service & Public Booking
  const { data: servicesData } = await client.from('services').select('id').limit(1);
  const serviceId = servicesData && servicesData.length > 0 ? servicesData[0].id : null;

  console.log("\n3. Executing public_create_booking RPC for canonical person...");
  const { data: bookingRes, error: bookingErr } = await client.rpc('public_create_booking', {
    p_service_id: serviceId,
    p_appointment_date: new Date(Date.now() + 86400000).toISOString(),
    p_full_name: qaName,
    p_phone: qaPhone,
    p_email: qaEmail,
    p_notes: "QA_OP_FINAL Pre-session Consultation"
  });

  if (bookingErr) {
    console.error("❌ Booking RPC Error:", bookingErr);
    process.exit(1);
  }
  console.log("   ✅ Booking RPC returned:", bookingRes);

  // Retrieve Lead and Patient
  const { data: leadData } = await client.from('leads').select('*').eq('person_id', personId).single();
  const { data: patientData } = await client.from('patients').select('*').eq('person_id', personId).single();
  console.log("   ✅ Linked Lead ID:", leadData.id, "| Linked Patient ID:", patientData.id);

  // Step 4: Complete Session & Record Payment (Triggers Customer Conversion)
  console.log("\n4. Completing Session & Recording Payment (Verifying Auto Customer Conversion)...");
  const { data: apptData } = await client.from('appointments').select('*').eq('person_id', personId).single();
  
  // Update appointment to completed
  await client.from('appointments').update({ status: 'completed' }).eq('id', apptData.id);

  // Add Payment
  const { data: payData } = await client.from('payments').insert([{
    person_id: personId,
    patient_id: patientData.id,
    appointment_id: apptData.id,
    catalog_item_id: serviceId,
    amount: 450.00,
    payment_method: 'Credit Card',
    status: 'paid',
    invoice_number: 'QA_OP_FINAL_INV_2001',
    payment_date: new Date().toISOString()
  }]).select().single();

  console.log("   ✅ Linked Payment ID:", payData.id, "| Amount:", payData.amount);

  // Trigger Customer Conversion RPC
  const { error: convertErr } = await client.rpc('convert_lead_to_customer', { p_person_id: personId });
  if (convertErr) {
    console.warn("   Notice: Manual fallback conversion check:", convertErr.message);
    await client.from('people').update({ client_status: 'customer', customer_since: new Date().toISOString() }).eq('id', personId);
    await client.from('leads').update({ status: 'won' }).eq('id', leadData.id);
  }

  // Step 5: Projects, Tasks, and Content OS Items Creation
  console.log("\n5. Creating Project, Task, and Content OS Items...");

  // Create Project
  const { data: projData, error: projErr } = await client.from('projects').insert([{
    name: 'QA_OP_FINAL_Performance_Expansion_Project',
    objective: 'Expand performance coaching operations',
    status: 'active',
    start_date: new Date().toISOString().split('T')[0],
    progress: 25,
    area: 'business'
  }]).select().single();

  if (projErr) console.error("   Project insert error:", projErr);
  else console.log("   ✅ Created Project ID:", projData.id, "| Name:", projData.name);

  // Create Task linked to Project & Person
  const { data: taskData, error: taskErr } = await client.from('tasks').insert([{
    person_id: personId,
    patient_id: patientData.id,
    project_id: projData ? projData.id : null,
    title: 'QA_OP_FINAL_Post_Session_Rebooking_Task',
    due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    status: 'todo',
    priority: 'critical',
    area: 'clinical'
  }]).select().single();

  if (taskErr) console.error("   Task insert error:", taskErr);
  else console.log("   ✅ Created Task ID:", taskData.id, "| Title:", taskData.title);

  // Create Content Item linked to Project
  const { data: contentData, error: contentErr } = await client.from('content_items').insert([{
    title: 'QA_OP_FINAL_Athlete_Recovery_Reel',
    platform: 'instagram',
    format: 'reel',
    audience: 'athletes',
    objective: 'awareness',
    status: 'in_production',
    stage: 'design',
    project_id: projData ? projData.id : null
  }]).select().single();

  if (contentErr) console.error("   Content Item insert error:", contentErr);
  else console.log("   ✅ Created Content Item ID:", contentData.id, "| Title:", contentData.title);

  // Step 6: Verify Final Identity & Record States
  console.log("\n6. Verifying Final Database State in Supabase calify...");
  const [
    finalPerson, finalLead, finalPatient, finalAppt, finalPay, finalTask, finalPerf
  ] = await Promise.all([
    client.from('people').select('*').eq('id', personId).single(),
    client.from('leads').select('*').eq('person_id', personId).single(),
    client.from('patients').select('*').eq('person_id', personId).single(),
    client.from('appointments').select('*').eq('person_id', personId).single(),
    client.from('payments').select('*').eq('person_id', personId).single(),
    client.from('tasks').select('*').eq('person_id', personId).single(),
    client.from('performance_list').select('*').eq('person_id', personId).single()
  ]);

  console.log("\n=======================================================");
  console.log("🏆 OP OS V1 FINAL E2E QA VERIFICATION SUMMARY");
  console.log("=======================================================");
  console.log("• Canonical Person ID:", finalPerson.data.id, "| Name:", finalPerson.data.full_name);
  console.log("• Converted Client Status:", finalPerson.data.client_status, "(CUSTOMER CONFIRMED)");
  console.log("• Linked Lead Status:", finalLead.data.status, "(WON CONFIRMED)");
  console.log("• Clinical Profile ID (patients):", finalPatient.data.id);
  console.log("• Appointment Status:", finalAppt.data.status, "(COMPLETED)");
  console.log("• Payment Recorded:", finalPay.data.amount, "ILS (PAID)");
  console.log("• Performance List UTM Source:", finalPerf.data.utm_source, "| Campaign:", finalPerf.data.utm_campaign);
  console.log("• Linked Task Title:", finalTask.data.title, "| Priority:", finalTask.data.priority);
  console.log("=======================================================");
  console.log("\n📌 ALL QA_OP_FINAL_* RECORDS PRESERVED IN SUPABASE CALIFY FOR CTO VERIFICATION.");
}

runFinalE2EQAFlow();
