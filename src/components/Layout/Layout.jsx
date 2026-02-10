import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Header from './Header'
import Footer from './Footer'
import Sidebar from './Sidebar'

/**
 * Layout Component
 * Smart layout wrapper with sidebar, header and footer
 */

const Layout = () => {
  const location = useLocation()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Routes where sidebar should be hidden
  // SOFT-CODED: Removed '/pricing' route for in-house deployment (no subscriptions)
  const publicRoutes = ['/', '/login', '/home', '/enquiry', '/solutions', '/about', '/services/pid-analysis', '/services/pfd-conversion', '/services/asset-integrity', '/services/consulting', '/data-governance', '/security', '/terms-of-service', '/privacy-policy']
  
  const showSidebar = isAuthenticated && !publicRoutes.includes(location.pathname)
  
  // Log sidebar state for debugging
  React.useEffect(() => {
    console.log('📐 Layout State:', {
      isAuthenticated,
      currentPath: location.pathname,
      showSidebar,
      sidebarOpen
    })
  }, [isAuthenticated, location.pathname, showSidebar, sidebarOpen])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} showSidebar={showSidebar} />
      <div className="flex flex-1 pt-16">
        {showSidebar && (
          <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        )}
        <main className={`flex-grow transition-all duration-300 ${showSidebar && sidebarOpen ? 'lg:ml-64' : ''} overflow-x-hidden`}>
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default Layout
