import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

function serverEnvPlugin() {
  return {
    name: 'server-env-plugin',
    buildStart() {
      const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
      const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://stwgtsmdtjfwfkibzdlh.supabase.co';
      try {
        const dir = typeof __dirname !== 'undefined' ? __dirname : (import.meta.dirname || '.');
        const configPath = path.resolve(dir, 'api/_config.js');
        const content = `export const SUPABASE_URL = ${JSON.stringify(url)};\nexport const SUPABASE_ANON_KEY = ${JSON.stringify(anonKey)};\n`;
        fs.writeFileSync(configPath, content);
      } catch (e) {
        console.warn('Could not write api/_config.js:', e);
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serverEnvPlugin()],
});
