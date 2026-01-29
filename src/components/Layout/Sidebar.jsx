import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { API_BASE_URL } from '../../config/api.config'
import { getSectionTitle } from '../../config/navigationLabels.config'
import { getEngineeringDisciplines } from '../../config/engineeringStructure.config'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  DocumentTextIcon,
  DocumentPlusIcon,
  BeakerIcon,
  CogIcon,
  UsersIcon,
  ChartBarIcon,
  XMarkIcon,
  Bars3Icon,
  FolderIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  TableCellsIcon,
  SparklesIcon
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
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    processEngineering: true,
    // Engineering disciplines
    process: false,
    piping: false,
    instrument: false,
    electrical: false,
    civil: false,
    mechanical: false,
    digitization: false,
    // Other sections
    crs: true,
    finance: true,
    projectControl: true,
    procurement: true,
    qhse: true,
    admin: true
  })

  // Handle nested user object from API response (user.user.is_staff vs user.is_staff)
  const userData = user?.user || user
  // Check admin status from multiple sources:
  // 1. Django User flags (is_staff, is_superuser)
  // 2. Roles array (contains 'Super Administrator' role)
  const hasAdminFlags = userData?.is_staff || userData?.is_superuser
  const hasSuperAdminRole = user?.roles?.some(role => 
    role.code === 'super_admin' || role.name === 'Super Administrator'
  )
  const isAdmin = hasAdminFlags || hasSuperAdminRole

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
        console.log('🖼️ Profile photo URL:', data.profile_photo)
        
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
    console.log('Full user object:', user)
    console.log('Nested userData:', userData)
    console.log('User profile_photo:', user?.profile_photo)
    console.log('userData.is_staff:', userData?.is_staff)
    console.log('userData.is_superuser:', userData?.is_superuser)
    console.log('isAdmin:', isAdmin)
    console.log('User roles:', user?.roles)
    console.log('User Modules:', userModules)
    console.log('==================')
  }, [user, userData, isAdmin, userModules])

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
      title: getSectionTitle('processEngineering'),
      icon: BeakerIcon,
      type: 'section',
      expanded: expandedSections.processEngineering,
      children: getEngineeringDisciplines().map((discipline, index) => ({
        id: discipline.id,
        title: `1.${index + 1} ${discipline.name}`,
        icon: discipline.icon,
        type: 'subsection',
        expanded: expandedSections[discipline.id],
        description: discipline.description,
        color: discipline.color,
        gradient: discipline.gradient,
        children: discipline.subFeatures.map((subFeature, subIndex) => ({
          id: subFeature.id,
          title: subFeature.name,
          icon: subFeature.icon,
          path: subFeature.path,
          description: subFeature.description,
          moduleCode: subFeature.moduleCode,
          badge: subFeature.badge
        }))
      }))
    },
    {
      id: 'crs',
      title: getSectionTitle('crs'),
      icon: ChartBarIcon,
      type: 'section',
      expanded: expandedSections.crs,
      children: [
        {
          id: 'crsDocuments',
          title: '2.1 CRS Documents',
          icon: DocumentTextIcon,
          path: '/crs/documents',
          description: 'Centralized CRS repository',
          moduleCode: 'crs_documents'
        },
        {
          id: 'crsMultipleRevision',
          title: '2.2 Multi-Revision',
          icon: DocumentTextIcon,
          path: '/crs/multiple-revision',
          description: 'AI-powered revision tracking',
          moduleCode: 'crs_documents'
        },
        {
          id: 'pid',
          title: '2.3 P&ID Checker',
          icon: DocumentTextIcon,
          path: '/pid/upload',
          description: 'AI-powered P&ID verification',
          moduleCode: 'pid_analysis',
          badge: 'AI'
        },
        {
          id: 'designiq',
          title: '2.4 DesignIQ',
          icon: BeakerIcon,
          path: '/designiq',
          description: 'AI-powered design optimization',
          moduleCode: 'designiq',
          badge: 'AI'
        },
        {
          id: 'pfd',
          title: '2.5 PFD to P&ID',
          icon: DocumentTextIcon,
          path: '/pfd/upload',
          description: 'Intelligent PFD conversion',
          moduleCode: 'pfd_to_pid',
          badge: 'AI'
        }
      ]
    },      {
        id: 'finance',
        title: getSectionTitle('finance'),
        icon: CurrencyDollarIcon,
        type: 'section',
        expanded: expandedSections.finance,
        children: [
          {
            id: 'financeUpload',
            title: '3.1 Upload Invoice',
            path: '/finance/upload',
            icon: DocumentPlusIcon,
            moduleCode: 'finance'
          },
          {
            id: 'financeInvoices',
            title: '3.2 Invoices',
            path: '/finance/invoices',
            icon: DocumentTextIcon,
            moduleCode: 'finance'
          }
        ]
      },
      {
        id: 'projectControl',
        title: getSectionTitle('projectControl'),
      icon: BriefcaseIcon,
      type: 'section',
      expanded: expandedSections.projectControl,
      children: [
        {
          id: 'projectManagement',
          title: '4.1 Projects',
          icon: FolderIcon,
          path: '/projects',
          description: 'Manage and track projects',
          moduleCode: 'project_control'
        }
      ]
    },
    {
      id: 'procurement',
      title: getSectionTitle('procurement'),
      icon: BriefcaseIcon,
      type: 'section',
      expanded: expandedSections.procurement,
      children: [
        {
          id: 'procurementDashboard',
          title: '5.1 Dashboard',
          icon: HomeIcon,
          path: '/procurement',
          description: 'Procurement overview',
          moduleCode: 'procurement'
        },
        {
          id: 'vendors',
          title: '5.2 Vendors',
          icon: UsersIcon,
          path: '/procurement/vendors',
          description: 'Vendor management',
          moduleCode: 'procurement'
        },
        {
          id: 'requisitions',
          title: '5.3 Recommendations',
          icon: DocumentTextIcon,
          path: '/procurement/requisitions',
          description: 'Purchase recommendations',
          moduleCode: 'procurement'
        },
        {
          id: 'purchaseOrders',
          title: '5.4 Purchase Orders',
          icon: DocumentPlusIcon,
          path: '/procurement/orders',
          description: 'PO management',
          moduleCode: 'procurement'
        },
        {
          id: 'receipts',
          title: '5.5 Receipts',
          icon: FolderIcon,
          path: '/procurement/receipts',
          description: 'Goods receipt',
          moduleCode: 'procurement'
        }
      ]
    },
    {
      id: 'qhse',
      title: getSectionTitle('hse'),
      icon: ShieldCheckIcon,
      type: 'section',
      expanded: expandedSections.qhse,
      children: [
        {
          id: 'generalQHSE',
          title: '6.1 Project Quality',
          icon: ShieldCheckIcon,
          path: '/qhse/general',
          description: 'Project quality management',
          moduleCode: 'qhse'
        },
        {
          id: 'detailedView',
          title: '6.2 Project Quality Details',
          icon: TableCellsIcon,
          path: '/qhse/general/detailed',
          description: 'Detailed project quality view',
          moduleCode: 'qhse'
        },
        {
          id: 'qualityManagement',
          title: '6.3 Quality Management',
          icon: ChartBarIcon,
          path: '/qhse/general/quality',
          description: 'Quality metrics and audits',
          moduleCode: 'qhse'
        },
        {
          id: 'healthSafety',
          title: '6.4 Health & Safety',
          icon: ShieldCheckIcon,
          path: '/qhse/general/health-safety',
          description: 'Health and safety management',
          moduleCode: 'qhse'
        },
        {
          id: 'environmental',
          title: '6.5 Environmental',
          icon: DocumentTextIcon,
          path: '/qhse/general/environmental',
          description: 'Environmental management',
          moduleCode: 'qhse'
        },
        {
          id: 'energy',
          title: '6.6 Energy',
          icon: ChartBarIcon,
          path: '/qhse/general/energy',
          description: 'Energy management',
          moduleCode: 'qhse'
        },
        {
          id: 'interconnectedDemo',
          title: '6.7 AI Interconnected System',
          icon: SparklesIcon,
          path: '/qhse/interconnected-demo',
          description: 'AI-powered cross-module intelligence demo',
          moduleCode: 'qhse',
          badge: 'AI'
        }
      ]
    }
  ]

  // Helper function to check if user has access to a menu item
  const hasModuleAccess = (item) => {
    // Dashboard and admin sections are handled separately
    if (item.requiresModule === false) return true
    if (item.type === 'section' || item.type === 'subsection') return true // Sections/subsections are shown if they have accessible children
    
    // Super Administrators and Staff have access to all modules
    if (isAdmin) return true
    
    // Check if user has the required module
    if (item.moduleCode) {
      return userModules.includes(item.moduleCode)
    }
    
    return true
  }

  // Filter menu items based on user's modules
  const filterMenuByModules = (items) => {
    return items.map(item => {
      if ((item.type === 'section' || item.type === 'subsection') && item.children) {
        // Recursively filter children
        const accessibleChildren = item.children.map(child => {
          if (child.type === 'subsection' && child.children) {
            // Filter nested children for subsections
            const accessibleNestedChildren = child.children.filter(hasModuleAccess)
            if (accessibleNestedChildren.length > 0) {
              return { ...child, children: accessibleNestedChildren }
            }
            return null
          }
          return hasModuleAccess(child) ? child : null
        }).filter(child => child !== null)
        
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
      title: '7. Admin',
      icon: CogIcon,
      type: 'section',
      expanded: expandedSections.admin,
      badge: 'ADMIN',
      children: [
        {
          id: 'adminDashboard',
          title: '7.1 Dashboard',
          icon: ChartBarIcon,
          path: '/admin/dashboard',
          description: 'System overview & analytics'
        },
        {
          id: 'userManagement',
          title: '7.2 Users & Roles',
          icon: UsersIcon,
          path: '/admin/users',
          description: 'User accounts & permissions'
        },
        {
          id: 'subscriptionManagement',
          title: '7.3 Subscription',
          icon: CurrencyDollarIcon,
          path: '/admin/subscriptions',
          description: 'Plans & billing management'
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
          ${isCollapsed ? 'w-20' : 'w-72'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transform transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col h-[calc(100vh-4rem)]
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed ? (
            <>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">AI</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  RADAI
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="hidden lg:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Collapse sidebar"
                >
                  <ChevronRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setIsCollapsed(false)}
              className="w-full flex justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Expand sidebar"
            >
              <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          )}
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
                    w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 rounded-lg
                    transition-all duration-200
                    ${isActiveRoute(item.path)
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 text-blue-700 dark:text-blue-300 font-semibold shadow-sm'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                  title={isCollapsed ? item.title : ''}
                >
                  <item.icon className={`w-5 h-5 ${isActiveRoute(item.path) ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                  {!isCollapsed && <span>{item.title}</span>}
                </button>
              ) : (
                // Section with children
                <div className="space-y-1">
                  <button
                    onClick={() => isCollapsed ? null : toggleSection(item.id)}
                    className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold`}
                    title={isCollapsed ? item.title : ''}
                  >
                    {isCollapsed ? (
                      <item.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <>
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
                      </>
                    )}
                  </button>

                  {/* Child items */}
                  {!isCollapsed && item.expanded && (
                    <div className="ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-1">
                      {item.children.map((child) => (
                        child.type === 'subsection' ? (
                          // Subsection with nested children (like Engineering disciplines)
                          <div key={child.id} className="space-y-1">
                            <button
                              onClick={() => toggleSection(child.id)}
                              className={`
                                w-full flex items-center justify-between px-3 py-2 rounded-lg
                                transition-all duration-200
                                ${expandedSections[child.id] 
                                  ? 'bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100' 
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }
                              `}
                            >
                              <div className="flex items-center space-x-2">
                                <child.icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{child.title}</span>
                              </div>
                              {expandedSections[child.id] ? (
                                <ChevronDownIcon className="w-3 h-3" />
                              ) : (
                                <ChevronRightIcon className="w-3 h-3" />
                              )}
                            </button>
                            
                            {/* Nested sub-features */}
                            {expandedSections[child.id] && (
                              <div className="ml-4 pl-3 border-l-2 border-gray-100 dark:border-gray-600 space-y-0.5">
                                {child.children.map((subFeature) => (
                                  <button
                                    key={subFeature.id}
                                    onClick={() => handleNavigation(subFeature.path)}
                                    className={`
                                      w-full flex items-center justify-between px-2.5 py-2 rounded-md
                                      transition-all duration-200 text-left group
                                      ${isActiveRoute(subFeature.path)
                                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-300 font-medium shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                                      }
                                    `}
                                  >
                                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                                      <subFeature.icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActiveRoute(subFeature.path) ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                      <span className="text-xs truncate">{subFeature.title}</span>
                                    </div>
                                    {subFeature.badge && (
                                      <span className={`
                                        px-1.5 py-0.5 text-[10px] font-bold rounded-full flex-shrink-0
                                        ${subFeature.badge === 'AI' 
                                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                                          : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                        }
                                      `}>
                                        {subFeature.badge}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          // Regular child item (no nested children)
                          <button
                            key={child.id}
                            onClick={() => handleNavigation(child.path)}
                            className={`
                              w-full flex items-center justify-between px-3 py-2.5 rounded-lg
                              transition-all duration-200 text-left
                              ${isActiveRoute(child.path)
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 text-blue-700 dark:text-blue-300 font-medium shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                              }
                            `}
                          >
                            <div className="flex items-start space-x-3 flex-1 min-w-0">
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
                            </div>
                            {child.badge && (
                              <span className={`
                                px-2 py-0.5 text-[10px] font-bold rounded-full flex-shrink-0 ml-2
                                ${child.badge === 'AI' 
                                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                }
                              `}>
                                {child.badge}
                              </span>
                            )}
                          </button>
                        )
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
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden ring-2 ring-white dark:ring-gray-700 shadow-lg">
              {user?.profile_photo ? (
                <img 
                  src={user.profile_photo} 
                  alt={userData?.first_name || 'User'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center ${user?.profile_photo ? 'hidden' : 'flex'}`}
              >
                <span className="text-white font-semibold text-sm">
                  {userData?.first_name?.[0] || userData?.email?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              {isAdmin && isCollapsed && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full border-2 border-white"></span>
              )}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {userData?.first_name || userData?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {userData?.email || 'user@example.com'}
                </p>
                {isAdmin && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full mt-1">
                    ADMIN
                  </span>
                )}
              </div>
            )}
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



