import React, { useState, useEffect, useRef, useCallback } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';

import {

  PlusIcon,

  MagnifyingGlassIcon,

  ArrowDownTrayIcon,

  ArrowUpTrayIcon,

  CheckCircleIcon,

  XCircleIcon,

  ClockIcon,

  FunnelIcon,

  PencilSquareIcon,

  TrashIcon,

  ArrowPathIcon,

  ExclamationTriangleIcon

} from '@heroicons/react/24/outline';

import { usePageControls } from '../../../hooks/usePageControls';

import { PageControlButtons } from '../../../components/Common/PageControlButtons';

import { STORAGE_KEYS } from '../../../config/app.config';

import { API_BASE_URL } from '../../../config/api.config';

import { apiClientLongTimeout } from '../../../services/api.service';

import * as XLSX from 'xlsx';



// Simplified for Critical Line List only (single-purpose page)



const STATUS_COLORS = {

  active: 'green',

  pending: 'yellow',

  approved: 'blue',

  rejected: 'red',

  inactive: 'gray'

};



// ---------------------------------------------------------------------------
// Soft-coded UI theme — edit freely, no logic depends on this.
// Keeps visual styling centralised so future tweaks don't need to touch JSX.
// ---------------------------------------------------------------------------
const CLL_THEME = {
  pageBg:       'linear-gradient(145deg, #f8fafc 0%, #eef2ff 45%, #f1f5f9 100%)',
  heroGrad:     'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #0891b2 100%)',
  heroAccent:   '#4f46e5',
  cardBg:       'rgba(255,255,255,0.82)',
  cardBorder:   '1px solid rgba(79,70,229,0.12)',
  cardShadow:   '0 10px 30px -12px rgba(15,23,42,0.12)',
  subtleDivider:'1px solid rgba(148,163,184,0.18)',
};

// Enrichment breakdown shown in the hero banner (soft-coded, no duplication).
// Column counts are indicative — real backend returns 35 columns total.
const CLL_ENRICHMENT_SOURCES = [
  { key: 'pid',    label: 'P&ID',              cols: 8, color: '#3b82f6', desc: 'Base columns (Line No, Size, Fluid, Area, From/To)' },
  { key: 'hmb',    label: 'HMB/PFD',           cols: 6, color: '#059669', desc: 'Temp, Pressure, Flow Rate, Density' },
  { key: 'pms',    label: 'PMS',               cols: 8, color: '#d97706', desc: 'Material Grade, Schedule, Flanges, Gaskets' },
  { key: 'nace',   label: 'NACE',              cols: 6, color: '#dc2626', desc: 'Corrosion, Inspection, Coating class' },
  { key: 'stress', label: 'Stress Criticality', cols: 7, color: '#ca8a04', desc: 'Critical-line class, temp zone, stress tags' },
];
const CLL_TOTAL_DOCS = CLL_ENRICHMENT_SOURCES.length;       // 5
const CLL_TOTAL_COLS = CLL_ENRICHMENT_SOURCES.reduce((s, x) => s + x.cols, 0); // 35

// Hero capability chips — short marketing strip.
const CLL_CHIPS = [
  { icon: '🧪', label: 'Stress-critical' },
  { icon: '🧩', label: `${CLL_TOTAL_COLS}-column enrichment` },
  { icon: '🤖', label: 'AI-assisted extraction' },
  { icon: '📐', label: 'Format-aware regex' },
];

// Format selector definitions — central source of truth for labels & accents.
// `autoDetect: true` marks a format that internally delegates to every other
// sub-format and merges results (backend: GENERAL_STRATEGY='merge' in
// pid_ocr_extractor_v2.py). Keep this flag in sync with backend behaviour.
const CLL_FORMATS = [
  {
    id: 'onshore',
    label: 'Onshore',
    hint: 'No area · 2-D-5777-033842',
    accent: '#2563eb',
    icon: '🏭',
    pattern: 'SIZE-FLUID-SEQUENCE-PIPECLASS',
  },
  {
    id: 'general',
    label: 'General',
    hint: 'Auto-detect · tries every format',
    accent: '#059669',
    icon: '🧭',
    autoDetect: true,
    badge: 'AUTO',
    recommended: true,
    pattern: 'Auto-detect · merges Onshore + Offshore + ADNOC + Industrial',
    coversFormats: ['onshore', 'offshore', 'adnoc', 'industrial'],
  },
  {
    id: 'offshore',
    label: 'Offshore',
    hint: 'Area first · 604-HO-8-BC2GA0',
    accent: '#7c3aed',
    icon: '🌊',
    pattern: 'AREA-FLUID-SIZE-PIPECLASS-SEQUENCE',
  },
];

// One-time keyframes — scoped via the `cll-` prefix so they don't collide.
const CLL_KEYFRAMES = `
  @keyframes cllFadeUp   { from { opacity: 0; transform: translateY(8px);} to { opacity: 1; transform: translateY(0);} }
  @keyframes cllGradShift{ 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
  @keyframes cllPulse    { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }
  @keyframes cllCountIn  { from { opacity: 0; transform: translateY(6px) scale(0.95);} to { opacity: 1; transform: translateY(0) scale(1);} }
  @keyframes cllOrbit    { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
  @keyframes cllOrbitRev { from { transform: rotate(0deg);} to { transform: rotate(-360deg);} }
  @keyframes cllShimmer  { 0% { background-position: -200% 0;} 100% { background-position: 200% 0;} }
  @keyframes cllBlob     { 0%,100% { transform: translate(0,0) scale(1);} 33% { transform: translate(20px,-18px) scale(1.08);} 66% { transform: translate(-16px,14px) scale(0.95);} }
  @keyframes cllBarGlow  { 0%,100% { box-shadow: 0 0 12px rgba(124,58,237,0.45);} 50% { box-shadow: 0 0 22px rgba(124,58,237,0.85);} }
  @keyframes cllTipSlide { 0% { opacity: 0; transform: translateY(8px);} 10% { opacity: 1; transform: translateY(0);} 90% { opacity: 1; transform: translateY(0);} 100% { opacity: 0; transform: translateY(-6px);} }
  @keyframes cllScan     { 0% { transform: translateY(-100%);} 100% { transform: translateY(200%);} }
  .cll-fade-up    { animation: cllFadeUp 0.5s ease both; }
  .cll-count-in   { animation: cllCountIn 0.55s cubic-bezier(0.4,0,0.2,1) both; }
  .cll-grad-bar   { background-size: 280% 280%; animation: cllGradShift 7s ease infinite; }
  .cll-stat-card  { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .cll-stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 26px -10px rgba(79,70,229,0.28); }
  .cll-format-btn { transition: transform 0.2s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s ease, border-color 0.2s ease; }
  .cll-format-btn:hover:not(.cll-format-btn--active) { transform: translateY(-2px); }
  .cll-pulse-dot  { animation: cllPulse 1.8s ease-in-out infinite; }
  .cll-orbit-ring { animation: cllOrbit 18s linear infinite; }
  .cll-orbit-ring-rev { animation: cllOrbitRev 26s linear infinite; }
  .cll-blob       { animation: cllBlob 9s ease-in-out infinite; filter: blur(40px); }
  .cll-bar-fill   { background-image: linear-gradient(90deg,#6366f1,#8b5cf6,#06b6d4,#8b5cf6,#6366f1); background-size: 300% 100%; animation: cllGradShift 3.5s ease infinite, cllBarGlow 2.2s ease-in-out infinite; }
  .cll-bar-shimmer{ background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%); background-size: 200% 100%; animation: cllShimmer 2.2s linear infinite; }
  .cll-scan       { background: linear-gradient(180deg, transparent, rgba(99,102,241,0.28), transparent); animation: cllScan 2.4s ease-in-out infinite; }
`;

// Processing modal — doc chips displayed around animated orbit
const CLL_DOC_ORBIT = [
  { key: 'pid',    label: 'P&ID',    icon: '📐', color: '#3b82f6' },
  { key: 'hmb',    label: 'HMB',     icon: '📊', color: '#059669' },
  { key: 'pms',    label: 'PMS',     icon: '🔧', color: '#d97706' },
  { key: 'nace',   label: 'NACE',    icon: '⚗️', color: '#dc2626' },
  { key: 'stress', label: 'STRESS',  icon: '🧪', color: '#ca8a04' },
];

// Processing modal — stage tracker (keyed to percent ranges from processAllDocuments)
const CLL_PROC_STAGES = [
  { key: 'init',    label: 'Initialize',   icon: '🚀', from: 0,  to: 10 },
  { key: 'upload',  label: 'Upload',       icon: '📤', from: 10, to: 30 },
  { key: 'ocr',     label: 'OCR & Parse',  icon: '🔍', from: 30, to: 60 },
  { key: 'enrich',  label: 'AI Enrich',    icon: '🤖', from: 60, to: 95 },
  { key: 'finalize',label: 'Finalize',     icon: '✨', from: 95, to: 100 },
];

// Processing modal — rotating tips
const CLL_PROC_TIPS = [
  { icon: '💡', text: 'Line numbers are extracted via format-aware regex — your choice (Onshore / General / Offshore) drives the pattern.' },
  { icon: '🧠', text: 'HMB supplies temperature & pressure; PMS adds material grade; NACE tags corrosion service.' },
  { icon: '⚡', text: 'All 35 columns are reconciled in-memory — you only download the final, validated table.' },
  { icon: '🔒', text: 'Your documents stay inside your project. Extraction is project-scoped end-to-end.' },
  { icon: '📈', text: 'Stress-critical lines are auto-flagged from Section 7 + temperature analysis.' },
];
const CLL_PROC_TIP_ROTATE_MS = 5000;




