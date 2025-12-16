import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api.service';

const PIDReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      // Fetch drawing details
      const drawingResponse = await apiClient.get(`/pid/drawings/${id}/`);
      setDrawing(drawingResponse.data);

      // Fetch report if available
      if (drawingResponse.data.status === 'completed') {
        const reportResponse = await apiClient.get(`/pid/drawings/${id}/report/`);
        setReport(reportResponse.data);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load report');
      setLoading(false);
    }
  };

  const handleIssueAction = async (issueId, action, remark = '') => {
    try {
      await apiClient.post(
        `/pid/issues/${issueId}/${action}/`,
        { remark }
      );
      
      // Refresh report
      fetchReport();
    } catch (err) {
      console.error(`Failed to ${action} issue:`, err);
    }
  };

  const handleIssueUpdate = async (issueId, field, value) => {
    try {
      await apiClient.patch(`/pid/issues/${issueId}/`, { [field]: value });
      // Refresh report
      fetchReport();
    } catch (err) {
      console.error(`Failed to update issue:`, err);
    }
  };

  const handleReAnalyze = async () => {
    if (!confirm('This will re-analyze the drawing and regenerate the report with the latest AI model. All manual changes (approvals, remarks) will be preserved. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      await apiClient.post(`/pid/drawings/${id}/analyze/`);
      
      // Wait for analysis to complete (poll every 2 seconds)
      const pollInterval = setInterval(async () => {
        const drawingResponse = await apiClient.get(`/pid/drawings/${id}/`);
        if (drawingResponse.data.status === 'completed') {
          clearInterval(pollInterval);
          fetchReport();
        } else if (drawingResponse.data.status === 'failed') {
          clearInterval(pollInterval);
          setError('Re-analysis failed. Please try again.');
          setLoading(false);
        }
      }, 2000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (loading) {
          setError('Re-analysis timeout. Please refresh the page.');
          setLoading(false);
        }
      }, 300000);
    } catch (err) {
      console.error('Failed to re-analyze:', err);
      alert('Failed to trigger re-analysis. Please try again.');
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await apiClient.get(
        `/pid/drawings/${id}/export/?format=${format}`,
        { 
          responseType: 'blob',
          // Don't transform blob responses
          transformResponse: [(data) => data]
        }
      );
      
      // Check if response is actually a blob
      if (!(response.data instanceof Blob)) {
        console.error('Response is not a blob:', response.data);
        alert(`Failed to export report as ${format}. Invalid response format.`);
        return;
      }
      
      // Get filename from Content-Disposition header or use default
      let filename = `PID_Analysis_${drawing.drawing_number || 'Report'}_${new Date().toISOString().split('T')[0]}`;
      
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      } else {
        // Add extension if not from header
        if (format === 'pdf') {
          filename = `${filename}.pdf`;
        } else if (format === 'excel') {
          filename = `${filename}.xlsx`;
        } else if (format === 'csv') {
          filename = `${filename}.csv`;
        }
      }
      
      // Create download link
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (err) {
      console.error(`Failed to export as ${format}:`, err);
      
      // Check if error response is JSON (error message from backend)
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const errorData = JSON.parse(text);
          alert(`Failed to export: ${errorData.error || errorData.detail || 'Unknown error'}`);
        } catch {
          alert(`Failed to export report as ${format}. Please try again.`);
        }
      } else {
        alert(`Failed to export report as ${format}. Please try again.`);
      }
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'text-red-700 bg-red-100 border-red-300',
      major: 'text-orange-700 bg-orange-100 border-orange-300',
      minor: 'text-yellow-700 bg-yellow-100 border-yellow-300',
      observation: 'text-blue-700 bg-blue-100 border-blue-300'
    };
    return colors[severity] || colors.observation;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-gray-700 bg-gray-100',
      approved: 'text-green-700 bg-green-100',
      ignored: 'text-slate-700 bg-slate-100'
    };
    return colors[status] || colors.pending;
  };

  const filteredIssues = report?.issues?.filter(issue => {
    if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && issue.status !== filterStatus) return false;
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading P&ID Analysis Report...</p>
        </div>
      </div>
    );
  }

  if (error || !drawing) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error || 'Drawing not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      
      {/* Rejlers Professional Header */}
      <div className="mb-8 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-lg shadow-xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black mb-1">REJLERS</h1>
            <div className="flex items-center space-x-3 mb-2">
              <div className="h-1 w-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"></div>
              <span className="text-amber-300 text-lg font-semibold">ABU DHABI</span>
            </div>
            <p className="text-blue-200 text-sm">Engineering & Design Consultancy</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-200">P&ID Analysis Report</p>
            <p className="text-xs text-blue-300 mt-1">Generated: {new Date().toLocaleDateString('en-GB')}</p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center font-medium"
        >
          <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </button>
        
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">P&ID Design Verification Report</h1>
          
          {/* Export Buttons */}
          {report && (
            <div className="flex space-x-2">
              <button
                onClick={handleReAnalyze}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 shadow-md transition-colors"
                title="Re-analyze drawing with latest AI model to get Direction column and updated analysis"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Re-Analyze
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-md transition-colors"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
                Export PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-md transition-colors"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                Export Excel
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-md transition-colors"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                  <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                Export CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Drawing Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-l-4 border-blue-900">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <svg className="h-6 w-6 mr-2 text-blue-900" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          Drawing Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Drawing Number</p>
            <p className="font-medium text-gray-900">{drawing.drawing_number || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Title</p>
            <p className="font-medium text-gray-900">{drawing.drawing_title || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Revision</p>
            <p className="font-medium text-gray-900">{drawing.revision || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              drawing.status === 'completed' ? 'bg-green-100 text-green-800' :
              drawing.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
              drawing.status === 'failed' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {drawing.status.charAt(0).toUpperCase() + drawing.status.slice(1)}
            </span>
          </div>
        </div>
        
        {drawing.project_name && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm text-gray-500">Project</p>
            <p className="font-medium text-gray-900">{drawing.project_name}</p>
          </div>
        )}
      </div>

      {/* Analysis Status */}
      {drawing.status === 'processing' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <svg className="animate-spin h-6 w-6 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <div>
              <h3 className="font-semibold text-yellow-900">Analysis in Progress</h3>
              <p className="text-sm text-yellow-800">AI is reviewing your P&ID drawing. This may take a few minutes...</p>
            </div>
          </div>
        </div>
      )}

      {/* Report Summary */}
      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 mb-1">Total Issues</p>
              <p className="text-3xl font-bold text-gray-900">{report.total_issues}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 mb-1">Pending</p>
              <p className="text-3xl font-bold text-gray-600">{report.pending_count}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 mb-1">Approved</p>
              <p className="text-3xl font-bold text-green-600">{report.approved_count}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 mb-1">Ignored</p>
              <p className="text-3xl font-bold text-slate-600">{report.ignored_count}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mr-2">Severity:</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">All</option>
                  <option value="critical">Critical</option>
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                  <option value="observation">Observation</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mr-2">Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="ignored">Ignored</option>
                </select>
              </div>
              
              <div className="ml-auto text-sm text-gray-600">
                Showing {filteredIssues.length} of {report.total_issues} issues
              </div>
            </div>
          </div>

          {/* Issues Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-amber-500">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Detailed Issues & Observations</h3>
              <p className="text-sm text-gray-600 mt-1">Review and manage each identified issue</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-blue-50">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-blue-50">
                      P&ID Reference
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-blue-50">
                      Issue Observed
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-blue-50">
                      Action Required
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-amber-50">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Direction</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-blue-50">
                      Severity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-blue-50">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider bg-blue-50">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIssues.map((issue, idx) => (
                    <tr key={issue.id} className={`hover:bg-blue-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {issue.serial_number}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <span className="font-semibold text-blue-900">{issue.pid_reference}</span>
                        {issue.category && (
                          <span className="block text-xs text-gray-500 mt-1 italic">{issue.category}</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 max-w-md">
                        {issue.issue_observed}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700 max-w-md">
                        {issue.action_required}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {issue.location_on_drawing ? (
                          <div className="space-y-2">
                            {/* Zone Indicator with Visual Grid */}
                            <div className="flex items-center space-x-2">
                              <div className="relative w-12 h-12 border-2 border-gray-300 rounded grid grid-cols-3 grid-rows-3 gap-0.5 bg-gray-100">
                                {['Top-Left', 'Top-Center', 'Top-Right', 'Middle-Left', 'Middle-Center', 'Middle-Right', 'Bottom-Left', 'Bottom-Center', 'Bottom-Right'].map((zone, idx) => (
                                  <div
                                    key={idx}
                                    className={`${
                                      issue.location_on_drawing.zone === zone
                                        ? 'bg-amber-500'
                                        : 'bg-gray-200'
                                    } transition-colors`}
                                    title={zone}
                                  />
                                ))}
                              </div>
                              <div className="text-xs">
                                <div className="font-semibold text-amber-700">{issue.location_on_drawing.zone}</div>
                                <div className="text-gray-500 text-xs">{issue.location_on_drawing.drawing_section}</div>
                              </div>
                            </div>
                            
                            {/* Proximity Description */}
                            {issue.location_on_drawing.proximity_description && (
                              <div className="text-xs bg-blue-50 rounded px-2 py-1 border border-blue-200">
                                <svg className="w-3 h-3 inline mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-blue-800">{issue.location_on_drawing.proximity_description}</span>
                              </div>
                            )}
                            
                            {/* Visual Cues */}
                            {issue.location_on_drawing.visual_cues && (
                              <div className="text-xs bg-green-50 rounded px-2 py-1 border border-green-200">
                                <svg className="w-3 h-3 inline mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span className="text-green-800 italic">{issue.location_on_drawing.visual_cues}</span>
                              </div>
                            )}
                            
                            {/* Search Keywords */}
                            {issue.location_on_drawing.search_keywords && issue.location_on_drawing.search_keywords.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {issue.location_on_drawing.search_keywords.slice(0, 3).map((keyword, kidx) => (
                                  <span key={kidx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">Location not specified</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <select
                          value={issue.severity}
                          onChange={(e) => handleIssueUpdate(issue.id, 'severity', e.target.value)}
                          className={`w-full px-3 py-1.5 text-xs font-semibold rounded-md border-2 ${getSeverityColor(issue.severity)} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                        >
                          <option value="critical">Critical</option>
                          <option value="major">Major</option>
                          <option value="minor">Minor</option>
                          <option value="observation">Observation</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <select
                          value={issue.status}
                          onChange={(e) => handleIssueUpdate(issue.id, 'status', e.target.value)}
                          className={`w-full px-3 py-1.5 text-xs font-semibold rounded-md ${getStatusColor(issue.status)} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 border-2 transition-all`}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="ignored">Ignored</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleIssueAction(issue.id, 'approve')}
                            className={`px-3 py-1 rounded-md font-medium transition-colors ${
                              issue.status === 'approved' 
                                ? 'bg-green-100 text-green-700 cursor-default' 
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                            disabled={issue.status === 'approved'}
                          >
                            {issue.status === 'approved' ? '✓ Approved' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleIssueAction(issue.id, 'ignore')}
                            className={`px-3 py-1 rounded-md font-medium transition-colors ${
                              issue.status === 'ignored' 
                                ? 'bg-gray-100 text-gray-700 cursor-default' 
                                : 'bg-gray-600 text-white hover:bg-gray-700'
                            }`}
                            disabled={issue.status === 'ignored'}
                          >
                            {issue.status === 'ignored' ? '✓ Ignored' : 'Ignore'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Professional Footer */}
          <div className="mt-8 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-lg shadow-lg p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black mb-1">REJLERS ABU DHABI</h3>
                <p className="text-blue-200 text-sm">Engineering & Design Consultancy</p>
                <p className="text-blue-300 text-xs mt-2">
                  This is a confidential engineering document. Unauthorized distribution is prohibited.
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="text-blue-200">AI-Powered P&ID Verification System</p>
                <p className="text-blue-300 text-xs mt-1">Generated: {new Date().toLocaleString('en-GB')}</p>
                <p className="text-blue-400 text-xs mt-2">
                  <a href="https://www.rejlers.com/ae/" target="_blank" rel="noopener noreferrer" className="hover:text-amber-300 transition-colors">
                    www.rejlers.com/ae
                  </a>
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {drawing.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="font-semibold text-red-900 mb-2">Analysis Failed</h3>
          <p className="text-sm text-red-800">The analysis could not be completed. Please try uploading the drawing again.</p>
          <button
            onClick={() => navigate('/pid/upload')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Upload New Drawing
          </button>
        </div>
      )}
    </div>
  );
};

export default PIDReport;
