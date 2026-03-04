/**
 * MOV Equipment P&ID Upload Page
 * Allows P&ID + HMB upload for Motor Operated Valve (MOV) datasheet generation
 * - Upload P&ID diagrams + HMB
 * - Optional third document upload
 * - Automatic MOV detection and classification
 * - Datasheet population (Section 1 & 2 only)
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
  Settings2,
  FileCheck,
  Download,
  Plus
} from 'lucide-react';
import apiClient from '../../services/api.service';

const MOVEquipmentPage = () => {
  const navigate = useNavigate();
  const pidInputRef = useRef(null);
  const hmbInputRef = useRef(null);
  const otherInputRef = useRef(null);

  // State management
  const [pidFile, setPidFile] = useState(null);
  const [hmbFile, setHmbFile] = useState(null);
  const [otherFile, setOtherFile] = useState(null);
  const [pidDragActive, setPidDragActive] = useState(false);
  const [hmbDragActive, setHmbDragActive] = useState(false);
  const [otherDragActive, setOtherDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [htmlPreview, setHtmlPreview] = useState('');
  const [excelData, setExcelData] = useState(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pidFile) URL.revokeObjectURL(URL.createObjectURL(pidFile));
      if (hmbFile) URL.revokeObjectURL(URL.createObjectURL(hmbFile));
      if (otherFile) URL.revokeObjectURL(URL.createObjectURL(otherFile));
    };
  }, [pidFile, hmbFile, otherFile]);

  // File validation and setter
  const validateAndSetFile = (file, setter, label) => {
    const fileExtension = file.name.split('.').pop().toUpperCase();
    if (!['PDF'].includes(fileExtension)) {
      setError(`${label} must be PDF format`);
      return;
    }
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 50) {
      setError(`${label} file exceeds 50MB limit`);
      return;
    }
    setter(file);
    setError('');
    setUploadResult(null);
  };

  // File change handlers
  const handlePidFileChange = (e) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0], setPidFile, 'P&ID');
  };

  const handleHmbFileChange = (e) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0], setHmbFile, 'HMB');
  };

  const handleOtherFileChange = (e) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0], setOtherFile, 'Other document');
  };

  // Drag handlers
  const handleDrag = (e, setActive) => {
    e.preventDefault();
    e.stopPropagation();
    setActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e, setter, label) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0], setter, label);
    }
  };

  // Upload and analyze
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
      if (otherFile) formDataToSend.append('other_doc', otherFile);
      formDataToSend.append('equipment_type', 'mov_equipment');

      setUploadProgress(10);
      setAnalysisStage('Uploading files...');

      // Call MOV equipment analysis endpoint (async)
      const response = await apiClient.post(
        '/process-datasheet/datasheets/extract-mov-equipment/',
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

      // Start polling for results
      if (responseData.job_id) {
        pollJobStatus(responseData.job_id);
      } else if (responseData.success) {
        // Immediate response (fallback)
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
      console.error('MOV equipment upload error:', err);
      setError(err.response?.data?.error || err.message || 'Upload failed. Please try again.');
      setUploadResult({ success: false });
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  // Poll job status
  const pollJobStatus = async (jobId) => {
    const maxAttempts = 120;
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        
        const statusResponse = await apiClient.get(`/process-datasheet/mov-job-status/${jobId}/`);
        const { status, progress, stage, result, error: jobError } = statusResponse.data;

        setUploadProgress(progress || 0);
        setAnalysisStage(stage || 'Processing...');

        if (status === 'completed' && result) {
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
          if (attempts < maxAttempts) {
            setTimeout(poll, 3000);
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

    poll();
  };

  const handleDownloadExcel = () => {
    if (!excelData) return;

    try {
      const binaryString = window.atob(excelData.base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

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
    setOtherFile(null);
    setUploadResult(null);
    setHtmlPreview('');
    setExcelData(null);
    setError('');
    setUploadProgress(0);
    setAnalysisStage('');
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
            <Settings2 className="w-4 h-4 inline mr-1" />
            Equipment Process Data
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Title Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Settings2 className="w-8 h-8" />
              <h1 className="text-2xl sm:text-3xl font-bold">MOV Equipment Datasheet</h1>
            </div>
            <p className="text-blue-100 text-sm sm:text-base">
              Upload P&ID and HMB to generate Motor Operated Valve (MOV) process datasheets
            </p>
          </div>

          {/* Upload Section */}
          <div className="p-6 space-y-6">
            {/* P&ID Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                P&ID Document (Required)
              </label>
              <div
                onDragEnter={(e) => handleDrag(e, setPidDragActive)}
                onDragLeave={(e) => handleDrag(e, setPidDragActive)}
                onDragOver={(e) => handleDrag(e, setPidDragActive)}
                onDrop={(e) => { setPidDragActive(false); handleDrop(e, setPidFile, 'P&ID'); }}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  pidDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                } ${pidFile ? 'bg-green-50 border-green-400' : ''}`}
              >
                <input
                  ref={pidInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePidFileChange}
                  className="hidden"
                />
                {!pidFile ? (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <p className="text-gray-600">Drop P&ID PDF here or click to browse</p>
                    <button
                      onClick={() => pidInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Select P&ID
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span className="text-gray-900 font-medium">{pidFile.name}</span>
                    </div>
                    <button
                      onClick={() => setPidFile(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* HMB Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                HMB Document (Required)
              </label>
              <div
                onDragEnter={(e) => handleDrag(e, setHmbDragActive)}
                onDragLeave={(e) => handleDrag(e, setHmbDragActive)}
                onDragOver={(e) => handleDrag(e, setHmbDragActive)}
                onDrop={(e) => { setHmbDragActive(false); handleDrop(e, setHmbFile, 'HMB'); }}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  hmbDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                } ${hmbFile ? 'bg-green-50 border-green-400' : ''}`}
              >
                <input
                  ref={hmbInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleHmbFileChange}
                  className="hidden"
                />
                {!hmbFile ? (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <p className="text-gray-600">Drop HMB PDF here or click to browse</p>
                    <button
                      onClick={() => hmbInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Select HMB
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span className="text-gray-900 font-medium">{hmbFile.name}</span>
                    </div>
                    <button
                      onClick={() => setHmbFile(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Other Document Upload (Optional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                Other Document (Optional)
                <span className="text-xs text-gray-500 font-normal">— Additional reference document</span>
              </label>
              <div
                onDragEnter={(e) => handleDrag(e, setOtherDragActive)}
                onDragLeave={(e) => handleDrag(e, setOtherDragActive)}
                onDragOver={(e) => handleDrag(e, setOtherDragActive)}
                onDrop={(e) => { setOtherDragActive(false); handleDrop(e, setOtherFile, 'Other document'); }}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  otherDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                } ${otherFile ? 'bg-green-50 border-green-400' : ''}`}
              >
                <input
                  ref={otherInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleOtherFileChange}
                  className="hidden"
                />
                {!otherFile ? (
                  <div className="space-y-2">
                    <Plus className="w-10 h-10 mx-auto text-gray-400" />
                    <p className="text-gray-500 text-sm">Optional additional document</p>
                    <button
                      onClick={() => otherInputRef.current?.click()}
                      className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Add Document
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <span className="text-gray-900 font-medium">{otherFile.name}</span>
                    </div>
                    <button
                      onClick={() => setOtherFile(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Upload Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-blue-900 font-medium">{analysisStage}</span>
                  <span className="text-blue-700 text-sm">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Processing may take 2-5 minutes...</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleUpload}
                disabled={!pidFile || !hmbFile || uploading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                {uploading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-5 h-5" />
                    Generate Datasheet
                  </>
                )}
              </button>

              {(pidFile || hmbFile || otherFile) && !uploading && (
                <button
                  onClick={handleReset}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Results Section */}
            {htmlPreview && (
              <div className="mt-8 space-y-4">
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

            {/* Info Section */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">What This Tool Does</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Automatically detects all Motor Operated Valves (MOV) in P&ID</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Extracts HMB process conditions: temperature, pressure, fluid properties</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Populates Section 1 (General Data) from P&ID and Section 2 (Operating Conditions) from HMB</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Leaves Section 3 (Valve Details) and Section 4 (Actuator Details) blank for manual input</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Generates professional Excel datasheets ready for engineering review</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MOVEquipmentPage;
