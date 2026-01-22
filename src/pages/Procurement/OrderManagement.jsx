import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SparklesIcon,
  PaperAirplaneIcon,
  DocumentCheckIcon,
  TruckIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../../config/api.config';
import { PageControlButtons } from '../../components/Common/PageControlButtons';
import { usePageControls } from '../../hooks/usePageControls';
import { PROCUREMENT_CONFIG, getCategoryByCode, getStatusConfig, getPriorityConfig } from '../../config/procurement.config';
import AIPurchaseOrderCreator from './AIPurchaseOrderCreator';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVendor, setFilterVendor] = useState('all');
  const [showAICreator, setShowAICreator] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [aiInsights, setAiInsights] = useState(null);

  const pageControls = usePageControls({
    autoRefreshInterval: 60,
    features: { autoRefresh: true, fullscreen: true, sidebar: true }
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setError({ 
          type: 'auth', 
          message: 'Authentication required. Please log in again.',
          action: () => {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
          }
        });
        setOrders([]);
        return;
      }

      // Soft-coded request configuration
      const requestConfig = {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await fetch(`${API_BASE_URL}/procurement/orders/`, requestConfig);
      
      // Handle authentication errors
      if (response.status === 401) {
        setError({ 
          type: 'auth', 
          message: 'Authentication required. Please log in again.',
          action: () => {
            localStorage.removeItem('access_token');
            window.location.href = '/login';
          }
        });
        setOrders([]);
        return;
      }

      // Handle other HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Soft-coded data normalization - ensure array
      let normalizedData = [];
      if (Array.isArray(data)) {
        normalizedData = data;
      } else if (data && Array.isArray(data.results)) {
        normalizedData = data.results;
      } else if (data && typeof data === 'object') {
        normalizedData = [data];
      }
      
      setOrders(normalizedData);
      
      // AI-powered order analytics
      generateAIInsights(normalizedData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError({ 
        type: 'network', 
        message: `Failed to load purchase orders: ${error.message}`,
        action: () => fetchOrders()
      });
      setOrders([]); // Ensure array even on error
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/procurement/vendors/`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVendors(Array.isArray(data.results) ? data.results : []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchVendors();
  }, [pageControls.isRefreshing]);

  /**
   * AI Feature: Generate order insights and recommendations
   */
  const generateAIInsights = (orderList) => {
    if (!Array.isArray(orderList) || orderList.length === 0) return;

    // Soft-coded AI analytics
    const insights = [];
    
    // Analyze pending orders
    const pendingOrders = orderList.filter(o => o.status === 'draft' || o.status === 'pending');
    if (pendingOrders.length > 0) {
      insights.push({
        type: 'action_required',
        title: '⚠️ Orders Awaiting Action',
        count: pendingOrders.length,
        message: `${pendingOrders.length} order${pendingOrders.length > 1 ? 's' : ''} pending approval or submission`,
        priority: 'high'
      });
    }

    // Check delivery delays
    const today = new Date();
    const overdueOrders = orderList.filter(o => {
      if (!o.delivery_date || o.status === 'completed') return false;
      const deliveryDate = new Date(o.delivery_date);
      return deliveryDate < today;
    });
    
    if (overdueOrders.length > 0) {
      insights.push({
        type: 'delivery_alert',
        title: '🚚 Delivery Delays',
        count: overdueOrders.length,
        message: `${overdueOrders.length} order${overdueOrders.length > 1 ? 's' : ''} past expected delivery date`,
        priority: 'urgent'
      });
    }

    // Calculate total order value
    const totalValue = orderList.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
    if (totalValue > 0) {
      insights.push({
        type: 'financial',
        title: '💰 Total Order Value',
        value: `$${totalValue.toLocaleString()}`,
        message: `Total value of ${orderList.length} purchase orders`,
        priority: 'info'
      });
    }

    // Vendor concentration analysis
    const vendorCounts = orderList.reduce((acc, o) => {
      const vendor = o.vendor_name || 'Unknown';
      acc[vendor] = (acc[vendor] || 0) + 1;
      return acc;
    }, {});
    
    const topVendor = Object.entries(vendorCounts).sort((a, b) => b[1] - a[1])[0];
    if (topVendor) {
      insights.push({
        type: 'vendor_analysis',
        title: '🏢 Top Vendor',
        vendor: topVendor[0],
        count: topVendor[1],
        message: `${topVendor[1]} orders with ${topVendor[0]}`,
        priority: 'info'
      });
    }

    setAiInsights(insights);
  };

  // Soft-coded filter logic with safe array handling
  const filteredOrders = Array.isArray(orders) ? orders.filter(order => {
    // Soft-coded field access with fallbacks
    const poNumber = order?.po_number || '';
    const vendorName = order?.vendor_name || '';
    const status = order?.status || '';
    const vendorId = order?.vendor?.toString() || '';
    
    const matchesSearch = poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    const matchesVendor = filterVendor === 'all' || vendorId === filterVendor;
    return matchesSearch && matchesStatus && matchesVendor;
  }) : [];

  const handleOrderCreated = async (orderData) => {
    console.log('Creating order with AI data:', orderData);
    // After successful creation, refresh order list
    await fetchOrders();
  };

  const getStatusBadge = (status) => {
    const config = getStatusConfig('purchaseOrder', status);
    const colorClasses = {
      green: 'bg-green-100 text-green-800 border-green-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses[config.color]}`}>
        {config.label}
      </span>
    );
  };

  const OrderStats = () => {
    // Soft-coded stats calculation with safe array handling
    const safeOrders = Array.isArray(orders) ? orders : [];
    const stats = {
      total: safeOrders.length,
      draft: safeOrders.filter(o => o?.status === 'draft').length,
      sent: safeOrders.filter(o => o?.status === 'sent').length,
      acknowledged: safeOrders.filter(o => o?.status === 'acknowledged').length,
      completed: safeOrders.filter(o => o?.status === 'completed').length,
      totalValue: safeOrders.reduce((sum, o) => sum + (parseFloat(o?.total_amount) || 0), 0)
    };

    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-6 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <ShoppingCartIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total POs</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-gray-500 rounded-md p-3">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Draft</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.draft}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <PaperAirplaneIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Sent</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.sent}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <DocumentCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Acknowledged</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.acknowledged}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <CheckCircleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-2xl font-semibold text-gray-900">{stats.completed}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-[#00a896] rounded-md p-3">
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Value</dt>
                  <dd className="text-lg font-semibold text-gray-900">${(stats.totalValue / 1000).toFixed(0)}K</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50" style={pageControls.styles.container}>
      <div className="py-6" style={pageControls.styles.content}>
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <ShoppingCartIcon className="h-8 w-8 mr-3 text-indigo-600" />
                Purchase Orders
              </h1>
              <p className="mt-2 text-sm text-gray-600 flex items-center">
                <SparklesIcon className="h-4 w-4 mr-1 text-purple-500" />
                AI-powered order management with smart vendor selection and cost optimization
              </p>
            </div>
            
            <PageControlButtons 
              isFullscreen={pageControls.isFullscreen}
              toggleFullscreen={pageControls.toggleFullscreen}
              sidebarVisible={pageControls.sidebarVisible}
              toggleSidebar={pageControls.toggleSidebar}
              autoRefreshEnabled={pageControls.autoRefreshEnabled}
              toggleAutoRefresh={pageControls.toggleAutoRefresh}
              isRefreshing={pageControls.isRefreshing}
              manualRefresh={pageControls.manualRefresh}
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <OrderStats />
        </div>

        {/* AI Insights */}
        {aiInsights && aiInsights.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 border-2 border-purple-200">
              <div className="flex items-center space-x-2 mb-4">
                <SparklesIcon className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">AI Insights & Alerts</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {aiInsights.map((insight, idx) => (
                  <div key={idx} className={`bg-white rounded-lg p-4 border-2 hover:shadow-md transition-shadow ${
                    insight.priority === 'urgent' ? 'border-red-300' : 
                    insight.priority === 'high' ? 'border-yellow-300' : 
                    'border-purple-200'
                  }`}>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">{insight.title}</h4>
                    <p className="text-sm text-gray-600">{insight.message}</p>
                    {insight.vendor && (
                      <p className="text-xs text-indigo-600 font-medium mt-2">→ {insight.vendor}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            <div className={`rounded-md p-4 ${error.type === 'auth' ? 'bg-yellow-50 border-l-4 border-yellow-400' : 'bg-red-50 border-l-4 border-red-400'}`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  {error.type === 'auth' ? (
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-400" />
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${error.type === 'auth' ? 'text-yellow-800' : 'text-red-800'}`}>
                    {error.message}
                  </p>
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5 flex">
                    {error.action && (
                      <button
                        type="button"
                        onClick={error.action}
                        className={`inline-flex rounded-md p-1.5 ${error.type === 'auth' ? 'text-yellow-800 hover:bg-yellow-100' : 'text-red-800 hover:bg-red-100'} focus:outline-none`}
                      >
                        <ArrowPathIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setError(null)}
                      className={`inline-flex rounded-md p-1.5 ml-2 ${error.type === 'auth' ? 'text-yellow-800 hover:bg-yellow-100' : 'text-red-800 hover:bg-red-100'} focus:outline-none`}
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {/* Search */}
              <div className="md:col-span-2">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Purchase Orders
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Search by PO number or vendor..."
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Vendor Filter */}
              <div>
                <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor
                </label>
                <select
                  id="vendor"
                  value={filterVendor}
                  onChange={(e) => setFilterVendor(e.target.value)}
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">All Vendors</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-500">
                Showing {filteredOrders.length} of {Array.isArray(orders) ? orders.length : 0} purchase orders
              </p>
              <button
                type="button"
                onClick={() => setShowAICreator(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <SparklesIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Create with AI Assistant
              </button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p className="mt-4 text-sm text-gray-500">Loading purchase orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No purchase orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== 'all' || filterVendor !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating a new purchase order.'}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowAICreator(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <SparklesIcon className="-ml-1 mr-2 h-5 w-5" />
                  Create with AI Assistant
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-200 border-2 border-transparent hover:border-indigo-500">
                  <div className="p-6">
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <ShoppingCartIcon className="h-5 w-5 text-indigo-600" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {order.po_number || `PO-${order.id}`}
                          </h3>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Vendor: {order.vendor_name || 'N/A'}
                        </p>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>

                    {/* Order Details */}
                    <div className="space-y-3">
                      {order.delivery_date && (
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span>Delivery: {new Date(order.delivery_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {order.total_amount && (
                        <div className="flex items-center text-sm text-gray-600">
                          <CurrencyDollarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="font-semibold">${parseFloat(order.total_amount).toLocaleString()}</span>
                        </div>
                      )}
                      {order.shipping_address && (
                        <div className="flex items-center text-sm text-gray-600">
                          <TruckIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{order.shipping_address}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex space-x-3">
                      <button className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        View Details
                      </button>
                      {order.status === 'draft' && (
                        <button className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                          <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                          Send
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Purchase Order Creator Modal */}
      <AIPurchaseOrderCreator
        isOpen={showAICreator}
        onClose={() => setShowAICreator(false)}
        onOrderCreated={handleOrderCreated}
        vendors={vendors}
      />
    </div>
  );
};

export default OrderManagement;
