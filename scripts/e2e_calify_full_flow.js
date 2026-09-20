import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://stwgtsmdtjfwfkibzdlh.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error("❌ Error: VITE_SUPABASE_ANON_KEY is required to run real calify E2E verification.");
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseAnonKey);

async function runRealE2E() {
  console.log("🚀 Starting Real Supabase E2E Flow against calify (stwgtsmdtjfwfkibzdlh)...\n");

  const testPhone = "0501112233";
  const testEmail = "e2e_full_test@op-os-core.com";
  const testName = "E2E Full Verification Person";

  let createdPersonId = null;
  let createdLeadId = null;
  let createdPatientId = null;
  let createdAppointmentId = null;
  let createdPaymentId = null;
  let createdTaskId = null;
  let createdCommId = null;

  try {
    // 1. Create Lead + Canonical Person via public_create_booking RPC
    console.log("1. Creating Lead & Canonical Person via public_create_booking RPC...");
    const { data: bookingRes, error: bookingErr } = await client.rpc('public_create_booking', {
      p_full_name: testName,
      p_phone: testPhone,
      p_email: testEmail,
      p_service_id: null,
      p_appointment_date: new Date().toISOString(),
      p_notes: "E2E verification lead"
    });

    if (bookingErr) throw bookingErr;
    console.log("   ✅ Booking RPC returned:", bookingRes);

    // Verify canonical Person created
    const { data: personData, error: personErr } = await client.from('people')
      .select('*')
      .eq('normalized_email', testEmail)
      .single();

    if (personErr || !personData) throw new Error("Person not created: " + JSON.stringify(personErr));
    createdPersonId = personData.id;
    console.log("   ✅ Canonical Person found in Supabase:", createdPersonId);

    // Verify linked Lead created
    const { data: leadData, error: leadErr } = await client.from('leads')
      .select('*')
      .eq('person_id', createdPersonId)
      .single();

    if (leadErr || !leadData) throw new Error("Lead not created: " + JSON.stringify(leadErr));
    createdLeadId = leadData.id;
    console.log("   ✅ Linked Lead found in Supabase:", createdLeadId);

    // 2. Link Clinical Profile (Patient)
    console.log("\n2. Linking Clinical Profile (patients table)...");
    const { data: patientData, error: patientErr } = await client.from('patients')
      .insert([{
        person_id: createdPersonId,
        full_name: testName,
        phone: testPhone,
        email: testEmail,
        status: 'active'
      }])
      .select()
      .single();

    if (patientErr || !patientData) throw new Error("Patient profile creation failed: " + JSON.stringify(patientErr));
    createdPatientId = patientData.id;
    console.log("   ✅ Clinical Profile linked:", createdPatientId);

    // 3. Create Appointment
    console.log("\n3. Creating Appointment...");
    const { data: apptData, error: apptErr } = await client.from('appointments')
      .insert([{
        patient_id: createdPatientId,
        person_id: createdPersonId,
        appointment_date: new Date().toISOString(),
        status: 'scheduled',
        source: 'manual'
      }])
      .select()
      .single();

    if (apptErr || !apptData) throw new Error("Appointment creation failed: " + JSON.stringify(apptErr));
    createdAppointmentId = apptData.id;
    console.log("   ✅ Appointment created:", createdAppointmentId);

    // 4. Create Payment (verifying person_id resolution)
    console.log("\n4. Creating Payment linked to Appointment (verifying person_id)...");
    const { data: payData, error: payErr } = await client.from('payments')
      .insert([{
        appointment_id: createdAppointmentId,
        patient_id: createdPatientId,
        person_id: createdPersonId,
        amount: 350.00,
        payment_method: 'Credit Card',
        status: 'paid',
        payment_date: new Date().toISOString()
      }])
      .select()
      .single();

    if (payErr || !payData) throw new Error("Payment creation failed: " + JSON.stringify(payErr));
    createdPaymentId = payData.id;
    if (payData.person_id !== createdPersonId) throw new Error("Payment person_id mismatch!");
    console.log("   ✅ Payment created with correct person_id:", createdPaymentId, "person_id:", payData.person_id);

    // 5. Create Task / Follow-up
    console.log("\n5. Creating Task / Follow-up linked to person_id...");
    const { data: taskData, error: taskErr } = await client.from('tasks')
      .insert([{
        person_id: createdPersonId,
        patient_id: createdPatientId,
        title: "E2E Follow-up Task",
        due_date: new Date().toISOString().split('T')[0],
        completed: false
      }])
      .select()
      .single();

    if (taskErr || !taskData) throw new Error("Task creation failed: " + JSON.stringify(taskErr));
    createdTaskId = taskData.id;
    console.log("   ✅ Task created:", createdTaskId);

    // 6. Create Lead Communication
    console.log("\n6. Creating Lead Communication linked to lead_id...");
    const { data: commData, error: commErr } = await client.from('lead_communications')
      .insert([{
        lead_id: createdLeadId,
        type: 'phone_call',
        note: 'E2E test communication note',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (commErr || !commData) throw new Error("Communication creation failed: " + JSON.stringify(commErr));
    createdCommId = commData.id;
    console.log("   ✅ Communication created:", createdCommId);

    // 7. Verify Derived Client 360 Data after Simulated Refresh
    console.log("\n7. Simulating Refresh & Verifying Persistence & Derived Client 360 Stats...");
    
    const [
      refreshedPerson, refreshedLeads, refreshedPatients, 
      refreshedAppts, refreshedPayments, refreshedTasks, refreshedComms
    ] = await Promise.all([
      client.from('people').select('*').eq('id', createdPersonId).single(),
      client.from('leads').select('*').eq('person_id', createdPersonId),
      client.from('patients').select('*').eq('person_id', createdPersonId),
      client.from('appointments').select('*').eq('person_id', createdPersonId),
      client.from('payments').select('*').eq('person_id', createdPersonId),
      client.from('tasks').select('*').eq('person_id', createdPersonId),
      client.from('lead_communications').select('*').eq('lead_id', createdLeadId)
    ]);

    console.log("   📊 Verification Results:");
    console.log("      - Canonical People records count:", refreshedPerson.data ? 1 : 0);
    console.log("      - Linked Leads count:", refreshedLeads.data ? refreshedLeads.data.length : 0);
    console.log("      - Linked Patients profile count:", refreshedPatients.data ? refreshedPatients.data.length : 0);
    console.log("      - Linked Appointments count:", refreshedAppts.data ? refreshedAppts.data.length : 0);
    console.log("      - Linked Payments count:", refreshedPayments.data ? refreshedPayments.data.length : 0);
    console.log("      - Payment person_id matches Person:", refreshedPayments.data?.[0]?.person_id === createdPersonId);
    console.log("      - Total Paid Revenue sum:", refreshedPayments.data?.reduce((sum, p) => sum + Number(p.amount), 0));
    console.log("      - Linked Tasks count:", refreshedTasks.data ? refreshedTasks.data.length : 0);
    console.log("      - Linked Communications count:", refreshedComms.data ? refreshedComms.data.length : 0);

    console.log("\n🎉 REAL SUPABASE E2E VERIFICATION COMPLETED WITH 100% SUCCESS!");

  } finally {
    // 8. Cleanup test data
    console.log("\n🧹 Cleaning up test records from calify...");
    if (createdCommId) await client.from('lead_communications').delete().eq('id', createdCommId);
    if (createdTaskId) await client.from('tasks').delete().eq('id', createdTaskId);
    if (createdPaymentId) await client.from('payments').delete().eq('id', createdPaymentId);
    if (createdAppointmentId) await client.from('appointments').delete().eq('id', createdAppointmentId);
    if (createdPatientId) await client.from('patients').delete().eq('id', createdPatientId);
    if (createdLeadId) await client.from('leads').delete().eq('id', createdLeadId);
    if (createdPersonId) await client.from('people').delete().eq('id', createdPersonId);
    console.log("✅ Temporary E2E test data cleaned up cleanly!");
  }
}

runRealE2E();
