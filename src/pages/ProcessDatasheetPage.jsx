import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BeakerIcon,
  CircleStackIcon,
  TableCellsIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  CubeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

/**
 * Process Data Sheet Page
 * Central hub for all process engineering data sheet functionality
 * Follows the same design pattern as Piping Data Sheets for consistency
 */
const ProcessDatasheetPage = () => {
  const navigate = useNavigate();

  // Soft-coded data sheet types configuration for Process Engineering
  const dataSheetTypes = [
    {
      id: 'pump_hydraulic',
      name: 'Pump Hydraulic Calculation',
      description: 'Advanced pump selection and hydraulic calculations with AI-powered optimization',
      icon: ArrowPathIcon,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      path: '/engineering/process/datasheet/pfd',
      badge: 'AI Powered',
      features: [
        'Pump sizing & selection',
        'Head & NPSH calculations',
        'Power & efficiency analysis',
        'Pump curve matching',
        'System curve analysis'
      ]
    },
    {
      id: 'heat_material_balance',
      name: 'Heat & Material Balance',
      description: 'Comprehensive heat and material balance calculations for process streams',
      icon: BeakerIcon,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      path: '/engineering/process/datasheet/hmb',
      badge: 'Coming Soon',
      disabled: true,
      features: [
        'Stream composition tracking',
        'Energy balance calculations',
        'Component mass balance',
        'Thermodynamic properties',
        'Export to simulation tools'
      ]
    },
    {
      id: 'equipment_datasheet',
      name: 'Equipment Datasheets',
      description: 'Manage and generate datasheets for process equipment and machinery',
      icon: CubeIcon,
      color: 'emerald',
      gradient: 'from-emerald-500 to-emerald-600',
      path: '/engineering/process/datasheet/equipment',
      badge: 'Coming Soon',
      disabled: true,
      features: [
        'Pumps & compressors',
        'Heat exchangers',
        'Vessels & tanks',
        'Rotating equipment',
        'Design specifications'
      ]
    },
    {
      id: 'stream_tables',
      name: 'Stream Tables',
      description: 'Create and manage detailed stream tables for process flows',
      icon: TableCellsIcon,
      color: 'amber',
      gradient: 'from-amber-500 to-amber-600',
      path: '/engineering/process/datasheet/streams',
      badge: 'Coming Soon',
      disabled: true,
      features: [
        'Stream properties',
        'Composition analysis',
        'Temperature & pressure',
        'Flow rates',
        'Phase information'
      ]
    },
    {
      id: 'process_simulation',
      name: 'Process Simulation Data',
      description: 'Integration with process simulation tools and data exchange',
      icon: ChartBarIcon,
      color: 'cyan',
      gradient: 'from-cyan-500 to-cyan-600',
      path: '/engineering/process/datasheet/simulation',
      badge: 'Coming Soon',
      disabled: true,
      features: [
        'Simulation data import/export',
        'Model validation',
        'Optimization studies',
        'Sensitivity analysis',
        'Case comparison'
      ]
    },
    {
      id: 'utility_summary',
      name: 'Utility Summary',
      description: 'Track and analyze utility consumption across the process plant',
      icon: CircleStackIcon,
      color: 'rose',
      gradient: 'from-rose-500 to-rose-600',
      path: '/engineering/process/datasheet/utilities',
      badge: 'Coming Soon',
      disabled: true,
      features: [
        'Steam consumption',
        'Cooling water requirements',
        'Electrical load',
        'Instrument air',
        'Cost estimation'
      ]
    }
  ];

  const handleNavigate = (type) => {
    if (!type.disabled) {
      navigate(type.path);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Process Data Sheets
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive process engineering data management and analysis system
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              Process Engineering
            </span>
          </div>
        </div>
      </div>

      {/* Data Sheet Cards Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dataSheetTypes.map((type) => {
            const IconComponent = type.icon;
            const isDisabled = type.disabled || false;

            return (
              <div
                key={type.id}
                className={`
                  relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden
                  transition-all duration-300
                  ${isDisabled 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'hover:shadow-2xl hover:-translate-y-1 cursor-pointer'}
                `}
                onClick={() => handleNavigate(type)}
              >
                {/* Gradient Header */}
                <div className={`h-2 bg-gradient-to-r ${type.gradient}`} />
                
                {/* Card Content */}
                <div className="p-6">
                  {/* Icon and Title */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`
                        p-3 rounded-lg bg-gradient-to-r ${type.gradient} 
                        ${isDisabled ? 'opacity-50' : ''}
                      `}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {type.name}
                        </h3>
                        {type.badge && (
                          <span className={`
                            inline-block px-2 py-1 text-xs font-medium rounded-full mt-1
                            ${type.badge === 'AI Powered' 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
                          `}>
                            {type.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {type.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Key Features:
                    </p>
                    <ul className="space-y-1">
                      {type.features.slice(0, 3).map((feature, idx) => (
                        <li 
                          key={idx} 
                          className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Button */}
                  {!isDisabled && (
                    <button
                      className={`
                        w-full py-3 px-4 rounded-lg font-medium
                        bg-gradient-to-r ${type.gradient}
                        text-white hover:shadow-lg
                        transition-all duration-300
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${type.color}-500
                      `}
                      onClick={() => handleNavigate(type)}
                    >
                      Open {type.name}
                    </button>
                  )}
                  
                  {isDisabled && (
                    <div className="w-full py-3 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-center font-medium">
                      Coming Soon
                    </div>
                  )}
                </div>

                {/* Disabled Overlay */}
                {isDisabled && (
                  <div className="absolute inset-0 bg-gray-900/5 dark:bg-gray-900/20 backdrop-blur-[0.5px]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Info Card */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                About Process Data Sheets
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                This centralized hub provides access to all process engineering data sheet functionality. 
                Start with <strong>Pump Hydraulic Calculation</strong> for AI-powered pump sizing and optimization, 
                or explore other modules as they become available. Each module is designed to streamline 
                your process engineering workflow with intelligent automation and comprehensive data management.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessDatasheetPage;
