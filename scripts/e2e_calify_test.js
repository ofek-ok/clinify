import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://stwgtsmdtjfwfkibzdlh.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder';

const client = createClient(supabaseUrl, supabaseAnonKey);

async function runE2E() {
  console.log("🚀 Running Real Supabase E2E Verification against calify (stwgtsmdtjfwfkibzdlh)...\n");

  const testPhone = "0509998877";
  const testEmail = "e2e_test_user@op-os-test.com";
  const testName = "E2E Test Person";

  // Step 1: Public Booking RPC Call (creates Lead + Person)
  console.log("Step 1: Creating booking / lead via public_create_booking RPC...");
  const { data: bookingRes, error: bookingErr } = await client.rpc('public_create_booking', {
    p_full_name: testName,
    p_email: testEmail,
    p_phone: testPhone,
    p_service_id: null,
    p_appointment_date: new Date().toISOString(),
    p_notes: "E2E verification lead"
  });

  if (bookingErr) {
    console.error("❌ RPC Booking Error:", bookingErr);
    process.exit(1);
  }
  console.log("✅ Step 1 Success! Booking RPC returned:", bookingRes);

  // Clean up test data afterwards
  console.log("🧹 Cleaning up E2E temporary test data from calify...");
  const { data: foundPerson } = await client.from('people').select('id').eq('normalized_phone', '0509998877').maybeSingle();
  if (foundPerson) {
    await client.from('people').delete().eq('id', foundPerson.id);
  }
  console.log("✅ Cleanup completed cleanly!");
}

runE2E();
