import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { API_BASE_URL } from '../../config/api.config';
import { apiClientLongTimeout } from '../../services/api.service';

const StressCriticalLineList = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [uploadingPID, setUploadingPID] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handlePIDUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset previous states
    setUploadResult(null);
    setUploadError(null);
    setUploadingPID(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('list_type', 'line_list');
    formData.append('format_type', 'stress_critical');
    formData.append('include_area', 'false');

    try {
      setProcessing(true);
      
      const token = localStorage.getItem('access_token');
      const response = await apiClientLongTimeout.post(
        `${API_BASE_URL}/api/v1/designiq/lists/upload-pid/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data) {
        setUploadResult({
          success: true,
          message: 'P&ID processed successfully!',
          data: response.data
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(
        error.response?.data?.error || 
        error.response?.data?.message || 
        'Failed to upload P&ID. Please try again.'
      );
      setUploadResult({
        success: false,
        message: 'Upload failed'
      });
    } finally {
      setUploadingPID(false);
      setProcessing(false);
    }

    // Reset file input
    e.target.value = null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/designiq/lists?type=line_list')}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Line List
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-bold text-gray-900">
                Stress Critical Line List
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Description */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
              <CheckCircleIcon className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Upload P&ID for Stress Critical Analysis
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Upload your P&ID document to identify and extract stress critical lines. 
              The system will analyze the document and highlight critical piping systems.
            </p>
          </div>

          {/* Upload Section */}
          <div className="max-w-xl mx-auto">
            {/* Upload Button */}
            <div className="flex justify-center mb-6">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPID || processing}
                className={`flex items-center px-6 py-3 rounded-lg text-white font-medium ${
                  uploadingPID || processing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Processing OCR...
                  </>
                ) : uploadingPID ? (
                  <>
                    <ClockIcon className="w-5 h-5 mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
                    Upload P&ID
                  </>
                )}
              </button>
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handlePIDUpload}
              className="hidden"
            />

            {/* Upload Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Upload Requirements:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• File format: PDF only</li>
                <li>• Maximum file size: 50MB</li>
                <li>• Clear, high-resolution P&ID drawings</li>
                <li>• Processing time: 5-15 minutes depending on document size</li>
              </ul>
            </div>

            {/* Upload Result */}
            {uploadResult && (
              <div className={`rounded-lg p-4 ${
                uploadResult.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start">
                  {uploadResult.success ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      uploadResult.success ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {uploadResult.message}
                    </p>
                    {uploadError && (
                      <p className="text-sm text-red-700 mt-1">{uploadError}</p>
                    )}
                    {uploadResult.success && uploadResult.data && (
                      <div className="mt-2 text-sm text-green-700">
                        <p>Lines extracted: {uploadResult.data.extracted_count || 0}</p>
                        <button
                          onClick={() => navigate('/designiq/lists?type=line_list')}
                          className="mt-2 text-green-800 hover:text-green-900 font-medium"
                        >
                          View extracted lines →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Processing Info */}
            {processing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <div className="flex items-start">
                  <ClockIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">Processing in progress...</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Please wait while we analyze your P&ID document. This may take several minutes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-4 text-center">
              What happens after upload?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full mb-3">
                  <span className="text-orange-600 font-semibold">1</span>
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">OCR Extraction</h4>
                <p className="text-xs text-gray-600">
                  Advanced OCR technology extracts all line numbers and specifications
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full mb-3">
                  <span className="text-orange-600 font-semibold">2</span>
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">AI Analysis</h4>
                <p className="text-xs text-gray-600">
                  AI identifies stress critical lines based on specifications
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full mb-3">
                  <span className="text-orange-600 font-semibold">3</span>
                </div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Results Ready</h4>
                <p className="text-xs text-gray-600">
                  View, edit, and export your stress critical line list
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StressCriticalLineList;
