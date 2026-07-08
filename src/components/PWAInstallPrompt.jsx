import React, { useState, useEffect } from 'react'
import PWAInstallModal from './PWAInstallModal'

/**
 * PWA Install Prompt Component
 * Shows "Download Desktop App" button when PWA is installable
 * Opens professional modal before browser prompt
 */
const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstall, setShowInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      // Show the install button
      setShowInstall(true)
    }

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowInstall(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    // Show our custom modal first
    setShowModal(true)
  }

  const handleModalInstall = async () => {
    if (!deferredPrompt) return

    // Close modal
    setShowModal(false)

    // Small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300))

    // Show the browser's native install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('✅ User accepted PWA installation')
    } else {
      console.log('❌ User dismissed PWA installation')
    }

    // Clear the deferred prompt
    setDeferredPrompt(null)
    setShowInstall(false)
  }

  // Don't render if already installed or not installable
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
                Install RAD AI for faster access
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
