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
      
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center"
        >
          <svg className="h-5 w-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">P&ID Analysis Report</h1>
      </div>

      {/* Drawing Information */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Drawing Information</h2>
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
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P&ID Reference
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue Observed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action Required
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredIssues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {issue.serial_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <span className="font-medium">{issue.pid_reference}</span>
                        {issue.category && (
                          <span className="block text-xs text-gray-500">{issue.category}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {issue.issue_observed}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {issue.action_required}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(issue.severity)}`}>
                          {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(issue.status)}`}>
                          {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {issue.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleIssueAction(issue.id, 'approve')}
                              className="text-green-600 hover:text-green-800 font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleIssueAction(issue.id, 'ignore')}
                              className="text-gray-600 hover:text-gray-800 font-medium"
                            >
                              Ignore
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-500">
            Generated from P&ID Analysis System | Confidential Engineering Document
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
