import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://stwgtsmdtjfwfkibzdlh.supabase.co';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const ownerEmail = process.env.OWNER_EMAIL;
  const ownerPassword = process.env.OWNER_PASSWORD;

  if (!ownerEmail || !ownerPassword) {
    return res.status(500).json({ error: 'Server owner credentials not configured in environment' });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let { data, error } = await supabase.auth.signInWithPassword({
      email: ownerEmail,
      password: ownerPassword
    });

    if (error && (error.message?.includes('Invalid login credentials') || error.status === 400 || error.message?.includes('User not found'))) {
      // Auto create user if not exists
      const signUpRes = await supabase.auth.signUp({
        email: ownerEmail,
        password: ownerPassword
      });

      if (signUpRes.data?.session) {
        data = signUpRes;
        error = null;
      } else {
        const retry = await supabase.auth.signInWithPassword({
          email: ownerEmail,
          password: ownerPassword
        });
        if (retry.data?.session) {
          data = retry;
          error = null;
        }
      }
    }

    if (error || !data?.session) {
      return res.status(401).json({ error: error?.message || 'Failed to authenticate owner session' });
    }

    return res.status(200).json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        user: {
          id: data.session.user.id,
          email: data.session.user.email
        }
      }
    });
  } catch (err) {
    console.error("Owner session API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
