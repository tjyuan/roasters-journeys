
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This allows GitHub to swap in your secrets during the build process
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
    'process.env.SUPABASE_KEY': JSON.stringify(process.env.SUPABASE_KEY),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
