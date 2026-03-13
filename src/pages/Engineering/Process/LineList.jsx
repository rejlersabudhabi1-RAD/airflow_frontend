/**
 * 🎯 LINE LIST - BASE EXTRACTION LAYER ONLY
 * 
 * Purpose: Extract base 8 columns from P&ID (no enrichment)
 * Route: /engineering/process/line-list
 * 
 * Features:
 * - P&ID upload only (PDF)
 * - Async processing with polling (fixes Railway production timeout)
 * - 8 locked columns output
 * - No HMB/PMS/NACE/Stress documents
 * - Stable, production-ready
 *
 * Why async?
 * Railway's reverse proxy drops HTTP connections after ~60 s.
 * OCR takes several minutes, so we submit a background job and poll
 * for the result — the same pattern used by upload_pid_status.
 */

import React, { useState, useRef, useCallback } from 'react';
import { DocumentTextIcon, CloudArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import apiClient from '../../../services/api.service';
import * as XLSX from 'xlsx';
import envConfig from '../../../config/environment.config';

// ---------------------------------------------------------------------------
// Soft-coded config: read polling interval from centralized environments.json
// ---------------------------------------------------------------------------
const API_CONFIG = envConfig.getApiConfig();
const POLL_INTERVAL_MS = API_CONFIG.retry_delay || 3000;   // default 3 s
const POLL_MAX_WAIT_MS = (API_CONFIG.timeout_long || 1200000);  // default 20 min

const LineList = () => {
  // State management
  const [pidDocument, setPidDocument] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [formatType, setFormatType] = useState('onshore');
  const [includeArea, setIncludeArea] = useState(false);

  const pidRef = useRef(null);
  const pollTimerRef = useRef(null);
  const pollStartRef = useRef(null);

  // -------------------------------------------------------------------------
  // File selection
  // -------------------------------------------------------------------------
  const handlePIDSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPidDocument(file);
      setError(null);
      setExtractedData(null);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  // -------------------------------------------------------------------------
  // Polling helper
  // -------------------------------------------------------------------------
  const pollStatus = useCallback((taskId) => {
    if (Date.now() - pollStartRef.current > POLL_MAX_WAIT_MS) {
      clearTimeout(pollTimerRef.current);
      setError('Extraction timed out. The file may be too large — please try again.');
      setIsProcessing(false);
      return;
    }

    apiClient
      .get(`/designiq/lists/base_extraction_status/${taskId}/`)
      .then(({ data }) => {
        const state = data.state || data.status;

        if (state === 'SUCCESS') {
          clearTimeout(pollTimerRef.current);
          setProgress(100);
          setStatusMessage('Extraction complete!');
          setExtractedData(data.result);
          setIsProcessing(false);

        } else if (state === 'FAILURE') {
          clearTimeout(pollTimerRef.current);
          setError(data.error || 'Extraction failed on the server.');
          setIsProcessing(false);

        } else {
          // PENDING or PROGRESS — keep polling
          setProgress(data.percent || 0);
          setStatusMessage(data.status || 'Processing…');
          pollTimerRef.current = setTimeout(() => pollStatus(taskId), POLL_INTERVAL_MS);
        }
      })
      .catch((err) => {
        console.error('Poll error:', err);
        // Network blip — retry rather than fail immediately
        pollTimerRef.current = setTimeout(() => pollStatus(taskId), POLL_INTERVAL_MS * 2);
      });
  }, []);

  // -------------------------------------------------------------------------
  // Submit extraction job
  // -------------------------------------------------------------------------
  const handleExtract = async () => {
    if (!pidDocument) {
      setError('Please upload a P&ID document first');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setExtractedData(null);
    setProgress(0);
    setStatusMessage('Uploading P&ID…');

    const formData = new FormData();
    formData.append('pid_file', pidDocument);
    formData.append('format_type', formatType);
    formData.append('include_area', includeArea);

    try {
      // POST returns 202 with task_id (async) or 200 with data (EAGER/local dev)
      const response = await apiClient.post(
        '/designiq/lists/base_extraction/',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // EAGER mode (local dev): synchronous result returned immediately
      if (response.status === 200 && response.data.success) {
        setExtractedData(response.data);
        setProgress(100);
        setStatusMessage('Extraction complete!');
        setIsProcessing(false);
        return;
      }

      // Async mode (production): start polling
      const { task_id } = response.data;
      if (!task_id) {
        throw new Error('Server did not return a task_id. Please try again.');
      }

      setStatusMessage('Processing in background…');
      pollStartRef.current = Date.now();
      pollStatus(task_id);

    } catch (err) {
      console.error('Extraction error:', err);
      setError(err.response?.data?.error || err.message || 'Extraction failed');
      setIsProcessing(false);
    }
  };

  // -------------------------------------------------------------------------
  // Export to Excel
  // -------------------------------------------------------------------------
  const handleExport = () => {
    if (!extractedData?.data) return;

    const headers = ['Original Detection', 'Fluid Code', 'Size', 'Sequence No', 'PIPR Class', 'Insulation', 'From', 'To'];

    const wsData = [
      headers,
      ...extractedData.data.map(item => [
        item.original_detection || '',
        item.fluid_code || '',
        item.size || '',
        item.sequence_no || '',
        item.pipr_class || '',
        item.insulation || '',
        item.from || '',
        item.to || '',
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const colWidths = headers.map((header, colIndex) => {
      let maxWidth = header.length;
      for (let rowIndex = 1; rowIndex < wsData.length; rowIndex++) {
        const cellValue = wsData[rowIndex][colIndex];
        if (cellValue) maxWidth = Math.max(maxWidth, String(cellValue).length);
      }
      return { wch: Math.min(Math.max(maxWidth + 2, 12), 50) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Line List');
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            Line List - Base Extraction
          </h1>
          <p className="mt-2 text-gray-600">
            Extract 8 base columns from P&ID (P&ID-only, no enrichment)
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Upload P&ID Document</h2>
          
          {/* P&ID Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
            <input
              ref={pidRef}
              type="file"
              accept=".pdf"
              onChange={handlePIDSelect}
              className="hidden"
            />
            <button
              onClick={() => pidRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-3"
              disabled={isProcessing}
            >
              {pidDocument ? (
                <>
                  <CheckCircleIcon className="h-12 w-12 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">{pidDocument.name}</span>
                  <span className="text-xs text-gray-500">
                    {(pidDocument.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">
                    Click to select P&ID (PDF only)
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Format Options */}
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Line Number Format
              </label>
              <select
                value={formatType}
                onChange={(e) => setFormatType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={isProcessing}
              >
                <option value="onshore">Onshore (SIZE-FLUID-SEQ-CLASS)</option>
                <option value="offshore">Offshore (AREA-FLUID-SIZE-CLASS-SEQ)</option>
                <option value="general">General (Auto-detect)</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeArea"
                checked={includeArea}
                onChange={(e) => setIncludeArea(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isProcessing}
              />
              <label htmlFor="includeArea" className="ml-2 text-sm text-gray-700">
                Include Area Code in line number (SIZE"-AREA-FLUID-SEQ-CLASS)
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleExtract}
            disabled={!pidDocument || isProcessing}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-all ${
              !pidDocument || isProcessing
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing…
              </span>
            ) : (
              'Extract Base Columns'
            )}
          </button>

          {extractedData && (
            <button
              onClick={handleExport}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
            >
              Download Excel
            </button>
          )}
        </div>

        {/* Progress Bar (shown while processing) */}
        {isProcessing && (
          <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">{statusMessage || 'Processing…'}</span>
              <span className="text-sm font-medium text-blue-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              OCR extraction runs in the background. This usually takes 2–5 minutes depending on drawing complexity.
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Results Table */}
        {extractedData && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Extracted {extractedData.total_lines} Lines ({extractedData.columns} Columns)
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Original Detection
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Fluid Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Sequence No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      PIPR Class
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Insulation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      To
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {extractedData.data.map((line, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {line.original_detection || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {line.fluid_code || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {line.size || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {line.sequence_no || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {line.pipr_class || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {line.insulation || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {line.from || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {line.to || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Info Panel */}
        {!extractedData && !isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">ℹ️ About Base Extraction</h3>
            <ul className="space-y-2 text-blue-800">
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span><strong>P&ID Only:</strong> Upload P&ID document (PDF format)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span><strong>8 Columns:</strong> Original Detection, Fluid Code, Size, Sequence No, PIPR Class, Insulation, From, To</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span><strong>Background Processing:</strong> Job runs asynchronously — no browser timeout. Progress updates every few seconds.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span><strong>No Enrichment:</strong> This page does not include HMB, PMS, NACE, or Stress Criticality documents</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">•</span>
                <span><strong>AI-Powered FROM-TO:</strong> Uses Computer Vision + OpenAI to detect flow direction</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default LineList;
