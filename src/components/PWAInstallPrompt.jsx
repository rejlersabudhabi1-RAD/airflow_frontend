import React, { useState, useEffect } from 'react'
import PWAInstallModal from './PWAInstallModal'

/**
 * PWA Install Prompt Component
 * Shows "Download Desktop App" button for PWA installation
 * 
 * Strategy:
 * - Always shows button by default (except if already installed)
 * - Captures beforeinstallprompt event when available
 * - Provides fallback instructions if browser doesn't support PWA
 */
const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(true) // Show by default
  const [isInstalled, setIsInstalled] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    console.log('🚀 PWA: Component mounted, checking installation status...')
    
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      setShowInstall(false)
      console.log('✅ PWA: Already installed (running in standalone mode)')
      return
    }

    // Check if running as PWA on iOS
    if (window.navigator.standalone === true) {
      setIsInstalled(true)
      setShowInstall(false)
      console.log('✅ PWA: Already installed (iOS standalone)')
      return
    }

    // Show the install button by default
    setShowInstall(true)
    console.log('📱 PWA: Install button visible')

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('✅ PWA: beforeinstallprompt event captured!')
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      // Ensure button is visible
      setShowInstall(true)
    }

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log('🎉 PWA: App installed successfully!')
      setIsInstalled(true)
      setShowInstall(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log(`✅ PWA: ${registrations.length} service worker(s) registered`)
        if (registrations.length > 0) {
          registrations.forEach(reg => {
            console.log('   - SW State:', reg.active ? reg.active.state : 'no active worker')
          })
        }
      })
      
      navigator.serviceWorker.ready.then(() => {
        console.log('✅ PWA: Service Worker is ready and active')
      }).catch(err => {
        console.error('❌ PWA: Service Worker error:', err)
      })
    } else {
      console.warn('⚠️ PWA: Service Workers not supported in this browser')
    }

    // Debug: Log current URL and protocol
    console.log(`📍 PWA: Running on ${window.location.protocol}//${window.location.host}`)
    console.log(`🔐 PWA: HTTPS: ${window.location.protocol === 'https:'}`)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    // Show our custom modal (works in both dev and production)
    setShowModal(true)
  }

  const handleModalInstall = async () => {
    // If we have a deferred prompt, use the browser's native install flow
    if (deferredPrompt) {
      console.log('📱 PWA: Triggering native browser install prompt...')
      
      // Close modal
      setShowModal(false)

      // Small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300))

      // Show the browser's native install prompt
      deferredPrompt.prompt()

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('✅ PWA: User accepted installation')
      } else {
        console.log('❌ PWA: User dismissed installation')
      }

      // Clear the deferred prompt
      setDeferredPrompt(null)
      return
    }

    // No deferred prompt - provide manual installation instructions
    console.log('ℹ️ PWA: No beforeinstallprompt event - showing manual instructions')
    
    // Close modal
    setShowModal(false)
    
    // Detect browser
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
    const isEdge = /Edg/.test(navigator.userAgent)
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
    const isFirefox = /Firefox/.test(navigator.userAgent)
    
    let instructions = 'To install RADAI:\n\n'
    
    if (isChrome || isEdge) {
      instructions += 'Chrome/Edge:\n'
      instructions += '1. Click the ⋮ (menu) button in the top-right\n'
      instructions += '2. Select "Install RADAI" or "Install app"\n'
      instructions += '3. Click "Install" in the confirmation dialog\n\n'
      instructions += 'Or look for the 🖥️ install icon in the address bar'
    } else if (isSafari) {
      instructions += 'Safari (iOS/Mac):\n'
      instructions += '1. Tap the Share button (📤)\n'
      instructions += '2. Scroll down and tap "Add to Home Screen"\n'
      instructions += '3. Tap "Add" to confirm'
    } else if (isFirefox) {
      instructions += 'Firefox:\n'
      instructions += '1. Click the ⋮ (menu) button\n'
      instructions += '2. Select "Install" or "Add to Home Screen"\n'
      instructions += '3. Confirm installation'
    } else {
      instructions += 'Your browser:\n'
      instructions += '1. Look for install options in your browser menu\n'
      instructions += '2. Or visit Chrome/Edge for full PWA support'
    }
    
    alert(instructions)
  }

  // Don't render if already installed
  if (isInstalled || !showInstall) return null

  return (
    <>
      {/* Floating install button */}
      <button
        onClick={handleInstallClick}
        className="fixed bottom-6 right-6 z-50 group"
        style={{
          background: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 50%, #0e7490 100%)',
          boxShadow: '0 10px 40px -10px rgba(8, 145, 178, 0.6), 0 0 0 2px rgba(115, 189, 200, 0.2)'
        }}
      >
        <div className="relative px-6 py-3 rounded-xl overflow-hidden">
          {/* Animated background shimmer */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s ease-in-out infinite'
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex items-center space-x-3">
            {/* Download icon */}
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            
            <div className="text-left">
              <div className="text-white font-black text-sm leading-tight">
                Download Desktop App
              </div>
              <div className="text-cyan-100 text-xs font-semibold">
                Install RADAI for faster access
              </div>
            </div>

            {/* Arrow icon */}
            <svg className="w-5 h-5 text-white transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>

        {/* Keyframe animations */}
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
        `}</style>
      </button>

      {/* Professional Installation Modal */}
      <PWAInstallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onInstall={handleModalInstall}
      />
    </>
  )
}

export default PWAInstallPrompt
