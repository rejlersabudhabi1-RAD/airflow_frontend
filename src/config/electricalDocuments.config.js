/**
 * Electrical Engineering Documents Configuration
 * Comprehensive configuration for all 27 electrical engineering initiatives
 * Soft-coded approach for scalability and maintainability
 */

import {
  BoltIcon,
  CpuChipIcon,
  CircleStackIcon,
  Battery50Icon,
  LightBulbIcon,
  DocumentTextIcon,
  MapIcon,
  TableCellsIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Document Categories for better organization
export const DOCUMENT_CATEGORIES = {
  DATASHEETS: 'datasheets',
  CALCULATIONS: 'calculations',
  DIAGRAMS: 'diagrams',
  LAYOUTS: 'layouts',
  SCHEDULES: 'schedules'
};

// Status configurations
export const DOCUMENT_STATUS = {
  ACTIVE: 'active',
  COMING_SOON: 'coming_soon',
  IN_DEVELOPMENT: 'in_development',
  BETA: 'beta'
};

/**
 * Complete Electrical Documents Configuration
 * All 27 initiatives with metadata
 */
export const ELECTRICAL_DOCUMENTS = [
  // ========================================================================
  // TECHNICAL DATA SHEETS (Items 1-11)
  // ========================================================================
  {
    id: 'transformer_datasheet',
    code: 'TDS-TRF',
    name: 'Transformer (Power & Distribution)',
    fullName: 'TECHNICAL DATA SHEET FOR TRANSFORMER (POWER AND DISTRIBUTION)',
    category: DOCUMENT_CATEGORIES.DATASHEETS,
    description: 'Power and distribution transformer specifications, ratings, and performance data',
    icon: BoltIcon,
    color: 'yellow',
    gradient: 'from-yellow-500 to-amber-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Transformer sizing & rating',
      'Voltage regulation calculations',
      'Impedance & loss analysis',
      'Cooling system specifications',
      'Protection & testing requirements'
    ],
    requiredFields: ['kva_rating', 'voltage_ratio', 'vector_group', 'cooling_type', 'impedance'],
    standardsCompliance: ['IEC 60076', 'IEEE C57', 'ADNOC Standards'],
    order: 1
  },
  {
    id: 'lv_motors_datasheet',
    code: 'TDS-MOT',
    name: 'LV Motors',
    fullName: 'TECHNICAL DATA SHEET FOR LV MOTORS',
    category: DOCUMENT_CATEGORIES.DATASHEETS,
    description: 'Low voltage motor specifications, performance curves, and operating characteristics',
    icon: CpuChipIcon,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Motor power & speed ratings',
      'Starting method selection',
      'Efficiency & power factor',
      'Temperature rise & insulation class',
      'Mounting & protection degree'
    ],
    requiredFields: ['motor_power', 'voltage', 'speed', 'frame_size', 'efficiency_class'],
    standardsCompliance: ['IEC 60034', 'NEMA MG-1', 'ADNOC Standards'],
    order: 2
  },
  {
    id: 'diesel_generator_datasheet',
    code: 'TDS-DG',
    name: 'Emergency Diesel Generator',
    fullName: 'TECHNICAL DATA SHEET FOR EMERGENCY DIESEL GENERATOR',
    category: DOCUMENT_CATEGORIES.DATASHEETS,
    description: 'Diesel generator specifications for emergency backup power systems',
    icon: SparklesIcon,
    color: 'orange',
    gradient: 'from-orange-500 to-red-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Generator capacity & voltage',
      'Engine specifications',
      'Fuel consumption & autonomy',
      'Control & protection systems',
      'Noise level & emissions'
    ],
    requiredFields: ['rated_power', 'voltage', 'frequency', 'engine_type', 'fuel_tank_capacity'],
    standardsCompliance: ['ISO 8528', 'IEC 60034', 'ADNOC Standards'],
    order: 3
  },
  {
    id: '11kv_switchgear_datasheet',
    code: 'TDS-MV',
    name: '11KV Switchgear',
    fullName: 'TECHNICAL DATA SHEET FOR 11KV SWITCHGEAR',
    category: DOCUMENT_CATEGORIES.DATASHEETS,
    description: 'Medium voltage switchgear specifications and protection systems',
    icon: CircleStackIcon,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Switchgear type & configuration',
      'Rated voltage & current',
      'Short circuit withstand capability',
      'Protection & control schemes',
      'Busbar & cable connections'
    ],
    requiredFields: ['rated_voltage', 'rated_current', 'short_circuit_current', 'insulation_level'],
    standardsCompliance: ['IEC 62271', 'IEEE C37', 'ADNOC Standards'],
    order: 4
  },
  {
    id: 'lv_switchgear_datasheet',
    code: 'TDS-LV',
    name: 'LV Switchgear',
    fullName: 'TECHNICAL DATA SHEET FOR LV SWITCHGEAR',
    category: DOCUMENT_CATEGORIES.DATASHEETS,
    description: 'Low voltage switchgear and distribution boards specifications',
    icon: CircleStackIcon,
    color: 'indigo',
    gradient: 'from-indigo-500 to-blue-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Panel type & IP rating',
      'Busbar rating & material',
      'Circuit breaker specifications',
      'Form of separation (Form 1-4)',
      'Cable termination provisions'
    ],
    requiredFields: ['rated_voltage', 'busbar_rating', 'ip_rating', 'form_type'],
    standardsCompliance: ['IEC 61439', 'BS EN 61439', 'ADNOC Standards'],
    order: 5
  },
  {
    id: 'vfd_datasheet',
    code: 'TDS-VFD',
    name: 'LV Variable Frequency Drive',
    fullName: 'TECHNICAL DATA SHEET FOR LV VARIABLE FREQUENCY DRIVE',
    category: DOCUMENT_CATEGORIES.DATASHEETS,
    description: 'VFD specifications for motor speed control applications',
    icon: CpuChipIcon,
    color: 'teal',
    gradient: 'from-teal-500 to-green-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'VFD power rating & voltage',
      'Control modes & features',
      'Input/output specifications',
      'Communication protocols',
      'Harmonic mitigation'
    ],
    requiredFields: ['rated_power', 'input_voltage', 'output_frequency_range', 'control_type'],
    standardsCompliance: ['IEC 61800', 'IEEE 519', 'ADNOC Standards'],
    order: 6
  },
  {
    id: 'earthing_resistor_datasheet',
    code: 'TDS-NER',
    name: 'Neutral Earthing Resistor',
    fullName: 'TECHNICAL DATA SHEET FOR NEUTRAL EARTHING RESISTOR',
    category: DOCUMENT_CATEGORIES.DATASHEETS,
    description: 'Neutral earthing resistor specifications for system grounding',
    icon: BoltIcon,
    color: 'amber',
    gradient: 'from-amber-500 to-yellow-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Resistance value calculation',
      'Current rating & duration',
      'Thermal withstand capability',
      'Mounting & enclosure',
      'Neutral CT specifications'
    ],
    requiredFields: ['resistance_value', 'rated_current', 'time_duration', 'voltage_rating'],
    standardsCompliance: ['IEEE 32', 'IEC 60076-6', 'ADNOC Standards'],
    order: 7
  },
  {
    id: 'cables_datasheet',
    code: 'TDS-CBL',
    name: 'Power, Control & Earthing Cables',
    fullName: 'TECHNICAL DATA SHEET FOR POWER, CONTROL AND EARTHING CABLES',
    category: DOCUMENT_CATEGORIES.DATASHEETS,
    description: 'Cable specifications including power, control, and earthing cables',
    icon: DocumentTextIcon,
    color: 'gray',
    gradient: 'from-gray-500 to-slate-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Cable type & construction',
      'Conductor size & material',
      'Insulation & sheath specifications',
      'Current carrying capacity',
      'Installation & routing requirements'
    ],
    requiredFields: ['cable_type', 'conductor_size', 'voltage_rating', 'insulation_type'],
    standardsCompliance: ['IEC 60502', 'BS 5467', 'ADNOC Standards'],
    order: 8
  },
  {
    id: 'dc_ups_datasheet',
    code: 'TDS-DCUPS',
    name: 'Direct Current UPS System',
    fullName: 'TECHNICAL DATA SHEET FOR DIRECT CURRENT UPS SYSTEM',
    category: DOCUMENT_CATEGORIES.DATASHEETS,
    description: 'DC UPS system specifications and battery backup requirements',
    icon: Battery50Icon,
    color: 'green',
    gradient: 'from-green-500 to-emerald-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'DC voltage & current ratings',
      'Battery capacity & autonomy',
      'Charger specifications',
      'Load distribution',
      'Monitoring & alarm functions'
    ],
    requiredFields: ['dc_voltage', 'battery_capacity', 'autonomy_hours', 'load_current'],
    standardsCompliance: ['IEC 62040', 'IEEE 485', 'ADNOC Standards'],
    order: 9
  },
  {
    id: 'ac_ups_datasheet',
    code: 'TDS-ACUPS',
    name: 'Static AC UPS System',
    fullName: 'TECHNICAL DATA SHEET FOR STATIC AC UPS SYSTEM',
    category: DOCUMENT_CATEGORIES.DATASHEETS,
    description: 'AC UPS system specifications for critical power supply',
    icon: Battery50Icon,
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'UPS capacity & voltage',
      'Battery backup duration',
      'Input/output specifications',
      'Efficiency & topology',
      'Bypass & redundancy features'
    ],
    requiredFields: ['ups_capacity', 'input_voltage', 'output_voltage', 'autonomy_time'],
    standardsCompliance: ['IEC 62040', 'IEEE 944', 'ADNOC Standards'],
    order: 10
  },
  {
    id: 'capacitor_datasheet',
    code: 'TDS-CAP',
    name: 'Power Factor Correction Capacitor',
    fullName: 'TECHNICAL DATA SHEET FOR POWER FACTOR CORRECTION CAPACITOR',
    category: DOCUMENT_CATEGORIES.DATASHEETS,
    description: 'Power factor correction capacitor specifications and ratings',
    icon: SparklesIcon,
    color: 'pink',
    gradient: 'from-pink-500 to-rose-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Capacitor kVAR rating',
      'Voltage & frequency ratings',
      'Harmonic withstand capability',
      'Detuning reactor requirements',
      'Control & protection systems'
    ],
    requiredFields: ['kvar_rating', 'voltage', 'frequency', 'harmonic_order'],
    standardsCompliance: ['IEC 60831', 'IEEE 18', 'ADNOC Standards'],
    order: 11
  },

  // ========================================================================
  // CALCULATIONS & DESIGN (Item 12)
  // ========================================================================
  {
    id: 'lighting_calculation',
    code: 'CALC-LGT',
    name: 'Lighting Design Calculation',
    fullName: 'LIGHTING DESIGN CALCULATION',
    category: DOCUMENT_CATEGORIES.CALCULATIONS,
    description: 'Illumination calculations, luminaire selection, and lighting layout design',
    icon: LightBulbIcon,
    color: 'yellow',
    gradient: 'from-yellow-400 to-amber-500',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Lux level calculations',
      'Luminaire selection & spacing',
      'Energy efficiency analysis',
      'Emergency lighting requirements',
      'Daylight integration'
    ],
    requiredFields: ['area_dimensions', 'required_lux_level', 'mounting_height', 'room_reflectance'],
    standardsCompliance: ['IEC 60598', 'IES Standards', 'ADNOC Standards'],
    order: 12
  },

  // ========================================================================
  // SINGLE LINE DIAGRAMS (Items 13-19)
  // ========================================================================
  {
    id: 'key_sld',
    code: 'SLD-KEY',
    name: 'Key Single Line Diagram',
    fullName: 'KEY SINGLE LINE DIAGRAM',
    category: DOCUMENT_CATEGORIES.DIAGRAMS,
    description: 'Overall electrical system single line diagram showing key components',
    icon: DocumentTextIcon,
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-600',
    status: DOCUMENT_STATUS.ACTIVE,
    features: [
      'Complete system overview',
      'Power distribution hierarchy',
      'Main equipment identification',
      'Protection coordination',
      'Standard symbols & legends'
    ],
    requiredFields: ['project_name', 'voltage_levels', 'main_equipment'],
    standardsCompliance: ['IEC 60617', 'IEEE 315', 'ADNOC Standards'],
    order: 13
  },
  {
    id: 'mv_switchgear_sld',
    code: 'SLD-MV',
    name: 'Single Line Diagram - MV Switchgear',
    fullName: 'SINGLE LINE DIAGRAM FOR MV SWITCHGEAR',
    category: DOCUMENT_CATEGORIES.DIAGRAMS,
    description: 'Medium voltage switchgear single line diagram with protection details',
    icon: CircleStackIcon,
    color: 'purple',
    gradient: 'from-purple-500 to-fuchsia-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'MV switchgear layout',
      'Feeder configuration',
      'Protection relay settings',
      'Metering & instrumentation',
      'Earthing arrangement'
    ],
    requiredFields: ['switchgear_type', 'incoming_voltage', 'number_of_feeders'],
    standardsCompliance: ['IEC 62271', 'ADNOC Standards'],
    order: 14
  },
  {
    id: 'ac_ups_sld',
    code: 'SLD-ACUPS',
    name: 'Single Line Diagram - AC UPS',
    fullName: 'SINGLE LINE DIAGRAM FOR AC UPS',
    category: DOCUMENT_CATEGORIES.DIAGRAMS,
    description: 'AC UPS system configuration and distribution diagram',
    icon: Battery50Icon,
    color: 'cyan',
    gradient: 'from-cyan-500 to-teal-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'UPS system configuration',
      'Redundancy arrangement',
      'Input/output distribution',
      'Bypass provisions',
      'Battery bank connection'
    ],
    requiredFields: ['ups_capacity', 'redundancy_type', 'distribution_panels'],
    standardsCompliance: ['IEC 62040', 'ADNOC Standards'],
    order: 15
  },
  {
    id: 'dc_ups_sld',
    code: 'SLD-DCUPS',
    name: 'Single Line Diagram - DC UPS',
    fullName: 'SINGLE LINE DIAGRAM FOR DC UPS',
    category: DOCUMENT_CATEGORIES.DIAGRAMS,
    description: 'DC UPS system and battery distribution diagram',
    icon: Battery50Icon,
    color: 'green',
    gradient: 'from-green-500 to-lime-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'DC distribution system',
      'Battery bank configuration',
      'Charger connections',
      'Load distribution boards',
      'Monitoring system integration'
    ],
    requiredFields: ['dc_voltage', 'battery_strings', 'load_panels'],
    standardsCompliance: ['IEEE 485', 'ADNOC Standards'],
    order: 16
  },
  {
    id: 'lv_switchgear_sld',
    code: 'SLD-LV',
    name: 'Single Line Diagram - LV Switchgear',
    fullName: 'SINGLE LINE DIAGRAM FOR LV SWITCHGEAR',
    category: DOCUMENT_CATEGORIES.DIAGRAMS,
    description: 'Low voltage switchgear and distribution board single line diagram',
    icon: CircleStackIcon,
    color: 'blue',
    gradient: 'from-blue-500 to-indigo-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'LV distribution arrangement',
      'Circuit breaker ratings',
      'Motor control centers',
      'Distribution boards',
      'Load segregation'
    ],
    requiredFields: ['panel_designation', 'incoming_supply', 'outgoing_circuits'],
    standardsCompliance: ['IEC 61439', 'ADNOC Standards'],
    order: 17
  },
  {
    id: 'lighting_sld_indoor',
    code: 'SLD-LGT-IN',
    name: 'SLD - Lighting & Small Power (Indoor)',
    fullName: 'SINGLE LINE DIAGRAM FOR LIGHTING AND SMALL POWER - INDOOR',
    category: DOCUMENT_CATEGORIES.DIAGRAMS,
    description: 'Indoor lighting and small power distribution single line diagram',
    icon: LightBulbIcon,
    color: 'amber',
    gradient: 'from-amber-400 to-orange-500',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Lighting distribution boards',
      'Small power circuits',
      'Emergency lighting',
      'Control systems',
      'Circuit protection'
    ],
    requiredFields: ['building_area', 'db_locations', 'lighting_zones'],
    standardsCompliance: ['IEC 60364', 'ADNOC Standards'],
    order: 18
  },
  {
    id: 'lighting_sld_outdoor',
    code: 'SLD-LGT-OUT',
    name: 'SLD - Lighting & Small Power (Outdoor)',
    fullName: 'SINGLE LINE DIAGRAM FOR LIGHTING AND SMALL POWER - OUTDOOR',
    category: DOCUMENT_CATEGORIES.DIAGRAMS,
    description: 'Outdoor lighting and small power distribution single line diagram',
    icon: LightBulbIcon,
    color: 'orange',
    gradient: 'from-orange-400 to-red-500',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Outdoor lighting systems',
      'Flood lighting arrangement',
      'Street/area lighting',
      'Weatherproof distribution',
      'Control & automation'
    ],
    requiredFields: ['outdoor_area', 'lighting_poles', 'distribution_points'],
    standardsCompliance: ['IEC 60364', 'IP Rating Standards', 'ADNOC Standards'],
    order: 19
  },

  // ========================================================================
  // LAYOUTS & DRAWINGS (Items 20-25)
  // ========================================================================
  {
    id: 'substation_layout',
    code: 'LAY-SUB',
    name: 'Electrical Substation Building Layout',
    fullName: 'ELECTRICAL SUBSTATION BUILDING LAYOUT',
    category: DOCUMENT_CATEGORIES.LAYOUTS,
    description: 'Electrical substation building layout and equipment arrangement',
    icon: MapIcon,
    color: 'slate',
    gradient: 'from-slate-500 to-gray-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Equipment layout & spacing',
      'Fire zones & segregation',
      'Access & maintenance clearances',
      'Cable entry/exit points',
      'Ventilation & cooling'
    ],
    requiredFields: ['building_dimensions', 'equipment_list', 'fire_zones'],
    standardsCompliance: ['IEC 61936', 'NFPA 70E', 'ADNOC Standards'],
    order: 20
  },
  {
    id: 'cable_tray_outdoor',
    code: 'LAY-CT-OUT',
    name: 'Cable & Tray Routing (Outdoor)',
    fullName: 'CABLE AND TRAY ROUTING LAYOUT - OUTDOOR',
    category: DOCUMENT_CATEGORIES.LAYOUTS,
    description: 'Outdoor cable tray routing layout and support structures',
    icon: MapIcon,
    color: 'emerald',
    gradient: 'from-emerald-500 to-green-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Cable tray routing',
      'Support structure locations',
      'Cable segregation',
      'Tray sizing & fill ratio',
      'Weatherproofing requirements'
    ],
    requiredFields: ['route_plan', 'tray_sizes', 'support_spacing'],
    standardsCompliance: ['IEC 61537', 'NEMA VE-1', 'ADNOC Standards'],
    order: 21
  },
  {
    id: 'cable_tray_indoor',
    code: 'LAY-CT-IN',
    name: 'Cable & Tray Routing (Indoor)',
    fullName: 'CABLE AND TRAY ROUTING LAYOUT - INDOOR',
    category: DOCUMENT_CATEGORIES.LAYOUTS,
    description: 'Indoor cable tray routing layout and installation details',
    icon: MapIcon,
    color: 'sky',
    gradient: 'from-sky-500 to-blue-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Indoor cable routing',
      'Ceiling/wall mounted trays',
      'Fire stopping requirements',
      'Cable segregation zones',
      'Access provisions'
    ],
    requiredFields: ['floor_plan', 'tray_routes', 'fire_zones'],
    standardsCompliance: ['IEC 61537', 'Fire Safety Codes', 'ADNOC Standards'],
    order: 22
  },
  {
    id: 'lighting_layout_indoor',
    code: 'LAY-LGT-IN',
    name: 'Lighting & Small Power Layout (Indoor)',
    fullName: 'LIGHTING & SMALL POWER LAYOUT - INDOOR',
    category: DOCUMENT_CATEGORIES.LAYOUTS,
    description: 'Indoor lighting fixtures and small power outlet layout',
    icon: LightBulbIcon,
    color: 'yellow',
    gradient: 'from-yellow-400 to-amber-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Luminaire locations',
      'Lighting control zones',
      'Power outlet positions',
      'Emergency lighting',
      'Switch locations'
    ],
    requiredFields: ['room_layout', 'luminaire_types', 'outlet_count'],
    standardsCompliance: ['IEC 60364', 'IES Standards', 'ADNOC Standards'],
    order: 23
  },
  {
    id: 'lighting_layout_outdoor',
    code: 'LAY-LGT-OUT',
    name: 'Lighting & Small Power Layout (Outdoor)',
    fullName: 'LIGHTING & SMALL POWER LAYOUT - OUTDOOR',
    category: DOCUMENT_CATEGORIES.LAYOUTS,
    description: 'Outdoor lighting and small power facility layout',
    icon: LightBulbIcon,
    color: 'orange',
    gradient: 'from-orange-400 to-amber-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Lighting pole locations',
      'Flood light coverage',
      'Outdoor power points',
      'Control system layout',
      'Underground cable routes'
    ],
    requiredFields: ['site_plan', 'pole_positions', 'coverage_areas'],
    standardsCompliance: ['IEC 60364', 'IP Rating Standards', 'ADNOC Standards'],
    order: 24
  },
  {
    id: 'earthing_layout',
    code: 'LAY-ERT',
    name: 'Earthing & Lightning Protection Layout',
    fullName: 'EARTHING AND LIGHTNING PROTECTION SYSTEM LAYOUT',
    category: DOCUMENT_CATEGORIES.LAYOUTS,
    description: 'Earthing system and lightning protection layout design',
    icon: BoltIcon,
    color: 'red',
    gradient: 'from-red-500 to-orange-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Earthing grid layout',
      'Lightning protection zones',
      'Earth electrode locations',
      'Bonding connections',
      'Resistance calculation'
    ],
    requiredFields: ['site_area', 'soil_resistivity', 'protection_levels'],
    standardsCompliance: ['IEC 62305', 'IEEE 80', 'ADNOC Standards'],
    order: 25
  },

  // ========================================================================
  // SCHEDULES & DOCUMENTATION (Items 26-27)
  // ========================================================================
  {
    id: 'cable_schedule',
    code: 'SCH-CBL',
    name: 'Power & Control Cable Schedule',
    fullName: 'POWER AND CONTROL CABLE SCHEDULE',
    category: DOCUMENT_CATEGORIES.SCHEDULES,
    description: 'Comprehensive cable schedule with routing and specifications',
    icon: TableCellsIcon,
    color: 'violet',
    gradient: 'from-violet-500 to-purple-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Cable identification',
      'From-To designations',
      'Cable size & type',
      'Length & routing',
      'Termination details'
    ],
    requiredFields: ['cable_tag', 'from_location', 'to_location', 'cable_type', 'size'],
    standardsCompliance: ['Project Standards', 'ADNOC Standards'],
    order: 26
  },
  {
    id: 'electrical_mto',
    code: 'MTO-ELC',
    name: 'Electrical MTO',
    fullName: 'ELECTRICAL MTO',
    category: DOCUMENT_CATEGORIES.SCHEDULES,
    description: 'Material take-off for all electrical equipment and materials',
    icon: TableCellsIcon,
    color: 'gray',
    gradient: 'from-gray-500 to-slate-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'Equipment quantities',
      'Material specifications',
      'Unit rates & costs',
      'Supplier information',
      'Delivery schedules'
    ],
    requiredFields: ['item_description', 'quantity', 'unit', 'specification'],
    standardsCompliance: ['Project Requirements', 'ADNOC Standards'],
    order: 27
  },
  {
    id: 'interconnection_schedule',
    code: 'SCH-INT',
    name: 'Interconnection Schedule',
    fullName: 'INTERCONNECTION SCHEDULE',
    category: DOCUMENT_CATEGORIES.SCHEDULES,
    description: 'System interconnection and interface schedule',
    icon: TableCellsIcon,
    color: 'indigo',
    gradient: 'from-indigo-500 to-blue-600',
    status: DOCUMENT_STATUS.COMING_SOON,
    features: [
      'System interfaces',
      'Signal types & levels',
      'Cable connections',
      'Termination points',
      'Testing requirements'
    ],
    requiredFields: ['system_from', 'system_to', 'signal_type', 'cable_ref'],
    standardsCompliance: ['Interface Standards', 'ADNOC Standards'],
    order: 28
  }
];

