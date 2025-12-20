import React from 'react';

/**
 * System Health Monitoring Component
 * Real-time system status and diagnostics
 */
const SystemHealthTab = ({ healthData }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    if (status === 'healthy') {
      return (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (status === 'degraded') {
      return (
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  if (!healthData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <p className="text-gray-600">Loading system health...</p>
        </div>
      </div>
    );
  }

  const components = [
    { name: 'Database', status: healthData.database_status, key: 'database' },
    { name: 'Redis Cache', status: healthData.redis_status, key: 'redis' },
    { name: 'Celery Workers', status: healthData.celery_status, key: 'celery' },
    { name: 'File Storage', status: healthData.storage_status, key: 'storage' },
    { name: 'API Server', status: healthData.api_status, key: 'api' },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">System Health Monitoring</h3>
        <p className="text-gray-600 mt-1">Real-time status of all system components</p>
      </div>

      {/* Overall Health Score */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold mb-2">Overall System Health</h4>
            <p className="text-2xl font-bold">{healthData.health_score?.toFixed(1) || 100}%</p>
            <p className="text-sm opacity-90 mt-1">
              Status: <span className="font-semibold">{healthData.overall_status?.toUpperCase() || 'HEALTHY'}</span>
            </p>
          </div>
          <div className="w-24 h-24 relative">
            <svg className="transform -rotate-90 w-24 h-24">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="white"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - (healthData.health_score || 100) / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {getStatusIcon(healthData.overall_status)}
            </div>
          </div>
        </div>
      </div>

      {/* Component Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {components.map((component) => (
          <div key={component.key} className="bg-white border-2 border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-semibold text-gray-900">{component.name}</h5>
              {getStatusIcon(component.status)}
            </div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(component.status)}`}>
              {component.status?.toUpperCase() || 'UNKNOWN'}
            </span>
            {healthData.response_times && healthData.response_times[component.key] && (
              <p className="text-xs text-gray-600 mt-2">
                Response: {healthData.response_times[component.key]}ms
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Issues and Warnings */}
      {healthData.issues_found && healthData.issues_found.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
          <h5 className="font-semibold text-red-900 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Issues Detected ({healthData.issues_found.length})
          </h5>
          <ul className="space-y-2">
            {healthData.issues_found.map((issue, idx) => (
              <li key={idx} className="text-sm text-red-800 flex items-start">
                <span className="mr-2">•</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {healthData.warnings && healthData.warnings.length > 0 && (
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
          <h5 className="font-semibold text-yellow-900 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Warnings ({healthData.warnings.length})
          </h5>
          <ul className="space-y-2">
            {healthData.warnings.map((warning, idx) => (
              <li key={idx} className="text-sm text-yellow-800 flex items-start">
                <span className="mr-2">•</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Recommendations */}
      {healthData.recommendations && healthData.recommendations.length > 0 && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
          <h5 className="font-semibold text-blue-900 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            AI Recommendations
          </h5>
          <ul className="space-y-2">
            {healthData.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-blue-800 flex items-start">
                <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Resource Usage */}
      {healthData.resource_usage && Object.keys(healthData.resource_usage).length > 0 && (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <h5 className="font-semibold text-gray-900 mb-3">Resource Usage</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(healthData.resource_usage).map(([key, value]) => (
              <div key={key} className="text-center">
                <p className="text-2xl font-bold text-blue-600">{value}</p>
                <p className="text-sm text-gray-600 capitalize">{key.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-gray-500">
        Last checked: {healthData.check_time ? new Date(healthData.check_time).toLocaleString() : 'N/A'}
      </div>
    </div>
  );
};

export default SystemHealthTab;
