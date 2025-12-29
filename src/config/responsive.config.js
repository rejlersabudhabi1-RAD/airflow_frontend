/**
 * Responsive Design Configuration
 * Centralized breakpoints and responsive utilities for all devices
 * Follows mobile-first approach with Tailwind CSS
 */

// Breakpoint Configuration
export const BREAKPOINTS = {
  xs: '320px',   // Extra small devices (small phones)
  sm: '640px',   // Small devices (phones)
  md: '768px',   // Medium devices (tablets)
  lg: '1024px',  // Large devices (laptops)
  xl: '1280px',  // Extra large devices (desktops)
  '2xl': '1536px' // 2X Extra large devices (large desktops)
}

// Container Configuration
export const CONTAINER = {
  padding: {
    xs: 'px-4',    // 16px
    sm: 'px-6',    // 24px
    md: 'px-8',    // 32px
    lg: 'px-12',   // 48px
    xl: 'px-16',   // 64px
  },
  maxWidth: {
    xs: 'max-w-full',
    sm: 'max-w-screen-sm',
    md: 'max-w-screen-md',
    lg: 'max-w-screen-lg',
    xl: 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
  }
}

// Typography Responsive Sizing
export const TYPOGRAPHY = {
  heading: {
    h1: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl',
    h2: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
    h3: 'text-lg sm:text-xl md:text-2xl lg:text-3xl',
    h4: 'text-base sm:text-lg md:text-xl lg:text-2xl',
    h5: 'text-sm sm:text-base md:text-lg lg:text-xl',
    h6: 'text-xs sm:text-sm md:text-base lg:text-lg',
  },
  body: {
    large: 'text-base sm:text-lg md:text-xl',
    normal: 'text-sm sm:text-base md:text-lg',
    small: 'text-xs sm:text-sm md:text-base',
    tiny: 'text-xs sm:text-xs md:text-sm',
  }
}

// Spacing Configuration
export const SPACING = {
  section: {
    y: 'py-6 sm:py-8 md:py-12 lg:py-16',
    x: 'px-4 sm:px-6 md:px-8 lg:px-12',
  },
  card: {
    padding: 'p-4 sm:p-5 md:p-6 lg:p-8',
    gap: 'gap-4 sm:gap-5 md:gap-6',
  },
  grid: {
    gap: 'gap-3 sm:gap-4 md:gap-5 lg:gap-6',
  }
}

// Grid Layout Configuration
export const GRID = {
  dashboard: {
    stats: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    modules: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    files: 'grid-cols-1',
    activities: 'grid-cols-1',
  },
  twoColumn: 'grid-cols-1 md:grid-cols-2',
  threeColumn: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  fourColumn: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}

// Login Page Responsive Configuration
export const LOGIN_RESPONSIVE = {
  container: 'h-screen sm:min-h-screen flex flex-col lg:flex-row overflow-hidden',
  branding: {
    wrapper: 'hidden lg:flex lg:w-1/2',
    padding: 'p-6 sm:p-8 md:p-10 lg:p-12',
    title: 'text-3xl sm:text-4xl md:text-5xl',
    subtitle: 'text-base sm:text-lg md:text-xl',
  },
  form: {
    wrapper: 'w-full lg:w-1/2 flex items-center justify-center',
    container: 'px-3 sm:px-6 md:px-8 lg:px-12 py-2 sm:py-0',
    maxWidth: 'max-w-md',
    title: 'text-xl sm:text-2xl md:text-3xl',
    input: 'py-2 sm:py-3 md:py-3.5',
    button: 'py-2 sm:py-3 md:py-4',
  }
}

// Dashboard Responsive Configuration
export const DASHBOARD_RESPONSIVE = {
  container: 'min-h-screen p-3 sm:p-4 md:p-6',
  header: {
    wrapper: 'p-4 sm:p-6 md:p-8',
    flexDirection: 'flex-col sm:flex-row',
    spacing: 'space-y-4 sm:space-y-0 sm:space-x-6',
    iconSize: 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16',
    title: 'text-2xl sm:text-3xl md:text-4xl',
  },
  stats: {
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    card: 'p-4 sm:p-5 md:p-6',
    value: 'text-2xl sm:text-3xl',
  },
  tabs: {
    wrapper: 'overflow-x-auto',
    nav: 'flex space-x-4 sm:space-x-8 px-4 sm:px-6',
    button: 'py-3 sm:py-4 whitespace-nowrap',
  },
  content: {
    padding: 'p-4 sm:p-5 md:p-6',
  }
}

// Button Sizes
export const BUTTON = {
  sizes: {
    sm: 'px-3 py-2 text-xs sm:text-sm',
    md: 'px-4 py-2.5 text-sm sm:text-base',
    lg: 'px-5 py-3 text-base sm:text-lg',
    xl: 'px-6 py-3.5 text-lg sm:text-xl',
  },
  iconSizes: {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  }
}