/**
 * Get documents by category
 */
export const getDocumentsByCategory = (category) => {
  return ELECTRICAL_DOCUMENTS.filter(doc => doc.category === category)
    .sort((a, b) => a.order - b.order);
};

/**
 * Get document by ID
 */
export const getDocumentById = (id) => {
  return ELECTRICAL_DOCUMENTS.find(doc => doc.id === id);
};

/**
 * Get document by code
 */
export const getDocumentByCode = (code) => {
  return ELECTRICAL_DOCUMENTS.find(doc => doc.code === code);
};

/**
 * Get active documents only
 */
export const getActiveDocuments = () => {
  return ELECTRICAL_DOCUMENTS.filter(doc => doc.status === DOCUMENT_STATUS.ACTIVE)
    .sort((a, b) => a.order - b.order);
};

/**
 * Get category statistics
 */
export const getCategoryStats = () => {
  const stats = {};
  Object.values(DOCUMENT_CATEGORIES).forEach(category => {
    stats[category] = {
      total: getDocumentsByCategory(category).length,
      active: getDocumentsByCategory(category).filter(d => d.status === DOCUMENT_STATUS.ACTIVE).length
    };
  });
  return stats;
};

/**
 * Category display names
 */
export const CATEGORY_DISPLAY_NAMES = {
  [DOCUMENT_CATEGORIES.DATASHEETS]: 'Technical Datasheets',
  [DOCUMENT_CATEGORIES.CALCULATIONS]: 'Calculations & Design',
  [DOCUMENT_CATEGORIES.DIAGRAMS]: 'Single Line Diagrams',
  [DOCUMENT_CATEGORIES.LAYOUTS]: 'Layouts & Drawings',
  [DOCUMENT_CATEGORIES.SCHEDULES]: 'Schedules & Documentation'
};

/**
 * Category descriptions
 */
export const CATEGORY_DESCRIPTIONS = {
  [DOCUMENT_CATEGORIES.DATASHEETS]: 'Equipment specifications and technical datasheets',
  [DOCUMENT_CATEGORIES.CALCULATIONS]: 'Engineering calculations and design documents',
  [DOCUMENT_CATEGORIES.DIAGRAMS]: 'Electrical system single line diagrams',
  [DOCUMENT_CATEGORIES.LAYOUTS]: 'Physical layouts and installation drawings',
  [DOCUMENT_CATEGORIES.SCHEDULES]: 'Equipment and material schedules'
};

export default ELECTRICAL_DOCUMENTS;
