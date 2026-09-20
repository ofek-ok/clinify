import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const anonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const url = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://stwgtsmdtjfwfkibzdlh.supabase.co';

  try {
    const apiDir = path.resolve(process.cwd(), 'api');
    if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir, { recursive: true });

    fs.writeFileSync(
      path.resolve(apiDir, 'runtime-config.json'),
      JSON.stringify({ url, anonKey })
    );
  } catch (e) {
    console.warn('Could not write runtime-config.json:', e);
  }

  return {
    plugins: [react(), tailwindcss()],
  };
});
