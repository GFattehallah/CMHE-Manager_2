import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Fix: Define __dirname for ESM as it is not globally available
const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Fix: Use __dirname to resolve the environment directory instead of process.cwd() to avoid typing issues with the process object
  const env = loadEnv(mode, __dirname, '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './'),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ""),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ""),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    server: {
      port: 3000,
      host: true
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-charts': ['recharts'],
            'vendor-ui': ['lucide-react', '@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/timegrid'],
            'vendor-supabase': ['@supabase/supabase-js']
          }
        }
      }
    }
  };
});