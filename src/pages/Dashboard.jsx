import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { fetchFeatures } from '../store/featureSlice'
import FeatureCard from '../components/FeatureCard'
import ContactSupport from '../components/support/ContactSupport'
import Documentation from '../components/documentation/Documentation'
import { DASHBOARD_WIDGETS } from '../config/dashboard.config'
import { StatCard, DepartmentCard, NotificationCard, SkeletonCard } from '../components/Dashboard/DashboardWidgets'
import { API_BASE_URL } from '../config/api.config'
import { BellIcon, ArrowPathIcon, ChartBarIcon, Cog6ToothIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { FEATURE_FLAGS } from '../config/features.config'
import FeaturesBrowser from '../components/Features/FeaturesBrowser'
import AdvancedMetricCard from '../components/Dashboard/AdvancedMetricCard'
import { DASHBOARD_METRICS, DASHBOARD_LAYOUT } from '../config/dashboardMetrics.config'
import { USER_DISPLAY_CONFIG } from '../config/userDisplay.config'
import RealTimeActivityFeed from '../components/Dashboard/RealTimeActivityFeed'

/**
 * Dashboard Page
 * Advanced dashboard with modern UI/UX and intelligent metrics
 * Scalable design for growing features
 */

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const { features, loading } = useSelector((state) => state.features)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('all')
  const [showContactSupport, setShowContactSupport] = useState(false)
  const [showDocumentation, setShowDocumentation] = useState(false)
  const [dashboardStats, setDashboardStats] = useState({})
  const [notifications, setNotifications] = useState([])
  const [departments, setDepartments] = useState({})
  const [loadingStats, setLoadingStats] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [useAdvancedFeatures, setUseAdvancedFeatures] = useState(FEATURE_FLAGS.enableAdvancedFeaturesCatalog)
  
  // Advanced metrics state
  const [metricsData, setMetricsData] = useState({})
  const [loadingMetrics, setLoadingMetrics] = useState(true)

  useEffect(() => {
    dispatch(fetchFeatures())
    fetchDashboardData()
    fetchAdvancedMetrics()
  }, [dispatch])

  // Auto-refresh dashboard data
  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(() => {
      fetchDashboardData()
      fetchAdvancedMetrics()
    }, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [autoRefresh])

  // Fetch advanced metrics from backend
  const fetchAdvancedMetrics = async () => {
    try {
      const token = localStorage.getItem('radai_access_token') || localStorage.getItem('access')
      const response = await fetch(`${API_BASE_URL}/dashboard/metrics/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMetricsData(data)
      }
    } catch (error) {
      console.error('Error fetching advanced metrics:', error)
    } finally {
      setLoadingMetrics(false)
    }
  }

  // Fetch comprehensive dashboard data
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('radai_access_token') || localStorage.getItem('access')
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }

      // Fetch data in parallel
      const [notificationsRes, projectsRes, engineeringRes, procurementRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/notifications/`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE_URL}/projects/stats/`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE_URL}/pid/stats/`, { headers }).then(r => r.ok ? r.json() : null),
        fetch(`${API_BASE_URL}/procurement/orders/dashboard/`, { headers }).then(r => r.ok ? r.json() : null)
      ])

      // Process results safely
      if (notificationsRes.status === 'fulfilled' && notificationsRes.value) {
        setNotifications(notificationsRes.value.results || [])
      }

      const stats = {}
      if (projectsRes.status === 'fulfilled' && projectsRes.value) {
        stats.projects = projectsRes.value
      }
      if (engineeringRes.status === 'fulfilled' && engineeringRes.value) {
        stats.engineering = engineeringRes.value
      }
      if (procurementRes.status === 'fulfilled' && procurementRes.value) {
        stats.procurement = procurementRes.value
      }

      setDashboardStats(stats)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  // Get current time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Categorize features
  const categorizedFeatures = features?.reduce((acc, feature) => {
    const category = feature.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(feature)
    return acc
  }, {}) || {}

  const categories = [
    { id: 'all', name: 'All Features', icon: '🚀' },
    { id: 'engineering', name: 'Process Engineering', icon: '⚙️' },
    { id: 'document_management', name: 'CRS Documents', icon: '📋' },
    { id: 'finance', name: 'Finance', icon: '💰' },
    { id: 'sales', name: 'Dept of Sales', icon: '💼' },
    { id: 'project_control', name: 'Project Control', icon: '📊' },
    { id: 'procurement', name: 'Procurement', icon: '🚚' },
    { id: 'quality_assurance', name: 'QHSE', icon: '🛡️' },
    { id: 'other', name: 'Other', icon: '📦' }
  ]

  // Smart feature grouping - Group features by route
  const groupFeaturesByRoute = (featuresList) => {
    const routeGroups = {}
    const groupedFeatures = []
    
    featuresList?.forEach(feature => {
      const route = feature.frontendRoute
      if (!routeGroups[route]) {
        routeGroups[route] = []
      }
      routeGroups[route].push(feature)
    })
    
    // Convert groups to feature objects
    Object.entries(routeGroups).forEach(([route, featuresInRoute]) => {
      if (featuresInRoute.length === 1) {
        groupedFeatures.push(featuresInRoute[0])
      } else {
        // Multiple features - create grouped card
        const mainFeature = featuresInRoute[0]
        const isSalesModule = featuresInRoute.some(f => f.category === 'sales')
        
        groupedFeatures.push({
          ...mainFeature,
          isGrouped: true,
          subFeatures: featuresInRoute,
          name: isSalesModule ? 'Dept of Sales' : mainFeature.name,
          description: isSalesModule 
            ? 'Complete sales management platform with CRM, pipeline tracking, and AI-powered insights'
            : `${featuresInRoute.length} integrated features available`,
          capabilities: isSalesModule 
            ? [
                '📊 Sales Dashboard - Real-time metrics & KPIs',
                '👥 CRM - Client & contact management',
                '🎯 Pipeline - Visual deal tracking',
                '🤖 AI Insights - Predictive analytics'
              ]
            : mainFeature.capabilities
        })
      }
    })
    
    return groupedFeatures
  }

  const rawFilteredFeatures = activeCategory === 'all' 
    ? features?.filter(f => f.category !== 'other') 
    : categorizedFeatures[activeCategory] || []
  
  const filteredFeatures = groupFeaturesByRoute(rawFilteredFeatures)

  // Debug logging - AFTER all variables are defined
  console.log('🔍 Dashboard Debug:')
  console.log('Total features:', features?.length)
  console.log('Features array:', features)
  console.log('Categorized features:', categorizedFeatures)
  console.log('Sales features:', categorizedFeatures.sales || [])
  console.log('Active category:', activeCategory)
  console.log('Raw filtered features:', rawFilteredFeatures)
  console.log('Grouped filtered features:', filteredFeatures)
  console.log('Filtered features length:', filteredFeatures?.length)
  
  // Detailed sales feature analysis
  if (categorizedFeatures.sales) {
    console.log('✅ Sales features found:', categorizedFeatures.sales.length)
    categorizedFeatures.sales.forEach(f => {
      console.log(`  - ${f.name} (${f.id}) - category: ${f.category}`)
    })
  } else {
    console.log('❌ No sales features in categorizedFeatures')
  }

  const stats = [
    {
      id: 'projects',
      label: 'Active Projects',
      value: dashboardStats.projects?.active_count || 0,
      change: '+0%',
      trend: 'up',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      onClick: () => navigate('/projects')
    },
    {
      id: 'drawings',
      label: 'Engineering Drawings',
      value: dashboardStats.engineering?.total_drawings || 0,
      change: '+0%',
      trend: 'up',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50'
    },
    {
      id: 'notifications',
      label: 'Pending Notifications',
      value: notifications.filter(n => !n.is_read).length,
      change: 'New',
      trend: 'new',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      onClick: () => navigate('/notifications')
    },
    {
      id: 'efficiency',
      label: 'System Health',
      value: metricsData.performance?.system_health ? `${metricsData.performance.system_health}%` : 'N/A',
      change: metricsData.performance?.system_health >= 90 ? 'Excellent' : metricsData.performance?.system_health >= 70 ? 'Good' : 'Needs Attention',
      trend: metricsData.performance?.system_health >= 90 ? 'up' : 'new',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50'
    }
  ]

  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold mb-2">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {getGreeting()}, {USER_DISPLAY_CONFIG.formatting.getDisplayName(user)}
                </span>
              </h1>
              <p className="text-gray-600 text-lg flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Ready to enhance your engineering workflow
              </p>
              {/* User Roles Display */}
              {user?.roles && user.roles.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-gray-600">Your Roles:</span>
                  {user.roles.map((role) => (
                    <span
                      key={role.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-full shadow-md"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      {role.name}
                      {role.level && (
                        <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                          L{role.level}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchDashboardData()}
                className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 transition-all"
              >
                <ArrowPathIcon className="w-5 h-5 inline text-gray-700" />
              </button>
              <button 
                onClick={() => navigate('/notifications')}
                className="relative px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all flex items-center gap-2 text-gray-700 font-medium cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="hidden sm:inline">Notifications</span>
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Metrics Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ChartBarIcon className="w-7 h-7 text-blue-600" />
              System Metrics & Utilization
            </h2>
            <button
              onClick={() => fetchAdvancedMetrics()}
              disabled={loadingMetrics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loadingMetrics ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Hero Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <AdvancedMetricCard
              metricConfig={DASHBOARD_METRICS.totalDocuments}
              value={metricsData.documents?.total_documents || 0}
              previousValue={metricsData.documents?.total_documents_previous || 0}
              loading={loadingMetrics}
              size="medium"
              showTrend={true}
            />
            <AdvancedMetricCard
              metricConfig={DASHBOARD_METRICS.activeUsers}
              value={metricsData.users?.active_users || 0}
              previousValue={metricsData.users?.active_users_previous || 0}
              loading={loadingMetrics}
              size="medium"
              showTrend={true}
            />
            <AdvancedMetricCard
              metricConfig={DASHBOARD_METRICS.totalUsers}
              value={metricsData.users?.total_users || 0}
              previousValue={metricsData.users?.total_users_previous || 0}
              loading={loadingMetrics}
              size="medium"
              showTrend={true}
            />
            <AdvancedMetricCard
              metricConfig={DASHBOARD_METRICS.featureUsage}
              value={metricsData.features?.utilization_percentage || 0}
              loading={loadingMetrics}
              size="medium"
              showTrend={false}
            />
          </div>

          {/* Secondary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <AdvancedMetricCard
              metricConfig={DASHBOARD_METRICS.documentsToday}
              value={metricsData.documents?.documents_today || 0}
              previousValue={metricsData.documents?.documents_yesterday || 0}
              loading={loadingMetrics}
              size="small"
              showTrend={true}
            />
            <AdvancedMetricCard
              metricConfig={DASHBOARD_METRICS.newUsersToday}
              value={metricsData.users?.new_users_today || 0}
              previousValue={metricsData.users?.new_users_yesterday || 0}
              loading={loadingMetrics}
              size="small"
              showTrend={true}
            />
            <AdvancedMetricCard
              metricConfig={DASHBOARD_METRICS.pidDrawings}
              value={metricsData.documents?.pid_drawings || 0}
              loading={loadingMetrics}
              size="small"
              showTrend={false}
            />
            <AdvancedMetricCard
              metricConfig={DASHBOARD_METRICS.pfdDocuments}
              value={metricsData.documents?.pfd_documents || 0}
              loading={loadingMetrics}
              size="small"
              showTrend={false}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.id}
              onClick={stat.onClick}
              className={`relative overflow-hidden bg-gradient-to-br ${stat.bgGradient} rounded-2xl p-6 border border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 ${stat.onClick ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-lg`}>
                  {stat.icon}
                </div>
                {stat.trend === 'new' ? (
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                    NEW
                  </span>
                ) : (
                  <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                    stat.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {stat.change}
                  </span>
                )}
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Department Activity Overview - NEW */}
        {!loadingStats && DASHBOARD_WIDGETS.departmentOverview.enabled && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Cog6ToothIcon className="w-7 h-7 text-purple-600" />
              Department Activity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {DASHBOARD_WIDGETS.departmentOverview.departments.map(dept => (
                <DepartmentCard
                  key={dept.id}
                  department={dept}
                  data={departments[dept.id] || {}}
                />
              ))}
            </div>
          </div>
        )}

        {/* Real-time Notifications - NEW */}
        {!loadingStats && notifications.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <BellIcon className="w-7 h-7 text-orange-600" />
                Recent Notifications
              </h2>
              <button
                onClick={() => navigate('/notifications')}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                View All →
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {notifications.slice(0, 4).map(notification => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  category={DASHBOARD_WIDGETS.notifications.categories.find(c => c.id === notification.priority) || DASHBOARD_WIDGETS.notifications.categories[2]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Real-Time Activity Feed - LIVE MONITORING */}
        <div className="mb-8">
          <RealTimeActivityFeed 
            apiEndpoint="/activity/recent/"
            maxHeight="500px"
            showFilters={true}
            autoRefresh={true}
          />
        </div>

        {/* Category Filter Pills */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-4 border border-gray-200">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <span className="text-sm font-semibold text-gray-600 whitespace-nowrap">Filter:</span>
            {categories.map((category) => {
              const rawCategoryFeatures = category.id === 'all' 
                ? features?.filter(f => f.category !== 'other') 
                : categorizedFeatures[category.id] || []
              const groupedCategoryFeatures = groupFeaturesByRoute(rawCategoryFeatures)
              const categoryCount = groupedCategoryFeatures.length
              
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    console.log('🔵 Category clicked:', category.id)
                    setActiveCategory(category.id)
                  }}
                  className={`px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-300 ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                  {categoryCount > 0 && (
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      activeCategory === category.id
                        ? 'bg-white/20 text-white'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {categoryCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="w-1 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-full"></span>
              Available Features
              {!useAdvancedFeatures && (
                <span className="text-sm font-normal text-gray-500">
                  ({filteredFeatures?.length || 0})
                </span>
              )}
            </h2>
            {FEATURE_FLAGS.enableAdvancedFeaturesCatalog && (
              <button
                onClick={() => setUseAdvancedFeatures(!useAdvancedFeatures)}
                className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
                  useAdvancedFeatures
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <SparklesIcon className="w-5 h-5" />
                {useAdvancedFeatures ? 'Advanced Mode' : 'Switch to Advanced'}
              </button>
            )}
          </div>

          {useAdvancedFeatures ? (
            <FeaturesBrowser 
              userModules={user?.modules || []} 
              isAdmin={user?.is_admin || false}
            />
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0"></div>
              </div>
              <p className="mt-4 text-gray-600 font-medium">Loading features...</p>
            </div>
          ) : filteredFeatures && filteredFeatures.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredFeatures.map((feature) => (
                <FeatureCard key={feature.id} feature={feature} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Features Available</h3>
              <p className="text-gray-600 mb-4">
                {activeCategory === 'all' 
                  ? 'Contact your administrator to get access to features.' 
                  : `No features available in this category.`}
              </p>
              {activeCategory !== 'all' && (
                <button
                  onClick={() => setActiveCategory('all')}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                >
                  View All Features
                </button>
              )}
              <div className="mt-4">
                <button
                  onClick={() => setUseAdvancedFeatures(true)}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-medium inline-flex items-center gap-2"
                >
                  <SparklesIcon className="w-5 h-5" />
                  Try Advanced Features Catalog
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions Footer */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold mb-2">Need Help Getting Started?</h3>
              <p className="text-blue-100">Explore our documentation or reach out to support</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDocumentation(true)}
                className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:shadow-lg transition-all font-medium"
              >
                📚 Documentation
              </button>
              <button 
                onClick={() => setShowContactSupport(true)}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-400 rounded-xl transition-all font-medium"
              >
                💬 Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Support Modal */}
      {showContactSupport && (
        <ContactSupport 
          isModal={true} 
          onClose={() => setShowContactSupport(false)} 
        />
      )}

      {/* Documentation Modal */}
      {showDocumentation && (
        <Documentation 
          isModal={true} 
          onClose={() => setShowDocumentation(false)} 
        />
      )}
    </div>
  )
}

export default Dashboard
