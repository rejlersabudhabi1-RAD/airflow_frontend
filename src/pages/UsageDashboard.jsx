/**
 * Usage Dashboard - Main Page
 * 
 * Displays comprehensive usage analytics:
 * - Usage overview cards
 * - Department usage chart
 * - Feature usage chart
 * - Top users table
 * - Usage trends over time
 */

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  CpuChipIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import UsageOverviewCards from '../components/UsageTracking/UsageOverviewCards';
import DepartmentUsageChart from '../components/UsageTracking/DepartmentUsageChart';
import FeatureUsageChart from '../components/UsageTracking/FeatureUsageChart';
import TopUsersTable from '../components/UsageTracking/TopUsersTable';
import UsageTrendsChart from '../components/UsageTracking/UsageTrendsChart';
import usageTrackingService from '../services/usageTrackingService';

const UsageDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [timeRange, setTimeRange] = useState('daily'); // daily, weekly, monthly
  const [refreshInterval, setRefreshInterval] = useState(null);

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

    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  // Handle manual refresh
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

        {/* Overview Cards */}
        {summaryData && (
          <UsageOverviewCards data={summaryData} timeRange={timeRange} />
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          {/* Department Usage Chart */}
          {summaryData && (
            <DepartmentUsageChart
              departments={summaryData.top_departments || []}
              timeRange={timeRange}
            />
          )}

          {/* Feature Usage Chart */}
          {summaryData && (
            <FeatureUsageChart
              features={summaryData.top_features || []}
              timeRange={timeRange}
            />
          )}
        </div>

        {/* Usage Trends Chart */}
        {summaryData && (
          <div className="mt-8">
            <UsageTrendsChart
              trendData={summaryData.daily_trend || []}
              timeRange={timeRange}
            />
          </div>
        )}

        {/* Top Users Table */}
        {summaryData && (
          <div className="mt-8">
            <TopUsersTable
              users={summaryData.top_users || []}
              timeRange={timeRange}
            />
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
