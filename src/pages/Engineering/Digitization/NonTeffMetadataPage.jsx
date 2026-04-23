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
import { useNavigate } from 'react-router-dom';
import {
  CloudArrowUpIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  DocumentMagnifyingGlassIcon,
  InformationCircleIcon,
  SparklesIcon,
  ArrowRightIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import apiClient from '../../../services/api.service';
import { getApiBaseUrl } from '../../../config/environment.config';
import BulkMasterIndex from './BulkMasterIndex';

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

// apiClient already has baseURL=API_BASE_URL ('/api/v1'), so use a relative
// prefix — prepending getApiBaseUrl() here duplicates '/api/v1/api/v1/...'.
const API_PREFIX = '/non-teff';

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

  /* ─── Oil & Gas themed tab switcher ─── */
  @keyframes ntPipelineFlow {
    0%   { background-position:   0% 50%; }
    100% { background-position: 200% 50%; }
  }
  @keyframes ntDropletRise {
    0%   { transform: translateY(6px)  scale(0.85); opacity: 0; }
    40%  { opacity: 1; }
    100% { transform: translateY(-14px) scale(1);   opacity: 0; }
  }
  @keyframes ntTabGlow {
    0%, 100% { box-shadow: 0 4px 18px rgba(5,150,105,0.28), inset 0 1px 0 rgba(255,255,255,0.35); }
    50%       { box-shadow: 0 6px 26px rgba(8,145,178,0.45), inset 0 1px 0 rgba(255,255,255,0.45); }
  }
  @keyframes ntGaugeSweep {
    0%   { transform: rotate(-60deg); }
    50%  { transform: rotate(60deg);  }
    100% { transform: rotate(-60deg); }
  }
  .nt-tab-inactive:hover {
    background: rgba(255,255,255,0.85) !important;
    color: #047857 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(5,150,105,0.15);
  }
  .nt-tab-active { animation: ntTabGlow 3s ease-in-out infinite; }
  .nt-tab-pipeline {
    background: linear-gradient(90deg,
      rgba(5,150,105,0)    0%,
      rgba(5,150,105,0.9) 20%,
      rgba(8,145,178,0.9) 50%,
      rgba(5,150,105,0.9) 80%,
      rgba(5,150,105,0)   100%);
    background-size: 200% 100%;
    animation: ntPipelineFlow 2.8s linear infinite;
  }
  .nt-droplet { animation: ntDropletRise 1.8s ease-in-out infinite; }
  .nt-gauge-needle {
    transform-origin: 50% 100%;
    animation: ntGaugeSweep 2.4s ease-in-out infinite;
  }

  /* ─── Engagement layer: sheen, tip rotator, reco cards ─── */
  @keyframes ntSheen {
    0%   { background-position: -150% 0; }
    100% { background-position:  250% 0; }
  }
  @keyframes ntTipSlide {
    0%   { opacity: 0; transform: translateY(8px); }
    12%  { opacity: 1; transform: translateY(0);   }
    88%  { opacity: 1; transform: translateY(0);   }
    100% { opacity: 0; transform: translateY(-8px);}
  }
  @keyframes ntRecoPulse {
    0%, 100% { transform: translateX(0);   }
    50%      { transform: translateX(3px); }
  }
  @keyframes ntTrustCount {
    from { opacity: 0; transform: translateY(6px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0)   scale(1);    }
  }
  .nt-hero-title-sheen {
    background: linear-gradient(90deg, #059669 0%, #0891b2 40%, #ffffff 50%, #0891b2 60%, #059669 100%);
    background-size: 250% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: ntSheen 6s ease-in-out infinite;
  }
  .nt-reco-card {
    transition: transform 0.25s cubic-bezier(0.4,0,0.2,1),
                box-shadow 0.25s cubic-bezier(0.4,0,0.2,1),
                border-color 0.25s ease;
    will-change: transform, box-shadow;
  }
  .nt-reco-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 32px -10px rgba(5,150,105,0.28), 0 6px 12px -6px rgba(15,23,42,0.12) !important;
  }
  .nt-reco-card:hover .nt-reco-arrow { animation: ntRecoPulse 0.9s ease-in-out infinite; }
  .nt-trust-badge { animation: ntTrustCount 0.5s ease both; }
  .nt-info-card:hover {
    background: rgba(255,255,255,1) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 14px -6px rgba(5,150,105,0.18);
  }
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
// Soft-coded engagement content — edit freely, no logic depends on this.
// ---------------------------------------------------------------------------

// Rotating "Did you know?" tips shown under the hero chips.
const PRO_TIPS = [
  { icon: '💡', text: 'Drop a folder of drawings into Bulk Master Index — RAD AI merges them into a single registry.' },
  { icon: '⚡', text: 'Extraction runs on a Celery worker, so you can keep reviewing earlier jobs while this one finishes.' },
  { icon: '🔒', text: 'Every uploaded document is scoped to your project — nothing is shared across tenants.' },
  { icon: '🎯', text: 'Ambiguous tags? Edit inline in the grid — RAD AI will re-learn your team\'s preferences.' },
  { icon: '🧠', text: 'AI-extracted fields feed directly into Equipment List, Line List and Datasheet modules.' },
];
const PRO_TIP_ROTATE_MS = 5500;

// Badges shown in the trust-strip beneath the chips.
const TRUST_BADGES = [
  { value: '12+',   label: 'Metadata fields'      },
  { value: '4',     label: 'Document formats'     },
  { value: '~30s',  label: 'Avg. extraction time' },
  { value: '100%',  label: 'Project-scoped'       },
];

// Recommendation system — surfaces other RAD AI modules this user will benefit from.
// Grouped by category; each item stays on-brand with its accent color.
const RECOMMENDED_FEATURES = [
  {
    category: 'Process Engineering',
    items: [
      { to: '/engineering/process/equipment-list',   icon: '⚙️', title: 'Equipment List',        tagline: 'Auto-register equipment from P&IDs',   benefit: 'Saves ~6 hrs / drawing',  accent: '#7c3aed' },
      { to: '/engineering/process/line-list',        icon: '🔢', title: 'Line List',             tagline: 'Piping line register with specs',      benefit: 'OCR-assisted',            accent: '#0891b2' },
      { to: '/engineering/process/pid-verification', icon: '🔍', title: 'P&ID Verification',     tagline: 'AI rule-engine for P&ID quality',      benefit: 'Catches 40+ issue types', accent: '#059669' },
      { to: '/engineering/process/pfd-quality-checker', icon: '📊', title: 'PFD Quality Checker', tagline: 'Five-stage PFD analysis',            benefit: 'Stream + mass balance',   accent: '#0284c7' },
    ],
  },
  {
    category: 'Piping & Datasheets',
    items: [
      { to: '/engineering/piping/critical-line-list',          icon: '🧪', title: 'Critical Line List',    tagline: 'Stress-critical piping inventory', benefit: 'Discipline-ready',     accent: '#b45309' },
      { to: '/engineering/process/datasheet',                  icon: '📝', title: 'Process Datasheets',    tagline: 'Generate equipment datasheets',    benefit: 'One-click PDF',        accent: '#9d174d' },
      { to: '/engineering/instrument/datasheet',               icon: '🎛️', title: 'Instrument Datasheets', tagline: 'AI-extract instrument specs',      benefit: 'From vendor PDFs',     accent: '#0f766e' },
      { to: '/engineering/electrical/datasheet/smart',         icon: '⚡', title: 'Electrical Datasheets', tagline: 'Motor, transformer, cable specs',  benefit: 'Smart Excel editor',   accent: '#d97706' },
    ],
  },
  {
    category: 'Document Control',
    items: [
      { to: '/crs-documents',    icon: '🔄', title: 'Change Request System', tagline: 'Multi-revision document workflow', benefit: 'Chain review',       accent: '#1d4ed8' },
      { to: '/wrench-integration', icon: '🔗', title: 'Wrench Integration',   tagline: 'Sync handover to Smart Project',   benefit: 'Transmittal-ready', accent: '#6d28d9' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Soft-coded tab switcher (oil & gas themed)
// ---------------------------------------------------------------------------
// Each tab has an SVG icon renderer so the visual intent stays in config.
// Update this array to add/rename/reorder tabs without touching logic.
const NT_TABS = [
  {
    id: 'single',
    label: 'Single File',
    hint: 'One document · focused extraction',
    accent: '#059669',   // emerald — well-head
    iconKind: 'pipe',
  },
  {
    id: 'bulk',
    label: 'Bulk Master Index',
    hint: 'Folder → master index · drop & go',
    accent: '#0891b2',   // cyan — pipeline
    iconKind: 'gauge',
  },
];

// Inline SVG icon set — themed for oil & gas.
// `active` controls the animated accent (flow, needle sweep).
const NtTabIcon = ({ kind, active, accent }) => {
  if (kind === 'pipe') {
    // Well-head / valve wheel + single drop
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="10" r="5" stroke={accent} strokeWidth="1.6" />
        <path d="M12 5 V3 M12 17 V15 M7 10 H5 M19 10 H17 M8.5 6.5 L7 5 M15.5 6.5 L17 5 M8.5 13.5 L7 15 M15.5 13.5 L17 15"
              stroke={accent} strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="12" cy="10" r="1.6" fill={accent} />
        {active && (
          <path className="nt-droplet" d="M12 18 C 13 19.2 13 20.4 12 21 C 11 20.4 11 19.2 12 18 Z" fill={accent} />
        )}
      </svg>
    );
  }
  if (kind === 'gauge') {
    // Pressure gauge — needle sweeps when active
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="8.5" stroke={accent} strokeWidth="1.6" />
        <path d="M5 12 A7 7 0 0 1 19 12" stroke={accent} strokeWidth="1" strokeDasharray="1.5 2" opacity="0.5" />
        <g className={active ? 'nt-gauge-needle' : ''} style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}>
          <line x1="12" y1="12" x2="12" y2="5.5" stroke={accent} strokeWidth="1.6" strokeLinecap="round" />
        </g>
        <circle cx="12" cy="12" r="1.4" fill={accent} />
      </svg>
    );
  }
  return null;
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const NonTeffMetadataPage = () => {
  const navigate = useNavigate();
  const [mode,         setMode]          = useState('single'); // 'single' | 'bulk'
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
  const [tipIndex,      setTipIndex]      = useState(0);

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

  // Rotating pro-tip ticker (hero engagement only — no side-effects on logic)
  useEffect(() => {
    const t = setInterval(
      () => setTipIndex(i => (i + 1) % PRO_TIPS.length),
      PRO_TIP_ROTATE_MS,
    );
    return () => clearInterval(t);
  }, []);

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
  // Shared tab bar — oil & gas themed pill switcher with animated pipeline flow
  const TabBar = () => {
    const activeIndex = Math.max(0, NT_TABS.findIndex(t => t.id === mode));
    const activeTab = NT_TABS[activeIndex];
    return (
      <div style={{
        position: 'relative', zIndex: 3,
        maxWidth: 1600, margin: '0 auto',
        padding: '20px 24px 0 24px',
      }}>
        <style>{NT_KEYFRAMES}</style>

        {/* Pill container — single rounded capsule with animated pipeline underlay */}
        <div style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'stretch',
          gap: 4,
          padding: 5,
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(5,150,105,0.18)',
          borderRadius: 999,
          boxShadow: '0 10px 30px -12px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.6)',
          overflow: 'hidden',
        }}>
          {/* Animated pipeline stripe — drifts horizontally behind the pill */}
          <div className="nt-tab-pipeline" style={{
            position: 'absolute', left: 0, right: 0, bottom: 0,
            height: 3, borderRadius: 3, opacity: 0.85, pointerEvents: 'none',
          }} />

          {NT_TABS.map((t) => {
            const active = mode === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setMode(t.id)}
                className={active ? 'nt-tab-active' : 'nt-tab-inactive'}
                style={{
                  position: 'relative',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 20px 10px 14px',
                  minHeight: 46,
                  border: 'none',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: 0.1,
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                  background: active
                    ? `linear-gradient(135deg, ${t.accent} 0%, #0891b2 100%)`
                    : 'transparent',
                  color: active ? '#ffffff' : '#475569',
                }}
              >
                {/* Icon pod — circular well-head */}
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 30, height: 30, borderRadius: '50%',
                  background: active ? 'rgba(255,255,255,0.22)' : 'rgba(5,150,105,0.08)',
                  border: active ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(5,150,105,0.18)',
                  flexShrink: 0,
                }}>
                  <NtTabIcon kind={t.iconKind} active={active} accent={active ? '#ffffff' : t.accent} />
                </span>

                {/* Label + hint stacked */}
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                  <span>{t.label}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 500, letterSpacing: 0.2,
                    color: active ? 'rgba(255,255,255,0.85)' : '#94a3b8',
                  }}>
                    {t.hint}
                  </span>
                </span>

                {/* Active indicator dot — pulses */}
                {active && (
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#ffffff',
                    marginLeft: 2,
                    animation: 'ntPulse 1.6s ease-in-out infinite',
                    boxShadow: '0 0 8px rgba(255,255,255,0.8)',
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Active-tab breadcrumb strip */}
        <div style={{
          marginTop: 10,
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: 11, color: '#64748b', letterSpacing: 0.2,
        }}>
          <span style={{ color: '#047857', fontWeight: 600 }}>
            {activeTab.label}
          </span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: activeTab.accent }} />
          <span>{activeTab.hint}</span>
        </div>
      </div>
    );
  };

  // Bulk Master Index workflow (early-return, uses its own chrome)
  if (mode === 'bulk') {
    return (
      <div style={{ minHeight: '100vh', background: NT_T.bg, fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}>
        <style>{NT_KEYFRAMES}</style>
        {/* Animated background blobs — kept identical to Single mode for visual continuity */}
        {NT_T.blobs.map((b, i) => (
          <div key={i} style={{
            position: 'absolute', borderRadius: '50%', background: b.color,
            width: b.size, height: b.size,
            top: b.top, bottom: b.bottom, left: b.left, right: b.right,
            animation: b.anim, pointerEvents: 'none', zIndex: 0,
          }} />
        ))}
        <TabBar />
        <div style={{
          position: 'relative', zIndex: 2,
          maxWidth: 1600, margin: '16px auto 0',
          padding: '24px',
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(8px)',
          borderRadius: 16,
          border: '1px solid rgba(5,150,105,0.12)',
          boxShadow: '0 10px 40px -12px rgba(15,23,42,0.12)',
          marginBottom: 32,
        }}>
          <BulkMasterIndex />
        </div>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1600, margin: '0 auto', padding: '0 24px 32px' }}>
          <FeatureRecommendations navigate={navigate} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: NT_T.bg, fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden' }}>
      <style>{NT_KEYFRAMES}</style>
      <TabBar />

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
              <h1 className="nt-hero-title-sheen" style={{
                fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1,
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

            {/* Trust strip — soft-coded numeric badges */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12,
            }}>
              {TRUST_BADGES.map((b, i) => (
                <div key={b.label} className="nt-trust-badge" style={{
                  animationDelay: `${0.15 + i * 0.08}s`,
                  display: 'flex', alignItems: 'baseline', gap: 6,
                  padding: '5px 12px', borderRadius: 8,
                  background: 'linear-gradient(135deg, rgba(5,150,105,0.08), rgba(8,145,178,0.06))',
                  border: '1px solid rgba(5,150,105,0.15)',
                }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#047857', letterSpacing: '-0.02em' }}>
                    {b.value}
                  </span>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', letterSpacing: 0.2 }}>
                    {b.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Rotating Pro-Tip banner */}
            <div key={tipIndex} style={{
              marginTop: 12, maxWidth: 640,
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)',
              border: '1px dashed rgba(8,145,178,0.28)',
              animation: 'ntTipSlide 5.5s ease-in-out',
            }}>
              <LightBulbIcon style={{ width: 16, height: 16, color: '#0891b2', flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700, color: '#047857', marginRight: 6 }}>
                  {PRO_TIPS[tipIndex].icon} Pro Tip
                </span>
                {PRO_TIPS[tipIndex].text}
              </span>
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

        {/* ── Recommendations — discover more RAD AI tools ── */}
        <FeatureRecommendations navigate={navigate} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Presentational recommendation panel — soft-coded from RECOMMENDED_FEATURES.
// Receives navigate() so it never touches routing logic directly.
// ---------------------------------------------------------------------------
const FeatureRecommendations = ({ navigate }) => (
  <div className="nt-section" style={{ animationDelay: '0.25s', marginTop: 28 }}>
    <div style={{
      background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(10px)',
      border: '1px solid rgba(5,150,105,0.14)', borderRadius: 18,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 22px',
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        background: 'linear-gradient(90deg, rgba(5,150,105,0.1), rgba(8,145,178,0.07))',
        borderBottom: '1px solid rgba(5,150,105,0.1)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'linear-gradient(135deg, #059669, #0891b2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
        }}>
          <SparklesIcon style={{ width: 20, height: 20, color: '#fff' }} />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontWeight: 800, color: '#065f46', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
            Discover more RAD AI modules
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
            Extracted metadata flows straight into these connected tools — one click away.
          </div>
        </div>
        <span style={{
          background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(5,150,105,0.2)',
          borderRadius: 999, padding: '4px 12px',
          fontSize: '0.65rem', fontWeight: 700, color: '#047857', letterSpacing: 0.6,
        }}>
          RECOMMENDED FOR YOU
        </span>
      </div>

      {/* Category groups */}
      <div style={{ padding: '18px 22px 22px' }}>
        {RECOMMENDED_FEATURES.map((group) => (
          <div key={group.category} style={{ marginBottom: 18 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
            }}>
              <span style={{
                fontSize: '0.72rem', fontWeight: 700, color: '#047857',
                textTransform: 'uppercase', letterSpacing: 0.8,
              }}>
                {group.category}
              </span>
              <span style={{ flex: 1, height: 1, background: 'rgba(5,150,105,0.12)' }} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 12,
            }}>
              {group.items.map((item) => (
                <button
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className="nt-reco-card"
                  style={{
                    textAlign: 'left', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.95)',
                    border: `1px solid ${item.accent}26`,
                    borderLeft: `3px solid ${item.accent}`,
                    borderRadius: 12,
                    padding: '14px 16px',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    boxShadow: '0 2px 6px -3px rgba(15,23,42,0.06)',
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: `${item.accent}14`,
                    border: `1px solid ${item.accent}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.15rem',
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2,
                    }}>
                      <span style={{
                        fontWeight: 700, color: '#1f2937', fontSize: '0.87rem',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {item.title}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '0.74rem', color: '#64748b', lineHeight: 1.45, marginBottom: 6,
                    }}>
                      {item.tagline}
                    </div>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: `${item.accent}12`,
                      color: item.accent,
                      fontSize: '0.65rem', fontWeight: 700, letterSpacing: 0.3,
                      padding: '2px 8px', borderRadius: 999,
                      textTransform: 'uppercase',
                    }}>
                      {item.benefit}
                    </div>
                  </div>
                  <ArrowRightIcon
                    className="nt-reco-arrow"
                    style={{ width: 18, height: 18, color: item.accent, flexShrink: 0, marginTop: 4 }}
                  />
                </button>
              ))}
            </div>
          </div>
        ))}

        <div style={{
          marginTop: 6,
          textAlign: 'center',
          fontSize: '0.72rem', color: '#94a3b8',
        }}>
          💎 All modules included in your RAD AI subscription — no extra setup required.
        </div>
      </div>
    </div>
  </div>
);

export default NonTeffMetadataPage;
