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
      console.log('[PIDReport] Fetching drawing with ID:', id);
      
      // Fetch drawing details
      const drawingResponse = await apiClient.get(`/pid/drawings/${id}/`);
      console.log('[PIDReport] Drawing response:', drawingResponse.data);
      setDrawing(drawingResponse.data);

      // Fetch report if available
      if (drawingResponse.data.status === 'completed') {
        console.log('[PIDReport] Drawing status is completed, fetching report...');
        const reportResponse = await apiClient.get(`/pid/drawings/${id}/report/`);
        console.log('[PIDReport] Report response:', reportResponse.data);
        setReport(reportResponse.data);
      } else {
        console.log('[PIDReport] Drawing status is:', drawingResponse.data.status, '- not completed yet');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('[PIDReport] Error fetching report:', err);
      console.error('[PIDReport] Error response:', err.response);
      console.error('[PIDReport] Error data:', err.response?.data);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load report';
      
      if (err.response?.status === 404) {
        errorMessage = 'Drawing not found. It may have been deleted.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to view this drawing.';
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (!err.response) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
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
              <button
                onClick={() => fetchReport()}
                className="mt-2 text-sm text-yellow-600 hover:text-yellow-800 underline"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Failed Analysis Status */}
      {drawing.status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-red-900">Analysis Failed</h3>
              <p className="text-sm text-red-800">The AI analysis encountered an error. Please try uploading the drawing again.</p>
              <button
                onClick={() => navigate('/pid/upload')}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Upload New Drawing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Status - Not Yet Analyzed */}
      {drawing.status === 'uploaded' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900">Drawing Uploaded</h3>
              <p className="text-sm text-blue-800">This drawing has been uploaded but not yet analyzed.</p>
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    await apiClient.post(`/pid/drawings/${id}/analyze/`);
                    setTimeout(() => fetchReport(), 2000);
                  } catch (err) {
                    console.error('Failed to start analysis:', err);
                    alert('Failed to start analysis. Please try again.');
                    setLoading(false);
                  }
                }}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Start Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Summary */}
      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
              <p className="text-sm text-gray-500 mb-1">Spec Breaks</p>
              <p className="text-3xl font-bold text-purple-600">
                {report.specification_breaks?.length || 0}
              </p>
            </div>
          </div>

          {/* HOLDS & NOTES Compliance Section */}
          {report.holds_and_notes && (report.holds_and_notes.holds_list?.length > 0 || report.holds_and_notes.general_notes_list?.length > 0) && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-red-500 mb-6">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-4 border-b border-red-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="h-6 w-6 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  HOLDS & NOTES Compliance
                </h3>
                <p className="text-sm text-gray-600 mt-1">Drawing requirements and design constraints</p>
              </div>

              <div className="p-6">
                {/* HOLDS Section */}
                {report.holds_and_notes.holds_list && report.holds_and_notes.holds_list.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-md font-semibold text-red-700 mb-3 flex items-center">
                      <span className="bg-red-100 px-2 py-1 rounded mr-2">HOLDS</span>
                      Critical Requirements
                    </h4>
                    <div className="space-y-3">
                      {report.holds_and_notes.holds_list.map((hold, idx) => (
                        <div key={idx} className={`border-l-4 p-4 rounded ${
                          hold.compliance_status === 'Compliant' ? 'border-green-500 bg-green-50' :
                          hold.compliance_status === 'Non-Compliant' ? 'border-red-500 bg-red-50' :
                          'border-yellow-500 bg-yellow-50'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="font-semibold text-sm text-gray-900">{hold.hold_number}</span>
                              <p className="text-sm text-gray-700 mt-1">{hold.hold_description}</p>
                              <p className="text-xs text-gray-600 mt-2 italic">{hold.verification_notes}</p>
                            </div>
                            <span className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                              hold.compliance_status === 'Compliant' ? 'bg-green-200 text-green-800' :
                              hold.compliance_status === 'Non-Compliant' ? 'bg-red-200 text-red-800' :
                              'bg-yellow-200 text-yellow-800'
                            }`}>
                              {hold.compliance_status}
                            </span>
                          </div>
                          {hold.related_issues && hold.related_issues.length > 0 && (
                            <div className="mt-2 text-xs text-gray-600">
                              Related Issues: {hold.related_issues.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* General NOTES Section */}
                {report.holds_and_notes.general_notes_list && report.holds_and_notes.general_notes_list.length > 0 && (
                  <div>
                    <h4 className="text-md font-semibold text-blue-700 mb-3 flex items-center">
                      <span className="bg-blue-100 px-2 py-1 rounded mr-2">NOTES</span>
                      General Requirements
                    </h4>
                    <div className="space-y-2">
                      {report.holds_and_notes.general_notes_list.slice(0, 10).map((note, idx) => (
                        <div key={idx} className={`border-l-4 p-3 rounded text-sm ${
                          note.compliance_status === 'Compliant' ? 'border-blue-400 bg-blue-50' :
                          note.compliance_status === 'Non-Compliant' ? 'border-orange-500 bg-orange-50' :
                          'border-gray-400 bg-gray-50'
                        }`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <span className="font-semibold text-gray-900">{note.note_number}</span>
                              <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">{note.note_category}</span>
                              <p className="text-gray-700 mt-1">{note.note_text}</p>
                              {note.verification_notes && (
                                <p className="text-xs text-gray-600 mt-1 italic">{note.verification_notes}</p>
                              )}
                            </div>
                            <span className={`ml-4 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${
                              note.compliance_status === 'Compliant' ? 'bg-green-200 text-green-800' :
                              note.compliance_status === 'Non-Compliant' ? 'bg-orange-200 text-orange-800' :
                              'bg-gray-200 text-gray-800'
                            }`}>
                              {note.compliance_status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {report.holds_and_notes.general_notes_list.length > 10 && (
                        <p className="text-sm text-gray-500 italic text-center py-2">
                          ... and {report.holds_and_notes.general_notes_list.length - 10} more notes
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Critical Violations Alert */}
                {report.holds_and_notes.critical_violations && report.holds_and_notes.critical_violations.length > 0 && (
                  <div className="mt-6 bg-red-100 border-2 border-red-500 rounded-lg p-4">
                    <h5 className="font-bold text-red-800 flex items-center mb-2">
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Critical Violations Detected
                    </h5>
                    <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                      {report.holds_and_notes.critical_violations.map((violation, idx) => (
                        <li key={idx}>{violation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Specification Breaks Section */}
          {report.specification_breaks && report.specification_breaks.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-purple-500 mb-6">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg className="h-6 w-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Specification Breaks ({report.specification_breaks.length})
                </h3>
                <p className="text-sm text-gray-600 mt-1">Piping specification changes (material, pressure class, special requirements)</p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {report.specification_breaks.map((specBreak, idx) => (
                    <div key={idx} className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50 hover:shadow-lg transition-shadow">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {specBreak.spec_break_id}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            specBreak.break_properly_marked === 'Yes' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {specBreak.break_properly_marked === 'Yes' ? '✓ Properly Marked' : '⚠ Not Marked'}
                          </span>
                          {specBreak.cost_impact && (
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              specBreak.cost_impact === 'High' ? 'bg-red-100 text-red-700' :
                              specBreak.cost_impact === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {specBreak.cost_impact} Cost Impact
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Location */}
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-gray-700 mb-1">📍 Location:</p>
                        <p className="text-sm text-gray-900 bg-white rounded px-3 py-2 border border-purple-200">
                          {specBreak.location}
                        </p>
                      </div>

                      {/* Spec Comparison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        {/* Upstream */}
                        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3">
                          <h5 className="text-xs font-bold text-blue-700 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            UPSTREAM SPEC
                          </h5>
                          <div className="space-y-1 text-xs">
                            <div><span className="font-semibold">Line:</span> {specBreak.upstream_spec?.line_number}</div>
                            <div><span className="font-semibold">Material:</span> <span className="bg-blue-200 px-2 py-0.5 rounded">{specBreak.upstream_spec?.material_spec}</span></div>
                            <div><span className="font-semibold">Pressure Class:</span> <span className="bg-blue-200 px-2 py-0.5 rounded">{specBreak.upstream_spec?.pressure_class}</span></div>
                            {specBreak.upstream_spec?.special_requirements && specBreak.upstream_spec.special_requirements !== 'None' && (
                              <div><span className="font-semibold">Special:</span> {specBreak.upstream_spec.special_requirements}</div>
                            )}
                          </div>
                        </div>

                        {/* Downstream */}
                        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3">
                          <h5 className="text-xs font-bold text-green-700 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                            DOWNSTREAM SPEC
                          </h5>
                          <div className="space-y-1 text-xs">
                            <div><span className="font-semibold">Line:</span> {specBreak.downstream_spec?.line_number}</div>
                            <div><span className="font-semibold">Material:</span> <span className="bg-green-200 px-2 py-0.5 rounded">{specBreak.downstream_spec?.material_spec}</span></div>
                            <div><span className="font-semibold">Pressure Class:</span> <span className="bg-green-200 px-2 py-0.5 rounded">{specBreak.downstream_spec?.pressure_class}</span></div>
                            {specBreak.downstream_spec?.special_requirements && specBreak.downstream_spec.special_requirements !== 'None' && (
                              <div><span className="font-semibold">Special:</span> {specBreak.downstream_spec.special_requirements}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reason & Details */}
                      <div className="space-y-2 text-sm">
                        <div className="bg-white rounded p-2 border border-purple-200">
                          <span className="font-semibold text-purple-700">Reason:</span>
                          <span className="ml-2 text-gray-700">{specBreak.reason_for_break}</span>
                        </div>

                        {specBreak.transition_piece_required === 'Yes' && (
                          <div className="bg-amber-50 rounded p-2 border border-amber-300">
                            <span className="font-semibold text-amber-700">⚙️ Transition Required:</span>
                            <span className="ml-2 text-gray-700">{specBreak.transition_details}</span>
                          </div>
                        )}

                        {specBreak.procurement_impact && (
                          <div className="bg-blue-50 rounded p-2 border border-blue-200">
                            <span className="font-semibold text-blue-700">📦 Procurement:</span>
                            <span className="ml-2 text-gray-700">{specBreak.procurement_impact}</span>
                          </div>
                        )}

                        {specBreak.installation_notes && (
                          <div className="bg-indigo-50 rounded p-2 border border-indigo-200">
                            <span className="font-semibold text-indigo-700">🔧 Installation:</span>
                            <span className="ml-2 text-gray-700 text-xs">{specBreak.installation_notes}</span>
                          </div>
                        )}

                        {/* Issues Found */}
                        {specBreak.issues_found && specBreak.issues_found.length > 0 && (
                          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                            <p className="font-semibold text-red-800 text-xs mb-1">⚠️ Issues Identified:</p>
                            <ul className="list-disc list-inside text-xs text-red-700 space-y-0.5">
                              {specBreak.issues_found.map((issue, issueIdx) => (
                                <li key={issueIdx}>{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-purple-100 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-purple-700">
                      {report.specification_breaks.length}
                    </p>
                    <p className="text-sm text-purple-600">Total Spec Breaks</p>
                  </div>
                  <div className="bg-green-100 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-700">
                      {report.specification_breaks.filter(sb => sb.break_properly_marked === 'Yes').length}
                    </p>
                    <p className="text-sm text-green-600">Properly Marked</p>
                  </div>
                  <div className="bg-red-100 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-700">
                      {report.specification_breaks.filter(sb => sb.issues_found && sb.issues_found.length > 0).length}
                    </p>
                    <p className="text-sm text-red-600">With Issues</p>
                  </div>
                </div>
              </div>
            </div>
          )}

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
