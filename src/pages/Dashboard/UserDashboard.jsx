import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  FiUser, FiActivity, FiFileText, FiDownload, FiClock,
  FiTrendingUp, FiFolder, FiDatabase, FiCalendar, FiMapPin
} from 'react-icons/fi';
import axios from 'axios';
import { 
  DASHBOARD_RESPONSIVE, 
  GRID, 
  ICON, 
  SPACING,
  TYPOGRAPHY 
} from '../../config/responsive.config';

const UserDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [stats, setStats] = useState(null);
  const [files, setFiles] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('radai_access_token') || localStorage.getItem('access');
      
      // Fetch all dashboard data in parallel
      const [statsRes, filesRes, activityRes] = await Promise.all([
        axios.get('/api/v1/rbac/dashboard/stats/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/v1/rbac/dashboard/files/', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/v1/rbac/dashboard/activity/?days=7', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data);
      setFiles(filesRes.data.files || []);
      
      // Flatten timeline to array
      const activityArray = [];
      Object.keys(activityRes.data.timeline || {}).forEach(date => {
        activityRes.data.timeline[date].forEach(activity => {
          activityArray.push({ ...activity, date });
        });
      });
      setActivities(activityArray);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModuleIcon = (code) => {
    const icons = {
      'PFD': '📄',
      'PID': '🔍',
      'CRS': '📋',
      'PROJECT_CONTROL': '📊'
    };
    return icons[code] || '📦';
  };

  const getActivityIcon = (action) => {
    const icons = {
      'CREATE': '➕',
      'UPDATE': '✏️',
      'DELETE': '🗑️',
      'VIEW': '👁️',
      'DOWNLOAD': '⬇️',
      'UPLOAD': '⬆️'
    };
    return icons[action] || '📌';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ${DASHBOARD_RESPONSIVE.container}`}>
      {/* Header Section */}
      <div className={`bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl ${DASHBOARD_RESPONSIVE.header.wrapper} mb-4 sm:mb-6 text-white`}>
        <div className={`flex ${DASHBOARD_RESPONSIVE.header.flexDirection} items-start sm:items-center justify-between ${DASHBOARD_RESPONSIVE.header.spacing}`}>
          <div className={`flex ${DASHBOARD_RESPONSIVE.header.flexDirection} items-start sm:items-center ${DASHBOARD_RESPONSIVE.header.spacing}`}>
            <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-full p-4 sm:p-5 md:p-6">
              <FiUser className={DASHBOARD_RESPONSIVE.header.iconSize} />
            </div>
            <div>
              <h1 className={`${DASHBOARD_RESPONSIVE.header.title} font-bold mb-1 sm:mb-2`}>
                Welcome back, {stats?.user?.full_name || user?.email}!
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-blue-100 text-xs sm:text-sm">
                <span className="flex items-center">
                  <FiMapPin className={`${ICON.sm} mr-1 sm:mr-2`} />
                  {stats?.user?.organization}
                </span>
                <span className="flex items-center">
                  <FiUser className={`${ICON.sm} mr-1 sm:mr-2`} />
                  {stats?.user?.job_title || 'Team Member'}
                </span>
                <span className="flex items-center">
                  <FiCalendar className={`${ICON.sm} mr-1 sm:mr-2`} />
                  Member since {stats?.user?.member_since}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs sm:text-sm opacity-90">Last Login</div>
            <div className="text-sm sm:text-base md:text-lg font-semibold">{new Date().toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className={`grid ${DASHBOARD_RESPONSIVE.stats.grid} ${GRID.gap} mb-4 sm:mb-6`}>
        {/* Activity Stats */}
        <div className={`bg-white rounded-lg sm:rounded-xl shadow-lg ${DASHBOARD_RESPONSIVE.stats.card} hover:shadow-xl transition-shadow`}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
              <FiActivity className={ICON.md} />
            </div>
            <span className="text-green-600 text-xs sm:text-sm font-semibold">↑ {stats?.activity_stats?.this_week || 0} this week</span>
          </div>
          <h3 className="text-gray-600 text-xs sm:text-sm font-medium">Total Activities</h3>
          <p className={`${DASHBOARD_RESPONSIVE.stats.value} font-bold text-gray-800 mt-1 sm:mt-2`}>{stats?.activity_stats?.total || 0}</p>
        </div>

        {/* Files Count */}
        <div className={`bg-white rounded-lg sm:rounded-xl shadow-lg ${DASHBOARD_RESPONSIVE.stats.card} hover:shadow-xl transition-shadow`}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-purple-100 p-2 sm:p-3 rounded-lg">
              <FiFolder className={ICON.md} />
            </div>
            <span className="text-purple-600 text-xs sm:text-sm font-semibold">{stats?.storage_stats?.total_size_mb || 0} MB</span>
          </div>
          <h3 className="text-gray-600 text-xs sm:text-sm font-medium">My Files</h3>
          <p className={`${DASHBOARD_RESPONSIVE.stats.value} font-bold text-gray-800 mt-1 sm:mt-2`}>{stats?.storage_stats?.files_count || 0}</p>
        </div>

        {/* Accessible Modules */}
        <div className={`bg-white rounded-lg sm:rounded-xl shadow-lg ${DASHBOARD_RESPONSIVE.stats.card} hover:shadow-xl transition-shadow`}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
              <FiDatabase className={ICON.md} />
            </div>
            <span className="text-green-600 text-xs sm:text-sm font-semibold">Active</span>
          </div>
          <h3 className="text-gray-600 text-xs sm:text-sm font-medium">My Modules</h3>
          <p className={`${DASHBOARD_RESPONSIVE.stats.value} font-bold text-gray-800 mt-1 sm:mt-2`}>{stats?.accessible_modules?.length || 0}</p>
        </div>

        {/* Monthly Activity */}
        <div className={`bg-white rounded-lg sm:rounded-xl shadow-lg ${DASHBOARD_RESPONSIVE.stats.card} hover:shadow-xl transition-shadow`}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-orange-100 p-2 sm:p-3 rounded-lg">
              <FiTrendingUp className={ICON.md} />
            </div>
            <span className="text-orange-600 text-xs sm:text-sm font-semibold">This Month</span>
          </div>
          <h3 className="text-gray-600 text-xs sm:text-sm font-medium">Actions</h3>
          <p className={`${DASHBOARD_RESPONSIVE.stats.value} font-bold text-gray-800 mt-1 sm:mt-2`}>{stats?.activity_stats?.this_month || 0}</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-lg mb-4 sm:mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className={`${DASHBOARD_RESPONSIVE.tabs.nav}`} aria-label="Tabs">
            {['overview', 'files', 'activity'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${DASHBOARD_RESPONSIVE.tabs.button} px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className={DASHBOARD_RESPONSIVE.content.padding}>
          {activeTab === 'overview' && (
            <div className="space-y-4 sm:space-y-6">
              {/* Accessible Modules */}
              <div>
                <h3 className={`${TYPOGRAPHY.heading.h4} font-bold text-gray-800 mb-3 sm:mb-4 flex items-center`}>
                  <FiDatabase className={`${ICON.md} mr-2`} />
                  Your Accessible Modules
                </h3>
                <div className={`grid ${GRID.dashboard.modules} ${GRID.gap}`}>
                  {stats?.accessible_modules?.map((module) => (
                    <div
                      key={module.code}
                      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-lg"
                    >
                      <div className="text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3">{getModuleIcon(module.code)}</div>
                      <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">{module.name}</h4>
                      <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                        module.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {module.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Module Stats */}
              {stats?.module_stats && Object.keys(stats.module_stats).length > 0 && (
                <div>
                  <h3 className={`${TYPOGRAPHY.heading.h4} font-bold text-gray-800 mb-3 sm:mb-4 flex items-center`}>
                    <FiTrendingUp className={`${ICON.md} mr-2`} />
                    Module Statistics
                  </h3>
                  <div className={`grid ${GRID.dashboard.modules} ${GRID.gap}`}>
                    {Object.entries(stats.module_stats).map(([code, data]) => (
                      <div key={code} className="bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-blue-400 transition-all">
                        <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">{data.icon}</div>
                        <h4 className="font-semibold text-gray-800 mb-2 text-sm sm:text-base">{code}</h4>
                        {Object.entries(data).map(([key, value]) => {
                          if (key !== 'icon' && key !== 'color') {
                            return (
                              <div key={key} className="text-xs sm:text-sm text-gray-600">
                                {key.replace(/_/g, ' ')}: <span className="font-semibold">{value}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity Preview */}
              <div>
                <h3 className={`${TYPOGRAPHY.heading.h4} font-bold text-gray-800 mb-3 sm:mb-4 flex items-center`}>
                  <FiClock className={`${ICON.md} mr-2`} />
                  Recent Activity
                </h3>
                <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3">
                  {activities.slice(0, 5).map((activity, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-2 sm:p-3 bg-white rounded-lg hover:shadow-md transition-shadow gap-2 sm:gap-0">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <span className="text-xl sm:text-2xl">{getActivityIcon(activity.action)}</span>
                        <div>
                          <p className="font-medium text-gray-800 text-xs sm:text-sm">{activity.action} {activity.resource_type}</p>
                          <p className="text-xs text-gray-500 break-all">{activity.resource}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 sm:ml-4">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'files' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
                <h3 className={`${TYPOGRAPHY.heading.h4} font-bold text-gray-800 flex items-center`}>
                  <FiFileText className={`${ICON.md} mr-2`} />
                  My Files ({files.length})
                </h3>
                <div className="text-xs sm:text-sm text-gray-600">
                  Total: {stats?.storage_stats?.total_size_mb || 0} MB
                </div>
              </div>
              
              {files.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg sm:rounded-xl">
                  <FiFolder className={`${ICON.xl} mx-auto text-gray-400 mb-3 sm:mb-4`} />
                  <p className="text-gray-600 text-base sm:text-lg">No files uploaded yet</p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">Your uploaded files will appear here</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3 sm:gap-0">
                      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                        <FiFileText className={`${ICON.lg} text-blue-600 flex-shrink-0`} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-800 text-sm sm:text-base truncate">{file.filename}</p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {formatBytes(file.size)} • {formatDate(file.last_modified)}
                          </p>
                        </div>
                      </div>
                      <a
                        href={file.download_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm flex-shrink-0"
                      >
                        <FiDownload className={`${ICON.sm} mr-1 sm:mr-2`} />
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h3 className={`${TYPOGRAPHY.heading.h4} font-bold text-gray-800 mb-4 sm:mb-6 flex items-center`}>
                <FiActivity className={`${ICON.md} mr-2`} />
                Activity Timeline (Last 7 Days)
              </h3>
              
              {activities.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg sm:rounded-xl">
                  <FiActivity className={`${ICON.xl} mx-auto text-gray-400 mb-3 sm:mb-4`} />
                  <p className="text-gray-600 text-base sm:text-lg">No recent activity</p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">Your actions will be logged here</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {activities.map((activity, idx) => (
                    <div key={idx} className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="bg-blue-100 p-2 sm:p-3 rounded-full flex-shrink-0">
                        <span className="text-xl sm:text-2xl">{getActivityIcon(activity.action)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-1 sm:gap-0">
                          <p className="font-semibold text-gray-800 text-sm sm:text-base">
                            {activity.action} • {activity.resource_type}
                          </p>
                          <span className="text-xs sm:text-sm text-gray-500">{activity.date} {activity.time}</span>
                        </div>
                        <p className="text-gray-600 text-xs sm:text-sm break-all">{activity.resource}</p>
                        {activity.ip && (
                          <p className="text-xs text-gray-500 mt-1">IP: {activity.ip}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 text-center text-gray-600">
        <p className="text-xs sm:text-sm">
          🔐 Your data is securely stored in AWS S3 • All activities are logged for security
        </p>
      </div>
    </div>
  );
};

export default UserDashboard;
