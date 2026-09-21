import { createClient } from '@supabase/supabase-js';

let envUrl = 'https://stwgtsmdtjfwfkibzdlh.supabase.co';
let envKey = '';

try {
  const envMod = await import('./_env.js');
  if (envMod.SUPABASE_ANON_KEY) envKey = envMod.SUPABASE_ANON_KEY;
  if (envMod.SUPABASE_URL) envUrl = envMod.SUPABASE_URL;
} catch (e) {
  // _env.js might not exist locally
}

export default async function handler(req, res) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || envUrl;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || envKey;
  const ownerEmail = process.env.OWNER_EMAIL || 'owner@op-os.com';
  const ownerPassword = process.env.OWNER_PASSWORD || 'OwnerPassword2026!';

  if (!supabaseAnonKey || supabaseAnonKey === '[SENSITIVE]') {
    return res.status(500).json({ 
      error: 'supabaseAnonKey missing or placeholder',
      envKeyPresent: !!envKey,
      envKeyLen: envKey ? envKey.length : 0
    });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Sign in as owner
    let { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: ownerEmail,
      password: ownerPassword
    });

    if (authErr && (authErr.message?.includes('Invalid login credentials') || authErr.status === 400 || authErr.message?.includes('User not found'))) {
      const signUpRes = await supabase.auth.signUp({
        email: ownerEmail,
        password: ownerPassword
      });
      if (signUpRes.data?.session) {
        authData = signUpRes;
        authErr = null;
      }
    }

    if (authErr || !authData?.session) {
      return res.status(401).json({ error: 'Auth failed: ' + (authErr?.message || 'No session') });
    }

    const authenticatedClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`
        }
      }
    });

    // Run Schema Verification
    const results = {};

    // 1. Check projects table
    const projectsCheck = await authenticatedClient.from('projects').select('*').limit(1);
    results.projectsTableExists = !projectsCheck.error || !projectsCheck.error.message.includes('does not exist');
    results.projectsError = projectsCheck.error ? projectsCheck.error.message : null;

    // 2. Check content_items table
    const contentCheck = await authenticatedClient.from('content_items').select('*').limit(1);
    results.contentItemsTableExists = !contentCheck.error || !contentCheck.error.message.includes('does not exist');
    results.contentItemsError = contentCheck.error ? contentCheck.error.message : null;

    // 3. Check leads columns
    const leadsCheck = await authenticatedClient.from('leads').select('id, campaign, utm_source, utm_medium, utm_campaign, tags').limit(1);
    results.leadsColumnsExist = !leadsCheck.error;
    results.leadsError = leadsCheck.error ? leadsCheck.error.message : null;

    // 4. Check tasks columns
    const tasksCheck = await authenticatedClient.from('tasks').select('id, project_id, content_item_id, dependency_task_id, area, priority').limit(1);
    results.tasksColumnsExist = !tasksCheck.error;
    results.tasksError = tasksCheck.error ? tasksCheck.error.message : null;

    return res.status(200).json({
      success: true,
      authUserId: authData.session.user.id,
      keyLen: supabaseAnonKey.length,
      schemaVerification: results
    });
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
