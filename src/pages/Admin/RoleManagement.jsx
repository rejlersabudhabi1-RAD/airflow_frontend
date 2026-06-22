/**
 * Role Management Page — /admin/roles
 *
 * Displays all system and custom roles as cards.  Selecting a card opens a
 * detail panel showing the role's module assignments and users who hold it.
 * Super Administrators can:
 *   • Toggle module assignments on any role
 *   • Create new custom roles
 *   • Delete non-system custom roles
 * All thresholds, labels, and UI copy are soft-coded in the constants section.
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import rbacService from '../../services/rbac.service';
import { isUserAdmin } from '../../utils/rbac.utils';

// ── Soft-coded constants ─────────────────────────────────────────────────────
const ROLE_LEVEL_COLORS = {
  1: { bg: 'bg-red-100',    text: 'text-red-800',    ring: 'ring-red-300',    dot: 'bg-red-500'    },
  2: { bg: 'bg-orange-100', text: 'text-orange-800', ring: 'ring-orange-300', dot: 'bg-orange-500' },
  3: { bg: 'bg-yellow-100', text: 'text-yellow-800', ring: 'ring-yellow-300', dot: 'bg-yellow-500' },
  4: { bg: 'bg-blue-100',   text: 'text-blue-800',   ring: 'ring-blue-300',   dot: 'bg-blue-500'   },
  5: { bg: 'bg-teal-100',   text: 'text-teal-800',   ring: 'ring-teal-300',   dot: 'bg-teal-500'   },
  6: { bg: 'bg-slate-100',  text: 'text-slate-700',  ring: 'ring-slate-300',  dot: 'bg-slate-400'  },
};
const DEFAULT_LEVEL_COLOR = { bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-300', dot: 'bg-gray-400' };

const ROLE_LEVEL_LABELS = {
  1: 'Super Admin', 2: 'Admin', 3: 'Manager',
  4: 'Engineer',    5: 'Reviewer', 6: 'Viewer',
};

// Sensitive role codes — shown with amber shield
const SENSITIVE_ROLE_CODES = ['hr_admin'];

// These module codes are also flagged as sensitive
const SENSITIVE_MODULE_CODES = ['hr_management', 'payroll', 'timesheet'];

// Custom-role level choices (system level 1 is excluded — only Django super-users)
const CUSTOM_ROLE_LEVEL_OPTIONS = [2, 3, 4, 5, 6];

const EMPTY_FORM = { name: '', code: '', level: 3, description: '' };

// ────────────────────────────────────────────────────────────────────────────

function getLevelColor(level) {
  return ROLE_LEVEL_COLORS[level] || DEFAULT_LEVEL_COLOR;
}

function getLevelLabel(level) {
  return ROLE_LEVEL_LABELS[level] || `Level ${level}`;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function RoleBadge({ role, selected, onClick }) {
  const c = getLevelColor(role.level);
  const sensitive = SENSITIVE_ROLE_CODES.includes(role.code);
  return (
    <button
      onClick={() => onClick(role)}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
        selected
          ? `border-blue-500 shadow-md ring-2 ring-blue-200 ${c.bg}`
          : `border-gray-200 hover:border-blue-200 bg-white`
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
            <span className="font-semibold text-sm text-gray-900 truncate">{role.name}</span>
            {sensitive && (
              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
                SENSITIVE
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{role.description || '—'}</p>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.bg} ${c.text}`}>
            {getLevelLabel(role.level)}
          </span>
          <span className="text-xs text-gray-400">{role.user_count ?? 0} users</span>
          {role.is_system_role && (
            <span className="text-xs text-gray-400 italic">System</span>
          )}
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
      <input
        type="checkbox"
        checked={enabled}
        disabled={disabled}
        onChange={(e) => onChange(module, e.target.checked)}
        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
      />
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

// ── Main component ───────────────────────────────────────────────────────────

function RoleManagement() {
  const { currentUser } = useSelector((state) => state.rbac);
  const { user: authUser }  = useSelector((state) => state.auth);

  // ── Super-admin check ──────────────────────────────────────────────────
  const isSuperAdmin = useMemo(() => {
    const hasSuperRole = currentUser?.roles?.some(
      (r) => ['super_admin', 'superadmin'].includes(r.code)
    );
    const isDjangoSuperuser = authUser?.is_superuser === true || authUser?.user?.is_superuser === true;
    return hasSuperRole || isDjangoSuperuser;
  }, [currentUser, authUser]);

  // ── Data state ─────────────────────────────────────────────────────────
  const [roles, setRoles]     = useState([]);
  const [modules, setModules] = useState([]);
  const [roleUsers, setRoleUsers] = useState([]);
  const [loadingRoles,   setLoadingRoles]   = useState(true);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingUsers,   setLoadingUsers]   = useState(false);

  // ── UI state ───────────────────────────────────────────────────────────
  const [selectedRole,  setSelectedRole]  = useState(null);
  const [searchTerm,    setSearchTerm]    = useState('');
  const [savingModule,  setSavingModule]  = useState(false);
  const [notification,  setNotification]  = useState({ show: false, type: '', message: '' });

  // ── Create Role modal state ────────────────────────────────────────────
  const [showCreate,  setShowCreate]  = useState(false);
  const [creating,    setCreating]    = useState(false);
  const [createForm,  setCreateForm]  = useState(EMPTY_FORM);
  const [createError, setCreateError] = useState(null);

  // ── Notify helper ──────────────────────────────────────────────────────
  const notify = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    const t = setTimeout(() => setNotification({ show: false, type: '', message: '' }), 4000);
    return () => clearTimeout(t);
  }, []);

  // ── Load roles & modules ───────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoadingRoles(true);
        const data = await rbacService.getRoles();
        setRoles(Array.isArray(data) ? data : data?.results ?? []);
      } catch {
        notify('error', 'Failed to load roles.');
      } finally {
        setLoadingRoles(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoadingModules(true);
        const data = await rbacService.getModules();
        setModules(Array.isArray(data) ? data : data?.results ?? []);
      } catch {
        notify('error', 'Failed to load modules.');
      } finally {
        setLoadingModules(false);
      }
    })();
  }, []);

  // ── Load users for selected role ───────────────────────────────────────
  const loadRoleUsers = useCallback(async (roleCode) => {
    if (!roleCode) return;
    try {
      setLoadingUsers(true);
      const data = await rbacService.getUsers({ role: roleCode });
      const list = Array.isArray(data) ? data : data?.results ?? [];
      setRoleUsers(list);
    } catch {
      setRoleUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const handleSelectRole = useCallback((role) => {
    setSelectedRole(role);
    loadRoleUsers(role.code);
  }, [loadRoleUsers]);

  // ── Module toggle ──────────────────────────────────────────────────────
  const handleModuleToggle = useCallback(async (module, checked) => {
    if (!isSuperAdmin || !selectedRole) return;
    setSavingModule(true);
    try {
      if (checked) {
        await rbacService.assignModuleToRole(selectedRole.id, module.id);
      } else {
        // Use generic updateRole PATCH with modules array minus this module
        const currentModuleIds = (selectedRole.modules || [])
          .filter((m) => m.id !== module.id)
          .map((m) => m.id);
        await rbacService.updateRole(selectedRole.id, { modules: currentModuleIds });
      }
      // Refresh roles to get updated module list
      const data = await rbacService.getRoles();
      const updated = Array.isArray(data) ? data : data?.results ?? [];
      setRoles(updated);
      const refreshed = updated.find((r) => r.id === selectedRole.id);
      if (refreshed) setSelectedRole(refreshed);
      notify('success', `Module ${checked ? 'assigned to' : 'removed from'} ${selectedRole.name}.`);
    } catch (err) {
      notify('error', err?.response?.data?.detail || 'Failed to update module.');
    } finally {
      setSavingModule(false);
    }
  }, [isSuperAdmin, selectedRole, notify]);

  // ── Create role ────────────────────────────────────────────────────────
  const handleCreateRole = useCallback(async () => {
    if (!createForm.name.trim() || !createForm.code.trim()) {
      setCreateError('Name and Code are required.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const newRole = await rbacService.createRole({
        name:         createForm.name.trim(),
        code:         createForm.code.trim().toLowerCase().replace(/\s+/g, '_'),
        level:        createForm.level,
        description:  createForm.description.trim(),
        is_system_role: false,
        is_active:    true,
      });
      setRoles((prev) => [...prev, newRole]);
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      notify('success', `Role "${newRole.name}" created successfully.`);
    } catch (err) {
      const msg = err?.response?.data?.detail
        || Object.values(err?.response?.data || {}).flat().join(' ')
        || 'Failed to create role.';
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  }, [createForm, notify]);

  // ── Delete custom role ─────────────────────────────────────────────────
  const handleDeleteRole = useCallback(async (role) => {
    if (role.is_system_role) return;
    if (!window.confirm(`Delete role "${role.name}"? This will revoke it from all users.`)) return;
    try {
      await rbacService.deleteRole(role.id);
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      if (selectedRole?.id === role.id) setSelectedRole(null);
      notify('success', `Role "${role.name}" deleted.`);
    } catch (err) {
      notify('error', err?.response?.data?.detail || 'Failed to delete role.');
    }
  }, [selectedRole, notify]);

  // ── Filtered roles ─────────────────────────────────────────────────────
  const filteredRoles = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return roles;
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.code.toLowerCase().includes(term) ||
        (r.description || '').toLowerCase().includes(term)
    );
  }, [roles, searchTerm]);

  // Modules assigned to selected role
  const assignedModuleIds = useMemo(
    () => new Set((selectedRole?.modules || []).map((m) => m.id)),
    [selectedRole]
  );

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Define access levels and assign modules to roles. Sensitive roles are restricted to Super Administrators.
            </p>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => { setShowCreate(true); setCreateError(null); setCreateForm(EMPTY_FORM); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Role
            </button>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification.show && (
        <div className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm font-medium ${
          notification.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="flex gap-0 h-[calc(100vh-120px)]">
        {/* ── Left panel: role cards ── */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search roles…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <p className="text-xs text-gray-400 mt-1">{filteredRoles.length} role{filteredRoles.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loadingRoles ? (
              <div className="py-10 text-center text-sm text-gray-400">Loading roles…</div>
            ) : filteredRoles.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-400">No roles found.</div>
            ) : (
              filteredRoles.map((role) => (
                <RoleBadge
                  key={role.id}
                  role={role}
                  selected={selectedRole?.id === role.id}
                  onClick={handleSelectRole}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Right panel: role detail ── */}
        <div className="flex-1 overflow-y-auto">
          {!selectedRole ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <svg className="w-16 h-16 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-sm">Select a role to view details</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Role header */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-bold text-gray-900">{selectedRole.name}</h2>
                    {(() => {
                      const c = getLevelColor(selectedRole.level);
                      return (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
                          {getLevelLabel(selectedRole.level)}
                        </span>
                      );
                    })()}
                    {SENSITIVE_ROLE_CODES.includes(selectedRole.code) && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        SENSITIVE
                      </span>
                    )}
                    {selectedRole.is_system_role && (
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-500 border border-gray-200">
                        System Role
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{selectedRole.description || '—'}</p>
                  <p className="text-xs text-gray-400 mt-1">Code: <code className="bg-gray-100 px-1 rounded">{selectedRole.code}</code></p>
                </div>
                <div className="flex gap-2">
                  {isSuperAdmin && !selectedRole.is_system_role && (
                    <button
                      onClick={() => handleDeleteRole(selectedRole)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
                    >
                      Delete Role
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Module assignments */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 text-sm">Module Access</h3>
                    {!isSuperAdmin && (
                      <span className="text-xs text-gray-400 italic flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Read-only
                      </span>
                    )}
                    {savingModule && <span className="text-xs text-blue-500 animate-pulse">Saving…</span>}
                  </div>
                  {loadingModules ? (
                    <p className="text-xs text-gray-400">Loading modules…</p>
                  ) : modules.length === 0 ? (
                    <p className="text-xs text-gray-400">No modules configured.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                      {modules.map((mod) => (
                        <ModuleToggle
                          key={mod.id}
                          module={mod}
                          enabled={assignedModuleIds.has(mod.id)}
                          onChange={handleModuleToggle}
                          disabled={!isSuperAdmin || savingModule}
                          isSensitive={SENSITIVE_MODULE_CODES.includes(mod.code)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Users with this role */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-800 text-sm mb-3">
                    Users with this Role
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      ({loadingUsers ? '…' : roleUsers.length})
                    </span>
                  </h3>
                  {loadingUsers ? (
                    <p className="text-xs text-gray-400">Loading users…</p>
                  ) : roleUsers.length === 0 ? (
                    <p className="text-xs text-gray-400">No users currently hold this role.</p>
                  ) : (
                    <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {roleUsers.map((u) => {
                        const email = u.user?.email || u.email || '—';
                        const name = [u.user?.first_name, u.user?.last_name].filter(Boolean).join(' ') || email;
                        const initials = name.charAt(0).toUpperCase();
                        return (
                          <li key={u.id} className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">{initials}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-gray-900 truncate">{name}</p>
                              <p className="text-xs text-gray-400 truncate">{email}</p>
                            </div>
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

      {/* ── Create Role Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Role</h2>
            {createError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{createError}</p>
            )}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Role Name *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Project Engineer"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Code * <span className="text-gray-400 font-normal">(snake_case)</span></label>
                <input
                  type="text"
                  value={createForm.code}
                  onChange={(e) => setCreateForm((f) => ({ ...f, code: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') }))}
                  placeholder="e.g. project_engineer"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Access Level</label>
                <select
                  value={createForm.level}
                  onChange={(e) => setCreateForm((f) => ({ ...f, level: Number(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {CUSTOM_ROLE_LEVEL_OPTIONS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Level {lvl} — {getLevelLabel(lvl)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
                <textarea
                  rows={2}
                  value={createForm.description}
                  onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="What can this role do?"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={creating}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating…' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleManagement;
