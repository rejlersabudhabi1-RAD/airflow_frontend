/**
 * Pure mapping utility: Instrument Index rows → Cable Block Diagram rows.
 *
 * Re-uses the IO List rule engine (`buildIoListRowsFromInstruments`) to first
 * resolve every instrument to its system / IS-NIS / signal-type classification,
 * then groups the resulting IO points into cable bundles (field cables +
 * multicores) routed to marshalling and system cabinets — the canonical CBD
 * schema seen in ADNOC instrument cable block diagrams.
 *
 * Pure / no side effects / no I/O — fully unit-testable. Designed so the page
 * never has to know the underlying mapping rules; tune them here.
 */

import { buildIoListRowsFromInstruments } from './instrumentIndexToIoRows'

// ── Soft-coded CBD column schema (mirrors typical ADNOC cable block sheet) ──
export const CABLE_BLOCK_COLUMNS = [
  { key: 's_no',                label: '#' },
  { key: 'tag_number',          label: 'Instrument Tag' },
  { key: 'service_description', label: 'Service' },
  { key: 'system',              label: 'System' },
  { key: 'is_nis',              label: 'IS / NIS' },
  { key: 'signal_type',         label: 'Signal Type' },
  { key: 'jb_no',               label: 'Junction Box' },
  { key: 'field_cable_no',      label: 'Field Cable Tag' },
  { key: 'field_cable_size',    label: 'Field Cable Size' },
  { key: 'multicore_cable_no',  label: 'Multicore Tag' },
  { key: 'multicore_size',      label: 'Multicore Size' },
  { key: 'marsh_cab_no',        label: 'Marshalling Cabinet' },
  { key: 'sys_cab_no',          label: 'System Cabinet' },
  { key: 'function',            label: 'Function' },
  { key: 'pid_no',              label: 'P&ID No.' },
  { key: 'rev',                 label: 'Rev' },
  { key: 'remarks',             label: 'Remarks' },
]

// ── Soft-coded cabinet & cable naming conventions ───────────────────────────
// Override any of these in one place without touching the builder.
export const CABLE_BLOCK_DEFAULTS = {
  // Marshalling cabinet pattern — uses {unit}/{sys}/{ip} placeholders.
  // sys: D = DCS, E = ESD, F = FGS. ip: T = IS, N = NIS.
  marshallingCabinetPattern: '{unit}-{sys}T-{idx}',
  systemCabinetPattern:      '{unit}-{sys}S-{idx}',
  // Field cable tag: <area>-FC-<seq>
  fieldCableTagPattern:      '{area}-FC-{seq}',
  // Multicore tag: <area>-MC-<jbSeq>
  multicoreTagPattern:       '{area}-MC-{jbSeq}',
  // Junction box: <area>-JB-<sys><ip>-<seq>
  junctionBoxPattern:        '{area}-JB-{sys}{ip}-{seq}',
  // Cable sizes per signal classification
  // Format: <pair count>P x <cross-section> mm² <IS|NIS suffix>
  fieldCableSizeBySignal: {
    Analog:         '1Px1.5mm²',
    'Digital 24V':  '1Px1.5mm²',
    'Digital PF':   '1Px1.5mm²',
    default:        '1Px1.5mm²',
  },
  multicoreSizeBySignal: {
    Analog:         '12Px1.5mm²',
    'Digital 24V':  '20Px1.5mm²',
    'Digital PF':   '20Px1.5mm²',
    default:        '12Px1.5mm²',
  },
  // Default cabinet unit prefix when project unit is blank
  defaultUnit: '15',
  // Field instruments per junction box before opening a new JB
  maxInstrumentsPerJb: 12,
  // Cabinet starting index
  defaultCabinetIndex: '01',
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function _systemLetter(system) {
  const s = String(system || '').toUpperCase()
  if (s === 'ESD') return 'E'
  if (s === 'FGS') return 'F'
  return 'D' // default DCS
}

function _isNisLetter(isNis) {
  return String(isNis || '').toUpperCase() === 'NIS' ? 'N' : 'T'
}

function _fmt(pattern, vars) {
  return String(pattern).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''))
}

function _padSeq(n, width = 3) {
  return String(n).padStart(width, '0')
}

function _parseArea(tag) {
  const m = /^\s*([A-Za-z0-9]+)[-_]/.exec(String(tag || ''))
  return m ? m[1] : ''
}

// ── Main builder ────────────────────────────────────────────────────────────
/**
 * @param {Array<object>} instruments  Rows from the Instrument Index extractor.
 * @param {object} [opts]
 * @param {string} [opts.pid_no]
 * @param {string} [opts.rev]
 * @param {string} [opts.unit]                Plant unit prefix for cabinets.
 * @param {boolean} [opts.includeIndicators]  Pass through to IO list builder.
 * @returns {Array<object>}  CBD rows keyed by CABLE_BLOCK_COLUMNS[].key.
 */
