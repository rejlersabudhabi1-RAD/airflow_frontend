import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables for this mode
  const env = loadEnv(mode, process.cwd(), '')
  
  // Smart API URL detection (soft-coded for Docker and production)
  // Priority: VITE_API_PROXY_TARGET env var → fallback to localhost:8000
  // Set VITE_API_PROXY_TARGET=https://aiflowbackend-production-9bdc.up.railway.app to use Railway testing backend
  let apiUrl = env.VITE_API_PROXY_TARGET || 'http://localhost:8000'
  const apiUrlObj = new URL(apiUrl)
  const targetHost = apiUrlObj.host // dynamic: 'localhost:8000' OR 'aiflowbackend-production-9bdc.up.railway.app'

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
      watch: {
        usePolling: true, // Required for Docker on Windows (no native FS events through bind mounts)
        interval: 1000,
      },
      proxy: {
        '/api': {
          target: apiUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              // SOFT-CODED: send a proper JSON 503 instead of a silent empty 500
              // so the frontend shows a meaningful error (backend unreachable)
              const msg = JSON.stringify({
                error: 'backend_unavailable',
                message: `Proxy cannot reach backend at ${apiUrl}. Is it running?`,
                detail: err.message,
              })
              console.log(`❌ Proxy error → ${apiUrl}:`, err.message)
              if (!res.headersSent) {
                res.writeHead(503, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(msg) })
                res.end(msg)
              }
            })
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // Forward the original host header for proper URL generation
              proxyReq.setHeader('X-Forwarded-Host', 'localhost:5173')
              proxyReq.setHeader('X-Forwarded-Proto', 'http')
              proxyReq.setHeader('X-Forwarded-For', req.socket.remoteAddress)
              // SOFT-CODED: Host derives from target URL — works for both localhost and Railway
              proxyReq.setHeader('Host', targetHost)
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

