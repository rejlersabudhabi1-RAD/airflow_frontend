import React, { useEffect, useState } from 'react'
import * as HeroIcons from '@heroicons/react/24/outline'
import payrollEngineService, { downloadBlob } from '../../../../services/payrollEngine.service'
import { formatCurrency, FIXED_EARNING_FIELDS } from '../../../../config/payrollEngine.config'

export default function PayslipDetailModal({ slip: initialSlip, runEditable, onClose, onChanged }) {
  // Local mirror of the payslip so basic/housing/transport/home_leave/totals
  // re-render the moment a PATCH succeeds without waiting for the parent reload.
  const [slip, setSlip] = useState(initialSlip)
  const [items, setItems] = useState(initialSlip.line_items || [])
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [savingField, setSavingField] = useState(null)

  useEffect(() => {
    setSlip(initialSlip)
    setItems(initialSlip.line_items || [])
  }, [initialSlip])

  const refresh = async () => {
    try {
      const fresh = await payrollEngineService.getPayslip(slip.id)
      setSlip(fresh)
      setItems(fresh.line_items || [])
      onChanged?.()
    } catch (e) { setError(e?.response?.data?.error || e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this line item?')) return
    setBusy(true); setError(null)
    try {
      await payrollEngineService.deleteLineItem(id)
      await refresh()
    } catch (e) { setError(e?.response?.data?.error || e.message) }
    finally { setBusy(false) }
  }

  const handleSave = async (item) => {
    setBusy(true); setError(null)
    try {
      if (item.id) {
        await payrollEngineService.updateLineItem(item.id, item)
      } else {
        await payrollEngineService.createLineItem({ ...item, payslip: slip.id })
      }
      setEditing(null)
      await refresh()
    } catch (e) { setError(e?.response?.data?.error || e.message) }
    finally { setBusy(false) }
  }

  const handleFixedEarningChange = async (field, rawValue) => {
    const value = rawValue === '' || rawValue == null ? 0 : Number(rawValue)
    if (Number.isNaN(value) || value < 0) {
      setError(`${field} must be a non-negative number.`)
      return
    }
    if (Number(slip[field] ?? 0) === value) return
    setSavingField(field); setError(null)
    try {
      const updated = await payrollEngineService.updatePayslip(slip.id, { [field]: value })
      setSlip(updated)
      setItems(updated.line_items || items)
      onChanged?.()
    } catch (e) {
      setError(e?.response?.data?.error || e.message)
      await refresh()
    } finally {
      setSavingField(null)
    }
  }

  const handleDownload = async () => {
    try {
      const blob = await payrollEngineService.downloadPayslipXlsx(slip.id)
      downloadBlob(blob, `payslip_${slip.employee_no}_${slip.run_cycle}.xlsx`)
    } catch (e) { setError(e?.response?.data?.error || e.message) }
  }

  const earnings = items.filter(i => i.kind === 'earning')
  const deductions = items.filter(i => i.kind === 'deduction')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full my-8">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">{slip.snapshot_full_name}</h3>
            <p className="text-xs text-slate-500">
              Emp #{slip.employee_no} · {slip.snapshot_department} · {slip.run_cycle}
              {!runEditable && (
                <span className="ml-2 inline-block px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-500 border border-slate-300">
                  Read-only — run is {slip.run_status}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 hover:bg-slate-50"
            >
              <HeroIcons.ArrowDownTrayIcon className="w-4 h-4" /> Download
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-md"
            >
              <HeroIcons.XMarkIcon className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-5">
          {/* Fixed earnings — inline editable when run is in Draft */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {FIXED_EARNING_FIELDS.map(({ key, label }) => (
              <FixedEarningTile
                key={key}
                fieldKey={key}
                label={label}
                value={slip[key]}
                editable={runEditable}
                saving={savingField === key}
                onCommit={(val) => handleFixedEarningChange(key, val)}
              />
            ))}
          </div>

          {/* Earnings */}
          <Section
            title="Other Earnings"
            items={earnings}
            kind="earning"
            editable={runEditable}
            onEdit={setEditing}
            onDelete={handleDelete}
            onAdd={() => setEditing({ kind: 'earning', label: '', description: '', amount: 0 })}
          />

          {/* Deductions */}
          <Section
            title="Deductions"
            items={deductions}
            kind="deduction"
            editable={runEditable}
            onEdit={setEditing}
            onDelete={handleDelete}
            onAdd={() => setEditing({ kind: 'deduction', label: '', description: '', amount: 0 })}
          />

          {/* Totals */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="text-[10px] uppercase text-slate-500">Gross Earnings</div>
              <div className="text-base font-semibold tabular-nums">{formatCurrency(slip.gross_earnings)}</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <div className="text-[10px] uppercase text-slate-500">Total Deductions</div>
              <div className="text-base font-semibold tabular-nums">{formatCurrency(slip.total_deductions)}</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="text-[10px] uppercase text-emerald-700">Net Payable</div>
              <div className="text-base font-semibold tabular-nums text-emerald-800">{formatCurrency(slip.net_payable)}</div>
            </div>
          </div>

          {error && (
            <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {editing && (
          <LineItemEditor
            item={editing}
            onSave={handleSave}
            onCancel={() => setEditing(null)}
            busy={busy}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Inline-editable tile for a fixed earning column on the Payslip model.
 * Saves on blur or Enter; resets on Escape; shows a tiny spinner while busy.
 */
function FixedEarningTile({ fieldKey, label, value, editable, saving, onCommit }) {
  const initial = value == null ? '0' : String(value)
  const [draft, setDraft] = useState(initial)

  useEffect(() => { setDraft(initial) }, [initial])

  if (!editable) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
        <div className="text-[10px] uppercase text-slate-500">{label}</div>
        <div className="text-sm font-semibold tabular-nums">
          {formatCurrency(value, { withSymbol: false })}
        </div>
      </div>
    )
  }

  const commit = () => onCommit(draft)

  return (
    <div className="bg-white border border-slate-300 rounded-lg p-2.5 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-200">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase text-slate-500">{label}</span>
        {saving && (
          <HeroIcons.ArrowPathIcon className="w-3 h-3 text-indigo-500 animate-spin" />
        )}
      </div>
      <input
        type="number"
        step="0.01"
        min="0"
        value={draft}
        disabled={saving}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur() }
          if (e.key === 'Escape') { setDraft(initial); e.currentTarget.blur() }
        }}
        className="mt-0.5 w-full text-sm font-semibold tabular-nums bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
      />
    </div>
  )
}

function Section({ title, items, editable, onEdit, onDelete, onAdd }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <h4 className="text-xs font-semibold text-slate-600 uppercase">{title}</h4>
        {editable && (
          <button
            type="button"
            onClick={onAdd}
            className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            <HeroIcons.PlusCircleIcon className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No {title.toLowerCase()}.</p>
      ) : (
        <table className="w-full text-xs">
          <tbody className="divide-y divide-slate-100">
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-slate-50">
                <td className="px-2 py-1.5 w-40 font-medium">{it.label}</td>
                <td className="px-2 py-1.5 text-slate-500">{it.description || '—'}</td>
                <td className="px-2 py-1.5 text-right tabular-nums w-32">{formatCurrency(it.amount, { withSymbol: false })}</td>
                {editable && (
                  <td className="px-2 py-1.5 text-right w-20">
                    <button onClick={() => onEdit(it)} className="text-slate-400 hover:text-blue-600 mr-1">
                      <HeroIcons.PencilSquareIcon className="w-3.5 h-3.5 inline" />
                    </button>
                    <button onClick={() => onDelete(it.id)} className="text-slate-400 hover:text-red-600">
                      <HeroIcons.TrashIcon className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function LineItemEditor({ item, onSave, onCancel, busy }) {
  const [form, setForm] = useState({
    kind: item.kind,
    component_code: item.component_code || (item.kind === 'earning' ? 'other_earning' : 'other_deduction'),
    label: item.label || '',
    description: item.description || '',
    amount: item.amount || '0',
    id: item.id,
  })
  return (
    <div className="border-t border-slate-200 p-5 bg-slate-50">
      <h4 className="text-sm font-semibold mb-2.5">
        {item.id ? 'Edit' : 'Add'} {item.kind === 'earning' ? 'Earning' : 'Deduction'}
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-600 mb-1">Label</label>
          <input
            type="text"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="w-full text-sm border border-slate-300 rounded-md px-2 py-1.5"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Amount (AED)</label>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full text-sm border border-slate-300 rounded-md px-2 py-1.5 tabular-nums"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs text-slate-600 mb-1">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full text-sm border border-slate-300 rounded-md px-2 py-1.5"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={onCancel}
          disabled={busy}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={busy}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
