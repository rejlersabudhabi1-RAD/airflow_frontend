/**
 * Role & Access Management — /admin/roles
 *
 * Unified control panel for the Super Administrator.
 * Two top-level tabs:
 *   • "Roles & Permissions"  — create/edit roles, assign modules, assign/remove users
 *   • "Access Requests (N)"  — review pending module access requests from regular users;
 *                               approve (grants module) or deny with optional admin note
 *
 * All thresholds, labels, role codes, module codes, and copy are soft-coded in
 * the constants section below.  Never hardcode magic values inline.
 */

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import rbacService from '../../services/rbac.service';
import { getEngineeringDisciplines } from '../../config/engineeringStructure.config.js';

// ═══════════════════════════════════════════════════════════════════════════
// ── Soft-coded constants ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

const ROLE_LEVEL_COLORS = {
  1: { bg: 'bg-red-100',    text: 'text-red-800',    dot: 'bg-red-500'    },
  2: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  3: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  4: { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500'   },
  5: { bg: 'bg-teal-100',   text: 'text-teal-800',   dot: 'bg-teal-500'   },
  6: { bg: 'bg-slate-100',  text: 'text-slate-700',  dot: 'bg-slate-400'  },
};
const DEFAULT_LEVEL_COLOR = { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };

const ROLE_LEVEL_LABELS = {
  1: 'Super Admin', 2: 'Admin', 3: 'Manager', 4: 'Engineer', 5: 'Reviewer', 6: 'Viewer',
};

const SUPER_ADMIN_ROLE_CODE  = 'super_admin';
const SENSITIVE_ROLE_CODES   = ['hr_admin'];
const SENSITIVE_MODULE_CODES = ['hr_management', 'payroll', 'timesheet'];

const CUSTOM_ROLE_LEVEL_OPTIONS_ADMIN = [2, 3, 4, 5, 6];
const CUSTOM_ROLE_LEVEL_OPTIONS_SUPER = [1, 2, 3, 4, 5, 6];

const USER_SEARCH_MIN_CHARS   = 2;
const USER_SEARCH_DEBOUNCE_MS = 350;
const USER_SEARCH_PAGE_SIZE   = 20;

const EMPTY_FORM = { name: '', code: '', level: 3, description: '' };

const AR_STATUS_FILTERS = [
  { key: 'pending',  label: 'Pending'  },
  { key: 'approved', label: 'Approved' },
  { key: 'denied',   label: 'Denied'   },
  { key: '',         label: 'All'      },
];
const AR_STATUS_COLORS = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  denied:   'bg-red-100 text-red-800',
};
const AR_STATUS_LABELS = {
  pending:  'Pending Review',
  approved: 'Approved',
  denied:   'Denied',
};

const MAIN_TAB_ROLES = 'roles';
const MAIN_TAB_AR    = 'access-requests';

// ═══════════════════════════════════════════════════════════════════════════
// ── Dynamic Module Catalog ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
//
// HOW TO ADD A NEW FEATURE GROUP:
//   • Engineering disciplines → edit engineeringStructure.config.js (auto-picked up)
//   • Non-engineering group   → add an entry to NON_ENGINEERING_GROUPS below
//
// That's it — no other file needs touching.

// Soft-coded non-engineering module groups.
// Add new groups here when new feature areas are introduced.
// Each entry: { id, label, color, description, moduleCodes }
// Valid colors: blue | orange | purple | yellow | gray | indigo | pink | green | red | teal
const NON_ENGINEERING_GROUPS = [
  {
    id: 'common',
    label: 'Common & Integration',
    color: 'purple',
    description: 'Cross-discipline tools and document management',
    moduleCodes: ['crs_documents', 'pfd_to_pid', 'designiq'],
  },
  {
    id: 'qhse',
    label: 'QHSE',
    color: 'red',
    description: 'Quality, Health, Safety & Environment',
    moduleCodes: ['qhse'],
  },
  {
    id: 'finance',
    label: 'Finance',
    color: 'teal',
    description: 'Invoice tracking, billing and financial management',
    moduleCodes: ['finance'],
  },
  {
    id: 'sales',
    label: 'Sales',
    color: 'orange',
    description: 'Internal sales pipeline and business development',
    moduleCodes: ['sales'],
  },
  {
    id: 'project_control',
    label: 'Project Control',
    color: 'indigo',
    description: 'Project planning, tracking and schedule control',
    moduleCodes: ['project_control'],
  },
  {
    id: 'procurement',
    label: 'Procurement',
    color: 'yellow',
    description: 'Vendors, purchase orders, requisitions and receipts',
    moduleCodes: ['procurement'],
  },
  {
    id: 'hr',
    label: 'Human Resources',
    color: 'green',
    description: 'HR management, payroll and self-service',
    moduleCodes: ['hr_management', 'payroll', 'timesheet', 'hr_self_service'],
  },
  {
    id: 'administration',
    label: 'Administration',
    color: 'gray',
    description: 'User management, organization settings and audit logs',
    moduleCodes: ['user_mgmt', 'org_settings', 'audit_logs'],
  },
];

