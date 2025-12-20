import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser, fetchUserStats } from '../store/slices/rbacSlice';
import analyticsService from '../services/analyticsService';
import RealTimeActivityTab from '../components/admin/RealTimeActivityTab';
import SecurityAlertsTab from '../components/admin/SecurityAlertsTab';
import PredictionsTab from '../components/admin/PredictionsTab';
import SystemHealthTab from '../components/admin/SystemHealthTab';

/**
 * Super Admin Dashboard - AI-Powered Analytics
 * Advanced admin features with machine learning insights
 */
const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser, stats, loading } = useSelector((state) => state.rbac);
  const { user: authUser } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('overview');
  
  // AI Analytics State
  const [analyticsData, setAnalyticsData] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [realtimeActivity, setRealtimeActivity] = useState([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    dispatch(fetchCurrentUser());
    dispatch(fetchUserStats());
    loadAIAnalytics();
    
    // Refresh analytics every 30 seconds
    const interval = setInterval(loadAIAnalytics, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const loadAIAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const [overview, health, alerts, insights, activity] = await Promise.all([
        analyticsService.getDashboardOverview(),
        analyticsService.getLatestHealthCheck(),
        analyticsService.getCriticalAlerts(),
        analyticsService.getHighPriorityInsights(),
        analyticsService.getRealTimeActivity(10)
      ]);
      
      setAnalyticsData(overview);
      setSystemHealth(health);
      setSecurityAlerts(alerts);
      setPredictions(insights);
      setRealtimeActivity(activity);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Check if user has admin access via RBAC roles OR Django superuser/staff flags
  const hasRBACAdminRole = currentUser?.roles?.some(
    role => ['super_admin', 'admin'].includes(role.code)
  );
  
  const isDjangoSuperuser = authUser?.is_superuser || authUser?.is_staff;
  
  const hasAdminAccess = hasRBACAdminRole || isDjangoSuperuser;

  if (!hasAdminAccess && !loading && currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the Admin Dashboard.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Manage users, roles, permissions, and system settings
          </p>
        </div>

        {/* AI-Powered Stats Cards */}
        {analyticsData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Users */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-100 hover:border-blue-300 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Users</h3>
                  <p className="text-3xl font-bold text-blue-600">{analyticsData.total_users || 0}</p>
                  <p className="text-xs text-green-600 mt-1">
                    +{analyticsData.user_growth_percentage}% this month
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-green-100 hover:border-green-300 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">System Health</h3>
                  <p className="text-3xl font-bold text-green-600">{analyticsData.system_health_score?.toFixed(1) || 100}%</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {analyticsData.active_connections || 0} active connections
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Security Alerts */}
            <div className={`bg-white rounded-xl shadow-lg p-6 border-2 ${analyticsData.critical_alerts_count > 0 ? 'border-red-100 hover:border-red-300' : 'border-yellow-100 hover:border-yellow-300'} transition-all`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Security Alerts</h3>
                  <p className={`text-3xl font-bold ${analyticsData.critical_alerts_count > 0 ? 'text-red-600' : 'text-yellow-600'}`}>
                    {analyticsData.active_alerts_count || 0}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    {analyticsData.critical_alerts_count || 0} critical
                  </p>
                </div>
                <div className={`w-12 h-12 ${analyticsData.critical_alerts_count > 0 ? 'bg-red-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center`}>
                  <svg className={`w-6 h-6 ${analyticsData.critical_alerts_count > 0 ? 'text-red-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-100 hover:border-purple-300 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">AI Insights</h3>
                  <p className="text-3xl font-bold text-purple-600">{analyticsData.active_predictions_count || 0}</p>
                  <p className="text-xs text-purple-600 mt-1">
                    {analyticsData.high_impact_insights_count || 0} high priority
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
              { id: 'activity', label: 'Real-time Activity', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
              { id: 'security', label: 'Security', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
              { id: 'predictions', label: 'AI Insights', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
              { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
              { id: 'analytics', label: 'Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { id: 'health', label: 'System Health', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
              { id: 'audit', label: 'Audit Logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">AI-Powered Admin Dashboard</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <button
                    onClick={() => setActiveTab('activity')}
                    className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Real-time Activity</p>
                        <p className="text-sm text-gray-600">Monitor live system events</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('security')}
                    className="p-4 bg-red-50 hover:bg-red-100 rounded-lg text-left transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Security Alerts</p>
                        <p className="text-sm text-gray-600">AI threat detection</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('predictions')}
                    className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">AI Insights</p>
                        <p className="text-sm text-gray-600">Predictive analytics</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('health')}
                    className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">System Health</p>
                        <p className="text-sm text-gray-600">Component status</p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                  <h4 className="text-lg font-semibold mb-2">Welcome to AI-Powered Admin Management</h4>
                  <p className="text-sm opacity-90 mb-4">
                    Leverage advanced AI analytics to monitor, predict, and optimize your system performance.
                    Real-time threat detection, predictive insights, and comprehensive health monitoring all in one place.
                  </p>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-white/20 rounded-lg p-3">
                      <p className="text-2xl font-bold">{analyticsData?.total_api_requests_today || 0}</p>
                      <p className="text-sm opacity-90">API Requests Today</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <p className="text-2xl font-bold">{analyticsData?.avg_response_time_ms?.toFixed(0) || 0}ms</p>
                      <p className="text-sm opacity-90">Avg Response Time</p>
                    </div>
                    <div className="bg-white/20 rounded-lg p-3">
                      <p className="text-2xl font-bold">{analyticsData?.success_rate_percentage?.toFixed(1) || 100}%</p>
                      <p className="text-sm opacity-90">Success Rate</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <RealTimeActivityTab activities={realtimeActivity} onRefresh={loadAIAnalytics} />
            )}

            {activeTab === 'security' && (
              <SecurityAlertsTab alerts={securityAlerts} onRefresh={loadAIAnalytics} />
            )}

            {activeTab === 'predictions' && (
              <PredictionsTab predictions={predictions} onRefresh={loadAIAnalytics} />
            )}

            {activeTab === 'health' && (
              <SystemHealthTab healthData={systemHealth} />
            )}

            {activeTab === 'users' && (
              <div className="p-6 text-center py-8">
                <p className="text-gray-600 mb-4">Comprehensive User Management</p>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to User Management
                </button>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Advanced Analytics</h3>
                <p className="text-gray-600 mb-6">
                  Detailed analytics dashboards with user engagement, feature usage, and performance metrics.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">User Engagement Trends</h4>
                    <p className="text-sm text-gray-600">Track user activity patterns and engagement scores over time</p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Feature Usage Analytics</h4>
                    <p className="text-sm text-gray-600">Monitor feature adoption and usage statistics</p>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Performance Metrics</h4>
                    <p className="text-sm text-gray-600">System performance and resource utilization</p>
                  </div>
                  <div className="bg-yellow-50 p-6 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Error Analytics</h4>
                    <p className="text-sm text-gray-600">AI-powered error tracking and root cause analysis</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="p-6 text-center py-8">
                <p className="text-gray-600">Comprehensive Audit Log Viewer - Coming Soon</p>
                <p className="text-sm text-gray-500 mt-2">Track all system changes and user actions</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
