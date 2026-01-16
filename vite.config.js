import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables for this mode
  const env = loadEnv(mode, process.cwd(), '')
  
  // Smart API URL detection (soft-coded for Docker and production)
  // For local development in Docker, proxy to backend service using Docker service name
  // In Docker: use service name 'backend' (from docker-compose)
  // Outside Docker: use localhost
  let apiUrl = env.VITE_API_PROXY_TARGET || 'http://backend:8000'

  console.log('🔧 Vite Config - Mode:', mode)
  console.log('🔧 Vite Config - Proxy Target:', apiUrl)

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0', // Listen on all interfaces for Docker
      port: 5173, // Use port 5173 for local development
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('❌ Proxy error:', err.message)
            })
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('📤 Proxy request:', req.method, req.url, '→', apiUrl + req.url)
            })
          }
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
    },
  }
})
