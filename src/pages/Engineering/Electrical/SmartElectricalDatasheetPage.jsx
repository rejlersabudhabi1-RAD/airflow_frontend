import React, { useState } from 'react';
import {
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import apiClient, { API_TIMEOUT_UPLOAD } from '../../../utils/apiClient';

// Equipment type configurations
const EQUIPMENT_TYPES = [
  {
    id: 'transformer',
    name: 'Transformers',
    description: 'Power & Distribution Transformers',
    icon: '⚡',
    color: 'blue',
    requiredFiles: ['SLD/Calculation Document', 'Technical Specification'],
    optionalFiles: ['Additional Documents']
  },
  {
    id: 'dg_set',
    name: 'DG Set',
    description: 'Diesel Generator Sets',
    icon: '🔌',
    color: 'green',
    requiredFiles: ['SLD/Load List', 'Calculation Document'],
    optionalFiles: ['Site Layout', 'Technical Specs']
  },
  {
    id: 'mv_switchgear',
    name: 'MV Switchgear',
    description: 'Medium Voltage Switchgear (11kV, 33kV)',
    icon: '⚙️',
    color: 'purple',
    requiredFiles: ['SLD Drawing', 'Equipment Schedule'],
    optionalFiles: ['Protection Setting', 'Technical Specs']
  },
  {
    id: 'lv_switchgear',
    name: 'LV Switchgear',
    description: 'Low Voltage Switchgear & Panels',
    icon: '🔧',
    color: 'yellow',
    requiredFiles: ['SLD Drawing', 'Load Schedule'],
    optionalFiles: ['Panel Layout', 'Cable Schedule']
  },
  {
    id: 'ac_ups',
    name: 'AC UPS',
    description: 'AC Uninterruptible Power Supply',
    icon: '🔋',
    color: 'red',
    requiredFiles: ['Load Calculation', 'System Diagram'],
    optionalFiles: ['Battery Sizing', 'Technical Specs']
  },
  {
    id: 'dc_ups',
    name: 'DC UPS',
    description: 'DC Uninterruptible Power Supply',
    icon: '⚡',
    color: 'indigo',
    requiredFiles: ['DC Load List', 'Battery Sizing'],
    optionalFiles: ['System Diagram', 'Technical Specs']
  }
];

const SmartElectricalDatasheetPage = () => {
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [excelBlob, setExcelBlob] = useState(null);

  const handleFileUpload = (fileType, file) => {
    setUploadedFiles(prev => ({
      ...prev,
      [fileType]: file
    }));
    setError('');
  };

  const removeFile = (fileType) => {
    const newFiles = { ...uploadedFiles };
    delete newFiles[fileType];
    setUploadedFiles(newFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleGenerate = async () => {
    if (!selectedEquipment) {
      setError('Please select an equipment type');
      return;
    }

    const equipment = EQUIPMENT_TYPES.find(e => e.id === selectedEquipment);
    const requiredCount = equipment.requiredFiles.length;
    const uploadedCount = Object.keys(uploadedFiles).length;

    if (uploadedCount < requiredCount) {
      setError(`Please upload at least ${requiredCount} required file(s)`);
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);
    setAnalysisStage('Uploading files...');
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('equipment_type', selectedEquipment);
      
      // Append all uploaded files
      Object.entries(uploadedFiles).forEach(([fileType, file]) => {
        formData.append('files', file);
        formData.append(`file_type_${file.name}`, fileType);
      });

      const response = await apiClient.post(
        '/electrical-datasheet/datasheets/generate-smart/',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: API_TIMEOUT_UPLOAD,
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
            if (progress === 100) {
              setAnalysisStage('Processing files with AI...');
            }
          }
        }
      );

      setAnalysisStage('Generating datasheet...');
      
      if (response.data.success) {
        setResults(response.data);
        setAnalysisStage('✓ Datasheet generated successfully!');
        
        // If Excel file is returned, prepare for download
        if (response.data.excel_url) {
          // Fetch the Excel file
          const excelResponse = await apiClient.get(response.data.excel_url, {
            responseType: 'blob'
          });
          setExcelBlob(excelResponse.data);
        }
      } else {
        setError(response.data.error || 'Failed to generate datasheet');
        setAnalysisStage('');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to generate datasheet');
      setAnalysisStage('');
    } finally {
      setUploading(false);
    }
  };

  const downloadExcel = () => {
    if (excelBlob) {
      const url = window.URL.createObjectURL(excelBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedEquipment}_datasheet_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  };

  const resetForm = () => {
    setSelectedEquipment(null);
    setUploadedFiles({});
    setUploading(false);
    setUploadProgress(0);
    setAnalysisStage('');
    setResults(null);
    setError('');
    setExcelBlob(null);
  };

  const selectedEquipmentData = EQUIPMENT_TYPES.find(e => e.id === selectedEquipment);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-3">
              <DocumentTextIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Electrical Equipment Datasheet Generator
              </h1>
              <p className="text-gray-600 mt-1">
                AI-powered datasheet generation for electrical equipment
              </p>
            </div>
          </div>

          {/* Equipment Type Selection */}
          {!selectedEquipment && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Select Equipment Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {EQUIPMENT_TYPES.map((equipment) => (
                  <button
                    key={equipment.id}
                    onClick={() => setSelectedEquipment(equipment.id)}
                    className={`group relative bg-gradient-to-br from-${equipment.color}-50 to-${equipment.color}-100 
                      border-2 border-${equipment.color}-200 rounded-xl p-6 text-left
                      hover:shadow-xl hover:scale-105 transition-all duration-200
                      hover:border-${equipment.color}-400`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{equipment.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-1">
                          {equipment.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {equipment.description}
                        </p>
                        <div className="text-xs text-gray-500">
                          <div className="font-medium">Required Files:</div>
                          <ul className="ml-4 mt-1 space-y-0.5">
                            {equipment.requiredFiles.map((file, idx) => (
                              <li key={idx}>• {file}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-sm font-semibold text-blue-600">
                        Select →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* File Upload Section */}
          {selectedEquipment && !results && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <span className="text-3xl">{selectedEquipmentData.icon}</span>
                    {selectedEquipmentData.name}
                  </h2>
                  <p className="text-gray-600 mt-1">{selectedEquipmentData.description}</p>
                </div>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ← Change Equipment
                </button>
              </div>

              {/* Required Files */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <DocumentArrowUpIcon className="h-5 w-5" />
                  Required Documents
                </h3>
                <div className="space-y-3">
                  {selectedEquipmentData.requiredFiles.map((fileType, idx) => (
                    <div key={idx}>
                      {uploadedFiles[fileType] ? (
                        <div className="bg-white border border-blue-200 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {uploadedFiles[fileType].name}
                              </div>
                              <div className="text-xs text-gray-600">
                                {formatFileSize(uploadedFiles[fileType].size)}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFile(fileType)}
                            className="p-1 hover:bg-red-100 rounded-full transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5 text-red-600" />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            id={`file-${idx}`}
                            accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(fileType, e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor={`file-${idx}`}
                            className="flex items-center gap-3 p-4 border-2 border-dashed border-blue-300 
                              rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                          >
                            <DocumentArrowUpIcon className="h-6 w-6 text-blue-600" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {fileType}
                              </div>
                              <div className="text-xs text-gray-600">
                                Click to upload PDF, Excel, or Image
                              </div>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional Files */}
              {selectedEquipmentData.optionalFiles.length > 0 && (
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5" />
                    Optional Documents
                  </h3>
                  <div className="space-y-3">
                    {selectedEquipmentData.optionalFiles.map((fileType, idx) => (
                      <div key={idx}>
                        {uploadedFiles[fileType] ? (
                          <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CheckCircleIcon className="h-5 w-5 text-green-600" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {uploadedFiles[fileType].name}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {formatFileSize(uploadedFiles[fileType].size)}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => removeFile(fileType)}
                              className="p-1 hover:bg-red-100 rounded-full transition-colors"
                            >
                              <XMarkIcon className="h-5 w-5 text-red-600" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <input
                              type="file"
                              id={`optional-${idx}`}
                              accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleFileUpload(fileType, e.target.files[0]);
                                }
                              }}
                              className="hidden"
                            />
                            <label
                              htmlFor={`optional-${idx}`}
                              className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 
                                rounded-lg hover:border-gray-500 hover:bg-gray-100 cursor-pointer transition-colors"
                            >
                              <DocumentTextIcon className="h-6 w-6 text-gray-600" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {fileType}
                                </div>
                                <div className="text-xs text-gray-600">
                                  Optional - Click to upload
                                </div>
                              </div>
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                  <XCircleIcon className="h-6 w-6 text-red-600 flex-shrink-0" />
                  <div className="text-sm text-red-800">{error}</div>
                </div>
              )}

              {/* Upload Progress */}
              {uploading && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <ArrowPathIcon className="h-6 w-6 text-blue-600 animate-spin" />
                    <span className="font-semibold text-blue-900">{analysisStage}</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="text-right text-sm text-blue-800 mt-2">{uploadProgress}%</div>
                </div>
              )}

              {/* Generate Button */}
              <div className="flex gap-4">
                <button
                  onClick={handleGenerate}
                  disabled={uploading || Object.keys(uploadedFiles).length < selectedEquipmentData.requiredFiles.length}
                  className={`flex-1 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 ${
                    uploading || Object.keys(uploadedFiles).length < selectedEquipmentData.requiredFiles.length
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl'
                  }`}
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <ArrowPathIcon className="h-5 w-5 animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <DocumentTextIcon className="h-5 w-5" />
                      Generate Datasheet
                    </span>
                  )}
                </button>
                <button
                  onClick={resetForm}
                  disabled={uploading}
                  className="px-6 py-4 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 
                    hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Results Section */}
          {results && (
            <div className="mt-8">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-4">
                  <CheckCircleIcon className="h-8 w-8 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 text-xl mb-2">
                      Datasheet Generated Successfully!
                    </h3>
                    <p className="text-green-800 mb-4">
                      Your {selectedEquipmentData.name} datasheet has been generated and is ready for download.
                    </p>
                    {excelBlob && (
                      <button
                        onClick={downloadExcel}
                        className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg 
                          font-semibold hover:bg-green-700 transition-colors"
                      >
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        Download Excel Datasheet
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary Statistics */}
              {results.summary && (
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-gray-900 text-lg mb-4">Generation Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Files Processed</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {results.summary.files_processed || 0}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Fields Extracted</div>
                      <div className="text-2xl font-bold text-green-600">
                        {results.summary.fields_extracted || 0}
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Confidence</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {results.summary.confidence || 'High'}
                      </div>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">Processing Time</div>
                      <div className="text-2xl font-bold text-indigo-600">
                        {results.summary.processing_time || '< 1min'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* New Generation Button */}
              <div className="flex gap-4">
                <button
                  onClick={resetForm}
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white 
                    rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  Generate New Datasheet
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="bg-white/80 backdrop-blur rounded-xl p-6 text-center">
          <p className="text-sm text-gray-600">
            Powered by AI • Supported formats: PDF, Excel, Images • Max file size: 50MB
          </p>
        </div>
      </div>
    </div>
  );
};

export default SmartElectricalDatasheetPage;
