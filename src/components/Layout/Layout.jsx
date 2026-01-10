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
  const publicRoutes = ['/', '/login', '/register', '/home', '/enquiry', '/solutions', '/about', '/services/pid-analysis', '/services/pfd-conversion', '/services/asset-integrity', '/services/consulting', '/data-governance', '/security', '/terms-of-service', '/privacy-policy']
  
  // Check if current path is a conversion/analysis page that needs full width
  const isFullWidthPage = location.pathname.includes('/pfd/convert') || 
                          location.pathname.includes('/pfd/analyze') ||
                          location.pathname.includes('/pid/report')
  
  const showSidebar = isAuthenticated && !publicRoutes.includes(location.pathname) && !isFullWidthPage
  
  // Log sidebar state for debugging
  React.useEffect(() => {
    console.log('📐 Layout State:', {
      isAuthenticated,
      currentPath: location.pathname,
      isFullWidthPage,
      showSidebar,
      sidebarOpen
    })
  }, [isAuthenticated, location.pathname, showSidebar, sidebarOpen, isFullWidthPage])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} showSidebar={showSidebar} />
      <div className="flex flex-1 pt-16">
        {showSidebar && (
          <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        )}
        <main className={`flex-grow transition-all duration-300 ${showSidebar && sidebarOpen ? 'lg:ml-72' : ''} overflow-x-hidden`}>
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default Layout
