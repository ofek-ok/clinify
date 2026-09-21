import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://stwgtsmdtjfwfkibzdlh.supabase.co';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  const ownerEmail = process.env.OWNER_EMAIL;
  const ownerPassword = process.env.OWNER_PASSWORD;

  return res.status(200).json({
    hasAnonKey: !!supabaseAnonKey,
    anonKeyLength: supabaseAnonKey ? supabaseAnonKey.length : 0,
    hasOwnerEmail: !!ownerEmail,
    hasOwnerPassword: !!ownerPassword,
    url: supabaseUrl
  });
}
