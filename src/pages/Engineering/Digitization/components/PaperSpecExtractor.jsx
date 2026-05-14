/**
 * PaperSpecExtractor
 * ──────────────────
 * Self-contained extractor panel: upload PDF → poll job → display
 * extracted Piping Classes + components. All knobs in `PANEL_CONFIG`.
 *
 * No core logic of any other feature is touched.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CloudArrowUpIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import specCustomizationAPI, { SPEC_API_CONFIG } from '../../../../services/specCustomizationAPI';

// ─── Soft-coded panel configuration ──────────────────────────────────────────
const PANEL_CONFIG = {
  title:               'Paper Spec Extraction',
  subtitle:            'Upload a scanned or digital Piping Material Specification (PDF). RAD AI extracts every Piping Class, P/T rating, and component table — using a smart Gemini → OpenAI engine waterfall with cost-aware page skipping.',
  acceptStr:           '.pdf',
  maxFileSizeMB:       SPEC_API_CONFIG.maxFileSizeMB,
  pollIntervalMs:      SPEC_API_CONFIG.pollIntervalMs,
  helperPoints:        [
    'Chunked extraction (20 pages / chunk) so even 2,000+ page specs stay responsive.',
    'Native text-layer used first; AI vision only called when the page has no text — keeps cost down.',
    'Identical PDFs are auto-deduped by SHA-256; you instantly see the previous extraction.',
    'Export to Excel (one sheet per Piping Class) or JSON for downstream tools.',
  ],
};

// Map status → tailwind/heroicon
const STATUS_META = {
  queued:     { color: 'bg-slate-100 text-slate-700 border-slate-300',     label: 'Queued' },
  processing: { color: 'bg-blue-50 text-blue-700 border-blue-300',         label: 'Processing' },
  completed:  { color: 'bg-emerald-50 text-emerald-700 border-emerald-300', label: 'Completed' },
  failed:     { color: 'bg-rose-50 text-rose-700 border-rose-300',         label: 'Failed' },
  cancelled:  { color: 'bg-amber-50 text-amber-800 border-amber-300',      label: 'Cancelled' },
};

const fmtBytes = (n) => {
  if (!n) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = n; let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i += 1; }
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const PaperSpecExtractor = () => {
  const [file, setFile]                     = useState(null);
  const [uploading, setUploading]           = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError]       = useState('');
  const [job, setJob]                       = useState(null);
  const [document, setDocument]             = useState(null);
  const [classes, setClasses]               = useState([]);
  const [expandedClassId, setExpandedClassId] = useState(null);
  const [classDetailCache, setClassDetailCache] = useState({});
  const [config, setConfig]                 = useState(null);
  const pollRef = useRef(null);

  // Fetch backend config once for displaying caps to the user.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const c = await specCustomizationAPI.getConfig();
        if (!cancelled) setConfig(c);
      } catch (e) { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  const isTerminal = useMemo(() => {
    if (!job) return false;
    return ['completed', 'failed', 'cancelled'].includes(job.status);
  }, [job]);

  // ── Polling ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!job || isTerminal) {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      return undefined;
    }
    pollRef.current = setInterval(async () => {
      try {
        const updated = await specCustomizationAPI.getJob(job.id);
        setJob(updated);
        if (['completed', 'failed', 'cancelled'].includes(updated.status)) {
          const list = await specCustomizationAPI.getJobClasses(updated.id);
          setClasses(list);
        }
      } catch (e) {
        // swallow transient polling errors
      }
    }, PANEL_CONFIG.pollIntervalMs);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [job, isTerminal]);

  // On completion, fetch final class list (extra safety net).
  useEffect(() => {
    if (job && job.status === 'completed' && classes.length === 0) {
      specCustomizationAPI.getJobClasses(job.id).then(setClasses).catch(() => {});
    }
  }, [job, classes.length]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const handleFilePick = (e) => {
    const f = e.target.files?.[0];
    setUploadError('');
    if (!f) return;
    if (!/\.pdf$/i.test(f.name)) {
      setUploadError('Only PDF files are accepted.');
      return;
    }
    const maxBytes = PANEL_CONFIG.maxFileSizeMB * 1024 * 1024;
    if (f.size > maxBytes) {
      setUploadError(`File exceeds ${PANEL_CONFIG.maxFileSizeMB} MB limit.`);
      return;
    }
    setFile(f);
  };

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    setUploadProgress(0);
    setClasses([]);
    setExpandedClassId(null);
    try {
      const resp = await specCustomizationAPI.upload({
        file,
        onUploadProgress: (evt) => {
          if (evt.total) setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      setDocument(resp.document);
      setJob(resp.job);
      if (resp.deduped) {
        // Already completed — load classes immediately.
        const list = await specCustomizationAPI.getJobClasses(resp.job.id);
        setClasses(list);
      }
    } catch (e) {
      setUploadError(e?.response?.data?.error || e?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [file]);

  const handleCancel = async () => {
    if (!job) return;
    try {
      await specCustomizationAPI.cancelJob(job.id);
      const refreshed = await specCustomizationAPI.getJob(job.id);
      setJob(refreshed);
    } catch (e) { /* ignore */ }
  };

  const handleReset = () => {
    setFile(null);
    setUploadProgress(0);
    setUploadError('');
    setJob(null);
    setDocument(null);
    setClasses([]);
    setExpandedClassId(null);
    setClassDetailCache({});
  };

  const handleExpandClass = async (cls) => {
    if (expandedClassId === cls.id) { setExpandedClassId(null); return; }
    setExpandedClassId(cls.id);
    if (!classDetailCache[cls.id]) {
      try {
        const detail = await specCustomizationAPI.getClass(cls.id);
        setClassDetailCache((m) => ({ ...m, [cls.id]: detail }));
      } catch (e) { /* ignore */ }
    }
  };

  const handleExportXlsx = async () => {
    if (!job) return;
    try {
      const blob = await specCustomizationAPI.exportJob(job.id, 'xlsx');
      downloadBlob(blob, `paper_spec_${job.id}.xlsx`);
    } catch (e) { /* ignore */ }
  };

  const handleExportJson = async () => {
    if (!job) return;
    try {
      const data = await specCustomizationAPI.exportJob(job.id, 'json');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `paper_spec_${job.id}.json`);
    } catch (e) { /* ignore */ }
  };

  // ── Derived UI bits ──────────────────────────────────────────────────
  const statusMeta = job ? (STATUS_META[job.status] || STATUS_META.queued) : null;
  const progressPct = job?.progress_percent ?? 0;
  const livePhase   = job?.current_phase || job?.live_progress?.status || '';
  const partialCount = job?.live_progress?.classes_found ?? classes.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-pink-100 dark:border-pink-900/40 overflow-hidden">
      {/* Header strip */}
      <div className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{PANEL_CONFIG.title}</h2>
            <p className="text-pink-50 text-sm">AI-powered Piping Spec extraction</p>
          </div>
        </div>
        {config && (
          <div className="hidden md:flex items-center gap-2 text-white/90 text-xs bg-white/10 px-3 py-1.5 rounded-lg">
            <Cog6ToothIcon className="w-4 h-4" />
            <span>chunk={config.chunk_size_pages}p · AI cap={config.max_ai_pages_per_job}p</span>
          </div>
        )}
      </div>

      <div className="p-6 space-y-6">
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {PANEL_CONFIG.subtitle}
        </p>
        <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600 dark:text-slate-400 list-disc pl-5">
          {PANEL_CONFIG.helperPoints.map((p) => <li key={p}>{p}</li>)}
        </ul>

        {/* ── Upload zone ─────────────────────────────────────────────── */}
        {!job && (
          <div className="border-2 border-dashed border-pink-300 dark:border-pink-700 rounded-xl p-8 bg-pink-50/40 dark:bg-pink-900/10">
            <div className="flex flex-col items-center text-center gap-3">
              <CloudArrowUpIcon className="w-12 h-12 text-pink-500" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {file ? file.name : 'Drop a Paper Spec PDF here, or click to browse'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {file ? fmtBytes(file.size) : `Max ${PANEL_CONFIG.maxFileSizeMB} MB · PDF only`}
                </p>
              </div>
              <input
                id="paper-spec-file"
                type="file"
                accept={PANEL_CONFIG.acceptStr}
                onChange={handleFilePick}
                className="hidden"
              />
              <div className="flex gap-2">
                <label
                  htmlFor="paper-spec-file"
                  className="px-4 py-2 bg-white border border-pink-300 text-pink-700 rounded-lg text-sm font-medium hover:bg-pink-50 cursor-pointer"
                >
                  Choose PDF
                </label>
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg text-sm font-semibold shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading…' : 'Extract with AI'}
                </button>
              </div>
              {uploading && (
                <div className="w-full max-w-md bg-pink-100 dark:bg-pink-900/30 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-pink-500 h-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              {uploadError && (
                <p className="text-rose-600 text-sm flex items-center gap-1">
                  <ExclamationTriangleIcon className="w-4 h-4" /> {uploadError}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Job status ──────────────────────────────────────────────── */}
        {job && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-5 bg-slate-50/60 dark:bg-slate-900/30">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${statusMeta.color}`}>
                  {statusMeta.label}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {document?.original_filename || 'Document'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {document?.total_pages || 0} pages · {fmtBytes(document?.file_size_bytes)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {isTerminal && job.status === 'completed' && (
                  <>
                    <button
                      onClick={handleExportXlsx}
                      className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 inline-flex items-center gap-1"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" /> XLSX
                    </button>
                    <button
                      onClick={handleExportJson}
                      className="px-3 py-1.5 text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-100 inline-flex items-center gap-1"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" /> JSON
                    </button>
                  </>
                )}
                {!isTerminal && (
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg hover:bg-rose-100 inline-flex items-center gap-1"
                  >
                    <XMarkIcon className="w-4 h-4" /> Cancel
                  </button>
                )}
                {isTerminal && (
                  <button
                    onClick={handleReset}
                    className="px-3 py-1.5 text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 inline-flex items-center gap-1"
                  >
                    <ArrowPathIcon className="w-4 h-4" /> New
                  </button>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                <span>{livePhase || (isTerminal ? statusMeta.label : 'Starting…')}</span>
                <span>{progressPct}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    job.status === 'failed'    ? 'bg-rose-500' :
                    job.status === 'cancelled' ? 'bg-amber-500' :
                    job.status === 'completed' ? 'bg-emerald-500' :
                    'bg-gradient-to-r from-pink-500 to-rose-500 animate-pulse'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-slate-500">
                <div>Chunks: {job.chunks_done}/{job.chunks_total}</div>
                <div>Pages: {job.pages_processed}</div>
                <div>Classes: {partialCount}</div>
              </div>
            </div>

            {job.error_message && (
              <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                {job.error_message}
              </div>
            )}
          </div>
        )}

        {/* ── Extracted classes ───────────────────────────────────────── */}
        {classes.length > 0 && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-900/40 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {classes.length} Piping Class{classes.length !== 1 ? 'es' : ''} extracted
              </p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {classes.map((cls) => {
                const expanded = expandedClassId === cls.id;
                const detail = classDetailCache[cls.id];
                const Chevron = expanded ? ChevronDownIcon : ChevronRightIcon;
                return (
                  <div key={cls.id}>
                    <button
                      onClick={() => handleExpandClass(cls)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/40 text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Chevron className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        <div className="font-mono font-bold text-pink-700 dark:text-pink-300 w-10">
                          {cls.class_code}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                            {cls.class_full_code || cls.material_grade || '—'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {cls.material_grade} · {cls.pressure_rating} · {cls.flange_facing || '—'}
                            {cls.source_pages?.length === 2 && ` · p.${cls.source_pages[0]}–${cls.source_pages[1]}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600 rounded">
                          {cls.components_count} rows
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-pink-100 text-pink-700 rounded">
                          {cls.extraction_engine || '—'}
                        </span>
                        {typeof cls.confidence_score === 'number' && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded">
                            {(cls.confidence_score * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </button>
                    {expanded && (
                      <div className="bg-slate-50/60 dark:bg-slate-900/20 px-4 py-3">
                        {!detail ? (
                          <p className="text-xs text-slate-500 italic">Loading…</p>
                        ) : (
                          <ClassDetailPanel cls={detail} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {job?.status === 'completed' && classes.length === 0 && (
          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5" />
            Extraction completed but no Piping Classes were detected.
            Try uploading a higher-quality scan or a digital-text PDF.
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Subcomponent: per-class detail ──────────────────────────────────────────
const ClassDetailPanel = ({ cls }) => {
  if (!cls) return null;
  const components = cls.components || [];
  const services = cls.service_list || [];
  const pt = cls.pt_rating_table || [];

  return (
    <div className="space-y-3">
      {services.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Services</p>
          <div className="flex flex-wrap gap-1">
            {services.map((s, i) => (
              <span key={`${s}-${i}`} className="px-2 py-0.5 text-xs bg-pink-100 text-pink-700 rounded">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
      {pt.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">P/T Rating</p>
          <div className="overflow-x-auto">
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-200 px-2 py-1 text-left">Pressure (bar-g)</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Temperature (°C)</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Notes</th>
                </tr>
              </thead>
              <tbody>
                {pt.map((r, i) => (
                  <tr key={i}>
                    <td className="border border-slate-200 px-2 py-1">{r.pressure_bar_g ?? '—'}</td>
                    <td className="border border-slate-200 px-2 py-1">{r.temperature_c ?? '—'}</td>
                    <td className="border border-slate-200 px-2 py-1">{r.notes || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {components.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">
            Components ({components.length})
          </p>
          <div className="overflow-x-auto">
            <table className="text-xs w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-200 px-2 py-1 text-left">Type</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Sub-type</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Size From</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Size To</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Sched/Rating</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Material</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Ends</th>
                  <th className="border border-slate-200 px-2 py-1 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                {components.map((c) => (
                  <tr key={c.id} className="odd:bg-white even:bg-slate-50/40">
                    <td className="border border-slate-200 px-2 py-1 capitalize">{c.component_type}</td>
                    <td className="border border-slate-200 px-2 py-1">{c.sub_type}</td>
                    <td className="border border-slate-200 px-2 py-1">{c.size_from}</td>
                    <td className="border border-slate-200 px-2 py-1">{c.size_to}</td>
                    <td className="border border-slate-200 px-2 py-1">{c.schedule_or_rating}</td>
                    <td className="border border-slate-200 px-2 py-1">{c.material_standard}</td>
                    <td className="border border-slate-200 px-2 py-1">{c.end_connection}</td>
                    <td className="border border-slate-200 px-2 py-1">{c.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {cls.raw_notes && (
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Notes</p>
          <p className="text-xs text-slate-700 whitespace-pre-wrap">{cls.raw_notes}</p>
        </div>
      )}
    </div>
  );
};

export default PaperSpecExtractor;
