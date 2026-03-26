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
 * OCR takes several minutes, so we submit the file as a background job and
 * poll for progress — the same pattern used by upload_pid_status.
 *
 * Why fetch + AbortController for the upload?
 * Axios' per-request timeout can be silently bypassed by the shared
 * api.service.js interceptor (which remaps errors) and by Axios instance
 * defaults set to API_TIMEOUT_LONG (300 s).  A native AbortController
 * fires at exactly UPLOAD_TIMEOUT_MS regardless of any Axios config,
 * guaranteeing the user is never frozen for 5 minutes.
 *
 * Build: v2.1.0 — AbortController upload timeout
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DocumentTextIcon, CloudArrowUpIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import apiClient from '../../../services/api.service';
import * as XLSX from 'xlsx';
import envConfig from '../../../config/environment.config';
import { getApiBaseUrl } from '../../../config/environment.config';
import { STORAGE_KEYS } from '../../../config/app.config';

// ---------------------------------------------------------------------------
// Soft-coded config — all timing values flow from environments.json.
// Hardcoded fallbacks ensure correct behaviour even if the JSON entry is
// missing or the Vercel build uses an old cached bundle.
// ---------------------------------------------------------------------------
const API_CONFIG = envConfig.getApiConfig();

// How often to poll for OCR progress (ms)
// SOFT-CODED: environments.json → api.retry_delay
const POLL_INTERVAL_MS   = Number(API_CONFIG.retry_delay)              || 3000;

// Maximum total polling window — give up after this (ms)
// SOFT-CODED: environments.json → api.timeout_extraction_poll
// Default 60 min — Railway OCR on dense multi-page P&IDs can take 30-45 min.
// Change this in environments.json without touching code.
const POLL_MAX_WAIT_MS   = Number(API_CONFIG.timeout_extraction_poll)  || 3600000;  // 60 min

// Timeout for the initial filing POST (upload + broker dispatch, NOT OCR time).
// Uses AbortController so it cannot be bypassed by Axios instance settings.
  // HARD-CODED: 10 minutes for Line List extraction (overrides environments.json)
const UPLOAD_TIMEOUT_MS  = 600000;   // 600 s (10 minutes for Line List extraction - complex document processing)

// Timeout for each individual status-poll GET
// SOFT-CODED: environments.json → api.timeout_poll
const POLL_REQ_TIMEOUT   = Number(API_CONFIG.timeout_poll)      || 10000;   // 10 s

// How many times to retry the initial POST before giving up
// SOFT-CODED: environments.json → api.max_upload_retries
const MAX_POST_RETRIES   = Number(API_CONFIG.max_upload_retries) || 3;

// Base delay between POST retries (doubles each attempt: 4 s, 8 s)
// SOFT-CODED: environments.json → api.upload_retry_delay
const POST_RETRY_BASE_MS = Number(API_CONFIG.upload_retry_delay) || 4000;

// Resolved API base-URL (e.g. https://aiflowbackend-production.up.railway.app/api/v1)
const API_BASE = getApiBaseUrl();