// Icon Sizes
export const ICON = {
  xs: 'w-3 h-3 sm:w-4 sm:h-4',
  sm: 'w-4 h-4 sm:w-5 sm:h-5',
  md: 'w-5 h-5 sm:w-6 sm:h-6',
  lg: 'w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8',
  xl: 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12',
  '2xl': 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16',
}

// Utility Functions
export const getResponsiveClass = (baseClass, breakpoints = {}) => {
  let classes = baseClass
  Object.entries(breakpoints).forEach(([breakpoint, value]) => {
    classes += ` ${breakpoint}:${value}`
  })
  return classes
}

// Form Page Responsive Configuration
export const FORM_RESPONSIVE = {
  container: 'min-h-screen py-6 sm:py-8 md:py-10 px-4 sm:px-6 lg:px-8',
  card: {
    maxWidth: 'max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl',
    padding: 'p-5 sm:p-6 md:p-8',
  },
  title: 'text-2xl sm:text-3xl md:text-4xl',
  section: {
    spacing: 'space-y-4 sm:space-y-5 md:space-y-6',
    grid: 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6',
  },
  input: {
    base: 'px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base',
    label: 'text-xs sm:text-sm',
  },
  button: {
    primary: 'px-5 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base',
    secondary: 'px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm',
  }
}

// Table Responsive Configuration
export const TABLE_RESPONSIVE = {
  wrapper: 'overflow-x-auto -mx-4 sm:mx-0',
  container: 'inline-block min-w-full align-middle',
  table: 'min-w-full divide-y divide-gray-200',
  header: {
    cell: 'px-3 sm:px-4 md:px-6 py-3 text-xs sm:text-sm',
  },
  body: {
    cell: 'px-3 sm:px-4 md:px-6 py-3 sm:py-4 text-xs sm:text-sm',
  },
  actions: {
    wrapper: 'flex flex-col sm:flex-row gap-2',
    button: 'px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm',
  }
}

// Admin Page Responsive Configuration
export const ADMIN_RESPONSIVE = {
  container: 'min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8',
  header: {
    wrapper: 'mb-6 sm:mb-8',
    title: 'text-3xl sm:text-4xl md:text-5xl',
    actions: 'flex flex-col sm:flex-row gap-3 sm:gap-4',
  },
  filters: {
    wrapper: 'flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6',
    input: 'w-full sm:w-auto',
    select: 'w-full sm:w-40 md:w-48',
  },
  tabs: {
    wrapper: 'overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0',
    container: 'flex space-x-2 sm:space-x-4 border-b',
    button: 'px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 text-sm sm:text-base whitespace-nowrap',
  },
  stats: {
    grid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6',
    card: 'p-4 sm:p-5 md:p-6',
    value: 'text-2xl sm:text-3xl md:text-4xl',
    label: 'text-xs sm:text-sm',
  }
}

// Upload Page Responsive Configuration
export const UPLOAD_RESPONSIVE = {
  container: 'min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8',
  card: {
    maxWidth: 'max-w-2xl sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl',
    padding: 'p-5 sm:p-6 md:p-8',
  },
  dropzone: {
    wrapper: 'border-2 border-dashed rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-12',
    icon: 'w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20',
    title: 'text-base sm:text-lg md:text-xl',
    subtitle: 'text-xs sm:text-sm md:text-base',
  },
  metadata: {
    grid: 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5',
  },
  progress: {
    wrapper: 'space-y-3 sm:space-y-4',
    bar: 'h-2 sm:h-3',
    label: 'text-xs sm:text-sm',
  }
}

// Report Page Responsive Configuration
export const REPORT_RESPONSIVE = {
  container: 'min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8',
  layout: {
    sidebar: 'w-full lg:w-64 xl:w-72',
    content: 'flex-1 min-w-0',
  },
  header: {
    wrapper: 'mb-6 sm:mb-8',
    title: 'text-2xl sm:text-3xl md:text-4xl',
    meta: 'flex flex-col sm:flex-row gap-2 sm:gap-4',
    badge: 'px-2 sm:px-3 py-1 text-xs sm:text-sm',
  },
  filters: {
    wrapper: 'flex flex-col sm:flex-row gap-3 mb-6',
    button: 'px-3 sm:px-4 py-2 text-xs sm:text-sm',
  },
  issues: {
    card: 'p-4 sm:p-5 md:p-6',
    title: 'text-sm sm:text-base md:text-lg',
    description: 'text-xs sm:text-sm',
  }
}

// Export all configurations
export default {
  BREAKPOINTS,
  CONTAINER,
  TYPOGRAPHY,
  SPACING,
  GRID,
  LOGIN_RESPONSIVE,
  DASHBOARD_RESPONSIVE,
  FORM_RESPONSIVE,
  TABLE_RESPONSIVE,
  ADMIN_RESPONSIVE,
  UPLOAD_RESPONSIVE,
  REPORT_RESPONSIVE,
  BUTTON,
  ICON,
  getResponsiveClass,
}
