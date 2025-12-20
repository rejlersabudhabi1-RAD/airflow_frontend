/**
 * CRS Documents Page - Comment Resolution Sheet
 * Professional PDF comment extraction and Google Sheets integration
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import crsService from '../services/crsService';

const CRSDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [statistics, setStatistics] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form states
  const [formData, setFormData] = useState({
    document_name: '',
    document_number: '',
    project_name: '',
    contractor_name: '',
    revision_number: '',
    notes: '',
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsResponse, statsResponse] = await Promise.all([
        crsService.fetchCRSDocuments(),
        crsService.getCRSStatistics()
      ]);
      
      setDocuments(Array.isArray(docsResponse) ? docsResponse : docsResponse.results || []);
      setStatistics(statsResponse);
    } catch (error) {
      console.error('Error loading CRS data:', error);
      alert('Failed to load documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    setProcessing(true);
    
    try {
      const newDoc = await crsService.createCRSDocument(formData);
      alert('✅ Document created successfully!');
      setShowCreateModal(false);
      setFormData({
        document_name: '',
        document_number: '',
        project_name: '',
        contractor_name: '',
        revision_number: '',
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Failed to create document. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUploadPDF = async (e) => {
    e.preventDefault();
    if (!pdfFile || !selectedDocument) return;
    
    setProcessing(true);
    
    try {
      // Upload PDF
      await crsService.uploadPDFDocument(selectedDocument.id, pdfFile);
      
      // Extract comments automatically
      const extractResult = await crsService.extractPDFComments(selectedDocument.id, {
        autoCreate: true,
        debug: false
      });
      
      alert(`✅ PDF uploaded and processed!\n\nExtracted ${extractResult.data.total_comments} comments:\n- 🔴 Red comments: ${extractResult.data.red_comments}\n- 🟡 Yellow boxes: ${extractResult.data.yellow_boxes}\n- 📌 Other: ${extractResult.data.other_annotations}`);
      
      setShowUploadModal(false);
      setPdfFile(null);
      setSelectedDocument(null);
      loadData();
    } catch (error) {
      console.error('Error uploading PDF:', error);
      alert('Failed to upload PDF. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleExportToSheets = async (document) => {
    if (!document.google_sheet_id) {
      const sheetId = prompt('Enter Google Sheet ID:');
      if (!sheetId) return;
      
      try {
        setProcessing(true);
        await crsService.exportToGoogleSheets(document.id, { sheetId });
        alert('✅ Exported to Google Sheets successfully!');
        loadData();
      } catch (error) {
        console.error('Error exporting:', error);
        alert('Failed to export. Please ensure Google Sheets API is configured.');
      } finally {
        setProcessing(false);
      }
    } else {
      try {
        setProcessing(true);
        await crsService.exportToGoogleSheets(document.id);
        alert('✅ Exported to Google Sheets successfully!');
        loadData();
      } catch (error) {
        console.error('Error exporting:', error);
        alert('Failed to export. Please try again.');
      } finally {
        setProcessing(false);
      }
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesSearch = !searchQuery || 
      doc.document_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.document_number && doc.document_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.project_name && doc.project_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-gray-100 text-gray-800',
      'in_review': 'bg-blue-100 text-blue-800',
      'processing': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'archived': 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pending',
      'in_review': 'In Review',
      'processing': 'Processing',
      'completed': 'Completed',
      'archived': 'Archived',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📋 CRS Documents - Comment Resolution Sheet
        </h1>
        <p className="text-gray-600">
          Professional PDF comment extraction and Google Sheets integration
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Documents</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{statistics.total_documents}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Comments</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{statistics.total_comments}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Open Comments</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{statistics.comments_by_status?.open || 0}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Resolved</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{statistics.comments_by_status?.resolved || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col md:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Create Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            ➕ Create Document
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocuments.map(doc => (
          <div key={doc.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {doc.document_name}
                  </h3>
                  {doc.document_number && (
                    <p className="text-sm text-gray-500">Doc #: {doc.document_number}</p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                  {getStatusLabel(doc.status)}
                </span>
              </div>

              {/* Project Info */}
              {doc.project_name && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Project:</span> {doc.project_name}
                  </p>
                  {doc.contractor_name && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Contractor:</span> {doc.contractor_name}
                    </p>
                  )}
                </div>
              )}

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span className="font-medium">{doc.completion_percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${doc.completion_percentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-2xl font-bold text-gray-900">{doc.total_comments}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="bg-yellow-50 rounded p-2">
                  <p className="text-2xl font-bold text-yellow-600">{doc.pending_comments}</p>
                  <p className="text-xs text-gray-500">Pending</p>
                </div>
                <div className="bg-green-50 rounded p-2">
                  <p className="text-2xl font-bold text-green-600">{doc.resolved_comments}</p>
                  <p className="text-xs text-gray-500">Resolved</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/crs/documents/${doc.id}`}
                  className="flex-1 text-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  View Details
                </Link>
                
                {!doc.pdf_file && (
                  <button
                    onClick={() => {
                      setSelectedDocument(doc);
                      setShowUploadModal(true);
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                  >
                    📤 Upload PDF
                  </button>
                )}
                
                {doc.total_comments > 0 && (
                  <button
                    onClick={() => handleExportToSheets(doc)}
                    disabled={processing}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    📊 Export
                  </button>
                )}
              </div>

              {/* Google Sheet Link */}
              {doc.google_sheet_url && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <a
                    href={doc.google_sheet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open in Google Sheets
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new CRS document.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              ➕ Create Document
            </button>
          </div>
        </div>
      )}

      {/* Create Document Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New CRS Document</h2>
              
              <form onSubmit={handleCreateDocument}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.document_name}
                      onChange={(e) => setFormData({...formData, document_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder="Enter document name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Document Number
                      </label>
                      <input
                        type="text"
                        value={formData.document_number}
                        onChange={(e) => setFormData({...formData, document_number: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="DOC-001"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Revision Number
                      </label>
                      <input
                        type="text"
                        value={formData.revision_number}
                        onChange={(e) => setFormData({...formData, revision_number: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                        placeholder="Rev 01"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={formData.project_name}
                      onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder="Enter project name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contractor Name
                    </label>
                    <input
                      type="text"
                      value={formData.contractor_name}
                      onChange={(e) => setFormData({...formData, contractor_name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder="Enter contractor name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder:text-gray-500"
                      placeholder="Additional notes..."
                    ></textarea>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {processing ? 'Creating...' : 'Create Document'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Upload PDF Modal */}
      {showUploadModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload PDF Document</h2>
              <p className="text-gray-600 mb-4">
                Upload PDF for: <strong>{selectedDocument.document_name}</strong>
              </p>
              
              <form onSubmit={handleUploadPDF}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select PDF File
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    required
                    onChange={(e) => setPdfFile(e.target.files[0])}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    PDF will be automatically processed to extract comments
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={processing || !pdfFile}
                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {processing ? 'Uploading & Processing...' : 'Upload & Extract'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setPdfFile(null);
                      setSelectedDocument(null);
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRSDocuments;
