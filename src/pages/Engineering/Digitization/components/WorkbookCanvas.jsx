/**
 * WorkbookCanvas
 * ──────────────
 * Cross-check & edit the SPEC and CAT workbooks before download.
 *
 * - Renders the data exactly as it will appear in the SmartPlant 3D template
 *   (one tab per template sheet, headers read from the template's Head row).
 * - Every cell is editable; edits autosave as `WorkbookCellOverride` records
 *   and are baked into the downloaded xlsx by the backend exporter.
 *
 * All UX knobs (debounce, highlight colours, density) live in `CANVAS_CONFIG`
 * — adjust there, never inline.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  ArrowUturnLeftIcon,
  MagnifyingGlassIcon,
  TableCellsIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
} from '@heroicons/react/24/outline';

import specCustomizationAPI from '../../../../services/specCustomizationAPI';

// ─── Soft-coded UI / behaviour knobs ────────────────────────────────────────
const CANVAS_CONFIG = {
  defaultWorkbook: 'spec',
  workbooks: [
    { key: 'spec', label: 'SPEC Workbook', sub: 'Piping spec rules',  accent: 'from-pink-500 to-rose-500'   },
    { key: 'cat',  label: 'CAT Workbook',  sub: 'Component catalog', accent: 'from-violet-500 to-fuchsia-500' },
  ],
  autosaveDebounceMs: 500,
  cellMinWidthPx:     140,
  rowHeaderMinWidthPx: 220,
  density: {
    rowPx:        32,
    headerRowPx:  36,
    cellPaddingX: 8,
  },
  highlight: {
    edited:   'bg-amber-50 ring-1 ring-amber-300',
    saving:   'bg-blue-50 ring-1 ring-blue-300',
    saved:    'bg-emerald-50 ring-1 ring-emerald-300',
    error:    'bg-rose-50 ring-1 ring-rose-300',
  },
  emptySheetMessage: 'No rows for this sheet yet — adjust extraction or add overrides.',
  // ── Fullscreen behaviour ──────────────────────────────────────────────
  // 'native' first tries the browser Fullscreen API and falls back to a
  // CSS-fixed overlay when blocked (e.g. inside an iframe); 'overlay'
  // forces the CSS overlay; 'off' disables the toggle entirely.
  fullscreen: {
    mode:            'native',
    exitOnEscape:    true,
    enterLabel:      'Full Screen',
    exitLabel:       'Exit Full Screen',
    enterHint:       'Maximise the canvas (Esc to exit)',
    exitHint:        'Restore the canvas to its normal size',
    gridMaxHeight:   '70vh',      // normal mode
    gridMaxHeightFS: 'calc(100vh - 180px)', // fullscreen mode
    overlayZIndex:   60,
  },
};

// `value` may be null/number/string — normalise to string for the input.
const toInputValue = (v) => (v === null || v === undefined ? '' : String(v));

// ─────────────────────────────────────────────────────────────────────────────
const WorkbookCanvas = ({ job }) => {
  const jobId = job?.id;

  const [workbook,    setWorkbook]    = useState(CANVAS_CONFIG.defaultWorkbook);
  const [data,        setData]        = useState(null);   // preview JSON
  const [loading,     setLoading]     = useState(false);
  const [loadError,   setLoadError]   = useState('');
  const [activeSheet, setActiveSheet] = useState(null);
  const [search,      setSearch]      = useState('');

  // edits[`${sheet}::${row_key}::${col}`] = { value, status: 'editing'|'saving'|'saved'|'error', error? }
  const [edits, setEdits] = useState({});
  const debounceTimers   = useRef({});

  // ── Fullscreen state (soft-coded fallback to CSS overlay) ───────────────
  const rootRef                 = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(async () => {
    const cfg = CANVAS_CONFIG.fullscreen;
    if (cfg.mode === 'off') return;
    const el = rootRef.current;
    if (!el) return;

    // Currently fullscreen → exit.
    if (isFullscreen) {
      if (document.fullscreenElement) {
        try { await document.exitFullscreen(); } catch { /* noop */ }
      }
      setIsFullscreen(false);
      return;
    }

    // Try the native Fullscreen API first when allowed.
    if (cfg.mode === 'native' && el.requestFullscreen) {
      try {
        await el.requestFullscreen();
        setIsFullscreen(true);
        return;
      } catch {
        // Fall through to CSS overlay.
      }
    }
    setIsFullscreen(true);
  }, [isFullscreen]);

  // Sync state with browser-driven fullscreen changes + Esc key.
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    const onKey = (e) => {
      if (CANVAS_CONFIG.fullscreen.exitOnEscape && e.key === 'Escape' && isFullscreen) {
        // Only handle the CSS-overlay case; the browser handles its own Esc.
        if (!document.fullscreenElement) setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      window.removeEventListener('keydown', onKey);
    };
  }, [isFullscreen]);

  // ── Fetch preview ────────────────────────────────────────────────────────
  const fetchPreview = useCallback(async () => {
    if (!jobId) return;
    setLoading(true);
    setLoadError('');
    try {
      const json = await specCustomizationAPI.getWorkbookPreview(jobId, workbook);
      setData(json);
      const firstSheet = json?.sheets?.find((s) => s.row_count > 0) || json?.sheets?.[0];
      setActiveSheet(firstSheet?.name || null);
      setEdits({});
    } catch (err) {
      setLoadError(err?.response?.data?.error || err?.message || 'Failed to load workbook.');
    } finally {
      setLoading(false);
    }
  }, [jobId, workbook]);

  useEffect(() => { fetchPreview(); }, [fetchPreview]);

  // ── Save / clear helpers ────────────────────────────────────────────────
  const editKey = (sheet, rowKey, col) => `${sheet}::${rowKey}::${col}`;

  const queueSave = useCallback((sheet, rowKey, col, value) => {
    const k = editKey(sheet, rowKey, col);

    setEdits((prev) => ({ ...prev, [k]: { value, status: 'editing' } }));

    if (debounceTimers.current[k]) clearTimeout(debounceTimers.current[k]);
    debounceTimers.current[k] = setTimeout(async () => {
      setEdits((prev) => ({ ...prev, [k]: { ...(prev[k] || {}), value, status: 'saving' } }));
      try {
        await specCustomizationAPI.saveWorkbookCell(jobId, {
          workbook,
          sheet_name:  sheet,
          row_key:     rowKey,
          column_name: col,
          value,
        });
        setEdits((prev) => ({ ...prev, [k]: { value, status: 'saved' } }));
      } catch (err) {
        setEdits((prev) => ({
          ...prev,
          [k]: { value, status: 'error', error: err?.response?.data?.error || err?.message },
        }));
      }
    }, CANVAS_CONFIG.autosaveDebounceMs);
  }, [jobId, workbook]);

  const clearCell = useCallback(async (sheet, rowKey, col) => {
    const k = editKey(sheet, rowKey, col);
    try {
      await specCustomizationAPI.clearWorkbookCell(jobId, {
        workbook, sheet_name: sheet, row_key: rowKey, column_name: col,
      });
      setEdits((prev) => {
        const next = { ...prev };
        delete next[k];
        return next;
      });
      // Re-fetch this sheet's row so the original extracted value re-appears.
      fetchPreview();
    } catch (err) {
      setEdits((prev) => ({
        ...prev,
        [k]: { ...(prev[k] || {}), status: 'error', error: err?.response?.data?.error || err?.message },
      }));
    }
  }, [jobId, workbook, fetchPreview]);

  // ── Derived data for the active sheet ───────────────────────────────────
  const activeSheetData = useMemo(() => {
    if (!data || !activeSheet) return null;
    return data.sheets.find((s) => s.name === activeSheet) || null;
  }, [data, activeSheet]);

  const filteredRows = useMemo(() => {
    if (!activeSheetData) return [];
    const q = search.trim().toLowerCase();
    if (!q) return activeSheetData.rows;
    return activeSheetData.rows.filter((row) => {
      // Search across all cell values + the source.class_code hint.
      const code = row.source?.class_code || '';
      if (code.toLowerCase().includes(q)) return true;
      return Object.values(row.cells || {}).some(
        (v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q),
      );
    });
  }, [activeSheetData, search]);

  const totalRows  = data?.sheets?.reduce((acc, s) => acc + (s.row_count || 0), 0) || 0;
  const editedKeys = Object.keys(edits).filter((k) => edits[k]?.status === 'saved');

  // ── Render ──────────────────────────────────────────────────────────────
  if (!jobId) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-sm text-slate-500 dark:text-slate-400">
        Upload &amp; extract a spec first to use the workbook canvas.
      </div>
    );
  }

  const fsEnabled = CANVAS_CONFIG.fullscreen.mode !== 'off';
  // When in CSS-overlay fullscreen (no native fullscreen element), pin the
  // root to the viewport; native fullscreen styles the element automatically.
  const overlayActive = isFullscreen && !document.fullscreenElement;
  const rootClass = overlayActive
    ? 'fixed inset-0 bg-slate-50 dark:bg-slate-900 p-4 overflow-auto space-y-3'
    : 'space-y-3';
  const rootStyle = overlayActive
    ? { zIndex: CANVAS_CONFIG.fullscreen.overlayZIndex }
    : undefined;
  const gridMaxH = isFullscreen
    ? CANVAS_CONFIG.fullscreen.gridMaxHeightFS
    : CANVAS_CONFIG.fullscreen.gridMaxHeight;

  return (
    <div ref={rootRef} className={rootClass} style={rootStyle}>
      {/* ── Header bar — workbook toggle + reload + stats ────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-sm">
        <div className="flex gap-1 rounded-lg bg-slate-100 dark:bg-slate-900 p-1">
          {CANVAS_CONFIG.workbooks.map((wb) => (
            <button
              key={wb.key}
              onClick={() => setWorkbook(wb.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                workbook === wb.key
                  ? `bg-gradient-to-r ${wb.accent} text-white shadow`
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
              title={wb.sub}
            >
              <TableCellsIcon className="inline w-4 h-4 mr-1 -mt-0.5" />
              {wb.label}
            </button>
          ))}
        </div>

        <button
          onClick={fetchPreview}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 rounded-md disabled:opacity-50 flex items-center gap-1"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Reload
        </button>

        <div className="ml-auto flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="hidden sm:inline">
            <strong className="text-slate-700 dark:text-slate-200">{totalRows}</strong> rows
            {data?.sheets ? ` · ${data.sheets.length} sheets` : ''}
          </span>
          {editedKeys.length > 0 && (
            <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200 flex items-center gap-1">
              <PencilSquareIcon className="w-3.5 h-3.5" />
              {editedKeys.length} saved edit{editedKeys.length === 1 ? '' : 's'}
            </span>
          )}
          {fsEnabled && (
            <button
              onClick={toggleFullscreen}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 rounded-md flex items-center gap-1"
              title={isFullscreen ? CANVAS_CONFIG.fullscreen.exitHint : CANVAS_CONFIG.fullscreen.enterHint}
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="w-4 h-4" />
              ) : (
                <ArrowsPointingOutIcon className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {isFullscreen ? CANVAS_CONFIG.fullscreen.exitLabel : CANVAS_CONFIG.fullscreen.enterLabel}
              </span>
            </button>
          )}
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-sm px-3 py-2 flex items-center gap-2">
          <ExclamationTriangleIcon className="w-4 h-4" />
          {loadError}
        </div>
      )}

      {/* ── Main split: sheet sidebar + grid ─────────────────────────────── */}
      {!loadError && data && (
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-3">
          {/* Sheet list */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 h-fit lg:sticky lg:top-2">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sheets
            </div>
            <div className="flex flex-col gap-0.5 max-h-[60vh] overflow-auto">
              {data.sheets.map((s) => {
                const active = s.name === activeSheet;
                return (
                  <button
                    key={s.name}
                    onClick={() => setActiveSheet(s.name)}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs rounded-md transition ${
                      active
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                    title={s.name}
                  >
                    <span className="truncate font-medium">{s.name}</span>
                    <span className={`text-[10px] tabular-nums ${active ? 'opacity-90' : 'text-slate-400'}`}>
                      {s.row_count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 px-3 py-2">
              <div className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                {activeSheet || '—'}
              </div>
              {activeSheetData && (
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                  {filteredRows.length} / {activeSheetData.row_count} rows
                </span>
              )}
              <div className="ml-auto relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search rows…"
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-sm text-slate-500 flex items-center gap-2">
                <ArrowPathIcon className="w-4 h-4 animate-spin" /> Loading workbook…
              </div>
            ) : !activeSheetData || activeSheetData.rows.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {CANVAS_CONFIG.emptySheetMessage}
              </div>
            ) : (
              <div className="overflow-auto" style={{ maxHeight: gridMaxH }}>
                <table className="min-w-full text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                    <tr style={{ height: CANVAS_CONFIG.density.headerRowPx }}>
                      <th
                        className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-900 text-left font-semibold border-b border-r border-slate-200 dark:border-slate-700 px-2"
                        style={{ minWidth: CANVAS_CONFIG.rowHeaderMinWidthPx }}
                      >
                        Source
                      </th>
                      {activeSheetData.headers.map((h) => (
                        <th
                          key={h}
                          className="text-left font-semibold border-b border-slate-200 dark:border-slate-700 px-2 whitespace-nowrap"
                          style={{ minWidth: CANVAS_CONFIG.cellMinWidthPx }}
                          title={h}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr
                        key={row.row_key}
                        className="hover:bg-pink-50/40 dark:hover:bg-slate-700/40"
                        style={{ height: CANVAS_CONFIG.density.rowPx }}
                      >
                        <td
                          className="sticky left-0 bg-white dark:bg-slate-800 border-b border-r border-slate-200 dark:border-slate-700 px-2 py-1 text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap"
                          style={{ minWidth: CANVAS_CONFIG.rowHeaderMinWidthPx }}
                        >
                          <div className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                            {row.source?.class_code || '—'}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate" title={row.row_key}>
                            {row.row_key}
                          </div>
                        </td>
                        {activeSheetData.headers.map((col) => {
                          const k = editKey(activeSheet, row.row_key, col);
                          const local = edits[k];
                          const raw   = row.cells?.[col];
                          const value = local ? local.value : toInputValue(raw);
                          const wasOverridden = (row.overridden || []).includes(col);
                          const status = local?.status;
                          const cellCls =
                            status === 'saving' ? CANVAS_CONFIG.highlight.saving
                            : status === 'saved' ? CANVAS_CONFIG.highlight.saved
                            : status === 'error' ? CANVAS_CONFIG.highlight.error
                            : status === 'editing' ? CANVAS_CONFIG.highlight.edited
                            : wasOverridden ? CANVAS_CONFIG.highlight.edited
                            : '';
                          return (
                            <td
                              key={col}
                              className={`border-b border-slate-100 dark:border-slate-700 px-1 py-0.5 align-middle ${cellCls}`}
                              style={{ minWidth: CANVAS_CONFIG.cellMinWidthPx }}
                            >
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={value}
                                  onChange={(e) =>
                                    queueSave(activeSheet, row.row_key, col, e.target.value)
                                  }
                                  className="w-full bg-transparent outline-none px-1.5 py-1 text-[11px] focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-pink-300 rounded"
                                  title={status === 'error' ? local.error : undefined}
                                />
                                {(wasOverridden || status === 'saved' || status === 'error') && (
                                  <button
                                    onClick={() => clearCell(activeSheet, row.row_key, col)}
                                    className="opacity-60 hover:opacity-100 text-slate-500 hover:text-rose-500"
                                    title="Reset to extracted value"
                                  >
                                    <ArrowUturnLeftIcon className="w-3 h-3" />
                                  </button>
                                )}
                                {status === 'saved' && (
                                  <CheckCircleIcon className="w-3 h-3 text-emerald-500" title="Saved" />
                                )}
                                {status === 'saving' && (
                                  <ArrowPathIcon className="w-3 h-3 animate-spin text-blue-500" title="Saving…" />
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkbookCanvas;
