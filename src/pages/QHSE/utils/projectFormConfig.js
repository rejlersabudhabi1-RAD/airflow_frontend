/**
 * Project Form Configuration
 * Soft-coded form fields for creating/updating QHSE projects
 * All fields, validations, and options are configurable
 */

// Field Types
export const FIELD_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  EMAIL: 'email',
  DATE: 'date',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  TEXTAREA: 'textarea',
  CURRENCY: 'currency',
  PERCENTAGE: 'percentage',
  CHECKBOX: 'checkbox',
  FILE: 'file'
};

// Project Status Options
export const PROJECT_STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning', color: '#6b7280' },
  { value: 'active', label: 'Active', color: '#3b82f6' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'ongoing', label: 'Ongoing', color: '#10b981' },
  { value: 'on_hold', label: 'On Hold', color: '#f59e0b' },
  { value: 'completed', label: 'Completed', color: '#10b981' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' }
];

// Priority Options
export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#6b7280' },
  { value: 'medium', label: 'Medium', color: '#3b82f6' },
  { value: 'high', label: 'High', color: '#f59e0b' },
  { value: 'critical', label: 'Critical', color: '#ef4444' }
];

// Project Type Options
export const PROJECT_TYPE_OPTIONS = [
  { value: 'construction', label: 'Construction' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'research', label: 'Research & Development' },
  { value: 'other', label: 'Other' }
];

// Department Options
export const DEPARTMENT_OPTIONS = [
  { value: 'qhse', label: 'QHSE' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'operations', label: 'Operations' },
  { value: 'finance', label: 'Finance' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'it', label: 'Information Technology' }
];

// Location/Region Options
export const LOCATION_OPTIONS = [
  { value: 'uae', label: 'United Arab Emirates' },
  { value: 'saudi_arabia', label: 'Saudi Arabia' },
  { value: 'qatar', label: 'Qatar' },
  { value: 'kuwait', label: 'Kuwait' },
  { value: 'oman', label: 'Oman' },
  { value: 'bahrain', label: 'Bahrain' },
  { value: 'other', label: 'Other' }
];

/**
 * Main Project Form Configuration
 * Organized into sections for better UX
 */
