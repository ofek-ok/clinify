import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://stwgtsmdtjfwfkibzdlh.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.CLINIFY_SUPABASE_KEY || '';

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, apikey'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      service: 'Clinify Leads API',
      endpoint: '/api/leads',
      method: 'POST',
      accepted_fields: [
        'full_name (string, required)',
        'phone (string, required)',
        'email (string, optional)',
        'topic (string: פציעת ספורט | כאבי גב וצוואר | עומס משרדי | תחזוקה והתאוששות | שיפור תנועה)',
        'pain_level (number 1-10, optional)',
        'note (string, optional)',
        'marketing_consent (boolean, default: true)',
        'utm_source (string, default: website)',
        'utm_medium (string, default: organic)',
        'utm_campaign (string, default: performance_list)'
      ]
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const fullName = String(body.full_name || body.fullName || '').trim();
    const phone = String(body.phone || '').trim();
    const email = body.email ? String(body.email).trim().toLowerCase() : null;
    const topic = body.topic ? String(body.topic).trim() : null;
    const painLevel = body.pain_level !== undefined && body.pain_level !== null ? Number(body.pain_level) : null;
    const note = body.note ? String(body.note).trim() : null;
    const marketingConsent = body.marketing_consent !== undefined ? Boolean(body.marketing_consent) : true;
    const utmSource = body.utm_source ? String(body.utm_source).trim() : 'website';
    const utmMedium = body.utm_medium ? String(body.utm_medium).trim() : 'organic';
    const utmCampaign = body.utm_campaign ? String(body.utm_campaign).trim() : 'performance_list';

    if (!fullName || !phone) {
      return res.status(400).json({ error: 'Missing required fields: full_name and phone are mandatory.' });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 7) {
      return res.status(400).json({ error: 'Invalid phone number format.' });
    }

    if (!SUPABASE_KEY) {
      console.error('Missing Supabase credentials in serverless environment.');
      return res.status(500).json({ error: 'Database connection configuration missing.' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false }
    });

    // 1. Find or create Person
    let person = null;
    const { data: phonePerson } = await supabase
      .from('people')
      .select('*')
      .eq('normalized_phone', cleanPhone)
      .maybeSingle();

    if (phonePerson) {
      person = phonePerson;
    } else if (email) {
      const { data: emailPerson } = await supabase
        .from('people')
        .select('*')
        .eq('normalized_email', email)
        .maybeSingle();
      if (emailPerson) person = emailPerson;
    }

    if (person) {
      const updates = {};
      if (fullName && fullName !== person.full_name) updates.full_name = fullName;
      if (email && email !== person.email) {
        updates.email = email;
        updates.normalized_email = email;
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from('people').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', person.id);
      }
    } else {
      const { data: newPerson, error: personErr } = await supabase
        .from('people')
        .insert([{
          full_name: fullName,
          phone: phone,
          normalized_phone: cleanPhone,
          email: email,
          normalized_email: email,
          client_status: 'lead',
          source: utmSource || 'Website'
        }])
        .select()
        .single();

      if (personErr) {
        console.error('Error creating person:', personErr);
        return res.status(500).json({ error: 'Could not create identity record: ' + personErr.message });
      }
      person = newPerson;
    }

    // 2. Check if active lead already exists for this person
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, status')
      .eq('person_id', person.id)
      .maybeSingle();

    if (existingLead) {
      return res.status(200).json({
        ok: true,
        message: 'Lead already exists for this person.',
        lead_id: existingLead.id,
        person_id: person.id
      });
    }

    // 3. Assemble tags and insert Lead
    const tags = [];
    if (topic) tags.push(`topic:${topic}`);
    if (painLevel !== null && !Number.isNaN(painLevel)) tags.push(`pain_level:${painLevel}`);
    if (marketingConsent) tags.push('consent:true');
    if (note) tags.push(`note:${note}`);

    const sourceParts = ['אתר'];
    if (topic) sourceParts.push(topic);
    if (painLevel !== null && !Number.isNaN(painLevel)) sourceParts.push(`עומס ${painLevel}/10`);
    const sourceSummary = sourceParts.join(' • ');

    const leadPayload = {
      person_id: person.id,
      source: sourceSummary,
      status: 'new',
      campaign: utmCampaign,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      tags: tags
    };

    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .insert([leadPayload])
      .select()
      .single();

    if (leadErr) {
      console.error('Error creating lead:', leadErr);
      return res.status(500).json({ error: 'Could not create lead: ' + leadErr.message });
    }

    // 4. Log note in lead_communications if present
    if (note && lead?.id) {
      await supabase.from('lead_communications').insert([{
        lead_id: lead.id,
        type: 'note',
        note: `פנייה מהאתר [${topic || 'כללי'} | עומס: ${painLevel !== null ? painLevel + '/10' : 'לא צוין'}]: ${note}`
      }]);
    }

    return res.status(200).json({
      ok: true,
      lead_id: lead.id,
      person_id: person.id,
      full_name: fullName,
      topic: topic,
      pain_level: painLevel
    });
  } catch (err) {
    console.error('Unexpected error in leads API handler:', err);
    return res.status(500).json({ error: 'Internal server error: ' + (err.message || String(err)) });
  }
}
