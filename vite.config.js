import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import fs from 'fs'

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    {
      name: 'dump-build-env',
      buildStart() {
        try {
          const url = process.env.VITE_SUPABASE_URL || '';
          const key = process.env.VITE_SUPABASE_ANON_KEY || '';
          fs.writeFileSync('./public/env_check.json', JSON.stringify({ url, key }));
        } catch (e) {}
      }
    }
  ],
})

