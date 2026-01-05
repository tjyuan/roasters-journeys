
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Access environment variables safely during build time
const env = process.env || {};

export default defineConfig({
  plugins: [react()],
  define: {
    // This allows GitHub to swap in your secrets during the build process
    'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || ''),
    'process.env.SUPABASE_KEY': JSON.stringify(env.SUPABASE_KEY || ''),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
