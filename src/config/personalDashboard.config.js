/**
 * Personal Dashboard Configuration
 * Soft-coded role layouts, widget visibility, colours, and module-to-icon mapping.
 */

// Polling & timing
export const PERSONAL_DASHBOARD_CONFIG = {
  pollIntervalMs:   60000,
  insightPollMs:    0,
  staggerMs:        60,
  fadeInMs:         480,
  shimmerMs:        1800,
  skeletonRows:     3,
}

// Role-specific layout switches
export const ROLE_LAYOUTS = {
  administrator: {
    greeting:            'Administrator Dashboard',
    showTeamSnapshot:    false,
    showPendingActions:  true,
    showUsageChart:      true,
    showActivityFeed:    true,
    kpiColorScheme:      'blue',
  },
  manager: {
    greeting:            'Manager Dashboard',
    showTeamSnapshot:    true,
    showPendingActions:  true,
    showUsageChart:      true,
    showActivityFeed:    true,
    kpiColorScheme:      'indigo',
  },
  engineer: {
    greeting:            'Engineering Dashboard',
    showTeamSnapshot:    false,
    showPendingActions:  false,
    showUsageChart:      true,
    showActivityFeed:    true,
    kpiColorScheme:      'cyan',
  },
  reviewer: {
    greeting:            'Reviewer Dashboard',
    showTeamSnapshot:    false,
    showPendingActions:  true,
    showUsageChart:      false,
    showActivityFeed:    true,
    kpiColorScheme:      'amber',
  },
  viewer: {
    greeting:            'My Dashboard',
    showTeamSnapshot:    false,
    showPendingActions:  false,
    showUsageChart:      false,
    showActivityFeed:    true,
    kpiColorScheme:      'slate',
  },
  default: {
    greeting:            'My Dashboard',
    showTeamSnapshot:    false,
    showPendingActions:  false,
    showUsageChart:      true,
    showActivityFeed:    true,
    kpiColorScheme:      'blue',
  },
}

// Insight type visual styles
export const INSIGHT_STYLES = {
  tip:         { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'   },
  achievement: { bg: 'bg-green-50',  border: 'border-green-200',  badge: 'bg-green-100 text-green-700', dot: 'bg-green-500'  },
  alert:       { bg: 'bg-amber-50',  border: 'border-amber-200',  badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500'  },
  suggestion:  { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
}

// Module to icon + route mapping
export const MODULE_META = {
  pid_analysis:          { icon: 'x1F52C', label: 'P&ID QC',           route: '/engineering/process/pid-quality-checker' },
  pfd_to_pid:            { icon: 'x1F4D0', label: 'PFD Digitisation',   route: '/pfd-upload' },
  electrical_datasheet:  { icon: 'x26A1', label: 'Electrical',         route: '/engineering/electrical/datasheets' },
  instrument_datasheet:  { icon: 'x1F39B', label: 'Instrument',         route: '/engineering/instrument' },
  mechanical_datasheet:  { icon: 'x2699', label: 'Mechanical',         route: '/engineering/mechanical' },
  crs_documents:         { icon: 'x1F4CB', label: 'CRS',                route: '/crs' },
  project_control:       { icon: 'x1F4CA', label: 'Projects',           route: '/project-control' },
  qhse:                  { icon: 'x1F6E1', label: 'QHSE',               route: '/qhse' },
  finance:               { icon: 'x1F4B0', label: 'Finance',            route: '/finance' },
  procurement:           { icon: 'x1F3ED', label: 'Procurement',        route: '/procurement' },
  sales:                 { icon: 'x1F4C8', label: 'Sales',              route: '/sales' },
  human_resource:        { icon: 'x1F465', label: 'HR',                 route: '/hr' },
  designiq:              { icon: 'x1F9E0', label: 'DesignIQ',           route: '/designiq' },
  process_datasheet:     { icon: 'x1F527', label: 'Process Datasheet',  route: '/process-datasheet' },
  pid_verification:      { icon: 'x2705', label: 'P&ID Verify',        route: '/engineering/process/pid-verification' },
  timesheet:             { icon: 'x23F1', label: 'Timesheet',          route: '/timesheet' },
}

// KPI colour palettes
export const KPI_COLORS = {
  blue:    { card: 'bg-blue-500',    text: 'text-white', sub: 'text-blue-100'   },
  indigo:  { card: 'bg-indigo-500',  text: 'text-white', sub: 'text-indigo-100' },
  cyan:    { card: 'bg-cyan-500',    text: 'text-white', sub: 'text-cyan-100'   },
  amber:   { card: 'bg-amber-500',   text: 'text-white', sub: 'text-amber-100'  },
  emerald: { card: 'bg-emerald-500', text: 'text-white', sub: 'text-emerald-100'},
  slate:   { card: 'bg-slate-500',   text: 'text-white', sub: 'text-slate-100'  },
}

// Activity type to icon + colour
export const ACTIVITY_META = {
  user_login:          { icon: 'x1F513', label: 'Logged in',          color: 'text-green-600'  },
  document_uploaded:   { icon: 'x1F4E4', label: 'Uploaded document',  color: 'text-blue-600'   },
  ai_analysis:         { icon: 'x1F916', label: 'AI Analysis',        color: 'text-purple-600' },
  user_created:        { icon: 'x1F464', label: 'User created',       color: 'text-indigo-600' },
  permission_changed:  { icon: 'x1F512', label: 'Permission changed', color: 'text-amber-600'  },
  api_call:            { icon: 'x1F50C', label: 'API call',           color: 'text-cyan-600'   },
  default:             { icon: 'x1F4CC', label: 'Activity',           color: 'text-slate-600'  },
}

// Welcome hero gradients per role
export const ROLE_GRADIENTS = {
  administrator: 'from-blue-600 via-blue-700 to-indigo-800',
  manager:       'from-indigo-600 via-purple-600 to-purple-800',
  engineer:      'from-cyan-600 via-teal-600 to-blue-700',
  reviewer:      'from-amber-500 via-orange-500 to-red-600',
  viewer:        'from-slate-600 via-slate-700 to-gray-800',
  default:       'from-blue-600 via-indigo-600 to-purple-700',
}