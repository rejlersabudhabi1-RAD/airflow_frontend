/**
 * Electrical Equipment Datasheet Generator
 * SOFT-CODED: SLD upload page for automatic equipment detection and datasheet generation
 * Features:
 * - Single or multiple SLD file upload
 * - Drag & drop interface
 * - AI-powered electrical equipment detection
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
  BoltIcon
} from '@heroicons/react/24/outline';
import apiClient from '../../../services/api.service';
import ELECTRICAL_EQUIPMENT_UPLOAD_CONFIG, {
  validateFileSize,
  validateFileFormat,
  getEquipmentTypeById,
  getColorScheme,
  getApiEndpoint,
  handleApiError
} from '../../../config/electricalEquipmentUpload.config';

const ElectricalEquipmentDatasheet = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { page, upload, equipmentTypes, datasheetTypes, analysisOptions, projectFields, messages, theme } = ELECTRICAL_EQUIPMENT_UPLOAD_CONFIG;

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

  // SOFT-CODED: Multi-select mode toggle
  const [multiSelectMode, setMultiSelectMode] = useState(false);

  // SOFT-CODED: Datasheet Types Selection State
  const [selectedDatasheetTypes, setSelectedDatasheetTypes] = useState({
    transformer: true,
    diesel_generator: false,
    switchgear_11kv: false
  });

  const [formData, setFormData] = useState({
    drawing_number: '',
    drawing_title: '',
    revision: projectFields.revision.default,
    project_name: '',
    project_code: '',
    area: '',
    discipline: projectFields.discipline.default,
    voltage_level: '',
    selectedDatasheetType: 'transformer' // Default to first datasheet type
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

  // Handle upload
  const handleUpload = async () => {
    // Validation: Check if at least one datasheet type is selected
    const hasSelectedDatasheet = Object.values(selectedDatasheetTypes).some(value => value === true);
    if (!hasSelectedDatasheet) {
      setError('Please select at least one datasheet type to generate.');
      return;
    }

    // Validation: Check if files are uploaded
    if (files.length === 0) {
      setError('Please upload at least one SLD file.');
      return;
    }

    // Validation: Check required fields
    if (!formData.drawing_number) {
      setError('Drawing Number is required.');
      return;
    }

    // Get selected datasheet names for display
    const selectedDatasheets = datasheetTypes
      .filter(ds => selectedDatasheetTypes[ds.id])
      .map(ds => ds.shortName)
      .join(', ');

    setError('This feature is under development. Manual datasheet creation is available from the main page.');
    setWarning(`Selected datasheets: ${selectedDatasheets}. For now, please use the individual datasheet forms.`);
  };

  // Reset form
  const handleReset = () => {
    setFiles([]);
    setUploadResult(null);
    setError('');
    setWarning('');
    setUploadProgress(0);
    setAnalysisStage('');
    setUploading(false);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
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
              <BoltIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
              <p className="text-gray-600 mt-1">{page.subtitle}</p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <BoltIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
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
            {/* Project Information Form */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Cog6ToothIcon className="h-6 w-6 text-blue-600" />
                Project Information
              </h2>

              {/* Datasheet Type Dropdown Selector */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Select Datasheet Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.selectedDatasheetType || ''}
                  onChange={(e) => {
                    const selectedType = e.target.value;
                    setFormData({ ...formData, selectedDatasheetType: selectedType });
                    
                    // Update checkbox selection to match dropdown
                    if (selectedType) {
                      const newSelection = {};
                      datasheetTypes.forEach(ds => {
                        newSelection[ds.id] = ds.id === selectedType;
                      });
                      setSelectedDatasheetTypes(newSelection);
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                >
                  <option value="">Select a datasheet type to generate...</option>
                  {datasheetTypes.map((datasheet) => (
                    <option key={datasheet.id} value={datasheet.id}>
                      {datasheet.icon} {datasheet.name}
                    </option>
                  ))}
                </select>
                
                {/* Selected Type Info */}
                {formData.selectedDatasheetType && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                    {(() => {
                      const selected = datasheetTypes.find(ds => ds.id === formData.selectedDatasheetType);
                      return selected ? (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{selected.icon}</span>
                            <span className="font-bold text-gray-900">{selected.shortName}</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{selected.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {selected.specifications.slice(0, 4).map((spec, idx) => (
                              <span 
                                key={idx}
                                className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {projectFields.drawing_number.label} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.drawing_number}
                    onChange={(e) => setFormData({ ...formData, drawing_number: e.target.value })}
                    placeholder={projectFields.drawing_number.placeholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {projectFields.drawing_title.label}
                  </label>
                  <input
                    type="text"
                    value={formData.drawing_title}
                    onChange={(e) => setFormData({ ...formData, drawing_title: e.target.value })}
                    placeholder={projectFields.drawing_title.placeholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {projectFields.revision.label}
                  </label>
                  <input
                    type="text"
                    value={formData.revision}
                    onChange={(e) => setFormData({ ...formData, revision: e.target.value })}
                    placeholder={projectFields.revision.placeholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {projectFields.voltage_level.label}
                  </label>
                  <select
                    value={formData.voltage_level}
                    onChange={(e) => setFormData({ ...formData, voltage_level: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select voltage level</option>
                    {projectFields.voltage_level.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {projectFields.project_name.label}
                  </label>
                  <input
                    type="text"
                    value={formData.project_name}
                    onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                    placeholder={projectFields.project_name.placeholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {projectFields.area.label}
                  </label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    placeholder={projectFields.area.placeholder}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* File Upload Area */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DocumentArrowUpIcon className="h-6 w-6 text-blue-600" />
                Upload Single Line Diagrams
              </h2>

              {/* Drag & Drop Zone */}
              <div
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center transition-all
                  ${dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
                  }
                  ${files.length >= upload.maxFiles ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => files.length < upload.maxFiles && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={upload.acceptString}
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={files.length >= upload.maxFiles}
                />

                <div className="flex flex-col items-center">
                  <CloudArrowUpIcon className={`h-16 w-16 mb-4 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    {files.length > 0 ? 'Add More SLD Files' : upload.dragDropText}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Supported formats: {upload.supportedFormats.join(', ')}
                  </p>
                  <p className="text-xs text-gray-400">
                    Max {upload.maxFileSize}MB per file • Up to {upload.maxFiles} files
                  </p>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                    <span>Uploaded Files ({files.length}/{upload.maxFiles})</span>
                    <button
                      onClick={() => setFiles([])}
                      className="text-xs text-red-600 hover:text-red-800 transition-colors"
                    >
                      Clear All
                    </button>
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {files.map((fileObj, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <DocumentTextIcon className="h-5 w-5 text-blue-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{fileObj.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(fileObj.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="ml-2 p-1 hover:bg-red-100 rounded-full transition-colors"
                          title="Remove file"
                        >
                          <XMarkIcon className="h-5 w-5 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Analysis Options & Equipment Types */}
          <div className="space-y-6">
            {/* Analysis Options */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Analysis Options</h2>
              <div className="space-y-3">
                {Object.values(analysisOptions).map((option) => (
                  <label
                    key={option.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedOptionsState[option.id]}
                      onChange={(e) => setSelectedOptionsState({
                        ...selectedOptionsState,
                        [option.id]: e.target.checked
                      })}
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{option.icon}</span>
                        <span className="font-medium text-gray-900 text-sm">{option.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Advanced: Multiple Selection Mode (Optional) */}
            {multiSelectMode && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-gray-900">Multiple Datasheet Selection</h2>
                  <button
                    onClick={() => setMultiSelectMode(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    ✕ Close
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-4">Select multiple datasheets to generate at once</p>
                <div className="space-y-3">
                  {datasheetTypes.map((datasheet) => (
                    <label
                      key={datasheet.id}
                      className={`
                        flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                        ${selectedDatasheetTypes[datasheet.id] 
                          ? `border-${datasheet.color}-500 bg-${datasheet.color}-50` 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDatasheetTypes[datasheet.id]}
                        onChange={(e) => {
                          const newSelection = {
                            ...selectedDatasheetTypes,
                            [datasheet.id]: e.target.checked
                          };
                          setSelectedDatasheetTypes(newSelection);
                          
                          // Update dropdown to empty if multiple selected
                          const selectedCount = Object.values(newSelection).filter(Boolean).length;
                          if (selectedCount !== 1) {
                            setFormData({ ...formData, selectedDatasheetType: '' });
                          } else {
                            const singleSelected = Object.keys(newSelection).find(key => newSelection[key]);
                            setFormData({ ...formData, selectedDatasheetType: singleSelected });
                          }
                        }}
                        className={`mt-1 h-5 w-5 rounded border-gray-300 text-${datasheet.color}-600 focus:ring-${datasheet.color}-500`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{datasheet.icon}</span>
                          <div>
                            <span className="font-bold text-gray-900 text-sm block">{datasheet.shortName}</span>
                            <span className="text-xs text-gray-500">{datasheet.description}</span>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {datasheet.specifications.slice(0, 3).map((spec, idx) => (
                            <span 
                              key={idx}
                              className="text-xs px-2 py-0.5 bg-white text-gray-600 rounded border border-gray-200"
                            >
                              {spec}
                            </span>
                          ))}
                          {datasheet.specifications.length > 3 && (
                            <span className="text-xs px-2 py-0.5 text-gray-500">
                              +{datasheet.specifications.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                
                {/* Selection Summary */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Selected:</span>
                    <span className="font-bold text-blue-600">
                      {Object.values(selectedDatasheetTypes).filter(Boolean).length} / {datasheetTypes.length}
                    </span>
                  </div>
                  {Object.values(selectedDatasheetTypes).every(v => !v) && (
                    <p className="text-xs text-red-600 mt-2">⚠️ Please select at least one datasheet type</p>
                  )}
                </div>
              </div>
            )}

            {/* Enable Multiple Selection Button */}
            {!multiSelectMode && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                <button
                  onClick={() => setMultiSelectMode(true)}
                  className="w-full py-3 px-4 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all font-medium text-sm flex items-center justify-center gap-2"
                >
                  <span className="text-lg">⊕</span>
                  Enable Multiple Datasheet Selection
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">Generate multiple datasheet types from one SLD</p>
              </div>
            )}

            {/* Equipment Types */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Detectable Equipment</h2>
              <div className="space-y-2">
                {equipmentTypes.map((equipment) => {
                  const colorScheme = getColorScheme(equipment.color);
                  return (
                    <div
                      key={equipment.id}
                      className={`p-3 rounded-lg border ${colorScheme.border} ${colorScheme.bg}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{equipment.icon}</span>
                        <span className={`font-semibold text-sm ${colorScheme.text}`}>
                          {equipment.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{equipment.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tags: {equipment.prefix.join(', ')}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Error/Warning Messages */}
        {error && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-900 mb-1">Error</h3>
                <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
              </div>
            </div>
          </div>
        )}

        {warning && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-900 mb-1">Warning</h3>
                <p className="text-sm text-yellow-800">{warning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        {!uploading && !uploadResult && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              onClick={handleUpload}
              disabled={files.length === 0 || Object.values(selectedDatasheetTypes).every(v => !v)}
              className={`
                px-8 py-4 rounded-xl font-semibold text-white shadow-lg
                bg-gradient-to-r ${theme.gradientFrom} ${theme.gradientTo}
                hover:shadow-xl transform transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                flex items-center gap-3
              `}
            >
              <BoltIcon className="h-6 w-6" />
              {files.length === 1 
                ? upload.uploadButtonTextSingle 
                : upload.uploadButtonTextMultiple.replace('{count}', files.length)
              }
            </button>
            
            {/* Selected Datasheets Summary */}
            {Object.values(selectedDatasheetTypes).some(v => v) && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">Generating:</span>
                <div className="flex gap-2">
                  {datasheetTypes.map(ds => 
                    selectedDatasheetTypes[ds.id] && (
                      <span 
                        key={ds.id}
                        className={`px-3 py-1 bg-gradient-to-r ${ds.gradient} text-white rounded-full text-xs font-semibold flex items-center gap-1`}
                      >
                        {ds.icon} {ds.shortName}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons when result exists */}
        {uploadResult && (
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={handleReset}
              className="px-6 py-3 rounded-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Upload New SLD
            </button>
            <button
              onClick={() => navigate(page.backRoute)}
              className="px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-lg transition-all"
            >
              Back to Datasheets
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ElectricalEquipmentDatasheet;
