import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  RocketLaunchIcon,
  DocumentArrowUpIcon,
  CloudArrowUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import {
  PROCESS_EQUIPMENT_DOCUMENTS,
  DOCUMENT_CATEGORIES,
  CATEGORY_DISPLAY_NAMES,
  CATEGORY_DESCRIPTIONS,
  getDocumentsByCategory,
  getCategoriesWithDocuments,
  DOCUMENT_STATUS
} from '../../../config/processEquipmentDocuments.config';

/**
 * Process Equipment Hub - Smart Unified Interface with P&ID Upload
 * Configuration-driven approach handling all process engineering documents
 * Features: Multi P&ID upload, document management, AI-powered extraction
 */
const ProcessEquipmentHub = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({
    [DOCUMENT_CATEGORIES.VALVE_DATASHEETS]: true,
    [DOCUMENT_CATEGORIES.EQUIPMENT_DATASHEETS]: true,
    [DOCUMENT_CATEGORIES.PIPING_DOCUMENTS]: true,
    [DOCUMENT_CATEGORIES.CONTROL_SYSTEMS]: true,
    [DOCUMENT_CATEGORIES.PROCESS_DOCUMENTS]: true,
    [DOCUMENT_CATEGORIES.CALCULATIONS]: true
  });

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const stats = {};
    Object.keys(DOCUMENT_CATEGORIES).forEach(key => {
      const category = DOCUMENT_CATEGORIES[key];
      const docs = getDocumentsByCategory(category);
      stats[category] = {
        total: docs.length,
        active: docs.filter(d => d.status === DOCUMENT_STATUS.ACTIVE).length,
        withPIDUpload: docs.filter(d => d.canUploadPID).length
      };
    });
    return stats;
  }, []);

  // Filter documents based on search, category, and status
  const filteredDocuments = useMemo(() => {
    return PROCESS_EQUIPMENT_DOCUMENTS.filter(doc => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.code.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;

      // Status filter
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [searchQuery, selectedCategory, statusFilter]);

  // Group filtered documents by category
  const groupedDocuments = useMemo(() => {
    const grouped = {};
    Object.values(DOCUMENT_CATEGORIES).forEach(category => {
      grouped[category] = filteredDocuments.filter(doc => doc.category === category);
    });
    return grouped;
  }, [filteredDocuments]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleDocumentClick = (doc) => {
    if (doc.status === DOCUMENT_STATUS.ACTIVE) {
      if (doc.route) {
        navigate(doc.route);
      } else if (doc.canUploadPID) {
        // Open upload modal for P&ID upload
        setSelectedDocument(doc);
        setShowUploadModal(true);
      }
    } else {
      alert(`${doc.name} is ${doc.status === DOCUMENT_STATUS.COMING_SOON ? 'coming soon' : 'in development'}!`);
    }
  };

  const handlePIDUpload = (doc) => {
    setSelectedDocument(doc);
    setShowUploadModal(true);
  };

  const getStatusBadge = (status) => {
    const badges = {
      [DOCUMENT_STATUS.ACTIVE]: {
        text: 'Available',
        colors: 'bg-green-100 text-green-800 border-green-200'
      },
      [DOCUMENT_STATUS.COMING_SOON]: {
        text: 'Coming Soon',
        colors: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      [DOCUMENT_STATUS.IN_DEVELOPMENT]: {
        text: 'In Development',
        colors: 'bg-blue-100 text-blue-800 border-blue-200'
      }
    };
    return badges[status] || badges[DOCUMENT_STATUS.COMING_SOON];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-emerald-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <RocketLaunchIcon className="h-8 w-8 text-emerald-600" />
                Process Equipment Documents
              </h1>
              <p className="mt-2 text-gray-600">
                Comprehensive process engineering document suite - Upload P&IDs for AI-powered analysis, manage datasheets, and generate specifications
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              <CloudArrowUpIcon className="h-5 w-5" />
              Upload P&ID
            </button>
          </div>

          {/* Stats Overview */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-4">
            {Object.entries(CATEGORY_DISPLAY_NAMES).map(([key, name]) => (
              <div key={key} className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg p-4 border border-emerald-100">
                <div className="text-2xl font-bold text-emerald-600">
                  {categoryStats[key]?.total || 0}
                </div>
                <div className="text-xs text-gray-600 mt-1">{name}</div>
                <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircleIcon className="h-3 w-3" />
                  {categoryStats[key]?.active || 0} Active
                </div>
                {(categoryStats[key]?.withPIDUpload || 0) > 0 && (
                  <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <DocumentArrowUpIcon className="h-3 w-3" />
                    P&ID Upload
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_DISPLAY_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value={DOCUMENT_STATUS.ACTIVE}>Available</option>
                <option value={DOCUMENT_STATUS.COMING_SOON}>Coming Soon</option>
                <option value={DOCUMENT_STATUS.IN_DEVELOPMENT}>In Development</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid - Organized by Category */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {Object.entries(DOCUMENT_CATEGORIES).map(([categoryKey, category]) => {
          const docs = groupedDocuments[category];
          if (docs.length === 0) return null;

          return (
            <div key={category} className="mb-8">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-lg">
                    {docs.length}
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-bold text-gray-900">
                      {CATEGORY_DISPLAY_NAMES[category]}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {CATEGORY_DESCRIPTIONS[category]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {docs.filter(d => d.status === DOCUMENT_STATUS.ACTIVE).length} of {docs.length} available
                  </span>
                  {expandedCategories[category] ? (
                    <ChevronUpIcon className="h-6 w-6 text-gray-400" />
                  ) : (
                    <ChevronDownIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
              </button>

              {/* Category Documents */}
              {expandedCategories[category] && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {docs.map((doc) => {
                    const statusBadge = getStatusBadge(doc.status);

                    return (
                      <div
                        key={doc.id}
                        className={`
                          relative bg-white rounded-lg shadow-sm border border-gray-200 p-6
                          hover:shadow-lg hover:border-emerald-300 transition-all duration-200
                          ${doc.status === DOCUMENT_STATUS.ACTIVE ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}
                          group
                        `}
                      >
                        {/* Status Badge */}
                        <div className="absolute top-3 right-3 flex gap-2">
                          {doc.canUploadPID && doc.status === DOCUMENT_STATUS.ACTIVE && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePIDUpload(doc);
                              }}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 transition-colors"
                              title="Upload P&ID"
                            >
                              <DocumentArrowUpIcon className="h-3 w-3 mr-1" />
                              P&ID
                            </button>
                          )}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge.colors}`}>
                            {statusBadge.text}
                          </span>
                        </div>

                        {/* Icon */}
                        <div 
                          onClick={() => handleDocumentClick(doc)}
                          className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200"
                        >
                          <RocketLaunchIcon className="h-8 w-8 text-white" />
                        </div>

                        {/* Document Code */}
                        <div className="text-xs font-mono text-gray-500 mb-1">
                          {doc.code}
                        </div>

                        {/* Document Name */}
                        <h3 
                          onClick={() => handleDocumentClick(doc)}
                          className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors"
                        >
                          {doc.name}
                        </h3>

                        {/* Full Name */}
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          {doc.fullName}
                        </p>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {doc.description}
                        </p>

                        {/* Supported File Types (if P&ID upload available) */}
                        {doc.canUploadPID && doc.supportedFileTypes && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                              Supported: {doc.supportedFileTypes.join(', ')}
                            </p>
                          </div>
                        )}

                        {/* Hover Effect */}
                        {doc.status === DOCUMENT_STATUS.ACTIVE && (
                          <div className="absolute inset-0 border-2 border-transparent group-hover:border-emerald-500 rounded-lg pointer-events-none transition-colors duration-200"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* No Results */}
        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <PIDUploadModal
          document={selectedDocument}
          onClose={() => {
            setShowUploadModal(false);
            setSelectedDocument(null);
          }}
        />
      )}

      {/* Footer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-6 border border-emerald-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <DocumentArrowUpIcon className="h-5 w-5 text-emerald-600" />
            About Process Equipment Documents with P&ID Integration
          </h3>
          <p className="text-sm text-gray-700 mb-4">
            This comprehensive suite provides intelligent P&ID analysis and document generation for process engineering. 
            Upload single or multiple P&ID drawings to automatically extract equipment data, generate datasheets, and maintain consistency across your project.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-semibold text-gray-900">🔧 Valve Datasheets</div>
              <div className="text-gray-600">MOV, SDV, control valves with P&ID upload</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">⚙️ Equipment Data</div>
              <div className="text-gray-600">Pumps, vessels, heat exchangers, compressors</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">📐 Piping & Control</div>
              <div className="text-gray-600">Line lists, instruments, material specs</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">🤖 AI-Powered</div>
              <div className="text-gray-600">Automatic extraction from P&ID drawings</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * P&ID Upload Modal Component
 * Handles file upload for P&ID drawings
 */
const PIDUploadModal = ({ document, onClose }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file');
      return;
    }

    setUploading(true);
    try {
      // TODO: Implement actual file upload logic
      // For now, just simulate and navigate
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to appropriate page based on document type
      if (document?.route) {
        navigate(document.route);
      } else {
        alert('Files uploaded successfully! Processing will begin shortly.');
        onClose();
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CloudArrowUpIcon className="h-7 w-7 text-emerald-600" />
            Upload P&ID Drawing{document ? ` - ${document.name}` : 's'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {document && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>{document.fullName}:</strong> {document.description}
            </p>
            {document.supportedFileTypes && (
              <p className="text-xs text-gray-600 mt-2">
                Supported formats: {document.supportedFileTypes.join(', ')}
              </p>
            )}
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select P&ID files (single or multiple)
          </label>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            accept=".pdf,.dwg,.dxf,.png,.jpg,.jpeg,.tiff"
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-emerald-50 file:text-emerald-700
              hover:file:bg-emerald-100
              cursor-pointer"
          />
        </div>

        {selectedFiles.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Selected files ({selectedFiles.length}):
            </p>
            <ul className="space-y-1">
              {selectedFiles.map((file, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-600" />
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="h-5 w-5" />
                Upload & Analyze
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessEquipmentHub;