export const PROJECT_FORM_CONFIG = {
  sections: [
    {
      id: 'basic_info',
      title: 'Basic Information',
      description: 'Essential project details and identification',
      fields: [
        {
          name: 'project_number',
          label: 'Project Number',
          type: FIELD_TYPES.TEXT,
          placeholder: 'e.g., PRJ-2026-001',
          required: true,
          validation: {
            pattern: /^[A-Z0-9-]+$/,
            message: 'Project number must contain only uppercase letters, numbers, and hyphens'
          },
          helpText: 'Unique identifier for the project'
        },
        {
          name: 'project_name',
          label: 'Project Name',
          type: FIELD_TYPES.TEXT,
          placeholder: 'Enter project name',
          required: true,
          validation: {
            minLength: 3,
            maxLength: 200,
            message: 'Project name must be between 3 and 200 characters'
          }
        },
        {
          name: 'project_title',
          label: 'Project Title',
          type: FIELD_TYPES.TEXT,
          placeholder: 'Official project title',
          required: false,
          helpText: 'Official title as per contract documents'
        },
        {
          name: 'description',
          label: 'Project Description',
          type: FIELD_TYPES.TEXTAREA,
          placeholder: 'Describe the project scope, objectives, and deliverables...',
          required: false,
          rows: 4,
          validation: {
            maxLength: 2000
          }
        },
        {
          name: 'project_type',
          label: 'Project Type',
          type: FIELD_TYPES.SELECT,
          options: PROJECT_TYPE_OPTIONS,
          required: true,
          defaultValue: 'engineering'
        },
        {
          name: 'status',
          label: 'Project Status',
          type: FIELD_TYPES.SELECT,
          options: PROJECT_STATUS_OPTIONS,
          required: true,
          defaultValue: 'planning'
        },
        {
          name: 'priority',
          label: 'Priority Level',
          type: FIELD_TYPES.SELECT,
          options: PRIORITY_OPTIONS,
          required: true,
          defaultValue: 'medium'
        }
      ]
    },
    {
      id: 'client_info',
      title: 'Client & Stakeholder Information',
      description: 'Client details and key stakeholders',
      fields: [
        {
          name: 'client_name',
          label: 'Client Name',
          type: FIELD_TYPES.TEXT,
          placeholder: 'Enter client/company name',
          required: true
        },
        {
          name: 'client_contact',
          label: 'Client Contact Person',
          type: FIELD_TYPES.TEXT,
          placeholder: 'Contact person name',
          required: false
        },
        {
          name: 'client_email',
          label: 'Client Email',
          type: FIELD_TYPES.EMAIL,
          placeholder: 'client@example.com',
          required: false,
          validation: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address'
          }
        },
        {
          name: 'client_phone',
          label: 'Client Phone',
          type: FIELD_TYPES.TEXT,
          placeholder: '+971 XX XXX XXXX',
          required: false
        },
        {
          name: 'project_manager',
          label: 'Project Manager',
          type: FIELD_TYPES.TEXT,
          placeholder: 'Assigned project manager',
          required: true
        },
        {
          name: 'qhse_engineer',
          label: 'QHSE Engineer',
          type: FIELD_TYPES.TEXT,
          placeholder: 'Assigned QHSE engineer',
          required: false
        },
        {
          name: 'department',
          label: 'Department',
          type: FIELD_TYPES.SELECT,
          options: DEPARTMENT_OPTIONS,
          required: false,
          defaultValue: 'qhse'
        }
      ]
    },
    {
      id: 'schedule',
      title: 'Schedule & Timeline',
      description: 'Project dates and duration',
      fields: [
        {
          name: 'start_date',
          label: 'Project Start Date',
          type: FIELD_TYPES.DATE,
          required: true,
          validation: {
            message: 'Start date is required'
          }
        },
        {
          name: 'planned_end_date',
          label: 'Planned End Date',
          type: FIELD_TYPES.DATE,
          required: true,
          validation: {
            afterField: 'start_date',
            message: 'End date must be after start date'
          }
        },
        {
          name: 'actual_end_date',
          label: 'Actual End Date',
          type: FIELD_TYPES.DATE,
          required: false,
          helpText: 'Fill this when project is completed'
        },
        {
          name: 'duration_days',
          label: 'Duration (Days)',
          type: FIELD_TYPES.NUMBER,
          placeholder: '0',
          required: false,
          readOnly: true,
          computed: true,
          helpText: 'Auto-calculated from start and end dates'
        }
      ]
    },
    {
      id: 'budget_resources',
      title: 'Budget & Resources',
      description: 'Financial and resource allocation',
      fields: [
        {
          name: 'budget',
          label: 'Total Budget',
          type: FIELD_TYPES.CURRENCY,
          placeholder: '0.00',
          required: false,
          currency: 'AED',
          validation: {
            min: 0,
            message: 'Budget must be a positive number'
          }
        },
        {
          name: 'spent_amount',
          label: 'Amount Spent',
          type: FIELD_TYPES.CURRENCY,
          placeholder: '0.00',
          required: false,
          currency: 'AED',
          validation: {
            min: 0,
            message: 'Spent amount must be a positive number'
          }
        },
        {
          name: 'estimated_manhours',
          label: 'Estimated Manhours',
          type: FIELD_TYPES.NUMBER,
          placeholder: '0',
          required: false,
          validation: {
            min: 0,
            message: 'Manhours must be a positive number'
          }
        },
        {
          name: 'manhours_spent',
          label: 'Manhours Spent',
          type: FIELD_TYPES.NUMBER,
          placeholder: '0',
          required: false,
          validation: {
            min: 0,
            message: 'Manhours must be a positive number'
          }
        },
        {
          name: 'team_size',
          label: 'Team Size',
          type: FIELD_TYPES.NUMBER,
          placeholder: '0',
          required: false,
          validation: {
            min: 1,
            max: 1000,
            message: 'Team size must be between 1 and 1000'
          }
        }
      ]
    },
    {
      id: 'progress_kpi',
      title: 'Progress & Performance',
      description: 'Project progress and KPI metrics',
      fields: [
        {
          name: 'completion_percentage',
          label: 'Completion Percentage',
          type: FIELD_TYPES.PERCENTAGE,
          placeholder: '0',
          required: false,
          validation: {
            min: 0,
            max: 100,
            message: 'Completion must be between 0 and 100'
          },
          helpText: 'Current project completion status'
        },
        {
          name: 'overall_kpi',
          label: 'Overall KPI Score',
          type: FIELD_TYPES.PERCENTAGE,
          placeholder: '0',
          required: false,
          validation: {
            min: 0,
            max: 100,
            message: 'KPI must be between 0 and 100'
          },
          helpText: 'Overall Key Performance Indicator'
        },
        {
          name: 'kpi_performance',
          label: 'KPI Performance',
          type: FIELD_TYPES.PERCENTAGE,
          placeholder: '0',
          required: false,
          validation: {
            min: 0,
            max: 100
          }
        },
        {
          name: 'quality_score',
          label: 'Quality Score',
          type: FIELD_TYPES.PERCENTAGE,
          placeholder: '0',
          required: false,
          validation: {
            min: 0,
            max: 100
          }
        },
        {
          name: 'safety_score',
          label: 'Safety Score',
          type: FIELD_TYPES.PERCENTAGE,
          placeholder: '0',
          required: false,
          validation: {
            min: 0,
            max: 100
          }
        },
        {
          name: 'environmental_score',
          label: 'Environmental Score',
          type: FIELD_TYPES.PERCENTAGE,
          placeholder: '0',
          required: false,
          validation: {
            min: 0,
            max: 100
          }
        }
      ]
    },
    {
      id: 'qhse_metrics',
      title: 'QHSE Metrics',
      description: 'Quality, Health, Safety, and Environmental metrics',
      fields: [
        {
          name: 'total_issues',
          label: 'Total Issues',
          type: FIELD_TYPES.NUMBER,
          placeholder: '0',
          required: false,
          defaultValue: 0,
          validation: {
            min: 0
          }
        },
        {
          name: 'open_issues',
          label: 'Open Issues',
          type: FIELD_TYPES.NUMBER,
          placeholder: '0',
          required: false,
          defaultValue: 0,
          validation: {
            min: 0
          }
        },
        {
          name: 'resolved_issues',
          label: 'Resolved Issues',
          type: FIELD_TYPES.NUMBER,
          placeholder: '0',
          required: false,
          defaultValue: 0,
          validation: {
            min: 0
          }
        },
        {
          name: 'incidents',
          label: 'Safety Incidents',
          type: FIELD_TYPES.NUMBER,
          placeholder: '0',
          required: false,
          defaultValue: 0,
          validation: {
            min: 0
          }
        },
        {
          name: 'near_misses',
          label: 'Near Miss Events',
          type: FIELD_TYPES.NUMBER,
          placeholder: '0',
          required: false,
          defaultValue: 0,
          validation: {
            min: 0
          }
        },
        {
          name: 'audits_completed',
          label: 'Audits Completed',
          type: FIELD_TYPES.NUMBER,
          placeholder: '0',
          required: false,
          defaultValue: 0,
          validation: {
            min: 0
          }
        },
        {
          name: 'non_conformances',
          label: 'Non-Conformances',
          type: FIELD_TYPES.NUMBER,
          placeholder: '0',
          required: false,
          defaultValue: 0,
          validation: {
            min: 0
          }
        }
      ]
    },
    {
      id: 'location_additional',
      title: 'Location & Additional Information',
      description: 'Project location and other details',
      fields: [
        {
          name: 'location',
          label: 'Project Location',
          type: FIELD_TYPES.SELECT,
          options: LOCATION_OPTIONS,
          required: false
        },
        {
          name: 'site_address',
          label: 'Site Address',
          type: FIELD_TYPES.TEXTAREA,
          placeholder: 'Enter complete site address',
          required: false,
          rows: 3
        },
        {
          name: 'contract_number',
          label: 'Contract Number',
          type: FIELD_TYPES.TEXT,
          placeholder: 'Contract reference number',
          required: false
        },
        {
          name: 'po_number',
          label: 'PO Number',
          type: FIELD_TYPES.TEXT,
          placeholder: 'Purchase order number',
          required: false
        },
        {
          name: 'is_billable',
          label: 'Is Billable',
          type: FIELD_TYPES.CHECKBOX,
          required: false,
          defaultValue: true,
          helpText: 'Check if project is billable to client'
        },
        {
          name: 'notes',
          label: 'Additional Notes',
          type: FIELD_TYPES.TEXTAREA,
          placeholder: 'Any additional information or notes...',
          required: false,
          rows: 4
        }
      ]
    }
  ]
};

