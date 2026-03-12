/**
 * Usage Dashboard - Main Page
 * 
 * Simplified version for usage analytics display
 * Soft-coded to work with available backend endpoints
 */

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  CpuChipIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import usageTrackingService from '../services/usageTrackingService';

const UsageDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [timeRange, setTimeRange] = useState('daily');

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await usageTrackingService.getSummary();
      setSummaryData(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading && !summaryData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading usage analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !summaryData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h3>
            <p className="text-red-600 text-sm">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Summary cards data
  const summaryCards = [
    {
      title: 'Total Users',
      value: summaryData?.total_users || 0,
      icon: UserGroupIcon,
      color: 'blue',
      change: summaryData?.user_growth || 0,
    },
    {
      title: 'Active Features',
      value: summaryData?.active_features || 0,
      icon: CpuChipIcon,
      color: 'green',
      change: summaryData?.feature_change || 0,
    },
    {
      title: 'Total Sessions',
      value: summaryData?.total_sessions || 0,
      icon: ClockIcon,
      color: 'purple',
      change: summaryData?.session_growth || 0,
    },
    {
      title: 'API Requests',
      value: summaryData?.total_requests || 0,
      icon: ArrowTrendingUpIcon,
      color: 'orange',
      change: summaryData?.request_growth || 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
                Usage Analytics Dashboard
              </h1>
              <p className="mt-2 text-gray-600">
                Monitor system usage, track user activity, and analyze performance metrics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="daily">Today</option>
                <option value="weekly">Last 7 Days</option>
                <option value="monthly">Last 30 Days</option>
              </select>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <svg
                  className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryCards.map((card, index) => {
            const Icon = card.icon;
            const isPositive = card.change >= 0;
            
            return (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-${card.color}-100`}>
                    <Icon className={`h-6 w-6 text-${card.color}-600`} />
                  </div>
                  {card.change !== 0 && (
                    <span
                      className={`text-sm font-medium ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isPositive ? '+' : ''}{card.change}%
                    </span>
                  )}
                </div>
                <h3 className="text-gray-600 text-sm font-medium">{card.title}</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {card.value.toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>

        {/* Top Departments */}
        {summaryData?.top_departments && summaryData.top_departments.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Departments</h2>
            <div className="space-y-3">
              {summaryData.top_departments.map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">{dept.name}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${dept.percentage || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-600 text-sm w-16 text-right">
                      {dept.count} uses
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Features */}
        {summaryData?.top_features && summaryData.top_features.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Most Used Features</h2>
            <div className="space-y-3">
              {summaryData.top_features.map((feature, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-700 font-medium">{feature.name}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-48 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${feature.percentage || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-gray-600 text-sm w-16 text-right">
                      {feature.count} uses
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Users */}
        {summaryData?.top_users && summaryData.top_users.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Users</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Active
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summaryData.top_users.map((user, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.department || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.total_count || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Data updates automatically every 5 minutes</p>
          <p className="mt-1">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UsageDashboard;
