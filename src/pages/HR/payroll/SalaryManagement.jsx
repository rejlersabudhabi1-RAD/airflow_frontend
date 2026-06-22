/**
 * Salary Management — Employee Salary Structures, Component Library & History
 * ============================================================================
 * Tabs: Salary Structures  |  Component Library  |  Salary History
 *
 * Workflow:
 *   HR Manager: create / edit (DRAFT) → submit for approval
 *   Senior HR / Admin: approve or reject
 *
 * All config → hrPayroll.config.js  (SALARY_* constants)
 * All API    → payroll.service.js
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import * as HeroIcons from '@heroicons/react/24/outline'
import payrollService from '../../../services/payroll.service'
import {
  SALARY_COPY,
  SALARY_STATUS,
  SALARY_STRUCTURE_COLUMNS,
  SALARY_HISTORY_COLUMNS,
  SALARY_COMPONENT_CATEGORIES,
  SALARY_SUMMARY_KPIS,
  salaryStatusMeta,
  canApproveSalary,
  fmtCurrency,
} from '../../../config/hrPayroll.config'

// ─────────────────────────────────────────────────────────────────────────────
// Shared micro-components
// ─────────────────────────────────────────────────────────────────────────────
const Spinner = () => (
  <svg className="animate-spin w-5 h-5 text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)

const Toast = ({ msg, type = 'success', onClose }) => {
  if (!msg) return null
  const bg = type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700'
           : type === 'warn'  ? 'bg-amber-50 border-amber-200 text-amber-700'
           : 'bg-emerald-50 border-emerald-200 text-emerald-700'
  return (
    <div className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${bg}`}>
      <span className="flex-1">{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">&times;</button>
    </div>
  )
}

const StatusBadge = ({ status }) => {
  const meta = salaryStatusMeta(status)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.tone}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

const Btn = ({ onClick, disabled, children, variant = 'primary', size = 'sm', className = '' }) => {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const sz   = size === 'xs' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2 text-sm'
  const v    = {
    primary:  'bg-blue-600 text-white hover:bg-blue-700',
    success:  'bg-emerald-600 text-white hover:bg-emerald-700',
    danger:   'bg-rose-600 text-white hover:bg-rose-700',
    ghost:    'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50',
    amber:    'bg-amber-500 text-white hover:bg-amber-600',
  }[variant]
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sz} ${v} ${className}`}>
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI strip
// ─────────────────────────────────────────────────────────────────────────────
function KpiStrip({ structures }) {
  const approved = structures.filter(s => s.status === 'APPROVED' && s.is_active)
  const pending  = structures.filter(s => s.status === 'PENDING_APPROVAL')
  const totalNet = approved.reduce((acc, s) => acc + parseFloat(s.net_salary || 0), 0)
  const avgNet   = approved.length ? totalNet / approved.length : 0

  const kpiValues = {
    total_employees:   approved.length,
    total_payroll:     fmtCurrency(totalNet),
    avg_salary:        fmtCurrency(avgNet),
    pending_approvals: pending.length,
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {SALARY_SUMMARY_KPIS.map(k => {
        const Icon = HeroIcons[k.icon] ?? HeroIcons.BanknotesIcon
        return (
          <div key={k.id} className={`${k.bg} rounded-xl p-4 flex items-center gap-3`}>
            <div className={`p-2 rounded-lg bg-white/70`}>
              <Icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{k.label}</p>
              <p className={`text-lg font-bold ${k.color}`}>{kpiValues[k.id]}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────
const catLabel = (v) => SALARY_COMPONENT_CATEGORIES.find(c => c.value === v)?.label ?? v

// ─────────────────────────────────────────────────────────────────────────────
// Salary Structure drawer (create / view / edit)
// ─────────────────────────────────────────────────────────────────────────────
function StructureDrawer({ item, components, onClose, onSaved, canApprove }) {
  const isNew     = !item?.id
  const readOnly  = item?.status === 'APPROVED'

  const blank = {
    employee_code: '', employee_name: '', department: '',
    effective_date: '', currency: 'AED', basic_salary: '',
    components: [], reviewer_note: '',
  }
  const [form,        setForm]        = useState(isNew ? blank : { ...item })
  const [busy,        setBusy]        = useState(false)
  const [actionBusy,  setActionBusy]  = useState('')
  const [localMsg,    setLocalMsg]    = useState('')

  const net = useMemo(() => {
    let gross = parseFloat(form.basic_salary || 0)
    let ded   = 0
    ;(form.components || []).forEach(c => {
      const amt = parseFloat(c.amount || 0)
      if (c.category === 'deduction') ded   += amt
      else                            gross += amt
    })
    return { gross, ded, net: gross - ded }
  }, [form.basic_salary, form.components])

  const handleField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addComponent = () => {
    setForm(f => ({
      ...f,
      components: [...(f.components || []), { code: '', name: '', category: 'allowance', amount: '' }],
    }))
  }

  const removeComponent = (idx) => {
    setForm(f => ({ ...f, components: f.components.filter((_, i) => i !== idx) }))
  }

  const setComponent = (idx, key, val) => {
    setForm(f => {
      const comps = [...f.components]
      comps[idx] = { ...comps[idx], [key]: val }
      // auto-fill name from master library
      if (key === 'code') {
        const master = components.find(c => c.code === val)
        if (master) comps[idx] = { ...comps[idx], name: master.name, category: master.category }
      }
      return { ...f, components: comps }
    })
  }

  const save = async () => {
    if (!form.employee_code?.trim() || !form.employee_name?.trim() || !form.effective_date) {
      setLocalMsg('Error: Employee Code, Name, and Effective Date are required.')
      return
    }
    setBusy(true)
    try {
      const payload = {
        ...form,
        basic_salary: form.basic_salary === '' ? '0.00' : String(form.basic_salary),
        components: (form.components || []).map(c => ({
          ...c,
          amount: c.amount === '' ? '0.00' : String(c.amount),
        })),
      }
      if (isNew) {
        await payrollService.createSalaryStructure(payload)
        setLocalMsg(SALARY_COPY.successCreate)
      } else {
        await payrollService.updateSalaryStructure(item.id, payload)
        setLocalMsg(SALARY_COPY.successUpdate)
      }
      setTimeout(() => { onSaved(); onClose() }, 800)
    } catch (e) {
      const detail = e?.response?.data
      const msg = typeof detail === 'object'
        ? Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
        : (detail || e?.message || 'Save failed')
      setLocalMsg('Error: ' + msg)
    } finally {
      setBusy(false)
    }
  }

  const doAction = async (action) => {
    setActionBusy(action)
    try {
      if (action === 'submit') {
        await payrollService.submitSalaryStructure(item.id)
        setLocalMsg(SALARY_COPY.successSubmit)
      } else if (action === 'approve') {
        await payrollService.approveSalaryStructure(item.id, { reviewer_note: form.reviewer_note })
        setLocalMsg(SALARY_COPY.successApprove)
      } else if (action === 'reject') {
        await payrollService.rejectSalaryStructure(item.id, { reviewer_note: form.reviewer_note })
        setLocalMsg(SALARY_COPY.successReject)
      }
      setTimeout(() => { onSaved(); onClose() }, 800)
    } catch (e) {
      setLocalMsg('Error: ' + (e?.response?.data?.detail || e?.message || 'Action failed'))
    } finally {
      setActionBusy('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {isNew ? 'New Salary Structure' : `${item.employee_name} (${item.employee_code})`}
            </h3>
            {item?.status && <div className="mt-1"><StatusBadge status={item.status} /></div>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <HeroIcons.XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {localMsg && (
            <Toast
              msg={localMsg}
              type={localMsg.startsWith('Error') ? 'error' : 'success'}
              onClose={() => setLocalMsg('')}
            />
          )}

          {readOnly && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">
              <HeroIcons.InformationCircleIcon className="w-4 h-4 shrink-0" />
              {SALARY_COPY.noteReadOnly}
            </div>
          )}

          {/* Employee info */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'employee_code', label: 'Employee Code' },
              { key: 'employee_name', label: 'Employee Name' },
              { key: 'department',    label: SALARY_COPY.labelDepartment },
              { key: 'effective_date',label: SALARY_COPY.labelEffective, type: 'date' },
            ].map(({ key, label, type = 'text' }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                <input
                  type={type}
                  value={form[key] || ''}
                  onChange={e => handleField(key, e.target.value)}
                  disabled={readOnly}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-50"
                />
              </div>
            ))}
          </div>

          {/* Currency + Basic */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{SALARY_COPY.labelCurrency}</label>
              <select
                value={form.currency || 'AED'}
                onChange={e => handleField('currency', e.target.value)}
                disabled={readOnly}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-50"
              >
                {['AED','USD','EUR','SAR','GBP','INR'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{SALARY_COPY.labelBasic}</label>
              <input
                type="number" min="0" step="0.01"
                value={form.basic_salary || ''}
                onChange={e => handleField('basic_salary', e.target.value)}
                disabled={readOnly}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-50"
              />
            </div>
          </div>

          {/* Salary components */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">{SALARY_COPY.labelComponents}</label>
              {!readOnly && (
                <Btn variant="ghost" size="xs" onClick={addComponent}>
                  <HeroIcons.PlusIcon className="w-3.5 h-3.5" /> Add
                </Btn>
              )}
            </div>
            {(form.components || []).length === 0 && (
              <p className="text-xs text-slate-400 italic py-2">No components added.</p>
            )}
            <div className="space-y-2">
              {(form.components || []).map((c, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-3">
                    <select
                      value={c.code || ''}
                      onChange={e => setComponent(idx, 'code', e.target.value)}
                      disabled={readOnly}
                      className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:bg-slate-50"
                    >
                      <option value="">Select…</option>
                      {components.filter(m => m.is_active).map(m => (
                        <option key={m.code} value={m.code}>{m.code} – {m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-4">
                    <input
                      type="text" placeholder="Name"
                      value={c.name || ''}
                      onChange={e => setComponent(idx, 'name', e.target.value)}
                      disabled={readOnly}
                      className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:bg-slate-50"
                    />
                  </div>
                  <div className="col-span-2">
                    <select
                      value={c.category || 'allowance'}
                      onChange={e => setComponent(idx, 'category', e.target.value)}
                      disabled={readOnly}
                      className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:bg-slate-50"
                    >
                      {SALARY_COMPONENT_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number" min="0" step="0.01" placeholder="Amount"
                      value={c.amount || ''}
                      onChange={e => setComponent(idx, 'amount', e.target.value)}
                      disabled={readOnly}
                      className="w-full border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:bg-slate-50"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center pt-1">
                    {!readOnly && (
                      <button onClick={() => removeComponent(idx)} className="text-rose-400 hover:text-rose-600">
                        <HeroIcons.TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
            {[
              { label: SALARY_COPY.labelGross,      value: fmtCurrency(net.gross), color: 'text-emerald-600' },
              { label: SALARY_COPY.labelDeductions,  value: fmtCurrency(net.ded),   color: 'text-rose-600'    },
              { label: SALARY_COPY.labelNet,         value: fmtCurrency(net.net),   color: 'text-blue-700'    },
            ].map(t => (
              <div key={t.label}>
                <p className="text-xs text-slate-500 mb-1">{t.label}</p>
                <p className={`text-base font-bold ${t.color}`}>{t.value}</p>
              </div>
            ))}
          </div>

          {/* Reviewer note (for approve / reject actions) */}
          {!isNew && ['PENDING_APPROVAL', 'REJECTED'].includes(item?.status) && canApprove && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">{SALARY_COPY.labelReason}</label>
              <textarea
                rows={2}
                value={form.reviewer_note || ''}
                onChange={e => handleField('reviewer_note', e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                placeholder="Optional note…"
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap gap-2 justify-end">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>

          {/* Save draft */}
          {!readOnly && (item?.status === 'DRAFT' || item?.status === 'REJECTED' || isNew) && (
            <Btn variant="primary" onClick={save} disabled={busy}>
              {busy ? <Spinner /> : <HeroIcons.CheckIcon className="w-4 h-4" />}
              Save Draft
            </Btn>
          )}

          {/* Submit for approval */}
          {!isNew && item?.status === 'DRAFT' && (
            <Btn variant="amber" onClick={() => doAction('submit')} disabled={!!actionBusy}>
              {actionBusy === 'submit' ? <Spinner /> : <HeroIcons.PaperAirplaneIcon className="w-4 h-4" />}
              {SALARY_COPY.btnSubmit}
            </Btn>
          )}

          {/* Approve / Reject */}
          {!isNew && item?.status === 'PENDING_APPROVAL' && canApprove && (
            <>
              <Btn variant="danger" onClick={() => doAction('reject')} disabled={!!actionBusy}>
                {actionBusy === 'reject' ? <Spinner /> : <HeroIcons.XMarkIcon className="w-4 h-4" />}
                {SALARY_COPY.btnReject}
              </Btn>
              <Btn variant="success" onClick={() => doAction('approve')} disabled={!!actionBusy}>
                {actionBusy === 'approve' ? <Spinner /> : <HeroIcons.CheckCircleIcon className="w-4 h-4" />}
                {SALARY_COPY.btnApprove}
              </Btn>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Component Library tab
// ─────────────────────────────────────────────────────────────────────────────
function ComponentLibrary({ canEdit }) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(false)
  const [drawer,  setDrawer]  = useState(null)   // null | {} | item
  const [form,    setForm]    = useState({})
  const [busy,    setBusy]    = useState(false)
  const [msg,     setMsg]     = useState('')

  const load = useCallback(() => {
    setLoading(true)
    payrollService.getSalaryComponents().then(r => {
      setItems(Array.isArray(r?.results) ? r.results : (r ?? []))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setForm({ code: '', name: '', category: 'allowance', is_taxable: false, description: '', is_active: true })
    setDrawer('new')
  }

  const openEdit = (item) => {
    setForm({ ...item })
    setDrawer(item)
  }

  const save = async () => {
    setBusy(true)
    try {
      if (drawer === 'new') {
        await payrollService.createSalaryComponent(form)
        setMsg(SALARY_COPY.successComponentSave)
      } else {
        await payrollService.updateSalaryComponent(drawer.id, form)
        setMsg(SALARY_COPY.successComponentSave)
      }
      load()
      setDrawer(null)
    } catch (e) {
      setMsg('Error: ' + (e?.response?.data?.detail || e?.message || 'Save failed'))
    } finally {
      setBusy(false)
    }
  }

  // catLabel is defined at module scope

  return (
    <div>
      {msg && <Toast msg={msg} type={msg.startsWith('Error') ? 'error' : 'success'} onClose={() => setMsg('')} />}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-700">{SALARY_COPY.tabComponents}</h3>
        {canEdit && (
          <Btn variant="primary" onClick={openNew}>
            <HeroIcons.PlusIcon className="w-4 h-4" /> {SALARY_COPY.btnNewComponent}
          </Btn>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center"><Spinner /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">{SALARY_COPY.emptyComponents}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Code','Name','Category','Taxable','Active',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{item.code}</td>
                  <td className="px-4 py-3 text-slate-800">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                      item.category === 'deduction' ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : item.category === 'gross'   ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {catLabel(item.category)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.is_taxable
                      ? <span className="text-amber-600 text-xs font-medium">Yes</span>
                      : <span className="text-slate-400 text-xs">No</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.is_active
                      ? <span className="text-emerald-600 text-xs font-medium">Active</span>
                      : <span className="text-slate-400 text-xs">Inactive</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canEdit && (
                      <button onClick={() => openEdit(item)} className="text-blue-500 hover:text-blue-700 text-xs font-medium">
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Component mini-drawer */}
      {drawer !== null && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/30" onClick={() => setDrawer(null)} />
          <div className="w-96 bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h4 className="font-semibold text-slate-800">
                {drawer === 'new' ? 'New Component' : `Edit: ${drawer.code}`}
              </h4>
              <button onClick={() => setDrawer(null)} className="text-slate-400 hover:text-slate-600">
                <HeroIcons.XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {[
                { key: 'code', label: 'Code (unique)', disabled: drawer !== 'new' },
                { key: 'name', label: 'Name' },
              ].map(({ key, label, disabled }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                  <input
                    type="text" value={form[key] || ''} disabled={disabled}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:bg-slate-50"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                <select
                  value={form.category || 'allowance'}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {SALARY_COMPONENT_CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  rows={2} value={form.description || ''}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-slate-600">Taxable</label>
                <input
                  type="checkbox" checked={!!form.is_taxable}
                  onChange={e => setForm(f => ({ ...f, is_taxable: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-500"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-slate-600">Active</label>
                <input
                  type="checkbox" checked={!!form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded text-emerald-500"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setDrawer(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={save} disabled={busy}>
                {busy ? <Spinner /> : null} Save
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Salary History tab
// ─────────────────────────────────────────────────────────────────────────────
function SalaryHistoryTab() {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(false)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    setLoading(true)
    payrollService.getSalaryHistory().then(r => {
      setItems(Array.isArray(r?.results) ? r.results : (r ?? []))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(h =>
      !q ||
      h.employee_code?.toLowerCase().includes(q) ||
      h.employee_name?.toLowerCase().includes(q)
    )
  }, [items, search])

  const fmtPct = (v) => {
    if (v == null) return '—'
    const n = parseFloat(v)
    const color = n > 0 ? 'text-emerald-600' : n < 0 ? 'text-rose-600' : 'text-slate-500'
    return <span className={`font-medium ${color}`}>{n > 0 ? '+' : ''}{n.toFixed(2)}%</span>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-700">{SALARY_COPY.tabHistory}</h3>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search employee…"
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400 py-8 text-center">{SALARY_COPY.emptyHistory}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {SALARY_HISTORY_COLUMNS.map(c => (
                  <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(h => (
                <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{h.employee_code}</td>
                  <td className="px-4 py-3 text-slate-800 font-medium">{h.employee_name}</td>
                  <td className="px-4 py-3 text-slate-600">{h.change_date}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{h.previous_net != null ? fmtCurrency(h.previous_net) : '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">{fmtCurrency(h.new_net)}</td>
                  <td className="px-4 py-3 text-right">{fmtPct(h.change_percent)}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={h.change_reason}>{h.change_reason || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{h.approved_by_name || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{h.created_at ? new Date(h.created_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
const INNER_TABS = [
  { id: 'structures', label: SALARY_COPY.tabStructures },
  { id: 'components', label: SALARY_COPY.tabComponents },
  { id: 'history',    label: SALARY_COPY.tabHistory    },
]

const STATUS_FILTERS = ['all', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED']

export default function SalaryManagement() {
  const authUser    = useSelector(s => s.auth?.user)
  const rbacProfile = useSelector(s => s.rbac?.currentUser)

  const canApprove = useMemo(() => canApproveSalary(rbacProfile, authUser), [rbacProfile, authUser])

  const [tab,        setTab]        = useState('structures')
  const [structures, setStructures] = useState([])
  const [components, setComponents] = useState([])
  const [loading,    setLoading]    = useState(false)
  const [drawer,     setDrawer]     = useState(null)   // null | {} (new) | item
  const [statusFilter, setStatusFilter] = useState('all')
  const [search,     setSearch]     = useState('')
  const [globalMsg,  setGlobalMsg]  = useState({ text: '', type: 'success' })

  const loadStructures = useCallback(() => {
    setLoading(true)
    payrollService.getSalaryStructures().then(r => {
      setStructures(Array.isArray(r?.results) ? r.results : (r ?? []))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const loadComponents = useCallback(() => {
    payrollService.getSalaryComponents({ active: 'true' }).then(r => {
      setComponents(Array.isArray(r?.results) ? r.results : (r ?? []))
    }).catch(() => {})
  }, [])

  useEffect(() => { loadStructures(); loadComponents() }, [loadStructures, loadComponents])

  const filtered = useMemo(() => {
    let rows = structures
    if (statusFilter !== 'all') rows = rows.filter(s => s.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter(s =>
        s.employee_code?.toLowerCase().includes(q) ||
        s.employee_name?.toLowerCase().includes(q) ||
        s.department?.toLowerCase().includes(q)
      )
    }
    return rows
  }, [structures, statusFilter, search])

  const pendingCount = useMemo(
    () => structures.filter(s => s.status === 'PENDING_APPROVAL').length,
    [structures],
  )

  const handleSaved = () => {
    setGlobalMsg({ text: 'Saved successfully.', type: 'success' })
    loadStructures()
    setTimeout(() => setGlobalMsg({ text: '', type: 'success' }), 3000)
  }

  return (
    <div className="space-y-6 p-1">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <HeroIcons.BanknotesIcon className="w-6 h-6 text-emerald-600" />
            {SALARY_COPY.pageTitle}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">{SALARY_COPY.pageSubtitle}</p>
        </div>
        {tab === 'structures' && (
          <Btn variant="primary" onClick={() => setDrawer({})}>
            <HeroIcons.PlusIcon className="w-4 h-4" /> {SALARY_COPY.btnNew}
          </Btn>
        )}
      </div>

      {/* Global toast */}
      {globalMsg.text && (
        <Toast msg={globalMsg.text} type={globalMsg.type} onClose={() => setGlobalMsg({ text: '', type: 'success' })} />
      )}

      {/* Pending approval banner */}
      {canApprove && pendingCount > 0 && tab === 'structures' && (
        <div
          className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => setStatusFilter('PENDING_APPROVAL')}
        >
          <HeroIcons.ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            {pendingCount} structure{pendingCount !== 1 ? 's' : ''} {SALARY_COPY.pendingBadge}. Click to review.
          </p>
        </div>
      )}

      {/* KPI strip (structures tab only) */}
      {tab === 'structures' && !loading && <KpiStrip structures={structures} />}

      {/* Inner tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {INNER_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            {t.id === 'structures' && pendingCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'structures' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1">
              {STATUS_FILTERS.map(sf => (
                <button
                  key={sf}
                  onClick={() => setStatusFilter(sf)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    statusFilter === sf
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600'
                  }`}
                >
                  {sf === 'all' ? 'All' : (salaryStatusMeta(sf).label)}
                </button>
              ))}
            </div>
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search employee / dept…"
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-300 ml-auto"
            />
          </div>

          {loading ? (
            <div className="py-16 text-center"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <HeroIcons.BanknotesIcon className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">{SALARY_COPY.emptyStructures}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {SALARY_STRUCTURE_COLUMNS.map(c => (
                      <th key={c.key} className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${c.numeric ? 'text-right' : 'text-left'}`}>
                        {c.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{row.employee_code}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{row.employee_name}</td>
                      <td className="px-4 py-3 text-slate-600">{row.department || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{row.effective_date}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{row.currency}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{fmtCurrency(row.basic_salary)}</td>
                      <td className="px-4 py-3 text-right text-emerald-700 font-medium">{fmtCurrency(row.total_gross)}</td>
                      <td className="px-4 py-3 text-right text-rose-600">{fmtCurrency(row.total_deductions)}</td>
                      <td className="px-4 py-3 text-right text-blue-700 font-bold">{fmtCurrency(row.net_salary)}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDrawer(row)}
                          className="text-blue-500 hover:text-blue-700 text-xs font-medium"
                        >
                          {row.status === 'APPROVED' ? 'View' : 'Edit'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'components' && <ComponentLibrary canEdit={true} />}
      {tab === 'history'    && <SalaryHistoryTab />}

      {/* Structure drawer */}
      {drawer !== null && (
        <StructureDrawer
          item={Object.keys(drawer).length === 0 ? null : drawer}
          components={components}
          canApprove={canApprove}
          onClose={() => setDrawer(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
