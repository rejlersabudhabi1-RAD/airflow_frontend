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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Routes where sidebar should be hidden
  const publicRoutes = ['/', '/login', '/register', '/home']
  const showSidebar = isAuthenticated && !publicRoutes.includes(location.pathname)

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex flex-1">
        {showSidebar && (
          <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        )}
        <main className={`flex-grow ${showSidebar ? 'lg:ml-0' : ''}`}>
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default Layout
