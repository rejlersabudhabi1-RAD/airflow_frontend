import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import apiClient from '../../../services/api.service';
import { API_TIMEOUT_UPLOAD } from '../../../config/api.config';

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
  const [searchParams] = useSearchParams();

  // Pre-select equipment from URL parameter
  useEffect(() => {
    const equipmentParam = searchParams.get('equipment');
    if (equipmentParam && EQUIPMENT_TYPES.find(eq => eq.id === equipmentParam)) {
      setSelectedEquipmentType(equipmentParam);
    }
  }, [searchParams]);

  const [selectedEquipmentType, setSelectedEquipmentType] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [excelBlob, setExcelBlob] = useState(null);

  const selectedEquipment = EQUIPMENT_TYPES.find(eq => eq.id === selectedEquipmentType);

  const handleEquipmentChange = (e) => {
    const newType = e.target.value;
    setSelectedEquipmentType(newType);
    setUploadedFiles({});
    setError('');
    setResults(null);
  };

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
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const canSubmit = () => {
    if (!selectedEquipment) return false;
    return selectedEquipment.requiredFiles.every(fileType => uploadedFiles[fileType]);
  };

  const resetForm = () => {
    setSelectedEquipmentType('');
    setUploadedFiles({});
    setUploading(false);
    setUploadProgress(0);
    setAnalysisStage('');
    setResults(null);
    setError('');
    setExcelBlob(null);
  };

  const handleGenerate = async () => {
    if (!canSubmit()) {
      setError('Please upload all required documents');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('equipment_type', selectedEquipmentType);

      Object.entries(uploadedFiles).forEach(([fileType, file]) => {
        formData.append('files', file);
        formData.append('file_types', fileType);
      });

      setAnalysisStage('Uploading files...');

      const response = await apiClient.post(
        '/electrical-datasheet/datasheets/generate-smart/',
        formData,
        {
          timeout: API_TIMEOUT_UPLOAD,
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          },
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setAnalysisStage('Processing complete!');
      setResults(response.data);

      if (response.data.excel_url) {
        const excelResponse = await apiClient.get(response.data.excel_url, {
          responseType: 'blob'
        });
        setExcelBlob(excelResponse.data);
      }

    } catch (err) {
      console.error('Generation error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to generate datasheet');
      setAnalysisStage('');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = () => {
    if (!excelBlob) return;

    const url = window.URL.createObjectURL(excelBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedEquipment.name.replace(/\s+/g, '_')}_Datasheet_${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            ⚡ Smart Electrical Datasheet Generator
          </h1>
          <p className="text-lg text-gray-600">
            AI-powered datasheet generation for 6 electrical equipment types
          </p>
        </div>

        {/* Equipment Type Selector - Always Visible */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Select Equipment Type
          </label>
          <select
            value={selectedEquipmentType}
            onChange={handleEquipmentChange}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-lg
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all
                     bg-white cursor-pointer hover:border-gray-400"
            disabled={uploading}
          >
            <option value="">-- Choose Equipment Type --</option>
            {EQUIPMENT_TYPES.map((equipment) => (
              <option key={equipment.id} value={equipment.id}>
                {equipment.icon} {equipment.name} - {equipment.description}
              </option>
            ))}
          </select>

          {selectedEquipment && !results && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{selectedEquipment.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedEquipment.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedEquipment.description}</p>
                  <div className="mt-2 text-sm text-gray-700">
                    <span className="font-medium">Required:</span> {selectedEquipment.requiredFiles.length} document(s)
                    {selectedEquipment.optionalFiles.length > 0 && (
                      <span className="ml-3">
                        <span className="font-medium">Optional:</span> {selectedEquipment.optionalFiles.length} document(s)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-3">
            <XCircleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">Error</h4>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* File Upload Section */}
        {selectedEquipment && !results && (
          <div className="space-y-6">
            {/* Required Files */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
              <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2 text-lg">
                <DocumentArrowUpIcon className="h-6 w-6" />
                Required Documents
              </h3>
              <div className="space-y-3">
                {selectedEquipment.requiredFiles.map((fileType, idx) => (
                  <div key={idx}>
                    {uploadedFiles[fileType] ? (
                      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CheckCircleIcon className="h-6 w-6 text-green-600" />
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
                          className="p-2 hover:bg-red-100 rounded-full transition-colors"
                        >
                          <XMarkIcon className="h-5 w-5 text-red-600" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          id={`required-${idx}`}
                          accept=".pdf,.xlsx,.xls,.png,.jpg,.jpeg"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFileUpload(fileType, e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />
                        <label
                          htmlFor={`required-${idx}`}
                          className="flex items-center gap-3 p-4 border-2 border-dashed border-blue-300
                                   rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
                        >
                          <DocumentArrowUpIcon className="h-6 w-6 text-blue-600" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {fileType} <span className="text-red-600">*</span>
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
            {selectedEquipment.optionalFiles.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-400">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-lg">
                  <DocumentTextIcon className="h-6 w-6" />
                  Optional Documents
                </h3>
                <div className="space-y-3">
                  {selectedEquipment.optionalFiles.map((fileType, idx) => (
                    <div key={idx}>
                      {uploadedFiles[fileType] ? (
                        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircleIcon className="h-6 w-6 text-green-600" />
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
                            className="p-2 hover:bg-red-100 rounded-full transition-colors"
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
                                     rounded-lg hover:border-gray-500 hover:bg-gray-100 cursor-pointer transition-all"
                          >
                            <DocumentTextIcon className="h-6 w-6 text-gray-600" />
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
            )}

            {/* Generate Button */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <button
                onClick={handleGenerate}
                disabled={!canSubmit() || uploading}
                className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all
                          ${canSubmit() && !uploading
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-3">
                    <ArrowPathIcon className="h-6 w-6 animate-spin" />
                    Generating Datasheet...
                  </span>
                ) : (
                  'Generate Smart Datasheet'
                )}
              </button>

              {uploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">{analysisStage}</span>
                    <span className="text-sm font-semibold text-blue-600">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-6">
              <CheckCircleIcon className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Datasheet Generated Successfully! 🎉
              </h2>
              <p className="text-gray-600">
                Your {selectedEquipment.name} datasheet is ready for download
              </p>
            </div>

            {/* Results Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Generation Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Equipment Type:</span>
                  <p className="font-semibold text-gray-900">{selectedEquipment.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Files Processed:</span>
                  <p className="font-semibold text-gray-900">{Object.keys(uploadedFiles).length}</p>
                </div>
                {results.datasheet_id && (
                  <div>
                    <span className="text-gray-600">Datasheet ID:</span>
                    <p className="font-semibold text-gray-900">{results.datasheet_id}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Download Button */}
            <div className="flex gap-4">
              {excelBlob && (
                <button
                  onClick={handleDownload}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600
                           hover:from-green-700 hover:to-emerald-700 text-white rounded-lg
                           font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Download Excel Datasheet
                </button>
              )}
              <button
                onClick={resetForm}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg
                         hover:bg-gray-50 font-semibold transition-all"
              >
                Generate Another
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!selectedEquipmentType && !results && (
          <div className="bg-white rounded-xl shadow-md p-8 mt-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">How It Works</h3>
            <ol className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</span>
                <span>Select your equipment type from the dropdown above</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</span>
                <span>Upload all required documents (marked with *)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">3</span>
                <span>Optionally upload additional supporting documents</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">4</span>
                <span>Click "Generate Smart Datasheet" and wait for AI processing</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">5</span>
                <span>Download your completed datasheet in Excel format</span>
              </li>
            </ol>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Supported Equipment Types:</strong> Transformers, DG Set, MV Switchgear (11kV/33kV), 
                LV Switchgear, AC UPS, and DC UPS
              </p>
              <p className="text-sm text-blue-900 mt-2">
                <strong>Accepted File Formats:</strong> PDF, Excel (.xlsx, .xls), Images (.png, .jpg, .jpeg)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartElectricalDatasheetPage;
