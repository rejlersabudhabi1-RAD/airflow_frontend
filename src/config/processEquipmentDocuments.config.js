/**
 * Process Equipment Documents Configuration
 * SOFT-CODED: Centralized configuration for all process engineering documents
 * Version: 1.0.0
 */

// Document Status Constants
export const DOCUMENT_STATUS = {
  ACTIVE: 'active',
  COMING_SOON: 'coming_soon',
  IN_DEVELOPMENT: 'in_development'
};

// Document Categories
export const DOCUMENT_CATEGORIES = {
  VALVE_DATASHEETS: 'valve_datasheets',
  EQUIPMENT_DATASHEETS: 'equipment_datasheets',
  PIPING_DOCUMENTS: 'piping_documents',
  CONTROL_SYSTEMS: 'control_systems',
  PROCESS_DOCUMENTS: 'process_documents',
  CALCULATIONS: 'calculations'
};

// Category Display Names
export const CATEGORY_DISPLAY_NAMES = {
  [DOCUMENT_CATEGORIES.VALVE_DATASHEETS]: 'Valve Datasheets',
  [DOCUMENT_CATEGORIES.EQUIPMENT_DATASHEETS]: 'Equipment Datasheets',
  [DOCUMENT_CATEGORIES.PIPING_DOCUMENTS]: 'Piping Documents',
  [DOCUMENT_CATEGORIES.CONTROL_SYSTEMS]: 'Control Systems',
  [DOCUMENT_CATEGORIES.PROCESS_DOCUMENTS]: 'Process Documents',
  [DOCUMENT_CATEGORIES.CALCULATIONS]: 'Process Calculations'
};

// Category Descriptions
export const CATEGORY_DESCRIPTIONS = {
  [DOCUMENT_CATEGORIES.VALVE_DATASHEETS]: 'Motor operated valves, shut down valves, and control valve specifications',
  [DOCUMENT_CATEGORIES.EQUIPMENT_DATASHEETS]: 'Process equipment specifications including vessels, heat exchangers, and rotating equipment',
  [DOCUMENT_CATEGORIES.PIPING_DOCUMENTS]: 'Piping specifications, material selection, and stress analysis',
  [DOCUMENT_CATEGORIES.CONTROL_SYSTEMS]: 'Control valve sizing, actuator selection, and instrumentation',
  [DOCUMENT_CATEGORIES.PROCESS_DOCUMENTS]: 'P&ID drawings, process flow diagrams, and mass/energy balances',
  [DOCUMENT_CATEGORIES.CALCULATIONS]: 'Hydraulic calculations, heat transfer, and process sizing'
};

