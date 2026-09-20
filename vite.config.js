import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

console.log('REAL_ENV_URL:', process.env.VITE_SUPABASE_URL);
console.log('REAL_ENV_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY);

export default defineConfig({
  plugins: [react(), tailwindcss()],
})



