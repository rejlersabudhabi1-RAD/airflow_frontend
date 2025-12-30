import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { API_BASE_URL } from '../../config/api.config'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  DocumentTextIcon,
  BeakerIcon,
  CogIcon,
  UsersIcon,
  ChartBarIcon,
  XMarkIcon,
  Bars3Icon,
  FolderIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline'

/**
 * Sidebar Navigation Component
 * Professional hierarchical menu for RADAI platform
 */

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSelector((state) => state.auth)
  const [userModules, setUserModules] = useState([])
  const [expandedSections, setExpandedSections] = useState({
    processEngineering: true,
    crs: true,
    projectControl: true,
    admin: true
  })

  const isAdmin = user?.is_staff || user?.is_superuser

  // Fetch user's accessible modules
  React.useEffect(() => {
    const fetchUserModules = async () => {
      try {
        const token = localStorage.getItem('radai_access_token') || localStorage.getItem('access')
        const apiUrl = `${API_BASE_URL}/rbac/users/me/`
        console.log('🔐 Fetching modules from:', apiUrl)
        const response = await fetch(apiUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          console.error('Failed to fetch modules, status:', response.status)
          return
        }
        
        const data = await response.json()
        console.log('🔐 Full user data:', data)
        
        if (data.modules && Array.isArray(data.modules)) {
          const moduleCodes = data.modules.map(m => m.code)
          setUserModules(moduleCodes)
          console.log('🔐 User accessible modules:', moduleCodes)
        } else {
          console.warn('No modules found in response')
          setUserModules([])
        }
      } catch (error) {
        console.error('Failed to fetch user modules:', error)
        setUserModules([])
      }
    }
    
    if (user) {
      fetchUserModules()
    }
  }, [user])

  // Debug logging
  React.useEffect(() => {
    console.log('=== SIDEBAR DEBUG ===')
    console.log('User object:', user)
    console.log('is_staff:', user?.is_staff)
    console.log('is_superuser:', user?.is_superuser)
    console.log('isAdmin:', isAdmin)
    console.log('User Modules:', userModules)
    console.log('==================')
  }, [user, isAdmin, userModules])

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Check if route is active
  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Navigation menu structure
  const menuStructure = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: HomeIcon,
      path: '/dashboard',
      type: 'single',
      requiresModule: false // Dashboard is always accessible
    },
    {
      id: 'processEngineering',
      title: '1. Process Engineering',
      icon: BeakerIcon,
      type: 'section',
      expanded: expandedSections.processEngineering,
      children: [
        {
          id: 'pid',
          title: '1.1 P&ID Design Verification',
          icon: DocumentTextIcon,
          path: '/pid/upload',
          description: 'AI-powered engineering review',
          moduleCode: 'pid_analysis'
        },
        {
          id: 'pfd',
          title: '1.2 PFD to P&ID Converter',
          icon: DocumentTextIcon,
          path: '/pfd/upload',
          description: 'Intelligent conversion',
          moduleCode: 'pfd_to_pid'
        }
      ]
    },
    {
      id: 'crs',
      title: '2. CRS - Comment Resolution Sheet',
      icon: ChartBarIcon,
      type: 'section',
      expanded: expandedSections.crs,
      children: [
        {
          id: 'crsDocuments',
          title: '2.1 CRS Document Management',
          icon: DocumentTextIcon,
          path: '/crs/documents',
          description: 'Centralized CRS repository',
          moduleCode: 'crs_documents'
        }
      ]
    },
    {
      id: 'projectControl',
      title: '3. Project Control',
      icon: BriefcaseIcon,
      type: 'section',
      expanded: expandedSections.projectControl,
      children: [
        {
          id: 'projectManagement',
          title: '3.1 Project Management',
          icon: FolderIcon,
          path: '/projects',
          description: 'Manage and track projects',
          moduleCode: 'project_control'
        }
      ]
    }
  ]

  // Helper function to check if user has access to a menu item
  const hasModuleAccess = (item) => {
    // Dashboard and admin sections are handled separately
    if (item.requiresModule === false) return true
    if (item.type === 'section') return true // Sections are shown if they have accessible children
    
    // Check if user has the required module
    if (item.moduleCode) {
      return isAdmin || userModules.includes(item.moduleCode)
    }
    
    return true
  }

  // Filter menu items based on user's modules
  const filterMenuByModules = (items) => {
    return items.map(item => {
      if (item.type === 'section' && item.children) {
        // Filter children based on module access
        const accessibleChildren = item.children.filter(hasModuleAccess)
        
        // Only show section if it has accessible children
        if (accessibleChildren.length > 0) {
          return { ...item, children: accessibleChildren }
        }
        return null
      }
      
      // For single items, check module access
      if (hasModuleAccess(item)) {
        return item
      }
      
      return null
    }).filter(item => item !== null)
  }

  const filteredMenu = filterMenuByModules(menuStructure)

  // Add admin section if user is admin
  if (isAdmin) {
    filteredMenu.push({
      id: 'admin',
      title: '4. User Management',
      icon: UsersIcon,
      type: 'section',
      expanded: expandedSections.admin,
      badge: 'ADMIN',
      children: [
        {
          id: 'adminDashboard',
          title: '4.1 Admin Dashboard',
          icon: ChartBarIcon,
          path: '/admin',
          description: 'System overview & analytics'
        },
        {
          id: 'userManagement',
          title: '4.2 Manage Users & Roles',
          icon: UsersIcon,
          path: '/admin/users',
          description: 'User accounts & permissions'
        }
      ]
    })
  }

  const handleNavigation = (path) => {
    navigate(path)
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 1024) {
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 top-16
          w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-[calc(100vh-4rem)]
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">AI</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              RADAI
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredMenu.map((item) => (
            <div key={item.id}>
              {item.type === 'single' ? (
                // Single menu item
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${isActiveRoute(item.path)
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 text-blue-700 dark:text-blue-300 font-semibold shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <item.icon className={`w-5 h-5 ${isActiveRoute(item.path) ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                  <span>{item.title}</span>
                </button>
              ) : (
                // Section with children
                <div className="space-y-1">
                  <button
                    onClick={() => toggleSection(item.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span>{item.title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                      {item.expanded ? (
                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </button>

                  {/* Child items */}
                  {item.expanded && (
                    <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-1">
                      {item.children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => handleNavigation(child.path)}
                          className={`
                            w-full flex items-start space-x-3 px-3 py-2.5 rounded-lg
                            transition-all duration-200 text-left
                            ${isActiveRoute(child.path)
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 text-blue-700 dark:text-blue-300 font-medium shadow-sm'
                              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                            }
                          `}
                        >
                          <child.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isActiveRoute(child.path) ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm ${isActiveRoute(child.path) ? 'font-semibold' : 'font-medium'}`}>
                              {child.title}
                            </div>
                            {child.description && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                                {child.description}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer - User Info */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.first_name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.email || 'user@example.com'}
              </p>
              {isAdmin && (
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full mt-1">
                  ADMIN
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-30 p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>
    </>
  )
}

export default Sidebar