const CriticalLineList = () => {

  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const fileInputRef = useRef(null);

  const fileInputWithAreaRef = useRef(null);

  const fileInputOffshoreRef = useRef(null);

  // Removed selectedListType state - single-purpose page for critical line list

  const [items, setItems] = useState([]);

  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const [statusFilter, setStatusFilter] = useState('all');

  const [showFilters, setShowFilters] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);

  const [uploadingPID, setUploadingPID] = useState(false);

  const [uploadResult, setUploadResult] = useState(null);

  const [processing, setProcessing] = useState(false);

  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const [extractedData, setExtractedData] = useState(null);

  const [showProcessingModal, setShowProcessingModal] = useState(false);

  const [processingProgress, setProcessingProgress] = useState({ step: '', percent: 0 });

  const [procTipIndex, setProcTipIndex] = useState(0);

  const [procStartedAt, setProcStartedAt] = useState(null);

  const [procElapsedMs, setProcElapsedMs] = useState(0);

  

  // Previous Outputs (Historical Download Feature)

  const [previousOutputs, setPreviousOutputs] = useState([]);

  const [loadingOutputs, setLoadingOutputs] = useState(false);

  // Inline action state — Modify modal + per-row Recheck/Delete progress

  const [editingOutput, setEditingOutput] = useState(null); // current output being edited

  const [editForm, setEditForm] = useState({}); // editable values

  const [savingEdit, setSavingEdit] = useState(false);

  const [rowActionId, setRowActionId] = useState(null); // id of row currently in delete/recheck

  const [rowActionType, setRowActionType] = useState(null); // 'delete' | 'recheck'

  const [recheckResults, setRecheckResults] = useState({}); // { [outputId]: { health, issues, drift, stats } }

  

  // Enrichment Documents (Optional - Do NOT block base extraction)

  const [pidDocument, setPidDocument] = useState(null);

  const [hmbDocument, setHmbDocument] = useState(null);

  const [pmsDocument, setPmsDocument] = useState(null);

  const [naceDocument, setNaceDocument] = useState(null);

  const [stressCriticalityDocument, setStressCriticalityDocument] = useState(null);

  const [selectedFormat, setSelectedFormat] = useState(null);

  const hmbRef = useRef(null);

  const pmsRef = useRef(null);

  const naceRef = useRef(null);

  const stressRef = useRef(null);

  

  // Line Number Format Configuration

  const STRICT_LINE_PATTERNS = {

    line_size: '\\d{1,2}',

    area: '\\d{2,3}',

    fluid_code: '[A-Z]{1,3}',

    sequence_no: '\\d{3,5}',

    pipe_class: '[A-Z0-9]{3,6}',

    insulation: '[A-Z]{1,2}'

  };

  const [showFormatConfigModal, setShowFormatConfigModal] = useState(false);

  const [lineNumberFormat, setLineNumberFormat] = useState({

    template: '',  // e.g., "SIZE-AREA-FLUID-SEQUENCE-PIPECLASS-INSULATION"

    components: [

      { id: 'line_size', name: 'Line Size', enabled: true, order: 1, pattern: '\\d{1,2}', example: '36' },

      { id: 'area', name: 'Area', enabled: false, order: 2, pattern: '\\d{2,3}', example: '41' },

      { id: 'fluid_code', name: 'Fluid Code', enabled: true, order: 3, pattern: '[A-Z]{1,3}', example: 'SWR' },

      { id: 'sequence_no', name: 'Sequence No', enabled: true, order: 4, pattern: '\\d{3,5}', example: '60302' },

      { id: 'pipe_class', name: 'Pipe Class', enabled: true, order: 5, pattern: '[A-Z0-9]{3,6}', example: 'A2AU16' },

      { id: 'insulation', name: 'Insulation', enabled: false, order: 6, pattern: '[A-Z]{1,2}', example: 'V' }

    ],

    separator: '-',  // Separator between components

    allowVariableSeparators: true  // Allow -, –, —, etc.

  });



  // Page controls (Fullscreen, Sidebar, Auto-refresh)

  const pageControls = usePageControls({

    refreshCallback: () => fetchData(true),

    autoRefreshInterval: 30000, // 30 seconds

    storageKey: 'designiq_lists_line_list',

  });



  // Load saved line format configuration from localStorage

  useEffect(() => {

    const savedConfig = localStorage.getItem('designiq_line_format_config');

    if (savedConfig) {

      try {

        const parsed = JSON.parse(savedConfig);

        const normalized = {

          ...parsed,

          components: (parsed.components || []).map((component) => ({

            ...component,

            pattern: STRICT_LINE_PATTERNS[component.id] || component.pattern

          }))

        };

        setLineNumberFormat(normalized);

      } catch (error) {

        console.error('Error loading saved format config:', error);

      }

    }

  }, []);



  // Fetch previous outputs for download

  const fetchPreviousOutputs = useCallback(async () => {

    setLoadingOutputs(true);

    try {

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      const response = await fetch(

        `${API_BASE_URL}/designiq/lists/previous_outputs/?list_type=line_list`,

        {

          headers: {

            'Authorization': `Bearer ${token}`

          }

        }

      );

      

      if (response.ok) {

        const data = await response.json();

        setPreviousOutputs(data.outputs || []);

      }

    } catch (error) {

      console.error('Error fetching previous outputs:', error);

    } finally {

      setLoadingOutputs(false);

    }

  }, []);



  const fetchData = useCallback(async (isAutoRefresh = false) => {

    if (isAutoRefresh) setIsRefreshing(true);

    else setLoading(true);

    try {

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      

      // Fetch items

      let itemsUrl = `${API_BASE_URL}/designiq/lists/?list_type=line_list`;

      if (statusFilter !== 'all') {

        itemsUrl += `&status=${statusFilter}`;

      }

      if (searchTerm) {

        itemsUrl += `&search=${searchTerm}`;

      }



      const itemsResponse = await fetch(itemsUrl, {

        headers: {

          'Authorization': `Bearer ${token}`,

          'Content-Type': 'application/json'

        }

      });

      

      if (itemsResponse.ok) {

        const itemsData = await itemsResponse.json();

        // API returns either array directly or object with results property (DRF pagination)

        setItems(Array.isArray(itemsData) ? itemsData : (itemsData.results || []));

      } else {

        setItems([]);

      }



      // Fetch stats

      const statsResponse = await fetch(

        `${API_BASE_URL}/designiq/lists/stats/?list_type=line_list`,

        {

          headers: {

            'Authorization': `Bearer ${token}`,

            'Content-Type': 'application/json'

          }

        }

      );

      

      if (statsResponse.ok) {

        const statsData = await statsResponse.json();

        setStats(statsData);

      }

    } catch (error) {

      console.error('Error fetching data:', error);

      setItems([]);

      setStats(null);

    } finally {

      setLoading(false);

      setIsRefreshing(false);

    }

  }, [statusFilter, searchTerm]);



  useEffect(() => {

    fetchData();

    fetchPreviousOutputs();

  }, [fetchData, fetchPreviousOutputs]);


  // Processing modal — rotate tips + track elapsed time while visible
  useEffect(() => {
    if (!showProcessingModal) {
      setProcTipIndex(0);
      setProcStartedAt(null);
      setProcElapsedMs(0);
      return;
    }
    const start = Date.now();
    setProcStartedAt(start);
    setProcElapsedMs(0);
    const tipTimer = setInterval(() => {
      setProcTipIndex((i) => (i + 1) % CLL_PROC_TIPS.length);
    }, CLL_PROC_TIP_ROTATE_MS);
    const clockTimer = setInterval(() => {
      setProcElapsedMs(Date.now() - start);
    }, 1000);
    return () => { clearInterval(tipTimer); clearInterval(clockTimer); };
  }, [showProcessingModal]);



  const handleSearch = () => {

    fetchData();

  };

  

  // Download historical Excel output

  const handleDownloadOutput = async (outputId, filename) => {

    try {

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      const response = await fetch(

        `${API_BASE_URL}/designiq/lists/download_output/${outputId}/`,

        {

          headers: {

            'Authorization': `Bearer ${token}`

          }

        }

      );

      

      if (response.ok) {

        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');

        a.href = url;

        a.download = filename;

        a.click();

        window.URL.revokeObjectURL(url);

      }

    } catch (error) {

      console.error('Error downloading output:', error);

      alert('Failed to download file');

    }

  };



  // ----------------------------------------------------------------------

  // SOFT-CODED output management — Delete / Modify / Recheck

  // ----------------------------------------------------------------------

  // Editable fields exposed in the Modify modal. Adding a row here is the

  // ONLY change required to expose a new field; the modal renders dynamically.

  const OUTPUT_EDITABLE_FIELDS = [

    { key: 'pid_number',          label: 'P&ID Number',     type: 'text',     required: true },

    { key: 'pid_revision',        label: 'Revision',        type: 'text' },

    { key: 'list_type',           label: 'List Type',       type: 'select',

      options: ['line_list', 'critical_line_list', 'stress_line_list', 'equipment_list'] },

    { key: 'format_type',         label: 'Format',          type: 'select',

      options: ['general', 'onshore', 'offshore', 'adnoc'] },

    { key: 'enrichment_enabled',  label: 'Enrichment',      type: 'boolean' },

    { key: 'include_area',        label: 'Include Area',    type: 'boolean' },

  ];

  const RECHECK_HEALTH_BADGE = {

    healthy: { label: '✓ Healthy',     cls: 'bg-green-100 text-green-700 border-green-200' },

    warning: { label: '⚠ Warning',    cls: 'bg-amber-100 text-amber-800 border-amber-200' },

    invalid: { label: '✕ Invalid',     cls: 'bg-rose-100 text-rose-700 border-rose-200' },

    error:   { label: '✕ Error',       cls: 'bg-rose-100 text-rose-700 border-rose-200' },

    missing_file: { label: '✕ Missing File', cls: 'bg-slate-100 text-slate-700 border-slate-300' },

  };



  const openEditModal = (output) => {

    setEditingOutput(output);

    setEditForm({

      pid_number: output.pid_number || '',

      pid_revision: output.pid_revision || '',

      list_type: output.list_type || 'line_list',

      format_type: output.format_type || 'general',

      enrichment_enabled: !!output.enrichment_enabled,

      include_area: !!output.include_area,

    });

  };



  const closeEditModal = () => {

    setEditingOutput(null);

    setEditForm({});

  };



  const handleSaveEdit = async () => {

    if (!editingOutput) return;

    if (!editForm.pid_number || !String(editForm.pid_number).trim()) {

      alert('P&ID Number is required');

      return;

    }

    setSavingEdit(true);

    try {

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      const res = await fetch(

        `${API_BASE_URL}/designiq/lists/update_output/${editingOutput.id}/`,

        {

          method: 'PATCH',

          headers: {

            'Authorization': `Bearer ${token}`,

            'Content-Type': 'application/json',

          },

          body: JSON.stringify(editForm),

        }

      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {

        throw new Error(data?.error || `Update failed (HTTP ${res.status})`);

      }

      // Apply locally so UI updates without a full refetch

      setPreviousOutputs((prev) =>

        prev.map((o) => (o.id === editingOutput.id ? { ...o, ...data.applied } : o))

      );

      closeEditModal();

    } catch (err) {

      console.error('Error updating output:', err);

      alert(`Failed to modify: ${err.message || err}`);

    } finally {

      setSavingEdit(false);

    }

  };



  const handleDeleteOutput = async (output) => {

    const confirmText = `Delete "${output.excel_filename || output.pid_number}"? This cannot be undone.`;

    if (!window.confirm(confirmText)) return;

    setRowActionId(output.id);

    setRowActionType('delete');

    try {

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      const res = await fetch(

        `${API_BASE_URL}/designiq/lists/delete_output/${output.id}/`,

        {

          method: 'DELETE',

          headers: { 'Authorization': `Bearer ${token}` },

        }

      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || `Delete failed (HTTP ${res.status})`);

      setPreviousOutputs((prev) => prev.filter((o) => o.id !== output.id));

      setRecheckResults((prev) => {

        const { [output.id]: _, ...rest } = prev;

        return rest;

      });

    } catch (err) {

      console.error('Error deleting output:', err);

      alert(`Failed to delete: ${err.message || err}`);

    } finally {

      setRowActionId(null);

      setRowActionType(null);

    }

  };



  const handleRecheckOutput = async (output) => {

    setRowActionId(output.id);

    setRowActionType('recheck');

    try {

      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      const res = await fetch(

        `${API_BASE_URL}/designiq/lists/recheck_output/${output.id}/`,

        {

          method: 'POST',

          headers: { 'Authorization': `Bearer ${token}` },

        }

      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data?.error || `Recheck failed (HTTP ${res.status})`);

      // Update row stats with refreshed values (drift may have corrected stale counts)

      if (data.stats) {

        setPreviousOutputs((prev) =>

          prev.map((o) => o.id === output.id

            ? {

                ...o,

                total_lines: data.stats.total_lines,

                total_columns: data.stats.total_columns,

                file_size_mb: data.stats.file_size_mb,

              }

            : o)

        );

      }

      setRecheckResults((prev) => ({ ...prev, [output.id]: data }));

    } catch (err) {

      console.error('Error rechecking output:', err);

      setRecheckResults((prev) => ({

        ...prev,

        [output.id]: { success: false, health: 'error', issues: [err.message || String(err)] },

      }));

    } finally {

      setRowActionId(null);

      setRowActionType(null);

    }

  };



  const pollTaskStatus = async (taskId) => {

    // Soft-coded polling configuration
    // Poll budget must exceed the Celery hard time limit
    // (backend/apps/designiq/tasks.py :: DESIGNIQ_TASK_HARD_LIMIT = 2700s / 45 min)
    // 600 attempts × 5s = 3000s = 50 min total → 5 min safety buffer over backend.

    const POLL_INTERVAL_MS = 5000;           // 5 sec between polls

    const POLL_MAX_ATTEMPTS = 600;           // 50 minutes total (> 45-min Celery cap)

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);



    // Awaitable loop — keeps the processing modal open until a terminal state

    // (SUCCESS / FAILURE / timeout) is reached. Previous recursive-setTimeout

    // implementation resolved the outer await immediately, causing the modal

    // to flash and close before the task finished.

    for (let attempts = 1; attempts <= POLL_MAX_ATTEMPTS; attempts++) {

      try {

        const response = await fetch(`${API_BASE_URL}/designiq/lists/upload_pid_status/${taskId}/`, {

          headers: { 'Authorization': `Bearer ${token}` }

        });



        if (!response.ok) throw new Error('Failed to check status');



        const status = await response.json();

        console.log(`📊 Poll ${attempts}/${POLL_MAX_ATTEMPTS}: ${status.state} - ${status.status}`);



        if (status.percent) {

          setProcessingProgress({

            step: status.status || 'Processing...',

            percent: Math.min(status.percent, 99)

          });

        }



        if (status.state === 'SUCCESS' && status.result) {

          console.log('✅ Task completed:', status.result);

          setProcessingProgress({ step: '✅ Complete!', percent: 100 });



          if (status.result.enriched_data && status.result.enriched_data.length > 0) {

            setExtractedData({ lines: status.result.enriched_data, isEnriched: true });

            setShowPreviewModal(true);

          } else if (status.result.extracted_lines && status.result.extracted_lines.length > 0) {

            setExtractedData({ lines: status.result.extracted_lines, isEnriched: false });

            setShowPreviewModal(true);

          }



          setUploadResult({

            success: true,

            message: status.result.message || 'Processing complete',

            total_lines: status.result.total_items || 0,

            enriched: status.result.enriched_data ? true : false

          });



          await fetchData();

          return;

        }



        if (status.state === 'FAILURE') {

          throw new Error(status.error || 'Task failed');

        }



        // PENDING / PROCESSING / anything else → wait and poll again

        await sleep(POLL_INTERVAL_MS);

      } catch (error) {

        console.error('Polling error:', error);

        setUploadResult({

          success: false,

          message: error.message || 'Failed to check processing status'

        });

        return;

      }

    }



    // Exhausted maxAttempts without terminal state

    setUploadResult({

      success: false,

      message: 'Timeout: Processing took too long'

    });

  };



  const processAllDocuments = async () => {

    if (!selectedFormat) {

      setUploadResult({

        success: false,

        message: 'Please select project format (Onshore/Offshore/General) before uploading.'

      });

      return;

    }

    

    if (!pidDocument || !hmbDocument || !pmsDocument || !naceDocument || !stressCriticalityDocument) {

      setUploadResult({

        success: false,

        message: 'Please upload all 5 documents before processing.'

      });

      return;

    }



    setUploadingPID(true);

    setProcessing(true);

    setUploadResult(null);

    setShowProcessingModal(true);

    setProcessingProgress({ step: 'Initializing 5-document enrichment...', percent: 5 });

    

    // Progress simulation for user feedback (backend does actual processing)

    setTimeout(() => setProcessingProgress({ step: '📤 Uploading P&ID + HMB + PMS + NACE...', percent: 10 }), 2000);

    setTimeout(() => setProcessingProgress({ step: '📄 Running OCR on P&ID drawing...', percent: 30 }), 8000);

    setTimeout(() => setProcessingProgress({ step: '🔍 Extracting 8 base columns...', percent: 50 }), 15000);

    setTimeout(() => setProcessingProgress({ step: '📊 Analyzing HMB (process data)...', percent: 65 }), 25000);

    setTimeout(() => setProcessingProgress({ step: '🔧 Analyzing PMS (materials)...', percent: 75 }), 35000);

    setTimeout(() => setProcessingProgress({ step: '⚗️ Analyzing NACE (corrosion)...', percent: 85 }), 45000);

    setTimeout(() => setProcessingProgress({ step: '🤖 AI enrichment (+26 columns)...', percent: 93 }), 60000);

    setTimeout(() => setProcessingProgress({ step: '✨ Finalizing 34-column table...', percent: 97 }), 75000);

    

    try {

      const formData = new FormData();

      formData.append('pid_file', pidDocument);

      formData.append('list_type', 'line_list');

      

      // CRITICAL MAPPING: Format type determines regex pattern and area handling

      // onshore → format_type='onshore', include_area=false

      //   Pattern: SIZE-FLUID-SEQUENCE-PIPECLASS

      //   Example: 2-D-5777-033842-X

      //

      // general → format_type='general', include_area=true

      //   Pattern: SIZE"-AREA-FLUID-SEQUENCE-PIPECLASS

      //   Example: 1"-41-SWS-64544-A2AU16-V

      //

      // offshore → format_type='offshore', include_area=true

      //   Pattern: AREA-FLUID-SIZE-PIPECLASS-SEQUENCE

      //   Example: 604-HO-8-BC2GA0-1070-H

      const includeArea = (selectedFormat === 'offshore' || selectedFormat === 'general');

      formData.append('include_area', includeArea ? 'true' : 'false');

      formData.append('format_type', selectedFormat);

      

      // Add line number format configuration

      const enabledComponents = lineNumberFormat.components

        .filter(c => c.enabled)

        .sort((a, b) => a.order - b.order);

      

      formData.append('line_format_config', JSON.stringify({

        components: enabledComponents.map(c => ({

          id: c.id,

          name: c.name,

          order: c.order,

          pattern: STRICT_LINE_PATTERNS[c.id] || c.pattern

        })),

        separator: lineNumberFormat.separator,

        allowVariableSeparators: lineNumberFormat.allowVariableSeparators

      }));



      // ENRICHMENT LAYER: Add all 5 documents for 35-column extraction

      formData.append('hmb_file', hmbDocument);

      formData.append('pms_file', pmsDocument);

      formData.append('nace_file', naceDocument);

      formData.append('stress_criticality_file', stressCriticalityDocument);

      console.log('[5-Doc Enrichment] All documents attached for 35-column extraction');



      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      

      if (!token) {

        setUploadResult({

          success: false,

          message: 'Authentication token not found. Please log in again.'

        });

        setUploadingPID(false);

        setProcessing(false);

        return;

      }



      // Create AbortController for timeout control (20 minutes for large files + AI processing)

      const controller = new AbortController();

      const timeoutId = setTimeout(() => controller.abort(), 1200000); // 20 minutes



      const response = await fetch(`${API_BASE_URL}/designiq/lists/upload_pid/`, {

        method: 'POST',

        headers: {

          'Authorization': `Bearer ${token}`

        },

        body: formData,

        signal: controller.signal

      });



      clearTimeout(timeoutId);



      if (response.ok) {

        const data = await response.json();

        console.log('Upload response:', data);

        console.log('Response keys:', Object.keys(data));

        console.log('Has enriched_data?', !!data.enriched_data, 'Length:', data.enriched_data?.length);

        console.log('Has extracted_lines?', !!data.extracted_lines, 'Length:', data.extracted_lines?.length);

        

        // If task_id returned, it's async processing - poll for results

        if (data.task_id && !data.enriched_data && !data.extracted_lines) {

          console.log(`🔄 Async mode: Task ${data.task_id} queued, starting polling...`);

          setProcessingProgress({ step: '⏳ Processing in background...', percent: 50 });

          await pollTaskStatus(data.task_id);

          return;

        }

        

        // Direct result (EAGER mode or task completed)

        setShowProcessingModal(false);

        setProcessing(false);

        setUploadingPID(false);

        

        if (data.enriched_data && data.enriched_data.length > 0) {

          console.log(`✓ ENRICHED: ${data.enriched_data.length} lines with 34 columns`);

          setExtractedData({ lines: data.enriched_data, isEnriched: true });

          setShowPreviewModal(true);

        } else if (data.extracted_lines && data.extracted_lines.length > 0) {

          console.log(`✓ BASE: ${data.extracted_lines.length} lines with 8 columns`);

          setExtractedData({ lines: data.extracted_lines, isEnriched: false });

          setShowPreviewModal(true);

        } else {

          console.warn('⚠️ No data in response:', data);

        }

        

        setUploadResult({

          success: true,

          message: data.message || 'Processing complete',

          task_id: data.task_id,

          total_lines: data.total_lines || 0,

          enriched: data.enriched_data ? true : false

        });

        

        await fetchData();

      } else {

        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));

        setUploadResult({

          success: false,

          message: errorData.error || 'Upload failed'

        });

      }

    } catch (error) {

      console.error('Error during processing:', error);

      

      let errorMessage = 'An error occurred during processing';

      if (error.name === 'AbortError') {

        errorMessage = 'Processing timeout (20 min exceeded). Files may be too large or backend overloaded.';

      } else if (error.message.includes('fetch')) {

        errorMessage = 'Network error: Unable to connect to server. Please check if backend is running.';

      } else {

        errorMessage = error.message || errorMessage;

      }

      

      setUploadResult({

        success: false,

        message: errorMessage

      });

    } finally {

      setUploadingPID(false);

      setProcessing(false);

      setShowProcessingModal(false);

      setProcessingProgress({ step: '', percent: 0 });

    }

  };



  const handlePIDUpload = async (event, includeArea = false, formatType = 'onshore') => {

    const file = event.target.files?.[0];

    if (!file) return;



    if (file.type !== 'application/pdf') {

      setUploadResult({

        success: false,

        message: 'Please upload a PDF file'

      });

      return;

    }



    setUploadingPID(true);

    setProcessing(true);

    setUploadResult(null);

    

    try {

      const formData = new FormData();

      formData.append('pid_file', file);

      formData.append('list_type', 'line_list');

      formData.append('include_area', includeArea ? 'true' : 'false');

      formData.append('format_type', formatType);

      

      // Add line number format configuration

      const enabledComponents = lineNumberFormat.components

        .filter(c => c.enabled)

        .sort((a, b) => a.order - b.order);

      

      formData.append('line_format_config', JSON.stringify({

        components: enabledComponents.map(c => ({

          id: c.id,

          name: c.name,

          order: c.order,

          pattern: STRICT_LINE_PATTERNS[c.id] || c.pattern

        })),

        separator: lineNumberFormat.separator,

        allowVariableSeparators: lineNumberFormat.allowVariableSeparators

      }));



      // ENRICHMENT LAYER (Optional - Does NOT block base extraction)

      if (hmbDocument) {

        formData.append('hmb_file', hmbDocument);

        console.log('[Enrichment] HMB document attached:', hmbDocument.name);

      }

      if (pmsDocument) {

        formData.append('pms_file', pmsDocument);

        console.log('[Enrichment] PMS document attached:', pmsDocument.name);

      }

      if (naceDocument) {

        formData.append('nace_file', naceDocument);

        console.log('[Enrichment] NACE document attached:', naceDocument.name);

      }

      if (stressCriticalityDocument) {

        formData.append('stress_criticality_file', stressCriticalityDocument);

        console.log('[Enrichment] Stress Criticality document attached:', stressCriticalityDocument.name);

      }



      const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      

      if (!token) {

        setUploadResult({

          success: false,

          message: 'Authentication token not found. Please log in again.'

        });

        return;

      }



      console.log('[P&ID Upload] ÃƒÂ°Ã…Â¸Ã…Â¡Ã¢â€š¬ Starting upload with extended timeout (10 minutes)...');

      console.log('[P&ID Upload] File:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');



      // Use long timeout client for OCR processing (10 minutes)

      const response = await apiClientLongTimeout.post(

        '/designiq/lists/upload_pid/',

        formData,

        {

          headers: {

            'Authorization': `Bearer ${token}`

            // Content-Type will be set automatically by axios for FormData

          },

          onUploadProgress: (progressEvent) => {

            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);

            console.log('[P&ID Upload] ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã…  Upload progress:', percentCompleted + '%');

          }

        }

      );



      console.log('[P&ID Upload] ÃƒÂ¢Ã…â€œÃ¢â‚¬¦ Processing complete');

      

      const data = response.data;

      

      // Detect enriched vs base extraction

      const isEnriched = data.enriched_data && data.enriched_data.length > 0;

      const lines = isEnriched ? data.enriched_data : (data.extracted_lines || []);

      const columns = isEnriched && lines.length > 0 ? Object.keys(lines[0]) : null;

      

      setExtractedData({

        lines: lines,

        fileName: file.name,

        itemsCreated: data.items_created || 0,

        isEnriched: isEnriched,

        columns: columns

      });

      setShowPreviewModal(true);

      setUploadResult({

        success: true,

        message: isEnriched 

          ? `Successfully enriched ${lines.length} lines with ${columns?.length || 0} columns from ${file.name}`

          : `Successfully extracted ${lines.length} line numbers from ${file.name}`,

        data: data

      });

      setUploadingPID(false);

    } catch (error) {

      console.error('[P&ID Upload] ÃƒÂ¢Ã‚ÂÃ…â€™ Error:', error);

      

      let errorMessage = 'Failed to upload P&ID';

      

      if (error.code === 'ECONNABORTED') {

        errorMessage = 'Upload timed out. The PDF might be too large or complex. Please try a smaller file or contact support.';

      } else if (error.response) {

        // Server responded with error

        const errorData = error.response.data;

        errorMessage = errorData.detail || errorData.error || error.response.statusText || errorMessage;

      } else if (error.request) {

        // Request made but no response

        errorMessage = 'No response from server. Please check your connection and try again.';

      } else {

        errorMessage = error.message || errorMessage;

      }

      

      setUploadResult({

        success: false,

        message: errorMessage

      });

    } finally {

      setProcessing(false);

      setUploadingPID(false);

      event.target.value = '';

    }

  };



  const getStatusBadge = (status) => {

    const color = STATUS_COLORS[status] || 'gray';

    const colorClasses = {

      green: 'bg-green-100 text-green-800',

      yellow: 'bg-yellow-100 text-yellow-800',

      blue: 'bg-blue-100 text-blue-800',

      red: 'bg-red-100 text-red-800',

      gray: 'bg-gray-100 text-gray-800'

    };



    return (

      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses[color]}`}>

        {status}

      </span>

    );

  };



  return (

    <div className="min-h-screen p-6" style={{ background: CLL_THEME.pageBg }}>

      {/* Apply control styles for fullscreen and sidebar */}

      <style>{pageControls.styles}</style>
      <style>{CLL_KEYFRAMES}</style>



      {/* ── Hero Header ─────────────────────────────────────────────────── */}

      <div
        className="cll-fade-up"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 20,
          padding: '22px 26px',
          marginBottom: 22,
          background: CLL_THEME.heroGrad,
          boxShadow: '0 14px 40px -14px rgba(79,70,229,0.45)',
        }}
      >
        {/* Decorative animated shine stripe */}
        <div
          className="cll-grad-bar"
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg,#fbbf24,#ffffff,#22d3ee,#a78bfa,#fbbf24)',
            opacity: 0.75,
          }}
        />
        {/* Ambient blobs */}
        <div style={{
          position: 'absolute', top: -40, right: -30,
          width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: '30%',
          width: 260, height: 260, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,165,233,0.18), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          position: 'relative', zIndex: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
            {/* Icon pod */}
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(8px)',
              flexShrink: 0,
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 12h3l2-5 4 10 2-5h7" />
                <circle cx="18" cy="6" r="1.6" fill="#fff" stroke="none" />
              </svg>
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{
                  margin: 0, color: '#fff', fontSize: '1.6rem', fontWeight: 800,
                  letterSpacing: '-0.02em', lineHeight: 1.15,
                }}>
                  Stress Critical Line List
                </h1>
                <span style={{
                  background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                  color: '#fff', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em',
                  padding: '3px 10px', borderRadius: 999,
                }}>AI-ENRICHED · {CLL_TOTAL_COLS} COLS</span>
              </div>
              <p style={{
                margin: '4px 0 10px', color: 'rgba(255,255,255,0.88)',
                fontSize: '0.85rem', lineHeight: 1.5, maxWidth: 620,
              }}>
                Upload a P&ID with HMB, PMS, NACE and Stress Criticality documents — RAD AI builds a {CLL_TOTAL_COLS}-column
                stress-critical register in one pass.
              </p>

              {/* Capability chip strip */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CLL_CHIPS.map((c) => (
                  <span key={c.label} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'rgba(255,255,255,0.14)',
                    border: '1px solid rgba(255,255,255,0.22)',
                    color: '#fff',
                    fontSize: '0.7rem', fontWeight: 600, letterSpacing: 0.1,
                    padding: '3px 10px', borderRadius: 999,
                    backdropFilter: 'blur(6px)',
                  }}>
                    <span>{c.icon}</span>{c.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Page control buttons — on a soft translucent pod so they read clearly */}
          <div style={{
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: 14, padding: 4,
            backdropFilter: 'blur(6px)',
          }}>
            <PageControlButtons

              sidebarVisible={pageControls.sidebarVisible}

              setSidebarVisible={pageControls.toggleSidebar}

              autoRefreshEnabled={pageControls.autoRefreshEnabled}

              setAutoRefreshEnabled={pageControls.toggleAutoRefresh}

              isFullscreen={pageControls.isFullscreen}

              toggleFullscreen={pageControls.toggleFullscreen}

              isRefreshing={isRefreshing}

              autoRefreshInterval={30}

            />
          </div>
        </div>

      </div>



      {/* ── Stats cards — glass tiles with icons & subtle hover lift ─── */}

      {stats && (
        <div
          className="cll-fade-up"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 14,
            marginBottom: 22,
            animationDelay: '0.08s',
          }}
        >
          {[
            { label: 'Total Items', value: stats.total,              color: '#1f2937', icon: '📋', accent: '#e2e8f0' },
            { label: 'Active',      value: stats.by_status.active,   color: '#059669', icon: '✓',  accent: '#d1fae5' },
            { label: 'Pending',     value: stats.by_status.pending,  color: '#d97706', icon: '⏳', accent: '#fef3c7' },
            { label: 'Approved',    value: stats.by_status.approved, color: '#2563eb', icon: '★',  accent: '#dbeafe' },
            { label: 'Validated',   value: stats.validated,          color: '#7c3aed', icon: '🛡', accent: '#ede9fe' },
          ].map((s, i) => (
            <div
              key={s.label}
              className="cll-stat-card cll-count-in"
              style={{
                animationDelay: `${0.1 + i * 0.06}s`,
                background: CLL_THEME.cardBg,
                backdropFilter: 'blur(8px)',
                border: CLL_THEME.cardBorder,
                borderRadius: 14,
                padding: '14px 16px',
                boxShadow: CLL_THEME.cardShadow,
                display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: s.accent, color: s.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.15rem', flexShrink: 0,
              }}>
                {s.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '1.6rem', fontWeight: 800, color: s.color,
                  lineHeight: 1, letterSpacing: '-0.02em',
                }}>
                  {s.value ?? 0}
                </div>
                <div style={{
                  fontSize: '0.72rem', color: '#64748b',
                  fontWeight: 600, marginTop: 3, letterSpacing: 0.2,
                }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}



      {/* Toolbar */}

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">

        <div className="flex items-center justify-between mb-4">

          <div className="flex items-center space-x-4 flex-1">

            {/* Search */}

            <div className="flex-1 max-w-lg">

              <div className="relative">

                <input

                  type="text"

                  placeholder="Search by tag or description..."

                  value={searchTerm}

                  onChange={(e) => setSearchTerm(e.target.value)}

                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}

                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"

                />

                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />

              </div>

            </div>



            {/* Filter Button */}

            <button

              onClick={() => setShowFilters(!showFilters)}

              className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"

            >

              <FunnelIcon className="w-5 h-5 mr-2" />

              Filters

            </button>

          </div>

        </div>

        

        {/* P&ID Upload Notice — hidden: content merged into unified workflow card below */}

      </div>

      

      {/* ── Unified Workflow Card — replaces the two stacked banners ─── */}

      <div
        className="cll-fade-up"
        style={{
          position: 'relative',
          background: CLL_THEME.cardBg,
          backdropFilter: 'blur(10px)',
          border: CLL_THEME.cardBorder,
          borderRadius: 18,
          padding: '20px 22px',
          marginBottom: 18,
          boxShadow: CLL_THEME.cardShadow,
          animationDelay: '0.14s',
        }}
      >
        {/* Left-edge accent stripe */}
        <div style={{
          position: 'absolute', top: 12, bottom: 12, left: 0, width: 4,
          background: 'linear-gradient(180deg,#4f46e5,#0891b2)',
          borderRadius: '0 4px 4px 0',
        }} />

        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10,
          flexWrap: 'wrap',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 16px -4px rgba(79,70,229,0.45)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{
              fontSize: '1.0rem', fontWeight: 800, color: '#1f2937',
              letterSpacing: '-0.01em', lineHeight: 1.2,
            }}>
              Smart Enriched Extraction
            </div>
            <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2 }}>
              Upload <strong>P&ID + HMB + PMS + NACE + Stress Criticality</strong> — RAD AI returns a unified {CLL_TOTAL_COLS}-column register.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem' }}>
            <span style={{
              background: 'linear-gradient(135deg,#4f46e5,#0891b2)',
              color: '#fff', fontWeight: 800, letterSpacing: 0.4,
              padding: '5px 12px', borderRadius: 999,
            }}>
              {CLL_TOTAL_COLS} COLS · {CLL_TOTAL_DOCS} DOCS
            </span>
          </div>
        </div>

        {/* Enrichment breakdown — compact chip row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          flexWrap: 'wrap', fontSize: '0.72rem',
          padding: '8px 10px', borderRadius: 10,
          background: 'rgba(248,250,252,0.7)',
          border: '1px dashed rgba(148,163,184,0.3)',
        }}>
          {CLL_ENRICHMENT_SOURCES.map((src, i) => (
            <React.Fragment key={src.key}>
              <span
                title={src.desc}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 8,
                  background: `${src.color}14`,
                  color: src.color,
                  border: `1px solid ${src.color}30`,
                  fontWeight: 700,
                }}
              >
                {src.label}
                <span style={{
                  background: src.color, color: '#fff',
                  borderRadius: 999, padding: '0 6px',
                  fontSize: '0.64rem', lineHeight: 1.5,
                }}>
                  +{src.cols}
                </span>
              </span>
              {i < CLL_ENRICHMENT_SOURCES.length - 1 && (
                <span style={{ color: '#94a3b8', fontWeight: 700 }}>+</span>
              )}
            </React.Fragment>
          ))}
          <span style={{ color: '#94a3b8', fontWeight: 700 }}>=</span>
          <span style={{
            background: 'linear-gradient(90deg,#4f46e5,#7c3aed)',
            color: '#fff', padding: '3px 10px', borderRadius: 8,
            fontWeight: 800, letterSpacing: 0.2,
          }}>
            {CLL_TOTAL_COLS} total
          </span>
        </div>
      </div>



      {/* ── 5-Document Enriched Extraction — Upload workflow ─── */}

      <div className="cll-fade-up" style={{ animationDelay: '0.2s' }}>

            {/* Step 1 — Format selection (refined from loud yellow banner) */}

            <div
              style={{
                background: CLL_THEME.cardBg,
                backdropFilter: 'blur(10px)',
                border: CLL_THEME.cardBorder,
                borderRadius: 16,
                padding: '18px 20px',
                marginBottom: 16,
                boxShadow: CLL_THEME.cardShadow,
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
                flexWrap: 'wrap',
              }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 26, height: 26, borderRadius: '50%',
                  background: selectedFormat ? '#059669' : '#f59e0b',
                  color: '#fff', fontSize: '0.75rem', fontWeight: 800,
                  transition: 'background 0.3s ease',
                }}>
                  {selectedFormat ? '✓' : '1'}
                </span>
                <span style={{
                  fontSize: '0.88rem', fontWeight: 700, color: '#1f2937',
                  letterSpacing: '-0.01em',
                }}>
                  Select project format
                </span>
                {!selectedFormat && (
                  <span className="cll-pulse-dot" style={{
                    fontSize: '0.68rem', fontWeight: 600, color: '#b45309',
                    background: '#fef3c7', border: '1px solid #fde68a',
                    padding: '2px 8px', borderRadius: 999,
                  }}>
                    Required
                  </span>
                )}
                <span style={{
                  marginLeft: 'auto', fontSize: '0.7rem', color: '#64748b',
                }}>
                  Determines regex patterns for line-number parsing
                </span>
              </div>



              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 10, marginTop: 12,
              }}>
                {CLL_FORMATS.map((f) => {
                  const active = selectedFormat === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFormat(f.id)}
                      className={`cll-format-btn ${active ? 'cll-format-btn--active' : ''}`}
                      style={{
                        position: 'relative',
                        textAlign: 'left', cursor: 'pointer',
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: active ? `2px solid ${f.accent}` : '1px solid rgba(148,163,184,0.28)',
                        background: active
                          ? `linear-gradient(135deg, ${f.accent}, ${f.accent}dd)`
                          : f.autoDetect
                          ? `linear-gradient(135deg, rgba(255,255,255,0.92), ${f.accent}10)`
                          : 'rgba(255,255,255,0.75)',
                        color: active ? '#fff' : '#374151',
                        boxShadow: active
                          ? `0 8px 22px -8px ${f.accent}88`
                          : f.autoDetect
                          ? `0 4px 14px -6px ${f.accent}55`
                          : 'none',
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                      }}
                    >
                      {/* Recommended ribbon for auto-detect */}
                      {f.recommended && !active && (
                        <span style={{
                          position: 'absolute', top: -8, right: 10,
                          fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.1em',
                          background: `linear-gradient(135deg, ${f.accent}, ${f.accent}cc)`,
                          color: '#fff', padding: '2px 8px', borderRadius: 999,
                          boxShadow: `0 4px 10px -2px ${f.accent}66`,
                        }}>
                          ★ RECOMMENDED
                        </span>
                      )}

                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: active ? 'rgba(255,255,255,0.22)' : `${f.accent}14`,
                        border: active ? '1px solid rgba(255,255,255,0.35)' : `1px solid ${f.accent}30`,
                        color: active ? '#fff' : f.accent,
                        fontSize: '1rem', fontWeight: 800,
                      }}>
                        {f.icon}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>
                            {f.label}
                          </span>
                          {f.badge && (
                            <span style={{
                              fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.12em',
                              background: active ? 'rgba(255,255,255,0.25)' : `${f.accent}1f`,
                              color: active ? '#fff' : f.accent,
                              border: active ? '1px solid rgba(255,255,255,0.4)' : `1px solid ${f.accent}55`,
                              padding: '2px 7px', borderRadius: 999,
                              display: 'inline-flex', alignItems: 'center', gap: 3,
                            }}>
                              <span className="cll-pulse-dot" style={{
                                width: 5, height: 5, borderRadius: '50%',
                                background: active ? '#fff' : f.accent,
                                display: 'inline-block',
                              }} />
                              {f.badge}
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '0.68rem',
                          color: active ? 'rgba(255,255,255,0.88)' : '#64748b',
                          marginTop: 2,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {f.hint}
                        </div>
                        {/* Sub-format coverage chips (auto-detect only) */}
                        {f.autoDetect && f.coversFormats && (
                          <div style={{
                            display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 6,
                          }}>
                            {f.coversFormats.map((sub) => (
                              <span key={sub} style={{
                                fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.04em',
                                padding: '1px 6px', borderRadius: 6,
                                background: active ? 'rgba(255,255,255,0.2)' : `${f.accent}14`,
                                color: active ? 'rgba(255,255,255,0.95)' : f.accent,
                                border: active ? '1px solid rgba(255,255,255,0.3)' : `1px solid ${f.accent}30`,
                                textTransform: 'uppercase',
                              }}>
                                {sub}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      {active && (
                        <span style={{
                          marginLeft: 'auto', alignSelf: 'center',
                          width: 8, height: 8, borderRadius: '50%',
                          background: '#fff', boxShadow: '0 0 8px rgba(255,255,255,0.9)',
                        }} />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Auto-detect explainer — appears when General (auto) is selected */}
              {(() => {
                const fmt = CLL_FORMATS.find(f => f.id === selectedFormat);
                if (!fmt || !fmt.autoDetect) return null;
                return (
                  <div style={{
                    marginTop: 12, padding: '10px 14px', borderRadius: 10,
                    background: `linear-gradient(135deg, ${fmt.accent}10, ${fmt.accent}05)`,
                    border: `1px dashed ${fmt.accent}55`,
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    fontSize: '0.75rem', color: '#334155',
                  }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                      background: `${fmt.accent}20`, color: fmt.accent, fontWeight: 800,
                    }}>
                      🤖
                    </span>
                    <div>
                      <strong style={{ color: fmt.accent }}>Auto-detection enabled.</strong>{' '}
                      RAD AI will run every known pattern ({fmt.coversFormats.map(s => s.toUpperCase()).join(' · ')})
                      against each line and merge unique matches — no need to guess your project's format.
                    </div>
                  </div>
                );
              })()}

            </div>



            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">

              {/* Document 1: P&ID (Mandatory) */}

              <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">

                <div className="flex items-center justify-between mb-2">

                  <label className="text-sm font-bold text-blue-900">1. P&ID Drawing</label>

                  <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">Mandatory</span>

                </div>

                <p className="text-xs text-blue-700 mb-3">Extracts: Line No, Size, Fluid Code, Area, From, To</p>

                <input

                  type="file"

                  accept=".pdf"

                  onChange={(e) => {

                    const file = e.target.files?.[0];

                    if (file && file.type === 'application/pdf') {

                      setPidDocument(file);

                      // Format must be selected explicitly by user before upload

                    } else {

                      alert('Please select a valid PDF file.');

                    }

                  }}

                  className="hidden"

                  id="pidFileInput"

                />

                <label

                  htmlFor="pidFileInput"

                  className="w-full flex items-center justify-center px-3 py-2 text-sm border-2 border-blue-400 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"

                >

                  {pidDocument ? (

                    <>

                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />

                      </svg>

                      <span className="truncate text-xs">{pidDocument.name}</span>

                    </>

                  ) : (

                    <>

                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />

                      </svg>

                      Select P&ID

                    </>

                  )}

                </label>

                {pidDocument && (

                  <button

                    onClick={() => setPidDocument(null)}

                    className="w-full mt-2 text-xs text-red-600 hover:text-red-800 font-medium"

                  >

                    Remove

                  </button>

                )}

              </div>



              {/* Document 2: HMB/PFD */}

              <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">

                <div className="flex items-center justify-between mb-2">

                  <label className="text-sm font-bold text-green-900">2. HMB/PFD</label>

                  <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">+10 cols</span>

                </div>

                <p className="text-xs text-green-700 mb-3">Design/Operating Temp, Pressure, Flow Rate, Density</p>

                <input

                  type="file"

                  ref={hmbRef}

                  accept=".pdf,.xlsx,.xls"

                  onChange={(e) => setHmbDocument(e.target.files?.[0] || null)}

                  className="hidden"

                />

                <button

                  onClick={() => hmbRef.current?.click()}

                  className="w-full flex items-center justify-center px-3 py-2 text-sm border-2 border-green-400 text-green-700 rounded-lg hover:bg-green-100 transition-colors"

                >

                  {hmbDocument ? (

                    <>

                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />

                      </svg>

                      <span className="truncate text-xs">{hmbDocument.name}</span>

                    </>

                  ) : (

                    <>

                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />

                      </svg>

                      Select HMB

                    </>

                  )}

                </button>

                {hmbDocument && (

                  <button

                    onClick={() => setHmbDocument(null)}

                    className="w-full mt-2 text-xs text-red-600 hover:text-red-800 font-medium"

                  >

                    Remove

                  </button>

                )}

              </div>



              {/* Document 3: PMS */}

              <div className="border-2 border-orange-300 rounded-lg p-4 bg-orange-50">

                <div className="flex items-center justify-between mb-2">

                  <label className="text-sm font-bold text-orange-900">3. PMS</label>

                  <span className="px-2 py-1 bg-orange-600 text-white text-xs rounded-full">+8 cols</span>

                </div>

                <p className="text-xs text-orange-700 mb-3">Material Grade, Schedule, Flange Rating, Gaskets</p>

                <input

                  type="file"

                  ref={pmsRef}

                  accept=".pdf,.xlsx,.xls"

                  onChange={(e) => setPmsDocument(e.target.files?.[0] || null)}

                  className="hidden"

                />

                <button

                  onClick={() => pmsRef.current?.click()}

                  className="w-full flex items-center justify-center px-3 py-2 text-sm border-2 border-orange-400 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"

                >

                  {pmsDocument ? (

                    <>

                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />

                      </svg>

                      <span className="truncate text-xs">{pmsDocument.name}</span>

                    </>

                  ) : (

                    <>

                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />

                      </svg>

                      Select PMS

                    </>

                  )}

                </button>

                {pmsDocument && (

                  <button

                    onClick={() => setPmsDocument(null)}

                    className="w-full mt-2 text-xs text-red-600 hover:text-red-800 font-medium"

                  >

                    Remove

                  </button>

                )}

              </div>



              {/* Document 4: NACE */}

              <div className="border-2 border-red-300 rounded-lg p-4 bg-red-50">

                <div className="flex items-center justify-between mb-2">

                  <label className="text-sm font-bold text-red-900">4. NACE Report</label>

                  <span className="px-2 py-1 bg-red-600 text-white text-xs rounded-full">+8 cols</span>

                </div>

                <p className="text-xs text-red-700 mb-3">Corrosion Allowance, NACE Class, H2S, Coating</p>

                <input

                  type="file"

                  ref={naceRef}

                  accept=".pdf,.xlsx,.xls"

                  onChange={(e) => setNaceDocument(e.target.files?.[0] || null)}

                  className="hidden"

                />

                <button

                  onClick={() => naceRef.current?.click()}

                  className="w-full flex items-center justify-center px-3 py-2 text-sm border-2 border-red-400 text-red-700 rounded-lg hover:bg-red-100 transition-colors"

                >

                  {naceDocument ? (

                    <>

                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />

                      </svg>

                      <span className="truncate text-xs">{naceDocument.name}</span>

                    </>

                  ) : (

                    <>

                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />

                      </svg>

                      Select NACE

                    </>

                  )}

                </button>

                {naceDocument && (

                  <button

                    onClick={() => setNaceDocument(null)}

                    className="w-full mt-2 text-xs text-red-600 hover:text-red-800 font-medium"

                  >

                    Remove

                  </button>

                )}

              </div>



              {/* Document 5: Stress Criticality */}

              <div className="border-2 border-yellow-300 rounded-lg p-4 bg-yellow-50">

                <div className="flex items-center justify-between mb-2">

                  <label className="text-sm font-bold text-yellow-900">5. Stress Criticality</label>

                  <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded-full">+1 col</span>

                </div>

                <p className="text-xs text-yellow-700 mb-3">Section 7 + Temperature Analysis</p>

                <input

                  type="file"

                  ref={stressRef}

                  accept=".pdf,.xlsx,.xls"

                  onChange={(e) => setStressCriticalityDocument(e.target.files?.[0] || null)}

                  className="hidden"

                />

                <button

                  onClick={() => stressRef.current?.click()}

                  className="w-full flex items-center justify-center px-3 py-2 text-sm border-2 border-yellow-400 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"

                >

                  {stressCriticalityDocument ? (

                    <>

                      <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />

                      </svg>

                      <span className="truncate text-xs">{stressCriticalityDocument.name}</span>

                    </>

                  ) : (

                    <>

                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />

                      </svg>

                      Select Stress Document

                    </>

                  )}

                </button>

                {stressCriticalityDocument && (

                  <button

                    onClick={() => setStressCriticalityDocument(null)}

                    className="w-full mt-2 text-xs text-yellow-600 hover:text-yellow-800 font-medium"

                  >

                    Remove

                  </button>

                )}

              </div>

            </div>



            {/* Status Indicator & Process Button */}

            <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-300 rounded-lg">

              <div className="flex items-center justify-between">

                <div className="flex items-center space-x-4">

                  <div className={`w-4 h-4 rounded-full ${

                    pidDocument && hmbDocument && pmsDocument && naceDocument && stressCriticalityDocument

                      ? 'bg-green-500 animate-pulse' 

                      : 'bg-gray-300'

                  }`}></div>

                  <div>

                    <span className="text-sm font-medium text-gray-700">

                      Documents: <strong className="text-lg">{[pidDocument, hmbDocument, pmsDocument, naceDocument, stressCriticalityDocument].filter(Boolean).length}/5</strong> uploaded

                    </span>

                    <div className="flex items-center space-x-2 mt-1">

                      <span className={`text-xs px-2 py-0.5 rounded ${

                        pidDocument ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'

                      }`}>P&ID</span>

                      <span className={`text-xs px-2 py-0.5 rounded ${

                        hmbDocument ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'

                      }`}>HMB</span>

                      <span className={`text-xs px-2 py-0.5 rounded ${

                        pmsDocument ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'

                      }`}>PMS</span>

                      <span className={`text-xs px-2 py-0.5 rounded ${

                        naceDocument ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'

                      }`}>NACE</span>

                      <span className={`text-xs px-2 py-0.5 rounded ${

                        stressCriticalityDocument ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'

                      }`}>STRESS</span>

                    </div>

                  </div>

                </div>

                <button

                  onClick={processAllDocuments}

                  disabled={!pidDocument || !hmbDocument || !pmsDocument || !naceDocument || !stressCriticalityDocument || loading}

                  className={`px-6 py-3 rounded-lg font-bold text-white transition-all transform hover:scale-105 ${

                    pidDocument && hmbDocument && pmsDocument && naceDocument && stressCriticalityDocument && !loading

                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg animate-pulse'

                      : 'bg-gray-300 cursor-not-allowed'

                  }`}

                >

                  {loading ? (

                    <div className="flex items-center space-x-2">

                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">

                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>

                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>

                      </svg>

                      <span>Processing...</span>

                    </div>

                  ) : (

                    <div className="flex items-center space-x-2">

                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />

                      </svg>

                      <span>Process All 5 Documents</span>

                    </div>

                  )}

                </button>

              </div>

              {pidDocument && hmbDocument && pmsDocument && naceDocument && stressCriticalityDocument && !loading && (

                <div className="mt-3 flex items-center justify-center text-sm text-green-600 font-semibold">

                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">

                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                  </svg>

                  Ready! Click "Process All 5 Documents" to extract 35 columns (8 base from P&ID + 27 enriched via AI)

                </div>

              )}

              {(!pidDocument || !hmbDocument || !pmsDocument || !naceDocument || !stressCriticalityDocument) && (

                <div className="mt-3 text-center text-sm text-yellow-700 font-medium">

                  ⚠️ Upload all 5 documents to enable processing with 35-column enrichment

                </div>

              )}

            </div>

          </div>



        {/* Filter Panel */}

        {showFilters && (

          <div className="mt-4 pt-4 border-t border-gray-200">

            <div className="flex items-center space-x-4">

              <label className="text-sm font-medium text-gray-700">Status:</label>

              <select

                value={statusFilter}

                onChange={(e) => setStatusFilter(e.target.value)}

                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"

              >

                <option value="all">All Status</option>

                <option value="active">Active</option>

                <option value="pending">Pending</option>

                <option value="approved">Approved</option>

                <option value="rejected">Rejected</option>

                <option value="inactive">Inactive</option>

              </select>

            </div>

          </div>

        )}



      {/* Upload Result Notification */}

      {uploadResult && (

        <div className="fixed bottom-8 right-8 z-50 animate-slide-up">

          <div className={`rounded-xl shadow-2xl p-6 max-w-md ${

            uploadResult.success 

              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'

              : 'bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200'

          }`}>

            <div className="flex items-start">

              <div className={`flex-shrink-0 ${

                uploadResult.success ? 'text-green-600' : 'text-red-600'

              }`}>

                {uploadResult.success ? (

                  <CheckCircleIcon className="h-8 w-8" />

                ) : (

                  <XCircleIcon className="h-8 w-8" />

                )}

              </div>

              <div className="ml-4 flex-1">

                <h3 className={`text-lg font-semibold ${

                  uploadResult.success ? 'text-green-900' : 'text-red-900'

                }`}>

                  {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}

                </h3>

                <p className={`mt-2 text-sm ${

                  uploadResult.success ? 'text-green-700' : 'text-red-700'

                }`}>

                  {uploadResult.message}

                </p>

                {uploadResult.success && uploadResult.data?.extracted_lines && (

                  <div className="mt-3 text-xs text-green-600 font-medium">

                    <p>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ OCR processing completed</p>

                    <p>ÃƒÂ¢Ã…â€œÃ¢â‚¬Å“ {uploadResult.data.extracted_lines.length} line numbers detected</p>

                  </div>

                )}

              </div>

              <button

                onClick={() => setUploadResult(null)}

                className="ml-4 text-gray-400 hover:text-gray-600"

              >

                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">

                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />

                </svg>

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Processing Overlay */}

      {processing && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl p-8 max-w-md shadow-2xl">

            <div className="flex flex-col items-center">

              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mb-4"></div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">Processing P&ID Document</h3>

              <p className="text-gray-600 text-center mb-4">

                Using Multi-Engine OCR + AI to extract line numbers...

              </p>

              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-3">

                <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full animate-pulse" style={{ width: '70%' }}></div>

              </div>

              <div className="space-y-2 text-sm text-gray-600 w-full">

                <div className="flex items-center">

                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>

                  <span>Tesseract OCR (Horizontal text)</span>

                </div>

                <div className="flex items-center">

                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>

                  <span>EasyOCR (Vertical text detection)</span>

                </div>

                <div className="flex items-center">

                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2 animate-pulse"></div>

                  <span>PaddleOCR (Multi-orientation)</span>

                </div>

                <div className="flex items-center">

                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>

                  <span>OpenAI GPT-4 (Smart parsing)</span>

                </div>

              </div>

              <p className="text-sm text-gray-500 mt-4 text-center">

                ÃƒÂ¢Ã‚Ã‚Â±ÃƒÂ¯Ã‚Â¸Ã‚ <strong>Processing time:</strong> 2-10 minutes for complex PDFs

                <br />

                <span className="text-xs">Please keep this window open</span>

              </p>

            </div>

          </div>

        </div>

      )}



      {/* Processing Modal with Progress */}

      {showProcessingModal && (() => {
        const pct = Math.max(0, Math.min(100, processingProgress.percent || 0));
        const activeStage =
          CLL_PROC_STAGES.find(s => pct >= s.from && pct < s.to) ||
          CLL_PROC_STAGES[CLL_PROC_STAGES.length - 1];
        const elapsedSec = Math.floor(procElapsedMs / 1000);
        const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
        const ss = String(elapsedSec % 60).padStart(2, '0');
        const tip = CLL_PROC_TIPS[procTipIndex] || CLL_PROC_TIPS[0];

        return (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            style={{
              background: 'radial-gradient(circle at 30% 20%, rgba(79,70,229,0.22), rgba(8,11,28,0.85) 55%, rgba(0,0,0,0.92) 100%)',
              backdropFilter: 'blur(6px)',
            }}
          >
            <div
              className="cll-fade-up"
              style={{
                position: 'relative',
                width: '100%', maxWidth: 720,
                borderRadius: 24,
                overflow: 'hidden',
                background: 'linear-gradient(160deg, rgba(15,17,37,0.96) 0%, rgba(24,22,58,0.96) 50%, rgba(12,28,50,0.96) 100%)',
                border: '1px solid rgba(148,163,255,0.22)',
                boxShadow: '0 30px 80px -20px rgba(79,70,229,0.55), 0 0 0 1px rgba(255,255,255,0.04) inset',
                color: '#e2e8f0',
              }}
            >
              {/* Ambient blobs */}
              <div className="cll-blob" style={{ position:'absolute', width:260, height:260, borderRadius:'50%', background:'#6366f1', opacity:0.35, top:-80, left:-60, pointerEvents:'none' }} />
              <div className="cll-blob" style={{ position:'absolute', width:220, height:220, borderRadius:'50%', background:'#06b6d4', opacity:0.28, bottom:-70, right:-50, animationDelay:'-3s', pointerEvents:'none' }} />

              <div style={{ position:'relative', padding:'28px 28px 24px' }}>
                {/* Header */}
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                  <span style={{
                    fontSize:'0.62rem', fontWeight:800, letterSpacing:'0.16em',
                    background:'linear-gradient(135deg,#6366f1,#06b6d4)', color:'#fff',
                    padding:'4px 10px', borderRadius:999,
                  }}>
                    RAD AI · LIVE
                  </span>
                  <div style={{ height:6, width:6, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 10px #22c55e' }} className="cll-pulse-dot" />
                  <span style={{ fontSize:'0.72rem', color:'#94a3b8' }}>Stress-Critical Line List · 5-document pipeline</span>
                  <span style={{ marginLeft:'auto', fontVariantNumeric:'tabular-nums', fontSize:'0.78rem', color:'#c7d2fe', background:'rgba(99,102,241,0.14)', padding:'4px 10px', borderRadius:999, border:'1px solid rgba(99,102,241,0.3)' }}>
                    ⏱ {mm}:{ss}
                  </span>
                </div>

                {/* Orbit + central percent */}
                <div style={{ position:'relative', width:230, height:230, margin:'4px auto 16px' }}>
                  {/* Outer scanning ring */}
                  <div style={{
                    position:'absolute', inset:0, borderRadius:'50%',
                    border:'1px dashed rgba(148,163,255,0.35)',
                  }} className="cll-orbit-ring" />
                  {/* Inner ring */}
                  <div style={{
                    position:'absolute', inset:22, borderRadius:'50%',
                    border:'1px solid rgba(6,182,212,0.35)',
                  }} className="cll-orbit-ring-rev" />

                  {/* Doc chips around the outer ring */}
                  {CLL_DOC_ORBIT.map((d, i) => {
                    const angle = (i / CLL_DOC_ORBIT.length) * 2 * Math.PI - Math.PI/2;
                    const r = 108;
                    const x = 115 + r * Math.cos(angle) - 22;
                    const y = 115 + r * Math.sin(angle) - 22;
                    return (
                      <div key={d.key}
                        title={d.label}
                        style={{
                          position:'absolute', left:x, top:y,
                          width:44, height:44, borderRadius:12,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          background:`linear-gradient(135deg, ${d.color}33, ${d.color}11)`,
                          border:`1px solid ${d.color}80`,
                          boxShadow:`0 0 18px -4px ${d.color}88`,
                          fontSize:'1.2rem',
                          animation:`cllPulse 2.4s ease-in-out ${i * 0.25}s infinite`,
                        }}
                      >
                        {d.icon}
                      </div>
                    );
                  })}

                  {/* Center percent dial */}
                  <div style={{
                    position:'absolute', inset:48, borderRadius:'50%',
                    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                    background:'radial-gradient(circle, rgba(79,70,229,0.4), rgba(15,17,37,0.9) 70%)',
                    border:'1px solid rgba(148,163,255,0.4)',
                    boxShadow:'0 0 40px rgba(99,102,241,0.5) inset',
                  }}>
                    <div style={{
                      fontSize:'2.6rem', fontWeight:900,
                      background:'linear-gradient(135deg,#a5b4fc,#67e8f9)',
                      WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                      fontVariantNumeric:'tabular-nums', lineHeight:1,
                    }}>
                      {pct}<span style={{ fontSize:'1.1rem' }}>%</span>
                    </div>
                    <div style={{ marginTop:4, fontSize:'0.68rem', color:'#94a3b8', letterSpacing:'0.14em', fontWeight:700 }}>
                      {activeStage.icon} {activeStage.label.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Stage tracker */}
                <div style={{
                  display:'grid',
                  gridTemplateColumns:`repeat(${CLL_PROC_STAGES.length}, 1fr)`,
                  gap:6, marginBottom:14,
                }}>
                  {CLL_PROC_STAGES.map((s) => {
                    const done = pct >= s.to;
                    const active = pct >= s.from && pct < s.to;
                    return (
                      <div key={s.key} style={{
                        padding:'8px 6px', borderRadius:10,
                        textAlign:'center',
                        background: active
                          ? 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(6,182,212,0.25))'
                          : done
                          ? 'rgba(34,197,94,0.14)'
                          : 'rgba(148,163,184,0.08)',
                        border: active
                          ? '1px solid rgba(165,180,252,0.55)'
                          : done
                          ? '1px solid rgba(34,197,94,0.45)'
                          : '1px solid rgba(148,163,184,0.18)',
                        transition:'all 0.3s ease',
                      }}>
                        <div style={{ fontSize:'1.05rem', lineHeight:1 }}>
                          {done ? '✓' : s.icon}
                        </div>
                        <div style={{
                          marginTop:4, fontSize:'0.62rem', fontWeight:700,
                          letterSpacing:'0.04em',
                          color: active ? '#e0e7ff' : done ? '#86efac' : '#94a3b8',
                        }}>
                          {s.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div style={{ position:'relative', height:12, borderRadius:999, background:'rgba(148,163,184,0.14)', overflow:'hidden', marginBottom:10 }}>
                  <div className="cll-bar-fill" style={{
                    height:'100%', width:`${pct}%`,
                    borderRadius:999,
                    transition:'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                    position:'relative',
                  }}>
                    <div className="cll-bar-shimmer" style={{ position:'absolute', inset:0, borderRadius:999 }} />
                  </div>
                </div>

                {/* Current step message */}
                <div style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'10px 14px', borderRadius:12,
                  background:'rgba(15,17,37,0.55)',
                  border:'1px solid rgba(99,102,241,0.3)',
                  marginBottom:12,
                }}>
                  <span style={{
                    display:'inline-block', width:8, height:8, borderRadius:'50%',
                    background:'#a5b4fc', boxShadow:'0 0 10px #a5b4fc',
                  }} className="cll-pulse-dot" />
                  <span style={{ fontSize:'0.85rem', color:'#e0e7ff', fontWeight:600, flex:1 }}>
                    {processingProgress.step || 'Warming up the pipeline…'}
                  </span>
                </div>

                {/* Rotating tip */}
                <div
                  key={procTipIndex}
                  style={{
                    display:'flex', alignItems:'flex-start', gap:10,
                    padding:'10px 14px', borderRadius:12,
                    background:'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(99,102,241,0.12))',
                    border:'1px solid rgba(103,232,249,0.25)',
                    animation:'cllTipSlide 5s ease infinite',
                  }}
                >
                  <span style={{ fontSize:'1rem' }}>{tip.icon}</span>
                  <span style={{ fontSize:'0.78rem', color:'#cbd5e1', lineHeight:1.5 }}>{tip.text}</span>
                </div>

                <p style={{ marginTop:14, fontSize:'0.7rem', color:'#64748b', textAlign:'center' }}>
                  Typically completes in 1–3 minutes · you can switch tabs, we'll keep processing
                </p>
              </div>
            </div>
          </div>
        );
      })()}



      {/* Preview Modal */}

      {showPreviewModal && extractedData && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">

            {/* Modal Header */}

            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center">

              <div>

                <h2 className="text-2xl font-bold">P&ID Line Numbers Extracted</h2>

                <p className="text-blue-100 text-sm mt-1">{extractedData.fileName}</p>

              </div>

              <button

                onClick={() => {

                  setShowPreviewModal(false);

                  fetchData();

                  setUploadResult(null);

                }}

                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"

              >

                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />

                </svg>

              </button>

            </div>



            {/* Summary Stats */}

            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">

              <div className="flex items-center justify-between">

                <div className="flex items-center space-x-6">

                  <div className="flex items-center space-x-2">

                    <CheckCircleIcon className="w-6 h-6 text-green-600" />

                    <div>

                      <p className="text-sm text-gray-600">Lines Detected</p>

                      <p className="text-2xl font-bold text-gray-900">{extractedData.lines.length}</p>

                    </div>

                  </div>

                  <div className="flex items-center space-x-2">

                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />

                    </svg>

                    <div>

                      <p className="text-sm text-gray-600">Items Created</p>

                      <p className="text-2xl font-bold text-gray-900">{extractedData.itemsCreated}</p>

                    </div>

                  </div>

                  <div className="flex items-center space-x-2">

                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />

                    </svg>

                    <div>

                      <p className="text-sm text-gray-600">Total Columns</p>

                      <p className="text-2xl font-bold text-gray-900">35 <span className="text-sm text-gray-600">(9 base + 26 enriched)</span></p>

                    </div>

                  </div>

                </div>

                <button

                  onClick={() => {

                    const data = extractedData.lines;

                    

                    // ALL 35 COLUMNS Excel Export (From and To separate)

                    const headers = [

                      'Line Number', 'Size', 'Fluid Code', 'Area', 'Sequence No', 'PIPR Class', 'Insulation', 'From', 'To',

                      'Flow Medium', 'Two Phase', 'Surge Flow', 'Flow Max', 'Density', 

                      'Normal Pressure', 'Normal Temp', 'Design Pressure', 'Min Design Temp (Â°C)', 'Max Design Temp (Â°C)',

                      'Design Code', 'Category-M Fluid', 'Schedule / Wall THK', 'Stress Relief', 'PWHT',

                      'RT', 'MT/PT', 'Hardness', 'Visual', 'NACE-MR-0175', 'Piping Rated Pressure',

                      'Test Pressure', 'Test Medium', 'P&ID No.', 'P&ID Rev', 'Date', 'Criticality Code', 'Criticality Stress'

                    ];

                    

                    const wsData = [headers];

                    

                    // Add all 37 columns for each row

                    data.forEach(row => {

                      wsData.push([

                        row.original_detection || row.line_number || '',

                        row.size || '',

                        row.fluid_code || '',

                        row.area || '',

                        row.sequence_no || '',

                        row.pipr_class || '',

                        row.insulation || '',

                        row.from_line || row.from || '',

                        row.to_line || row.to || '',

                        row.flow_medium || '',

                        row.two_phase || '',

                        row.surge_flow || '',

                        row.flow_max || '',

                        row.density || '',

                        row.normal_pressure || '',

                        row.normal_temp || '',

                        row.design_pressure || '',

                        row.min_design_temp || '',
                        row.max_design_temp || '',

                        row.design_code || '',

                        row.category_m_fluid || '',

                        row.schedule_wall_thk || '',

                        row.stress_relief || '',

                        row.pwht || '',

                        row.rt || '',

                        row.mt_pt || '',

                        row.hardness || '',

                        row.visual || '',

                        row.nace_mr_0175 || '',

                        row.piping_rated_pressure || '',

                        row.test_pressure || '',

                        row.test_medium || '',

                        row.pid_no || '',

                        row.pid_rev || '',

                        row.date || '',

                        row.criticality_code || '',

                        row.criticality_stress || ''

                      ]);

                    });

                    

                    const wb = XLSX.utils.book_new();

                    const ws = XLSX.utils.aoa_to_sheet(wsData);

                    

                    // Set column widths for all 37 columns

                    ws['!cols'] = [

                      { wch: 20 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 },

                      { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 10 },

                      { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 18 },

                      { wch: 15 }, { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 10 },

                      { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 20 },

                      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 18 }

                    ];

                    

                    XLSX.utils.book_append_sheet(wb, ws, 'Critical Line List');

                    

                    const timestamp = new Date().toISOString().split('T')[0];

                    XLSX.writeFile(wb, `PID_35Columns_${data.length}lines_${timestamp}.xlsx`);

                  }}

                  className="flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"

                >

                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />

                  </svg>

                  Download Excel

                </button>

              </div>

            </div>



            {/* Table Preview - ALL 35 COLUMNS */}

            <div className="flex-1 overflow-auto px-6 py-4">

              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 sticky top-0">

                  <tr>

                    {/* 8 BASE COLUMNS from P&ID (STEP 1) */}

                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Line Number</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Size</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Fluid Code</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Area</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Sequence No</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">PIPR Class</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">Insulation</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">From</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider whitespace-nowrap">To</th>

                    

                    {/* 27 ENRICHED COLUMNS from HMB/PMS/NACE + Stress (AI-extracted) */}

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Flow Medium</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Two Phase</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Surge Flow</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Flow Max</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Density</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Normal Pressure</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Normal Temp</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Design Pressure</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Min Design Temp (Â°C)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Max Design Temp (Â°C)</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Design Code</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Category-M Fluid</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Schedule / Wall THK</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Stress Relief</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">PWHT</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">RT</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">MT/PT</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Hardness</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Visual</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">NACE-MR-0175</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Piping Rated Pressure</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Test Pressure</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Test Medium</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">P&ID No.</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">P&ID Rev</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Date</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Criticality Code</th>

                    <th className="px-4 py-3 text-left text-xs font-medium text-yellow-200 uppercase tracking-wider whitespace-nowrap bg-purple-700">Criticality Stress</th>

                  </tr>

                </thead>

                <tbody className="bg-white divide-y divide-gray-200">

                  {extractedData.lines.map((line, index) => (

                    <tr key={index} className="hover:bg-gray-50 transition-colors">

                      {/* 8 BASE COLUMNS from P&ID (white background) */}

                      <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-indigo-600">

                        {line.original_detection || line.line_number || '-'}

                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">

                        {line.size || '-'}

                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">

                        {line.fluid_code || '-'}

                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-semibold text-blue-600">

                        {line.area || '-'}

                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">

                        {line.sequence_no || '-'}

                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">

                        {line.pipr_class || '-'}

                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">

                        {line.insulation || '-'}

                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">

                        {line.from_line || line.from || '-'}

                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">

                        {line.to_line || line.to || '-'}

                      </td>

                      

                      {/* 27 ENRICHED COLUMNS from HMB/PMS/NACE + Stress (AI-extracted with OpenAI) */}

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.flow_medium || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.two_phase || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.surge_flow || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.flow_max || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.density || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.normal_pressure || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.normal_temp || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.design_pressure || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.min_design_temp || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.max_design_temp || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.design_code || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.category_m_fluid || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.schedule_wall_thk || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.stress_relief || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.pwht || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.rt || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.mt_pt || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.hardness || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.visual || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.nace_mr_0175 || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.piping_rated_pressure || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.test_pressure || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.test_medium || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.pid_no || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.pid_rev || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.date || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.criticality_code || '-'}</td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 bg-yellow-50">{line.criticality_stress || '-'}</td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>



            {/* Modal Footer */}

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">

              <button

                onClick={() => {

                  setShowPreviewModal(false);

                  fetchData();

                  setUploadResult(null);

                }}

                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-semibold"

              >

                Close & Refresh

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Previous Outputs Section - Historical Downloads */}

        <div className="mt-8 bg-white rounded-xl shadow-sm border-2 border-gray-200 overflow-hidden">

          {/* Section Header */}

          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b-2 border-indigo-200">

            <div className="flex items-center justify-between">

              <div className="flex items-center space-x-3">

                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />

                </svg>

                <div>

                  <h3 className="text-lg font-bold text-indigo-900">📂 Previous Outputs</h3>

                  <p className="text-sm text-indigo-700">Download previously processed P&ID Excel files</p>

                </div>

              </div>

              <button

                onClick={fetchPreviousOutputs}

                disabled={loadingOutputs}

                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"

              >

                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />

                </svg>

                Refresh

              </button>

            </div>

          </div>



          {/* Table Content */}

          <div className="overflow-x-auto">

            {loadingOutputs ? (

              <div className="flex items-center justify-center py-12">

                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>

                <span className="ml-3 text-gray-600">Loading previous outputs...</span>

              </div>

            ) : previousOutputs.length === 0 ? (

              <div className="text-center py-12">

                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />

                </svg>

                <p className="text-gray-600 font-medium">No previous outputs found</p>

                <p className="text-gray-500 text-sm mt-1">Upload and process a P&ID to see outputs here</p>

              </div>

            ) : (

              <table className="min-w-full divide-y divide-gray-200">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&ID No</th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rev</th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lines</th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Columns</th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enriched</th>

                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>

                  </tr>

                </thead>

                <tbody className="bg-white divide-y divide-gray-200">

                  {previousOutputs.map((output) => (

                    <tr key={output.id} className="hover:bg-gray-50 transition-colors">

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">

                        {output.pid_number}

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">

                        {output.pid_revision || '-'}

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">

                        {output.processing_date}

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">

                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">

                          {output.total_lines} lines

                        </span>

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">

                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">

                          {output.total_columns} cols

                        </span>

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">

                        {output.file_size_mb} MB

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm">

                        {output.enrichment_enabled ? (

                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">

                            ✓ Yes

                          </span>

                        ) : (

                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">

                            Base Only

                          </span>

                        )}

                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm">

                        <div className="flex items-center gap-1.5">

                          <button

                            onClick={() => handleDownloadOutput(output.id, output.excel_filename)}

                            className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs font-semibold"

                            title="Download Excel"

                          >

                            <ArrowDownTrayIcon className="w-4 h-4 mr-1" />

                            Download

                          </button>

                          <button

                            onClick={() => handleRecheckOutput(output)}

                            disabled={rowActionId === output.id}

                            className="flex items-center px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-xs font-semibold"

                            title="Re-validate this Excel file (line/column count, structural checks)"

                          >

                            <ArrowPathIcon className={`w-4 h-4 mr-1 ${rowActionId === output.id && rowActionType === 'recheck' ? 'animate-spin' : ''}`} />

                            {rowActionId === output.id && rowActionType === 'recheck' ? 'Checking…' : 'Recheck'}

                          </button>

                          <button

                            onClick={() => openEditModal(output)}

                            className="flex items-center px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-xs font-semibold"

                            title="Modify metadata"

                          >

                            <PencilSquareIcon className="w-4 h-4 mr-1" />

                            Modify

                          </button>

                          <button

                            onClick={() => handleDeleteOutput(output)}

                            disabled={rowActionId === output.id}

                            className="flex items-center px-3 py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 transition-colors text-xs font-semibold"

                            title="Delete this output"

                          >

                            <TrashIcon className="w-4 h-4 mr-1" />

                            {rowActionId === output.id && rowActionType === 'delete' ? 'Deleting…' : 'Delete'}

                          </button>

                        </div>

                        {recheckResults[output.id] && (

                          <div className="mt-2 max-w-xs">

                            <span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-semibold ${(RECHECK_HEALTH_BADGE[recheckResults[output.id].health] || RECHECK_HEALTH_BADGE.error).cls}`}>

                              {(RECHECK_HEALTH_BADGE[recheckResults[output.id].health] || RECHECK_HEALTH_BADGE.error).label}

                            </span>

                            {Array.isArray(recheckResults[output.id].issues) && recheckResults[output.id].issues.length > 0 && (

                              <ul className="mt-1 text-[11px] text-amber-700 list-disc list-inside">

                                {recheckResults[output.id].issues.slice(0, 3).map((iss, idx) => (

                                  <li key={idx}>{iss}</li>

                                ))}

                              </ul>

                            )}

                            {recheckResults[output.id].drift && Object.keys(recheckResults[output.id].drift).length > 0 && (

                              <div className="mt-1 text-[11px] text-slate-500">

                                Updated: {Object.keys(recheckResults[output.id].drift).join(', ')}

                              </div>

                            )}

                          </div>

                        )}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </div>

        </div>



      {/* Line Number Format Configuration Modal */}

      {showFormatConfigModal && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">

            {/* Modal Header */}

            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">

              <h2 className="text-2xl font-bold text-white">Custom Line Number Format</h2>

              <p className="text-purple-100 text-sm mt-1">

                Configure components and order for your specific P&ID format

              </p>

            </div>



            {/* Modal Body */}

            <div className="flex-1 overflow-auto p-6 space-y-6">

              

              {/* Format Template Preview */}

              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4">

                <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 Current Format Template</h3>

                <div className="bg-white px-4 py-3 rounded-lg border border-indigo-300 font-mono text-lg">

                  {lineNumberFormat.components

                    .filter(c => c.enabled)

                    .sort((a, b) => a.order - b.order)

                    .map(c => c.id.toUpperCase())

                    .join(lineNumberFormat.separator) || 'No components selected'}

                </div>

                <div className="mt-2 text-sm text-gray-600">

                  Example: {lineNumberFormat.components

                    .filter(c => c.enabled)

                    .sort((a, b) => a.order - b.order)

                    .map(c => c.example)

                    .join(lineNumberFormat.separator) || 'Configure components below'}

                </div>

              </div>



              {/* Separator Configuration */}

              <div className="bg-white border border-gray-200 rounded-xl p-4">

                <label className="block text-sm font-semibold text-gray-700 mb-3">

                  🔗 Component Separator

                </label>

                <div className="flex items-center space-x-4">

                  <input

                    type="text"

                    value={lineNumberFormat.separator}

                    onChange={(e) => setLineNumberFormat({

                      ...lineNumberFormat,

                      separator: e.target.value

                    })}

                    maxLength={3}

                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center font-mono text-lg"

                    placeholder="-"

                  />

                  <label className="flex items-center space-x-2">

                    <input

                      type="checkbox"

                      checked={lineNumberFormat.allowVariableSeparators}

                      onChange={(e) => setLineNumberFormat({

                        ...lineNumberFormat,

                        allowVariableSeparators: e.target.checked

                      })}

                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"

                    />

                    <span className="text-sm text-gray-700">Allow variable separators (-, –, —, etc.)</span>

                  </label>

                </div>

              </div>



              {/* Components Configuration */}

              <div className="bg-white border border-gray-200 rounded-xl p-4">

                <h3 className="text-sm font-semibold text-gray-700 mb-4">⚙️ Line Number Components</h3>

                <div className="space-y-3">

                  {lineNumberFormat.components.map((component, idx) => (

                    <div key={component.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg border border-gray-200">

                      {/* Enable Checkbox */}

                      <input

                        type="checkbox"

                        checked={component.enabled}

                        onChange={(e) => {

                          const updated = [...lineNumberFormat.components];

                          updated[idx].enabled = e.target.checked;

                          setLineNumberFormat({ ...lineNumberFormat, components: updated });

                        }}

                        className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"

                      />

                      

                      {/* Component Name */}

                      <div className="flex-1 min-w-[150px]">

                        <span className={`font-semibold ${component.enabled ? 'text-gray-900' : 'text-gray-400'}`}>

                          {component.name}

                        </span>

                      </div>



                      {/* Order */}

                      <div className="flex items-center space-x-2">

                        <label className="text-sm text-gray-600 whitespace-nowrap">Order:</label>

                        <input

                          type="number"

                          min="1"

                          max="6"

                          value={component.order}

                          onChange={(e) => {

                            const updated = [...lineNumberFormat.components];

                            updated[idx].order = parseInt(e.target.value) || 1;

                            setLineNumberFormat({ ...lineNumberFormat, components: updated });

                          }}

                          disabled={!component.enabled}

                          className={`w-16 px-2 py-1 border rounded-lg text-center ${

                            component.enabled 

                              ? 'border-gray-300 focus:ring-2 focus:ring-purple-500' 

                              : 'bg-gray-100 border-gray-200 text-gray-400'

                          }`}

                        />

                      </div>



                      {/* Pattern */}

                      <div className="flex items-center space-x-2 flex-1 min-w-[200px]">

                        <label className="text-sm text-gray-600 whitespace-nowrap">Regex:</label>

                        <input

                          type="text"

                          value={component.pattern}

                          onChange={(e) => {

                            const updated = [...lineNumberFormat.components];

                            updated[idx].pattern = e.target.value;

                            setLineNumberFormat({ ...lineNumberFormat, components: updated });

                          }}

                          disabled={!component.enabled}

                          className={`flex-1 px-3 py-1 border rounded-lg font-mono text-sm ${

                            component.enabled 

                              ? 'border-gray-300 focus:ring-2 focus:ring-purple-500' 

                              : 'bg-gray-100 border-gray-200 text-gray-400'

                          }`}

                          placeholder="\\d{1,2}"

                        />

                      </div>



                      {/* Example */}

                      <div className="flex items-center space-x-2 min-w-[100px]">

                        <label className="text-sm text-gray-600">Ex:</label>

                        <input

                          type="text"

                          value={component.example}

                          onChange={(e) => {

                            const updated = [...lineNumberFormat.components];

                            updated[idx].example = e.target.value;

                            setLineNumberFormat({ ...lineNumberFormat, components: updated });

                          }}

                          disabled={!component.enabled}

                          className={`w-20 px-2 py-1 border rounded-lg text-sm ${

                            component.enabled 

                              ? 'border-gray-300 focus:ring-2 focus:ring-purple-500' 

                              : 'bg-gray-100 border-gray-200 text-gray-400'

                          }`}

                          placeholder="2"

                        />

                      </div>

                    </div>

                  ))}

                </div>

              </div>



              {/* Preset Templates */}

              <div className="bg-white border border-gray-200 rounded-xl p-4">

                <h3 className="text-sm font-semibold text-gray-700 mb-3">🎯 Common Configurations</h3>

                <div className="grid grid-cols-2 gap-3">

                  <button

                    onClick={() => {

                      setLineNumberFormat({

                        ...lineNumberFormat,

                        components: [

                          { id: 'line_size', name: 'Line Size', enabled: true, order: 1, pattern: '\\d{1,2}', example: '36' },

                          { id: 'area', name: 'Area', enabled: false, order: 2, pattern: '\\d{2,3}', example: '41' },

                          { id: 'fluid_code', name: 'Fluid Code', enabled: true, order: 2, pattern: '[A-Z]{1,3}', example: 'SWR' },

                          { id: 'sequence_no', name: 'Sequence No', enabled: true, order: 3, pattern: '\\d{3,5}', example: '60302' },

                          { id: 'pipe_class', name: 'Pipe Class', enabled: true, order: 4, pattern: '\\d{3,5}', example: '5010' },

                          { id: 'insulation', name: 'Insulation', enabled: false, order: 5, pattern: '[A-Z]{1,2}', example: 'V' }

                        ]

                      });

                    }}

                    className="px-4 py-3 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 text-left"

                  >

                    <div className="font-semibold text-blue-700">Standard Format</div>

                    <div className="text-xs text-blue-600 font-mono mt-1">SIZE-FLUID-SEQ-CLASS</div>

                    <div className="text-xs text-gray-600 mt-1">Example: 2-PU-152-50100A</div>

                  </button>

                  

                  <button

                    onClick={() => {

                      setLineNumberFormat({

                        ...lineNumberFormat,

                        components: [

                          { id: 'line_size', name: 'Line Size', enabled: true, order: 1, pattern: '\\d{1,2}', example: '36' },

                          { id: 'area', name: 'Area', enabled: true, order: 2, pattern: '\\d{2,3}', example: '41' },

                          { id: 'fluid_code', name: 'Fluid Code', enabled: true, order: 3, pattern: '[A-Z]{1,3}', example: 'SWR' },

                          { id: 'sequence_no', name: 'Sequence No', enabled: true, order: 4, pattern: '\\d{3,5}', example: '60302' },

                          { id: 'pipe_class', name: 'Pipe Class', enabled: true, order: 5, pattern: '\\d{3,5}', example: '5010' },

                          { id: 'insulation', name: 'Insulation', enabled: true, order: 6, pattern: '[A-Z]{1,2}', example: 'V' }

                        ]

                      });

                    }}

                    className="px-4 py-3 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 text-left"

                  >

                    <div className="font-semibold text-green-700">Extended Format</div>

                    <div className="text-xs text-green-600 font-mono mt-1">SIZE-AREA-FLUID-SEQ-CLASS-INS</div>

                    <div className="text-xs text-gray-600 mt-1">Example: 2-41-PU-152-50100A-X</div>

                  </button>

                </div>

              </div>



              {/* Help Text */}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">

                <div className="flex items-start space-x-3">

                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">

                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />

                  </svg>

                  <div className="text-sm text-yellow-800">

                    <p className="font-semibold mb-1">How to use:</p>

                    <ul className="list-disc list-inside space-y-1 text-xs">

                      <li>Enable/disable components using checkboxes</li>

                      <li>Set the order (1-6) for each enabled component</li>

                      <li>Adjust regex patterns if needed for specific formats</li>

                      <li>Use Quick Presets to load common configurations</li>

                      <li>The backend will use this configuration to extract line numbers from P&ID PDFs</li>

                    </ul>

                  </div>

                </div>

              </div>

            </div>



            {/* Modal Footer */}

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">

              <button

                onClick={() => setShowFormatConfigModal(false)}

                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-semibold"

              >

                Cancel

              </button>

              <button

                onClick={() => {

                  // Validate at least one component is enabled

                  const hasEnabled = lineNumberFormat.components.some(c => c.enabled);

                  if (!hasEnabled) {

                    alert('Please enable at least one component');

                    return;

                  }

                  setShowFormatConfigModal(false);

                  // Save to localStorage for persistence

                  localStorage.setItem('designiq_line_format_config', JSON.stringify(lineNumberFormat));

                }}

                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all font-semibold"

              >

                Save Configuration

              </button>

            </div>

          </div>

        </div>

      )}



      {/* ------------------------------------------------------------------ */}

      {/* Modify Output Modal — soft-coded fields from OUTPUT_EDITABLE_FIELDS */}

      {/* ------------------------------------------------------------------ */}

      {editingOutput && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

            <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-2">

              <PencilSquareIcon className="w-5 h-5" />

              <h3 className="font-bold text-lg">Modify Output</h3>

              <button

                onClick={closeEditModal}

                className="ml-auto text-white/80 hover:text-white text-2xl leading-none"

                title="Close"

              >

                ×

              </button>

            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

              <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2">

                <div><span className="font-semibold text-slate-700">File:</span> {editingOutput.excel_filename}</div>

                <div><span className="font-semibold text-slate-700">Date:</span> {editingOutput.processing_date}</div>

                <div><span className="font-semibold text-slate-700">Lines:</span> {editingOutput.total_lines} · <span className="font-semibold text-slate-700">Cols:</span> {editingOutput.total_columns}</div>

              </div>

              {OUTPUT_EDITABLE_FIELDS.map((f) => (

                <div key={f.key}>

                  <label className="block text-xs font-semibold text-slate-700 mb-1">

                    {f.label}{f.required && <span className="text-rose-500"> *</span>}

                  </label>

                  {f.type === 'select' ? (

                    <select

                      value={editForm[f.key] ?? ''}

                      onChange={(e) => setEditForm((prev) => ({ ...prev, [f.key]: e.target.value }))}

                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400"

                    >

                      {f.options.map((opt) => (

                        <option key={opt} value={opt}>{opt}</option>

                      ))}

                    </select>

                  ) : f.type === 'boolean' ? (

                    <label className="inline-flex items-center gap-2 cursor-pointer">

                      <input

                        type="checkbox"

                        checked={!!editForm[f.key]}

                        onChange={(e) => setEditForm((prev) => ({ ...prev, [f.key]: e.target.checked }))}

                        className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-400"

                      />

                      <span className="text-sm text-slate-700">

                        {editForm[f.key] ? 'Enabled' : 'Disabled'}

                      </span>

                    </label>

                  ) : (

                    <input

                      type="text"

                      value={editForm[f.key] ?? ''}

                      onChange={(e) => setEditForm((prev) => ({ ...prev, [f.key]: e.target.value }))}

                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-amber-400"

                      placeholder={f.label}

                    />

                  )}

                </div>

              ))}

              <div className="flex items-start gap-2 text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg p-2">

                <ExclamationTriangleIcon className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />

                <span>Modifying metadata only affects the database record — the underlying Excel file is unchanged. Use <span className="font-semibold">Recheck</span> to re-validate the file contents.</span>

              </div>

            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">

              <button

                onClick={closeEditModal}

                disabled={savingEdit}

                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 disabled:opacity-50"

              >

                Cancel

              </button>

              <button

                onClick={handleSaveEdit}

                disabled={savingEdit}

                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 text-sm font-semibold"

              >

                {savingEdit ? 'Saving…' : 'Save Changes'}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

};



export default CriticalLineList;



