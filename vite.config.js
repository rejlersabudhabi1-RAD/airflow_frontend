import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables for this mode
  const env = loadEnv(mode, process.cwd(), '')
  // Default to production backend if not specified
  const apiUrl = env.VITE_API_URL || 'https://aiflowbackend-production.up.railway.app'

  console.log('🔧 Vite Config - API URL:', apiUrl)

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Listen on all interfaces for Docker
      port: 3000,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  }
})
