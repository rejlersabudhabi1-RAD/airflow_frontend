import React, { useState, useRef } from 'react';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';
import apiClient from '../../../services/api.service';

const CriticalStressLineList = () => {
  const [projectType, setProjectType] = useState('');
  const [documents, setDocuments] = useState({
    pfd: null,
    pid: null,
    scope: null,
    additional: []
  });
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [results, setResults] = useState(null);

  const pfdInputRef = useRef(null);
  const pidInputRef = useRef(null);
  const scopeInputRef = useRef(null);
  const additionalInputRef = useRef(null);

  const projectTypes = [
    { value: 'adnoc_offshore', label: 'ADNOC Offshore', color: 'bg-purple-500' },
    { value: 'adnoc_onshore', label: 'ADNOC Onshore', color: 'bg-blue-500' },
    { value: 'general', label: 'General', color: 'bg-green-500' }
  ];

  const handleFileSelect = (type, file) => {
    if (type === 'additional') {
      setDocuments(prev => ({
        ...prev,
        additional: [...prev.additional, file]
      }));
    } else {
      setDocuments(prev => ({
        ...prev,
        [type]: file
      }));
    }
  };

  const removeFile = (type, index = null) => {
    if (type === 'additional') {
      setDocuments(prev => ({
        ...prev,
        additional: prev.additional.filter((_, i) => i !== index)
      }));
    } else {
      setDocuments(prev => ({
        ...prev,
        [type]: null
      }));
    }
  };

  const canProcess = () => {
    return projectType && documents.pfd && documents.pid && documents.scope;
  };

  const handleProcess = async () => {
    if (!canProcess()) {
      setUploadStatus({
        type: 'error',
        message: 'Please select project type and upload all mandatory documents'
      });
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    try {
      const formData = new FormData();
      formData.append('project_type', projectType);
      formData.append('pfd', documents.pfd);
      formData.append('pid', documents.pid);
      formData.append('scope', documents.scope);
      formData.append('list_type', 'critical_stress');

      documents.additional.forEach((file, index) => {
        formData.append(`additional_${index}`, file);
      });

      const response = await apiClient.post('/designiq/lists/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 600000 // 10 minutes
      });

      setUploadStatus({
        type: 'success',
        message: 'Processing completed successfully!'
      });

      setResults(response.data);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        type: 'error',
        message: error.response?.data?.detail || 'Failed to process documents. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setProjectType('');
    setDocuments({
      pfd: null,
      pid: null,
      scope: null,
      additional: []
    });
    setUploadStatus(null);
    setResults(null);
  };

  const getProjectTypeColor = () => {
    const type = projectTypes.find(t => t.value === projectType);
    return type?.color || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <TableCellsIcon className="w-12 h-12 text-orange-500" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Critical Stress Line List
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Engineering / Piping / Critical Stress Analysis
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          {/* Project Type Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Project Type <span className="text-red-500">*</span>
            </label>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
            >
              <option value="">Select Project Type</option>
              {projectTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>


          {/* Document Upload Section */}
          <div className="space-y-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Document Upload
            </h3>

            {/* Mandatory Documents */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* PFD Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  PFD <span className="text-red-500">*</span>
                </label>
                <input
                  ref={pfdInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileSelect('pfd', e.target.files[0])}
                  className="hidden"
                />
                {!documents.pfd ? (
                  <button
                    onClick={() => pfdInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 transition-colors"
                  >
                    <CloudArrowUpIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload PFD</p>
                  </button>
                ) : (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {documents.pfd.name}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile('pfd')}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* P&ID Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  P&ID <span className="text-red-500">*</span>
                </label>
                <input
                  ref={pidInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileSelect('pid', e.target.files[0])}
                  className="hidden"
                />
                {!documents.pid ? (
                  <button
                    onClick={() => pidInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 transition-colors"
                  >
                    <CloudArrowUpIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload P&ID</p>
                  </button>
                ) : (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {documents.pid.name}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile('pid')}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Scope of Work Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Scope of Work <span className="text-red-500">*</span>
                </label>
                <input
                  ref={scopeInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileSelect('scope', e.target.files[0])}
                  className="hidden"
                />
                {!documents.scope ? (
                  <button
                    onClick={() => scopeInputRef.current?.click()}
                    className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 transition-colors"
                  >
                    <CloudArrowUpIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Click to upload Scope</p>
                  </button>
                ) : (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                          {documents.scope.name}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile('scope')}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Optional Additional Documents */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Additional Engineering Documents (Optional)
              </label>
              <input
                ref={additionalInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xlsx,.xls"
                onChange={(e) => {
                  handleFileSelect('additional', e.target.files[0]);
                  e.target.value = '';
                }}
                className="hidden"
              />
              <button
                onClick={() => additionalInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-400 transition-colors"
              >
                <CloudArrowUpIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Click to add additional documents</p>
              </button>

              {documents.additional.length > 0 && (
                <div className="space-y-2 mt-4">
                  {documents.additional.map((file, index) => (
                    <div
                      key={index}
                      className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {file.name}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile('additional', index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XCircleIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Status Messages */}
          {uploadStatus && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                uploadStatus.type === 'success'
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                {uploadStatus.type === 'success' ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <XCircleIcon className="w-5 h-5" />
                )}
                <span className="font-medium">{uploadStatus.message}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleProcess}
              disabled={!canProcess() || uploading}
              className={`flex-1 px-6 py-4 rounded-lg font-semibold text-white transition-all ${
                canProcess() && !uploading
                  ? `${getProjectTypeColor()} hover:opacity-90 shadow-md hover:shadow-lg`
                  : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              }`}
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </span>
              ) : (
                'Process Critical Stress Lines'
              )}
            </button>

            <button
              onClick={resetForm}
              disabled={uploading}
              className="px-6 py-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>

          {/* Mandatory Documents Note */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-semibold">Note:</span> PFD, P&ID, and Scope of Work are mandatory documents.
              The Process button will be enabled only after all mandatory documents are uploaded.
            </p>
          </div>
        </div>

        {/* Results Section (placeholder for future implementation) */}
        {results && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Critical Stress Line List Results
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Processing complete. Results will be displayed here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CriticalStressLineList;
