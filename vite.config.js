import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import http from 'http'

// Soft-coded: disable HTTP keep-alive so the proxy re-resolves the backend
// hostname on every request.  Without this, Node caches the old container IP
// after a backend restart, causing 503 "connect ECONNREFUSED" errors until
// the frontend container is also restarted.
//
// NOTE: the custom `agent` option does not always propagate cleanly through
// Vite's bundled http-proxy in dev mode and has been observed to silently
// stall requests (proxyReq event never fires).  It is therefore opt-in via
// `VITE_PROXY_DISABLE_KEEPALIVE=1` rather than always-on.
const PROXY_AGENT = process.env.VITE_PROXY_DISABLE_KEEPALIVE === '1'
  ? new http.Agent({ keepAlive: false })
  : undefined

// Soft-coded proxy timeouts (override via env vars when needed)
// Default raised to 20 min to accommodate long-running AI extractions on
// dense multi-page P&IDs (Instrument Index, PID Verification, PFD Quality).
// Must outlive the client-side fetch timeout (currently 18 min in
// InstrumentIndex.jsx) AND stay within Gunicorn's 20-min worker timeout,
// otherwise the proxy aborts the socket and the browser shows
// ERR_CONNECTION_RESET / "upstream proxy reset".
const PROXY_TIMEOUT_MS = Number(process.env.VITE_PROXY_TIMEOUT_MS || 1200000)
const PROXY_UPSTREAM_TIMEOUT_MS = Number(process.env.VITE_PROXY_UPSTREAM_TIMEOUT_MS || 1200000)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables for this mode
  const env = loadEnv(mode, process.cwd(), '')
  
  // Smart API URL detection (soft-coded for Docker and production)
  // Priority: VITE_API_PROXY_TARGET env var → fallback to localhost:8000
  //
  // Modes (set in .env.local):
  //   LOCAL  → VITE_API_PROXY_TARGET=http://backend_local:8000
  //   PROD   → VITE_API_PROXY_TARGET=https://aiflowbackend-production.up.railway.app
  //
  let apiUrl = env.VITE_API_PROXY_TARGET || 'http://localhost:8000'
  const apiUrlObj = new URL(apiUrl)
  const targetHost = apiUrlObj.host // dynamic: 'localhost:8000' OR 'aiflowbackend-production.up.railway.app'

  // Soft-coded: detect when pointing at production so we can warn in the browser
  const IS_PROD_BACKEND = !apiUrl.includes('localhost') && !apiUrl.includes('127.0.0.1') && !apiUrl.includes('backend_local') && !apiUrl.includes('aiflow_backend')

  console.log('🔧 Vite Config - Mode:', mode)
  console.log('🔧 Vite Config - Proxy Target:', apiUrl)
  if (IS_PROD_BACKEND) {
    console.log('⚠️  PROD BACKEND MODE — all API calls proxy to Railway production. Writes hit production data!')
  }

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['assets/Rejlers_Logo.png', 'favicon.ico'],
        manifest: {
          name: 'RAD AI Platform - Rejlers Abu Dhabi',
          short_name: 'RAD AI',
          description: 'Next-generation AI-powered engineering workspace for the Oil & Gas industry',
          theme_color: '#0A1628',
          background_color: '#0A1628',
          display: 'standalone',
          scope: '/',
          start_url: '/login',
          orientation: 'any',
          icons: [
            {
              src: '/assets/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/assets/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          // CRITICAL: Increase file size limit for precaching large bundles
          // Default 2 MB is too small for production builds with all features
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/radai\.ae\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 5 // 5 minutes
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      // Force a single instance of styled-components so all chunks share the
      // same initialised module — prevents "styled_default is not a function"
      // when multiple vendor chunks each try to initialise their own copy.
      dedupe: ['styled-components', '@emotion/react', '@emotion/styled', 'react', 'react-dom'],
    },
    // Soft-coded: expose backend mode to the React app as a compile-time constant
    // Use in components: if (import.meta.env.VITE_IS_PROD_BACKEND === 'true') { ... }
    // process.env.NODE_ENV is also defined so styled-components v6 can detect
    // the runtime environment — without this styled_default can be undefined in ESM scope.
    define: {
      '__PROD_BACKEND__': JSON.stringify(IS_PROD_BACKEND),
      'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
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
          // Soft-coded explicit timeouts so a stuck upstream surfaces as a
          // 504 rather than hanging the browser request indefinitely.
          timeout: PROXY_TIMEOUT_MS,
          proxyTimeout: PROXY_UPSTREAM_TIMEOUT_MS,
          // Optional fresh-DNS agent — only enabled when explicitly requested.
          ...(PROXY_AGENT ? { agent: PROXY_AGENT } : {}),
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
      // Soft-coded: Increase chunk size warning limit to 1 MB
      // Production bundles are large due to comprehensive feature set
      chunkSizeWarningLimit: 1024, // 1 MB (default is 500 KB)
      rollupOptions: {
        output: {
          // CRITICAL: Manual code splitting to reduce main bundle size
          // Splits large vendor libraries into separate chunks for better caching
          manualChunks: (id) => {
            // React ecosystem - core libraries
            if (id.includes('node_modules/react') || 
                id.includes('node_modules/react-dom') || 
                id.includes('node_modules/react-router') ||
                id.includes('node_modules/scheduler')) {
              return 'vendor-react'
            }
            
            // Material-UI and styling - heavy UI framework
            if (id.includes('node_modules/@mui') || 
                id.includes('node_modules/@emotion') ||
                id.includes('node_modules/styled-components')) {
              return 'vendor-mui'
            }
            
            // Data visualization and charts - large libraries
            if (id.includes('node_modules/recharts') || 
                id.includes('node_modules/d3') ||
                id.includes('node_modules/plotly')) {
              return 'vendor-charts'
            }
            
            // PDF and document processing - heavy dependencies
            if (id.includes('node_modules/pdfjs-dist') || 
                id.includes('node_modules/pdf-lib') ||
                id.includes('node_modules/react-pdf')) {
              return 'vendor-pdf'
            }
            
            // Excel and spreadsheet processing
            if (id.includes('node_modules/xlsx') || 
                id.includes('node_modules/exceljs')) {
              return 'vendor-excel'
            }
            
            // HTTP and API libraries
            if (id.includes('node_modules/axios')) {
              return 'vendor-axios'
            }
            
            // Date and time utilities
            if (id.includes('node_modules/date-fns') || 
                id.includes('node_modules/moment')) {
              return 'vendor-date'
            }
            
            // Icons and assets
            if (id.includes('node_modules/@mui/icons-material') ||
                id.includes('node_modules/react-icons')) {
              return 'vendor-icons'
            }
            
            // All other node_modules go to vendor-misc
            if (id.includes('node_modules')) {
              return 'vendor-misc'
            }
          }
        }
      }
    },
    // Soft-coded: explicitly pre-bundle packages that use non-standard ESM
    // default exports so Vite's esbuild can wrap them correctly.
    // Root cause: @mui/material's TouchRipple imports styled via @mui/styled-engine
    // which re-exports @emotion/styled. Without pre-bundling @emotion/styled,
    // the default export resolves to undefined → "styled_default is not a function".
    optimizeDeps: {
      include: [
        'styled-components',
        '@emotion/styled',
        '@emotion/react',
        '@mui/styled-engine',
        '@mui/material',
      ],
    },
  }
})

