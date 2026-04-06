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
  { key: 'tag',                label: 'Tag Number',          width: 14 },
  { key: 'type_label',         label: 'Equipment Type',      width: 22 },
  { key: 'description',        label: 'Description',         width: 30 },
  { key: 'area',               label: 'Area / Unit',         width: 15 },
  { key: 'drawing_ref',        label: 'Drawing Reference',   width: 22 },
  { key: 'line_connections',   label: 'Line Connections',    width: 30, isArray: true },
  { key: 'nozzle_connections', label: 'Nozzle Connections',  width: 18, isArray: true },
  { key: 'service_fluid',      label: 'Service / Fluid',     width: 20 },
  { key: 'material_class',     label: 'Material / Spec',     width: 16 },
  { key: 'process_notes',      label: 'Notes / Refs',        width: 20 },
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
    <>
      <style>{`
        @keyframes eq-scan-line {
          0%   { top: 0%;   opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes eq-float {
          0%, 100% { transform: translateY(0)    scale(1);   opacity: 0.18; }
          50%       { transform: translateY(-18px) scale(1.25); opacity: 0.42; }
        }
        @keyframes eq-glow-light {
          0%, 100% { box-shadow: 0 0 6px  rgba(5,150,105,0.18); }
          50%       { box-shadow: 0 0 18px rgba(5,150,105,0.38), 0 0 36px rgba(5,150,105,0.1); }
        }
        @keyframes eq-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes eq-row-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes eq-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes eq-bar-glow {
          0%, 100% { filter: brightness(1); }
          50%       { filter: brightness(1.2) drop-shadow(0 0 5px rgba(5,150,105,0.5)); }
        }
        @keyframes eq-dot-wave {
          0%, 100% { transform: scaleY(0.5); opacity: 0.4; }
          50%       { transform: scaleY(1.5); opacity: 1; }
        }
        @keyframes eq-spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes eq-pulse-badge {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
        .eq-scan-line {
          position: absolute; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, transparent, rgba(5,150,105,0.45), transparent);
          animation: eq-scan-line 3s ease-in-out infinite;
          pointer-events: none;
        }
        .eq-particle {
          position: absolute; border-radius: 50%;
          background: rgba(5,150,105,0.35);
          animation: eq-float ease-in-out infinite;
        }
        .eq-row-animate {
          animation: eq-row-in 0.3s ease forwards;
          opacity: 0;
        }
        .eq-section { animation: eq-fade-up 0.5s ease both; }
        .eq-filter-input::placeholder { color: #94a3b8; }
      `}</style>

      {/* Light gradient background */}
      <div className="min-h-screen relative overflow-x-hidden"
        style={{ background: 'linear-gradient(145deg, #f0fdf4 0%, #ecfdf5 40%, #f1f5f9 100%)' }}>

        {/* Subtle grid */}
        <div className="fixed inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(5,150,105,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(5,150,105,0.05) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }} />

        {/* Ambient particles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {[
            { l: '4%',  t: '18%', s: 4, d: '0s',   dur: '3.4s' },
            { l: '13%', t: '72%', s: 5, d: '0.7s', dur: '4.2s' },
            { l: '68%', t: '12%', s: 3, d: '1.1s', dur: '3.9s' },
            { l: '83%', t: '58%', s: 6, d: '0.3s', dur: '4.6s' },
            { l: '47%', t: '82%', s: 4, d: '1.8s', dur: '3.6s' },
            { l: '91%', t: '32%', s: 3, d: '2.0s', dur: '4.9s' },
            { l: '56%', t: '44%', s: 5, d: '0.5s', dur: '5.2s' },
          ].map((p, i) => (
            <div key={i} className="eq-particle" style={{
              left: p.l, top: p.t, width: p.s, height: p.s,
              animationDelay: p.d, animationDuration: p.dur,
            }} />
          ))}
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">

          {/* ── Header ── */}
          <div className="mb-8 eq-section" style={{ animationDelay: '0s' }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-4" style={{
              background: 'rgba(5,150,105,0.08)',
              border: '1px solid rgba(5,150,105,0.22)',
            }}>
              <span className="w-2 h-2 rounded-full bg-emerald-500"
                style={{ animation: 'eq-pulse-badge 2s ease infinite' }} />
              <span className="text-emerald-700 text-xs font-semibold tracking-widest uppercase">AI-Powered · P&amp;ID Analysis</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-4 mb-3">
              <div className="p-2.5 rounded-xl" style={{
                background: 'rgba(5,150,105,0.1)',
                border: '1px solid rgba(5,150,105,0.22)',
                animation: 'eq-glow-light 3s ease infinite',
              }}>
                <Boxes className="h-7 w-7 text-emerald-600" />
              </div>
              Equipment <span className="text-emerald-600 ml-2">List</span>
            </h1>
            <p className="text-slate-500 text-base leading-relaxed max-w-2xl">
              Automatically extract and classify equipment tags — Vessels, Pumps, Heat Exchangers, Reactors and more — from P&amp;ID drawings using AI vision
            </p>
          </div>

          {/* ── Upload Card ── */}
          <div className="rounded-2xl p-6 mb-4 eq-section" style={{
            background: 'white',
            border: '1px solid rgba(5,150,105,0.15)',
            boxShadow: '0 2px 16px rgba(5,150,105,0.07)',
            animationDelay: '0.08s',
          }}>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              }}>1</div>
              <h2 className="text-sm font-semibold text-slate-700 tracking-wide">Upload P&amp;ID Document</h2>
            </div>

            <div
              className="relative rounded-xl cursor-pointer overflow-hidden"
              style={{
                border: file ? '2px solid rgba(5,150,105,0.45)' : '2px dashed rgba(5,150,105,0.25)',
                background: file ? 'rgba(5,150,105,0.04)' : 'rgba(5,150,105,0.015)',
                minHeight: 148,
                transition: 'border-color 0.3s, background 0.3s',
              }}
              onClick={() => !isProcessing && fileRef.current?.click()}
            >
              {/* Corner brackets */}
              {[
                'top-0 left-0   border-t-2 border-l-2',
                'top-0 right-0  border-t-2 border-r-2',
                'bottom-0 left-0  border-b-2 border-l-2',
                'bottom-0 right-0 border-b-2 border-r-2',
              ].map((cls, i) => (
                <div key={i} className={`absolute ${cls} w-5 h-5 pointer-events-none`}
                  style={{ borderColor: 'rgba(5,150,105,0.35)' }} />
              ))}

              {/* Scan line (idle only) */}
              {!file && !isProcessing && <div className="eq-scan-line" />}

              <input ref={fileRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />

              <div className="flex flex-col items-center justify-center gap-3 py-9 px-6">
                {file ? (
                  <>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
                      background: 'rgba(5,150,105,0.1)',
                      border: '2px solid rgba(5,150,105,0.35)',
                      animation: 'eq-glow-light 2.2s ease infinite',
                    }}>
                      <CheckCircleIcon className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-800 font-medium text-sm">{file.name}</p>
                      <p className="text-slate-400 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready for extraction</p>
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-semibold text-emerald-700" style={{
                      background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)',
                    }}>
                      ✓ PDF Loaded
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{
                      background: 'rgba(5,150,105,0.06)',
                      border: '1px solid rgba(5,150,105,0.15)',
                    }}>
                      <CloudArrowUpIcon className="h-8 w-8 text-emerald-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-600 font-medium text-sm">Drop a P&amp;ID PDF or click to browse</p>
                      <p className="text-slate-400 text-xs mt-1">Supports vector PDFs and scanned drawings · Multi-angle text extraction</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex gap-3 mb-4 eq-section" style={{ animationDelay: '0.15s' }}>
            <button
              onClick={handleExtract}
              disabled={!file || isProcessing}
              className="flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm relative overflow-hidden"
              style={!file || isProcessing ? {
                background: '#f1f5f9',
                color: '#94a3b8',
                cursor: 'not-allowed',
                border: '1px solid #e2e8f0',
                transition: 'all 0.3s',
              } : {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: 'white',
                border: 'none',
                boxShadow: '0 4px 18px rgba(5,150,105,0.32)',
                transition: 'all 0.3s',
              }}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2.5">
                  <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24"
                    style={{ animation: 'eq-spin-slow 1.2s linear infinite' }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-slate-500">Extracting…</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 relative z-10">
                  <span>⚡</span> Extract Equipment List
                </span>
              )}
            </button>

            {results && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300"
                style={{
                  background: 'rgba(5,150,105,0.07)',
                  color: '#065f46',
                  border: '1px solid rgba(5,150,105,0.22)',
                  boxShadow: '0 2px 8px rgba(5,150,105,0.08)',
                }}
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download Excel
              </button>
            )}
          </div>

          {/* ── Progress ── */}
          {isProcessing && (
            <div className="rounded-2xl p-5 mb-4" style={{
              background: 'white',
              border: '1px solid rgba(5,150,105,0.18)',
              boxShadow: '0 2px 12px rgba(5,150,105,0.08)',
              animation: 'eq-fade-up 0.35s ease forwards',
            }}>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center" style={{
                  background: 'rgba(5,150,105,0.08)',
                  border: '2px solid rgba(5,150,105,0.22)',
                  animation: 'eq-glow-light 1.6s ease infinite',
                }}>
                  <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="1.5"
                    style={{ animation: 'eq-spin-slow 3s linear infinite' }}>
                    <path d="M12 2a10 10 0 1 0 10 10" strokeLinecap="round"/>
                    <path d="M12 6v6l3 3" strokeLinecap="round"/>
                  </svg>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-700">{statusMessage || 'Processing…'}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 tabular-nums">⏱ {formatElapsed(elapsedSeconds)}</span>
                      <span className="text-sm font-bold text-emerald-600">{progress}%</span>
                    </div>
                  </div>
                  <div className="relative w-full rounded-full h-2.5 overflow-hidden bg-slate-100">
                    <div className="h-full rounded-full relative overflow-hidden" style={{
                      width: `${Math.max(5, progress)}%`,
                      background: 'linear-gradient(90deg, #047857, #059669, #34d399)',
                      animation: 'eq-bar-glow 1.6s ease infinite',
                      transition: 'width 0.7s ease',
                    }}>
                      <div className="absolute inset-0" style={{
                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
                        animation: 'eq-shimmer 2s linear infinite',
                      }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs text-slate-400">AI scanning document</span>
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-1.5 h-4 rounded-full bg-emerald-400" style={{
                    animation: 'eq-dot-wave 1.1s ease infinite',
                    animationDelay: `${i * 0.18}s`,
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="rounded-xl p-4 mb-4 flex items-start gap-3" style={{
              background: '#fef2f2',
              border: '1px solid rgba(239,68,68,0.22)',
              animation: 'eq-fade-up 0.3s ease forwards',
            }}>
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: 'rgba(239,68,68,0.12)' }}>
                <span className="text-red-500 text-xs font-bold">✕</span>
              </div>
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* ── Results Table ── */}
          {results && (
            <div className="rounded-2xl overflow-hidden eq-section" style={{
              background: 'white',
              border: '1px solid rgba(5,150,105,0.12)',
              boxShadow: '0 4px 24px rgba(5,150,105,0.07)',
              animationDelay: '0s',
            }}>
              {/* Results header */}
              <div className="px-6 py-4 flex flex-wrap items-center justify-between gap-3" style={{
                background: 'linear-gradient(90deg, rgba(5,150,105,0.05), rgba(5,150,105,0.02))',
                borderBottom: '1px solid rgba(5,150,105,0.1)',
              }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{
                    background: 'rgba(5,150,105,0.08)',
                    border: '1px solid rgba(5,150,105,0.18)',
                  }}>
                    <Boxes className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-slate-800 font-semibold text-base">
                      <span className="text-emerald-600 text-xl font-bold">{results.total}</span>
                      {' '}Equipment Item{results.total !== 1 ? 's' : ''} Extracted
                    </h2>
                    {results.drawing_ref && (
                      <p className="text-slate-400 text-xs mt-0.5">Drawing: {results.drawing_ref}</p>
                    )}
                  </div>
                </div>

                {/* Filter input */}
                <div className="relative">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Filter by tag, type, fluid…"
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                    className="eq-filter-input pl-8 pr-3 py-2 text-sm rounded-lg outline-none w-56"
                    style={{
                      background: 'white',
                      border: '1px solid #e2e8f0',
                      color: '#334155',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(5,150,105,0.45)';
                      e.target.style.boxShadow   = '0 0 0 3px rgba(5,150,105,0.1)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow   = 'none';
                    }}
                  />
                </div>
              </div>

              {displayRows.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <p className="text-slate-400 text-sm">
                    {filterText ? 'No items match your filter.' : 'No equipment items were extracted from this drawing.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr style={{ background: 'linear-gradient(90deg, #065f46, #047857)' }}>
                        <th className="px-3 py-3.5 text-left text-xs font-medium text-emerald-200 uppercase tracking-wider w-10">#</th>
                        {COLUMNS.map(col => (
                          <th
                            key={col.key}
                            className="px-4 py-3.5 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer select-none"
                            style={{ transition: 'background 0.18s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            onClick={() => handleSort(col.key)}
                          >
                            <span className="flex items-center gap-1">
                              {col.label}
                              {sortCol === col.key && (
                                <span className="text-emerald-200">{sortAsc ? ' ↑' : ' ↓'}</span>
                              )}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {displayRows.map((row, idx) => (
                        <tr
                          key={row.tag}
                          className="eq-row-animate"
                          style={{
                            animationDelay: `${Math.min(idx * 0.035, 0.5)}s`,
                            background: idx % 2 === 0 ? 'white' : '#f0fdf4',
                            borderBottom: '1px solid #f1f5f9',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(5,150,105,0.05)'}
                          onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#f0fdf4'}
                        >
                          <td className="px-3 py-3 text-xs text-slate-400">{idx + 1}</td>
                          {COLUMNS.map(col => {
                            const v       = row[col.key];
                            const display = Array.isArray(v)
                              ? (v.length ? v.join(' · ') : '—')
                              : (v || '—');
                            return (
                              <td
                                key={col.key}
                                className={`px-4 py-3 text-sm max-w-xs ${col.key === 'tag' ? 'font-mono font-bold' : ''}`}
                                style={{ color: col.key === 'tag' ? '#065f46' : '#334155' }}
                                title={Array.isArray(v) ? v.join(', ') : String(v || '')}
                              >
                                {col.key === 'tag' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold"
                                    style={{ background: 'rgba(5,150,105,0.08)', color: '#065f46', border: '1px solid rgba(5,150,105,0.15)' }}>
                                    {display}
                                  </span>
                                ) : (
                                  <span className="block truncate">{display}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="px-6 py-3 flex items-center justify-between text-xs" style={{
                borderTop: '1px solid #f1f5f9',
                background: '#f8fafc',
              }}>
                <span className="text-slate-400">
                  {filterText ? `${displayRows.length} of ${results.total} shown` : `${results.total} total items`}
                </span>
                <span className="text-slate-400">↑↓ Click column header to sort</span>
              </div>
            </div>
          )}

          {/* ── Info Panel (idle) ── */}
          {!results && !isProcessing && (
            <div className="rounded-2xl p-6 mt-4 eq-section" style={{
              background: 'white',
              border: '1px solid rgba(5,150,105,0.12)',
              boxShadow: '0 2px 12px rgba(5,150,105,0.05)',
              animationDelay: '0.25s',
            }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500"
                  style={{ animation: 'eq-pulse-badge 2s ease infinite' }} />
                <h3 className="text-sm font-semibold text-slate-700 tracking-wide">What Gets Extracted</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  ['🏷️', 'Tag Number',          'ISA-style tags (V-101, P-201A, E-302…) extracted by regex'],
                  ['⚙️', 'Equipment Type',      'Classified by tag prefix via soft-coded lookup (Vessel, Pump, HE…)'],
                  ['📝', 'Description',         'Token-based description from context window around each tag'],
                  ['📍', 'Area / Unit',          'AREA / UNIT / TRAIN labels near the equipment tag'],
                  ['🔗', 'Line Connections',     'Pipeline designation tokens adjacent to the tag'],
                  ['🔩', 'Nozzle Connections',   'Nozzle tags (N1/N2/N3) referenced near equipment'],
                  ['💧', 'Service / Fluid',      'Fluid/service keywords (crude, gas, water…) in surrounding text'],
                  ['🧱', 'Material / Spec',      'Piping spec class codes (A1A, CS, SS, DSS…) visible on the drawing'],
                  ['📋', 'Notes / Refs',         'NOTE 1 / SEE NOTE 2 cross-references adjacent to the tag'],
                  ['🔄', 'Multi-Angle OCR',      'Extracts text at 0°, 90°, 180°, 270° — catches vertical pipe labels'],
                ].map(([icon, title, desc]) => (
                  <div key={title} className="flex items-start gap-3 p-3.5 rounded-xl" style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}>
                    <span className="text-lg flex-shrink-0 leading-none mt-0.5">{icon}</span>
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 mb-0.5">{title}</p>
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

export default EquipmentList;