// Process Equipment Documents - Main Configuration Array
export const PROCESS_EQUIPMENT_DOCUMENTS = [
  // VALVE DATASHEETS
  {
    id: 'mov_datasheet',
    code: 'PE-MOV-001',
    name: 'MOV Datasheet',
    fullName: 'Motor Operated Valve Datasheet',
    description: 'Comprehensive specifications for motor operated valves with P&ID integration',
    category: DOCUMENT_CATEGORIES.VALVE_DATASHEETS,
    status: DOCUMENT_STATUS.ACTIVE,
    route: '/engineering/process/datasheet/mov',
    canUploadPID: true,
    supportedFileTypes: ['.pdf', '.dwg', '.dxf', '.png', '.jpg']
  },
  {
    id: 'sdv_datasheet',
    code: 'PE-SDV-001',
    name: 'SDV Datasheet',
    fullName: 'Shut Down Valve Datasheet',
    description: 'Safety critical shut down valve specifications with fail-safe requirements',
    category: DOCUMENT_CATEGORIES.VALVE_DATASHEETS,
    status: DOCUMENT_STATUS.ACTIVE,
    route: '/engineering/process/datasheet/sdv',
    canUploadPID: true,
    supportedFileTypes: ['.pdf', '.dwg', '.dxf', '.png', '.jpg']
  },
  {
    id: 'control_valve',
    code: 'PE-CV-001',
    name: 'Control Valve',
    fullName: 'Control Valve Datasheet',
    description: 'Control valve sizing and selection with actuator specifications',
    category: DOCUMENT_CATEGORIES.VALVE_DATASHEETS,
    status: DOCUMENT_STATUS.COMING_SOON,
    canUploadPID: true
  },
  {
    id: 'check_valve',
    code: 'PE-CHK-001',
    name: 'Check Valve',
    fullName: 'Check Valve Datasheet',
    description: 'Non-return valve specifications and sizing',
    category: DOCUMENT_CATEGORIES.VALVE_DATASHEETS,
    status: DOCUMENT_STATUS.COMING_SOON,
    canUploadPID: true
  },

  // EQUIPMENT DATASHEETS
  {
    id: 'pump_datasheet',
    code: 'PE-P-001',
    name: 'Pump Datasheet',
    fullName: 'Centrifugal Pump Datasheet',
    description: 'Pump specifications with hydraulic calculations and performance curves',
    category: DOCUMENT_CATEGORIES.EQUIPMENT_DATASHEETS,
    status: DOCUMENT_STATUS.ACTIVE,
    route: '/engineering/process/datasheet/pfd',
    canUploadPID: true,
    supportedFileTypes: ['.pdf', '.dwg', '.dxf', '.png', '.jpg']
  },
  {
    id: 'vessel_datasheet',
    code: 'PE-V-001',
    name: 'Vessel Datasheet',
    fullName: 'Pressure Vessel Datasheet',
    description: 'Pressure vessel specifications with mechanical design calculations',
    category: DOCUMENT_CATEGORIES.EQUIPMENT_DATASHEETS,
    status: DOCUMENT_STATUS.COMING_SOON,
    canUploadPID: true
  },
  {
    id: 'heat_exchanger',
    code: 'PE-E-001',
    name: 'Heat Exchanger',
    fullName: 'Heat Exchanger Datasheet',
    description: 'Heat exchanger thermal and mechanical specifications',
    category: DOCUMENT_CATEGORIES.EQUIPMENT_DATASHEETS,
    status: DOCUMENT_STATUS.COMING_SOON,
    canUploadPID: true
  },
  {
    id: 'compressor',
    code: 'PE-K-001',
    name: 'Compressor',
    fullName: 'Compressor Datasheet',
    description: 'Centrifugal and reciprocating compressor specifications',
    category: DOCUMENT_CATEGORIES.EQUIPMENT_DATASHEETS,
    status: DOCUMENT_STATUS.COMING_SOON,
    canUploadPID: true
  },

  // PIPING DOCUMENTS
  {
    id: 'line_list',
    code: 'PE-LL-001',
    name: 'Line List',
    fullName: 'Piping Line List',
    description: 'Comprehensive piping line list from P&ID analysis',
    category: DOCUMENT_CATEGORIES.PIPING_DOCUMENTS,
    status: DOCUMENT_STATUS.ACTIVE,
    route: '/designiq/lists',
    canUploadPID: true,
    supportedFileTypes: ['.pdf', '.dwg', '.dxf', '.png', '.jpg']
  },
  {
    id: 'material_selection',
    code: 'PE-MS-001',
    name: 'Material Selection',
    fullName: 'Piping Material Selection',
    description: 'Piping material specifications and corrosion considerations',
    category: DOCUMENT_CATEGORIES.PIPING_DOCUMENTS,
    status: DOCUMENT_STATUS.COMING_SOON,
    canUploadPID: false
  },

  // CONTROL SYSTEMS
  {
    id: 'pressure_instrument',
    code: 'PE-PI-001',
    name: 'Pressure Instrument',
    fullName: 'Pressure Instrumentation',
    description: 'Pressure transmitter and gauge specifications from P&ID detection',
    category: DOCUMENT_CATEGORIES.CONTROL_SYSTEMS,
    status: DOCUMENT_STATUS.ACTIVE,
    route: '/engineering/process/datasheet/pressure-instrument',
    canUploadPID: true,
    supportedFileTypes: ['.pdf', '.dwg', '.dxf', '.png', '.jpg']
  },
  {
    id: 'flow_instrument',
    code: 'PE-FI-001',
    name: 'Flow Instrument',
    fullName: 'Flow Instrumentation',
    description: 'Flow meter selection and sizing specifications',
    category: DOCUMENT_CATEGORIES.CONTROL_SYSTEMS,
    status: DOCUMENT_STATUS.COMING_SOON,
    canUploadPID: true
  },
  {
    id: 'level_instrument',
    code: 'PE-LI-001',
    name: 'Level Instrument',
    fullName: 'Level Instrumentation',
    description: 'Level transmitter and switch specifications',
    category: DOCUMENT_CATEGORIES.CONTROL_SYSTEMS,
    status: DOCUMENT_STATUS.COMING_SOON,
    canUploadPID: true
  },
  {
    id: 'temperature_instrument',
    code: 'PE-TI-001',
    name: 'Temperature Instrument',
    fullName: 'Temperature Instrumentation',
    description: 'Temperature transmitter and thermocouple specifications',
    category: DOCUMENT_CATEGORIES.CONTROL_SYSTEMS,
    status: DOCUMENT_STATUS.COMING_SOON,
    canUploadPID: true
  },

  // PROCESS DOCUMENTS
  {
    id: 'pid_drawings',
    code: 'PE-PID-001',
    name: 'P&ID Drawings',
    fullName: 'Piping & Instrumentation Diagrams',
    description: 'Upload and manage P&ID drawings with AI-powered analysis',
    category: DOCUMENT_CATEGORIES.PROCESS_DOCUMENTS,
    status: DOCUMENT_STATUS.ACTIVE,
    route: '/engineering/process/pid-upload',
    canUploadPID: true,
    supportedFileTypes: ['.pdf', '.dwg', '.dxf', '.png', '.jpg', '.tiff']
  },
  {
    id: 'process_flow',
    code: 'PE-PFD-001',
    name: 'Process Flow Diagram',
    fullName: 'Process Flow Diagrams',
    description: 'Process flow diagrams with stream data and equipment summary',
    category: DOCUMENT_CATEGORIES.PROCESS_DOCUMENTS,
    status: DOCUMENT_STATUS.COMING_SOON,
    canUploadPID: true
  },
  {
    id: 'mass_balance',
    code: 'PE-MB-001',
    name: 'Mass & Energy Balance',
    fullName: 'Mass and Energy Balance',
    description: 'Process mass and energy balance calculations',
    category: DOCUMENT_CATEGORIES.PROCESS_DOCUMENTS,
    status: DOCUMENT_STATUS.COMING_SOON,
    canUploadPID: false
  },

  // CALCULATIONS
  {
    id: 'hydraulic_calc',
    code: 'PE-HC-001',
    name: 'Hydraulic Calculation',
    fullName: 'Hydraulic Analysis',
    description: 'Piping pressure drop and pump head calculations',
    category: DOCUMENT_CATEGORIES.CALCULATIONS,
    status: DOCUMENT_STATUS.ACTIVE,
    route: '/engineering/process/datasheet/pfd',
    canUploadPID: false
  },
  {
    id: 'relief_valve_sizing',
    code: 'PE-RS-001',
    name: 'Relief Valve Sizing',
    fullName: 'Pressure Relief Valve Sizing',
    description: 'Safety relief valve sizing per API 520/521',
    category: DOCUMENT_CATEGORIES.CALCULATIONS,
    status: DOCUMENT_STATUS.COMING_SOON,
    canUploadPID: true
  },
  {
    id: 'heat_transfer',
    code: 'PE-HT-001',
    name: 'Heat Transfer',
    fullName: 'Heat Transfer Calculations',
    description: 'Heat exchanger design and thermal calculations',
    category: DOCUMENT_CATEGORIES.CALCULATIONS,
    status: DOCUMENT_STATUS.COMING_SOON,
    canUploadPID: false
  }
];

