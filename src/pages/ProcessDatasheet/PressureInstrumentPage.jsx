/**
 * Pressure Instrument P&ID Upload Page
 * SOFT-CODED: Allows P&ID upload for pressure instrument identification and analysis
 * - Upload P&ID diagrams
 * - Automatic pressure instrument detection
 * - Instrument specification generation
 * - Tag identification and classification
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
  Activity,
  Settings,
  FileCheck
} from 'lucide-react';
import apiClient from '../../services/api.service';

const PressureInstrumentPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // SOFT-CODED: Instrument detection configuration
  const instrumentConfig = {
    detectionTypes: [
      { id: 'pressure_transmitter', label: 'Pressure Transmitters', prefix: 'PT', color: 'blue' },
      { id: 'pressure_indicator', label: 'Pressure Indicators', prefix: 'PI', color: 'green' },
      { id: 'pressure_switch', label: 'Pressure Switches', prefix: 'PS', color: 'yellow' },
      { id: 'pressure_controller', label: 'Pressure Controllers', prefix: 'PC', color: 'purple' },
      { id: 'pressure_gauge', label: 'Pressure Gauges', prefix: 'PG', color: 'cyan' },
      { id: 'differential_pressure', label: 'Differential Pressure', prefix: 'PDT/PDI', color: 'orange' }
    ],
    analysisOptions: {
      extractTags: true,
      identifyLocations: true,
      detectRanges: true,
      generateDatasheets: true
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
  
  const [formData, setFormData] = useState({
    drawing_number: 'AUTO',
    drawing_title: 'Pressure Instrument Analysis',
    revision: 'Rev 0',
    project_name: 'Project',
    area: 'Process Area',
    auto_analyze: true
  });

  const [selectedOptions, setSelectedOptions] = useState({
    extractTags: true,
    identifyLocations: true,
    detectRanges: true,
    generateDatasheets: false
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
    if (!instrumentConfig.supportedFormats.includes(fileExtension)) {
      setError(`Unsupported file format. Please upload: ${instrumentConfig.supportedFormats.join(', ')}`);
      return;
    }

    // Validate file size
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    if (fileSizeMB > instrumentConfig.maxFileSize) {
      setError(`File size exceeds ${instrumentConfig.maxFileSize}MB limit`);
      return;
    }

    setFile(selectedFile);
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

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  // Upload handler
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a P&ID file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');
    setAnalysisStage('Uploading P&ID...');

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    uploadFormData.append('drawing_number', formData.drawing_number);
    uploadFormData.append('drawing_title', formData.drawing_title || 'Pressure Instrument Analysis');
    uploadFormData.append('revision', formData.revision || 'A');
    uploadFormData.append('project_name', formData.project_name || 'Default Project');
    uploadFormData.append('area', formData.area || '');
    uploadFormData.append('extract_tags', selectedOptions.extractTags);
    uploadFormData.append('detect_ranges', selectedOptions.detectRanges);
    uploadFormData.append('generate_datasheets', selectedOptions.generateDatasheets);
    uploadFormData.append('download_excel', 'false'); // Get data first, download later

    try {
      console.log('[Pressure Instrument] Starting P&ID upload...');
      setAnalysisStage('Uploading and analyzing P&ID...');

      const response = await apiClient.post('/pid/pressure-instruments/analyze/', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
          
          if (percentCompleted < 100) {
            setAnalysisStage(`Uploading P&ID: ${percentCompleted}%`);
          } else {
            setAnalysisStage('AI is analyzing the P&ID and detecting pressure instruments...');
          }
        },
      });

      console.log('[Pressure Instrument] Upload successful:', response.data);
      setAnalysisStage('Analysis complete!');
      setUploadResult(response.data);
      setUploadProgress(100);

      // Automatically download Excel if instruments were detected
      if (response.data.instruments && response.data.instruments.length > 0) {
        setTimeout(() => {
          handleDownloadExcel(response.data.instruments, formData);
        }, 1000);
      }

      // Reset form after successful upload
      setTimeout(() => {
        if (!response.data.warning) {
          setFile(null);
        }
        setUploading(false);
      }, 3000);

    } catch (err) {
      console.error('[Pressure Instrument] Upload error:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        'Failed to upload P&ID. Please try again.'
      );
      setUploading(false);
      setAnalysisStage('');
      setUploadProgress(0);
    }
  };

  // Download Excel handler
  const handleDownloadExcel = async (instruments, drawingInfo) => {
    try {
      console.log('[Pressure Instrument] Downloading Excel...');
      
      const payload = {
        instruments: instruments || uploadResult?.instruments || [],
        drawing_info: {
          drawing_number: drawingInfo.drawing_number || formData.drawing_number,
          drawing_title: drawingInfo.drawing_title || formData.drawing_title,
          revision: drawingInfo.revision || formData.revision,
          project_name: drawingInfo.project_name || formData.project_name,
          area: drawingInfo.area || formData.area
        }
      };

      const response = await apiClient.post('/pid/pressure-instruments/download-excel/', payload, {
        responseType: 'blob',
        timeout: 60000
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Pressure Instrument Data Sheet.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log('[Pressure Instrument] Excel downloaded successfully');

    } catch (err) {
      console.error('[Pressure Instrument] Excel download error:', err);
      setError('Failed to download Excel file. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (option) => {
    setSelectedOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/engineering/process/datasheet')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Process Datasheets
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Pressure Instrument Datasheet Generator
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Upload P&ID → AI detects instruments → Download "Pressure Instrument Data Sheet.xlsx"
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Upload & Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload Area */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload P&ID
              </h2>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-all duration-200
                  ${dragActive 
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
                  }
                  ${file ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.dwg"
                  className="hidden"
                />

                {!file ? (
                  <>
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Drop P&ID file here or click to browse
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Supported formats: {instrumentConfig.supportedFormats.join(', ')} (max {instrumentConfig.maxFileSize}MB)
                    </p>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-12 h-12 mx-auto mb-4 text-green-600" />
                    <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </>
                )}
              </div>

              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}
            </div>

            {/* Quick Info Card - Replaces Drawing Form */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl shadow-lg p-6 border-2 border-purple-200 dark:border-purple-700">
              <h2 className="text-xl font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                Auto-Analysis Enabled
              </h2>
              <p className="text-purple-800 dark:text-purple-200 text-sm leading-relaxed">
                Upload your P&ID and our AI will automatically detect all pressure instruments. 
                The results will be downloaded as <strong>"Pressure Instrument Data Sheet.xlsx"</strong> with all instrument details extracted.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-purple-700 dark:text-purple-300">One-click analysis • No manual data entry required</span>
              </div>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`
                w-full py-4 px-6 rounded-xl font-semibold text-white
                transition-all duration-200 flex items-center justify-center gap-3
                ${uploading 
                  ? 'bg-purple-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {uploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  {analysisStage || 'Processing...'}
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Analyze P&ID for Pressure Instruments
                </>
              )}
            </button>

            {/* Upload Progress */}
            {uploading && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Upload Progress</span>
                  <span className="font-semibold text-purple-600">{uploadProgress}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Success Result */}
            {uploadResult && !uploading && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-green-500">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      P&ID Analysis Complete!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {uploadResult.message || 'Pressure instruments detected and analyzed successfully'}
                    </p>
                    {uploadResult.instruments_detected !== undefined && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-3">
                          ✅ Detected {uploadResult.instruments_detected} pressure instrument(s)
                        </p>
                        
                        {/* Instrument Summary */}
                        {uploadResult.instruments && uploadResult.instruments.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-green-700 dark:text-green-300">
                              Instrument Details:
                            </p>
                            <div className="max-h-60 overflow-y-auto space-y-2">
                              {uploadResult.instruments.map((inst, idx) => (
                                <div key={idx} className="text-xs bg-white dark:bg-gray-800 p-3 rounded border border-green-200 dark:border-green-800">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono font-bold bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-green-800 dark:text-green-200">
                                      {inst.tag_number}
                                    </span>
                                    {inst.pid_no && inst.pid_no !== 'N/A' && (
                                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                                        P&ID: {inst.pid_no}
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-0.5 text-gray-600 dark:text-gray-400">
                                    {inst.service && inst.service !== 'N/A' && (
                                      <div>Service: {inst.service}</div>
                                    )}
                                    {inst.line_no && inst.line_no !== 'N/A' && (
                                      <div>Line: {inst.line_no}</div>
                                    )}
                                    {(inst.operating_pressure_norm && inst.operating_pressure_norm !== 'N/A') && (
                                      <div>Operating Pressure: {inst.operating_pressure_norm} bar</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Download Button */}
                    {uploadResult.instruments && uploadResult.instruments.length > 0 && (
                      <button
                        onClick={() => handleDownloadExcel(uploadResult.instruments, formData)}
                        className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700
                                 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200
                                 flex items-center justify-center gap-2"
                      >
                        <FileText className="w-5 h-5" />
                        Download Excel Datasheet
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Detection Options & Info */}
          <div className="space-y-6">
            {/* Detection Options */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Analysis Options
              </h2>

              <div className="space-y-3">
                {Object.entries(instrumentConfig.analysisOptions).map(([key, defaultValue]) => (
                  <label key={key} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedOptions[key]}
                      onChange={() => handleOptionChange(key)}
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-purple-600 
                               focus:ring-2 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white block 
                                     group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Instrument Types */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Detectable Instruments
              </h2>

              <div className="space-y-3">
                {instrumentConfig.detectionTypes.map((type) => (
                  <div key={type.id} className="flex items-center gap-3 p-2 rounded-lg 
                                               hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className={`w-2 h-2 rounded-full bg-${type.color}-500`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {type.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Tag prefix: {type.prefix}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="font-semibold mb-2">💡 AI-Powered Detection</h3>
              <p className="text-sm text-purple-100">
                Our system automatically identifies pressure instruments, extracts tag numbers, 
                determines instrument types, and can generate preliminary datasheets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PressureInstrumentPage;
