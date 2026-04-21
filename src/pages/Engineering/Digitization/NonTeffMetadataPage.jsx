/**
 * Non-TEFF Metadata Extractor
 * Route:  /engineering/digitization/non-teff-metadata
 *
 * Upload multi-format engineering documents (PDF, Excel, Word, AutoCAD) and
 * extract standard Non-TEFF metadata fields via backend AI analysis.
 *
 * Pattern: mirrors EquipmentList.jsx (upload → async poll → table → Excel export)
 * Visual:  EQ_T emerald/teal animated theme (orbit loader, circuit trace, node glow)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  DocumentMagnifyingGlassIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import apiClient from '../../../services/api.service';
import { getApiBaseUrl } from '../../../config/environment.config';

// ---------------------------------------------------------------------------
// Soft-coded column definitions — mirrors config/non_teff_fields.json
// ---------------------------------------------------------------------------
const COLUMNS = [
  { key: 'document_no',          label: 'Document No.',          width: 16 },
  { key: 'document_title',       label: 'Document Title',        width: 28 },
  { key: 'revision',             label: 'Rev.',                  width:  6 },
  { key: 'discipline',           label: 'Discipline',            width: 14 },
  { key: 'instrument_tag_no',    label: 'Instrument Tag No.',    width: 18 },
  { key: 'line_number',          label: 'Line Number',           width: 18 },
  { key: 'equipment_no',         label: 'Equipment No.',         width: 16 },
  { key: 'mechanical_component', label: 'Mechanical Component',  width: 22 },
  { key: 'status',               label: 'Status',                width: 14 },
  { key: 'date',                 label: 'Date',                  width: 12 },
  { key: 'originator',           label: 'Originator',            width: 16 },
  { key: 'remarks',              label: 'Remarks',               width: 24 },
];

// Info panel field descriptions
const FIELD_INFO = [
  { key: 'document_no',          label: 'Document No.',          desc: 'Drawing / document reference number', color: '#059669' },
  { key: 'document_title',       label: 'Document Title',        desc: 'Full title of the source document',   color: '#0891b2' },
  { key: 'revision',             label: 'Revision',              desc: 'Current revision identifier (A, B, 01…)', color: '#7c3aed' },
  { key: 'discipline',           label: 'Discipline',            desc: 'Engineering discipline (Process, Instrument, …)', color: '#b45309' },
  { key: 'instrument_tag_no',    label: 'Instrument Tag No.',    desc: 'All instrument tag numbers found',    color: '#0f766e' },
  { key: 'line_number',          label: 'Line Number',           desc: 'Pipe / line numbers referenced',      color: '#1d4ed8' },
  { key: 'equipment_no',         label: 'Equipment No.',         desc: 'Equipment tag numbers (V-, P-, E-, …)', color: '#9d174d' },
  { key: 'mechanical_component', label: 'Mechanical Component',  desc: 'Mechanical items mentioned (pump, vessel, …)', color: '#6d28d9' },
  { key: 'status',               label: 'Status',                desc: 'Non-TEFF status (IFR, IFA, Draft, …)', color: '#b91c1c' },
  { key: 'date',                 label: 'Date',                  desc: 'Issue / revision date',               color: '#047857' },
  { key: 'originator',           label: 'Originator',            desc: 'Prepared-by / author information',    color: '#6b7280' },
  { key: 'remarks',              label: 'Remarks',               desc: 'Extraction source notes',             color: '#78716c' },
];

// ---------------------------------------------------------------------------
// Timing constants
// ---------------------------------------------------------------------------
const POLL_INTERVAL_MS  = 3000;
const POLL_MAX_WAIT_MS  = 300000;  // 5 min
const UPLOAD_TIMEOUT_MS = 120000;  // 2 min

// ---------------------------------------------------------------------------
// Supported formats
// ---------------------------------------------------------------------------
const SUPPORTED_FORMATS = [
  { ext: '.pdf',        label: 'PDF',        color: '#ef4444' },
  { ext: '.xlsx/.xls',  label: 'Excel',      color: '#22c55e' },
  { ext: '.docx/.doc',  label: 'Word',       color: '#3b82f6' },
  { ext: '.dwg/.dxf',   label: 'AutoCAD',    color: '#f59e0b' },
];

const ACCEPT_STRING = '.pdf,.xlsx,.xls,.docx,.doc,.dwg,.dxf';

const API_BASE = getApiBaseUrl();
const API_PREFIX = `${API_BASE}/non-teff`;

// ---------------------------------------------------------------------------
// Keyframes — shared EQ style, teal/emerald palette
// ---------------------------------------------------------------------------
const NT_KEYFRAMES = `
  @keyframes ntOrbitA {
    from { transform: rotate(0deg)   translateX(30px) rotate(0deg);    }
    to   { transform: rotate(360deg) translateX(30px) rotate(-360deg); }
  }
  @keyframes ntOrbitB {
    from { transform: rotate(120deg) translateX(30px) rotate(-120deg); }
    to   { transform: rotate(480deg) translateX(30px) rotate(-480deg); }
  }
  @keyframes ntOrbitC {
    from { transform: rotate(240deg) translateX(30px) rotate(-240deg); }
    to   { transform: rotate(600deg) translateX(30px) rotate(-600deg); }
  }
  @keyframes ntGradShift {
    0%   { background-position: 0%   50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0%   50%; }
  }
  @keyframes ntTraceH {
    0%   { transform: scaleX(0); transform-origin: left;  }
    48%  { transform: scaleX(1); transform-origin: left;  }
    52%  { transform: scaleX(1); transform-origin: right; }
    100% { transform: scaleX(0); transform-origin: right; }
  }
  @keyframes ntTraceV {
    0%   { transform: scaleY(0); transform-origin: top;    }
    48%  { transform: scaleY(1); transform-origin: top;    }
    52%  { transform: scaleY(1); transform-origin: bottom; }
    100% { transform: scaleY(0); transform-origin: bottom; }
  }
  @keyframes ntNodeGlow {
    0%, 100% { box-shadow: 0 0 10px rgba(5,150,105,0.12), 0 4px 16px rgba(5,150,105,0.07); }
    50%       { box-shadow: 0 0 26px rgba(5,150,105,0.26), 0 4px 22px rgba(5,150,105,0.13); }
  }
  @keyframes ntChipPop {
    0%   { opacity: 0; transform: scale(0.72) translateY(5px); }
    62%  { transform: scale(1.06) translateY(-1px); }
    100% { opacity: 1; transform: scale(1)    translateY(0);   }
  }
  @keyframes ntFloatA {
    0%, 100% { transform: translateY(0)     scale(1);    }
    50%       { transform: translateY(-24px) scale(1.04); }
  }
  @keyframes ntFloatB {
    0%, 100% { transform: translateY(0)    scale(1);    }
    50%       { transform: translateY(20px) scale(0.97); }
  }
  @keyframes ntFloatC {
    0%, 100% { transform: translateY(0)     scale(1);    }
    50%       { transform: translateY(-15px) scale(1.02); }
  }
  @keyframes ntSpinSlowRev {
    from { transform: rotate(360deg); }
    to   { transform: rotate(0deg);   }
  }
  @keyframes ntRowIn {
    from { opacity: 0; transform: translateY(4px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  @keyframes ntFadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes ntPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }
  .nt-row-animate { animation: ntRowIn 0.3s ease forwards; opacity: 0; }
  .nt-section     { animation: ntFadeUp 0.5s ease both; }
  .nt-chip        { animation: ntChipPop 0.4s ease both; }
  .nt-kpi-node    { animation: ntNodeGlow 2.6s ease infinite; }
  .nt-upload-zone:hover { border-color: rgba(5,150,105,0.55) !important; background: rgba(5,150,105,0.06) !important; }
  .nt-action-btn:hover:not(:disabled) { box-shadow: 0 6px 24px rgba(5,150,105,0.42) !important; transform: translateY(-1px); }
  .nt-export-btn:hover { background: rgba(5,150,105,0.14) !important; border-color: rgba(5,150,105,0.4) !important; }
`;

// Visual theme constants
const NT_T = {
  bg:      'linear-gradient(145deg, #f0fdf4 0%, #ecfdf5 40%, #f1f5f9 100%)',
  gridDot: 'radial-gradient(circle, rgba(5,150,105,0.06) 1px, transparent 1px)',
  gradBar: 'linear-gradient(90deg,#059669,#0891b2,#10b981,#0284c7,#059669)',
  blobs: [
    { color:'rgba(5,150,105,0.09)',  size:'560px', top:'-80px',    left:'10%',    anim:'ntFloatA 14s ease-in-out infinite'     },
    { color:'rgba(8,145,178,0.06)',  size:'440px', top:'30%',      right:'-60px', anim:'ntFloatB 17s ease-in-out infinite'     },
    { color:'rgba(16,185,129,0.07)', size:'380px', bottom:'-60px', left:'35%',    anim:'ntFloatC 12s ease-in-out infinite'     },
    { color:'rgba(5,150,105,0.05)',  size:'300px', top:'55%',      left:'-50px',  anim:'ntFloatA 10s ease-in-out infinite 3s'  },
  ],
  electrons: ['#059669', '#0891b2', '#6ee7b7'],
  chips: [
    { icon:'🏷️', label:'Instrument Tags'    },
    { icon:'📄', label:'Document Metadata'  },
    { icon:'🔢', label:'Line Numbers'       },
    { icon:'⚙️', label:'Equipment Nos.'     },
    { icon:'🔩', label:'Mech. Components'   },
    { icon:'📁', label:'Multi-Format'       },
  ],
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const NonTeffMetadataPage = () => {
  const [file,          setFile]          = useState(null);
  const [isProcessing,  setIsProcessing]  = useState(false);
  const [progress,      setProgress]      = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [results,       setResults]       = useState(null);
  const [error,         setError]         = useState(null);
  const [sortCol,       setSortCol]       = useState('document_no');
  const [sortAsc,       setSortAsc]       = useState(true);
  const [filterText,    setFilterText]    = useState('');
  const [elapsedSecs,   setElapsedSecs]   = useState(0);
  const [isDragging,    setIsDragging]    = useState(false);
  const [jobId,         setJobId]         = useState(null);

  const fileRef      = useRef(null);
  const pollTimerRef = useRef(null);
  const pollStartRef = useRef(null);
  const elapsedRef   = useRef(null);

  // Elapsed timer
  useEffect(() => {
    if (isProcessing) {
      setElapsedSecs(0);
      elapsedRef.current = setInterval(() => setElapsedSecs(s => s + 1), 1000);
    } else {
      clearInterval(elapsedRef.current);
    }
    return () => clearInterval(elapsedRef.current);
  }, [isProcessing]);

  const formatElapsed = (s) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  // File selection
  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setError(null); setResults(null); }
  };

  const handleDragOver  = (e) => { e.preventDefault(); if (!isProcessing) setIsDragging(true); };
  const handleDragEnter = (e) => { e.preventDefault(); if (!isProcessing) setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop      = (e) => {
    e.preventDefault(); setIsDragging(false);
    if (isProcessing) return;
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setError(null); setResults(null); }
    else   { setError('No file detected — please try again.'); }
  };

  // Polling
  const pollStatus = useCallback((id) => {
    if (Date.now() - pollStartRef.current > POLL_MAX_WAIT_MS) {
      clearTimeout(pollTimerRef.current);
      setError('Extraction timed out — please try again.');
      setIsProcessing(false);
      return;
    }
    pollTimerRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.get(`${API_PREFIX}/status/${id}/`, { timeout: 10000 });
        const data = res.data;
        setProgress(data.progress || 0);
        setStatusMessage(data.message || '');

        if (data.status === 'completed') {
          clearTimeout(pollTimerRef.current);
          const resData = await apiClient.get(`${API_PREFIX}/results/${id}/`, { timeout: 15000 });
          setResults(resData.data);
          setIsProcessing(false);
        } else if (data.status === 'failed') {
          clearTimeout(pollTimerRef.current);
          setError(data.error || 'Extraction failed.');
          setIsProcessing(false);
        } else {
          pollStatus(id);
        }
      } catch (err) {
        pollStatus(id);  // retry on transient error
      }
    }, POLL_INTERVAL_MS);
  }, []);

  // Submit
  const handleExtract = async () => {
    if (!file || isProcessing) return;
    setIsProcessing(true);
    setProgress(0);
    setStatusMessage('Uploading file…');
    setError(null);
    setResults(null);
    setJobId(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post(`${API_PREFIX}/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: UPLOAD_TIMEOUT_MS,
      });
      const id = res.data.job_id;
      setJobId(id);
      setProgress(5);
      setStatusMessage('File received — extracting metadata…');
      pollStartRef.current = Date.now();
      pollStatus(id);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Upload failed.';
      setError(msg);
      setIsProcessing(false);
    }
  };

  // Export Excel
  const handleExport = async () => {
    if (!jobId) return;
    try {
      const res = await apiClient.get(`${API_PREFIX}/export/${jobId}/`, {
        responseType: 'blob',
        timeout: 30000,
      });
      const url  = URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.download = `NonTEFF_Metadata_${file?.name?.replace(/\.[^.]+$/, '') || 'export'}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Export failed — please try again.');
    }
  };

  // Derived table data
  const items = results?.items || [];

  const filteredItems = items.filter(row =>
    !filterText || COLUMNS.some(c => String(row[c.key] || '').toLowerCase().includes(filterText.toLowerCase()))
  );

  const sortedItems = [...filteredItems].sort((a, b) => {
    const av = String(a[sortCol] || '').toLowerCase();
    const bv = String(b[sortCol] || '').toLowerCase();
    return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const handleSort = (key) => {
    if (sortCol === key) setSortAsc(a => !a);
    else { setSortCol(key); setSortAsc(true); }
  };

  // Processing stage label
  const stageLabel = progress < 20 ? 'Uploading' : progress < 60 ? 'Analysing' : progress < 90 ? 'Extracting Fields' : 'Finalising';

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: NT_T.bg, fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <style>{NT_KEYFRAMES}</style>

      {/* Animated background blobs */}
      {NT_T.blobs.map((b, i) => (
        <div key={i} style={{
          position: 'absolute', borderRadius: '50%', background: b.color,
          width: b.size, height: b.size,
          top: b.top, bottom: b.bottom, left: b.left, right: b.right,
          animation: b.anim, pointerEvents: 'none', zIndex: 0,
        }} />
      ))}

      {/* Grid dot overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: NT_T.gridDot, backgroundSize: '28px 28px', opacity: 0.7,
      }} />

      {/* Top animated gradient bar */}
      <div style={{
        position: 'relative', zIndex: 1,
        height: '4px',
        background: NT_T.gradBar,
        backgroundSize: '300% 300%',
        animation: 'ntGradShift 6s ease infinite',
      }} />

      {/* ── Content wrapper ── */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1480px', margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* ── Hero Header ── */}
        <div className="nt-section" style={{ display: 'flex', alignItems: 'flex-start', gap: '28px', marginBottom: '36px' }}>
          {/* Rule ring + icon */}
          <div style={{ position: 'relative', width: '88px', height: '88px', flexShrink: 0 }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '2px dashed rgba(5,150,105,0.25)',
              animation: 'ntGradShift 8s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: '8px', borderRadius: '50%',
              border: '1.5px solid rgba(5,150,105,0.15)',
              animation: 'ntSpinSlowRev 18s linear infinite',
            }} />
            <div style={{
              position: 'absolute', inset: '16px', borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(5,150,105,0.12), rgba(8,145,178,0.08))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <DocumentMagnifyingGlassIcon style={{ width: 32, height: 32, color: '#059669', opacity: 0.9 }} />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <h1 style={{
                fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1,
                background: 'linear-gradient(90deg, #059669, #0891b2)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                margin: 0,
              }}>Non-TEF Metadata Generator</h1>
              <span style={{
                background: 'linear-gradient(90deg, #059669, #0891b2)', color: '#fff',
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em',
                padding: '2px 10px', borderRadius: '999px', whiteSpace: 'nowrap',
              }}>AI-POWERED</span>
            </div>
            <p style={{ color: '#475569', fontSize: '0.95rem', margin: '0 0 14px', maxWidth: '640px', lineHeight: 1.6 }}>
              Upload Non-TEFF engineering documents (PDF, Excel, Word, AutoCAD) and automatically extract
              metadata — instrument tags, line numbers, equipment references, mechanical components and more.
            </p>

            {/* Capability chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {NT_T.chips.map((chip, i) => (
                <span key={i} className="nt-chip" style={{
                  animationDelay: `${i * 0.07}s`,
                  background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(5,150,105,0.2)', borderRadius: '999px',
                  padding: '4px 12px', fontSize: '0.75rem', fontWeight: 600, color: '#065f46',
                  display: 'flex', alignItems: 'center', gap: '5px',
                }}>
                  <span style={{ fontSize: '0.85rem' }}>{chip.icon}</span>
                  {chip.label}
                </span>
              ))}
            </div>
          </div>

          {/* Workflow steps (right) */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
            {['Upload', 'AI Extract', 'Review', 'Export'].map((step, i) => (
              <React.Fragment key={step}>
                <div style={{
                  background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(5,150,105,0.2)', borderRadius: '10px',
                  padding: '6px 12px', fontSize: '0.7rem', fontWeight: 600, color: '#065f46',
                  textAlign: 'center', minWidth: '56px',
                }}>
                  <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.04em' }}>
                    0{i + 1}
                  </div>
                  {step}
                </div>
                {i < 3 && <div style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700 }}>›</div>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Upload + Action row ── */}
        <div className="nt-section" style={{ animationDelay: '0.1s', display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'start', marginBottom: '24px' }}>
          {/* Upload zone */}
          <div
            className="nt-upload-zone"
            onDragOver={handleDragOver} onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave} onDrop={handleDrop}
            onClick={() => !isProcessing && fileRef.current?.click()}
            style={{
              position: 'relative', overflow: 'hidden',
              border: isDragging ? '2px solid rgba(5,150,105,0.6)' : '2px dashed rgba(5,150,105,0.28)',
              borderRadius: '16px',
              background: isDragging ? 'rgba(5,150,105,0.06)' : 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(10px)',
              padding: '28px 32px',
              cursor: isProcessing ? 'default' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
            }}
          >
            {/* Circuit trace borders */}
            {['top','bottom'].map(side => (
              <div key={side} style={{
                position: 'absolute', [side]: 0, left: '10%', right: '10%', height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(5,150,105,0.5), transparent)',
                animation: 'ntTraceH 3.5s ease-in-out infinite',
                animationDelay: side === 'bottom' ? '1.75s' : '0s',
              }} />
            ))}
            {['left','right'].map(side => (
              <div key={side} style={{
                position: 'absolute', [side]: 0, top: '10%', bottom: '10%', width: '2px',
                background: 'linear-gradient(180deg, transparent, rgba(5,150,105,0.5), transparent)',
                animation: 'ntTraceV 3.5s ease-in-out infinite',
                animationDelay: side === 'right' ? '1.75s' : '0s',
              }} />
            ))}

            <input
              ref={fileRef} type="file" accept={ACCEPT_STRING}
              style={{ display: 'none' }} onChange={handleFileSelect}
            />

            <CloudArrowUpIcon style={{
              width: 40, height: 40,
              color: file ? '#059669' : '#94a3b8',
              transition: 'color 0.2s',
            }} />

            {file ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.95rem' }}>{file.name}</div>
                <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '2px' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB — click to change
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>
                  Drop a document here or click to browse
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px' }}>
                  Supports: {SUPPORTED_FORMATS.map(f => (
                    <span key={f.ext} style={{ color: f.color, fontWeight: 600, marginLeft: '4px' }}>{f.label}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Extract button */}
          <button
            className="nt-action-btn"
            onClick={handleExtract}
            disabled={!file || isProcessing}
            style={{
              background: !file || isProcessing
                ? 'linear-gradient(135deg, #94a3b8, #64748b)'
                : 'linear-gradient(135deg, #059669, #0891b2)',
              color: '#fff', border: 'none', borderRadius: '14px',
              padding: '16px 28px', cursor: !file || isProcessing ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.01em',
              boxShadow: !file || isProcessing ? 'none' : '0 4px 18px rgba(5,150,105,0.3)',
              transition: 'all 0.2s ease', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: '8px', minWidth: '160px',
            }}
          >
            <DocumentMagnifyingGlassIcon style={{ width: 20, height: 20 }} />
            {isProcessing ? 'Extracting…' : 'Extract Metadata'}
          </button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="nt-section" style={{
            background: 'rgba(254,242,242,0.9)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '12px', padding: '14px 18px', marginBottom: '20px',
            color: '#b91c1c', fontSize: '0.88rem', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <span style={{ fontSize: '1.1rem' }}>⚠️</span>
            {error}
          </div>
        )}

        {/* ── AI Processing Loader ── */}
        {isProcessing && (
          <div className="nt-section" style={{
            background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(5,150,105,0.18)', borderRadius: '20px',
            padding: '36px', marginBottom: '24px', textAlign: 'center',
          }}>
            {/* Orbit electron loader */}
            <div style={{ display: 'inline-block', position: 'relative', width: '80px', height: '80px', marginBottom: '20px' }}>
              <div style={{
                position: 'absolute', inset: '50%', width: '16px', height: '16px',
                marginLeft: '-8px', marginTop: '-8px',
                background: 'linear-gradient(135deg, #059669, #0891b2)',
                borderRadius: '50%', boxShadow: '0 0 18px rgba(5,150,105,0.45)',
              }} />
              {NT_T.electrons.map((color, i) => (
                <div key={i} style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: `ntOrbit${['A','B','C'][i]} ${1.4 + i * 0.3}s linear infinite`,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
                </div>
              ))}
            </div>

            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#065f46', marginBottom: '6px' }}>
              AI Metadata Extraction in Progress
            </div>
            <div style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '20px' }}>
              {statusMessage || 'Analysing document structure…'}
            </div>

            {/* Progress bar */}
            <div style={{ maxWidth: '440px', margin: '0 auto', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(5,150,105,0.1)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '999px', width: `${progress}%`,
                  background: 'linear-gradient(90deg, #059669, #0891b2)',
                  transition: 'width 0.4s ease',
                  boxShadow: '0 0 12px rgba(5,150,105,0.4)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{stageLabel}</span>
                <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>{progress}%</span>
              </div>
            </div>

            {/* Stage indicators */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {['Upload', 'Parse', 'Extract Fields', 'Finalise'].map((stage, i) => {
                const active = Math.floor(progress / 25) >= i;
                return (
                  <div key={stage} style={{
                    padding: '4px 12px', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 600,
                    background: active ? 'rgba(5,150,105,0.12)' : 'rgba(148,163,184,0.08)',
                    color: active ? '#065f46' : '#94a3b8',
                    border: `1px solid ${active ? 'rgba(5,150,105,0.25)' : 'rgba(148,163,184,0.15)'}`,
                    transition: 'all 0.3s ease',
                  }}>
                    {active ? '✓ ' : ''}{stage}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '12px', fontSize: '0.72rem', color: '#94a3b8' }}>
              Elapsed: {formatElapsed(elapsedSecs)}
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {results && !isProcessing && (
          <div className="nt-section" style={{ animationDelay: '0.05s' }}>
            {/* KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {[
                { label: 'Records Found',    value: results.total || 0,          icon: '📋', color: '#059669' },
                { label: 'Instrument Tags',  value: items.filter(r => r.instrument_tag_no).length, icon: '🏷️', color: '#0891b2' },
                { label: 'Equipment Nos.',   value: items.filter(r => r.equipment_no).length,      icon: '⚙️', color: '#7c3aed' },
                { label: 'Line Numbers',     value: items.filter(r => r.line_number).length,       icon: '🔢', color: '#b45309' },
                { label: 'Shown (filtered)', value: sortedItems.length,          icon: '🔍', color: '#0f766e' },
              ].map((kpi, i) => (
                <div key={i} className="nt-kpi-node" style={{
                  background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(10px)',
                  border: `1px solid rgba(5,150,105,0.14)`, borderRadius: '14px',
                  padding: '16px', animationDelay: `${i * 0.08}s`,
                }}>
                  <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{kpi.icon}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: kpi.color, lineHeight: 1 }}>
                    {kpi.value}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
                    {kpi.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Table toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <input
                  type="text" placeholder="Filter across all fields…"
                  value={filterText} onChange={e => setFilterText(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 14px 9px 36px',
                    border: '1px solid rgba(5,150,105,0.22)', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', color: '#334155',
                    outline: 'none', boxSizing: 'border-box',
                  }}
                />
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.9rem' }}>
                  🔍
                </span>
              </div>

              <button
                className="nt-export-btn"
                onClick={handleExport}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '9px 18px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.8)',
                  border: '1px solid rgba(5,150,105,0.28)', color: '#065f46',
                  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <ArrowDownTrayIcon style={{ width: 16, height: 16 }} />
                Export Excel
              </button>
            </div>

            {/* Table */}
            <div style={{
              background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
              border: '1px solid rgba(5,150,105,0.14)', borderRadius: '16px',
              overflow: 'hidden',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'linear-gradient(90deg, rgba(5,150,105,0.08), rgba(8,145,178,0.06))' }}>
                      <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#047857', fontSize: '0.72rem', whiteSpace: 'nowrap', borderBottom: '1px solid rgba(5,150,105,0.12)' }}>
                        #
                      </th>
                      {COLUMNS.map(col => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          style={{
                            padding: '12px 14px', textAlign: 'left', fontWeight: 700,
                            color: sortCol === col.key ? '#059669' : '#374151',
                            fontSize: '0.72rem', whiteSpace: 'nowrap',
                            borderBottom: '1px solid rgba(5,150,105,0.12)',
                            cursor: 'pointer', userSelect: 'none',
                            minWidth: `${col.width * 7}px`,
                          }}
                        >
                          {col.label}
                          {sortCol === col.key && (
                            <span style={{ marginLeft: '4px', color: '#059669' }}>
                              {sortAsc ? '↑' : '↓'}
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedItems.length === 0 ? (
                      <tr>
                        <td colSpan={COLUMNS.length + 1} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                          No records match the current filter.
                        </td>
                      </tr>
                    ) : sortedItems.map((row, idx) => (
                      <tr
                        key={idx}
                        className="nt-row-animate"
                        style={{
                          animationDelay: `${idx * 0.03}s`,
                          borderBottom: idx < sortedItems.length - 1 ? '1px solid rgba(5,150,105,0.06)' : 'none',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(5,150,105,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '10px 14px', color: '#94a3b8', fontSize: '0.72rem', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {idx + 1}
                        </td>
                        {COLUMNS.map(col => (
                          <td key={col.key} style={{ padding: '10px 14px', color: '#374151', verticalAlign: 'top' }}>
                            {row[col.key] && row[col.key] !== ''
                              ? <span title={row[col.key]}>{row[col.key]}</span>
                              : <span style={{ color: '#cbd5e1' }}>—</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Table footer */}
              <div style={{
                padding: '10px 16px', borderTop: '1px solid rgba(5,150,105,0.08)',
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(5,150,105,0.03)',
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'ntPulse 2s ease infinite' }} />
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>
                  Showing {sortedItems.length} of {items.length} record{items.length !== 1 ? 's' : ''}
                  {filterText && ` — filtered by "${filterText}"`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Success banner (no error, no results, just completed idle) ── */}
        {results && !isProcessing && items.length === 0 && (
          <div style={{
            background: 'rgba(240,253,244,0.9)', border: '1px solid rgba(5,150,105,0.2)',
            borderRadius: '12px', padding: '16px 20px', marginTop: '16px',
            color: '#065f46', fontSize: '0.88rem', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <CheckCircleIcon style={{ width: 20, height: 20, color: '#10b981', flexShrink: 0 }} />
            Extraction completed — no structured metadata fields were identified in this document.
            Try a different format or a document with standard engineering tags.
          </div>
        )}

        {/* ── Info panel (idle) ── */}
        {!results && !isProcessing && (
          <div className="nt-section" style={{ animationDelay: '0.2s', marginTop: '8px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(5,150,105,0.14)', borderRadius: '16px',
              overflow: 'hidden',
            }}>
              {/* Info header */}
              <div style={{
                padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '10px',
                background: 'linear-gradient(90deg, rgba(5,150,105,0.08), rgba(8,145,178,0.05))',
                borderBottom: '1px solid rgba(5,150,105,0.1)',
              }}>
                <InformationCircleIcon style={{ width: 18, height: 18, color: '#059669' }} />
                <span style={{ fontWeight: 700, color: '#065f46', fontSize: '0.88rem' }}>
                  Extracted Metadata Fields
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#94a3b8' }}>
                  {FIELD_INFO.length} fields
                </span>
              </div>

              {/* Field grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px', background: 'rgba(5,150,105,0.06)' }}>
                {FIELD_INFO.map((field, i) => (
                  <div key={field.key} className="nt-info-card" style={{
                    background: 'rgba(255,255,255,0.9)', padding: '14px 18px',
                    display: 'flex', alignItems: 'flex-start', gap: '12px',
                    transition: 'all 0.15s ease',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '8px', flexShrink: 0,
                      background: `${field.color}18`,
                      border: `1px solid ${field.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginTop: '1px',
                    }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, color: field.color, fontFamily: 'monospace' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.82rem', marginBottom: '2px' }}>
                        {field.label}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.73rem', lineHeight: 1.4 }}>
                        {field.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Format support strip */}
              <div style={{
                padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
                background: 'rgba(5,150,105,0.03)', borderTop: '1px solid rgba(5,150,105,0.08)',
              }}>
                <span style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: 600 }}>Supported formats:</span>
                {SUPPORTED_FORMATS.map(f => (
                  <span key={f.ext} style={{
                    background: `${f.color}15`, border: `1px solid ${f.color}35`,
                    color: f.color, borderRadius: '6px', padding: '2px 10px',
                    fontSize: '0.72rem', fontWeight: 700,
                  }}>
                    {f.label}
                  </span>
                ))}
                <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: '#94a3b8' }}>
                  Max file size: 50 MB
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NonTeffMetadataPage;
