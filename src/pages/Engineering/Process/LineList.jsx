/**
 * 🎯 LINE LIST - BASE EXTRACTION LAYER ONLY
 *
 * Purpose: Extract base 11 columns from P&ID (no enrichment)
 * Route: /engineering/process/line-list
 * Format: 2"-D-6152-033842-X-N
 *   → Size | Service Code | Sequence No | Piping Spec | Dept Deviation | Insulation
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
import { DocumentTextIcon, CloudArrowUpIcon, CheckCircleIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
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

// ---------------------------------------------------------------------------
// Soft-coded format options — add/remove formats here only, no JSX changes needed.
// ---------------------------------------------------------------------------
const FORMAT_OPTIONS = [
  { value: 'onshore',    label: 'Onshore',               hint: 'SIZE-FLUID-SEQ-CLASS'              },
  { value: 'industrial', label: 'Industrial/Project',    hint: 'SIZE\"-UNIT-SERVICE-SEQ-CLASS'     },
  { value: 'offshore',   label: 'Offshore',               hint: 'AREA-FLUID-SIZE-CLASS-SEQ'         },
  { value: 'general',    label: 'General (Auto-detect)',  hint: 'Tries all formats automatically'   },
  { value: 'adnoc',      label: 'SIZE\"-FLUID-CLASS-SEQ', hint: 'ADNOC / compact format'           },
];

// Soft-coded table columns — key maps directly to row fields.
// Format: 2"-D-6152-033842-X-N
//   original_detection → full string
//   size               → 2"
//   fluid_code         → D         (service / fluid code)
//   fluid_description  → Drain     (from legend sheet, if uploaded)
//   sequence_no        → 6152      (line sequence identifier)
//   piping_spec        → 033842    (piping specification number)
//   dept_deviation     → X         (department deviation / modifier)
//   insulation         → N         (insulation class)
//   insulation_desc    → No Insul. (from legend sheet, if uploaded)
const COLUMNS = [
  { key: 'original_detection', label: 'Line Designation',        width: 36 },
  { key: 'size',               label: 'Size',                    width: 8  },
  { key: 'fluid_code',         label: 'Service Code',            width: 12 },
  { key: 'fluid_description',  label: 'Service Description',     width: 22 },
  { key: 'sequence_no',        label: 'Sequence No.',            width: 12 },
  { key: 'piping_spec',        label: 'Piping Specification',    width: 16 },
  { key: 'dept_deviation',     label: 'Dept Deviation',          width: 14 },
  { key: 'insulation',         label: 'Insulation',              width: 12 },
  { key: 'insulation_desc',    label: 'Insulation Description',  width: 22 },
  { key: 'from',               label: 'From',                    width: 20 },
  { key: 'to',                 label: 'To',                      width: 20 },
];

// Soft-coded format reference examples shown in the info card.
const FORMAT_EXAMPLES = [
  {
    group: 'Industrial / Project',
    color: '#b45309',
    bg: 'rgba(180,83,9,0.06)',
    border: 'rgba(180,83,9,0.25)',
    examples: ['2"-2600-FL-352-32070R-E', '8"-2600-P-381-31051XR-E', '3/4"-2600-HD-430-32070R-E'],
    note: 'Unit · Service · Seq · PipingClass · EndDesig  (Samsung/Foster Wheeler & similar)',
  },
  {
    group: 'Offshore',
    color: '#1d4ed8',
    bg: 'rgba(29,78,216,0.06)',
    border: 'rgba(29,78,216,0.18)',
    examples: ['604-LFG-3-AC2GA0-2012', '604-PW-2\"-AE2LOD-FA-2779'],
  },
  {
    group: 'General (Auto-detect)',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.06)',
    border: 'rgba(124,58,237,0.2)',
    examples: ['4\"-41-SWR-64313-A2AU16-V', '16\"-41-SWS-65324-A2AU16-V'],
    note: 'Tries all formats — useful when format is unknown',
  },
  {
    group: 'Onshore',
    color: '#0369a1',
    bg: 'rgba(3,105,161,0.06)',
    border: 'rgba(3,105,161,0.18)',
    examples: ['2\"-D-6152-033842-X-N', '4\"-D-5690-013842-X-N', '16\"-PG-4667-031441-X'],
    note: 'Size · Service · Seq · PipingSpec · DeptDev · Insulation',
  },
  {
    group: 'SIZE\"-FLUID-CLASS-SEQ',
    color: '#0f766e',
    bg: 'rgba(15,118,110,0.06)',
    border: 'rgba(15,118,110,0.18)',
    examples: ['6\"-CD-AC3N-8256', '8\"-HO-BD2A-1023'],
  },
];

// ---------------------------------------------------------------------------
// Soft-coded layout config — change widths/padding here without touching JSX.
// ---------------------------------------------------------------------------
const LAYOUT_CONFIG = {
  // Normal mode: wider canvas usage (max-w-7xl = 80 rem = 1280 px)
  normalMaxWidth:      '80rem',
  normalPaddingX:      '1.5rem',   // px-6
  normalPaddingY:      '2rem',     // py-8
  // Fullscreen mode: fills the whole viewport
  fullscreenMaxWidth:  '100%',
  fullscreenPaddingX:  '2rem',
  fullscreenPaddingY:  '2rem',
};

// Helper — returns patience message based on elapsed time.
const getPatienceMsg = (secs) => {
  if (secs < 60)  return 'OCR extraction running in the background — usually 2–10 min for standard P&IDs.';
  if (secs < 180) return 'Still working… multi-page or high-density P&IDs take longer. Please keep this tab open.';
  if (secs < 600) return `Running for ${Math.floor(secs/60)}m ${secs%60}s — complex drawings can take 10–30 min on the server. You can safely leave this tab open.`;
  return `Running for ${Math.floor(secs/60)}m ${secs%60}s — still processing. For very large files consider splitting into single-sheet P&IDs.`;
};

const LineList = () => {
  // State management
  const [pidDocument, setPidDocument] = useState(null);
  const [legendDocument, setLegendDocument] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [extractedData, setExtractedData] = useState(null);
  const [error, setError] = useState(null);
  const [formatType, setFormatType] = useState('general');
  const [includeArea, setIncludeArea] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isFullscreen, setIsFullscreen]     = useState(false);

  const pidRef = useRef(null);
  const legendRef = useRef(null);
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

  const handleLegendSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setLegendDocument(file);
      setError(null);
    } else if (file) {
      setError('Legend file must be a PDF');
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
    if (legendDocument) {
      formData.append('legend_file', legendDocument);
    }

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

    // Derive headers + row values from the soft-coded COLUMNS array for easy extensibility.
    const headers = COLUMNS.map(c => c.label);

    const wsData = [
      headers,
      ...extractedData.data.map(item =>
        COLUMNS.map(c => item[c.key] || '')
      ),
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const colWidths = COLUMNS.map((col, colIndex) => {
      let maxWidth = col.label.length;
      for (let rowIndex = 1; rowIndex < wsData.length; rowIndex++) {
        const cellValue = wsData[rowIndex][colIndex];
        if (cellValue) maxWidth = Math.max(maxWidth, String(cellValue).length);
      }
      return { wch: Math.min(Math.max(maxWidth + 2, col.width ?? 12), 60) };
    });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Line List');
    XLSX.writeFile(wb, 'line_list_base_extraction.xlsx');
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <>
      <style>{`
        @keyframes ll-scan-line {
          0%   { top: 0%;   opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes ll-float {
          0%, 100% { transform: translateY(0)    scale(1);   opacity: 0.15; }
          50%       { transform: translateY(-20px) scale(1.2); opacity: 0.38; }
        }
        @keyframes ll-glow {
          0%, 100% { box-shadow: 0 0 7px  rgba(37,99,235,0.2); }
          50%       { box-shadow: 0 0 20px rgba(37,99,235,0.42), 0 0 40px rgba(37,99,235,0.1); }
        }
        @keyframes ll-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes ll-row-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ll-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ll-bar-glow {
          0%, 100% { filter: brightness(1); }
          50%       { filter: brightness(1.2) drop-shadow(0 0 5px rgba(37,99,235,0.5)); }
        }
        @keyframes ll-dot-wave {
          0%, 100% { transform: scaleY(0.5); opacity: 0.4; }
          50%       { transform: scaleY(1.5); opacity: 1; }
        }
        @keyframes ll-spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ll-pulse-badge {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
        @keyframes ll-fs-in {
          from { opacity: 0; transform: scale(0.98); }
          to   { opacity: 1; transform: scale(1); }
        }
        .ll-fullscreen-wrap {
          position: fixed; inset: 0; z-index: 9990;
          overflow-y: auto;
          animation: ll-fs-in 0.2s ease both;
        }
        .ll-scan-line {
          position: absolute; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(37,99,235,0.4), transparent);
          animation: ll-scan-line 3.2s ease-in-out infinite;
          pointer-events: none;
        }
        .ll-particle {
          position: absolute; border-radius: 50%;
          background: rgba(37,99,235,0.28);
          animation: ll-float ease-in-out infinite;
        }
        .ll-row-animate {
          animation: ll-row-in 0.3s ease forwards;
          opacity: 0;
        }
        .ll-section { animation: ll-fade-up 0.5s ease both; }
      `}</style>

      {/* Light blue/indigo gradient page — wraps in fixed overlay when fullscreen */}
      <div
        className={`min-h-screen relative overflow-x-hidden${isFullscreen ? ' ll-fullscreen-wrap' : ''}`}
        style={{ background: 'linear-gradient(145deg, #eff6ff 0%, #eef2ff 45%, #f0f9ff 100%)' }}
      >

        {/* Subtle dot grid */}
        <div className="fixed inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(37,99,235,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }} />

        {/* Ambient particles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[
            { l: '5%',  t: '16%', s: 4, d: '0s',   dur: '3.5s' },
            { l: '14%', t: '70%', s: 5, d: '0.8s', dur: '4.3s' },
            { l: '65%', t: '11%', s: 3, d: '1.2s', dur: '4.0s' },
            { l: '82%', t: '55%', s: 6, d: '0.4s', dur: '4.8s' },
            { l: '48%', t: '80%', s: 4, d: '1.9s', dur: '3.7s' },
            { l: '90%', t: '30%', s: 3, d: '2.1s', dur: '5.0s' },
          ].map((p, i) => (
            <div key={i} className="ll-particle" style={{
              left: p.l, top: p.t, width: p.s, height: p.s,
              animationDelay: p.d, animationDuration: p.dur,
            }} />
          ))}
        </div>

        <div
          className="relative z-10 mx-auto"
          style={{
            maxWidth:  isFullscreen ? LAYOUT_CONFIG.fullscreenMaxWidth : LAYOUT_CONFIG.normalMaxWidth,
            padding:   `${isFullscreen ? LAYOUT_CONFIG.fullscreenPaddingY : LAYOUT_CONFIG.normalPaddingY} ${isFullscreen ? LAYOUT_CONFIG.fullscreenPaddingX : LAYOUT_CONFIG.normalPaddingX}`,
          }}
        >

          {/* ── Page Header ── */}
          <div className="mb-8 ll-section" style={{ animationDelay: '0s' }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-4" style={{
              background: 'rgba(37,99,235,0.08)',
              border: '1px solid rgba(37,99,235,0.2)',
            }}>
              <span className="w-2 h-2 rounded-full bg-blue-500"
                style={{ animation: 'll-pulse-badge 2s ease infinite' }} />
              <span className="text-blue-700 text-xs font-semibold tracking-widest uppercase">AI-Powered · P&amp;ID Analysis</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-4 mb-3">
                <div className="p-2.5 rounded-xl" style={{
                  background: 'rgba(37,99,235,0.09)',
                  border: '1px solid rgba(37,99,235,0.2)',
                  animation: 'll-glow 3s ease infinite',
                }}>
                  <DocumentTextIcon className="h-7 w-7 text-blue-600" />
                </div>
                Line <span className="text-blue-600 ml-2">List</span>
              </h1>

              {/* Fullscreen toggle — purely a layout control, no core logic */}
              <button
                onClick={() => setIsFullscreen(fs => !fs)}
                title={isFullscreen ? 'Exit fullscreen' : 'Expand to fullscreen'}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold flex-shrink-0"
                style={{
                  background: isFullscreen ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.06)',
                  border: '1px solid rgba(37,99,235,0.2)',
                  color: '#1e40af',
                  transition: 'all 0.2s',
                }}
              >
                {isFullscreen
                  ? <><ArrowsPointingInIcon className="h-4 w-4" /> Exit Fullscreen</>
                  : <><ArrowsPointingOutIcon className="h-4 w-4" /> Fullscreen</>
                }
              </button>
            </div>
            <p className="text-slate-500 text-base leading-relaxed max-w-2xl">
              Extract {COLUMNS.length} columns from P&amp;ID drawings — including line designation segments,
              service codes, piping specification, and department deviation.
              Upload an optional legend sheet to resolve code descriptions per project.
            </p>
          </div>

          {/* ── Supported Formats Reference card ── */}
          <div className="rounded-2xl p-5 mb-4 ll-section" style={{
            background: 'rgba(254,243,199,0.65)',
            border: '1px solid rgba(217,119,6,0.2)',
            boxShadow: '0 2px 12px rgba(217,119,6,0.06)',
            animationDelay: '0.06s',
          }}>
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-lg">⚠️</span>
              <h3 className="text-sm font-semibold text-amber-800 tracking-wide">Supported Line Number Formats</h3>
              <span className="text-xs text-amber-600 italic ml-1">Upload drawings matching one of these formats only</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {FORMAT_EXAMPLES.map(f => (
                <div key={f.group} className="rounded-xl p-3" style={{
                  background: f.bg,
                  border: `1px solid ${f.border}`,
                }}>
                  <p className="text-xs font-bold mb-2" style={{ color: f.color }}>{f.group}</p>
                  {f.examples.map(ex => (
                    <p key={ex} className="font-mono text-xs text-slate-600 leading-relaxed">{ex}</p>
                  ))}
                  {f.note && (
                    <p className="text-[10px] mt-1.5 italic" style={{ color: f.color }}>{f.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Upload + Options Card ── */}
          <div className="rounded-2xl p-6 mb-4 ll-section" style={{
            background: 'white',
            border: '1px solid rgba(37,99,235,0.13)',
            boxShadow: '0 2px 16px rgba(37,99,235,0.07)',
            animationDelay: '0.12s',
          }}>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              }}>1</div>
              <h2 className="text-sm font-semibold text-slate-700 tracking-wide">Upload P&amp;ID Document</h2>
            </div>

            {/* Drop zone */}
            <div
              className="relative rounded-xl cursor-pointer overflow-hidden mb-5"
              style={{
                border: pidDocument ? '2px solid rgba(37,99,235,0.45)' : '2px dashed rgba(37,99,235,0.22)',
                background: pidDocument ? 'rgba(37,99,235,0.04)' : 'rgba(37,99,235,0.015)',
                minHeight: 136,
                transition: 'border-color 0.3s, background 0.3s',
              }}
              onClick={() => !isProcessing && pidRef.current?.click()}
            >
              {/* Corner brackets */}
              {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2',
                'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2',
              ].map((cls, i) => (
                <div key={i} className={`absolute ${cls} w-5 h-5 pointer-events-none`}
                  style={{ borderColor: 'rgba(37,99,235,0.32)' }} />
              ))}
              {!pidDocument && !isProcessing && <div className="ll-scan-line" />}
              <input ref={pidRef} type="file" accept=".pdf" onChange={handlePIDSelect} className="hidden" />
              <div className="flex flex-col items-center justify-center gap-3 py-8 px-6">
                {pidDocument ? (
                  <>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
                      background: 'rgba(37,99,235,0.09)',
                      border: '2px solid rgba(37,99,235,0.32)',
                      animation: 'll-glow 2.2s ease infinite',
                    }}>
                      <CheckCircleIcon className="h-7 w-7 text-blue-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-800 font-medium text-sm">{pidDocument.name}</p>
                      <p className="text-slate-400 text-xs mt-1">
                        {(pidDocument.size / 1024 / 1024).toFixed(2)} MB · Ready for extraction
                      </p>
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-semibold text-blue-700" style={{
                      background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.18)',
                    }}>✓ PDF Loaded</div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{
                      background: 'rgba(37,99,235,0.05)',
                      border: '1px solid rgba(37,99,235,0.13)',
                    }}>
                      <CloudArrowUpIcon className="h-8 w-8 text-blue-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-600 font-medium text-sm">Drop a P&amp;ID PDF or click to browse</p>
                      <p className="text-slate-400 text-xs mt-1">PDF only · Multi-page drawings supported</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Format options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                  Line Number Format
                </label>
                <select
                  value={formatType}
                  onChange={(e) => setFormatType(e.target.value)}
                  disabled={isProcessing}
                  className="w-full px-3 py-2.5 text-sm rounded-xl outline-none"
                  style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    color: '#334155',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={e  => { e.target.style.borderColor = 'rgba(37,99,235,0.45)'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={e   => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                >
                  {FORMAT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label} — {opt.hint}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <div
                  className="flex items-center gap-3 p-3.5 rounded-xl cursor-pointer w-full"
                  style={{
                    background: includeArea ? 'rgba(37,99,235,0.06)' : '#f8fafc',
                    border: includeArea ? '1px solid rgba(37,99,235,0.25)' : '1px solid #e2e8f0',
                    transition: 'all 0.2s',
                    opacity: isProcessing ? 0.5 : 1,
                    pointerEvents: isProcessing ? 'none' : 'auto',
                  }}
                  onClick={() => setIncludeArea(a => !a)}
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{
                    background: includeArea ? '#2563eb' : 'white',
                    border: includeArea ? 'none' : '2px solid #cbd5e1',
                    transition: 'all 0.2s',
                  }}>
                    {includeArea && (
                      <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">Include Area Code</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">SIZE&quot;-AREA-FLUID-SEQ-CLASS · General format only</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Legend Sheet Upload Card (optional) ── */}
          <div className="rounded-2xl p-6 mb-4 ll-section" style={{
            background: 'white',
            border: '1px solid rgba(16,185,129,0.18)',
            boxShadow: '0 2px 16px rgba(16,185,129,0.06)',
            animationDelay: '0.16s',
          }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              }}>2</div>
              <h2 className="text-sm font-semibold text-slate-700 tracking-wide">
                Upload Legend Sheet <span className="text-slate-400 font-normal">(optional)</span>
              </h2>
              <span className="text-[11px] text-emerald-700 ml-auto bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Adds service &amp; insulation descriptions
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Upload the project legend sheet (PDF) to resolve service codes, insulation classes, and piping spec descriptions.
              Each project may have different legend sheets — upload per extraction as needed.
            </p>

            <div
              className="relative rounded-xl cursor-pointer overflow-hidden"
              style={{
                border: legendDocument ? '2px solid rgba(16,185,129,0.5)' : '2px dashed rgba(16,185,129,0.25)',
                background: legendDocument ? 'rgba(16,185,129,0.04)' : 'rgba(16,185,129,0.01)',
                minHeight: 90,
                transition: 'border-color 0.3s, background 0.3s',
              }}
              onClick={() => !isProcessing && legendRef.current?.click()}
            >
              <input ref={legendRef} type="file" accept=".pdf" onChange={handleLegendSelect} className="hidden" />
              <div className="flex flex-col items-center justify-center gap-2 py-5 px-6">
                {legendDocument ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.35)' }}>
                        <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-slate-700 font-medium text-sm">{legendDocument.name}</p>
                        <p className="text-slate-400 text-xs">{(legendDocument.size / 1024).toFixed(0)} KB · Legend sheet ready</p>
                      </div>
                      <button
                        className="ml-4 text-xs text-red-400 hover:text-red-600"
                        onClick={e => { e.stopPropagation(); setLegendDocument(null); }}
                      >✕ Remove</button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">📋</span>
                    <p className="text-slate-500 text-sm">Drop legend sheet PDF or click to browse</p>
                    <p className="text-xs text-slate-400">Optional · Enables service &amp; insulation code descriptions</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex gap-3 mb-4 ll-section" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={handleExtract}
              disabled={!pidDocument || isProcessing}
              className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm relative overflow-hidden"
              style={!pidDocument || isProcessing ? {
                background: '#f1f5f9', color: '#94a3b8',
                cursor: 'not-allowed', border: '1px solid #e2e8f0',
              } : {
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: 'white', border: 'none',
                boxShadow: '0 4px 18px rgba(37,99,235,0.32)',
              }}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2.5">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24"
                    style={{ animation: 'll-spin-slow 1.2s linear infinite' }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-slate-400">Processing…</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">⚡ Extract Line List</span>
              )}
            </button>

            {extractedData && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm"
                style={{
                  background: 'rgba(37,99,235,0.07)',
                  color: '#1e40af',
                  border: '1px solid rgba(37,99,235,0.2)',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.08)',
                }}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download Excel
              </button>
            )}
          </div>

          {/* ── Progress ── */}
          {isProcessing && (
            <div className="rounded-2xl p-5 mb-4 ll-section" style={{
              background: 'white',
              border: '1px solid rgba(37,99,235,0.16)',
              boxShadow: '0 2px 12px rgba(37,99,235,0.07)',
              animationDelay: '0s',
            }}>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center" style={{
                  background: 'rgba(37,99,235,0.07)',
                  border: '2px solid rgba(37,99,235,0.2)',
                  animation: 'll-glow 1.7s ease infinite',
                }}>
                  <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5"
                    style={{ animation: 'll-spin-slow 3s linear infinite' }}>
                    <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round" />
                    <path d="M12 6v6l3 3" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700">{statusMessage || 'Processing…'}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 tabular-nums">⏱ {formatElapsed(elapsedSeconds)}</span>
                      <span className="text-sm font-bold text-blue-600">{progress}%</span>
                    </div>
                  </div>
                  <div className="relative w-full rounded-full h-2.5 overflow-hidden bg-slate-100">
                    <div className="h-full rounded-full relative overflow-hidden" style={{
                      width: `${Math.max(5, progress)}%`,
                      background: 'linear-gradient(90deg, #1d4ed8, #2563eb, #60a5fa)',
                      animation: 'll-bar-glow 1.6s ease infinite',
                      transition: 'width 0.7s ease',
                    }}>
                      <div className="absolute inset-0" style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
                        animation: 'll-shimmer 2s linear infinite',
                      }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">AI scanning document</span>
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-4 rounded-full bg-blue-400" style={{
                      animation: 'll-dot-wave 1.1s ease infinite',
                      animationDelay: `${i * 0.18}s`,
                    }} />
                  ))}
                </div>
                <span className="text-xs text-slate-400 max-w-sm text-right leading-relaxed">
                  {getPatienceMsg(elapsedSeconds)}
                </span>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="rounded-xl p-4 mb-4 flex items-start gap-3" style={{
              background: '#fef2f2',
              border: '1px solid rgba(239,68,68,0.2)',
              animation: 'll-fade-up 0.3s ease forwards',
            }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(239,68,68,0.12)' }}>
                <span className="text-red-500 text-xs font-bold">✕</span>
              </div>
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* ── Results Table ── */}
          {extractedData && (
            <div className="rounded-2xl overflow-hidden ll-section" style={{
              background: 'white',
              border: '1px solid rgba(37,99,235,0.1)',
              boxShadow: '0 4px 24px rgba(37,99,235,0.07)',
              animationDelay: '0s',
            }}>
              {/* Header bar */}
              <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3" style={{
                background: 'linear-gradient(90deg, rgba(37,99,235,0.05), rgba(37,99,235,0.02))',
                borderBottom: '1px solid rgba(37,99,235,0.09)',
              }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{
                    background: 'rgba(37,99,235,0.08)',
                    border: '1px solid rgba(37,99,235,0.16)',
                  }}>
                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-slate-800 font-semibold text-base">
                      <span className="text-blue-600 text-xl font-bold">{extractedData.total_lines}</span>
                      {' '}Lines ·{' '}
                      <span className="text-blue-600">{extractedData.columns}</span> Columns Extracted
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Format: {FORMAT_OPTIONS.find(f => f.value === formatType)?.label || formatType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { label: 'Lines',   val: extractedData.total_lines },
                    { label: 'Columns', val: extractedData.columns },
                  ].map(c => (
                    <div key={c.label} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{
                      background: 'rgba(37,99,235,0.07)',
                      border: '1px solid rgba(37,99,235,0.16)',
                      color: '#1e40af',
                    }}>
                      {c.val} {c.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr style={{ background: 'linear-gradient(90deg, #1e3a8a, #1d4ed8)' }}>
                      <th className="px-3 py-3.5 text-left text-xs font-medium text-blue-200 uppercase tracking-wider w-10">#</th>
                      {COLUMNS.map(col => (
                        <th key={col.key}
                          className="px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider"
                          style={{ whiteSpace: 'nowrap' }}>
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {extractedData.data.map((line, idx) => (
                      <tr
                        key={idx}
                        className="ll-row-animate"
                        style={{
                          animationDelay: `${Math.min(idx * 0.032, 0.5)}s`,
                          background: idx % 2 === 0 ? 'white' : '#f0f7ff',
                          borderBottom: '1px solid #f1f5f9',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,99,235,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#f0f7ff'}
                      >
                        <td className="px-3 py-3 text-xs text-slate-400">{idx + 1}</td>
                        {COLUMNS.map(col => {
                          const val = line[col.key];
                          const display = val || '—';
                          return (
                            <td key={col.key} className="px-4 py-3 text-sm">
                              {col.key === 'original_detection' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-semibold"
                                  style={{ background: 'rgba(37,99,235,0.07)', color: '#1e40af', border: '1px solid rgba(37,99,235,0.14)' }}>
                                  {display}
                                </span>
                              ) : (col.key === 'from' || col.key === 'to') ? (
                                <span className="text-xs text-slate-500 block truncate max-w-[11rem]" title={display}>{display}</span>
                              ) : (
                                <span className="text-slate-700">{display}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="px-6 py-3 flex items-center justify-between text-xs" style={{
                borderTop: '1px solid #f1f5f9', background: '#f8fafc',
              }}>
                <span className="text-slate-400">{extractedData.total_lines} total lines extracted</span>
                <span className="text-slate-400">AI-powered OCR · Computer Vision FROM-TO detection</span>
              </div>
            </div>
          )}

          {/* ── Info Panel (idle) ── */}
          {!extractedData && !isProcessing && (
            <div className="rounded-2xl p-6 mt-4 ll-section" style={{
              background: 'white',
              border: '1px solid rgba(37,99,235,0.1)',
              boxShadow: '0 2px 12px rgba(37,99,235,0.05)',
              animationDelay: '0.3s',
            }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-blue-500"
                  style={{ animation: 'll-pulse-badge 2s ease infinite' }} />
                <h3 className="text-sm font-semibold text-slate-700 tracking-wide">What Gets Extracted</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ['📄', 'P&ID Only',            'Upload a single P&ID PDF — no HMB, PMS, NACE or Stress docs needed'],
                  ['📊', `${COLUMNS.length} Base Columns`, COLUMNS.map(c => c.label).join(', ')],
                  ['�', 'Legend Sheet (optional)', 'Upload a project legend PDF to resolve service codes, insulation classes, and piping spec descriptions'],
                  ['�🔄', 'Background Processing', 'Job runs async on the server — no browser timeout. Progress polling every 3 s.'],
                  ['🧠', 'AI FROM-TO',            'Computer Vision + OpenAI detects flow direction for every line'],
                  ['⚡', 'Multi-Format Support',  FORMAT_OPTIONS.map(f => f.label).join(', ')],
                  ['📥', 'Excel Export',           'Download all extracted rows as a formatted XLSX workbook'],
                ].map(([icon, title, desc]) => (
                  <div key={title} className="flex items-start gap-3 p-3.5 rounded-xl" style={{
                    background: '#f8fafc', border: '1px solid #e2e8f0',
                  }}>
                    <span className="text-lg flex-shrink-0 leading-none mt-0.5">{icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-blue-700 mb-0.5">{title}</p>
                      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default LineList;