/**
 * Field validation helper
 */
export const validateField = (field, value, formData) => {
  if (field.required && (!value || value === '')) {
    return field.validation?.message || `${field.label} is required`;
  }

  if (field.validation) {
    const { validation } = field;

    // Pattern validation
    if (validation.pattern && value && !validation.pattern.test(value)) {
      return validation.message;
    }

    // Length validation
    if (validation.minLength && value && value.length < validation.minLength) {
      return `${field.label} must be at least ${validation.minLength} characters`;
    }
    if (validation.maxLength && value && value.length > validation.maxLength) {
      return `${field.label} must not exceed ${validation.maxLength} characters`;
    }

    // Number range validation
    if (validation.min !== undefined && value < validation.min) {
      return validation.message || `${field.label} must be at least ${validation.min}`;
    }
    if (validation.max !== undefined && value > validation.max) {
      return validation.message || `${field.label} must not exceed ${validation.max}`;
    }

    // Date validation
    if (validation.afterField && formData[validation.afterField]) {
      const afterDate = new Date(formData[validation.afterField]);
      const currentDate = new Date(value);
      if (currentDate <= afterDate) {
        return validation.message;
      }
    }
  }

  return null;
};

/**
 * Calculate computed fields
 */
export const calculateComputedFields = (formData) => {
  const computed = {};

  // Calculate duration in days
  if (formData.start_date && formData.planned_end_date) {
    const start = new Date(formData.start_date);
    const end = new Date(formData.planned_end_date);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    computed.duration_days = diff > 0 ? diff : 0;
  }

  return computed;
};

/**
 * Transform form data for API submission
 */
export const transformFormDataForAPI = (formData) => {
  // Convert percentage values
  const transformed = { ...formData };
  
  // Ensure numeric fields are numbers
  const numericFields = [
    'budget', 'spent_amount', 'estimated_manhours', 'manhours_spent',
    'team_size', 'completion_percentage', 'overall_kpi', 'kpi_performance',
    'quality_score', 'safety_score', 'environmental_score',
    'total_issues', 'open_issues', 'resolved_issues', 'incidents',
    'near_misses', 'audits_completed', 'non_conformances', 'duration_days'
  ];

  numericFields.forEach(field => {
    if (transformed[field] !== undefined && transformed[field] !== null && transformed[field] !== '') {
      transformed[field] = parseFloat(transformed[field]) || 0;
    }
  });

  // Convert checkbox to boolean
  if (transformed.is_billable !== undefined) {
    transformed.is_billable = Boolean(transformed.is_billable);
  }

  return transformed;
};
