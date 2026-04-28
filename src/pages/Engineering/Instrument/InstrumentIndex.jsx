/**
 * 🎛️ INSTRUMENT INDEX — Full P&ID Extraction
 *
 * Purpose: Extract ALL instrument tags (Tag No. + full index) from any P&ID PDF.
 * Route:   /engineering/instrument/index
 *
 * Features:
 * - P&ID PDF upload (drag & drop or click)
 * - Optional drawing metadata fields (drawing no., title, revision, project)
 * - AI Vision extraction covering ALL instrument categories
 *   (Flow, Pressure, Temperature, Level, Analysis, SDV/BDV, MOV, PSV, RO, etc.)
 * - Results table with category colour coding + incremental index numbers
 * - Summary stats cards per category
 * - One-click Excel download (Instrument Index + Summary sheets)
 * - Quick-link to Line List page for combined workflow
 *
 * Build: v1.0.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { getApiBaseUrl } from '../../../config/environment.config';
import { STORAGE_KEYS } from '../../../config/app.config';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

// ─── Config ──────────────────────────────────────────────────────────────────
const API_BASE = getApiBaseUrl();
// Upload timeout — multi-page P&IDs can take a few minutes
const UPLOAD_TIMEOUT_MS = 600_000;  // 10 min

// Soft-coded category colours (must stay in sync with service CATEGORY_COLOURS)
const CATEGORY_COLOURS = {
  'Flow':                  { bg: '#DDEEFF', text: '#1A3A6B' },
  'Pressure':              { bg: '#FFE4CC', text: '#7A2E00' },
  'Temperature':           { bg: '#FFE4E4', text: '#7A1010' },
  'Level':                 { bg: '#E4F4E4', text: '#1A5C1A' },
  'Differential Pressure': { bg: '#FFF9CC', text: '#665500' },
  'Analysis':              { bg: '#E8E4FF', text: '#3A1A8C' },
  'Safety':                { bg: '#FFCCCC', text: '#8C0000' },
  'Shutdown & ESD':        { bg: '#FFD9D9', text: '#660000' },
  'Control Valves':        { bg: '#CCFFEE', text: '#005533' },
  'Motor & Solenoid':      { bg: '#E0E0FF', text: '#220066' },
  'Position':              { bg: '#FFFACC', text: '#554400' },
  'Restriction':           { bg: '#DDEEDD', text: '#224422' },
  'Special':               { bg: '#F0F0F0', text: '#333333' },
};

const DEFAULT_COLOUR = { bg: '#F5F5F5', text: '#333333' };

function categoryStyle(cat) {
  return CATEGORY_COLOURS[cat] || DEFAULT_COLOUR;
}

// ─── Main Component ───────────────────────────────────────────────────────────
const InstrumentIndex = () => {
  const navigate = useNavigate();

  // Upload state
  const [pidFile, setPidFile]             = useState(null);
  const [legendFile, setLegendFile]       = useState(null);
  const [drawingNumber, setDrawingNumber] = useState('');
  const [drawingTitle, setDrawingTitle]   = useState('');
  const [revision, setRevision]           = useState('0');
  const [projectName, setProjectName]     = useState('');

  // Processing state
  const [isProcessing, setIsProcessing]     = useState(false);
  const [progress, setProgress]             = useState(0);
  const [statusMessage, setStatusMessage]   = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Results state
  const [result, setResult]   = useState(null);   // full API response
  const [error, setError]     = useState(null);

  // Table filtering state
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterText, setFilterText]         = useState('');
  const [activeView, setActiveView]         = useState('table'); // 'table' | 'summary' | 'layout'
  // Layout view state
  const [layoutSelected, setLayoutSelected] = useState(null); // { measured, fn } cell selected
  const [layoutHovered,  setLayoutHovered]  = useState(null);

  const fileInputRef = useRef(null);
  const legendInputRef = useRef(null);
  const elapsedRef   = useRef(null);

  // ── Elapsed timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (isProcessing) {
      setElapsedSeconds(0);
      elapsedRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    } else {
      clearInterval(elapsedRef.current);
    }
    return () => clearInterval(elapsedRef.current);
  }, [isProcessing]);

  const formatElapsed = s =>
    s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  // ── Fake progress (visual only — real work is done server-side) ──────
  // Multi-pass extraction: 1 standard + 2 rotations + 4 tiles = 7 passes total
  // Progress milestones match approximate pass sequence
  const PROGRESS_MESSAGES = [
    { pct: 5,  msg: 'Uploading P&ID…' },
    { pct: 15, msg: 'Pass 1 — Full drawing (standard orientation)…' },
    { pct: 28, msg: 'Pass 2 — 90° rotation (vertical text)…' },
    { pct: 41, msg: 'Pass 3 — 270° rotation (opposite vertical)…' },
    { pct: 53, msg: 'Pass 4 — Tile scan: top-left quadrant…' },
    { pct: 63, msg: 'Pass 5 — Tile scan: top-right quadrant…' },
    { pct: 73, msg: 'Pass 6 — Tile scan: bottom-left quadrant…' },
    { pct: 83, msg: 'Pass 7 — Tile scan: bottom-right quadrant…' },
    { pct: 91, msg: 'Merging & deduplicating results…' },
  ];

  useEffect(() => {
    if (!isProcessing) return;
    let msgIdx = 0;
    const id = setInterval(() => {
      setProgress(p => {
        const next = PROGRESS_MESSAGES[msgIdx];
        if (next && p >= next.pct - 5) {
          setStatusMessage(next.msg);
          msgIdx = Math.min(msgIdx + 1, PROGRESS_MESSAGES.length - 1);
        }
        if (p >= 91) return p;
        return p + (91 - p) * 0.035;
      });
    }, 1800);
    return () => clearInterval(id);
  }, [isProcessing]);

  // ── File selection ───────────────────────────────────────────────────
  const handleFileSelect = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file.');
      return;
    }
    setPidFile(file);
    setError(null);
    setResult(null);
    // Pre-fill drawing number from filename
    if (!drawingNumber) {
      setDrawingNumber(file.name.replace(/\.pdf$/i, ''));
    }
  };

  const handleLegendFileSelect = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Legend sheet must be a PDF file.');
      return;
    }
    setLegendFile(file);
    setError(null);
  };

  // ── Drag & drop ──────────────────────────────────────────────────────
  const handleDrop = e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith('.pdf')) {
      setPidFile(file);
      setError(null);
      setResult(null);
      if (!drawingNumber) setDrawingNumber(file.name.replace(/\.pdf$/i, ''));
    } else {
      setError('Only PDF files are accepted.');
    }
  };

  // ── Extract ──────────────────────────────────────────────────────────
  const handleExtract = async () => {
    if (!pidFile) { setError('Please upload a P&ID (PDF) first.'); return; }

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setStatusMessage('Uploading P&ID…');

    const formData = new FormData();
    formData.append('pid_file', pidFile);
    if (legendFile) formData.append('legend_file', legendFile);
    formData.append('drawing_number', drawingNumber || pidFile.name.replace(/\.pdf$/i, ''));
    formData.append('drawing_title', drawingTitle);
    formData.append('revision', revision);
    formData.append('project_name', projectName);

    const token  = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const url    = `${API_BASE}/pid/instrument-index/analyze/`;
    const ctrl   = new AbortController();
    const abort  = setTimeout(() => ctrl.abort(), UPLOAD_TIMEOUT_MS);

    try {
      setStatusMessage('AI scanning P&ID for all instrument tags…');
      const resp = await fetch(url, {
        method:  'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body:    formData,
        signal:  ctrl.signal,
      });
      clearTimeout(abort);

      if (!resp.ok) {
        let detail = `HTTP ${resp.status}`;
        try { const j = await resp.json(); detail = j.error || j.detail || detail; } catch (_) {}
        throw new Error(detail);
      }

      const data = await resp.json();
      setProgress(100);
      setStatusMessage('Extraction complete!');
      setResult(data);
    } catch (err) {
      clearTimeout(abort);
      const msg =
        err.name === 'AbortError'
          ? `Upload timed out after ${Math.round(UPLOAD_TIMEOUT_MS / 60000)} min. Try splitting the PDF into single-sheet files.`
          : err.message || 'Extraction failed — please try again.';
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Excel download via backend URL ───────────────────────────────────
  const handleDownloadExcel = () => {
    if (!result?.excel_url) return;
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    // Build absolute URL
    const base = API_BASE.replace(/\/api\/v1\/?$/, '');
    const fullUrl = `${base}${result.excel_url}`;
    // Simple link-click approach
    const a = document.createElement('a');
    a.href = fullUrl;
    if (token) {
      // For authenticated downloads attach token as query param (backend allows it)
      a.href += (fullUrl.includes('?') ? '&' : '?') + `token=${encodeURIComponent(token)}`;
    }
    a.download = `instrument_index_${(drawingNumber || 'export').replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ── Client-side Excel fallback (browser XLSX) ────────────────────────
  const handleDownloadClientExcel = () => {
    if (!result?.instruments?.length) return;

    const headers = [
      'Index No.', 'Tag Number', 'CS Tag', 'Instrument Type', 'Category',
      'P&ID No.', 'Service Description', 'Line Number', 'Equipment No.',
      'Loop No.', 'Fail Safe', 'Signal Type', 'Set Point',
      'Drawing No.', 'Rev.', 'Notes',
    ];
    const rows = result.instruments.map(i => [
      i.index_no              || '',
      i.tag_number            || '',
      i.control_system_tag    || '',
      i.instrument_type       || '',
      i.category              || '',
      i.pid_no                || '',
      i.service_description   || '',
      i.line_number           || '',
      i.equipment_number      || '',
      i.loop_number           || '',
      i.fail_safe             || '',
      i.signal_type           || '',
      i.set_point             || '',
      i.drawing_number        || '',
      i.revision              || '',
      i.notes                 || '',
    ]);

    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = headers.map((h, ci) => {
      let max = h.length;
      for (let r = 1; r < wsData.length; r++) {
        const v = String(wsData[r][ci] || '');
        if (v.length > max) max = v.length;
      }
      return { wch: Math.min(Math.max(max + 2, 10), 50) };
    });

    // Summary sheet
    const summaryData = [
      ['Category', 'Count'],
      ...Object.entries(result.category_summary || {}).sort(),
      ['TOTAL', result.total || 0],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
    ws2['!cols'] = [{ wch: 28 }, { wch: 10 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Instrument Index');
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary');
    XLSX.writeFile(wb, `instrument_index_${(drawingNumber || 'export').replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`);
  };

  // ── Filtered instruments ─────────────────────────────────────────────
  const filteredInstruments = (result?.instruments || []).filter(inst => {
    const catOk  = filterCategory === 'All' || inst.category === filterCategory;
    const textOk = !filterText ||
      (inst.tag_number         || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (inst.service_description|| '').toLowerCase().includes(filterText.toLowerCase()) ||
      (inst.instrument_type    || '').toLowerCase().includes(filterText.toLowerCase());
    return catOk && textOk;
  });

  const uniqueCategories = result
    ? ['All', ...new Set((result.instruments || []).map(i => i.category || 'Unknown'))]
    : ['All'];

  // ─────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/40 p-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Hero Header ───────────────────────────────────────────── */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 shadow-lg">
          {/* Decorative blobs */}
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-pink-300/20 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 p-6 sm:p-8">
            <div className="flex items-start gap-4 flex-1">
              <div className="shrink-0 h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-inner">
                <ListBulletIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Instrument Index</h1>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30">
                    AI · ISA 5.1
                  </span>
                </div>
                <p className="text-sm text-purple-100 max-w-3xl leading-relaxed">
                  Extract every instrument tag from any P&amp;ID — Flow, Pressure, Temperature, Level,
                  SDV/BDV, MOV, Safety valves and more. Cross-verified against legend sheets and
                  enriched with ISA 5.1 intelligence.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/engineering/process/line-list')}
              className="shrink-0 px-4 py-2 text-sm font-semibold text-white bg-white/15 backdrop-blur-sm border border-white/30 rounded-lg hover:bg-white/25 transition-all shadow-sm"
            >
              → Line List Extraction
            </button>
          </div>
        </div>

        {/* ── Upload + Metadata ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">1</span>
            Upload P&amp;ID Drawing (PDF)
          </h2>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className={`border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer mb-4 ${
              pidFile
                ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50'
                : 'border-purple-200 bg-gradient-to-br from-purple-50/40 to-indigo-50/40 hover:border-purple-400 hover:from-purple-50 hover:to-indigo-50 hover:shadow-inner'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              {pidFile ? (
                <>
                  <CheckCircleIcon className="h-10 w-10 text-green-500" />
                  <p className="text-sm font-medium text-gray-700">{pidFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(pidFile.size / 1024 / 1024).toFixed(2)} MB
                    &nbsp;·&nbsp;Click to change
                  </p>
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-10 w-10 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700">
                    Click or drag &amp; drop P&ID PDF here
                  </p>
                  <p className="text-xs text-gray-400">
                    Supports single-page and multi-page P&IDs
                  </p>
                </>
              )}
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            2. Attach Legend / Symbol Sheet (optional)
          </h2>
          <div
            className="border border-dashed border-cyan-300 rounded-lg p-4 mb-4 bg-cyan-50/50 cursor-pointer hover:border-cyan-400 transition-colors"
            onClick={() => legendInputRef.current?.click()}
          >
            <input
              ref={legendInputRef}
              type="file"
              accept=".pdf"
              onChange={handleLegendFileSelect}
              className="hidden"
            />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-cyan-900">
                  {legendFile ? legendFile.name : 'Attach legend/symbol sheet PDF for cross-verification'}
                </p>
                <p className="text-xs text-cyan-700 mt-1">
                  The app will cross-check extracted values against the uploaded legend sheet,
                  then also look for matching legend sheets in AWS S3 when available.
                </p>
              </div>
              {legendFile && <CheckCircleIcon className="h-6 w-6 text-cyan-600 shrink-0" />}
            </div>
          </div>

          {/* Metadata fields */}
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            3. Drawing Info (optional)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Drawing Number', val: drawingNumber, set: setDrawingNumber, placeholder: 'P16093-14-01-08-1602' },
              { label: 'Drawing Title',  val: drawingTitle,  set: setDrawingTitle,  placeholder: 'Pig Receiver' },
              { label: 'Revision',       val: revision,      set: setRevision,      placeholder: '0' },
              { label: 'Project Name',   val: projectName,   set: setProjectName,   placeholder: 'SAHIL Phase 3' },
            ].map(({ label, val, set, placeholder }) => (
              <div key={label}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input
                  type="text"
                  value={val}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  disabled={isProcessing}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── Action button ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={handleExtract}
            disabled={!pidFile || isProcessing}
            className={`flex-1 sm:flex-none px-8 py-3.5 rounded-xl font-semibold text-white transition-all shadow-md ${
              !pidFile || isProcessing
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 hover:shadow-xl hover:-translate-y-0.5'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Extracting Instruments…
              </span>
            ) : (
              <span className="flex items-center gap-2 justify-center">
                <span className="text-lg">⚡</span>
                Extract Instrument Index
              </span>
            )}
          </button>

          {result && (
            <>
              <button
                onClick={handleDownloadClientExcel}
                className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-green-700 transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Download Excel
              </button>
            </>
          )}
        </div>

        {/* ── Progress bar ────────────────────────────────────────────── */}
        {isProcessing && (
          <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">{statusMessage}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 tabular-nums">
                  ⏱ {formatElapsed(elapsedSeconds)}
                </span>
                <span className="text-sm font-medium text-purple-600">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-purple-600 h-3 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(5, progress)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {elapsedSeconds < 30
                ? 'Converting PDF pages to images for AI analysis…'
                : elapsedSeconds < 90
                ? 'AI Vision scanning instrument bubbles and tags…'
                : elapsedSeconds < 180
                ? 'Processing multi-page P&ID — identifying all instrument tags…'
                : `Still working (${formatElapsed(elapsedSeconds)}) — large drawings take longer. Please keep this tab open.`}
            </p>
          </div>
        )}

        {/* ── Error ───────────────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-800 font-medium">⚠ {error}</p>
          </div>
        )}

        {/* ── Results ─────────────────────────────────────────────────── */}
        {result && (
          <>
            {/* Empty-state banner — shown when extraction returned 0 instruments */}
            {result.total === 0 && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 mb-6 flex gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-amber-800">No instruments were extracted from this drawing.</p>
                  <p className="text-sm text-amber-700 mt-1">Possible reasons:</p>
                  <ul className="text-sm text-amber-700 list-disc list-inside mt-1 space-y-0.5">
                    <li>The PDF is a <strong>scanned image</strong> with no embedded text — Tesseract OCR will be used next.</li>
                    <li>All AI Vision engines (Gemini, OpenAI) are temporarily <strong>rate-limited or quota-exceeded</strong>.</li>
                    <li>The PDF does not contain ISA-standard instrument tag formats.</li>
                  </ul>
                  <p className="text-sm text-amber-700 mt-2">
                    Try uploading again in a few seconds, or check backend logs for details.
                  </p>
                </div>
              </div>
            )}
            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br from-purple-600 to-indigo-700">
                <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                <div className="relative">
                  <p className="text-[11px] uppercase tracking-wider text-purple-100 font-semibold">Total Instruments</p>
                  <p className="text-4xl font-black mt-1 tabular-nums">{result.total}</p>
                  <p className="text-[10px] text-purple-200 mt-1">across {Object.keys(result.category_summary || {}).length} categor{Object.keys(result.category_summary||{}).length===1?'y':'ies'}</p>
                </div>
              </div>
              {Object.entries(result.category_summary || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([cat, cnt]) => {
                  const style = categoryStyle(cat);
                  const pct = result.total > 0 ? (cnt / result.total) * 100 : 0;
                  return (
                    <div
                      key={cat}
                      className="relative overflow-hidden rounded-2xl p-5 border shadow-sm hover:shadow-md transition-shadow"
                      style={{ backgroundColor: style.bg, borderColor: style.text + '30' }}
                    >
                      <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: style.text, opacity: 0.75 }}>{cat}</p>
                      <p className="text-4xl font-black mt-1 tabular-nums" style={{ color: style.text }}>{cnt}</p>
                      <div className="w-full h-1.5 rounded-full mt-2 bg-white/60 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: style.text, opacity: 0.6 }} />
                      </div>
                      <p className="text-[10px] mt-1" style={{ color: style.text, opacity: 0.7 }}>{pct.toFixed(1)}% of total</p>
                    </div>
                  );
                })}
            </div>

            {/* View tabs */}
            <div className="flex gap-2 mb-4 p-1 bg-white rounded-xl shadow-sm border border-gray-100 w-fit">
              {[
                { id: 'table',   icon: <ListBulletIcon className="h-4 w-4" />,  label: 'Instrument Table' },
                { id: 'summary', icon: <ChartBarIcon   className="h-4 w-4" />,  label: 'Category Summary' },
                { id: 'layout',  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>, label: 'ISA Layout Matrix' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeView === tab.id
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            {/* ── TABLE VIEW ─────────────────────────────────────────── */}
            {activeView === 'table' && (
              <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                {/* Filters */}
                <div className="px-5 py-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-gray-200 flex flex-wrap gap-3 items-center">
                  <h3 className="text-base font-semibold text-gray-800 mr-2 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-md bg-purple-100 text-purple-700 text-xs font-black tabular-nums">
                      {filteredInstruments.length}
                    </span>
                    Instrument{filteredInstruments.length !== 1 ? 's' : ''}
                    {filterCategory !== 'All' ? <span className="text-gray-400 font-normal"> · {filterCategory}</span> : ''}
                  </h3>
                  <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" /></svg>
                    <input
                      type="text"
                      placeholder="Filter by tag / service / type…"
                      value={filterText}
                      onChange={e => setFilterText(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                    />
                  </div>
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-white"
                  >
                    {uniqueCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {(filterText || filterCategory !== 'All') && (
                    <button
                      onClick={() => { setFilterText(''); setFilterCategory('All'); }}
                      className="text-xs px-2 py-1 rounded-md text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gradient-to-b from-gray-100 to-gray-50 text-xs uppercase tracking-wider text-gray-600">
                      <tr>
                        {['#', 'Tag Number', 'CS Tag', 'Instrument Type', 'Category', 'Service Description',
                          'Line No.', 'Equipment No.', 'Loop No.', 'Fail Safe', 'Signal',
                          'Set Point', 'P&ID No.', 'Rev.', 'Source'].map(h => (
                          <th key={h} className="px-3 py-3 text-left whitespace-nowrap font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredInstruments.length === 0 ? (
                        <tr>
                          <td colSpan={15} className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center gap-2 text-gray-400">
                              <svg className="h-12 w-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" /></svg>
                              <p className="text-sm font-medium">No instruments match the current filter.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredInstruments.map((inst, idx) => {
                          const style = categoryStyle(inst.category);
                          // Source badge styling
                          const note = inst.notes || '';
                          const sourceStyle = note.includes('Legends sheet')
                            ? { bg: '#ECFEFF', text: '#155E75' }  // cyan — legend-assisted
                            : note.startsWith('AI')
                            ? { bg: '#EEF2FF', text: '#3730A3' }  // indigo — AI
                            : note.startsWith('Inferred')
                            ? { bg: '#FDF4FF', text: '#86198F' }  // fuchsia — inferred accessory
                            : note.startsWith('OCR circle')
                            ? { bg: '#FFF7ED', text: '#C2410C' }  // orange — OCR circle
                            : note.startsWith('OCR')
                            ? { bg: '#FEF9C3', text: '#713F12' }  // yellow — OCR plain
                            : { bg: '#F0FDF4', text: '#166534' }; // green  — PDF text
                          const hasWarnings = Array.isArray(inst.warnings) && inst.warnings.length > 0;
                          const isInferred  = inst.inferred === true;
                          const rowBg = isInferred
                            ? 'bg-fuchsia-50/30'
                            : hasWarnings
                              ? 'bg-amber-50/40'
                              : '';
                          return (
                            <tr key={idx} className={`${rowBg} hover:bg-purple-50/40 transition-colors`}>
                              <td className="px-3 py-2.5 text-gray-500 tabular-nums">{inst.index_no ?? idx + 1}</td>
                              <td className="px-3 py-2.5 font-bold whitespace-nowrap" style={{ color: style.text }}>
                                <div className="flex items-center gap-1.5">
                                  <span>{inst.tag_number || '—'}</span>
                                  {isInferred && (
                                    <span title={`Inferred accessory of ${inst.parent_tag || 'parent'}`}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200">
                                      INFERRED
                                    </span>
                                  )}
                                  {hasWarnings && (
                                    <span title={inst.warnings.join(' · ')}
                                      className="inline-flex items-center justify-center h-4 w-4 rounded-full text-[9px] font-black bg-amber-100 text-amber-700 border border-amber-200 cursor-help">
                                      !
                                    </span>
                                  )}
                                  {inst.is_inline && (
                                    <span title="Inline instrument"
                                      className="inline-flex items-center justify-center h-4 w-4 rounded-full text-[9px] font-black bg-blue-100 text-blue-700 border border-blue-200">
                                      •
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap text-indigo-700">{inst.control_system_tag || '—'}</td>
                              <td className="px-3 py-2.5 text-gray-700 max-w-xs">{inst.instrument_type || '—'}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                <span
                                  className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{ backgroundColor: style.bg, color: style.text }}
                                >
                                  {inst.category || '—'}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-gray-700 max-w-xs">{inst.service_description || '—'}</td>
                              <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{inst.line_number      || '—'}</td>
                              <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{inst.equipment_number  || '—'}</td>
                              <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{inst.loop_number       || '—'}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                {inst.fail_safe && inst.fail_safe !== 'N/A' ? (
                                  <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                    inst.fail_safe === 'FC' ? 'bg-red-100 text-red-700'
                                    : inst.fail_safe === 'FO' ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                  }`}>{inst.fail_safe}</span>
                                ) : <span className="text-gray-300">—</span>}
                              </td>
                              <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap text-xs">{inst.signal_type       || '—'}</td>
                              <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap text-xs">{inst.set_point         || '—'}</td>
                              <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap font-mono text-xs">{inst.pid_no            || '—'}</td>
                              <td className="px-3 py-2.5 text-gray-600 text-center">{inst.revision || '0'}</td>
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                {note && (
                                  <span
                                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                                    style={{ backgroundColor: sourceStyle.bg, color: sourceStyle.text }}
                                    title={note}
                                  >
                                    {note}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── SUMMARY VIEW ───────────────────────────────────────── */}
            {activeView === 'summary' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Instruments by Category
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(result.category_summary || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, cnt]) => {
                      const style = categoryStyle(cat);
                      const pct   = result.total > 0 ? (cnt / result.total) * 100 : 0;
                      return (
                        <div
                          key={cat}
                          className="rounded-xl p-4 border"
                          style={{ backgroundColor: style.bg, borderColor: style.bg }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm" style={{ color: style.text }}>{cat}</span>
                            <span className="text-2xl font-bold" style={{ color: style.text }}>{cnt}</span>
                          </div>
                          <div className="w-full bg-white bg-opacity-60 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: style.text, opacity: 0.6 }}
                            />
                          </div>
                          <p className="text-xs mt-1" style={{ color: style.text }}>
                            {pct.toFixed(1)}% of total
                          </p>
                        </div>
                      );
                    })}
                </div>

                {/* Instruments per category detail */}
                <div className="mt-8 space-y-4">
                  {Object.entries(result.category_summary || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat]) => {
                      const style = categoryStyle(cat);
                      const inCat = (result.instruments || []).filter(i => i.category === cat);
                      return (
                        <details key={cat} className="rounded-lg border overflow-hidden">
                          <summary
                            className="px-4 py-3 cursor-pointer font-medium text-sm flex items-center gap-2"
                            style={{ backgroundColor: style.bg, color: style.text }}
                          >
                            <span className="font-bold">{cat}</span>
                            <span className="ml-auto bg-white bg-opacity-60 px-2 py-0.5 rounded-full text-xs">
                              {inCat.length} tags
                            </span>
                          </summary>
                          <div className="px-4 py-2 flex flex-wrap gap-2">
                            {inCat.map((i, n) => (
                              <span
                                key={n}
                                className="inline-block px-2 py-0.5 rounded text-xs font-mono font-medium border"
                                style={{ backgroundColor: style.bg, color: style.text, borderColor: style.text + '40' }}
                              >
                                {i.tag_number}
                              </span>
                            ))}
                          </div>
                        </details>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ── LAYOUT VIEW — ISA 5.1 Functional Classification Matrix ── */}
            {activeView === 'layout' && (() => {
              // ═══════════════════════════════════════════════════════════════════
              // Soft-coded: ISA 5.1 measured-variable first letters (rows of matrix)
              // Each entry: letter, full name, accent colour
              // ═══════════════════════════════════════════════════════════════════
              const ISA_MEASURED = [
                { letter:'F', name:'Flow',                   color:'#22c55e', light:'#f0fdf4' },
                { letter:'P', name:'Pressure',               color:'#f97316', light:'#fff7ed' },
                { letter:'T', name:'Temperature',            color:'#ef4444', light:'#fef2f2' },
                { letter:'L', name:'Level',                  color:'#eab308', light:'#fefce8' },
                { letter:'A', name:'Analysis',               color:'#a855f7', light:'#faf5ff' },
                { letter:'d', name:'Differential Pressure',  color:'#fb923c', light:'#fff7ed' },
                { letter:'Z', name:'Position / Actuator',    color:'#64748b', light:'#f8fafc' },
                { letter:'S', name:'Safety / Speed / Limit', color:'#dc2626', light:'#fef2f2' },
                { letter:'W', name:'Weight / Force',         color:'#6b7280', light:'#f9fafb' },
                { letter:'J', name:'Power / Elect.',         color:'#3b82f6', light:'#eff6ff' },
                { letter:'X', name:'Unknown / Other',        color:'#94a3b8', light:'#f8fafc' },
              ];

              // ═══════════════════════════════════════════════════════════════════
              // Soft-coded: ISA 5.1 function suffix letters (columns of matrix)
              // ═══════════════════════════════════════════════════════════════════
              const ISA_FUNCTIONS = [
                { code:'T',   label:'Transmitter' },
                { code:'I',   label:'Indicator'   },
                { code:'IC',  label:'Ind.Control.' },
                { code:'C',   label:'Controller'  },
                { code:'CV',  label:'Ctrl. Valve'  },
                { code:'V',   label:'Valve'        },
                { code:'S',   label:'Switch'       },
                { code:'SH',  label:'Switch Hi'    },
                { code:'SL',  label:'Switch Lo'    },
                { code:'SHH', label:'Switch HiHi'  },
                { code:'SLL', label:'Switch LoLo'  },
                { code:'AH',  label:'Alarm Hi'     },
                { code:'AL',  label:'Alarm Lo'     },
                { code:'E',   label:'Element'      },
                { code:'G',   label:'Gauge'        },
                { code:'R',   label:'Recorder'     },
                { code:'Y',   label:'Relay/Comput.' },
  ];

              // ═══════════════════════════════════════════════════════════════════
              // Soft-coded: parse ISA first-letter from a tag number
              // e.g. "FT-1234" → F,  "LIC-001" → L,  "dPT-5A" → d
              // ═══════════════════════════════════════════════════════════════════
              const parseTagMeasured = (tag) => {
                if (!tag) return 'X';
                const m = tag.match(/^([A-Za-z]{1,3})-?\d/);
                if (!m) return 'X';
                const prefix = m[1].toUpperCase();
                // Differential pressure: DPT, dPT, DP...
                if (prefix.startsWith('DP') || prefix.startsWith('d')) return 'd';
                return prefix[0];
              };

              // ═══════════════════════════════════════════════════════════════════
              // Soft-coded: parse ISA function suffix from tag prefix
              // e.g. "FT" → T,  "LIC" → IC,  "PSV" → SV
              // Match by longest suffix first to avoid false positives
              // ═══════════════════════════════════════════════════════════════════
              const FUNC_PRIORITY = ['SHH','SLL','SH','SL','IC','CV','AH','AL','T','I','C','V','S','E','G','R','Y'];
              const parseTagFn = (tag) => {
                if (!tag) return null;
                const m = tag.match(/^[A-Za-z]+/);
                if (!m) return null;
                const prefix = m[0].toUpperCase();
                const letters = prefix.replace(/^[FLPTA-Z]/, ''); // strip first measured variable letter
                for (const fn of FUNC_PRIORITY) {
                  if (letters.endsWith(fn) || letters === fn) return fn;
                }
                return null;
              };

              // Build matrix: { measured: { fn: [instruments] } }
              const matrix = {};
              for (const inst of (result.instruments || [])) {
                const mv  = parseTagMeasured(inst.tag_number);
                const fn  = parseTagFn(inst.tag_number) || '—';
                if (!matrix[mv]) matrix[mv] = {};
                if (!matrix[mv][fn]) matrix[mv][fn] = [];
                matrix[mv][fn].push(inst);
              }

              // Determine which function columns have any data
              const activeFns = ISA_FUNCTIONS.filter(f =>
                ISA_MEASURED.some(mv => (matrix[mv.letter]?.[f.code] || []).length > 0)
              );

              // Max count in any cell (for heatmap intensity)
              const allCounts  = ISA_MEASURED.flatMap(mv =>
                activeFns.map(fn => (matrix[mv.letter]?.[fn.code] || []).length)
              );
              const maxCount = Math.max(1, ...allCounts);

              // Instruments shown in the detail drawer
              const selectedCell = layoutSelected
                ? (matrix[layoutSelected.measured]?.[layoutSelected.fn] || [])
                : null;
              const selectedMvDef = layoutSelected
                ? ISA_MEASURED.find(m => m.letter === layoutSelected.measured)
                : null;
              const selectedFnDef = layoutSelected
                ? ISA_FUNCTIONS.find(f => f.code === layoutSelected.fn)
                : null;

              // Summary counts per row
              const rowTotal = (mv) =>
                activeFns.reduce((s, fn) => s + (matrix[mv]?.[fn.code]||[]).length, 0);
              const totalInMatrix = (result.instruments||[]).length;

              return (
                <div>
                  {/* ── Header ── */}
                  <div className="bg-white rounded-xl shadow-sm p-5 mb-4">
                    <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <span className="text-2xl">🎛️</span>
                          ISA 5.1 Instrument Classification Matrix
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Each cell shows the count of instruments for a given
                          <strong> Measured Variable</strong> (row) ×
                          <strong> Function Suffix</strong> (column).
                          Click any cell to inspect the tag list. Colour intensity reflects count density.
                        </p>
                      </div>
                      <div className="flex gap-3 flex-shrink-0">
                        <div className="text-center px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl">
                          <p className="text-2xl font-black text-purple-700">{totalInMatrix}</p>
                          <p className="text-xs text-purple-500 font-medium">Instruments</p>
                        </div>
                        <div className="text-center px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl">
                          <p className="text-2xl font-black text-indigo-700">
                            {ISA_MEASURED.filter(m => rowTotal(m.letter) > 0).length}
                          </p>
                          <p className="text-xs text-indigo-500 font-medium">Variables</p>
                        </div>
                        <div className="text-center px-4 py-2 bg-teal-50 border border-teal-200 rounded-xl">
                          <p className="text-2xl font-black text-teal-700">{activeFns.length}</p>
                          <p className="text-xs text-teal-500 font-medium">Functions</p>
                        </div>
                      </div>
                    </div>

                    {/* ISA Legend strip */}
                    <div className="flex flex-wrap gap-1.5">
                      {ISA_MEASURED.filter(m => rowTotal(m.letter) > 0).map(m => (
                        <span key={m.letter}
                          className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border"
                          style={{ background:m.light, color:m.color, borderColor:`${m.color}40` }}>
                          <span className="font-black font-mono">{m.letter}</span>
                          {m.name}
                          <span className="ml-1 font-black bg-white rounded-full px-1.5 py-0.5 text-[10px]"
                            style={{ color:m.color }}>{rowTotal(m.letter)}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* ── Matrix + Detail split ── */}
                  <div className="flex gap-4 items-start">

                    {/* Matrix table */}
                    <div className="flex-1 bg-white rounded-xl shadow-sm overflow-hidden" style={{ minWidth:0 }}>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs">
                          {/* Column headers */}
                          <thead>
                            <tr>
                              <th className="sticky left-0 z-10 bg-gray-50 px-3 py-2.5 text-left font-bold text-gray-500 text-[10px] uppercase tracking-wider border-b border-r border-gray-200 whitespace-nowrap"
                                style={{ minWidth:'110px' }}>
                                Measured Variable
                              </th>
                              {activeFns.map(fn => (
                                <th key={fn.code}
                                  className="px-2 py-2.5 text-center font-bold text-gray-500 text-[10px] border-b border-gray-200 whitespace-nowrap"
                                  style={{ minWidth:'52px' }}>
                                  <div className="font-mono font-black text-gray-700">{fn.code}</div>
                                  <div className="text-[8px] text-gray-400 font-normal leading-tight mt-0.5">{fn.label}</div>
                                </th>
                              ))}
                              <th className="px-3 py-2.5 text-center font-bold text-gray-500 text-[10px] border-b border-l border-gray-200 whitespace-nowrap bg-gray-50">
                                Total
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {ISA_MEASURED.map((mv) => {
                              const total = rowTotal(mv.letter);
                              if (total === 0) return null;
                              return (
                                <tr key={mv.letter} className="group hover:bg-gray-50/70 transition-colors">
                                  {/* Row header */}
                                  <td className="sticky left-0 z-10 bg-white px-3 py-2.5 font-medium border-b border-r border-gray-100 group-hover:bg-gray-50/70"
                                      style={{ background:'inherit' }}>
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-black font-mono flex-shrink-0"
                                        style={{ background:mv.color }}>
                                        {mv.letter}
                                      </span>
                                      <div>
                                        <p className="font-bold text-gray-800 text-[11px] leading-none">{mv.name}</p>
                                      </div>
                                    </div>
                                  </td>
                                  {/* Data cells */}
                                  {activeFns.map(fn => {
                                    const items = matrix[mv.letter]?.[fn.code] || [];
                                    const cnt   = items.length;
                                    const isSelected = layoutSelected?.measured === mv.letter && layoutSelected?.fn === fn.code;
                                    const isHovered  = layoutHovered?.measured  === mv.letter && layoutHovered?.fn  === fn.code;
                                    // Heatmap: intensity proportional to count / maxCount
                                    const intensity  = cnt > 0 ? 0.12 + (cnt / maxCount) * 0.75 : 0;
                                    const cellBg     = cnt > 0
                                      ? `rgba(${mv.color === '#22c55e' ? '34,197,94'
                                               : mv.color === '#f97316' ? '249,115,22'
                                               : mv.color === '#ef4444' ? '239,68,68'
                                               : mv.color === '#eab308' ? '234,179,8'
                                               : mv.color === '#a855f7' ? '168,85,247'
                                               : mv.color === '#fb923c' ? '251,146,60'
                                               : mv.color === '#dc2626' ? '220,38,38'
                                               : mv.color === '#3b82f6' ? '59,130,246'
                                               : '148,163,184'},${intensity})`
                                      : 'transparent';

                                    return (
                                      <td key={fn.code}
                                        className={`px-1 py-2 text-center border-b border-gray-100 transition-all cursor-pointer ${
                                          cnt === 0 ? 'text-gray-200' : ''
                                        }`}
                                        style={{
                                          background: isSelected ? mv.color : isHovered && cnt > 0 ? `${mv.color}30` : cellBg,
                                          outline: isSelected ? `2px solid ${mv.color}` : undefined,
                                          outlineOffset: '-2px',
                                          borderRadius: isSelected ? '4px' : undefined,
                                        }}
                                        onClick={() => cnt > 0 && setLayoutSelected(
                                          isSelected ? null : { measured: mv.letter, fn: fn.code }
                                        )}
                                        onMouseEnter={() => cnt > 0 && setLayoutHovered({ measured: mv.letter, fn: fn.code })}
                                        onMouseLeave={() => setLayoutHovered(null)}>
                                        {cnt > 0 ? (
                                          <span className={`font-black text-[11px] ${isSelected ? 'text-white' : ''}`}
                                            style={{ color: isSelected ? '#fff' : mv.color }}>
                                            {cnt}
                                          </span>
                                        ) : (
                                          <span className="text-gray-100 text-[10px]">·</span>
                                        )}
                                      </td>
                                    );
                                  })}
                                  {/* Row total */}
                                  <td className="px-3 py-2 text-center border-b border-l border-gray-100 font-black text-[11px]"
                                    style={{ color:mv.color, background:`${mv.color}10` }}>
                                    {total}
                                  </td>
                                </tr>
                              );
                            })}
                            {/* Column totals row */}
                            <tr className="bg-gray-50 border-t-2 border-gray-200">
                              <td className="sticky left-0 z-10 bg-gray-50 px-3 py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                Total
                              </td>
                              {activeFns.map(fn => {
                                const colTotal = ISA_MEASURED.reduce((s,mv) => s + (matrix[mv.letter]?.[fn.code]||[]).length, 0);
                                return (
                                  <td key={fn.code} className="px-1 py-2 text-center font-black text-[11px] text-gray-600">
                                    {colTotal > 0 ? colTotal : '·'}
                                  </td>
                                );
                              })}
                              <td className="px-3 py-2 text-center font-black text-gray-800 border-l border-gray-200">
                                {totalInMatrix}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Detail drawer */}
                    <div style={{ width: selectedCell ? '320px' : '200px', flexShrink:0, transition:'width 0.22s ease' }}>
                      {selectedCell ? (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ maxHeight:'75vh', display:'flex', flexDirection:'column' }}>
                          {/* Drawer header */}
                          <div className="px-4 py-3 flex items-center justify-between gap-2 border-b"
                            style={{ background: selectedMvDef ? selectedMvDef.light : '#f8fafc' }}>
                            <div>
                              <p className="text-sm font-black text-gray-900">
                                {selectedMvDef?.letter}{selectedFnDef?.code}
                                <span className="text-[11px] font-normal text-gray-500 ml-2">
                                  {selectedMvDef?.name} · {selectedFnDef?.label}
                                </span>
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {selectedCell.length} instrument{selectedCell.length!==1?'s':''}
                              </p>
                            </div>
                            <button
                              onClick={() => setLayoutSelected(null)}
                              className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none flex-shrink-0">
                              ×
                            </button>
                          </div>
                          {/* Tag list */}
                          <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-2">
                            {selectedCell.map((inst, i) => {
                              const cs = categoryStyle(inst.category);
                              return (
                                <div key={i} className="rounded-xl border p-3 flex flex-col gap-1"
                                  style={{ borderColor: `${selectedMvDef?.color || '#94a3b8'}30`,
                                           background: selectedMvDef?.light || '#f8fafc' }}>
                                  <div className="flex items-center justify-between gap-2">
                                    <code className="text-sm font-black font-mono"
                                      style={{ color: selectedMvDef?.color || '#334155' }}>
                                      {inst.tag_number || '—'}
                                    </code>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                      style={{ background:cs.bg, color:cs.text }}>
                                      {inst.category}
                                    </span>
                                  </div>
                                  {inst.instrument_type && (
                                    <p className="text-[10px] text-gray-600">{inst.instrument_type}</p>
                                  )}
                                  {inst.service_description && (
                                    <p className="text-[10px] text-gray-500 italic leading-snug">{inst.service_description}</p>
                                  )}
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {inst.line_number && (
                                      <span className="text-[9px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-100 font-mono">
                                        Line: {inst.line_number}
                                      </span>
                                    )}
                                    {inst.equipment_number && (
                                      <span className="text-[9px] bg-violet-50 text-violet-700 px-1.5 py-0.5 rounded border border-violet-100 font-mono">
                                        Equip: {inst.equipment_number}
                                      </span>
                                    )}
                                    {inst.set_point && (
                                      <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100 font-mono">
                                        SP: {inst.set_point}
                                      </span>
                                    )}
                                    {inst.fail_safe && (
                                      <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100">
                                        FS: {inst.fail_safe}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* Drawer footer */}
                          <div className="px-4 py-2 border-t bg-gray-50 flex items-center justify-between text-[9px] text-gray-400">
                            <span>{selectedCell.length} tag{selectedCell.length!==1?'s':''}</span>
                            <button
                              onClick={() => { setFilterCategory('All'); setFilterText(layoutSelected?.fn || ''); setActiveView('table'); }}
                              className="text-[9px] font-bold text-purple-600 hover:text-purple-800">
                              View in Table →
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col items-center text-center gap-3"
                          style={{ minHeight:'140px' }}>
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                            style={{ background:'linear-gradient(135deg,#f5f3ff,#ede9fe)', border:'1px solid #c4b5fd' }}>
                            <span className="text-2xl">🔬</span>
                          </div>
                          <p className="text-xs font-bold text-gray-600">Click any cell</p>
                          <p className="text-[10px] text-gray-400 leading-snug">
                            Select a matrix cell to see the tag list for that instrument function
                          </p>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* ── ISA Reference Quick Guide ── */}
                  <div className="bg-white rounded-xl shadow-sm p-5 mt-4">
                    <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
                      ISA 5.1 Quick Reference — Instrument Identification Letters
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {/* Soft-coded: ISA 5.1 first-letter meanings */}
                      {[
                        { letter:'F', desc:'Flow (measurement)'                },
                        { letter:'P', desc:'Pressure (measurement)'            },
                        { letter:'T', desc:'Temperature (measurement)'         },
                        { letter:'L', desc:'Level (measurement)'               },
                        { letter:'A', desc:'Analysis / Composition'            },
                        { letter:'Z', desc:'Position, Dimension, Actuator'     },
                        { letter:'S', desc:'Speed, Frequency, Safety shutdown' },
                        { letter:'d', desc:'Differential (DP transmitter)'     },
                        { letter:'W', desc:'Weight, Force'                     },
                        { letter:'J', desc:'Power, Electrical'                 },
                      ].map(item => {
                        const mvDef = ISA_MEASURED.find(m => m.letter === item.letter);
                        return (
                          <div key={item.letter} className="flex items-start gap-2 p-2.5 rounded-lg border"
                            style={{ background: mvDef?.light || '#f8fafc', borderColor: `${mvDef?.color || '#94a3b8'}25` }}>
                            <span className="w-7 h-7 rounded-md flex items-center justify-center text-white text-sm font-black font-mono flex-shrink-0"
                              style={{ background: mvDef?.color || '#94a3b8' }}>
                              {item.letter}
                            </span>
                            <p className="text-[11px] text-gray-600 leading-snug">{item.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                    {/* Function letter quick reference */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Function Suffix</p>
                      <div className="flex flex-wrap gap-2">
                        {/* Soft-coded: ISA 5.1 second-letter function meanings */}
                        {[
                          ['T','Transmitter'], ['I','Indicator'], ['C','Controller'], ['V','Valve'],
                          ['S','Switch'],      ['E','Element'],   ['G','Gauge'],     ['R','Recorder'],
                          ['A','Alarm'],       ['Y','Relay/Compute'], ['H','High'],  ['L','Low'],
                        ].map(([code, desc]) => (
                          <span key={code}
                            className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-gray-200 bg-gray-50 text-gray-600">
                            <code className="font-mono font-black text-indigo-600">{code}</code>
                            <span>{desc}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* ── Help panel (empty state) ─────────────────────────────────── */}
        {!result && !isProcessing && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mt-4">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">
              ℹ️ About Instrument Index Extraction
            </h3>
            <ul className="space-y-2 text-purple-800 text-sm">
              {[
                ['P&ID Upload Only', 'Upload the P&ID in PDF format — single page or multi-page drawings.'],
                ['All Instrument Types', 'Extracts Flow (FIT, FI), Pressure (PIT, PI, PSV), Temperature (TI, TIT), Level (LIT, LG), Differential Pressure (DPIT), Shutdown Valves (SDV, BDV), Motor Valves (MOV), Restriction Orifices (RO), and more.'],
                ['Tag Number Recognition', 'Values inside instrument circles/bubbles are automatically read — e.g. FIT-3901-08A, PIT-3901-01, SDV-3601-01.'],
                ['Category Colour Coding', 'Each instrument category has its own colour for quick visual scanning in the table and Excel export.'],
                ['Excel Export', 'Two-sheet workbook: Instrument Index (all tags) + Summary (category counts).'],
                ['Combine with Line List', 'Use the Line List page to extract piping lines from the same P&ID for a complete project dataset.'],
              ].map(([title, desc]) => (
                <li key={title} className="flex items-start gap-2">
                  <span className="font-bold text-purple-600 mt-0.5">•</span>
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

export default InstrumentIndex;
