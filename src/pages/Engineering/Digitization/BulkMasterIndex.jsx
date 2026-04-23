/**
 * BulkMasterIndex — NONTEF Master Index bulk digitization (expert UX).
 *
 * Single-screen "drop & go" flow (no wizard). Drop a folder, watch extraction
 * run, review/edit the grid, export Excel — all on one page.
 *
 * All UX rules below are soft-coded constants so we can tune without touching
 * component logic. Backend endpoints and behaviour are unchanged.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  CloudArrowUpIcon,
  DocumentDuplicateIcon,
  FolderOpenIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import apiClient from '../../../services/api.service';

// ---------------------------------------------------------------------------
// SOFT-CODED constants
// ---------------------------------------------------------------------------

const BULK_API = '/non-teff/batch';
const POLL_INTERVAL_MS = 2500;
const MAX_CELL_WIDTH_PX = 320;
const PAGE_SIZE = 100;

// ─── Upload tuning (soft-coded) ──────────────────────────────────────────
// Big folders would blow past axios' default 120s global timeout, so we:
//   1. Split the upload into chunks (count-based OR size-based, whichever hits first)
//   2. Upload chunks sequentially — backend appends items to the same batch
//   3. Compute a DYNAMIC per-request timeout from payload size + file count
//   4. Retry transient failures with exponential backoff
const UPLOAD_CHUNK_FILES   = 20;                // files per POST
const UPLOAD_CHUNK_BYTES   = 80 * 1024 * 1024;  // or ≈80 MB per POST, whichever is smaller
const UPLOAD_RETRY_COUNT   = 2;                 // retry a failed chunk before aborting

// Dynamic timeout formula per chunk — tuned for slow uplinks and server-side
// SHA-256 + disk writes. Can be overridden via window.__BULK_UPLOAD_TUNING__.
// Final timeout = clamp(base + bytes/throughput + files*perFile, min, max)
const UPLOAD_TIMEOUT_TUNING = {
  baseMs:             30 * 1000,         // 30 s setup budget
  minMs:              2  * 60 * 1000,    // 2 min floor (never less than this)
  maxMs:              60 * 60 * 1000,    // 60 min ceiling (per chunk)
  bytesPerSecondMin:  256 * 1024,        // assume ≥256 KB/s effective (very pessimistic)
  perFileMs:          1500,              // ≈1.5 s/file server overhead (hash + write + insert)
};

// Compute dynamic timeout for one chunk based on its actual size+count.
const computeChunkTimeout = (fileCount, byteCount) => {
  const t = (typeof window !== 'undefined' && window.__BULK_UPLOAD_TUNING__) || UPLOAD_TIMEOUT_TUNING;
  const transferMs = (byteCount / t.bytesPerSecondMin) * 1000;
  const serverMs   = fileCount * t.perFileMs;
  const raw        = t.baseMs + transferMs + serverMs;
  return Math.min(t.maxMs, Math.max(t.minMs, Math.round(raw)));
};

// Only this field is required before upload; everything else is optional and
// can be edited later in the review grid via bulk-apply.
const REQUIRED_FIELDS = ['plant'];

// Advanced defaults panel — collapsed by default.
const ADVANCED_FIELDS = [
  'adnoc_project_no', 'project_title', 'project_location', 'source_folder',
  'originator', 'to', 'agreement_no', 'agreement_desc',
  'transmittal_no', 'class_review', 'category', 'author',
];

// When a folder is dropped, auto-fill these defaults from the folder tree.
// Rule `top_folder_name` = name of the topmost directory of the upload.
// Auto-derive never overwrites a value the user has already typed.
const AUTO_DERIVE_RULES = {
  project_title: 'top_folder_name',
  source_folder: 'top_folder_name',
};

const ACCEPTED_EXT = ['.pdf', '.xlsx', '.xls', '.docx', '.doc', '.dwg', '.dxf'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const clsx = (...xs) => xs.filter(Boolean).join(' ');
const formatMB = (bytes) => (bytes / 1024 / 1024).toFixed(1);

const topFolderOf = (files) => {
  for (const f of files) {
    const rel = f.webkitRelativePath || '';
    const first = rel.split('/')[0];
    if (first) return first;
  }
  return '';
};

// Walk a DataTransferItem directory entry recursively, populating `out`.
const walkEntry = (entry, prefix, out) => new Promise((resolve) => {
  if (entry.isFile) {
    entry.file((f) => {
      try { Object.defineProperty(f, 'webkitRelativePath', { value: prefix + f.name }); }
      catch { /* read-only in some browsers — safe to ignore */ }
      out.push(f);
      resolve();
    }, () => resolve());
  } else if (entry.isDirectory) {
    const reader = entry.createReader();
    const readAll = () => reader.readEntries(async (batch) => {
      if (!batch.length) return resolve();
      await Promise.all(batch.map((e) => walkEntry(e, prefix + entry.name + '/', out)));
      readAll();
    }, () => resolve());
    readAll();
  } else {
    resolve();
  }
});