// Helper Functions
export const getDocumentsByCategory = (category) => {
  return PROCESS_EQUIPMENT_DOCUMENTS.filter(doc => doc.category === category);
};

export const getActiveDocuments = () => {
  return PROCESS_EQUIPMENT_DOCUMENTS.filter(doc => doc.status === DOCUMENT_STATUS.ACTIVE);
};

export const getDocumentById = (id) => {
  return PROCESS_EQUIPMENT_DOCUMENTS.find(doc => doc.id === id);
};

export const getDocumentsByStatus = (status) => {
  return PROCESS_EQUIPMENT_DOCUMENTS.filter(doc => doc.status === status);
};

export const getDocumentsWithPIDUpload = () => {
  return PROCESS_EQUIPMENT_DOCUMENTS.filter(doc => doc.canUploadPID);
};

export const getCategoriesWithDocuments = () => {
  const categories = {};
  Object.keys(DOCUMENT_CATEGORIES).forEach(key => {
    const category = DOCUMENT_CATEGORIES[key];
    const docs = getDocumentsByCategory(category);
    if (docs.length > 0) {
      categories[category] = {
        name: CATEGORY_DISPLAY_NAMES[category],
        description: CATEGORY_DESCRIPTIONS[category],
        documents: docs
      };
    }
  });
  return categories;
};

export default {
  PROCESS_EQUIPMENT_DOCUMENTS,
  DOCUMENT_STATUS,
  DOCUMENT_CATEGORIES,
  CATEGORY_DISPLAY_NAMES,
  CATEGORY_DESCRIPTIONS,
  getDocumentsByCategory,
  getActiveDocuments,
  getDocumentById,
  getDocumentsByStatus,
  getDocumentsWithPIDUpload,
  getCategoriesWithDocuments
};
