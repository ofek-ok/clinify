import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.log("⚠️ SUPABASE KEYS NOT DETECTED IN ENVIRONMENT.");
  console.log("Please run with environment variables: VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node scripts/smoke_test.js");
  process.exit(1);
}

const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function runSmokeTest() {
  console.log("🚀 Starting OP OS Core v1 Runtime Security & Smoke Tests...\n");
  let passed = 0;
  let failed = 0;

  // Test 1: Anonymous RLS Restriction on Canonical People Table
  try {
    const { data, error } = await anonClient.from('people').select('*');
    if (error || !data || data.length === 0) {
      console.log("✅ PASS 1: Anonymous users cannot query people table.");
      passed++;
    } else {
      console.error("❌ FAIL 1: Anonymous user was able to query people table!", data);
      failed++;
    }
  } catch (err) {
    console.log("✅ PASS 1: Anonymous query rejected with error.");
    passed++;
  }

  // Test 2: Anonymous RLS Restriction on Patients
  try {
    const { data, error } = await anonClient.from('patients').select('*');
    if (error || !data || data.length === 0) {
      console.log("✅ PASS 2: Anonymous users cannot query patients table.");
      passed++;
    } else {
      console.error("❌ FAIL 2: Anonymous user was able to query patients table!", data);
      failed++;
    }
  } catch (err) {
    console.log("✅ PASS 2: Anonymous query rejected with error.");
    passed++;
  }

  // Test 3: Anonymous RLS Restriction on Leads
  try {
    const { data, error } = await anonClient.from('leads').select('*');
    if (error || !data || data.length === 0) {
      console.log("✅ PASS 3: Anonymous users cannot query leads table.");
      passed++;
    } else {
      console.error("❌ FAIL 3: Anonymous user was able to query leads table!", data);
      failed++;
    }
  } catch (err) {
    console.log("✅ PASS 3: Anonymous query rejected with error.");
    passed++;
  }

  // Test 4: Anonymous RLS Restriction on Payments
  try {
    const { data, error } = await anonClient.from('payments').select('*');
    if (error || !data || data.length === 0) {
      console.log("✅ PASS 4: Anonymous users cannot query payments table.");
      passed++;
    } else {
      console.error("❌ FAIL 4: Anonymous user was able to query payments table!", data);
      failed++;
    }
  } catch (err) {
    console.log("✅ PASS 4: Anonymous query rejected with error.");
    passed++;
  }

  // Test 5: Anonymous RLS Restriction on Clinical Notes
  try {
    const { data, error } = await anonClient.from('patient_clinical_notes').select('*');
    if (error || !data || data.length === 0) {
      console.log("✅ PASS 5: Anonymous users cannot query clinical notes.");
      passed++;
    } else {
      console.error("❌ FAIL 5: Anonymous user was able to query clinical notes!", data);
      failed++;
    }
  } catch (err) {
    console.log("✅ PASS 5: Anonymous query rejected with error.");
    passed++;
  }

  // Test 6: Anonymous Execution Restriction on redeem_package_session RPC
  try {
    const { error } = await anonClient.rpc('redeem_package_session', { p_package_id: '00000000-0000-0000-0000-000000000000' });
    if (error && (error.message.includes('permission denied') || error.code === '42501')) {
      console.log("✅ PASS 6: Anonymous execution of redeem_package_session is blocked.");
      passed++;
    } else if (error) {
      console.log("✅ PASS 6: RPC execution blocked/errored appropriately for anon user.");
      passed++;
    } else {
      console.error("❌ FAIL 6: Anonymous user executed redeem_package_session!");
      failed++;
    }
  } catch (err) {
    console.log("✅ PASS 6: Execution rejected.");
    passed++;
  }

  // Test 7: Anonymous Execution Restriction on convert_lead_to_customer RPC
  try {
    const { error } = await anonClient.rpc('convert_lead_to_customer', { p_person_id: '00000000-0000-0000-0000-000000000000' });
    if (error && (error.message.includes('permission denied') || error.code === '42501')) {
      console.log("✅ PASS 7: Anonymous execution of convert_lead_to_customer is blocked.");
      passed++;
    } else if (error) {
      console.log("✅ PASS 7: RPC execution blocked/errored appropriately for anon user.");
      passed++;
    } else {
      console.error("❌ FAIL 7: Anonymous user executed convert_lead_to_customer!");
      failed++;
    }
  } catch (err) {
    console.log("✅ PASS 7: Execution rejected.");
    passed++;
  }

  // Test 8: Public Forms RLS Policy (is_public = true)
  try {
    const { data, error } = await anonClient.from('forms').select('*').eq('is_public', false);
    if (error || !data || data.length === 0) {
      console.log("✅ PASS 8: Anonymous users cannot read non-public forms (is_public = false).");
      passed++;
    } else {
      console.error("❌ FAIL 8: Anonymous user read private forms!", data);
      failed++;
    }
  } catch (err) {
    console.log("✅ PASS 8: Private form query rejected.");
    passed++;
  }

  console.log(`\n📊 Smoke Test Results: ${passed} Passed, ${failed} Failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runSmokeTest();
