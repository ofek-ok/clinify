import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://stwgtsmdtjfwfkibzdlh.supabase.co';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseAnonKey) {
    return res.status(500).json({ error: 'Server owner session configuration incomplete (supabaseAnonKey missing)' });
  }

  // 1. Require explicit credentials in environment or headers
  const ownerEmail = process.env.OWNER_EMAIL;
  const ownerPassword = process.env.OWNER_PASSWORD;

  if (!ownerEmail || !ownerPassword) {
    return res.status(500).json({ 
      error: 'Server owner credentials not configured in environment (OWNER_EMAIL, OWNER_PASSWORD missing)'
    });
  }

  // 2. Reject anonymous callers trying to harvest tokens without valid authentication header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: 'Unauthorized: Anonymous calls to /api/owner-session are not permitted. Pass a valid authorization token or authenticate.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session token' });
    }

    return res.status(200).json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Owner session API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
