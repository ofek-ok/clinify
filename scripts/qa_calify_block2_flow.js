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

async function runQAFlow() {
  console.log("🚀 Starting QA Block 2 Verification Flow against calify (stwgtsmdtjfwfkibzdlh)...\n");

  // Authenticate owner session first
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

  const qaEmail = "QA_OP_BLOCK2_person@op-os-test.com";
  const qaPhone = "0509990000";
  const qaName = "QA_OP_BLOCK2_Test_Person";

  // Step A: Get a valid Service ID for booking
  const { data: servicesData } = await client.from('services').select('id').limit(1);
  const serviceId = servicesData && servicesData.length > 0 ? servicesData[0].id : null;

  // Step B: Create Lead + Canonical Person via public_create_booking RPC
  console.log("\n2. Executing public_create_booking RPC for QA person...");
  const { data: bookingRes, error: bookingErr } = await client.rpc('public_create_booking', {
    p_service_id: serviceId,
    p_appointment_date: new Date().toISOString(),
    p_full_name: qaName,
    p_phone: qaPhone,
    p_email: qaEmail,
    p_notes: "QA_OP_BLOCK2 Initial Booking Note"
  });

  if (bookingErr) {
    console.error("❌ Booking RPC Error:", bookingErr);
    process.exit(1);
  }
  console.log("   ✅ Booking RPC returned:", bookingRes);

  // Retrieve created canonical Person
  const { data: personData, error: personErr } = await client.from('people')
    .select('*')
    .eq('normalized_email', qaEmail)
    .single();

  if (personErr || !personData) {
    console.error("❌ Person query failed:", personErr);
    process.exit(1);
  }
  const personId = personData.id;
  console.log("   ✅ Canonical Person Record (people table):", personId, "| Name:", personData.full_name);

  // Retrieve linked Lead
  const { data: leadData, error: leadErr } = await client.from('leads')
    .select('*')
    .eq('person_id', personId)
    .single();

  if (leadErr || !leadData) {
    console.error("❌ Lead query failed:", leadErr);
    process.exit(1);
  }
  const leadId = leadData.id;
  console.log("   ✅ Linked Lead Record (leads table):", leadId, "| Status:", leadData.status);

  // Step C: Move Lead Stage & Log Lead Communication
  console.log("\n3. Updating Lead Stage to 'contacted' & logging Communication...");
  await client.from('leads').update({ status: 'contacted' }).eq('id', leadId);

  const { data: commData, error: commErr } = await client.from('lead_communications')
    .insert([{
      lead_id: leadId,
      type: 'phone_call',
      note: 'QA_OP_BLOCK2_Communication_Log_Call_Note',
      created_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (commErr) {
    console.error("❌ Communication log error:", commErr);
    process.exit(1);
  }
  console.log("   ✅ Lead Communication Record (lead_communications table):", commData.id);

  // Step D: Create Clinical Profile (patients table)
  console.log("\n4. Creating Clinical Profile (patients table)...");
  const { data: patientData, error: patientErr } = await client.from('patients')
    .insert([{
      person_id: personId,
      status: 'active',
      medical_history: 'QA_OP_BLOCK2_Intake_Medical_History'
    }])
    .select()
    .single();

  if (patientErr) {
    console.error("❌ Patient profile creation error:", patientErr);
    process.exit(1);
  }
  const patientId = patientData.id;
  console.log("   ✅ Linked Clinical Profile (patients table):", patientId);

  // Step E: Create Appointment
  console.log("\n5. Creating Appointment (appointments table)...");
  const { data: apptData, error: apptErr } = await client.from('appointments')
    .insert([{
      person_id: personId,
      patient_id: patientId,
      service_id: serviceId,
      appointment_date: new Date().toISOString(),
      status: 'scheduled',
      source: 'internal',
      notes: 'QA_OP_BLOCK2_Scheduled_Appointment'
    }])
    .select()
    .single();

  if (apptErr) {
    console.error("❌ Appointment creation error:", apptErr);
    process.exit(1);
  }
  const apptId = apptData.id;
  console.log("   ✅ Linked Appointment Record (appointments table):", apptId);

  // Step F: Create Payment linked to Appointment (verifying person_id resolution)
  console.log("\n6. Creating Payment linked to Appointment (payments table)...");
  const { data: payData, error: payErr } = await client.from('payments')
    .insert([{
      person_id: personId,
      patient_id: patientId,
      appointment_id: apptId,
      catalog_item_id: serviceId,
      amount: 350.00,
      payment_method: 'Credit Card',
      status: 'paid',
      invoice_number: 'QA_OP_BLOCK2_INV_1001',
      payment_date: new Date().toISOString()
    }])
    .select()
    .single();

  if (payErr) {
    console.error("❌ Payment creation error:", payErr);
    process.exit(1);
  }
  const payId = payData.id;
  console.log("   ✅ Linked Payment Record (payments table):", payId, "| Amount:", payData.amount, "| person_id:", payData.person_id);

  // Step G: Create Task / Follow-up
  console.log("\n7. Creating Task / Follow-up (tasks table)...");
  const { data: taskData, error: taskErr } = await client.from('tasks')
    .insert([{
      person_id: personId,
      patient_id: patientId,
      title: 'QA_OP_BLOCK2_Followup_Task',
      due_date: new Date().toISOString().split('T')[0],
      status: 'todo',
      priority: 'high'
    }])
    .select()
    .single();

  if (taskErr) {
    console.error("❌ Task creation error:", taskErr);
    process.exit(1);
  }
  const taskId = taskData.id;
  console.log("   ✅ Linked Task Record (tasks table):", taskId);

  // Step H: Verify All Records & Derived Client 360 Stats after Simulated Refresh
  console.log("\n8. Simulating Browser Refresh & Verifying All QA Records in Supabase calify...");
  
  const [
    refreshedPerson, refreshedLeads, refreshedPatients,
    refreshedAppts, refreshedPayments, refreshedTasks, refreshedComms
  ] = await Promise.all([
    client.from('people').select('*').eq('id', personId).single(),
    client.from('leads').select('*').eq('person_id', personId),
    client.from('patients').select('*').eq('person_id', personId),
    client.from('appointments').select('*').eq('person_id', personId),
    client.from('payments').select('*').eq('person_id', personId),
    client.from('tasks').select('*').eq('person_id', personId),
    client.from('lead_communications').select('*').eq('lead_id', leadId)
  ]);

  console.log("\n=== INDEPENDENT QA RECORD VERIFICATION SUMMARY ===");
  console.log("• Canonical Person ID (people):", refreshedPerson.data.id, "| Full Name:", refreshedPerson.data.full_name);
  console.log("• Linked Lead ID (leads):", refreshedLeads.data[0].id, "| Status:", refreshedLeads.data[0].status);
  console.log("• Linked Patient Profile ID (patients):", refreshedPatients.data[0].id);
  console.log("• Linked Appointment ID (appointments):", refreshedAppts.data[0].id, "| Status:", refreshedAppts.data[0].status);
  console.log("• Linked Payment ID (payments):", refreshedPayments.data[0].id, "| person_id:", refreshedPayments.data[0].person_id, "| Amount:", refreshedPayments.data[0].amount);
  console.log("• Linked Task ID (tasks):", refreshedTasks.data[0].id, "| Title:", refreshedTasks.data[0].title);
  console.log("• Linked Communication ID (lead_communications):", refreshedComms.data[0].id, "| Note:", refreshedComms.data[0].note);
  console.log("• Client 360 Derived Revenue Sum:", refreshedPayments.data.reduce((sum, p) => sum + Number(p.amount), 0), "ILS");

  console.log("\n📌 PRESERVING ALL QA_OP_BLOCK2_ RECORDS IN SUPABASE CALIFY FOR CTO VERIFICATION.");
}

runQAFlow();
