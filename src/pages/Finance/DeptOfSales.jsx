/**
 * Department of Sales Page
 * Comprehensive sales management hub with AI-powered CRM
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientManagement from './ClientManagement';
import SalesPipeline from './SalesPipeline';
import AIInsights from './AIInsights';
import salesService from '../../services/sales.service';

const DeptOfSales = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Soft-coded tab configuration
  const TABS = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'clients', label: 'Client Management', icon: '👥' },
    { id: 'pipeline', label: 'Sales Pipeline', icon: '🎯' },
    { id: 'insights', label: 'AI Insights', icon: '🤖' }
  ];

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboardData();
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await salesService.getDashboardSummary();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Soft-coded sales metrics
  const SALES_METRICS = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: dashboardData ? `$${parseFloat(dashboardData.total_revenue || 0).toLocaleString()}` : '$0',
      change: dashboardData ? `${dashboardData.revenue_growth || 0}%` : '+0%',
      trend: 'up',
      color: 'blue'
    },
    {
      id: 'deals',
      title: 'Active Deals',
      value: dashboardData ? String(dashboardData.active_deals || 0) : '0',
      change: dashboardData ? `+${dashboardData.new_deals_this_month || 0}` : '+0',
      trend: 'up',
      color: 'green'
    },
    {
      id: 'conversion',
      title: 'Win Rate',
      value: dashboardData ? `${dashboardData.win_rate || 0}%` : '0%',
      change: dashboardData ? `${dashboardData.win_rate_change || 0}%` : '+0%',
      trend: dashboardData && dashboardData.win_rate_change > 0 ? 'up' : 'neutral',
      color: 'yellow'
    },
    {
      id: 'pipeline',
      title: 'Pipeline Value',
      value: dashboardData ? `$${parseFloat(dashboardData.pipeline_value || 0).toLocaleString()}` : '$0',
      change: dashboardData ? `${dashboardData.pipeline_growth || 0}%` : '+0%',
      trend: 'up',
      color: 'purple'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600 border-blue-200',
      green: 'bg-green-100 text-green-600 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-600 border-yellow-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏢 Department of Sales
          </h1>
          <p className="text-gray-600">
            Manage sales pipeline, track revenue, and analyze performance
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-gray-200">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div>
            {/* Metrics Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading dashboard...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {SALES_METRICS.map((metric) => (
                    <div
                      key={metric.id}
                      className={`rounded-lg shadow-md p-6 border-2 ${getColorClasses(metric.color)}`}
                    >
                      <h3 className="text-sm font-medium text-gray-600 mb-2">
                        {metric.title}
                      </h3>
                      <div className="flex items-baseline justify-between">
                        <p className="text-3xl font-bold">{metric.value}</p>
                        <span className={`text-sm font-medium ${
                          metric.trend === 'up' ? 'text-green-600' : 
                          metric.trend === 'down' ? 'text-red-600' : 
                          'text-gray-600'
                        }`}>
                          {metric.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveTab('clients')}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="text-2xl mb-2">👥</div>
                      <h3 className="font-semibold text-gray-900">Manage Clients</h3>
                      <p className="text-sm text-gray-600">View and manage your client relationships</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('pipeline')}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left"
                    >
                      <div className="text-2xl mb-2">🎯</div>
                      <h3 className="font-semibold text-gray-900">Sales Pipeline</h3>
                      <p className="text-sm text-gray-600">Track deals across pipeline stages</p>
                    </button>

                    <button
                      onClick={() => setActiveTab('insights')}
                      className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                    >
                      <div className="text-2xl mb-2">🤖</div>
                      <h3 className="font-semibold text-gray-900">AI Insights</h3>
                      <p className="text-sm text-gray-600">Get AI-powered recommendations</p>
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                {dashboardData && dashboardData.recent_deals && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                      Recent Deals
                    </h2>
                    <div className="space-y-3">
                      {dashboardData.recent_deals.slice(0, 5).map((deal) => (
                        <div key={deal.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{deal.deal_name}</h4>
                            <p className="text-sm text-gray-600">{deal.client_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-blue-600">
                              ${parseFloat(deal.deal_value || 0).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">{deal.stage_display}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'clients' && <ClientManagement />}
        {activeTab === 'pipeline' && <SalesPipeline />}
        {activeTab === 'insights' && <AIInsights />}
      </div>
    </div>
  );
};

export default DeptOfSales;
