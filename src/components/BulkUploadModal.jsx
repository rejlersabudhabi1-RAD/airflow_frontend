import React, { useState } from 'react';
import { 
  CloudArrowUpIcon, 
  DocumentArrowDownIcon, 
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import rbacService from '../services/rbac.service';

/**
 * Bulk Upload Modal Component
 * Upload CSV file to create multiple users at once
 */
const BulkUploadModal = ({ isOpen, onClose, onSuccess, organizations }) => {
  const [file, setFile] = useState(null);
  const [organizationId, setOrganizationId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await rbacService.downloadBulkUploadTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'user_bulk_upload_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download template:', error);
      alert('Failed to download template. Please try again.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    if (!organizationId) {
      alert('Please select an organization');
      return;
    }

    setUploading(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organization_id', organizationId);

      const response = await rbacService.bulkUploadUsers(formData);
      setResults(response.data);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Bulk upload failed:', error);
      alert('Bulk upload failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setOrganizationId('');
    setResults(null);
    setDragActive(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CloudArrowUpIcon className="w-8 h-8 text-white" />
              <h3 className="text-2xl font-bold text-white">Bulk User Upload</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {!results ? (
              <form onSubmit={handleUpload} className="space-y-6">
                {/* Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">📋 Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                    <li>Download the CSV template using the button below</li>
                    <li>Fill in user details following the template format</li>
                    <li>Select the organization for these users</li>
                    <li>Upload the completed CSV file</li>
                  </ol>
                </div>

                {/* Download Template Button */}
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <DocumentArrowDownIcon className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-600">Download CSV Template</span>
                </button>

                {/* Organization Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Organization *
                  </label>
                  <select
                    value={organizationId}
                    onChange={(e) => setOrganizationId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Organization</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* File Upload Area */}
                <div
                  className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50' 
                      : file 
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  {file ? (
                    <div className="space-y-2">
                      <CheckCircleIcon className="w-12 h-12 text-green-600 mx-auto" />
                      <p className="text-lg font-semibold text-green-700">{file.name}</p>
                      <p className="text-sm text-gray-600">File size: {(file.size / 1024).toFixed(2)} KB</p>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-sm text-red-600 hover:text-red-800 underline"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto" />
                      <p className="text-lg font-medium text-gray-700">
                        Drag and drop your CSV file here
                      </p>
                      <p className="text-sm text-gray-500">or click to browse</p>
                      <p className="text-xs text-gray-400">Supports .csv and .txt files</p>
                    </div>
                  )}
                </div>

                {/* CSV Format Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">📝 CSV Format:</h4>
                  <div className="text-xs text-gray-700 font-mono bg-white p-3 rounded border">
                    email,first_name,last_name,password,department,job_title,phone_number,role_codes,module_codes
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Note:</strong> role_codes and module_codes should be comma-separated 
                    (e.g., "admin,engineer" or "PID,PFD,CRS")
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !file || !organizationId}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-lg"
                  >
                    {uploading ? (
                      <span className="flex items-center space-x-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Uploading...</span>
                      </span>
                    ) : (
                      'Upload Users'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              // Results Display
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-600">{results.summary.total_processed}</p>
                    <p className="text-sm text-blue-800">Total Processed</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{results.summary.successful}</p>
                    <p className="text-sm text-green-800">Successful</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-red-600">{results.summary.failed}</p>
                    <p className="text-sm text-red-800">Failed</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{results.summary.skipped}</p>
                    <p className="text-sm text-yellow-800">Skipped</p>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Success */}
                  {results.details.success.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2 flex items-center space-x-2">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>Successfully Created ({results.details.success.length})</span>
                      </h4>
                      <div className="space-y-2">
                        {results.details.success.map((item, idx) => (
                          <div key={idx} className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                            <span className="font-medium">Row {item.row}:</span> {item.email} - {item.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failed */}
                  {results.details.failed.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-700 mb-2 flex items-center space-x-2">
                        <XCircleIcon className="w-5 h-5" />
                        <span>Failed ({results.details.failed.length})</span>
                      </h4>
                      <div className="space-y-2">
                        {results.details.failed.map((item, idx) => (
                          <div key={idx} className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                            <span className="font-medium">Row {item.row}:</span> {item.email}
                            <p className="text-red-600 mt-1">Error: {item.error}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skipped */}
                  {results.details.skipped.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-yellow-700 mb-2 flex items-center space-x-2">
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        <span>Skipped ({results.details.skipped.length})</span>
                      </h4>
                      <div className="space-y-2">
                        {results.details.skipped.map((item, idx) => (
                          <div key={idx} className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                            <span className="font-medium">Row {item.row}:</span> {item.email}
                            <p className="text-yellow-600 mt-1">Reason: {item.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Close Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleClose}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
