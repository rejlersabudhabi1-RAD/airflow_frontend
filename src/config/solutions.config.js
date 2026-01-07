/**
 * Solutions Configuration
 * Centralized configuration for all RADAI solutions
 * Soft-coded approach for easy maintenance and scalability
 */

import { 
  CpuChipIcon, 
  DocumentChartBarIcon, 
  CubeIcon,
  CircleStackIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

/**
 * Solution Categories
 */
export const SOLUTION_CATEGORIES = {
  AI_AUTOMATION: {
    id: 'ai-automation',
    title: 'AI & Automation',
    description: 'Intelligent automation powered by advanced AI',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    icon: CpuChipIcon
  },
  DOCUMENT_MANAGEMENT: {
    id: 'document-management',
    title: 'Document Management',
    description: 'Smart document processing and version control',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    icon: DocumentChartBarIcon
  },
  ENGINEERING: {
    id: 'engineering',
    title: 'Engineering Solutions',
    description: 'Advanced engineering design and analysis',
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    icon: CubeIcon
  },
  DATA_ANALYTICS: {
    id: 'data-analytics',
    title: 'Data & Analytics',
    description: 'Powerful insights from your engineering data',
    color: 'from-orange-500 to-red-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    icon: ChartBarIcon
  }
}

/**
 * Individual Solutions
 */
export const SOLUTIONS = [
  // AI & Automation Solutions
  {
    id: 'pfd-digitization',
    category: 'ai-automation',
    title: 'PFD Digitization',
    shortDescription: 'Convert Process Flow Diagrams to digital format using AI',
    fullDescription: 'Automatically digitize and extract information from Process Flow Diagrams (PFDs) using advanced computer vision and machine learning algorithms. Transform legacy drawings into structured, searchable data.',
    icon: DocumentChartBarIcon,
    features: [
      'Automatic equipment detection',
      'Stream identification',
      'Symbol recognition',
      'Data extraction to structured format'
    ],
    benefits: [
      'Save 70% of manual digitization time',
      'Reduce human errors',
      'Create searchable digital libraries',
      'Enable data-driven analysis'
    ],
    useCases: [
      'Legacy drawing digitization',
      'Plant modernization projects',
      'Engineering data migration',
      'Digital twin creation'
    ],
    moduleCode: 'PFD_MODULE',
    link: '/pfd-upload',
    isPremium: false,
    tags: ['AI', 'Computer Vision', 'Automation']
  },
  {
    id: 'pid-engineering',
    category: 'ai-automation',
    title: 'P&ID Engineering',
    shortDescription: 'AI-assisted Piping & Instrumentation Diagram creation',
    fullDescription: 'Create and enhance Piping & Instrumentation Diagrams with AI assistance. Automated equipment placement, intelligent piping connections, and standardized annotations.',
    icon: CubeIcon,
    features: [
      'AI-powered equipment placement',
      'Automatic piping routing',
      'Smart annotation system',
      'Standards compliance checking'
    ],
    benefits: [
      'Accelerate P&ID creation by 60%',
      'Ensure design consistency',
      'Reduce design iterations',
      'Improve collaboration'
    ],
    useCases: [
      'New plant design',
      'PFD to P&ID conversion',
      'Brownfield modifications',
      'As-built documentation'
    ],
    moduleCode: 'PID_MODULE',
    link: '/pid-upload',
    isPremium: true,
    tags: ['AI', 'Engineering', 'Automation']
  },
  
  // Document Management Solutions
  {
    id: 'crs-management',
    category: 'document-management',
    title: 'CRS Document Control',
    shortDescription: 'Comment Response Sheet management with full revision control',
    fullDescription: 'Comprehensive Comment Response Sheet (CRS) management system with version control, tracking, and automated workflows. Streamline your document review and approval process.',
    icon: ClipboardDocumentCheckIcon,
    features: [
      'Multi-revision tracking',
      'Automated status updates',
      'Comment threading',
      'Approval workflows'
    ],
    benefits: [
      'Reduce review cycle time by 50%',
      'Complete audit trail',
      'Improved accountability',
      'Better collaboration'
    ],
    useCases: [
      'Design document reviews',
      'Client comment tracking',
      'Regulatory submissions',
      'Quality assurance processes'
    ],
    moduleCode: 'CRS_MODULE',
    link: '/crs-documents',
    isPremium: false,
    tags: ['Document Control', 'Workflow', 'Compliance']
  },
  {
    id: 'version-control',
    category: 'document-management',
    title: 'Document Version Control',
    shortDescription: 'Advanced version control for engineering documents',
    fullDescription: 'Enterprise-grade document version control system designed for engineering workflows. Track changes, compare versions, and maintain complete document history.',
    icon: ArrowPathIcon,
    features: [
      'Automatic versioning',
      'Visual diff comparison',
      'Rollback capabilities',
      'Change notifications'
    ],
    benefits: [
      'Never lose document history',
      'Easy change tracking',
      'Compliance ready',
      'Team transparency'
    ],
    useCases: [
      'Drawing revisions',
      'Specification updates',
      'Regulatory compliance',
      'Change management'
    ],
    moduleCode: 'DOC_CONTROL',
    link: '/documents',
    isPremium: false,
    tags: ['Version Control', 'Compliance', 'Audit']
  },
  
  // Engineering Solutions
  {
    id: 'project-control',
    category: 'engineering',
    title: 'Project Control',
    shortDescription: 'Comprehensive project management for engineering teams',
    fullDescription: 'Integrated project control system for managing engineering projects from initiation to completion. Track progress, resources, and deliverables in one platform.',
    icon: ChartBarIcon,
    features: [
      'Project planning & scheduling',
      'Resource allocation',
      'Progress tracking',
      'Deliverable management'
    ],
    benefits: [
      'Improve project visibility',
      'Optimize resource utilization',
      'Meet deadlines consistently',
      'Better stakeholder communication'
    ],
    useCases: [
      'Capital projects',
      'Multi-discipline engineering',
      'Client deliverables',
      'Portfolio management'
    ],
    moduleCode: 'PROJECT_MODULE',
    link: '/project-control',
    isPremium: true,
    tags: ['Project Management', 'Planning', 'Resources']
  },
  {
    id: 'data-management',
    category: 'engineering',
    title: 'Engineering Data Hub',
    shortDescription: 'Centralized repository for all engineering data',
    fullDescription: 'Unified platform for storing, managing, and accessing engineering data. Connect drawings, specifications, calculations, and reports in one searchable system.',
    icon: CircleStackIcon,
    features: [
      'Centralized data storage',
      'Advanced search & filtering',
      'Data relationships',
      'API integrations'
    ],
    benefits: [
      'Single source of truth',
      'Faster information retrieval',
      'Reduced data duplication',
      'Better data governance'
    ],
    useCases: [
      'Master data management',
      'Digital asset libraries',
      'Knowledge management',
      'Data migration projects'
    ],
    moduleCode: 'DATA_HUB',
    link: '/data-hub',
    isPremium: true,
    tags: ['Data Management', 'Integration', 'Search']
  },
  
  // Data & Analytics Solutions
  {
    id: 'analytics',
    category: 'data-analytics',
    title: 'Engineering Analytics',
    shortDescription: 'Advanced analytics and insights for engineering data',
    fullDescription: 'Transform your engineering data into actionable insights. Visualize trends, identify patterns, and make data-driven decisions with powerful analytics tools.',
    icon: ChartBarIcon,
    features: [
      'Interactive dashboards',
      'Custom reports',
      'Predictive analytics',
      'Data visualization'
    ],
    benefits: [
      'Data-driven decision making',
      'Identify bottlenecks early',
      'Optimize processes',
      'Predict project outcomes'
    ],
    useCases: [
      'Performance monitoring',
      'Resource optimization',
      'Quality metrics',
      'Cost analysis'
    ],
    moduleCode: 'ANALYTICS',
    link: '/analytics',
    isPremium: true,
    tags: ['Analytics', 'BI', 'Visualization']
  },
  {
    id: 'quality-assurance',
    category: 'data-analytics',
    title: 'Quality Assurance',
    shortDescription: 'Automated quality checks and compliance validation',
    fullDescription: 'Ensure engineering deliverables meet quality standards with automated checks and validation. Reduce errors and maintain compliance with industry regulations.',
    icon: ShieldCheckIcon,
    features: [
      'Automated QA checks',
      'Standards compliance',
      'Error detection',
      'Quality reports'
    ],
    benefits: [
      'Reduce rework by 80%',
      'Ensure compliance',
      'Maintain quality standards',
      'Faster approvals'
    ],
    useCases: [
      'Drawing QA/QC',
      'Specification reviews',
      'Regulatory compliance',
      'Client deliverables'
    ],
    moduleCode: 'QA_MODULE',
    link: '/quality-assurance',
    isPremium: true,
    tags: ['Quality', 'Compliance', 'Validation']
  }
]

/**
 * Solution Statistics
 */
export const SOLUTION_STATS = [
  {
    id: 'time-saved',
    label: 'Time Saved',
    value: '70%',
    description: 'Average time reduction in engineering tasks',
    icon: '⚡'
  },
  {
    id: 'accuracy',
    label: 'Accuracy',
    value: '99.5%',
    description: 'AI accuracy in data extraction',
    icon: '🎯'
  },
  {
    id: 'projects',
    label: 'Projects',
    value: '500+',
    description: 'Successfully completed projects',
    icon: '📊'
  },
  {
    id: 'clients',
    label: 'Clients',
    value: '50+',
    description: 'Global engineering firms trust us',
    icon: '🌍'
  }
]

/**
 * Call to Action Configuration
 */
export const SOLUTIONS_CTA = {
  primary: {
    text: 'Start Free Trial',
    link: '/register',
    description: 'Try RADAI solutions for 30 days, no credit card required'
  },
  secondary: {
    text: 'Schedule Demo',
    link: '/enquiry',
    description: 'See how RADAI can transform your engineering workflow'
  },
  contact: {
    text: 'Contact Sales',
    link: '/contact-support',
    description: 'Speak with our team about custom solutions'
  }
}

/**
 * Helper Functions
 */

/**
 * Get solutions by category
 */
export const getSolutionsByCategory = (categoryId) => {
  return SOLUTIONS.filter(solution => solution.category === categoryId)
}

/**
 * Get solution by ID
 */
export const getSolutionById = (solutionId) => {
  return SOLUTIONS.find(solution => solution.id === solutionId)
}

/**
 * Get all categories with their solutions
 */
export const getCategoriesWithSolutions = () => {
  return Object.values(SOLUTION_CATEGORIES).map(category => ({
    ...category,
    solutions: getSolutionsByCategory(category.id)
  }))
}

/**
 * Get premium solutions
 */
export const getPremiumSolutions = () => {
  return SOLUTIONS.filter(solution => solution.isPremium)
}

/**
 * Get free solutions
 */
export const getFreeSolutions = () => {
  return SOLUTIONS.filter(solution => !solution.isPremium)
}

/**
 * Search solutions
 */
export const searchSolutions = (query) => {
  const lowerQuery = query.toLowerCase()
  return SOLUTIONS.filter(solution => 
    solution.title.toLowerCase().includes(lowerQuery) ||
    solution.shortDescription.toLowerCase().includes(lowerQuery) ||
    solution.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

export default {
  SOLUTION_CATEGORIES,
  SOLUTIONS,
  SOLUTION_STATS,
  SOLUTIONS_CTA,
  getSolutionsByCategory,
  getSolutionById,
  getCategoriesWithSolutions,
  getPremiumSolutions,
  getFreeSolutions,
  searchSolutions
}
