/**
 * Datasheet Disciplines Configuration
 * Centralized configuration for different engineering disciplines' datasheet modules
 * Enables consistent behavior and easy expansion across all disciplines
 */

/**
 * Discipline-specific datasheet configurations
 * Each discipline has its own API endpoints and specific settings
 */
export const DATASHEET_DISCIPLINES = {
  process: {
    id: 'process',
    name: 'Process',
    fullName: 'Process Engineering Datasheets',
    apiBaseUrl: '/process-datasheet',
    routes: {
      base: '/engineering/process/datasheet',
      dashboard: '/engineering/process/datasheet/dashboard',
      upload: '/engineering/process/datasheet/upload',
      view: '/engineering/process/datasheet/view/:id'
    },
    colors: {
      primary: 'blue',
      gradient: 'from-blue-50 to-indigo-50',
      hover: 'from-blue-100 to-indigo-100',
      button: 'bg-indigo-600 hover:bg-indigo-700',
      text: 'text-indigo-600',
      border: 'border-indigo-200 hover:border-indigo-400'
    },
    fileTypes: {
      accept: '.pdf,application/pdf',
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ['application/pdf'],
      description: 'PDF files only'
    },
    features: {
      aiExtraction: true,
      validation: true,
      export: true
    }
  },

  electrical: {
    id: 'electrical',
    name: 'Electrical',
    fullName: 'Electrical Engineering Datasheets',
    apiBaseUrl: '/electrical-datasheet',
    routes: {
      base: '/engineering/electrical/datasheet',
      dashboard: '/engineering/electrical/datasheet/dashboard',
      upload: '/engineering/electrical/datasheet/upload',
      view: '/engineering/electrical/datasheet/view/:id'
    },
    colors: {
      primary: 'yellow',
      gradient: 'from-yellow-50 to-amber-50',
      hover: 'from-yellow-100 to-amber-100',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      text: 'text-yellow-600',
      border: 'border-yellow-200 hover:border-yellow-400'
    },
    fileTypes: {
      accept: '.pdf,image/png,image/jpeg,image/jpg,application/pdf',
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
      description: 'PDF or image files (PNG, JPG, JPEG)'
    },
    features: {
      aiExtraction: true,
      validation: true,
      diagramAnalysis: true,
      export: true
    }
  },

  piping: {
    id: 'piping',
    name: 'Piping',
    fullName: 'Piping Engineering Datasheets',
    apiBaseUrl: '/piping-datasheet',
    routes: {
      base: '/engineering/piping/datasheet',
      dashboard: '/engineering/piping/datasheet/dashboard',
      upload: '/engineering/piping/datasheet/upload',
      view: '/engineering/piping/datasheet/view/:id'
    },
    colors: {
      primary: 'orange',
      gradient: 'from-orange-50 to-amber-50',
      hover: 'from-orange-100 to-amber-100',
      button: 'bg-orange-600 hover:bg-orange-700',
      text: 'text-orange-600',
      border: 'border-orange-200 hover:border-orange-400'
    },
    fileTypes: {
      accept: '.pdf,application/pdf',
      maxSize: 50 * 1024 * 1024,
      allowedTypes: ['application/pdf'],
      description: 'PDF files only'
    },
    features: {
      aiExtraction: true,
      validation: true,
      export: true
    }
  },

  instrument: {
    id: 'instrument',
    name: 'Instrument',
    fullName: 'Instrumentation Datasheets',
    apiBaseUrl: '/instrument-datasheet',
    routes: {
      base: '/engineering/instrument/datasheet',
      dashboard: '/engineering/instrument/datasheet/dashboard',
      upload: '/engineering/instrument/datasheet/upload',
      view: '/engineering/instrument/datasheet/view/:id'
    },
    colors: {
      primary: 'purple',
      gradient: 'from-purple-50 to-indigo-50',
      hover: 'from-purple-100 to-indigo-100',
      button: 'bg-purple-600 hover:bg-purple-700',
      text: 'text-purple-600',
      border: 'border-purple-200 hover:border-purple-400'
    },
    fileTypes: {
      accept: '.pdf,application/pdf',
      maxSize: 50 * 1024 * 1024,
      allowedTypes: ['application/pdf'],
      description: 'PDF files only'
    },
    features: {
      aiExtraction: true,
      validation: true,
      export: true
    }
  },

  mechanical: {
    id: 'mechanical',
    name: 'Mechanical',
    fullName: 'Mechanical Engineering Datasheets',
    apiBaseUrl: '/mechanical-datasheet',
    routes: {
      base: '/engineering/mechanical/datasheet',
      dashboard: '/engineering/mechanical/datasheet/dashboard',
      upload: '/engineering/mechanical/datasheet/upload',
      view: '/engineering/mechanical/datasheet/view/:id'
    },
    colors: {
      primary: 'indigo',
      gradient: 'from-indigo-50 to-blue-50',
      hover: 'from-indigo-100 to-blue-100',
      button: 'bg-indigo-600 hover:bg-indigo-700',
      text: 'text-indigo-600',
      border: 'border-indigo-200 hover:border-indigo-400'
    },
    fileTypes: {
      accept: '.pdf,application/pdf',
      maxSize: 50 * 1024 * 1024,
      allowedTypes: ['application/pdf'],
      description: 'PDF files only'
    },
    features: {
      aiExtraction: true,
      validation: true,
      export: true
    }
  },

  civil: {
    id: 'civil',
    name: 'Civil',
    fullName: 'Civil Engineering Datasheets',
    apiBaseUrl: '/civil-datasheet',
    routes: {
      base: '/engineering/civil/datasheet',
      dashboard: '/engineering/civil/datasheet/dashboard',
      upload: '/engineering/civil/datasheet/upload',
      view: '/engineering/civil/datasheet/view/:id'
    },
    colors: {
      primary: 'gray',
      gradient: 'from-gray-50 to-slate-50',
      hover: 'from-gray-100 to-slate-100',
      button: 'bg-gray-600 hover:bg-gray-700',
      text: 'text-gray-600',
      border: 'border-gray-200 hover:border-gray-400'
    },
    fileTypes: {
      accept: '.pdf,application/pdf',
      maxSize: 50 * 1024 * 1024,
      allowedTypes: ['application/pdf'],
      description: 'PDF files only'
    },
    features: {
      aiExtraction: true,
      validation: true,
      export: true
    }
  }
};

/**
 * Get discipline configuration by ID
 */
export const getDisciplineConfig = (disciplineId) => {
  return DATASHEET_DISCIPLINES[disciplineId] || null;
};

/**
 * Get all available disciplines
 */
export const getAllDisciplines = () => {
  return Object.values(DATASHEET_DISCIPLINES);
};

/**
 * Validate file against discipline configuration
 */
export const validateFile = (file, disciplineConfig) => {
  if (!file || !disciplineConfig) {
    return { valid: false, error: 'Invalid file or configuration' };
  }

  // Check file type
  if (!disciplineConfig.fileTypes.allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Please select ${disciplineConfig.fileTypes.description}`
    };
  }

  // Check file size
  if (file.size > disciplineConfig.fileTypes.maxSize) {
    const maxSizeMB = disciplineConfig.fileTypes.maxSize / (1024 * 1024);
    return { 
      valid: false, 
      error: `File size must be less than ${maxSizeMB}MB`
    };
  }

  return { valid: true };
};

export default DATASHEET_DISCIPLINES;
