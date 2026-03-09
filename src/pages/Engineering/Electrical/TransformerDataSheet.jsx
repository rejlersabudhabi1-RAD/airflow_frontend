/**
 * Transformer Technical Data Sheet Page
 * SOFT-CODED: Technical specification form for Power and Distribution Transformers
 * Compliant with ADNOC and IEC standards
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  BoltIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// SOFT-CODED CONFIGURATION
const TRANSFORMER_CONFIG = {
  pageTitle: 'Transformer (Power & Distribution)',
  fullTitle: 'Technical Data Sheet for Transformer (Power and Distribution)',
  description: 'Complete technical specifications for power and distribution transformers',
  
  // Form sections configuration
  sections: [
    {
      id: 'general',
      title: 'General Information',
      icon: '📋',
      fields: [
        { id: 'tag_number', label: 'Tag Number', type: 'text', required: true, placeholder: 'e.g., TX-001' },
        { id: 'service_description', label: 'Service Description', type: 'text', required: true, placeholder: 'e.g., Main Power Distribution' },
        { id: 'location', label: 'Location', type: 'text', required: true, placeholder: 'e.g., Substation A' },
        { id: 'quantity', label: 'Quantity', type: 'number', required: true, default: 1 }
      ]
    },
    {
      id: 'ratings',
      title: 'Ratings & Electrical Characteristics',
      icon: '⚡',
      fields: [
        { id: 'rated_power', label: 'Rated Power (kVA/MVA)', type: 'number', required: true, placeholder: '1000' },
        { id: 'primary_voltage', label: 'Primary Voltage (kV)', type: 'number', required: true, placeholder: '11' },
        { id: 'secondary_voltage', label: 'Secondary Voltage (kV)', type: 'number', required: true, placeholder: '0.415' },
        { id: 'frequency', label: 'Frequency (Hz)', type: 'select', required: true, options: ['50', '60'], default: '50' },
        { id: 'phases', label: 'Number of Phases', type: 'select', required: true, options: ['3'], default: '3' },
        { id: 'connection_group', label: 'Vector Group/Connection', type: 'select', required: true, 
          options: ['Dyn11', 'Dyn1', 'Yyn0', 'Yzn11', 'Dzn0'] },
        { id: 'impedance', label: 'Impedance Voltage (%)', type: 'number', required: true, placeholder: '5.75' }
      ]
    },
    {
      id: 'losses',
      title: 'Losses & Performance',
      icon: '📊',
      fields: [
        { id: 'no_load_loss', label: 'No-Load Loss (kW)', type: 'number', required: true },
        { id: 'load_loss', label: 'Load Loss at 75°C (kW)', type: 'number', required: true },
        { id: 'no_load_current', label: 'No-Load Current (%)', type: 'number', required: true },
        { id: 'efficiency', label: 'Efficiency at Full Load (%)', type: 'number', placeholder: '98.5' }
      ]
    },
    {
      id: 'cooling',
      title: 'Cooling & Insulation',
      icon: '🌡️',
      fields: [
        { id: 'cooling_type', label: 'Cooling Type', type: 'select', required: true,
          options: ['ONAN', 'ONAF', 'OFAF', 'OFWF', 'KNAN'] },
        { id: 'insulation_class', label: 'Insulation Class', type: 'select', required: true,
          options: ['Class A (105°C)', 'Class E (120°C)', 'Class B (130°C)', 'Class F (155°C)', 'Class H (180°C)'] },
        { id: 'temperature_rise', label: 'Temperature Rise (°C)', type: 'select', required: true,
          options: ['55', '65', '75', '80'] },
        { id: 'insulation_level_primary', label: 'Insulation Level - Primary (kV)', type: 'text', required: true, 
          placeholder: 'e.g., 12/28/75' },
        { id: 'insulation_level_secondary', label: 'Insulation Level - Secondary (kV)', type: 'text', required: true,
          placeholder: 'e.g., 3/10/20' }
      ]
    },
    {
      id: 'construction',
      title: 'Construction & Design',
      icon: '🔧',
      fields: [
        { id: 'core_type', label: 'Core Type', type: 'select', required: true,
          options: ['Core Type', 'Shell Type', 'Berry Type'] },
        { id: 'winding_material', label: 'Winding Material', type: 'select', required: true,
          options: ['Copper', 'Aluminum'] },
        { id: 'tank_type', label: 'Tank Type', type: 'select', required: true,
          options: ['Hermetically Sealed', 'Conservator Type', 'Sealed with Nitrogen Cushion'] },
        { id: 'tap_changer', label: 'Tap Changer Type', type: 'select', required: true,
          options: ['Off-Load (OLTC)', 'On-Load (OLTC)', 'No Tap Changer'] },
        { id: 'tap_range', label: 'Tap Range', type: 'text', placeholder: 'e.g., ±5% in 2.5% steps' }
      ]
    },
    {
      id: 'protection',
      title: 'Protection & Monitoring',
      icon: '🛡️',
      fields: [
        { id: 'buchholz_relay', label: 'Buchholz Relay', type: 'select', required: true, 
          options: ['Required', 'Not Required'] },
        { id: 'pressure_relief_device', label: 'Pressure Relief Device', type: 'select', required: true,
          options: ['Required', 'Not Required'] },
        { id: 'winding_temperature_indicator', label: 'Winding Temperature Indicator', type: 'select', required: true,
          options: ['Required', 'Not Required'] },
        { id: 'oil_temperature_indicator', label: 'Oil Temperature Indicator', type: 'select', required: true,
          options: ['Required', 'Not Required'] },
        { id: 'oil_level_gauge', label: 'Oil Level Gauge', type: 'select', required: true,
          options: ['Magnetic Type', 'Float Type', 'Not Required'] }
      ]
    },
    {
      id: 'standards',
      title: 'Standards & Testing',
      icon: '✅',
      fields: [
        { id: 'applicable_standards', label: 'Applicable Standards', type: 'multiselect', required: true,
          options: ['IEC 60076', 'IEEE C57', 'BS 171', 'ADNOC Standards'], default: ['IEC 60076', 'ADNOC Standards'] },
        { id: 'type_tests', label: 'Type Tests Required', type: 'multiselect', required: true,
          options: [
            'Temperature Rise Test',
            'Impulse Voltage Test',
            'Short Circuit Test',
            'No-Load Loss & Current',
            'Load Loss & Impedance',
            'Noise Level Test'
          ]
        },
        { id: 'routine_tests', label: 'Routine Tests', type: 'multiselect', required: true,
          options: [
            'Winding Resistance',
            'Voltage Ratio',
            'Vector Group',
            'No-Load Loss & Current',
            'Load Loss & Impedance',
            'Applied Voltage Test',
            'Induced Voltage Test'
          ], default: ['Winding Resistance', 'Voltage Ratio', 'Applied Voltage Test'] }
      ]
    },
    {
      id: 'environmental',
      title: 'Environmental Conditions',
      icon: '🌍',
      fields: [
        { id: 'installation_type', label: 'Installation Type', type: 'select', required: true,
          options: ['Indoor', 'Outdoor', 'Prefabricated Substation'] },
        { id: 'ambient_temp_min', label: 'Min Ambient Temperature (°C)', type: 'number', required: true, default: -10 },
        { id: 'ambient_temp_max', label: 'Max Ambient Temperature (°C)', type: 'number', required: true, default: 50 },
        { id: 'altitude', label: 'Altitude (meters above sea level)', type: 'number', required: true, default: 0 },
        { id: 'seismic_zone', label: 'Seismic Zone', type: 'select', 
          options: ['Zone 0', 'Zone 1', 'Zone 2', 'Zone 3', 'Zone 4'] },
        { id: 'ip_rating', label: 'IP Rating', type: 'select', required: true,
          options: ['IP23', 'IP44', 'IP54', 'IP65'] }
      ]
    }
  ],
  
  // Additional requirements
  additionalRequirements: [
    'Nameplate in English and Arabic',
    'Spare gaskets and O-rings',
    'Operation and Maintenance Manual',
    'Test certificates and reports',
    'Foundation and installation drawings',
    'Transformer oil specification and test report'
  ]
};

const TransformerDataSheet = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [activeSection, setActiveSection] = useState('general');
  const [completedSections, setCompletedSections] = useState([]);

  // Handle field change
  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  // Handle multi-select
  const handleMultiSelect = (fieldId, value) => {
    setFormData(prev => {
      const current = prev[fieldId] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [fieldId]: updated };
    });
  };

  // Check if section is complete
  const isSectionComplete = (section) => {
    return section.fields.every(field => {
      if (!field.required) return true;
      const value = formData[field.id];
      if (field.type === 'multiselect') {
        return value && value.length > 0;
      }
      return value !== undefined && value !== '';
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Transformer Data Sheet Submitted:', formData);
    // TODO: Implement API call to backend
    alert('Datasheet saved successfully!');
  };

  // Handle export to Excel
  const handleExport = () => {
    console.log('Exporting to Excel:', formData);
    // TODO: Implement Excel export functionality
    alert('Excel export functionality will be implemented');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/engineering/electrical/datasheet')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {TRANSFORMER_CONFIG.pageTitle}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {TRANSFORMER_CONFIG.fullTitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Export to Excel
              </button>
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all"
              >
                <CheckCircleIcon className="w-5 h-5" />
                Save Datasheet
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar Navigation */}
          <div className="col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sticky top-24">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 px-2">
                SECTIONS
              </h3>
              <nav className="space-y-1">
                {TRANSFORMER_CONFIG.sections.map((section) => {
                  const isComplete = isSectionComplete(section);
                  const isActive = activeSection === section.id;
                  
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all
                        ${isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}
                      `}
                    >
                      <span className="text-lg">{section.icon}</span>
                      <span className="flex-1 text-sm font-medium">{section.title}</span>
                      {isComplete && (
                        <CheckCircleIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-green-500'}`} />
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Form Content */}
          <div className="col-span-9">
            <form onSubmit={handleSubmit} className="space-y-6">
              {TRANSFORMER_CONFIG.sections.map((section) => (
                <div
                  key={section.id}
                  id={section.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 transition-all ${
                    activeSection === section.id 
                      ? 'border-blue-500 dark:border-blue-400' 
                      : 'border-transparent'
                  }`}
                  style={{ display: activeSection === section.id ? 'block' : 'none' }}
                >
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-3xl">{section.icon}</span>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {section.title}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    {section.fields.map((field) => (
                      <div
                        key={field.id}
                        className={field.type === 'multiselect' ? 'col-span-2' : 'col-span-1'}
                      >
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>

                        {field.type === 'text' || field.type === 'number' ? (
                          <input
                            type={field.type}
                            value={formData[field.id] || field.default || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            required={field.required}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={formData[field.id] || field.default || ''}
                            onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            required={field.required}
                            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">Select {field.label}</option>
                            {field.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'multiselect' ? (
                          <div className="grid grid-cols-2 gap-3">
                            {field.options.map((option) => (
                              <label
                                key={option}
                                className="flex items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={(formData[field.id] || field.default || []).includes(option)}
                                  onChange={() => handleMultiSelect(field.id, option)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">{option}</span>
                              </label>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        const currentIndex = TRANSFORMER_CONFIG.sections.findIndex(s => s.id === section.id);
                        if (currentIndex > 0) {
                          setActiveSection(TRANSFORMER_CONFIG.sections[currentIndex - 1].id);
                        }
                      }}
                      disabled={TRANSFORMER_CONFIG.sections.findIndex(s => s.id === section.id) === 0}
                      className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const currentIndex = TRANSFORMER_CONFIG.sections.findIndex(s => s.id === section.id);
                        if (currentIndex < TRANSFORMER_CONFIG.sections.length - 1) {
                          setActiveSection(TRANSFORMER_CONFIG.sections[currentIndex + 1].id);
                        }
                      }}
                      disabled={TRANSFORMER_CONFIG.sections.findIndex(s => s.id === section.id) === TRANSFORMER_CONFIG.sections.length - 1}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next Section
                    </button>
                  </div>
                </div>
              ))}

              {/* Additional Requirements */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-4">
                  📋 Additional Requirements
                </h3>
                <ul className="space-y-2">
                  {TRANSFORMER_CONFIG.additionalRequirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-blue-800 dark:text-blue-200">
                      <span className="text-blue-600 mt-0.5">✓</span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransformerDataSheet;
