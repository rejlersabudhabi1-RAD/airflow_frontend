/**
 * CRS Multiple Revision - AI-Powered Revision Chain Management
 * Tracks document revisions, links comments across revisions, provides AI insights
 * Feature 2.2: CRS Multiple Revision
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api.config';
import { STORAGE_KEYS } from '../config/app.config';
import { withDashboardControls } from '../hoc/withPageControls';
import { PageControlButtons } from '../components/PageControlButtons';

const CRSMultipleRevision = ({ pageControls }) => {
  const [chains, setChains] = useState([]);
  const [selectedChain, setSelectedChain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChainDetail, setShowChainDetail] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyActivities, setHistoryActivities] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for creating new chain
  const [newChain, setNewChain] = useState({
    chain_id: '',
    project_name: '',
    document_number: '',
    document_title: '',
    contractor_name: '',
    department: '',
    max_allowed_revisions: 5
  });

  useEffect(() => {
    loadData();
  }, [statusFilter, riskFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      
      // Build query string
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (riskFilter && riskFilter !== 'all') params.append('risk_level', riskFilter);
      if (searchQuery) params.append('search', searchQuery);

      const [chainsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/crs/revision-chains/?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/crs/revision-chains/dashboard_summary/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (chainsRes.ok) {
        const chainsData = await chainsRes.json();
        setChains(Array.isArray(chainsData) ? chainsData : chainsData.results || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatistics(statsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load revision chains');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChain = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const response = await fetch(`${API_BASE_URL}/crs/revision-chains/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newChain)
      });

      if (response.ok) {
        alert('Revision chain created successfully!');
        setShowCreateModal(false);
        setNewChain({
          chain_id: '',
          project_name: '',
          document_number: '',
          document_title: '',
          contractor_name: '',
          department: '',
          max_allowed_revisions: 5
        });
        loadData();
      } else {
        const error = await response.json();
        alert(`Error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error creating chain:', error);
      alert('Failed to create revision chain');
    }
  };

  const handleViewChainDetail = async (chain) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const [chainRes, insightsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/crs/revision-chains/${chain.id}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/crs/ai-insights/?chain_id=${chain.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (chainRes.ok) {
        const chainData = await chainRes.json();
        setSelectedChain(chainData);
        setShowChainDetail(true);
      }

      if (insightsRes.ok) {
        const insightsData = await insightsRes.json();
        setAiInsights(Array.isArray(insightsData) ? insightsData : insightsData.results || []);
      }
    } catch (error) {
      console.error('Error loading chain detail:', error);
    }
  };

  const handleViewHistory = async (chain) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const response = await fetch(`${API_BASE_URL}/crs/revision-activities/?chain_id=${chain.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const activities = Array.isArray(data) ? data : data.results || [];
        setHistoryActivities(activities);
        setSelectedChain(chain);
        setShowHistoryModal(true);
      } else {
        alert('Failed to load history');
      }
    } catch (error) {
      console.error('Error loading history:', error);
      alert('Error loading history');
    }
  };

  const handleAnalyzeChain = async (chainId) => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const response = await fetch(`${API_BASE_URL}/crs/revision-chains/${chainId}/analyze_chain/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('AI analysis completed!');
        handleViewChainDetail({ id: chainId });
      }
    } catch (error) {
      console.error('Error analyzing chain:', error);
    }
  };

  const getRiskLevelColor = (riskLevel) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'critical': 'bg-red-100 text-red-800'
    };
    return colors[riskLevel] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-blue-100 text-blue-800',
      'on_hold': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CRS Multiple Revision</h1>
            <p className="text-gray-600 mt-1">AI-powered revision chain management and tracking</p>
          </div>
          <div className="flex items-center gap-3">
            <PageControlButtons controls={pageControls} />
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Revision Chain
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Chains</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.total_chains}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical Chains</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {statistics.critical_chains?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600">Near Rejection</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">
                    {statistics.near_rejection?.length || 0}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Chains</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {statistics.by_status?.['Active'] || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search chains..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadData()}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
            <option value="critical">Critical Risk</option>
          </select>

          <button
            onClick={loadData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Chains Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chain ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project / Document</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revisions</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Risk Score</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {chains.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-lg font-medium">No revision chains found</p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Create First Chain
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                chains.map((chain) => (
                  <tr key={chain.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{chain.current_revision_number}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{chain.chain_id}</div>
                          <div className="text-sm text-gray-500">{chain.document_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{chain.project_name}</div>
                      <div className="text-sm text-gray-500 line-clamp-1">{chain.document_title}</div>
                      {chain.contractor_name && (
                        <div className="text-xs text-gray-400 mt-1">{chain.contractor_name}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-900">{chain.current_revision_number}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-lg text-gray-600">{chain.max_allowed_revisions}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {chain.risk_percentage}% used
                      </div>
                      {chain.is_near_rejection && (
                        <div className="mt-1 text-xs text-red-600 font-medium">⚠️ Near limit!</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(chain.risk_level)}`}>
                        {chain.risk_level?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(chain.status)}`}>
                        {chain.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              chain.ai_risk_score >= 75 ? 'bg-red-500' :
                              chain.ai_risk_score >= 50 ? 'bg-orange-500' :
                              chain.ai_risk_score >= 25 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${chain.ai_risk_score || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">{chain.ai_risk_score || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewChainDetail(chain)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleViewHistory(chain)}
                          className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded-lg transition-colors"
                          title="View History"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleAnalyzeChain(chain.id)}
                          className="text-purple-600 hover:text-purple-900 p-2 hover:bg-purple-50 rounded-lg transition-colors"
                          title="AI Analysis"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Chain Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create New Revision Chain</h2>
              <p className="text-gray-600 mt-1">Set up a new document revision chain with AI tracking</p>
            </div>

            <form onSubmit={handleCreateChain} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chain ID *</label>
                  <input
                    type="text"
                    required
                    value={newChain.chain_id}
                    onChange={(e) => setNewChain({...newChain, chain_id: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., PROJ-DOC-001"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Project Name *</label>
                    <input
                      type="text"
                      required
                      value={newChain.project_name}
                      onChange={(e) => setNewChain({...newChain, project_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Project name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Document Number *</label>
                    <input
                      type="text"
                      required
                      value={newChain.document_number}
                      onChange={(e) => setNewChain({...newChain, document_number: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Document number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Document Title *</label>
                  <input
                    type="text"
                    required
                    value={newChain.document_title}
                    onChange={(e) => setNewChain({...newChain, document_title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Full document title"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contractor Name</label>
                    <input
                      type="text"
                      value={newChain.contractor_name}
                      onChange={(e) => setNewChain({...newChain, contractor_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Contractor name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                    <input
                      type="text"
                      value={newChain.department}
                      onChange={(e) => setNewChain({...newChain, department: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Department name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Allowed Revisions</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newChain.max_allowed_revisions}
                    onChange={(e) => setNewChain({...newChain, max_allowed_revisions: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Typically 5 revisions. Project may be rejected if limit is reached.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                >
                  Create Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedChain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Revision Chain History</h2>
                  <p className="text-gray-600 mt-1">{selectedChain.chain_id} - {selectedChain.document_title}</p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Activity Timeline */}
              {historyActivities.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-gray-500 text-lg">No activity history found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
                  
                  {/* Timeline */}
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    
                    {/* Activities */}
                    <div className="space-y-6">
                      {historyActivities.map((activity, index) => (
                        <div key={activity.id || index} className="relative flex gap-4">
                          {/* Timeline dot */}
                          <div className="relative z-10">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                              activity.activity_type === 'chain_created' ? 'bg-blue-100' :
                              activity.activity_type === 'revision_added' ? 'bg-green-100' :
                              activity.activity_type === 'status_changed' ? 'bg-yellow-100' :
                              activity.activity_type === 'comment_linked' ? 'bg-purple-100' :
                              activity.activity_type === 'ai_analysis' ? 'bg-indigo-100' :
                              'bg-gray-100'
                            }`}>
                              <svg className={`w-8 h-8 ${
                                activity.activity_type === 'chain_created' ? 'text-blue-600' :
                                activity.activity_type === 'revision_added' ? 'text-green-600' :
                                activity.activity_type === 'status_changed' ? 'text-yellow-600' :
                                activity.activity_type === 'comment_linked' ? 'text-purple-600' :
                                activity.activity_type === 'ai_analysis' ? 'text-indigo-600' :
                                'text-gray-600'
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {activity.activity_type === 'chain_created' && (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                )}
                                {activity.activity_type === 'revision_added' && (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                )}
                                {activity.activity_type === 'status_changed' && (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                )}
                                {activity.activity_type === 'comment_linked' && (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                )}
                                {activity.activity_type === 'ai_analysis' && (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                )}
                                {!['chain_created', 'revision_added', 'status_changed', 'comment_linked', 'ai_analysis'].includes(activity.activity_type) && (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                              </svg>
                            </div>
                          </div>
                          
                          {/* Activity content */}
                          <div className="flex-1 bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {activity.activity_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">{activity.description || 'No description'}</p>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(activity.performed_at).toLocaleString()}
                              </span>
                            </div>
                            
                            {/* Performed by */}
                            {activity.performed_by_username && (
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">
                                    {activity.performed_by_username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-600">
                                  {activity.performed_by_username}
                                </span>
                              </div>
                            )}
                            
                            {/* Additional details */}
                            {activity.revision_label && (
                              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {activity.revision_label}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chain Detail Modal - Continued in next part due to length */}
    </div>
  );
};

// Wrapper component to provide refetch functionality
const CRSMultipleRevisionWithRefresh = (props) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  return <CRSMultipleRevision {...props} refetch={refetch} key={refreshTrigger} />;
};

export default withDashboardControls(CRSMultipleRevisionWithRefresh, {
  autoRefreshInterval: 30000, // 30 seconds
  storageKey: 'crsMultipleRevisionPageControls',
});
