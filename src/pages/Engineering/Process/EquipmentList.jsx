/**
 * Equipment List - P&ID Equipment Tag Extraction
 * Route:  /engineering/process/equipment-list
 * Module: pid_analysis (same access control as Line List)
 *
 * Mirrors LineList.jsx upload/poll/table/export pattern.
 * Soft-coded: COLUMNS array at top, timing constants below imports.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import { Boxes } from 'lucide-react';
import apiClient from '../../../services/api.service';
import * as XLSX from 'xlsx';
import { getApiBaseUrl } from '../../../config/environment.config';
import { STORAGE_KEYS } from '../../../config/app.config';

// ---------------------------------------------------------------------------
// Soft-coded column definitions — add/remove columns here only.
// key must match the backend response field name.
// ---------------------------------------------------------------------------
const COLUMNS = [
  { key: 'tag',              label: 'Tag Number',        width: 14 },
  { key: 'type_label',       label: 'Equipment Type',    width: 22 },
  { key: 'description',      label: 'Description',       width: 30 },
  { key: 'drawing_ref',      label: 'Drawing Reference', width: 22 },
  { key: 'line_connections', label: 'Line Connections',  width: 30, isArray: true },
  { key: 'service_fluid',    label: 'Service / Fluid',   width: 20 },
];

const UPLOAD_TIMEOUT_MS  = 600000;  // 10 min
const POLL_INTERVAL_MS   = 3000;
const POLL_MAX_WAIT_MS   = 3600000; // 60 min
const POLL_REQ_TIMEOUT   = 10000;
const MAX_POST_RETRIES   = 3;
const POST_RETRY_BASE_MS = 4000;

const API_BASE = getApiBaseUrl();

// ---------------------------------------------------------------------------
const EquipmentList = () => {
  const [file,           setFile]           = useState(null);
  const [isProcessing,   setIsProcessing]   = useState(false);
  const [progress,       setProgress]       = useState(0);
  const [statusMessage,  setStatusMessage]  = useState('');
  const [results,        setResults]        = useState(null);
  const [error,          setError]          = useState(null);
  const [sortCol,        setSortCol]        = useState('tag');
  const [sortAsc,        setSortAsc]        = useState(true);
  const [filterText,     setFilterText]     = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const fileRef      = useRef(null);
  const pollTimerRef = useRef(null);
  const pollStartRef = useRef(null);
  const elapsedRef   = useRef(null);

  // Elapsed timer
  useEffect(() => {
    if (isProcessing) {
      setElapsedSeconds(0);
      elapsedRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else {
      clearInterval(elapsedRef.current);
    }
    return () => clearInterval(elapsedRef.current);
  }, [isProcessing]);

  const formatElapsed = (s) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
      setError(null);
      setResults(null);
    } else {
      setError('Please select a valid PDF file');
    }
  };

  // Polling - used when server returns 202 + upload_id
  const pollStatus = useCallback((uploadId) => {
    if (Date.now() - pollStartRef.current > POLL_MAX_WAIT_MS) {
      clearTimeout(pollTimerRef.current);
      setError('Extraction timed out — please try again.');
      setIsProcessing(false);
      return;
    }
    apiClient
      .get(`/pid/equipment/status/${uploadId}/`, { timeout: POLL_REQ_TIMEOUT })
      .then(({ data }) => {
        const s = data.status;
        setProgress(data.progress || 0);
        setStatusMessage(data.message || 'Processing…');
        if (s === 'completed') {
          clearTimeout(pollTimerRef.current);
          apiClient.get(`/pid/equipment/results/${uploadId}/`)
            .then(({ data: r }) => {
              setResults({ equipment: r.equipment, total: r.total, drawing_ref: r.drawing_ref, upload_id: uploadId });
              setProgress(100);
              setStatusMessage('Extraction complete!');
              setIsProcessing(false);
            })
            .catch(() => {
              setError('Failed to load results. Please try again.');
              setIsProcessing(false);
            });
        } else if (s === 'failed') {
          clearTimeout(pollTimerRef.current);
          setError(data.message || 'Extraction failed on the server.');
          setIsProcessing(false);
        } else {
          pollTimerRef.current = setTimeout(() => pollStatus(uploadId), POLL_INTERVAL_MS);
        }
      })
      .catch(() => {
        pollTimerRef.current = setTimeout(() => pollStatus(uploadId), POLL_INTERVAL_MS * 2);
      });
  }, []);

  const handleExtract = async () => {
    if (!file) { setError('Please upload a P&ID document first'); return; }
    setIsProcessing(true);
    setError(null);
    setResults(null);
    setProgress(0);
    setStatusMessage('Uploading P&ID…');

    const formData = new FormData();
    formData.append('file', file);

    const token     = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const uploadUrl = `${API_BASE}/pid/equipment/analyze/`;
    let lastErr     = null;

    for (let attempt = 1; attempt <= MAX_POST_RETRIES; attempt++) {
      if (attempt > 1) {
        const delay = POST_RETRY_BASE_MS * Math.pow(2, attempt - 2);
        setStatusMessage(`Retrying (attempt ${attempt}/${MAX_POST_RETRIES})…`);
        await new Promise(r => setTimeout(r, delay));
      }
      setStatusMessage(attempt === 1 ? 'Uploading P&ID…' : `Sending (attempt ${attempt}/${MAX_POST_RETRIES})…`);

      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

      try {
        const resp = await fetch(uploadUrl, {
          method:  'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body:    formData,
          signal:  controller.signal,
        });
        clearTimeout(abortTimer);

        if (!resp.ok) {
          let detail = `HTTP ${resp.status}`;
          try { detail = (await resp.json()).error || detail; } catch (_) {}
          throw Object.assign(new Error(detail), { isHttpError: true });
        }

        const data = await resp.json();

        // Synchronous result (HTTP 200)
        if (data.success && data.equipment !== undefined) {
          setResults({ equipment: data.equipment, total: data.total, drawing_ref: data.drawing_ref, upload_id: data.upload_id });
          setProgress(100);
          setStatusMessage('Extraction complete!');
          setIsProcessing(false);
          return;
        }

        // Async result (HTTP 202 + upload_id)
        if (data.upload_id) {
          setStatusMessage('Processing in background…');
          pollStartRef.current = Date.now();
          pollStatus(data.upload_id);
          return;
        }

        throw new Error('Unexpected server response format.');

      } catch (err) {
        clearTimeout(abortTimer);
        lastErr = err;
        const retryable = err.name === 'AbortError' || (err instanceof TypeError && err.message.includes('fetch'));
        if (!retryable || attempt === MAX_POST_RETRIES) break;
      }
    }

    setError(
      lastErr?.name === 'AbortError'
        ? `Upload timed out after ${Math.round(UPLOAD_TIMEOUT_MS / 1000)}s. Please try again.`
        : lastErr?.message || 'Extraction failed — please try again.'
    );
    setIsProcessing(false);
  };

  // Sorted + filtered rows
  const displayRows = React.useMemo(() => {
    if (!results?.equipment) return [];
    let rows = [...results.equipment];

    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      rows = rows.filter(r =>
        COLUMNS.some(c => {
          const v = r[c.key];
          if (Array.isArray(v)) return v.some(s => String(s).toLowerCase().includes(q));
          return String(v || '').toLowerCase().includes(q);
        })
      );
    }

    rows.sort((a, b) => {
      let va = a[sortCol] ?? '';
      let vb = b[sortCol] ?? '';
      if (Array.isArray(va)) va = va.join(',');
      if (Array.isArray(vb)) vb = vb.join(',');
      const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
      return sortAsc ? cmp : -cmp;
    });

    return rows;
  }, [results, sortCol, sortAsc, filterText]);

  const handleSort = (key) => {
    if (sortCol === key) setSortAsc(a => !a);
    else { setSortCol(key); setSortAsc(true); }
  };

  const handleExport = () => {
    if (!displayRows.length) return;
    const wsData = [
      COLUMNS.map(c => c.label),
      ...displayRows.map(row =>
        COLUMNS.map(c => {
          const v = row[c.key];
          if (Array.isArray(v)) return v.join(', ') || '—';
          return v || '—';
        })
      ),
    ];
    const ws    = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = COLUMNS.map(c => ({ wch: c.width || 18 }));
    const wb    = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Equipment List');
    const fname = `${(results?.drawing_ref || 'equipment_list').replace(/[^\w\-]/g, '_')}_equipment_list.xlsx`;
    XLSX.writeFile(wb, fname);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Boxes className="h-8 w-8 text-emerald-600" />
            Equipment List
          </h1>
          <p className="mt-2 text-gray-600">
            Extract equipment tags (Vessels, Pumps, Heat Exchangers, Reactors…) from a P&amp;ID PDF
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Upload P&amp;ID Document</h2>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-emerald-400 transition-colors cursor-pointer"
            onClick={() => !isProcessing && fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-3">
              {file ? (
                <>
                  <CheckCircleIcon className="h-12 w-12 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">{file.name}</span>
                  <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-12 w-12 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Click to select P&amp;ID (PDF only)</span>
                  <span className="text-xs text-gray-500">Supports vector PDFs and scanned drawings</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleExtract}
            disabled={!file || isProcessing}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-all ${
              !file || isProcessing
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Extracting…
              </span>
            ) : 'Extract Equipment List'}
          </button>

          {results && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Download Excel
            </button>
          )}
        </div>

        {/* Progress */}
        {isProcessing && (
          <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">{statusMessage || 'Processing…'}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 tabular-nums">⏱ {formatElapsed(elapsedSeconds)}</span>
                <span className="text-sm font-medium text-emerald-600">{progress}%</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 font-medium">Error: {error}</p>
          </div>
        )}

        {/* Results Table */}
        {results && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {results.total} Equipment Item{results.total !== 1 ? 's' : ''} Found
                </h2>
                {results.drawing_ref && (
                  <p className="text-xs text-gray-500 mt-0.5">Drawing: {results.drawing_ref}</p>
                )}
              </div>
              <input
                type="text"
                placeholder="Filter by tag, type, fluid…"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-400 w-56"
              />
            </div>

            {displayRows.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500 text-sm">
                {filterText ? 'No items match your filter.' : 'No equipment items were extracted from this drawing.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-emerald-700">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-medium text-white uppercase tracking-wider w-10">#</th>
                      {COLUMNS.map(col => (
                        <th
                          key={col.key}
                          className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-emerald-600 select-none"
                          onClick={() => handleSort(col.key)}
                        >
                          {col.label}
                          {sortCol === col.key && <span className="ml-1">{sortAsc ? '▲' : '▼'}</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {displayRows.map((row, idx) => (
                      <tr key={row.tag} className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? '' : 'bg-emerald-50/30'}`}>
                        <td className="px-3 py-3 text-xs text-gray-400">{idx + 1}</td>
                        {COLUMNS.map(col => {
                          const v       = row[col.key];
                          const display = Array.isArray(v)
                            ? (v.length ? v.join(' · ') : '—')
                            : (v || '—');
                          return (
                            <td
                              key={col.key}
                              className={`px-4 py-3 text-sm ${col.key === 'tag' ? 'font-mono font-semibold text-emerald-700' : 'text-gray-700'} max-w-xs`}
                              title={Array.isArray(v) ? v.join(', ') : String(v || '')}
                            >
                              <span className="block truncate">{display}</span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <span>{filterText ? `${displayRows.length} of ${results.total} shown` : `${results.total} total items`}</span>
              <span>Click a column header to sort</span>
            </div>
          </div>
        )}

        {/* Info panel (idle state) */}
        {!results && !isProcessing && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-semibold text-emerald-900 mb-3">About Equipment List</h3>
            <ul className="space-y-2 text-emerald-800 text-sm">
              {[
                ['Tag Number',        'ISA-style tags extracted from OCR text (V-101, P-201A, E-302…)'],
                ['Equipment Type',    'Classified by tag prefix using a soft-coded lookup table (Vessel, Pump, Heat Exchanger…)'],
                ['Description',       'Token-based description extracted from context window around each tag'],
                ['Line Connections',  'Pipeline designation tokens found near the equipment tag'],
                ['Service / Fluid',   'Fluid/service keywords detected in the surrounding text'],
                ['Export',            'Download all rows as a formatted XLSX with column widths and alternate-row shading'],
              ].map(([title, desc]) => (
                <li key={title} className="flex items-start gap-2">
                  <span className="font-bold text-emerald-600">•</span>
                  <span><strong>{title}:</strong> {desc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
};

export default EquipmentList;
