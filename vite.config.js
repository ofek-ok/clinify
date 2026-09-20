import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const anonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://stwgtsmdtjfwfkibzdlh.supabase.co';

  try {
    const configPath = path.resolve(process.cwd(), 'api/_config.js');
    const content = `export const SUPABASE_URL = ${JSON.stringify(url)};\nexport const SUPABASE_ANON_KEY = ${JSON.stringify(anonKey)};\n`;
    fs.writeFileSync(configPath, content);
  } catch (e) {
    console.warn('Could not write api/_config.js:', e);
  }

  return {
    plugins: [react(), tailwindcss()],
  };
});