// Tailwind colour map for group headers — extend as needed
const GROUP_COLOR_MAP = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-500',   check: 'accent-blue-600'   },
  orange: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', check: 'accent-orange-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500', check: 'accent-purple-600' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200', dot: 'bg-yellow-500', check: 'accent-yellow-600' },
  gray:   { bg: 'bg-gray-50',   text: 'text-gray-600',   border: 'border-gray-200',   dot: 'bg-gray-400',   check: 'accent-gray-500'   },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500', check: 'accent-indigo-600' },
  pink:   { bg: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-200',   dot: 'bg-pink-500',   check: 'accent-pink-600'   },
  green:  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500',  check: 'accent-green-600'  },
  red:    { bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500',    check: 'accent-red-600'    },
  teal:   { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   dot: 'bg-teal-500',   check: 'accent-teal-600'   },
};
const DEFAULT_GROUP_COLOR = GROUP_COLOR_MAP.gray;

/**
 * Build the ordered module catalog by merging:
 *   1. Engineering disciplines from engineeringStructure.config.js (auto-updated)
 *   2. NON_ENGINEERING_GROUPS defined above
 * Called once at module load — result is a static constant.
 */
function buildCatalog() {
  const engGroups = getEngineeringDisciplines().map((d) => ({
    id:          d.id,
    label:       d.fullName,
    color:       d.color,
    description: d.description,
    moduleCodes: [...new Set(d.subFeatures.map((sf) => sf.moduleCode).filter(Boolean))],
  }));
  return [...engGroups, ...NON_ENGINEERING_GROUPS];
}

const MODULE_CATALOG    = buildCatalog();
const KNOWN_MODULE_CODES = new Set(MODULE_CATALOG.flatMap((g) => g.moduleCodes));

// ── Helpers ────────────────────────────────────────────────────────────────
function getLevelColor(level) { return ROLE_LEVEL_COLORS[level] || DEFAULT_LEVEL_COLOR; }
function getLevelLabel(level) { return ROLE_LEVEL_LABELS[level] || `Level ${level}`; }
function toArray(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (d?.results) return d.results;
  if (Array.isArray(res)) return res;
  return [];
}

// ── Sub-components ──────────────────────────────────────────────────────────

function RoleBadge({ role, selected, onClick }) {
  const c = getLevelColor(role.level);
  return (
    <button
      onClick={() => onClick(role)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
        selected ? `border-blue-500 shadow-md ring-2 ring-blue-200 ${c.bg}` : 'border-gray-200 hover:border-blue-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
            <span className="font-semibold text-sm text-gray-900 truncate">{role.name}</span>
            {SENSITIVE_ROLE_CODES.includes(role.code) && (
              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">SENSITIVE</span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{role.description || '—'}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>{getLevelLabel(role.level)}</span>
          <span className="text-xs text-gray-400">{role.user_count ?? 0} users</span>
          {role.is_system_role && <span className="text-xs text-gray-400 italic">System</span>}
        </div>
      </div>
    </button>
  );
}

function ModuleToggle({ module, enabled, onChange, disabled, isSensitive }) {
  return (
    <label className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
      enabled ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
    } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300'}`}>
      <input type="checkbox" checked={enabled} disabled={disabled}
        onChange={(e) => onChange(module, e.target.checked)}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-gray-800">{module.name}</span>
          {isSensitive && (
            <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">{module.description || module.code}</p>
      </div>
    </label>
  );
}

// ── IndeterminateCheckbox ─────────────────────────────────────────────────
function IndeterminateCheckbox({ checked, indeterminate, onChange, disabled }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate; }, [indeterminate]);
  return (
    <input ref={ref} type="checkbox" checked={checked} disabled={disabled}
      onChange={onChange}
      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed" />
  );
}

// ── GroupedModulePanel ────────────────────────────────────────────────────
// Renders API modules grouped by feature area derived from the catalog.
// New groups auto-appear when added to the catalog or engineering config.
function GroupedModulePanel({ modules, assignedModuleIds, onToggle, disabled, saving }) {
  // Default: all groups expanded
  const [expanded, setExpanded] = useState(() => {
    const init = { __other__: true };
    MODULE_CATALOG.forEach((g) => { init[g.id] = true; });
    return init;
  });
  const [modSearch, setModSearch] = useState('');

  // Partition API modules into catalog groups + ungrouped
  const { groups, other } = useMemo(() => {
    const byCode = {};
    modules.forEach((m) => { byCode[m.code] = m; });
    const search = modSearch.toLowerCase();

    const filterItem = (m) =>
      !search ||
      m.name.toLowerCase().includes(search) ||
      m.code.toLowerCase().includes(search);

    const built = MODULE_CATALOG.map((g) => ({
      ...g,
      items: g.moduleCodes.map((c) => byCode[c]).filter(Boolean).filter(filterItem),
    })).filter((g) => g.items.length > 0);

    const ungrouped = modules
      .filter((m) => !KNOWN_MODULE_CODES.has(m.code))
      .filter(filterItem);

    return { groups: built, other: ungrouped };
  }, [modules, modSearch]);

  const toggleGroup = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const groupState = (items) => {
    const n = items.filter((m) => assignedModuleIds.has(m.id)).length;
    if (n === 0)            return 'none';
    if (n === items.length) return 'all';
    return 'some';
  };

  const handleGroupCheck = async (items, state, e) => {
    e.stopPropagation();
    if (disabled || saving) return;
    const enable = state !== 'all';
    for (const m of items) {
      const isOn = assignedModuleIds.has(m.id);
      if (enable && !isOn)  await onToggle(m, true);
      if (!enable && isOn)  await onToggle(m, false);
    }
  };

  const renderGroup = (g, items) => {
    const c      = GROUP_COLOR_MAP[g.color] || DEFAULT_GROUP_COLOR;
    const state  = groupState(items);
    const open   = expanded[g.id] !== false;
    const nOn    = items.filter((m) => assignedModuleIds.has(m.id)).length;
    return (
      <div key={g.id} className="border border-gray-200 rounded-xl overflow-hidden mb-2">
        {/* Header */}
        <div
          onClick={() => toggleGroup(g.id)}
          className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none ${c.bg} ${open ? 'border-b border-gray-100' : ''}`}
        >
          {!disabled && (
            <IndeterminateCheckbox
              checked={state === 'all'}
              indeterminate={state === 'some'}
              disabled={saving}
              onChange={(e) => handleGroupCheck(items, state, e)}
            />
          )}
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
          <span className={`flex-1 text-xs font-semibold ${c.text}`}>{g.label}</span>
          {g.description && (
            <span className="hidden sm:block text-xs text-gray-400 truncate max-w-[160px]">{g.description}</span>
          )}
          <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
            nOn > 0 ? `${c.bg} ${c.text} ring-1 ring-inset ${c.border}` : 'bg-white text-gray-400'
          }`}>
            {nOn}/{items.length}
          </span>
          <svg className={`w-3.5 h-3.5 ${c.text} flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {/* Module rows */}
        {open && (
          <div className="p-2 space-y-1.5 bg-white">
            {items.map((mod) => (
              <ModuleToggle key={mod.id} module={mod} enabled={assignedModuleIds.has(mod.id)}
                onChange={onToggle} disabled={disabled || saving}
                isSensitive={SENSITIVE_MODULE_CODES.includes(mod.code)} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Module search */}
      <div className="relative mb-3">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Filter modules…" value={modSearch}
          onChange={(e) => setModSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300" />
      </div>
      {/* Groups */}
      {groups.map((g) => renderGroup(g, g.items))}
      {/* Ungrouped / new modules */}
      {other.length > 0 && renderGroup(
        { id: '__other__', label: 'Other Modules', color: 'gray', description: 'Modules not yet assigned to a feature group' },
        other
      )}
      {groups.length === 0 && other.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">No modules match your filter.</p>
      )}
    </div>
  );
}

function ArBadge({ status }) {
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${AR_STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'}`}>
      {AR_STATUS_LABELS[status] || status}
    </span>
  );
}

function ActionModal({ request, action, onClose, onConfirm }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const isApprove = action === 'approve';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className={`text-lg font-bold mb-1 ${isApprove ? 'text-green-700' : 'text-red-700'}`}>
          {isApprove ? 'Approve Request' : 'Deny Request'}
        </h2>
        <p className="text-sm text-gray-600 mb-1">User: <strong>{request.user_name || request.user_email}</strong></p>
        <p className="text-sm text-gray-600 mb-4">Module: <strong>{request.module_name}</strong></p>
        <label className="block text-sm font-medium text-gray-700 mb-1">Admin note <span className="text-gray-400">(optional)</span></label>
        <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
          rows={3} placeholder={isApprove ? 'Any message for the user…' : 'Reason for denial…'}
          value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="flex gap-3 mt-5 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={async () => { setBusy(true); await onConfirm(request.id, note); setBusy(false); }} disabled={busy}
            className={`px-4 py-2 text-sm rounded-lg text-white disabled:opacity-60 ${isApprove ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
            {busy ? 'Processing…' : isApprove ? 'Approve' : 'Deny'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ── Main component ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

function RoleManagement() {
  const { currentUser }    = useSelector((s) => s.rbac);
  const { user: authUser } = useSelector((s) => s.auth);

  const isSuperAdmin = useMemo(() => {
    return currentUser?.roles?.some((r) => ['super_admin','superadmin'].includes(r.code))
      || authUser?.is_superuser === true || authUser?.user?.is_superuser === true;
  }, [currentUser, authUser]);

  const isAdmin = useMemo(() => {
    if (isSuperAdmin) return true;
    return currentUser?.roles?.some((r) => r.code === 'admin')
      || authUser?.is_staff === true || authUser?.user?.is_staff === true;
  }, [isSuperAdmin, currentUser, authUser]);

  const [mainTab, setMainTab] = useState(MAIN_TAB_ROLES);

  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const notify = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    const t = setTimeout(() => setNotification({ show: false, type: '', message: '' }), 4500);
    return () => clearTimeout(t);
  }, []);

  // ── Roles tab state ────────────────────────────────────────────────────
  const [roles,         setRoles]         = useState([]);
  const [modules,       setModules]       = useState([]);
  const [roleUsers,     setRoleUsers]     = useState([]);
  const [loadingRoles,  setLoadingRoles]  = useState(true);
  const [loadingMods,   setLoadingMods]   = useState(true);
  const [loadingUsers,  setLoadingUsers]  = useState(false);
  const [selectedRole,  setSelectedRole]  = useState(null);
  const [roleSearch,    setRoleSearch]    = useState('');
  const [savingModule,  setSavingModule]  = useState(false);
  const [assignSearch,  setAssignSearch]  = useState('');
  const [assignResults, setAssignResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [assigning,     setAssigning]     = useState(false);
  const [removingId,    setRemovingId]    = useState(null);
  const [showCreate,    setShowCreate]    = useState(false);
  const [creating,      setCreating]      = useState(false);
  const [createForm,    setCreateForm]    = useState(EMPTY_FORM);
  const [createError,   setCreateError]   = useState(null);

  const canManageRoleUsers = useMemo(() => {
    if (!isAdmin || !selectedRole) return false;
    if (selectedRole.code === SUPER_ADMIN_ROLE_CODE) return isSuperAdmin;
    return true;
  }, [isAdmin, isSuperAdmin, selectedRole]);

  useEffect(() => {
    (async () => {
      try { setLoadingRoles(true); setRoles(toArray(await rbacService.getRoles())); }
      catch { notify('error', 'Failed to load roles.'); }
      finally { setLoadingRoles(false); }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try { setLoadingMods(true); setModules(toArray(await rbacService.getModules())); }
      catch { notify('error', 'Failed to load modules.'); }
      finally { setLoadingMods(false); }
    })();
  }, []);

  const loadRoleUsers = useCallback(async (code) => {
    try { setLoadingUsers(true); setRoleUsers(toArray(await rbacService.getUsers({ role: code }))); }
    catch { setRoleUsers([]); }
    finally { setLoadingUsers(false); }
  }, []);

  const refreshRoles = useCallback(async () => {
    const arr = toArray(await rbacService.getRoles());
    setRoles(arr);
    return arr;
  }, []);

  const handleSelectRole = useCallback((role) => {
    setSelectedRole(role); setAssignSearch(''); setAssignResults([]); loadRoleUsers(role.code);
  }, [loadRoleUsers]);

  const handleModuleToggle = useCallback(async (module, checked) => {
    if (!isSuperAdmin || !selectedRole) return;
    setSavingModule(true);
    try {
      if (checked) await rbacService.assignModuleToRole(selectedRole.id, module.id);
      else         await rbacService.revokeModuleFromRole(selectedRole.id, module.id);
      const arr = await refreshRoles();
      const r   = arr.find((x) => x.id === selectedRole.id);
      if (r) setSelectedRole(r);
      notify('success', `Module ${checked ? 'added to' : 'removed from'} ${selectedRole.name}.`);
    } catch (err) { notify('error', err?.response?.data?.detail || 'Failed to update module.'); }
    finally { setSavingModule(false); }
  }, [isSuperAdmin, selectedRole, refreshRoles, notify]);

  useEffect(() => {
    if (!assignSearch || assignSearch.length < USER_SEARCH_MIN_CHARS) { setAssignResults([]); return; }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const list = toArray(await rbacService.getUsers({ search: assignSearch, page_size: USER_SEARCH_PAGE_SIZE }));
        const ids  = new Set(roleUsers.map((u) => u.id));
        setAssignResults(list.filter((u) => !ids.has(u.id)));
      } catch { setAssignResults([]); }
      finally { setSearchLoading(false); }
    }, USER_SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [assignSearch, roleUsers]);

  const handleAssignUser = useCallback(async (u) => {
    if (!selectedRole || assigning) return;
    setAssigning(true); setAssignSearch(''); setAssignResults([]);
    try {
      await rbacService.assignRole(u.id, selectedRole.id);
      await loadRoleUsers(selectedRole.code);
      const arr = await refreshRoles();
      const r   = arr.find((x) => x.id === selectedRole.id);
      if (r) setSelectedRole(r);
      const name = [u.user?.first_name, u.user?.last_name].filter(Boolean).join(' ') || u.user?.email;
      notify('success', `${name} assigned to ${selectedRole.name}.`);
    } catch (err) { notify('error', err?.response?.data?.error || err?.response?.data?.detail || 'Failed to assign.'); }
    finally { setAssigning(false); }
  }, [selectedRole, assigning, loadRoleUsers, refreshRoles, notify]);

  const handleRemoveUser = useCallback(async (u) => {
    if (!selectedRole || removingId) return;
    setRemovingId(u.id);
    try {
      await rbacService.revokeRole(u.id, selectedRole.id);
      setRoleUsers((prev) => prev.filter((x) => x.id !== u.id));
      const arr = await refreshRoles();
      const r   = arr.find((x) => x.id === selectedRole.id);
      if (r) setSelectedRole(r);
      const name = [u.user?.first_name, u.user?.last_name].filter(Boolean).join(' ') || u.user?.email;
      notify('success', `${name} removed from ${selectedRole.name}.`);
    } catch (err) { notify('error', err?.response?.data?.error || err?.response?.data?.detail || 'Failed to remove.'); }
    finally { setRemovingId(null); }
  }, [selectedRole, removingId, refreshRoles, notify]);

  const handleCreateRole = useCallback(async () => {
    if (!createForm.name.trim() || !createForm.code.trim()) { setCreateError('Name and Code are required.'); return; }
    setCreating(true); setCreateError(null);
    try {
      const res  = await rbacService.createRole({
        name: createForm.name.trim(), code: createForm.code.trim().toLowerCase().replace(/\s+/g,'_'),
        level: createForm.level, description: createForm.description.trim(), is_system_role: false, is_active: true,
      });
      const role = res?.data ?? res;
      setRoles((prev) => [...prev, role]); setShowCreate(false); setCreateForm(EMPTY_FORM);
      notify('success', `Role "${role.name}" created.`);
    } catch (err) {
      setCreateError(err?.response?.data?.detail || Object.values(err?.response?.data || {}).flat().join(' ') || 'Failed.');
    } finally { setCreating(false); }
  }, [createForm, notify]);

  const handleDeleteRole = useCallback(async (role) => {
    if (role.is_system_role || !window.confirm(`Delete "${role.name}"? This revokes it from all users.`)) return;
    try {
      await rbacService.deleteRole(role.id);
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      if (selectedRole?.id === role.id) setSelectedRole(null);
      notify('success', `Role "${role.name}" deleted.`);
    } catch (err) { notify('error', err?.response?.data?.detail || 'Failed to delete.'); }
  }, [selectedRole, notify]);

  const filteredRoles = useMemo(() => {
    const t = roleSearch.toLowerCase();
    return t ? roles.filter((r) => r.name.toLowerCase().includes(t) || r.code.toLowerCase().includes(t)) : roles;
  }, [roles, roleSearch]);

  const assignedModuleIds = useMemo(() => new Set((selectedRole?.modules || []).map((m) => m.id)), [selectedRole]);

  // ── Access Requests tab state ─────────────────────────────────────────
  const [arStatusTab, setArStatusTab] = useState('pending');
  const [arRequests,  setArRequests]  = useState([]);
  const [arLoading,   setArLoading]   = useState(false);
  const [arError,     setArError]     = useState('');
  const [arSuccess,   setArSuccess]   = useState('');
  const [arModal,     setArModal]     = useState(null);
  const [pendingTotal,setPendingTotal]= useState(0);

  const loadArRequests = useCallback(async (filter) => {
    setArLoading(true); setArError('');
    try {
      const res  = await rbacService.getAccessRequests(filter ? { status: filter } : {});
      const list = res?.data?.results ?? res?.data ?? [];
      setArRequests(Array.isArray(list) ? list : []);
    } catch { setArError('Failed to load access requests.'); }
    finally { setArLoading(false); }
  }, []);

  const refreshPending = useCallback(async () => {
    try {
      const res  = await rbacService.getAccessRequests({ status: 'pending' });
      const list = res?.data?.results ?? res?.data ?? [];
      setPendingTotal(Array.isArray(list) ? list.length : 0);
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => { refreshPending(); }, []);
  useEffect(() => { if (mainTab === MAIN_TAB_AR) loadArRequests(arStatusTab); }, [mainTab, arStatusTab]);

  const handleArAction = useCallback(async (id, note) => {
    setArError(''); setArSuccess('');
    try {
      if (arModal.action === 'approve') {
        await rbacService.approveAccessRequest(id, note);
        setArSuccess('Approved — the user now has access to the module.');
      } else {
        await rbacService.denyAccessRequest(id, note);
        setArSuccess('Request denied.');
      }
      setArModal(null);
      await loadArRequests(arStatusTab);
      await refreshPending();
    } catch (err) {
      setArError(err?.response?.data?.detail || 'Action failed.');
      setArModal(null);
    }
  }, [arModal, arStatusTab, loadArRequests, refreshPending]);

  // ═══════════════════════════════════════════════════════════════════════
  // ── Render ──────────────────────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Role & Access Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {isSuperAdmin
                ? 'Full control: create and edit roles, manage module permissions, and review access requests.'
                : 'Assign roles to users and review module access requests.'}
            </p>
          </div>
          {mainTab === MAIN_TAB_ROLES && isSuperAdmin && (
            <button onClick={() => { setShowCreate(true); setCreateError(null); setCreateForm(EMPTY_FORM); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Role
            </button>
          )}
        </div>

        {/* Main tabs */}
        <div className="flex gap-1 mt-5 -mb-px">
          {[
            { key: MAIN_TAB_ROLES, label: 'Roles & Permissions' },
            { key: MAIN_TAB_AR,    label: `Access Requests${pendingTotal > 0 ? ` (${pendingTotal} pending)` : ''}` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setMainTab(key)}
              className={`relative px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                mainTab === key
                  ? 'border-blue-600 text-blue-700 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}>
              {label}
              {key === MAIN_TAB_AR && pendingTotal > 0 && mainTab !== MAIN_TAB_AR && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {pendingTotal > 9 ? '9+' : pendingTotal}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notification */}
      {notification.show && (
        <div className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm font-medium ${
          notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>{notification.message}</div>
      )}

      {/* ── TAB: Roles & Permissions ── */}
      {mainTab === MAIN_TAB_ROLES && (
        <div className="flex gap-0" style={{ height: 'calc(100vh - 165px)' }}>

          {/* Left — role list */}
          <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <input type="text" placeholder="Search roles…" value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300" />
              <p className="text-xs text-gray-400 mt-1">{filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loadingRoles ? (
                <div className="py-10 text-center text-sm text-gray-400">Loading roles…</div>
              ) : filteredRoles.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">No roles found.</div>
              ) : filteredRoles.map((role) => (
                <RoleBadge key={role.id} role={role} selected={selectedRole?.id === role.id} onClick={handleSelectRole} />
              ))}
            </div>
          </div>

          {/* Right — role detail */}
          <div className="flex-1 overflow-y-auto">
            {!selectedRole ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-sm">Select a role to view and edit its settings</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-gray-900">{selectedRole.name}</h2>
                      {(() => { const c = getLevelColor(selectedRole.level); return (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>{getLevelLabel(selectedRole.level)}</span>
                      );})()}
                      {SENSITIVE_ROLE_CODES.includes(selectedRole.code) && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">SENSITIVE</span>
                      )}
                      {selectedRole.is_system_role && (
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500 border border-gray-200">System Role</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{selectedRole.description || '—'}</p>
                    <p className="text-xs text-gray-400 mt-1">Code: <code className="bg-gray-100 px-1 rounded">{selectedRole.code}</code></p>
                  </div>
                  {isSuperAdmin && !selectedRole.is_system_role && (
                    <button onClick={() => handleDeleteRole(selectedRole)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded-lg transition-colors">
                      Delete Role
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Module access */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-800 text-sm">Module Access</h3>
                      {!isSuperAdmin
                        ? <span className="text-xs text-gray-400 italic">Read-only</span>
                        : savingModule && <span className="text-xs text-blue-500 animate-pulse">Saving…</span>}
                    </div>
                    {loadingMods ? (
                      <p className="text-xs text-gray-400">Loading modules…</p>
                    ) : modules.length === 0 ? (
                      <p className="text-xs text-gray-400">No modules configured.</p>
                    ) : (
                      <div className="max-h-[520px] overflow-y-auto pr-1">
                        <GroupedModulePanel
                          modules={modules}
                          assignedModuleIds={assignedModuleIds}
                          onToggle={handleModuleToggle}
                          disabled={!isSuperAdmin}
                          saving={savingModule}
                        />
                      </div>
                    )}
                  </div>

                  {/* Users */}
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h3 className="font-semibold text-gray-800 text-sm mb-3">
                      Users with this Role
                      <span className="ml-2 text-xs font-normal text-gray-400">({loadingUsers ? '…' : roleUsers.length})</span>
                    </h3>

                    {canManageRoleUsers && (
                      <div className="mb-3 relative">
                        <div className="relative">
                          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <input type="text" placeholder="Search users to assign…" value={assignSearch}
                            onChange={(e) => setAssignSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300" />
                          {assigning && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-blue-500 animate-pulse">Assigning…</span>}
                        </div>
                        {assignSearch.length >= USER_SEARCH_MIN_CHARS && (
                          <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-200 rounded-lg shadow-xl mt-1 max-h-52 overflow-y-auto">
                            {searchLoading ? <p className="text-xs text-gray-400 px-3 py-3">Searching…</p>
                            : assignResults.length === 0 ? <p className="text-xs text-gray-400 px-3 py-3">No users found or all already have this role.</p>
                            : assignResults.map((u) => {
                              const email = u.user?.email || '—';
                              const name  = [u.user?.first_name, u.user?.last_name].filter(Boolean).join(' ') || email;
                              return (
                                <button key={u.id} onClick={() => handleAssignUser(u)} disabled={assigning}
                                  className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 border-b border-gray-50 last:border-0 disabled:opacity-50">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    <span className="text-white text-xs font-bold">{name.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <div className="min-w-0"><p className="text-xs font-medium text-gray-900 truncate">{name}</p><p className="text-xs text-gray-400 truncate">{email}</p></div>
                                  <svg className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                  </svg>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {isAdmin && !isSuperAdmin && selectedRole?.code === SUPER_ADMIN_ROLE_CODE && (
                      <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Only Super Administrators can manage the Super Admin role.
                      </div>
                    )}

                    {loadingUsers ? <p className="text-xs text-gray-400">Loading users…</p>
                    : roleUsers.length === 0 ? <p className="text-xs text-gray-400">No users hold this role.</p>
                    : (
                      <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {roleUsers.map((u) => {
                          const email = u.user?.email || u.email || '—';
                          const name  = [u.user?.first_name, u.user?.last_name].filter(Boolean).join(' ') || email;
                          return (
                            <li key={u.id} className="flex items-center gap-2 group">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">{name.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-900 truncate">{name}</p>
                                <p className="text-xs text-gray-400 truncate">{email}</p>
                              </div>
                              {canManageRoleUsers && (
                                <button onClick={() => handleRemoveUser(u)} disabled={!!removingId} title="Remove from role"
                                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-all flex-shrink-0 disabled:opacity-30">
                                  {removingId === u.id ? (
                                    <svg className="w-3.5 h-3.5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  )}
                                </button>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Access Requests ── */}
      {mainTab === MAIN_TAB_AR && (
        <div className="p-6">
          {arSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{arSuccess}</div>}
          {arError   && <div className="mb-4 p-3 bg-red-50   border border-red-200   rounded-lg text-red-700   text-sm">{arError}</div>}

          <div className="flex border-b border-gray-200 mb-6">
            {AR_STATUS_FILTERS.map(({ key, label }) => (
              <button key={key} onClick={() => setArStatusTab(key)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  arStatusTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}>
                {label}
                {key === 'pending' && pendingTotal > 0 && arStatusTab !== 'pending' && (
                  <span className="ml-1.5 bg-amber-400 text-white text-xs rounded-full px-1.5 py-0.5">{pendingTotal}</span>
                )}
              </button>
            ))}
          </div>

          {arLoading ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading…</div>
          ) : arRequests.length === 0 ? (
            <div className="text-center text-gray-400 text-sm mt-12">No {arStatusTab || ''} access requests.</div>
          ) : (
            <div className="space-y-3 max-w-4xl">
              {arRequests.map((req) => (
                <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">
                            {(req.user_name || req.user_email || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-800 text-sm">{req.user_name || req.user_email}</p>
                            <ArBadge status={req.status} />
                          </div>
                          <p className="text-xs text-gray-400">{req.user_email}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">
                        Requesting access to{' '}
                        <span className="font-semibold text-blue-700">{req.module_name}</span>{' '}
                        <span className="text-xs text-gray-400">({req.module_code})</span>
                      </p>
                      {req.reason    && <p className="text-xs text-gray-500 mt-1 italic">"{req.reason}"</p>}
                      {req.admin_note && <p className="text-xs text-blue-600 mt-1">Admin note: {req.admin_note}</p>}
                      <p className="text-xs text-gray-400 mt-2">
                        Submitted {new Date(req.created_at).toLocaleString()}
                        {req.reviewed_at && <> · Reviewed {new Date(req.reviewed_at).toLocaleString()}</>}
                        {req.reviewed_by_email && <> by {req.reviewed_by_email}</>}
                      </p>
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex gap-2 shrink-0 items-start pt-1">
                        <button onClick={() => setArModal({ request: req, action: 'approve' })}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700">✓ Approve</button>
                        <button onClick={() => setArModal({ request: req, action: 'deny' })}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600">✕ Deny</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Role Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Role</h2>
            {createError && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{createError}</p>}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Role Name *</label>
                <input type="text" value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Project Engineer"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Code * <span className="text-gray-400 font-normal">(snake_case)</span></label>
                <input type="text" value={createForm.code}
                  onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'_') }))}
                  placeholder="e.g. project_engineer"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Access Level</label>
                <select value={createForm.level}
                  onChange={(e) => setCreateForm((f) => ({ ...f, level: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300">
                  {(isSuperAdmin ? CUSTOM_ROLE_LEVEL_OPTIONS_SUPER : CUSTOM_ROLE_LEVEL_OPTIONS_ADMIN).map((lvl) => (
                    <option key={lvl} value={lvl}>Level {lvl} — {getLevelLabel(lvl)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
                <textarea rows={2} value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What can this role do?"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleCreateRole} disabled={creating}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {creating ? 'Creating…' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve/Deny Modal */}
      {arModal && (
        <ActionModal request={arModal.request} action={arModal.action}
          onClose={() => setArModal(null)} onConfirm={handleArAction} />
      )}
    </div>
  );
}

export default RoleManagement;