const useTemplate = () => {
  const [tpl, setTpl] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    apiClient.get(`${BULK_API}/template/`)
      .then((r) => setTpl(r.data))
      .catch((e) => setError(e?.response?.data?.error || e.message));
  }, []);
  return { tpl, error };
};

// Split an array of File into chunks bounded by BOTH file count AND byte size.
const chunkFiles = (files, maxFiles, maxBytes) => {
  const out = [];
  let cur = [];
  let bytes = 0;
  for (const f of files) {
    if (cur.length >= maxFiles || (bytes + f.size > maxBytes && cur.length > 0)) {
      out.push(cur);
      cur = [];
      bytes = 0;
    }
    cur.push(f);
    bytes += f.size;
  }
  if (cur.length) out.push(cur);
  return out;
};

// Sleep helper for retry backoff
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const BulkMasterIndex = () => {
  const { tpl, error: tplError } = useTemplate();

  // Batch / files / progress
  const [batch, setBatch] = useState(null);
  const [defaults, setDefaults] = useState({});
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [extracting, setExtracting] = useState(false);
  const [counts, setCounts] = useState({});
  const [dragOver, setDragOver] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Review grid
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [bulkValue, setBulkValue] = useState({ colKey: '', value: '' });

  const [error, setError] = useState(null);

  const folderInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const columns = tpl?.template?.columns || [];
  const reviewReady = batch && ['ready', 'exported', 'failed'].includes(batch.status);

  // Pre-fill defaults from template hints
  useEffect(() => {
    if (tpl?.template?.batch_default_hints) {
      setDefaults((prev) => ({ ...tpl.template.batch_default_hints, ...prev }));
    }
  }, [tpl]);

  // --- File acceptance -----------------------------------------------------
  const acceptFiles = useCallback((list) => {
    if (!list.length) return;
    setFiles(list);
    const top = topFolderOf(list);
    if (top) {
      setDefaults((prev) => {
        const next = { ...prev };
        for (const [field, rule] of Object.entries(AUTO_DERIVE_RULES)) {
          if (!next[field] && rule === 'top_folder_name') next[field] = top;
        }
        return next;
      });
    }
  }, []);

  const onPickFolder = (e) => acceptFiles(Array.from(e.target.files || []));
  const onPickFiles = (e) => acceptFiles([...files, ...Array.from(e.target.files || [])]);

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const onDragLeave = () => setDragOver(false);
  const onDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = [];
    const dt = e.dataTransfer;
    if (dt.items && dt.items.length && dt.items[0].webkitGetAsEntry) {
      const walks = [];
      for (const item of dt.items) {
        const entry = item.webkitGetAsEntry?.();
        if (entry) walks.push(walkEntry(entry, '', dropped));
      }
      await Promise.all(walks);
    } else {
      for (const f of dt.files) dropped.push(f);
    }
    const allowed = dropped.filter((f) => {
      const name = (f.name || '').toLowerCase();
      return ACCEPTED_EXT.some((ext) => name.endsWith(ext));
    });
    acceptFiles(allowed);
  };

  // --- Launch: implicit batch create + upload + start ----------------------
  const launch = async () => {
    if (!files.length) return;
    for (const f of REQUIRED_FIELDS) {
      if (!defaults[f]) {
        setError(`Please fill the "${f}" field before uploading.`);
        setShowAdvanced(true);
        return;
      }
    }
    setError(null);

    let currentBatch = batch;
    if (!currentBatch) {
      try {
        const payload = {
          name: defaults.project_title || topFolderOf(files) || `Batch ${new Date().toISOString().slice(0, 10)}`,
          plant: defaults.plant,
          batch_defaults: defaults,
        };
        const res = await apiClient.post(`${BULK_API}/create/`, payload);
        currentBatch = res.data;
        setBatch(currentBatch);
      } catch (e) {
        setError(e?.response?.data?.error || e.message);
        return;
      }
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      // Chunk the payload — big folders blow past any single-request timeout.
      const chunks = chunkFiles(files, UPLOAD_CHUNK_FILES, UPLOAD_CHUNK_BYTES);
      const totalBytes = files.reduce((s, f) => s + f.size, 0) || 1;
      let sentBytes = 0;

      for (let ci = 0; ci < chunks.length; ci++) {
        const chunk = chunks[ci];
        const chunkBytes = chunk.reduce((s, f) => s + f.size, 0);
        const fd = new FormData();
        chunk.forEach((f) => {
          fd.append('files', f);
          fd.append('relative_paths', f.webkitRelativePath || f.name);
        });

        // Dynamic timeout for THIS chunk (not a fixed global value)
        const chunkTimeout = computeChunkTimeout(chunk.length, chunkBytes);

        // Retry loop — network hiccups or a single slow chunk shouldn't abort
        let attempt = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          try {
            // AbortController lets us enforce our own dynamic deadline
            // (axios' own timeout is also set, so whichever fires first wins).
            const controller = new AbortController();
            const deadline = setTimeout(() => controller.abort(), chunkTimeout);

            // Extend the deadline if the chunk is actively making progress —
            // gives slow but steady uploads room to finish without aborting.
            let lastLoaded = 0;
            let lastProgressAt = Date.now();
            const STALL_GRACE_MS = 45 * 1000; // 45 s with zero progress ⇒ stall

            await apiClient.post(
              `${BULK_API}/${currentBatch.batch_id}/upload/`,
              fd,
              {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: chunkTimeout,
                signal: controller.signal,
                onUploadProgress: (ev) => {
                  if (!ev.total) return;
                  const chunkLoaded = Math.min(ev.loaded, ev.total);
                  const pct = Math.min(
                    100,
                    Math.round(((sentBytes + chunkLoaded) / totalBytes) * 100),
                  );
                  setUploadProgress(pct);

                  // Active-progress detection: reset deadline if bytes keep flowing
                  if (chunkLoaded > lastLoaded) {
                    lastLoaded = chunkLoaded;
                    lastProgressAt = Date.now();
                  } else if (Date.now() - lastProgressAt > STALL_GRACE_MS) {
                    controller.abort(); // hard stall — abort & retry
                  }
                },
              },
            );
            clearTimeout(deadline);
            break; // success
          } catch (err) {
            attempt += 1;
            if (attempt > UPLOAD_RETRY_COUNT) throw err;
            // Exponential backoff before retry
            await sleep(1500 * Math.pow(2, attempt - 1));
          }
        }

        sentBytes += chunkBytes;
        setUploadProgress(Math.round((sentBytes / totalBytes) * 100));
      }

      await apiClient.post(`${BULK_API}/${currentBatch.batch_id}/start/`);
      setUploading(false);
      setExtracting(true);
    } catch (e) {
      setUploading(false);
      const msg = e?.response?.data?.error
        || (e?.code === 'ECONNABORTED'
            ? 'Upload timed out. Try a smaller batch or retry — the server may still be processing.'
            : e.message);
      setError(msg);
    }
  };

  // --- Poll extraction status ---------------------------------------------
  useEffect(() => {
    if (!extracting || !batch) return;
    const tick = async () => {
      try {
        const res = await apiClient.get(`${BULK_API}/${batch.batch_id}/status/`);
        setCounts(res.data.counts || {});
        setBatch(res.data.batch);
        const done = ['ready', 'exported', 'failed'].includes(res.data.batch.status);
        if (done) {
          setExtracting(false);
          await loadItems(1);
        }
      } catch { /* keep polling */ }
    };
    tick();
    pollRef.current = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [extracting, batch?.batch_id]);

  // --- Review grid data ---------------------------------------------------
  const loadItems = useCallback(async (p = page) => {
    if (!batch) return;
    try {
      const res = await apiClient.get(`${BULK_API}/${batch.batch_id}/items/`, {
        params: { page: p, page_size: PAGE_SIZE, status: statusFilter || undefined },
      });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || p);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    }
  }, [batch, page, statusFilter]);

  useEffect(() => {
    if (reviewReady) loadItems(1);
    // eslint-disable-next-line
  }, [statusFilter]);

  const saveCell = async (itemId, colKey, value) => {
    try {
      await apiClient.patch(`${BULK_API}/${batch.batch_id}/items/${itemId}/`, {
        fields: { [colKey]: value },
      });
      setItems((prev) => prev.map((it) =>
        it.item_id === itemId ? { ...it, fields: { ...it.fields, [colKey]: value } } : it,
      ));
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setEditingCell(null);
    }
  };

  const applyBulk = async () => {
    if (!bulkValue.colKey || selectedIds.size === 0) return;
    try {
      await apiClient.post(`${BULK_API}/${batch.batch_id}/bulk-update/`, {
        item_ids: Array.from(selectedIds),
        fields: { [bulkValue.colKey]: bulkValue.value },
      });
      await loadItems(page);
      setBulkValue({ colKey: '', value: '' });
      setSelectedIds(new Set());
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    }
  };

  const exportExcel = async () => {
    if (!batch) return;
    try {
      // Use apiClient so the JWT Authorization header is attached.
      // window.open() would open a new tab without auth → backend returns
      // 401/redirect to login instead of streaming the .xlsx file.
      const res = await apiClient.get(
        `${BULK_API}/${batch.batch_id}/export/`,
        { responseType: 'blob', timeout: 60000 }
      );
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      // Derive filename from Content-Disposition when the server provides it.
      let filename = `Master_Index_${(batch.plant || 'BATCH').replace(/\s+/g, '_')}.xlsx`;
      const cd = res.headers?.['content-disposition'] || res.headers?.['Content-Disposition'];
      if (cd) {
        const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
        if (m && m[1]) filename = decodeURIComponent(m[1]);
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Export failed');
    }
  };

  const resetBatch = () => {
    setBatch(null);
    setFiles([]);
    setItems([]);
    setCounts({});
    setUploadProgress(0);
    setUploading(false);
    setExtracting(false);
    setSelectedIds(new Set());
    setEditingCell(null);
    setStatusFilter('');
    setPage(1);
    setError(null);
  };

  // --- Derived UI ----------------------------------------------------------
  const totalSizeMB = useMemo(
    () => formatMB(files.reduce((s, f) => s + f.size, 0)),
    [files],
  );
  const progressPct = useMemo(() => {
    const t = batch?.total_files || 0;
    if (!t) return 0;
    return Math.round(((counts.ready || 0) + (counts.failed || 0)) / t * 100);
  }, [counts, batch]);

  const phase = extracting ? 'extracting'
              : uploading  ? 'uploading'
              : reviewReady ? 'ready'
              : files.length ? 'staged'
              : 'idle';

  // ------------------------------------------------------------------------
  if (tplError) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
        Failed to load template: {tplError}
      </div>
    );
  }
  if (!tpl) {
    return (
      <div className="p-6 text-center text-slate-500">
        <ArrowPathIcon className="h-8 w-8 mx-auto animate-spin text-emerald-600 mb-2" />
        Loading Master Index template…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <DocumentDuplicateIcon className="h-6 w-6 text-emerald-600" />
            Bulk Master Index
          </h2>
          <p className="text-sm text-slate-500">
            Drop a folder → auto-extract → review → export · {columns.length} columns · {tpl.template.template_name} v{tpl.template.version}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {batch && (
            <button
              onClick={resetBatch}
              className="px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              New batch
            </button>
          )}
          <button
            onClick={exportExcel}
            disabled={!reviewReady}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-40"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <XCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700 text-xs font-medium">Dismiss</button>
        </div>
      )}

      {/* Plant quick-input — the single required field, always visible */}
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3">
        <span className="text-sm font-medium text-slate-700 w-20">Plant *</span>
        <input
          type="text"
          value={defaults.plant || ''}
          onChange={(e) => setDefaults((d) => ({ ...d, plant: e.target.value }))}
          placeholder="e.g. Habshan-1"
          className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-emerald-700 font-medium"
        >
          <ChevronDownIcon className={clsx('h-4 w-4 transition-transform', showAdvanced && 'rotate-180')} />
          Advanced defaults
        </button>
      </div>

      {/* Collapsible advanced defaults */}
      {showAdvanced && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-3">
            Optional — applied to every file in this batch. You can also set these in bulk after extraction.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {ADVANCED_FIELDS.map((key) => {
              const col = columns.find((c) => c.key === key);
              if (!col) return null;
              return (
                <label key={key} className="block">
                  <span className="text-[11px] font-medium text-slate-600 mb-1 block">{col.label}</span>
                  <input
                    type="text"
                    value={defaults[key] ?? ''}
                    onChange={(e) => setDefaults((d) => ({ ...d, [key]: e.target.value }))}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Drop zone / progress — reactive by phase */}
      {(phase === 'idle' || phase === 'staged') && (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={clsx(
            'relative border-2 border-dashed rounded-2xl p-10 text-center transition-all',
            dragOver
              ? 'border-emerald-500 bg-emerald-50/60'
              : files.length
                ? 'border-emerald-300 bg-white'
                : 'border-slate-300 bg-slate-50/60 hover:bg-white',
          )}
        >
          <FolderOpenIcon className="h-14 w-14 text-emerald-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            {files.length
              ? `${files.length} file(s) ready · ${totalSizeMB} MB`
              : 'Drop a project folder here'}
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            {files.length
              ? 'Review below and click "Start extraction" to begin'
              : `or use the buttons below · ${ACCEPTED_EXT.join(', ')}`}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={() => folderInputRef.current?.click()}
              className="px-4 py-2 bg-white border border-emerald-500 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-50"
            >
              <FolderOpenIcon className="h-4 w-4 inline mr-1" />
              Pick folder
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50"
            >
              <CloudArrowUpIcon className="h-4 w-4 inline mr-1" />
              Pick files
            </button>
            {files.length > 0 && (
              <>
                <button
                  onClick={launch}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 shadow-sm"
                >
                  Start extraction ▶
                </button>
                <button
                  onClick={() => setFiles([])}
                  className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              </>
            )}
          </div>

          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            className="hidden"
            onChange={onPickFolder}
          />
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_EXT.join(',')}
            className="hidden"
            onChange={onPickFiles}
          />
        </div>
      )}

      {(phase === 'uploading' || phase === 'extracting') && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <ArrowPathIcon className="h-10 w-10 text-emerald-600 mx-auto animate-spin mb-3" />
          <h3 className="text-lg font-semibold text-slate-800 mb-1">
            {phase === 'uploading' ? `Uploading… ${uploadProgress}%` : 'Extracting metadata…'}
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            {phase === 'uploading'
              ? `${files.length} file(s) · ${totalSizeMB} MB`
              : `${(counts.ready || 0) + (counts.failed || 0)} / ${batch?.total_files || 0} processed · ${counts.ready || 0} ready · ${counts.failed || 0} failed`}
          </p>
          <div className="w-full max-w-lg mx-auto bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
              style={{ width: `${phase === 'uploading' ? uploadProgress : progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Review grid — appears on same screen once ready */}
      {reviewReady && (
        <ReviewGrid
          columns={columns}
          items={items}
          total={total}
          page={page}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          bulkValue={bulkValue}
          setBulkValue={setBulkValue}
          applyBulk={applyBulk}
          saveCell={saveCell}
          loadItems={loadItems}
          counts={counts}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Review grid
// ---------------------------------------------------------------------------

const ReviewGrid = ({
  columns, items, total, page, statusFilter, setStatusFilter,
  selectedIds, setSelectedIds, editingCell, setEditingCell,
  bulkValue, setBulkValue, applyBulk, saveCell, loadItems, counts,
}) => {
  const toggleId = (id) => setSelectedIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleAll = () => setSelectedIds((prev) =>
    prev.size === items.length ? new Set() : new Set(items.map((i) => i.item_id)),
  );

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-medium text-slate-700">
            {total} items · {counts.ready || 0} ready · {counts.failed || 0} failed · {selectedIds.size} selected
          </span>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded px-2 py-1"
        >
          <option value="">All statuses</option>
          <option value="ready">Ready</option>
          <option value="failed">Failed</option>
        </select>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-1 ml-2">
            <select
              value={bulkValue.colKey}
              onChange={(e) => setBulkValue((v) => ({ ...v, colKey: e.target.value }))}
              className="text-xs border border-slate-300 rounded px-2 py-1"
            >
              <option value="">Bulk apply column…</option>
              {columns.filter((c) => c.class !== 'auto_serial' && c.class !== 'derived').map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={bulkValue.value}
              onChange={(e) => setBulkValue((v) => ({ ...v, value: e.target.value }))}
              placeholder="value"
              className="text-xs border border-slate-300 rounded px-2 py-1 w-32"
            />
            <button
              onClick={applyBulk}
              disabled={!bulkValue.colKey}
              className="text-xs px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
            >
              Apply to {selectedIds.size}
            </button>
          </div>
        )}
      </div>

      <div className="overflow-auto" style={{ maxHeight: '65vh' }}>
        <table className="text-xs border-collapse">
          <thead className="bg-slate-100 sticky top-0 z-10">
            <tr>
              <th className="px-2 py-2 border-b border-slate-200">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selectedIds.size === items.length}
                  onChange={toggleAll}
                />
              </th>
              <th className="px-2 py-2 border-b border-slate-200 text-left font-semibold text-slate-600">Status</th>
              {columns.map((col) => (
                <th key={col.key}
                    className="px-3 py-2 border-b border-slate-200 text-left font-semibold text-slate-600 whitespace-nowrap"
                    style={{ minWidth: (col.width || 14) * 7 }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.item_id} className={clsx(
                'hover:bg-emerald-50/40',
                selectedIds.has(it.item_id) && 'bg-emerald-50',
              )}>
                <td className="px-2 py-1.5 border-b border-slate-100 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(it.item_id)}
                    onChange={() => toggleId(it.item_id)}
                  />
                </td>
                <td className="px-2 py-1.5 border-b border-slate-100">
                  <span className={clsx(
                    'px-1.5 py-0.5 rounded text-[10px] font-medium',
                    it.status === 'ready' && 'bg-emerald-100 text-emerald-700',
                    it.status === 'failed' && 'bg-red-100 text-red-700',
                    it.status === 'extracting' && 'bg-amber-100 text-amber-700',
                  )}>
                    {it.status}
                  </span>
                </td>
                {columns.map((col) => {
                  const value = it.fields?.[col.key] ?? '';
                  const isEditing = editingCell?.itemId === it.item_id && editingCell?.colKey === col.key;
                  const editable = col.class !== 'auto_serial' && col.class !== 'derived';
                  return (
                    <td key={col.key}
                        className="px-3 py-1.5 border-b border-slate-100"
                        style={{ maxWidth: MAX_CELL_WIDTH_PX }}>
                      {isEditing ? (
                        <input
                          autoFocus
                          defaultValue={value}
                          onBlur={(e) => saveCell(it.item_id, col.key, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="w-full px-1 py-0.5 border border-emerald-400 rounded text-xs"
                        />
                      ) : (
                        <div
                          onDoubleClick={() => editable && setEditingCell({ itemId: it.item_id, colKey: col.key })}
                          className={clsx(
                            'truncate',
                            editable && 'cursor-text hover:bg-emerald-50',
                            value === 'NA' && 'text-slate-400 italic',
                          )}
                          title={value}
                        >
                          {value || '—'}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 text-xs text-slate-600">
        <span>Page {page} of {pageCount}</span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => loadItems(page - 1)}
            className="px-3 py-1 border border-slate-300 rounded disabled:opacity-40"
          >←</button>
          <button
            disabled={page >= pageCount}
            onClick={() => loadItems(page + 1)}
            className="px-3 py-1 border border-slate-300 rounded disabled:opacity-40"
          >→</button>
        </div>
      </div>
    </div>
  );
};

export default BulkMasterIndex;
