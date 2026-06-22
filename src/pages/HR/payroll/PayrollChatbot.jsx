/**
 * Payroll AI Assistant — rule-based chatbot
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import * as HeroIcons from '@heroicons/react/24/outline'
import payrollService from '../../../services/payroll.service'
import timesheetService from '../../../services/timesheet.service'
import {
  PAYROLL_CHATBOT_PATTERNS, PAYROLL_COPY,
} from '../../../config/hrPayroll.config'

// Simple ID generator — avoids uuid dependency
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36)

// Soft-coded persona options
const PERSONAS = [
  { id: 'employee', label: 'Employee' },
  { id: 'manager',  label: 'Manager' },
  { id: 'finance',  label: 'Finance' },
  { id: 'hr',       label: 'HR' },
]

// Rule-based intent matcher — finds the best matching pattern
const matchIntent = (text, persona) => {
  const t = text.toLowerCase()
  for (const pattern of PAYROLL_CHATBOT_PATTERNS) {
    // Check persona restriction
    if (pattern.persona && !pattern.persona.includes(persona)) continue
    if (pattern.keywords.some((kw) => t.includes(kw))) return pattern
  }
  return null
}

// Fallback response for unrecognised inputs
const FALLBACK = 'I\'m sorry, I didn\'t understand that. Try asking about your payslip, overtime, salary deductions, or leave balance.'

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
          AI
        </div>
      )}
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
        isUser ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
      }`}>
        {msg.content}
      </div>
    </div>
  )
}

export default function PayrollChatbot() {
  const [sessionId]            = useState(() => uid())
  const [persona,   setPersona] = useState('employee')
  const [messages,  setMessages] = useState([])
  const [input,     setInput]   = useState('')
  const [loading,   setLoading] = useState(false)
  const [ctxData,   setCtxData] = useState(null)
  const bottomRef               = useRef(null)

  // Current user's biometric employee code from RBAC Redux store
  const rbacUser      = useSelector((s) => s.rbac?.currentUser)
  const employeeCode  = rbacUser?.employee_id || null

  // Welcome message
  useEffect(() => {
    setMessages([{ id: uid(), role: 'assistant', content: PAYROLL_COPY.chatWelcome }])
  }, [])

  // Scroll to bottom on new message
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Pre-load context data for rule engine
  useEffect(() => {
    const now   = new Date()
    const year  = now.getFullYear()
    const month = now.getMonth() + 1

    // Build slip params — filter by current user's employee code when known
    const slipParams = { page_size: 1, ordering: '-created_at' }
    if (employeeCode) slipParams.employee_id = employeeCode

    Promise.allSettled([
      payrollService.getDashboardSummary(),
      payrollService.getSalarySlips(slipParams),
      // Per-user timesheet history for accurate overtime calculation
      employeeCode
        ? timesheetService.fetchUserHistory({ employee_code: employeeCode, year, month })
        : Promise.resolve(null),
      // Live leave record for the current user
      employeeCode
        ? payrollService.getLeaveRecords({ employee_code: employeeCode, year, page_size: 1 })
        : Promise.resolve(null),
    ]).then(([sum, slips, ts, leave]) => {
      const tsPayload  = ts.value
      const leaveList  = leave.value?.results ?? leave.value ?? []
      setCtxData({
        summary:     sum.value ?? null,
        latestSlip:  (slips.value?.results ?? slips.value ?? [])[0] ?? null,
        userTs:      tsPayload?.summary ?? null,   // per-user timesheet summary
        leaveRecord: leaveList[0] ?? null,         // first leave record for the year
      })
    })
  }, [employeeCode]) // re-load when user identity resolves

  const send = useCallback(async (text) => {
    if (!text.trim() || loading) return
    const userMsg = { id: uid(), role: 'user', content: text.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Persist user message
      payrollService.saveChatMessage({
        session_id: sessionId,
        role: 'user',
        content: text.trim(),
        persona,
      }).catch(() => {})

      // Match intent
      const pattern = matchIntent(text, persona)
      const reply   = pattern
        ? pattern.respond(ctxData)
        : FALLBACK

      const assistantMsg = { id: uid(), role: 'assistant', content: reply }
      setMessages((prev) => [...prev, assistantMsg])

      // Persist assistant message
      payrollService.saveChatMessage({
        session_id: sessionId,
        role: 'assistant',
        content: reply,
        intent: pattern?.intent ?? '',
        persona,
      }).catch(() => {})
    } finally {
      setLoading(false)
    }
  }, [loading, ctxData, sessionId, persona])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
  }

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeroIcons.ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
          <span className="text-sm font-semibold">Payroll AI Assistant</span>
          <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">Rule-based · No LLM</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="opacity-70">Persona:</span>
          <div className="flex gap-1">
            {PERSONAS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPersona(p.id)}
                className={`px-2 py-0.5 rounded-full transition ${persona === p.id ? 'bg-white text-blue-700 font-semibold' : 'text-white/80 hover:bg-white/20'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        {messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs ml-10 mb-3">
            <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick action chips */}
      <div className="px-4 py-2 bg-white border-t border-slate-100 flex flex-wrap gap-1.5">
        {PAYROLL_CHATBOT_PATTERNS
          .filter((p) => !p.persona || p.persona.includes(persona))
          .map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => send(p.quickLabel)}
              disabled={loading}
              className="text-xs px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-full transition border border-slate-200 hover:border-blue-200"
            >
              {p.quickLabel}
            </button>
          ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your salary, overtime, leave…"
          disabled={loading}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white text-sm font-medium rounded-xl transition"
        >
          <HeroIcons.PaperAirplaneIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