console.log('[LineList] Config loaded:', {
  UPLOAD_TIMEOUT_MS, POLL_INTERVAL_MS, MAX_POST_RETRIES, POST_RETRY_BASE_MS, API_BASE,
});

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
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const pidRef = useRef(null);
  const pollTimerRef = useRef(null);
  const pollStartRef = useRef(null);
  const elapsedTimerRef = useRef(null);

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
  // Elapsed-time ticker (runs while processing, so users know it's alive)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (isProcessing) {
      setElapsedSeconds(0);
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(elapsedTimerRef.current);
    }
    return () => clearInterval(elapsedTimerRef.current);
  }, [isProcessing]);

  // Friendly elapsed-time string e.g. "2m 34s"
  const formatElapsed = (secs) => {
    if (secs < 60) return `${secs}s`;
    return `${Math.floor(secs / 60)}m ${secs % 60}s`;
  };

  // -------------------------------------------------------------------------
  // Polling helper
  // -------------------------------------------------------------------------
  const pollStatus = useCallback((taskId) => {
    if (Date.now() - pollStartRef.current > POLL_MAX_WAIT_MS) {
      clearTimeout(pollTimerRef.current);
      const waited = Math.round(POLL_MAX_WAIT_MS / 60000);
      setError(
        `Extraction is taking longer than ${waited} minutes. The server is still working — ` +
        `please refresh the page and try again, or contact support if the problem persists. ` +
        `(Tip: reduce PDF size or split into single-sheet P&IDs for faster results.)`
      );
      setIsProcessing(false);
      return;
    }

    apiClient
      .get(`/designiq/lists/base_extraction_status/${taskId}/`, { timeout: POLL_REQ_TIMEOUT })
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
  // Submit extraction job — uses native fetch + AbortController so the
  // UPLOAD_TIMEOUT_MS deadline is enforced regardless of Axios instance
  // settings or api.service.js interceptor behaviour.
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

    // Build FormData (same fields used by the backend)
    const formData = new FormData();
    formData.append('pid_file', pidDocument);
    formData.append('format_type', formatType);
    formData.append('include_area', includeArea);

    // JWT token for Authorization header
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

    // Determine the full upload URL (relative for local, absolute for prod)
    // SOFT-CODED: API_BASE comes from environments.json → backend.api_url
    const uploadUrl = `${API_BASE}/designiq/lists/base_extraction/`;
    console.log(`[LineList] upload URL: ${uploadUrl}  timeout: ${UPLOAD_TIMEOUT_MS}ms`);

    // ------------------------------------------------------------------
    // Smart retry loop — up to MAX_POST_RETRIES attempts with exponential
    // back-off.  Each attempt is independently aborted after UPLOAD_TIMEOUT_MS
    // using the AbortController API (browser-native, cannot be overridden).
    // SOFT-CODED: MAX_POST_RETRIES, POST_RETRY_BASE_MS from environments.json
    // ------------------------------------------------------------------
    let lastErr = null;

    for (let attempt = 1; attempt <= MAX_POST_RETRIES; attempt++) {
      if (attempt > 1) {
        // Exponential back-off: 4 s, 8 s, …
        const delay = POST_RETRY_BASE_MS * Math.pow(2, attempt - 2);
        setStatusMessage(
          `Retrying upload (attempt ${attempt}/${MAX_POST_RETRIES})… waiting ${Math.round(delay / 1000)}s`
        );
        await new Promise((r) => setTimeout(r, delay));
      }

      setStatusMessage(
        attempt === 1
          ? 'Uploading P&ID…'
          : `Sending request (attempt ${attempt}/${MAX_POST_RETRIES})…`
      );

      // AbortController gives us a true hard deadline — no Axios involved
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

      try {
        const fetchResp = await fetch(uploadUrl, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
          signal: controller.signal,
        });
        clearTimeout(abortTimer);

        if (!fetchResp.ok) {
          // HTTP error — read body for detail
          let errDetail = `HTTP ${fetchResp.status}`;
          try {
            const errJson = await fetchResp.json();
            errDetail = errJson.error || errJson.detail || errDetail;
          } catch (_) { /* ignore parse error */ }
          throw Object.assign(new Error(errDetail), { isHttpError: true, status: fetchResp.status });
        }

        const data = await fetchResp.json();

        // EAGER mode (local dev): synchronous result returned with HTTP 200
        if (fetchResp.status === 200 && data.success) {
          setExtractedData(data);
          setProgress(100);
          setStatusMessage('Extraction complete!');
          setIsProcessing(false);
          return;
        }

        // Async mode (production): HTTP 202 with task_id — start polling
        const { task_id } = data;
        if (!task_id) {
          throw new Error('Server did not return a task_id. Please try again.');
        }

        console.log(`[LineList] task dispatched: ${task_id} (mode: ${data.dispatch_mode || 'unknown'})`);
        setStatusMessage('Processing in background — checking progress…');
        pollStartRef.current = Date.now();
        pollStatus(task_id);
        return; // SUCCESS — exit retry loop

      } catch (err) {
        clearTimeout(abortTimer);
        lastErr = err;

        const isAborted   = err.name === 'AbortError';
        const isNetworkErr = err instanceof TypeError && err.message.includes('fetch');
        const isRetryable  = isAborted || isNetworkErr;

        if (isAborted) {
          console.warn(
            `[LineList] attempt ${attempt}: upload aborted after ${UPLOAD_TIMEOUT_MS}ms`
          );
        } else {
          console.warn(`[LineList] attempt ${attempt} failed:`, err.message || err);
        }

        if (!isRetryable || attempt === MAX_POST_RETRIES) break;
        // Otherwise loop for the next attempt
      }
    }

    // All retries exhausted — show a user-friendly message
    console.error('[LineList] upload failed after all retries:', lastErr);
    const isTimeout = lastErr?.name === 'AbortError';
    const friendlyMsg =
      (isTimeout
        ? `Upload timed out after ${Math.round(UPLOAD_TIMEOUT_MS / 1000)}s — the server is busy. Please try again.`
        : null) ||
      lastErr?.message ||
      'Extraction failed — please try again.';
    setError(friendlyMsg);
    setIsProcessing(false);
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
    // SOFT-CODED: filename from environments.json api.version if needed
    XLSX.writeFile(wb, 'line_list_base_extraction.xlsx');
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Page Header */}
        <div className="mb-6">
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
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 tabular-nums">⏱ {formatElapsed(elapsedSeconds)}</span>
                <span className="text-sm font-medium text-blue-600">{progress}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>
            {/* Dynamic patience message — changes tone after 3 min */}
            <p className="text-xs text-gray-500 mt-2">
              {elapsedSeconds < 60
                ? 'OCR extraction running in the background — usually 2–10 min for standard P&IDs.'
                : elapsedSeconds < 180
                ? 'Still working… multi-page or high-density P&IDs take longer. Please keep this tab open.'
                : elapsedSeconds < 600
                ? `Running for ${formatElapsed(elapsedSeconds)} — complex drawings with many lines can take 10–30 min on the server. You can safely leave this tab open.`
                : `Running for ${formatElapsed(elapsedSeconds)} — still processing. For very large files consider splitting into single-sheet P&IDs to speed things up.`
              }
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
