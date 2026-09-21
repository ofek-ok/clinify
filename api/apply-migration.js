import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://stwgtsmdtjfwfkibzdlh.supabase.co';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const ownerEmail = process.env.OWNER_EMAIL || 'owner@op-os.com';
  const ownerPassword = process.env.OWNER_PASSWORD || 'OwnerPassword2026!';

  if (!supabaseAnonKey || supabaseAnonKey === '[SENSITIVE]') {
    return res.status(500).json({ 
      error: 'supabaseAnonKey missing in server environment',
      envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('VITE'))
    });
  }

  try {
    const client = createClient(supabaseUrl, supabaseAnonKey);

    // 1. Authenticate owner
    let { data: authData, error: authErr } = await client.auth.signInWithPassword({
      email: ownerEmail,
      password: ownerPassword
    });

    if (authErr && (authErr.message?.includes('Invalid login credentials') || authErr.status === 400 || authErr.message?.includes('User not found'))) {
      const signUpRes = await client.auth.signUp({
        email: ownerEmail,
        password: ownerPassword
      });
      if (signUpRes.data?.session) {
        authData = signUpRes.data;
        authErr = null;
      }
    }

    if (authErr || !authData?.session) {
      return res.status(401).json({ error: 'Auth failed: ' + (authErr?.message || 'No session') });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    });

    // 2. Trigger Migration DDL via RPC
    const rpcRes = await authClient.rpc('public_subscribe_performance_list', {
      p_full_name: 'QA_MIGRATION_INITIALIZER',
      p_email: 'qa_migration_initializer@clinify-qa.com',
      p_phone: null,
      p_utm_source: 'qa_migration',
      p_utm_medium: 'script',
      p_utm_campaign: 'clinify_reset_v1'
    });

    // 3. Verify Schema
    const [projTest, contentTest, leadsTest, tasksTest] = await Promise.all([
      authClient.from('projects').select('*').limit(1),
      authClient.from('content_items').select('*').limit(1),
      authClient.from('leads').select('id, campaign, utm_source, utm_medium, utm_campaign, tags').limit(1),
      authClient.from('tasks').select('id, project_id, content_item_id, dependency_task_id, area, priority').limit(1)
    ]);

    const schemaVerification = {
      projectsTable: !projTest.error ? 'VERIFIED' : projTest.error.message,
      contentItemsTable: !contentTest.error ? 'VERIFIED' : contentTest.error.message,
      leadsColumns: !leadsTest.error ? 'VERIFIED' : leadsTest.error.message,
      tasksColumns: !tasksTest.error ? 'VERIFIED' : tasksTest.error.message
    };

    // 4. Perform QA_CLINIFY_* Real Persistence CRUD
    const timestamp = Date.now();
    const qaTag = `QA_CLINIFY_${timestamp}`;

    // Lead CRUD
    const { data: leadCreate } = await authClient.from('leads').insert([{
      source: 'QA Automation', campaign: `${qaTag}_Campaign`, utm_source: 'qa', utm_medium: 'web', utm_campaign: 'qa_camp', status: 'new', tags: [qaTag]
    }]).select().single();

    const { data: leadEdit } = await authClient.from('leads').update({ status: 'contacted', campaign: `${qaTag}_Updated` }).eq('id', leadCreate.id).select().single();

    // Project CRUD
    const { data: projCreate } = await authClient.from('projects').insert([{
      name: `${qaTag}_Project`, objective: 'CTO Schema Verification', status: 'planned', area: 'business', progress: 10
    }]).select().single();

    const { data: projEdit } = await authClient.from('projects').update({ status: 'active', progress: 75 }).eq('id', projCreate.id).select().single();

    // Content Item CRUD
    const { data: contentCreate } = await authClient.from('content_items').insert([{
      title: `${qaTag}_Content`, platform: 'instagram', format: 'reel', status: 'idea', stage: 'research', project_id: projCreate.id
    }]).select().single();

    const { data: contentEdit } = await authClient.from('content_items').update({ status: 'published' }).eq('id', contentCreate.id).select().single();

    // Task CRUD
    const { data: taskCreate } = await authClient.from('tasks').insert([{
      title: `${qaTag}_Task`, due_date: new Date().toISOString().split('T')[0], status: 'todo', priority: 'high', area: 'operations', project_id: projCreate.id, content_item_id: contentCreate.id
    }]).select().single();

    const { data: taskEdit } = await authClient.from('tasks').update({ status: 'done' }).eq('id', taskCreate.id).select().single();

    // Patient & Appointment CRUD
    const { data: patientCreate } = await authClient.from('patients').insert([{
      full_name: `${qaTag}_Patient`, phone: `050${Math.floor(1000000 + Math.random() * 9000000)}`, email: `${qaTag.toLowerCase()}@test.com`, status: 'active'
    }]).select().single();

    const { data: services } = await authClient.from('services').select('id').limit(1);
    const serviceId = services && services.length > 0 ? services[0].id : null;

    const { data: apptCreate } = await authClient.from('appointments').insert([{
      patient_id: patientCreate.id, service_id: serviceId, appointment_date: new Date(Date.now() + 86400000).toISOString(), status: 'scheduled', notes: qaTag
    }]).select().single();

    const { data: apptEdit } = await authClient.from('appointments').update({ status: 'completed' }).eq('id', apptCreate.id).select().single();

    // Payment CRUD
    const { data: payCreate } = await authClient.from('payments').insert([{
      patient_id: patientCreate.id, appointment_id: apptCreate.id, amount: 450.00, payment_method: 'Credit Card', status: 'pending', payment_date: new Date().toISOString().split('T')[0]
    }]).select().single();

    const { data: payEdit } = await authClient.from('payments').update({ status: 'paid' }).eq('id', payCreate.id).select().single();

    return res.status(200).json({
      success: true,
      rpcResult: rpcRes,
      schemaVerification,
      qaRecordsPreserved: {
        leadId: leadCreate.id,
        projectId: projCreate.id,
        contentItemId: contentCreate.id,
        taskId: taskCreate.id,
        appointmentId: apptCreate.id,
        paymentId: payCreate.id
      },
      crudVerificationResults: {
        leadEditedStatus: leadEdit.status,
        projectEditedProgress: projEdit.progress,
        contentEditedStatus: contentEdit.status,
        taskEditedStatus: taskEdit.status,
        appointmentEditedStatus: apptEdit.status,
        paymentEditedStatus: payEdit.status
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
