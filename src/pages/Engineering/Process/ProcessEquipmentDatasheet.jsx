/**
 * Process Equipment Datasheet Generator
 * SOFT-CODED: P&ID upload page for automatic equipment detection and datasheet generation
 * Features:
 * - Single or multiple P&ID file upload
 * - Drag & drop interface
 * - AI-powered equipment detection
 * - Automatic datasheet generation
 * - Excel export functionality
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CloudArrowUpIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import apiClient from '../../../services/api.service';
import PROCESS_EQUIPMENT_UPLOAD_CONFIG, {
  validateFileSize,
  validateFileFormat,
  getEquipmentTypeById,
  getColorScheme,
  getApiEndpoint,
  handleApiError,
  retryRequest
} from '../../../config/processEquipmentUpload.config';

const ProcessEquipmentDatasheet = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { page, upload, equipmentTypes, analysisOptions, projectFields, messages, theme } = PROCESS_EQUIPMENT_UPLOAD_CONFIG;

  // State management
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [selectedOptionsState, setSelectedOptionsState] = useState({
    extract_tags: true,
    detect_types: true,
    extract_specs: true,
    generate_datasheets: false,
    identify_connections: true
  });

  const [formData, setFormData] = useState({
    drawing_number: '',
    drawing_title: '',
    revision: projectFields.revision.default,
    project_name: '',
    project_code: '',
    area: '',
    discipline: projectFields.discipline.default
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  // File handling
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const validatedFiles = [];
    const errors = [];

    newFiles.forEach(file => {
      // Validate format
      if (!validateFileFormat(file)) {
        errors.push(`${file.name}: ${messages.errors.invalidFormat} ${upload.supportedFormats.join(', ')}`);
        return;
      }

      // Validate size
      if (!validateFileSize(file)) {
        errors.push(`${file.name}: ${messages.errors.fileTooLarge.replace('{size}', upload.maxFileSize)}`);
        return;
      }

      // Check if file already added
      if (files.some(f => f.name === file.name && f.size === file.size)) {
        errors.push(`${file.name}: File already added`);
        return;
      }

      // Check max files limit
      if (files.length + validatedFiles.length >= upload.maxFiles) {
        errors.push(messages.errors.tooManyFiles.replace('{max}', upload.maxFiles));
        return;
      }

      validatedFiles.push({
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      });
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      setError('');
    }

    if (validatedFiles.length > 0) {
      setFiles(prev => [...prev, ...validatedFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
    setError('');
  };

  // Drag and drop handlers
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

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      addFiles(droppedFiles);
    }
  };

  // Upload handler
  const handleUpload = async () => {
    if (files.length === 0) {
      setError(messages.errors.noFile);
      return;
    }

    // Validate required fields
    if (!formData.drawing_number) {
      setError('Drawing Number is required');
      return;
    }

    // Validate at least one analysis option is selected
    const hasSelectedOption = Object.values(selectedOptionsState).some(value => value === true);
    if (!hasSelectedOption) {
      setError('Please select at least one analysis option');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');
    setWarning('');
    setAnalysisStage('Uploading P&ID drawings...');

    const uploadFormData = new FormData();

    // Add files
    files.forEach((fileObj, index) => {
      uploadFormData.append(`files`, fileObj.file);
    });

    // Add metadata
    uploadFormData.append('drawing_number', formData.drawing_number);
    uploadFormData.append('drawing_title', formData.drawing_title || 'Process Equipment Analysis');
    uploadFormData.append('revision', formData.revision);
    uploadFormData.append('project_name', formData.project_name);
    uploadFormData.append('project_code', formData.project_code);
    uploadFormData.append('area', formData.area);
    uploadFormData.append('discipline', formData.discipline);

    // Add analysis options
    Object.keys(selectedOptionsState).forEach(key => {
      uploadFormData.append(key, selectedOptionsState[key]);
    });

    uploadFormData.append('file_count', files.length);

    try {
      console.log('[Process Equipment] Starting P&ID upload...', {
        fileCount: files.length,
        options: selectedOptionsState
      });

      setAnalysisStage(`Uploading ${files.length} P&ID file(s)...`);

      // Determine endpoint based on number of files
      const endpoint = files.length === 1 
        ? getApiEndpoint('analyze')
        : getApiEndpoint('multiAnalyze');

      console.log(`[Process Equipment] Using endpoint: ${endpoint}`);

      // Make API call with retry logic
      const response = await retryRequest(
        async () => {
          return await apiClient.post(endpoint, uploadFormData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: files.length > 1 
              ? PROCESS_EQUIPMENT_UPLOAD_CONFIG.processing.multiFileTimeout 
              : PROCESS_EQUIPMENT_UPLOAD_CONFIG.processing.timeout,
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(Math.min(percentCompleted, 95)); // Reserve 5% for processing
              
              // Update stage based on progress
              if (percentCompleted > 30 && percentCompleted <= 60) {
                setAnalysisStage('Extracting equipment tags...');
              } else if (percentCompleted > 60 && percentCompleted <= 90) {
                setAnalysisStage('Detecting equipment types...');
              } else if (percentCompleted > 90) {
                setAnalysisStage('Generating datasheets...');
              }
            },
          });
        },
        PROCESS_EQUIPMENT_UPLOAD_CONFIG.processing.retryAttempts,
        PROCESS_EQUIPMENT_UPLOAD_CONFIG.processing.retryDelay
      );

      // Handle successful response
      if (response.data && response.data.success !== false) {
        const resultData = response.data;
        
        setUploadResult({
          success: true,
          upload_id: resultData.upload_id || resultData.id,
          files_processed: resultData.files_processed || files.length,
          equipment_detected: resultData.equipment_count || resultData.total_equipment || 0,
          equipment_summary: resultData.equipment_summary || resultData.equipment_by_type || {},
          processing_time: resultData.processing_time || 0,
          confidence_score: resultData.confidence_score || resultData.average_confidence || 0,
          drawings: resultData.drawings || [],
          equipment_list: resultData.equipment_list || resultData.equipment || []
        });
        
        // Check for warning conditions
        const confidenceScore = resultData.confidence_score || resultData.average_confidence || 0;
        const filesProcessed = resultData.files_processed || files.length;
        const equipmentCount = resultData.equipment_count || resultData.total_equipment || 0;
        
        // Low confidence warning
        if (confidenceScore > 0 && confidenceScore < 0.7) {
          setWarning(`Analysis completed with ${Math.round(confidenceScore * 100)}% confidence. Results may need manual verification.`);
        }
        
        // Partial processing warning
        if (filesProcessed < files.length) {
          setWarning(`Only ${filesProcessed} of ${files.length} files were processed successfully. Some files may have errors.`);
        }
        
        // No equipment detected warning
        if (equipmentCount === 0) {
          setWarning('No equipment was detected in the uploaded P&ID drawings. Please verify the file quality and try again.');
        }
        
        // Warnings from API response
        if (resultData.warnings && resultData.warnings.length > 0) {
          setWarning(resultData.warnings.join('\n'));
        }
        
        setUploadProgress(100);
        setAnalysisStage('Analysis complete!');
        
        console.log('[Process Equipment] Analysis complete:', resultData);
        
      } else {
        throw new Error(response.data.message || messages.errors.analysisFailed);
      }

    } catch (err) {
      console.error('[Process Equipment] Upload error:', err);
      
      // Use soft-coded error handling
      const errorMessage = handleApiError(err, PROCESS_EQUIPMENT_UPLOAD_CONFIG);
      setError(errorMessage);
      
      // Log detailed error for debugging
      console.error('[Process Equipment] Detailed error:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
    } finally {
      setUploading(false);
      if (!error) {
        setUploadProgress(100);
      }
    }
  };

  const handleDownloadExcel = async () => {
    if (!uploadResult || !uploadResult.upload_id) {
      setError(messages.errors.noData);
      return;
    }

    try {
      console.log('[Process Equipment] Downloading Excel for upload_id:', uploadResult.upload_id);
      
      // Show downloading message
      const originalStage = analysisStage;
      setAnalysisStage(messages.info.processing);

      // Get endpoint with upload_id
      const endpoint = getApiEndpoint('downloadExcel', { 
        upload_id: uploadResult.upload_id 
      });

      // Make API call to download Excel
      const response = await apiClient.get(endpoint, {
        responseType: 'blob',
        timeout: PROCESS_EQUIPMENT_UPLOAD_CONFIG.processing.timeout,
      });

      // Create download link
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const drawingNumber = projectMetadata.drawingNumber || 'equipment';
      link.download = `${drawingNumber}_equipment_${timestamp}.xlsx`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      // Show success message
      setAnalysisStage(messages.success.downloadComplete);
      setTimeout(() => setAnalysisStage(originalStage), 3000);
      
      console.log('[Process Equipment] Excel download complete');
      
    } catch (err) {
      console.error('[Process Equipment] Download error:', err);
      const errorMessage = handleApiError(err, PROCESS_EQUIPMENT_UPLOAD_CONFIG);
      setError(errorMessage);
    }
  };

  const handleReset = () => {
    files.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setUploadResult(null);
    setError('');
    setWarning('');
    setUploadProgress(0);
    setAnalysisStage('');
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(page.backRoute)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            {page.backText}
          </button>
          
          <div className="flex items-center gap-4 mb-3">
            <div className={`p-3 bg-gradient-to-br ${theme.gradientFrom} ${theme.gradientTo} rounded-xl`}>
              <SparklesIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
              <p className="text-gray-600 mt-1">{page.subtitle}</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <SparklesIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">AI-Powered Intelligence</h3>
                <p className="text-sm text-blue-800">{messages.info.aiPowered}</p>
                <p className="text-xs text-blue-700 mt-2">{messages.info.multiFileSupport} • {messages.info.oneClick}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload Area */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DocumentArrowUpIcon className="h-6 w-6 text-emerald-600" />
                Upload P&ID Drawings
              </h2>

              {/* Drag & Drop Zone */}
              <div
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center transition-all
                  ${dragActive 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50/50'
                  }
                  ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={upload.acceptString}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <CloudArrowUpIcon className={`h-16 w-16 mx-auto mb-4 ${dragActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {upload.allowMultiple ? upload.dragDropTextMultiple : upload.dragDropText}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Supported formats: {upload.supportedFormats.join(', ')}
                </p>
                <p className="text-xs text-gray-500">
                  Max {upload.maxFileSize}MB per file • Up to {upload.maxFiles} files
                </p>

                <button
                  type="button"
                  className={`mt-4 px-6 py-2 bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo} text-white rounded-lg font-medium hover:shadow-lg transition-all`}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse Files
                </button>
              </div>

              {/* Selected Files List */}
              {files.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Selected Files ({files.length})
                  </h3>
                  <div className="space-y-2">
                    {files.map((fileObj, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <DocumentTextIcon className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {fileObj.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(fileObj.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          disabled={uploading}
                          className="ml-2 p-1 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                        >
                          <XMarkIcon className="h-5 w-5 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Project Information */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DocumentTextIcon className="h-6 w-6 text-emerald-600" />
                Project Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {projectFields.drawing_number.label} *
                  </label>
                  <input
                    type="text"
                    value={formData.drawing_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, drawing_number: e.target.value }))}
                    placeholder={projectFields.drawing_number.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={uploading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {projectFields.drawing_title.label}
                  </label>
                  <input
                    type="text"
                    value={formData.drawing_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, drawing_title: e.target.value }))}
                    placeholder={projectFields.drawing_title.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={uploading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {projectFields.revision.label}
                  </label>
                  <input
                    type="text"
                    value={formData.revision}
                    onChange={(e) => setFormData(prev => ({ ...prev, revision: e.target.value }))}
                    placeholder={projectFields.revision.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={uploading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {projectFields.project_name.label}
                  </label>
                  <input
                    type="text"
                    value={formData.project_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                    placeholder={projectFields.project_name.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={uploading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {projectFields.area.label}
                  </label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                    placeholder={projectFields.area.placeholder}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={uploading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {projectFields.discipline.label}
                  </label>
                  <select
                    value={formData.discipline}
                    onChange={(e) => setFormData(prev => ({ ...prev, discipline: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={uploading}
                  >
                    {projectFields.discipline.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Analysis Options & Equipment Types */}
          <div className="lg:col-span-1 space-y-6">
            {/* Analysis Options */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Cog6ToothIcon className="h-6 w-6 text-emerald-600" />
                Analysis Options
              </h2>

              <div className="space-y-3">
                {Object.entries(analysisOptions).map(([key, option]) => (
                  <label key={key} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedOptionsState[option.id]}
                      onChange={(e) => setSelectedOptionsState(prev => ({
                        ...prev,
                        [option.id]: e.target.checked
                      }))}
                      disabled={uploading}
                      className="mt-1 h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{option.icon}</span>
                        <p className="text-sm font-medium text-gray-900">{option.label}</p>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Equipment Types */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Equipment Types Detected</h2>
              <div className="space-y-2">
                {equipmentTypes.slice(0, 6).map((type) => {
                  const colors = getColorScheme(type.color);
                  return (
                    <div key={type.id} className={`p-3 ${colors.bg} rounded-lg border ${colors.border}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{type.icon}</span>
                        <div className="flex-1">
                          <p className={`text-sm font-semibold ${colors.text}`}>{type.name}</p>
                          <p className="text-xs text-gray-600">{type.code}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                + {equipmentTypes.length - 6} more types
              </p>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 mb-1">Error</h3>
                <p className="text-sm text-red-800 whitespace-pre-wrap">{error}</p>
                
                {/* Show retry option for network/timeout errors */}
                {(error.includes('network') || error.includes('timeout') || error.includes('server')) && (
                  <button
                    onClick={() => {
                      setError('');
                      if (uploadResult) {
                        handleDownloadExcel(); // Retry download if there was a result
                      } else if (files.length > 0) {
                        handleUpload(); // Retry upload
                      }
                    }}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    Retry
                  </button>
                )}
                
                {/* Show help text for validation errors */}
                {error.includes('required') && (
                  <p className="mt-2 text-xs text-red-600">
                    Please fill in all required fields before uploading.
                  </p>
                )}
                
                {/* Show help for file errors */}
                {(error.includes('file') || error.includes('format')) && (
                  <p className="mt-2 text-xs text-red-600">
                    Supported formats: {validation.supportedFormats.join(', ')}. 
                    Max size: {validation.maxFileSize / (1024 * 1024)}MB per file.
                  </p>
                )}
              </div>
              <button 
                onClick={() => setError('')} 
                className="text-red-600 hover:text-red-800 transition-colors"
                aria-label="Dismiss error"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Warning Display */}
        {warning && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-900 mb-1">Warning</h3>
                <p className="text-sm text-yellow-800 whitespace-pre-wrap">{warning}</p>
              </div>
              <button 
                onClick={() => setWarning('')} 
                className="text-yellow-600 hover:text-yellow-800 transition-colors"
                aria-label="Dismiss warning"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Processing...</h3>
            <div className="space-y-3">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo} transition-all duration-300`}
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 text-center">{analysisStage}</p>
              <p className="text-xs text-gray-500 text-center">{uploadProgress}%</p>
            </div>
          </div>
        )}

        {/* Results Display */}
        {uploadResult && !uploading && (
          <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-start gap-4 mb-6">
              <CheckCircleIcon className="h-8 w-8 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {messages.success.uploadComplete}
                </h2>
                <p className="text-gray-600">
                  {messages.success.filesProcessed.replace('{count}', uploadResult.files_processed)} • 
                  {messages.success.equipmentDetected.replace('{count}', uploadResult.equipment_detected)}
                </p>
              </div>
            </div>

            {/* Equipment Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Object.entries(uploadResult.equipment_summary).map(([key, count]) => {
                const type = getEquipmentTypeById(key);
                if (!type) return null;
                const colors = getColorScheme(type.color);
                return (
                  <div key={key} className={`p-4 ${colors.bg} rounded-lg border ${colors.border}`}>
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className={`text-2xl font-bold ${colors.text}`}>{count}</div>
                    <div className="text-xs text-gray-600">{type.name}</div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleDownloadExcel}
                className={`flex-1 px-6 py-3 bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo} text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2`}
              >
                <DocumentArrowUpIcon className="h-5 w-5" />
                Download Excel Datasheet
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Upload More
              </button>
            </div>
          </div>
        )}

        {/* Upload Button (when not uploading and no results) */}
        {!uploading && !uploadResult && files.length > 0 && (
          <div className="mt-6">
            <button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className={`
                w-full px-6 py-4 bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo} text-white rounded-xl font-bold text-lg
                hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-3
              `}
            >
              <SparklesIcon className="h-6 w-6" />
              {files.length === 1 ? upload.uploadButtonTextSingle : upload.uploadButtonTextMultiple.replace('{count}', files.length)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessEquipmentDatasheet;
