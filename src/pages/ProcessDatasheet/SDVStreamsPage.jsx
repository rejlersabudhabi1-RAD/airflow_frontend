/**
 * SDV Streams P&ID Upload Page
 * SOFT-CODED: Allows P&ID upload for Safety Device Valve (SDV) streams identification and analysis
 * - Upload P&ID diagrams
 * - Automatic SDV detection and classification
 * - Stream/line identification
 * - Safety valve specification generation
 * - Datasheet population for SDV streams
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
  ArrowLeft,
  Shield,
  Workflow,
  FileCheck,
  Download
} from 'lucide-react';
import apiClient from '../../services/api.service';

const SDVStreamsPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // SOFT-CODED: SDV Stream detection configuration
  const sdvStreamConfig = {
    detectionTypes: [
      { id: 'sdv_emergency_shutdown', label: 'Emergency Shutdown Valves (SDV)', prefix: 'SDV', color: 'red' },
      { id: 'sdv_process_isolation', label: 'Process Isolation Valves', prefix: 'XV', color: 'orange' },
      { id: 'sdv_blowdown', label: 'Blowdown Valves (BDV)', prefix: 'BDV', color: 'yellow' },
      { id: 'sdv_depressurization', label: 'Depressurization Valves', prefix: 'PDV', color: 'blue' },
      { id: 'sdv_fire_protection', label: 'Fire Protection Valves', prefix: 'FPV', color: 'purple' },
      { id: 'sdv_safety_critical', label: 'Safety Critical Valves', prefix: 'SCV', color: 'cyan' }
    ],
    streamTypes: [
      { id: 'process_main', label: 'Main Process Stream' },
      { id: 'utility', label: 'Utility Stream' },
      { id: 'blowdown', label: 'Blowdown System' },
      { id: 'emergency', label: 'Emergency System' },
      { id: 'fire_protection', label: 'Fire Protection' }
    ],
    analysisOptions: {
      extractTags: true,
      identifyLines: true,
      detectValveSpecs: true,
      generateDatasheets: true,
      safetyClassification: true,
      closureTime: true,
      failPosition: true
    },
    supportedFormats: ['PDF', 'PNG', 'JPG', 'JPEG', 'DWG'],
    maxFileSize: 50 // MB
  };

  // State management
  const [pidFile, setPidFile] = useState(null);
  const [hmbFile, setHmbFile] = useState(null);
  const [pidDragActive, setPidDragActive] = useState(false);
  const [hmbDragActive, setHmbDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [htmlPreview, setHtmlPreview] = useState('');
  const [excelData, setExcelData] = useState(null);

  const [formData, setFormData] = useState({
    drawing_number: 'AUTO',
    drawing_title: 'SDV Streams Analysis',
    revision: 'Rev 0',
    project_name: 'Project',
    area: 'Process Area',
    system: 'Shutdown System',
    auto_analyze: true
  });

  const [selectedOptions, setSelectedOptions] = useState({
    extractTags: true,
    identifyLines: true,
    detectValveSpecs: true,
    generateDatasheets: true,
    safetyClassification: true,
    closureTime: true,
    failPosition: true
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pidFile) {
        URL.revokeObjectURL(URL.createObjectURL(pidFile));
      }
      if (hmbFile) {
        URL.revokeObjectURL(URL.createObjectURL(hmbFile));
      }
    };
  }, [pidFile, hmbFile]);

  // File handling for P&ID
  const handlePidFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetPidFile(selectedFile);
    }
  };

  const validateAndSetPidFile = (selectedFile) => {
    const fileExtension = selectedFile.name.split('.').pop().toUpperCase();
    if (!['PDF'].includes(fileExtension)) {
      setError('P&ID must be PDF format');
      return;
    }
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > 50) {
      setError('P&ID file exceeds 50MB limit');
      return;
    }
    setPidFile(selectedFile);
    setError('');
    setUploadResult(null);
  };

  // File handling for HMB
  const handleHmbFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetHmbFile(selectedFile);
    }
  };

  const validateAndSetHmbFile = (selectedFile) => {
    const fileExtension = selectedFile.name.split('.').pop().toUpperCase();
    if (!['PDF'].includes(fileExtension)) {
      setError('HMB must be PDF format');
      return;
    }
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > 50) {
      setError('HMB file exceeds 50MB limit');
      return;
    }
    setHmbFile(selectedFile);
    setError('');
  };

  // Drag and drop handlers for P&ID
  const handlePidDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setPidDragActive(true);
    } else if (e.type === "dragleave") {
      setPidDragActive(false);
    }
  };

  const handlePidDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setPidDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetPidFile(e.dataTransfer.files[0]);
    }
  };

  // Drag and drop handlers for HMB
  const handleHmbDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setHmbDragActive(true);
    } else if (e.type === "dragleave") {
      setHmbDragActive(false);
    }
  };

  const handleHmbDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHmbDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetHmbFile(e.dataTransfer.files[0]);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionToggle = (option) => {
    setSelectedOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };

  // Upload and analyze P&ID + HMB
  const handleUpload = async () => {
    if (!pidFile) {
      setError('Please select a P&ID file');
      return;
    }

    if (!hmbFile) {
      setError('Please select an HMB file');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);
    setHtmlPreview('');
    setExcelData(null);
    setAnalysisStage('Uploading files...');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('pid_file', pidFile);
      formDataToSend.append('hmb_file', hmbFile);
      formDataToSend.append('equipment_type', 'sdv_streams');

      setUploadProgress(10);
      setAnalysisStage('Uploading files...');

      // Call SDV streams analysis endpoint (now async)
      const response = await apiClient.post(
        '/process-datasheet/datasheets/extract-sdv-streams/',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json',
          },
          responseType: 'json',
        }
      );

      const responseData = response.data;

      // Check if async processing (has job_id)
      if (responseData.job_id) {
        // Start polling for results
        pollJobStatus(responseData.job_id);
      } else if (responseData.success) {
        // Immediate response (fallback/mock mode)
        setHtmlPreview(responseData.html_preview);
        setExcelData({
          base64: responseData.excel_file,
          filename: responseData.filename
        });
        setUploadResult({ success: true });
        setUploadProgress(100);
        setAnalysisStage('Complete!');
        setUploading(false);
      } else {
        throw new Error(responseData.error || 'Analysis failed');
      }

    } catch (err) {
      console.error('SDV streams upload error:', err);
      setError(err.response?.data?.error || err.message || 'Upload failed. Please try again.');
      setUploadResult({ success: false });
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  // Poll job status for async processing
  const pollJobStatus = async (jobId) => {
    const maxAttempts = 120; // 120 attempts * 3 seconds = 6 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        
        const statusResponse = await apiClient.get(
          `/process-datasheet/sdv-job-status/${jobId}/`
        );

        const { status, progress, stage, result, error: jobError } = statusResponse.data;

        // Update UI
        setUploadProgress(progress || 0);
        setAnalysisStage(stage || 'Processing...');

        if (status === 'completed' && result) {
          // Success - display results
          if (result.success) {
            setHtmlPreview(result.html_preview);
            setExcelData({
              base64: result.excel_file,
              filename: result.filename
            });
            setUploadResult({ success: true });
            setUploadProgress(100);
            setAnalysisStage('Complete!');
          } else {
            throw new Error(result.error || 'Processing failed');
          }
          setUploading(false);
        } else if (status === 'failed') {
          throw new Error(jobError || 'Processing failed');
        } else if (status === 'processing') {
          // Continue polling
          if (attempts < maxAttempts) {
            setTimeout(poll, 3000); // Poll every 3 seconds
          } else {
            throw new Error('Processing timeout - please try again');
          }
        }

      } catch (err) {
        console.error('Job status polling error:', err);
        setError(err.message || 'Failed to retrieve results');
        setUploadResult({ success: false });
        setUploading(false);
        setTimeout(() => setUploadProgress(0), 2000);
      }
    };

    // Start polling
    poll();
  };

  const handleDownloadExcel = () => {
    if (!excelData) return;

    try {
      // Decode base64 to binary
      const binaryString = window.atob(excelData.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create blob and download
      const blob = new Blob([bytes], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = excelData.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download Excel file');
    }
  };

  const handleReset = () => {
    setPidFile(null);
    setHmbFile(null);
    setUploadResult(null);
    setHtmlPreview('');
    setExcelData(null);
    setError('');
    setUploadProgress(0);
    setAnalysisStage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>

          <div className="text-sm text-gray-500">
            <Shield className="w-4 h-4 inline mr-1" />
            Safety Critical Systems
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Title Section */}
          <div className="bg-gradient-to-r from-red-600 to-orange-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8" />
              <h1 className="text-2xl sm:text-3xl font-bold">SDV Streams Datasheet</h1>
            </div>
            <p className="text-red-100 text-sm sm:text-base">
              Upload P&ID diagrams to automatically detect and classify Safety Device Valves (SDV) and generate comprehensive stream datasheets
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-red-900">Safety Valves</h3>
                </div>
                <p className="text-sm text-red-700">Automatic detection of SDV, BDV, and emergency shutdown valves</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Workflow className="w-5 h-5 text-orange-600" />
                  <h3 className="font-semibold text-orange-900">Stream Analysis</h3>
                </div>
                <p className="text-sm text-orange-700">Identify process streams, utility lines, and safety systems</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">Auto Datasheet</h3>
                </div>
                <p className="text-sm text-blue-700">Generate complete datasheets with specifications and ratings</p>
              </div>
            </div>

            {/* Project Information Form */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600" />
                Project Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drawing Number
                  </label>
                  <input
                    type="text"
                    value={formData.drawing_number}
                    onChange={(e) => handleFormChange('drawing_number', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="AUTO-GENERATED"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Revision
                  </label>
                  <input
                    type="text"
                    value={formData.revision}
                    onChange={(e) => handleFormChange('revision', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Rev 0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    System
                  </label>
                  <input
                    type="text"
                    value={formData.system}
                    onChange={(e) => handleFormChange('system', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Shutdown System"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={formData.project_name}
                    onChange={(e) => handleFormChange('project_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Project Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area
                  </label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => handleFormChange('area', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Process Area"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Drawing Title
                  </label>
                  <input
                    type="text"
                    value={formData.drawing_title}
                    onChange={(e) => handleFormChange('drawing_title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="SDV Streams Analysis"
                  />
                </div>
              </div>
            </div>

            {/* Analysis Options */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Analysis Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(sdvStreamConfig.analysisOptions).map(([key, defaultValue]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOptions[key]}
                      onChange={() => handleOptionToggle(key)}
                      className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* P&ID File Upload */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">P&ID Upload (Required)</h3>
              <div
                onDragEnter={handlePidDrag}
                onDragLeave={handlePidDrag}
                onDragOver={handlePidDrag}
                onDrop={handlePidDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
                  pidDragActive
                    ? 'border-red-500 bg-red-50'
                    : pidFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-gray-50 hover:border-red-400 hover:bg-red-50'
                }`}
              >
                <input
                  type="file"
                  onChange={handlePidFileChange}
                  accept=".pdf"
                  className="hidden"
                  id="pid-file-upload"
                />

                <label
                  htmlFor="pid-file-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    pidFile ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {pidFile ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Upload className="w-6 h-6 text-red-600" />
                    )}
                  </div>

                  <div className="text-center">
                    {pidFile ? (
                      <>
                        <p className="text-sm font-semibold text-green-900 mb-1">
                          {pidFile.name}
                        </p>
                        <p className="text-xs text-green-700">
                          {(pidFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setPidFile(null);
                          }}
                          className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove File
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          Drop P&ID PDF here or click to browse
                        </p>
                        <p className="text-xs text-gray-600">
                          PDF only, Max 50MB
                        </p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* HMB File Upload */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">HMB Upload (Required)</h3>
              <div
                onDragEnter={handleHmbDrag}
                onDragLeave={handleHmbDrag}
                onDragOver={handleHmbDrag}
                onDrop={handleHmbDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
                  hmbDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : hmbFile
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <input
                  type="file"
                  onChange={handleHmbFileChange}
                  accept=".pdf"
                  className="hidden"
                  id="hmb-file-upload"
                />

                <label
                  htmlFor="hmb-file-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                    hmbFile ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {hmbFile ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Upload className="w-6 h-6 text-blue-600" />
                    )}
                  </div>

                  <div className="text-center">
                    {hmbFile ? (
                      <>
                        <p className="text-sm font-semibold text-green-900 mb-1">
                          {hmbFile.name}
                        </p>
                        <p className="text-xs text-green-700">
                          {(hmbFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setHmbFile(null);
                          }}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Remove File
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          Drop HMB PDF here or click to browse
                        </p>
                        <p className="text-xs text-gray-600">
                          PDF only, Max 50MB
                        </p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Upload Error</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                  <span className="text-sm font-medium text-blue-900">{analysisStage}</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons - Analyze Button */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleUpload}
                disabled={!pidFile || !hmbFile || uploading}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  !pidFile || !hmbFile || uploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {uploading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Analyze SDV Streams
                  </>
                )}
              </button>

              {(pidFile || hmbFile || uploadResult) && !uploading && (
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {/* HTML Preview - Shown After Processing */}
            {htmlPreview && (
              <div className="bg-white border-2 border-green-500 rounded-lg p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    Datasheet Preview
                  </h3>
                  {excelData && (
                    <button
                      onClick={handleDownloadExcel}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                    >
                      <Download className="w-5 h-5" />
                      Download Excel
                    </button>
                  )}
                </div>
                <div 
                  className="overflow-x-auto border border-gray-200 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: htmlPreview }}
                />
              </div>
            )}

            {/* Detected Valve Types Info */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Detectable Valve Types</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {sdvStreamConfig.detectionTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`px-3 py-2 rounded-lg border bg-${type.color}-50 border-${type.color}-200`}
                  >
                    <span className={`text-sm font-medium text-${type.color}-900`}>
                      {type.prefix}: {type.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Helper Information */}
        <div className="mt-6 bg-white rounded-lg p-6 shadow-md">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-600" />
            What This Tool Does
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">•</span>
              <span>Automatically detects and classifies all Safety Device Valves (SDV, BDV, PDV) in P&ID</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">•</span>
              <span>Identifies process streams, utility lines, and emergency systems</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">•</span>
              <span>Extracts valve specifications: fail position, closure time, actuator type</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">•</span>
              <span>Generates comprehensive datasheets with safety classifications</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-600 font-bold">•</span>
              <span>Links valves to safety instrumented systems (SIS) and PLC logic</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SDVStreamsPage;
