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
  Download,
  Thermometer,
  Database
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
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [hmbFile, setHmbFile] = useState(null);
  const [hmbDragActive, setHmbDragActive] = useState(false);
  const [hmbUploadResult, setHmbUploadResult] = useState(null);
  const [showHmbUpload, setShowHmbUpload] = useState(false);
  const hmbFileInputRef = useRef(null);

  const [hmbFile, setHmbFile] = useState(null);
  const [hmbDragActive, setHmbDragActive] = useState(false);
  const [hmbUploadResult, setHmbUploadResult] = useState(null);
  const [showHmbUpload, setShowHmbUpload] = useState(false);
  const hmbFileInputRef = useRef(null);


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
      if (file) {
        URL.revokeObjectURL(URL.createObjectURL(file));
      }
    };
  }, [file]);

  // File handling
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    // Validate file type
    const fileExtension = selectedFile.name.split('.').pop().toUpperCase();
    if (!sdvStreamConfig.supportedFormats.includes(fileExtension)) {
      setError(`Unsupported file format. Please upload: ${sdvStreamConfig.supportedFormats.join(', ')}`);
      return;
    }

    // Validate file size
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > sdvStreamConfig.maxFileSize) {
      setError(`File size exceeds ${sdvStreamConfig.maxFileSize}MB limit`);
      return;
    }

    setFile(selectedFile);
    setError('');
    setUploadResult(null);
  };

  // Drag and drop handlers
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
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionToggle = (option) => {
    setSelectedOptions(prev => ({ ...prev, [option]: !prev[option] }));
  };


  // HMB File handling
  const handleHmbFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetHmbFile(selectedFile);
    }
  };

  const validateAndSetHmbFile = (selectedFile) => {
    const fileExtension = selectedFile.name.split('.').pop().toUpperCase();
    const hmbFormats = ['PDF', 'XLSX', 'XLS', 'CSV'];
    
    if (!hmbFormats.includes(fileExtension)) {
      setError(`Unsupported HMB format. Please upload: ${hmbFormats.join(', ')}`);
      return;
    }

    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > 50) {
      setError('HMB file size exceeds 50MB limit');
      return;
    }

    setHmbFile(selectedFile);
    setError('');
  };

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

  const handleHmbUpload = async () => {
    if (!hmbFile) {
      setError('Please select an HMB file');
      return;
    }

    if (!uploadResult?.jobId) {
      setError('Please upload P&ID first');
      return;
    }

    setUploading(true);
    setError('');
    setAnalysisStage('Processing HMB data...');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('hmb_file', hmbFile);
      formDataToSend.append('job_id', uploadResult.jobId);
      formDataToSend.append('equipment_type', 'sdv_streams');

      const response = await apiClient.post(
        '/process-datasheet/datasheets/enrich-with-hmb/',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      setAnalysisStage('HMB enrichment complete!');

      if (response.data.success) {
        setHmbUploadResult({
          success: true,
          enrichedStreams: response.data.enriched_streams || 0,
          extractedData: response.data.extracted_data || {},
          message: response.data.message
        });
        
        setUploadResult(prev => ({
          ...prev,
          hmbEnriched: true,
          enrichedStreams: response.data.enriched_streams
        }));
      } else {
        throw new Error(response.data.error || 'HMB enrichment failed');
      }

    } catch (err) {
      console.error('HMB upload error:', err);
      setError(err.response?.data?.error || err.message || 'HMB upload failed');
      setHmbUploadResult({ success: false });
    } finally {
      setUploading(false);
      setAnalysisStage('');
    }
  };

  // Upload and analyze P&ID
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a P&ID file');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);
    setAnalysisStage('Uploading P&ID...');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('pid_file', file);
      formDataToSend.append('drawing_number', formData.drawing_number);
      formDataToSend.append('drawing_title', formData.drawing_title);
      formDataToSend.append('revision', formData.revision);
      formDataToSend.append('project_name', formData.project_name);
      formDataToSend.append('area', formData.area);
      formDataToSend.append('system', formData.system);
      formDataToSend.append('auto_analyze', selectedOptions.generateDatasheets);
      formDataToSend.append('analysis_options', JSON.stringify(selectedOptions));
      formDataToSend.append('equipment_type', 'sdv_streams');

      setUploadProgress(30);
      setAnalysisStage('Analyzing SDV streams...');

      // Call SDV streams analysis endpoint
      const response = await apiClient.post(
        '/process-datasheet/datasheets/extract/',
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(Math.min(percentCompleted, 90));
          },
        }
      );

      setUploadProgress(100);
      setAnalysisStage('Analysis complete!');

      // Handle response
      if (response.data.success) {
        setUploadResult({
          success: true,
          jobId: response.data.job_id,
          status: response.data.status,
          message: response.data.message,
          detectedValves: response.data.detected_valves || [],
          streamCount: response.data.stream_count || 0,
          datasheetGenerated: response.data.datasheet_generated || false
        });
        
        // Show HMB upload option after successful P&ID analysis
        setShowHmbUpload(true);
      } else {
        throw new Error(response.data.error || 'Analysis failed');
      }

    } catch (err) {
      console.error('SDV streams upload error:', err);
      setError(err.response?.data?.error || err.message || 'Upload failed. Please try again.');
      setUploadResult({ success: false });
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const handleReset = () => {
    setFile(null);
    setHmbFile(null);
    setUploadResult(null);
    setHmbUploadResult(null);
    setError('');
    setUploadProgress(0);
    setAnalysisStage('');
    setShowHmbUpload(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (hmbFileInputRef.current) {
      hmbFileInputRef.current.value = '';
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

            {/* File Upload Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
                dragActive
                  ? 'border-red-500 bg-red-50'
                  : file
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 bg-gray-50 hover:border-red-400 hover:bg-red-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.dwg"
                className="hidden"
                id="file-upload"
              />

              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  file ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {file ? (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  ) : (
                    <Upload className="w-8 h-8 text-red-600" />
                  )}
                </div>

                <div className="text-center">
                  {file ? (
                    <>
                      <p className="text-lg font-semibold text-green-900 mb-1">
                        {file.name}
                      </p>
                      <p className="text-sm text-green-700">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleReset();
                        }}
                        className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Choose Different File
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-semibold text-gray-900 mb-1">
                        Drop your P&ID here or click to browse
                      </p>
                      <p className="text-sm text-gray-600">
                        Supports: {sdvStreamConfig.supportedFormats.join(', ')} (Max {sdvStreamConfig.maxFileSize}MB)
                      </p>
                    </>
                  )}
                </div>
              </label>
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

            {/* Success Result */}
            {uploadResult?.success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 mb-2">Analysis Complete!</p>
                    <div className="space-y-2 text-sm text-green-800">
                      <p><strong>Job ID:</strong> {uploadResult.jobId}</p>
                      {uploadResult.streamCount > 0 && (
                        <p><strong>Detected Streams:</strong> {uploadResult.streamCount}</p>
                      )}
                      {uploadResult.detectedValves?.length > 0 && (
                        <p><strong>Detected SDVs:</strong> {uploadResult.detectedValves.length}</p>
                      )}
                      {uploadResult.datasheetGenerated && (
                        <div className="mt-3 flex gap-2">
                          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <Download className="w-4 h-4" />
                            Download Datasheet
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  !file || uploading
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

              {(file || uploadResult) && !uploading && (
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

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
