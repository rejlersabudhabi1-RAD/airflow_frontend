import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables for this mode
  const env = loadEnv(mode, process.cwd(), '')
  // Use host.docker.internal for Docker on Windows/Mac, localhost for Linux
  const apiUrl = env.VITE_API_URL || 'http://host.docker.internal:8000'

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0', // Listen on all interfaces for Docker
      port: 3000,
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  }
})
