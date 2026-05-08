/**
 * Soft-coded valve-tag suffix → Remark codes.
 * ============================================
 * Mirrors the backend dictionary at:
 *   backend/apps/pid_verification/services/piping_valve_mto_extractor.py
 *   (VALVE_TAG_REMARK_CODES)
 *
 * Standard P&ID valve condition / operator codes appended to a tag
 * (e.g. "BV-1234-LO", "GV-08-FBLC"). When a valve_tag contains any of
 * these tokens, the matching code is surfaced in the Remarks column so
 * the engineer sees "LO, LC, TSO, FBLC, FBLO" without manual decoding.
 *
 * Order matters — longer codes are listed first so "FBLC" is not
 * truncated mid-match to "LC".
 */

// [code, label] — label is what appears in the Remarks column.
export const VALVE_TAG_REMARK_CODES = [
  ['FBLO', 'FBLO'],  // Full-Bore Locked Open
  ['FBLC', 'FBLC'],  // Full-Bore Locked Closed
  ['CSO',  'CSO'],   // Car-Sealed Open
  ['CSC',  'CSC'],   // Car-Sealed Closed
  ['TSO',  'TSO'],   // Tight Shut-Off
  ['NRV',  'NRV'],   // Non-Return Valve
  ['LO',   'LO'],    // Locked Open
  ['LC',   'LC'],    // Locked Closed
  ['NO',   'NO'],    // Normally Open
  ['NC',   'NC'],    // Normally Closed
  ['FO',   'FO'],    // Fail Open
  ['FC',   'FC'],    // Fail Closed
  ['FL',   'FL'],    // Fail Last
  ['FI',   'FI'],    // Fail Indeterminate
];

// Boundary excludes only letters on both sides — digits / hyphens / spaces
// are allowed neighbours so patterns like ``BV-LO-1234``, ``V101LO``,
// ``LO/LC`` and ``LO 6"`` all match. Uses a non-lookbehind fallback path
// for older Safari that lacks lookbehind support.
let _CODE_RE;
try {
  _CODE_RE = new RegExp(
    '(?<![A-Z])(' +
      VALVE_TAG_REMARK_CODES.map(([c]) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') +
    ')(?![A-Z])',
    'gi',
  );
} catch (_e) {
  // Safari < 16.4 lookbehind fallback: capture optional non-letter prefix.
  _CODE_RE = new RegExp(
    '(^|[^A-Z])(' +
      VALVE_TAG_REMARK_CODES.map(([c]) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') +
    ')(?![A-Z])',
    'gi',
  );
}

// Fields scanned (in priority order) when deriving Remarks from a row.
export const REMARK_SOURCE_FIELDS = ['valve_tag', 'remarks', 'description'];

const _scanText = (text, lookup, found) => {
  if (!text) return;
  const s = String(text);
  let m;
  _CODE_RE.lastIndex = 0;
  while ((m = _CODE_RE.exec(s)) !== null) {
    // Group index differs between lookbehind and fallback regex — the
    // captured code is always the LAST capturing group.
    const captured = m[m.length - 1] || m[1];
    const label = lookup.get(String(captured).toUpperCase());
    if (label && !found.includes(label)) found.push(label);
  }
};

/**
 * Return a comma-separated list of suffix codes embedded in `valveTag`.
 * Empty string when no codes match. Order follows VALVE_TAG_REMARK_CODES.
 */
export const deriveRemarksFromTag = (valveTag) => {
  if (!valveTag) return '';
  const lookup = new Map(VALVE_TAG_REMARK_CODES.map(([c, l]) => [c.toUpperCase(), l]));
  const found = [];
  _scanText(valveTag, lookup, found);
  return found.join(', ');
};

/**
 * Scan an entire row across REMARK_SOURCE_FIELDS for operational codes.
 * Returns a comma-separated label list or '' when nothing matches.
 */
export const deriveRemarksFromRow = (row) => {
  if (!row || typeof row !== 'object') return '';
  const lookup = new Map(VALVE_TAG_REMARK_CODES.map(([c, l]) => [c.toUpperCase(), l]));
  const found = [];
  for (const field of REMARK_SOURCE_FIELDS) {
    _scanText(row[field], lookup, found);
  }
  return found.join(', ');
};

export default { VALVE_TAG_REMARK_CODES, REMARK_SOURCE_FIELDS, deriveRemarksFromTag, deriveRemarksFromRow };
