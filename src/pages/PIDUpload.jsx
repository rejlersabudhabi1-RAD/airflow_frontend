import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api.service';

const PIDUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    drawing_number: '',
    drawing_title: '',
    revision: '',
    project_name: '',
    auto_analyze: true
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are allowed');
      return;
    }
    
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File size cannot exceed 50MB');
      return;
    }
    
    setFile(selectedFile);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a P&ID drawing file');
      return;
    }

    setUploading(true);
    setError('');

    // Create FormData with proper type handling
    const formDataToSend = new FormData();
    formDataToSend.append('file', file);
    
    // Only append non-empty optional fields
    if (formData.drawing_number?.trim()) {
      formDataToSend.append('drawing_number', formData.drawing_number.trim());
    }
    if (formData.drawing_title?.trim()) {
      formDataToSend.append('drawing_title', formData.drawing_title.trim());
    }
    if (formData.revision?.trim()) {
      formDataToSend.append('revision', formData.revision.trim());
    }
    if (formData.project_name?.trim()) {
      formDataToSend.append('project_name', formData.project_name.trim());
    }
    
    // CRITICAL: Convert boolean to string for DRF BooleanField
    formDataToSend.append('auto_analyze', formData.auto_analyze ? 'true' : 'false');

    try {
      console.log('[DEBUG] ===== UPLOAD REQUEST =====');
      console.log('[DEBUG] File:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      });
      console.log('[DEBUG] FormData fields:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`  ${key}:`, typeof value === 'object' ? `[File: ${value.name}]` : value);
      }
      console.log('[DEBUG] API Endpoint:', apiClient.defaults.baseURL + '/pid/drawings/upload/');
      
      const response = await apiClient.post(
        '/pid/drawings/upload/',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 2 minutes for large file uploads
        }
      );

      console.log('[DEBUG] ===== UPLOAD SUCCESS =====');
      console.log('[DEBUG] Response:', response.data);
      
      // Validate response structure
      if (!response.data || !response.data.id) {
        throw new Error('Invalid server response: missing drawing ID');
      }
      
      // Navigate to report page
      navigate(`/pid/report/${response.data.id}`);
    } catch (err) {
      console.error('[ERROR] ===== UPLOAD FAILED =====');
      console.error('[ERROR] Full error:', err);
      console.error('[ERROR] Response status:', err.response?.status);
      console.error('[ERROR] Response data:', err.response?.data);
      console.error('[ERROR] Request config:', err.config);
      
      // Handle different error scenarios with detailed messages
      let errorMessage = 'Upload failed. Please try again.';
      
      if (err.response?.status === 400) {
        // Validation error - show detailed field errors
        const validationErrors = err.response.data;
        if (typeof validationErrors === 'object') {
          const fieldErrors = Object.entries(validationErrors)
            .map(([field, errors]) => {
              const errorMsg = Array.isArray(errors) ? errors[0] : errors;
              return `${field}: ${errorMsg}`;
            })
            .join(', ');
          errorMessage = `Validation error: ${fieldErrors}`;
        } else {
          errorMessage = `Validation error: ${validationErrors}`;
        }
      } else if (err.response?.data?.error) {
        errorMessage = `Analysis failed: ${err.response.data.error}`;
      } else if (err.response?.status === 401) {
        errorMessage = 'Authentication required. Please login again.';
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 413) {
        errorMessage = 'File too large. Maximum size is 50MB.';
      } else if (err.response?.status === 415) {
        errorMessage = 'Invalid file type. Only PDF files are accepted.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please check the file and try again.';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Upload timeout. Please try a smaller file or check your connection.';
      } else if (!err.response) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          P&ID Design Verification
        </h1>
        <p className="text-gray-600">
          Upload your P&ID drawing for AI-powered engineering review and compliance verification
        </p>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              P&ID Drawing (PDF) *
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="file-upload"
                accept=".pdf"
                onChange={(e) => handleFileSelect(e.target.files[0])}
                className="hidden"
              />
              
              {!file ? (
                <>
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600">
                    <label htmlFor="file-upload" className="cursor-pointer text-blue-600 hover:text-blue-500 font-medium">
                      Click to upload
                    </label>
                    {' '}or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF files only, up to 50MB
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <svg className="h-10 w-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Drawing Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drawing Number
              </label>
              <input
                type="text"
                name="drawing_number"
                value={formData.drawing_number}
                onChange={handleInputChange}
                placeholder="e.g., 16-01-08-1678-1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Revision
              </label>
              <input
                type="text"
                name="revision"
                value={formData.revision}
                onChange={handleInputChange}
                placeholder="e.g., Rev 01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drawing Title
              </label>
              <input
                type="text"
                name="drawing_title"
                value={formData.drawing_title}
                onChange={handleInputChange}
                placeholder="e.g., Compressor Package"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                name="project_name"
                value={formData.project_name}
                onChange={handleInputChange}
                placeholder="e.g., ADNOC Project XYZ"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Auto-analyze Option */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="auto_analyze"
              id="auto_analyze"
              checked={formData.auto_analyze}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="auto_analyze" className="ml-2 block text-sm text-gray-700">
              Automatically start AI analysis after upload
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={uploading || !file}
              className={`flex-1 py-3 px-4 rounded-md font-medium text-white transition-colors ${
                uploading || !file
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {uploading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {formData.auto_analyze ? 'Uploading & Analyzing...' : 'Uploading...'}
                </span>
              ) : (
                `Upload ${formData.auto_analyze ? '& Analyze' : 'Drawing'}`
              )}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Information Panel */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">AI-Powered Verification Includes:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Equipment dimensions and datasheet compliance</li>
          <li>✓ Instrumentation tags and fail-safe positions</li>
          <li>✓ PSV isolation philosophy and safety systems</li>
          <li>✓ Piping layout and drainage compliance</li>
          <li>✓ Notes, legends, and project standard adherence</li>
        </ul>
      </div>
    </div>
  );
};

export default PIDUpload;
