import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FEATURES_CATALOG } from '../../config/featuresCatalog.config';
import { 
  ArrowLeftIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

/**
 * PFD Analysis Page - Process Flow Diagram Analysis
 * AI-powered PFD processing and P&ID conversion
 */
const PFDAnalysis = () => {
  const navigate = useNavigate();
  
  // Get module name from centralized config
  const moduleConfig = FEATURES_CATALOG.engineering.features.find(
    feature => feature.id === 'eng-process-datasheet'
  );
  const MODULE_NAME = moduleConfig?.name || 'Process Datasheets';
  
  const [selectedProject, setSelectedProject] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState({
    pfd: null,
    pid: null,
    scope: null
  });

  const projectTypes = [
    { value: 'offshore', label: 'Offshore Platform', icon: '🌊' },
    { value: 'onshore', label: 'Onshore Facility', icon: '🏭' },
    { value: 'refinery', label: 'Refinery', icon: '⚗️' },
    { value: 'petrochemical', label: 'Petrochemical Plant', icon: '🧪' },
    { value: 'general', label: 'General Process', icon: '⚙️' }
  ];

  const analysisSteps = [
    {
      id: 1,
      title: 'Select Project Type',
      description: 'Choose your project category for optimized analysis',
      icon: DocumentTextIcon,
      status: selectedProject ? 'completed' : 'current'
    },
    {
      id: 2,
      title: 'Upload PFD Documents',
      description: 'Upload Process Flow Diagrams for AI analysis',
      icon: CloudArrowUpIcon,
      status: uploadedFiles.pfd ? 'completed' : 'pending'
    },
    {
      id: 3,
      title: 'AI Processing',
      description: 'Automated equipment and stream identification',
      icon: ChartBarIcon,
      status: 'pending'
    },
    {
      id: 4,
      title: 'Generate Results',
      description: 'Review equipment list, stream tables, and P&ID conversion',
      icon: CheckCircleIcon,
      status: 'pending'
    }
  ];

  const handleFileUpload = (type, event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFiles(prev => ({
        ...prev,
        [type]: file
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header with Back Button */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => navigate('/engineering/process/datasheet')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to {MODULE_NAME}</span>
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Process Flow Diagram Analysis
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered PFD processing and automatic P&ID conversion
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              AI Powered
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Type Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Step 1: Select Project Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectTypes.map((project) => (
                  <button
                    key={project.value}
                    onClick={() => setSelectedProject(project.value)}
                    className={`
                      p-4 rounded-lg border-2 transition-all duration-300
                      ${selectedProject === project.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{project.icon}</span>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {project.label}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Step 2: Upload Documents
              </h2>
              
              <div className="space-y-4">
                {/* Mandatory: PFD Upload */}
                <div className="border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg p-6 bg-blue-50 dark:bg-blue-900/10">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-900 dark:text-white">
                      Process Flow Diagram (PFD) *
                    </label>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                      Required
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Upload your PFD for AI-powered analysis and equipment identification
                  </p>
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload('pfd', e)}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="block w-full text-sm text-gray-500 dark:text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-600 file:text-white
                      hover:file:bg-blue-700
                      file:cursor-pointer cursor-pointer"
                  />
                  {uploadedFiles.pfd && (
                    <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span className="text-sm">{uploadedFiles.pfd.name}</span>
                    </div>
                  )}
                </div>

                {/* Optional: P&ID Upload */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-900 dark:text-white">
                      P&ID (Optional)
                    </label>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                      Optional
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Upload existing P&ID for comparison and validation
                  </p>
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload('pid', e)}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="block w-full text-sm text-gray-500 dark:text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-gray-600 file:text-white
                      hover:file:bg-gray-700
                      file:cursor-pointer cursor-pointer"
                  />
                  {uploadedFiles.pid && (
                    <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span className="text-sm">{uploadedFiles.pid.name}</span>
                    </div>
                  )}
                </div>

                {/* Optional: Scope Document */}
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-gray-900 dark:text-white">
                      Project Scope Document (Optional)
                    </label>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                      Optional
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Upload project scope for enhanced context and analysis
                  </p>
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload('scope', e)}
                    accept=".pdf,.doc,.docx"
                    className="block w-full text-sm text-gray-500 dark:text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-gray-600 file:text-white
                      hover:file:bg-gray-700
                      file:cursor-pointer cursor-pointer"
                  />
                  {uploadedFiles.scope && (
                    <div className="mt-2 flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span className="text-sm">{uploadedFiles.scope.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                disabled={!selectedProject || !uploadedFiles.pfd}
                className={`
                  mt-6 w-full py-3 px-6 rounded-lg font-semibold text-white
                  transition-all duration-300
                  ${selectedProject && uploadedFiles.pfd
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:from-blue-600 hover:to-blue-700'
                    : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'}
                `}
              >
                Start AI Analysis
              </button>
            </div>
          </div>

          {/* Progress Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Analysis Progress
              </h3>
              <div className="space-y-4">
                {analysisSteps.map((step, index) => {
                  const IconComponent = step.icon;
                  const isCompleted = step.status === 'completed';
                  const isCurrent = step.status === 'current';
                  
                  return (
                    <div key={step.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          ${isCompleted 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : isCurrent
                            ? 'bg-blue-100 dark:bg-blue-900/30'
                            : 'bg-gray-100 dark:bg-gray-700'}
                        `}>
                          <IconComponent className={`
                            w-5 h-5
                            ${isCompleted 
                              ? 'text-green-600 dark:text-green-400' 
                              : isCurrent
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-400 dark:text-gray-500'}
                          `} />
                        </div>
                        {index < analysisSteps.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-200 dark:bg-gray-700 mt-2" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`
                          font-semibold text-sm
                          ${isCompleted || isCurrent
                            ? 'text-gray-900 dark:text-white'
                            : 'text-gray-500 dark:text-gray-400'}
                        `}>
                          {step.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {step.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>💡 AI Analysis Includes:</strong><br/>
                  • Equipment identification & tagging<br/>
                  • Stream table generation<br/>
                  • Material balance analysis<br/>
                  • Automated P&ID conversion<br/>
                  • Process validation checks
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PFDAnalysis;
