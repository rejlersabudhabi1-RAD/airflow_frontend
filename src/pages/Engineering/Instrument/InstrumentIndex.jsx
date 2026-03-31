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
  const [activeView, setActiveView]         = useState('table'); // 'table' | 'summary'

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">

        {/* ── Page Header ───────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <ListBulletIcon className="h-8 w-8 text-purple-600" />
              Instrument Index
            </h1>
            <p className="mt-1 text-gray-600">
              Extract all instrument Tag Numbers from any P&ID — Flow, Pressure,
              Temperature, Level, SDV/BDV, MOV, Safety valves and more. When
              available, symbol and control convention data may also be enriched
              from uploaded legend sheets and related legend PDFs found in AWS S3.
            </p>
          </div>
          <button
            onClick={() => navigate('/engineering/process/line-list')}
            className="shrink-0 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            → Also try: Line List Extraction
          </button>
        </div>

        {/* ── Upload + Metadata ──────────────────────────────────────── */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            1. Upload P&ID Drawing (PDF)
          </h2>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 transition-colors cursor-pointer mb-4"
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
            className={`flex-1 sm:flex-none px-8 py-3 rounded-lg font-semibold text-white transition-all shadow-md ${
              !pidFile || isProcessing
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg'
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
              '⚡ Extract Instrument Index'
            )}
          </button>

          {result && (
            <>
              <button
                onClick={handleDownloadClientExcel}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
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
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-purple-700">{result.total}</p>
                <p className="text-xs text-purple-600 mt-1 font-medium">Total Instruments</p>
              </div>
              {Object.entries(result.category_summary || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([cat, cnt]) => {
                  const style = categoryStyle(cat);
                  return (
                    <div
                      key={cat}
                      className="rounded-xl p-4 text-center border"
                      style={{ backgroundColor: style.bg, borderColor: style.bg }}
                    >
                      <p className="text-3xl font-bold" style={{ color: style.text }}>{cnt}</p>
                      <p className="text-xs mt-1 font-medium" style={{ color: style.text }}>{cat}</p>
                    </div>
                  );
                })}
            </div>

            {/* View tabs */}
            <div className="flex gap-2 mb-4">
              {[
                { id: 'table',   icon: <ListBulletIcon className="h-4 w-4" />,  label: 'Instrument Table' },
                { id: 'summary', icon: <ChartBarIcon   className="h-4 w-4" />,  label: 'Category Summary' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeView === tab.id
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            {/* ── TABLE VIEW ─────────────────────────────────────────── */}
            {activeView === 'table' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Filters */}
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-3 items-center">
                  <h3 className="text-base font-semibold text-gray-800 mr-2">
                    {filteredInstruments.length} Instrument{filteredInstruments.length !== 1 ? 's' : ''}
                    {filterCategory !== 'All' ? ` · ${filterCategory}` : ''}
                  </h3>
                  <input
                    type="text"
                    placeholder="Filter by tag / service / type…"
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-400 w-56"
                  />
                  <select
                    value={filterCategory}
                    onChange={e => setFilterCategory(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-400"
                  >
                    {uniqueCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-100 text-xs uppercase tracking-wider text-gray-600">
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
                          <td colSpan={15} className="px-4 py-8 text-center text-gray-400">
                            No instruments match the current filter.
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
                            : note.startsWith('OCR circle')
                            ? { bg: '#FFF7ED', text: '#C2410C' }  // orange — OCR circle
                            : note.startsWith('OCR')
                            ? { bg: '#FEF9C3', text: '#713F12' }  // yellow — OCR plain
                            : { bg: '#F0FDF4', text: '#166534' }; // green  — PDF text
                          return (
                            <tr key={idx} className="hover:brightness-95 transition-all">
                              <td className="px-3 py-2.5 text-gray-500 tabular-nums">{inst.index_no ?? idx + 1}</td>
                              <td className="px-3 py-2.5 font-bold whitespace-nowrap" style={{ color: style.text }}>
                                {inst.tag_number || '—'}
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
                              <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{inst.fail_safe         || '—'}</td>
                              <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{inst.signal_type       || '—'}</td>
                              <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{inst.set_point         || '—'}</td>
                              <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{inst.pid_no            || '—'}</td>
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
