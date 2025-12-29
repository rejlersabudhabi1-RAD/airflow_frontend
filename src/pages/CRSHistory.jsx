/**
 * CRS History Page - View Previous Extractions and Downloads
 * Allows users to access previously processed CRS documents without re-uploading
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api.config';
import { STORAGE_KEYS } from '../config/app.config';
import { DEFAULT_HISTORY_CONFIG, ACTION_COLORS } from '../config/history.config';

const CRSHistory = () => {
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [exports, setExports] = useState([]);
  const [activities, setActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('uploads'); // uploads, exports, activities
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFormat, setFilterFormat] = useState('all');
  const [downloading, setDownloading] = useState(null);
  const [historyConfig, setHistoryConfig] = useState(DEFAULT_HISTORY_CONFIG);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [showMetadataModal, setShowMetadataModal] = useState(false);
  const [selectedFileMetadata, setSelectedFileMetadata] = useState(null);
  const [shareLink, setShareLink] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadHistory();
    loadConfig();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      
      if (!token) {
        console.error('No authentication token found');
        setLoading(false);
        return;
      }

      console.log('[CRS History] Loading history data...');
      console.log('[CRS History] API Base URL:', API_BASE_URL);
      
      // Load overview
      try {
        const overviewResponse = await fetch(`${API_BASE_URL}/crs/documents/history/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('[CRS History] Overview response status:', overviewResponse.status);
        
        if (overviewResponse.ok) {
          const data = await overviewResponse.json();
          console.log('[CRS History] Overview data:', data);
          setHistoryData(data.data);
          setUploads(data.data?.recent_uploads || []);
          setExports(data.data?.recent_exports || []);
          setActivities(data.data?.recent_activity || []);
        } else {
          const errorText = await overviewResponse.text();
          console.error('[CRS History] Overview failed:', overviewResponse.status, errorText);
        }
      } catch (err) {
        console.error('[CRS History] Overview error:', err);
      }

      // Load all uploads
      try {
        const uploadsResponse = await fetch(`${API_BASE_URL}/crs/documents/history/uploads/?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('[CRS History] Uploads response status:', uploadsResponse.status);
        
        if (uploadsResponse.ok) {
          const uploadsData = await uploadsResponse.json();
          console.log('[CRS History] Uploads data:', uploadsData);
          setUploads(uploadsData.uploads || []);
        } else {
          const errorText = await uploadsResponse.text();
          console.error('[CRS History] Uploads failed:', uploadsResponse.status, errorText);
        }
      } catch (err) {
        console.error('[CRS History] Uploads error:', err);
      }

      // Load all exports
      try {
        const exportsResponse = await fetch(`${API_BASE_URL}/crs/documents/history/exports/?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('[CRS History] Exports response status:', exportsResponse.status);
        
        if (exportsResponse.ok) {
          const exportsData = await exportsResponse.json();
          console.log('[CRS History] Exports data:', exportsData);
          setExports(exportsData.exports || []);
        } else {
          const errorText = await exportsResponse.text();
          console.error('[CRS History] Exports failed:', exportsResponse.status, errorText);
        }
      } catch (err) {
        console.error('[CRS History] Exports error:', err);
      }

      // Load activities
      try {
        const activitiesResponse = await fetch(`${API_BASE_URL}/crs/documents/history/activity/?days=30`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('[CRS History] Activities response status:', activitiesResponse.status);
        
        if (activitiesResponse.ok) {
          const activitiesData = await activitiesResponse.json();
          console.log('[CRS History] Activities data:', activitiesData);
          setActivities(activitiesData.activities || []);
        } else {
          const errorText = await activitiesResponse.text();
          console.error('[CRS History] Activities failed:', activitiesResponse.status, errorText);
        }
      } catch (err) {
        console.error('[CRS History] Activities error:', err);
      }

    } catch (error) {
      console.error('[CRS History] Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadConfig = async () => {
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const response = await fetch(`${API_BASE_URL}/crs/documents/history/config/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.config) {
          setHistoryConfig(data.config);
          console.log('[CRS History] Config loaded:', data.config);
        }
      }
    } catch (error) {
      console.error('[CRS History] Failed to load config:', error);
    }
  };

  const handleDownload = async (file) => {
    setDownloading(file.s3_key);
    
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const response = await fetch(`${API_BASE_URL}/crs/documents/history/download/?key=${encodeURIComponent(file.s3_key)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.filename || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const error = await response.json();
        alert(`Failed to download file: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Error downloading file');
    } finally {
      setDownloading(null);
    }
  };

  const handleDelete = async (file) => {
    const action = activeTab === 'uploads' ? historyConfig.upload_actions?.delete : historyConfig.export_actions?.delete;
    
    if (!action?.enabled) {
      alert('Delete action is disabled');
      return;
    }
    
    const confirmMessage = action.confirm_message || 'Are you sure you want to delete this file?';
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setActionInProgress(file.s3_key);
    
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const response = await fetch(`${API_BASE_URL}/crs/documents/history/delete/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key: file.s3_key })
      });

      if (response.ok) {
        alert('File deleted successfully!');
        // Refresh history
        loadHistory();
      } else {
        const error = await response.json();
        alert(`Failed to delete file: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Error deleting file');
    } finally {
      setActionInProgress(null);
      setOpenActionMenu(null);
    }
  };

  const handleShare = async (file) => {
    const action = activeTab === 'uploads' ? historyConfig.upload_actions?.share : historyConfig.export_actions?.share;
    
    if (!action?.enabled) {
      alert('Share action is disabled');
      return;
    }
    
    setActionInProgress(file.s3_key);
    
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const response = await fetch(`${API_BASE_URL}/crs/documents/history/share/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ key: file.s3_key, duration_hours: 1 })
      });

      if (response.ok) {
        const data = await response.json();
        setShareLink({
          url: data.share_url,
          expires_at: data.expires_at,
          expires_in_hours: data.expires_in_hours,
          filename: file.filename
        });
        setShowShareModal(true);
      } else {
        const error = await response.json();
        alert(`Failed to generate share link: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('Error generating share link');
    } finally {
      setActionInProgress(null);
      setOpenActionMenu(null);
    }
  };

  const handleViewMetadata = async (file) => {
    setActionInProgress(file.s3_key);
    
    try {
      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const response = await fetch(`${API_BASE_URL}/crs/documents/history/metadata/?key=${encodeURIComponent(file.s3_key)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedFileMetadata(data.metadata);
        setShowMetadataModal(true);
      } else {
        const error = await response.json();
        alert(`Failed to load metadata: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Metadata error:', error);
      alert('Error loading metadata');
    } finally {
      setActionInProgress(null);
      setOpenActionMenu(null);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const filteredUploads = uploads.filter(upload => 
    (upload.filename || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExports = exports.filter(exp => 
    (filterFormat === 'all' || exp.format === filterFormat) &&
    (exp.filename || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/crs/documents" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
              ← Back to CRS Documents
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">📚 CRS History</h1>
            <p className="text-gray-600">Access your previously processed documents and exports</p>
          </div>
          <button
            onClick={loadHistory}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {historyData && historyData.profile && (
        <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Uploads</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {historyData.profile.total_uploads || 0}
                </p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Exports</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {historyData.profile.total_exports || 0}
                </p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Recent Activity</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {activities.length}
                </p>
                <p className="text-gray-500 text-xs mt-1">Last 30 days</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-2 inline-flex">
          <button
            onClick={() => setActiveTab('uploads')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'uploads'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📤 Uploaded PDFs ({uploads.length})
          </button>
          <button
            onClick={() => setActiveTab('exports')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ml-2 ${
              activeTab === 'exports'
                ? 'bg-green-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📥 Exported Files ({exports.length})
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ml-2 ${
              activeTab === 'activities'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📋 Activity Log ({activities.length})
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex gap-4">
          <input
            type="text"
            placeholder="🔍 Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {activeTab === 'exports' && (
            <select
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Formats</option>
              <option value="xlsx">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="pdf">PDF (.pdf)</option>
              <option value="docx">Word (.docx)</option>
              <option value="json">JSON (.json)</option>
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {/* Uploads Tab */}
        {activeTab === 'uploads' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {filteredUploads.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-500 text-lg">No uploaded files found</p>
                <Link to="/crs/documents" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                  Upload your first CRS document →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        File Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Metadata
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUploads.map((upload, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">📄</span>
                            <div>
                              <p className="font-medium text-gray-900">
                                {upload.filename || 'Unnamed file'}
                              </p>
                              <p className="text-sm text-gray-500">PDF</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatFileSize(upload.size)}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          <div>
                            <p>{formatDate(upload.last_modified)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {upload.metadata && (
                            <div className="text-sm">
                              {upload.metadata.project_name && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Project:</span> {upload.metadata.project_name}
                                </p>
                              )}
                              {upload.metadata.document_number && (
                                <p className="text-gray-600">
                                  <span className="font-medium">Doc#:</span> {upload.metadata.document_number}
                                </p>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative inline-block">
                            <button
                              onClick={() => setOpenActionMenu(openActionMenu === upload.s3_key ? null : upload.s3_key)}
                              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center gap-2"
                            >
                              ⚙️ Actions 
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            
                            {openActionMenu === upload.s3_key && (
                              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                                <div className="py-1">
                                  {historyConfig.upload_actions?.download?.enabled && (
                                    <button
                                      onClick={() => { handleDownload(upload); setOpenActionMenu(null); }}
                                      disabled={downloading === upload.s3_key}
                                      className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3"
                                    >
                                      <span className="text-xl">⬇️</span>
                                      <div>
                                        <div className="font-medium text-gray-900">Download</div>
                                        <div className="text-xs text-gray-500">Save file to your device</div>
                                      </div>
                                    </button>
                                  )}
                                  
                                  {historyConfig.upload_actions?.share?.enabled && (
                                    <button
                                      onClick={() => handleShare(upload)}
                                      disabled={actionInProgress === upload.s3_key}
                                      className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center gap-3"
                                    >
                                      <span className="text-xl">🔗</span>
                                      <div>
                                        <div className="font-medium text-gray-900">Share</div>
                                        <div className="text-xs text-gray-500">Generate temporary link</div>
                                      </div>
                                    </button>
                                  )}
                                  
                                  {historyConfig.upload_actions?.view_metadata?.enabled && (
                                    <button
                                      onClick={() => handleViewMetadata(upload)}
                                      disabled={actionInProgress === upload.s3_key}
                                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                                    >
                                      <span className="text-xl">ℹ️</span>
                                      <div>
                                        <div className="font-medium text-gray-900">Details</div>
                                        <div className="text-xs text-gray-500">View file information</div>
                                      </div>
                                    </button>
                                  )}
                                  
                                  {historyConfig.upload_actions?.delete?.enabled && (
                                    <>
                                      <div className="border-t border-gray-200 my-1"></div>
                                      <button
                                        onClick={() => handleDelete(upload)}
                                        disabled={actionInProgress === upload.s3_key}
                                        className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
                                      >
                                        <span className="text-xl">🗑️</span>
                                        <div>
                                          <div className="font-medium">Delete</div>
                                          <div className="text-xs text-red-500">Remove permanently</div>
                                        </div>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Exports Tab */}
        {activeTab === 'exports' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {filteredExports.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-lg">No exported files found</p>
                <Link to="/crs/documents" className="text-blue-600 hover:text-blue-800 mt-2 inline-block">
                  Process a document to create exports →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        File Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Format
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Comments
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredExports.map((exp, index) => {
                      const formatIcon = {
                        'xlsx': '📊',
                        'csv': '📋',
                        'pdf': '📄',
                        'docx': '📝',
                        'json': '🔧'
                      };
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{formatIcon[exp.format] || '📄'}</span>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {exp.filename || 'CRS Export'}
                                </p>
                                <p className="text-sm text-gray-500">CRS Template</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {exp.format?.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {formatFileSize(exp.size)}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {formatDate(exp.last_modified)}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            N/A
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="relative inline-block">
                              <button
                                onClick={() => setOpenActionMenu(openActionMenu === exp.s3_key ? null : exp.s3_key)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors inline-flex items-center gap-2"
                              >
                                ⚙️ Actions 
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              
                              {openActionMenu === exp.s3_key && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-10">
                                  <div className="py-1">
                                    {historyConfig.export_actions?.download?.enabled && (
                                      <button
                                        onClick={() => { handleDownload(exp); setOpenActionMenu(null); }}
                                        disabled={downloading === exp.s3_key}
                                        className="w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-center gap-3"
                                      >
                                        <span className="text-xl">⬇️</span>
                                        <div>
                                          <div className="font-medium text-gray-900">Re-download</div>
                                          <div className="text-xs text-gray-500">Download export again</div>
                                        </div>
                                      </button>
                                    )}
                                    
                                    {historyConfig.export_actions?.share?.enabled && (
                                      <button
                                        onClick={() => handleShare(exp)}
                                        disabled={actionInProgress === exp.s3_key}
                                        className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-center gap-3"
                                      >
                                        <span className="text-xl">🔗</span>
                                        <div>
                                          <div className="font-medium text-gray-900">Share</div>
                                          <div className="text-xs text-gray-500">Generate temporary link</div>
                                        </div>
                                      </button>
                                    )}
                                    
                                    {historyConfig.export_actions?.view_metadata?.enabled && (
                                      <button
                                        onClick={() => handleViewMetadata(exp)}
                                        disabled={actionInProgress === exp.s3_key}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3"
                                      >
                                        <span className="text-xl">ℹ️</span>
                                        <div>
                                          <div className="font-medium text-gray-900">Details</div>
                                          <div className="text-xs text-gray-500">View export information</div>
                                        </div>
                                      </button>
                                    )}
                                    
                                    {historyConfig.export_actions?.delete?.enabled && (
                                      <>
                                        <div className="border-t border-gray-200 my-1"></div>
                                        <button
                                          onClick={() => handleDelete(exp)}
                                          disabled={actionInProgress === exp.s3_key}
                                          className="w-full text-left px-4 py-3 hover:bg-red-50 transition-colors flex items-center gap-3 text-red-600"
                                        >
                                          <span className="text-xl">🗑️</span>
                                          <div>
                                            <div className="font-medium">Delete</div>
                                            <div className="text-xs text-red-500">Remove permanently</div>
                                          </div>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-gray-500 text-lg">No recent activity</p>
              </div>
            ) : (
              <div className="p-6">
                <div className="space-y-4">
                  {activities.map((activity, index) => {
                    const actionIcons = {
                      'upload': '📤',
                      'export': '📥',
                      'download': '⬇️',
                      'delete': '🗑️',
                      'process': '⚙️'
                    };
                    
                    const actionColors = {
                      'upload': 'bg-blue-100 text-blue-800',
                      'export': 'bg-green-100 text-green-800',
                      'download': 'bg-purple-100 text-purple-800',
                      'delete': 'bg-red-100 text-red-800',
                      'process': 'bg-yellow-100 text-yellow-800'
                    };
                    
                    return (
                      <div key={index} className="flex items-start p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex-shrink-0 mr-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${actionColors[activity.action] || 'bg-gray-100 text-gray-800'}`}>
                            <span className="text-lg">{actionIcons[activity.action] || '📋'}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900">
                              {activity.action?.toUpperCase()} - {activity.file_name || 'File'}
                            </p>
                            <span className="text-sm text-gray-500">{formatDate(activity.timestamp)}</span>
                          </div>
                          {activity.metadata && (
                            <div className="mt-2 text-sm text-gray-600">
                              {activity.metadata.comment_count && (
                                <span>✓ {activity.metadata.comment_count} comments processed</span>
                              )}
                              {activity.metadata.format && (
                                <span className="ml-4">Format: {activity.metadata.format.toUpperCase()}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mt-1 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">💡 Pro Tips</h3>
              <ul className="text-blue-800 space-y-2">
                <li>• <strong>Avoid Re-uploading:</strong> Use this history page to re-download previous exports instead of processing the same PDF again</li>
                <li>• <strong>Multiple Formats:</strong> Download the same extraction in different formats (Excel, PDF, CSV, etc.)</li>
                <li>• <strong>Track Changes:</strong> Use the Activity Log to see when files were processed and by whom</li>
                <li>• <strong>Storage Saved:</strong> All your uploads and exports are stored securely in your personal S3 folder</li>
                <li>• <strong>Data Retention:</strong> Files are kept for {historyData?.profile?.retention_days || 90} days by default</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Modal */}
      {showMetadataModal && selectedFileMetadata && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowMetadataModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">File Details</h3>
              <button onClick={() => setShowMetadataModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Filename</p>
                <p className="font-medium text-gray-900 break-all">{selectedFileMetadata.filename}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Size</p>
                  <p className="font-medium text-gray-900">{formatFileSize(selectedFileMetadata.size)}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium text-gray-900">{selectedFileMetadata.content_type}</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Last Modified</p>
                <p className="font-medium text-gray-900">{formatDate(selectedFileMetadata.last_modified)}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">S3 Key</p>
                <p className="font-mono text-xs text-gray-700 break-all">{selectedFileMetadata.s3_key}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Storage Class</p>
                <p className="font-medium text-gray-900">{selectedFileMetadata.storage_class}</p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowMetadataModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Link Modal */}
      {showShareModal && shareLink && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Share Link Generated</h3>
              <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800 mb-2">✓ Share link created successfully!</p>
                <p className="text-xs text-blue-600">This link will expire in {shareLink.expires_in_hours} hour(s)</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">File</p>
                <p className="font-medium text-gray-900">{shareLink.filename}</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Share URL</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareLink.url}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono bg-white"
                  />
                  <button
                    onClick={() => copyToClipboard(shareLink.url)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Security Notice:</strong> Anyone with this link can download the file until it expires at {new Date(shareLink.expires_at).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => copyToClipboard(shareLink.url)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                📋 Copy Link
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRSHistory;