export function buildCableBlockRowsFromInstruments(instruments, opts = {}) {
  const ioRows = buildIoListRowsFromInstruments(instruments, opts)
  const unit   = (opts.unit || CABLE_BLOCK_DEFAULTS.defaultUnit).trim()
  const rev    = opts.rev || '0'

  // Group IO rows into (area, system, is_nis) buckets — one bucket per
  // junction box. New JB opens once a bucket fills past maxInstrumentsPerJb.
  const buckets = new Map()        // key → array of io rows
  const bucketMeta = new Map()     // key → { area, system, is_nis, jbSeq }
  const jbCounters = new Map()     // `${area}|${sys}${ip}` → next seq
  let cabinetIdx = CABLE_BLOCK_DEFAULTS.defaultCabinetIndex

  for (const r of ioRows) {
    const area   = _parseArea(r.tag_number) || (opts.pid_no || '').slice(0, 3)
    const sysLet = _systemLetter(r.system)
    const ipLet  = _isNisLetter(r.is_nis)
    const groupKey = `${area}|${sysLet}${ipLet}`
    let bucketKey = `${groupKey}|${jbCounters.get(groupKey) || 1}`
    let bucket    = buckets.get(bucketKey)
    if (!bucket || bucket.length >= CABLE_BLOCK_DEFAULTS.maxInstrumentsPerJb) {
      const next = (jbCounters.get(groupKey) || 0) + 1
      jbCounters.set(groupKey, next)
      bucketKey = `${groupKey}|${next}`
      bucket = []
      buckets.set(bucketKey, bucket)
      bucketMeta.set(bucketKey, { area, sysLet, ipLet, jbSeq: next, signal_type: r.signal_type })
    }
    bucket.push(r)
  }

  // Emit CBD rows — one row per IO point, enriched with cable / cabinet info.
  const out = []
  let serial = 0
  let cableSeq = 0
  for (const [bucketKey, rows] of buckets.entries()) {
    const meta = bucketMeta.get(bucketKey) || {}
    const jbNo = _fmt(CABLE_BLOCK_DEFAULTS.junctionBoxPattern, {
      area: meta.area, sys: meta.sysLet, ip: meta.ipLet, seq: _padSeq(meta.jbSeq, 2),
    })
    const multicoreNo = _fmt(CABLE_BLOCK_DEFAULTS.multicoreTagPattern, {
      area: meta.area, jbSeq: _padSeq(meta.jbSeq, 3),
    })
    const marshCab = _fmt(CABLE_BLOCK_DEFAULTS.marshallingCabinetPattern, {
      unit, sys: meta.sysLet, ip: meta.ipLet, idx: cabinetIdx,
    })
    const sysCab = _fmt(CABLE_BLOCK_DEFAULTS.systemCabinetPattern, {
      unit, sys: meta.sysLet, ip: meta.ipLet, idx: cabinetIdx,
    })

    for (const r of rows) {
      serial   += 1
      cableSeq += 1
      const sig = r.signal_type || ''
      const fieldSize =
        CABLE_BLOCK_DEFAULTS.fieldCableSizeBySignal[sig] ||
        CABLE_BLOCK_DEFAULTS.fieldCableSizeBySignal.default
      const multiSize =
        CABLE_BLOCK_DEFAULTS.multicoreSizeBySignal[sig] ||
        CABLE_BLOCK_DEFAULTS.multicoreSizeBySignal.default
      const isSuffix = meta.ipLet === 'T' ? ' IS' : ' NIS'
      out.push({
        s_no:                String(serial),
        tag_number:          r.tag_number,
        service_description: r.service_description || '',
        system:              r.system || '',
        is_nis:              r.is_nis || '',
        signal_type:         sig,
        jb_no:               jbNo,
        field_cable_no:      _fmt(CABLE_BLOCK_DEFAULTS.fieldCableTagPattern, {
          area: meta.area, seq: _padSeq(cableSeq, 4),
        }),
        field_cable_size:    `${fieldSize}${isSuffix}`,
        multicore_cable_no:  multicoreNo,
        multicore_size:      `${multiSize}${isSuffix}`,
        marsh_cab_no:        marshCab,
        sys_cab_no:          sysCab,
        function:            (r.io_type || '').replace(/^(DI|DO|AI|AO|DCS-|ESD-)/, ''),
        pid_no:              r.pid_no || '',
        rev,
        remarks:             r.remarks || '',
      })
    }
  }

  return out
}
