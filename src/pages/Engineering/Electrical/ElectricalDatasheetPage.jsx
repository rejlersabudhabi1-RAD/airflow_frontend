import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BoltIcon,
  CpuChipIcon,
  CircleStackIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

/**
 * Electrical Data Sheet Page
 * SOFT-CODED: Central hub for Smart Datasheet Generator technical data sheets
 * Follows the same design pattern as Process Datasheets for consistency
 * 
 * Current Focus:
 * - Transformer (Power and Distribution)
 * - Emergency Diesel Generator
 * - 11KV Switchgear
 */
const ElectricalDatasheetPage = () => {
  const navigate = useNavigate();

  // SOFT-CODED: Electrical Technical Data Sheet Configuration
  const dataSheetTypes = [
    {
      id: 'transformer',
      name: 'Transformer (Power & Distribution)',
      fullName: 'Technical Data Sheet for Transformer (Power and Distribution)',
      description: 'Comprehensive technical specifications for power and distribution transformers including ratings, impedance, losses, and protection requirements',
      icon: BoltIcon,
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600',
      path: '/engineering/electrical/datasheet/transformer',
      badge: 'Active',
      disabled: false,
      features: [
        'Transformer ratings & voltage levels',
        'Impedance & loss calculations',
        'Cooling system specifications',
        'Protection & control requirements',
        'Standards compliance (IEC/ADNOC)'
      ],
      specifications: [
        'Primary & Secondary Voltage',
        'Rated Power (kVA/MVA)',
        'Vector Group & Connection',
        'Impedance Voltage (%)',
        'No-load & Load Losses',
        'Insulation Class & Temperature Rise'
      ]
    },
    {
      id: 'diesel_generator',
      name: 'Emergency Diesel Generator',
      fullName: 'Technical Data Sheet for Emergency Diesel Generator',
      description: 'Complete technical specifications for emergency diesel generator sets including engine, alternator, control panel, and auxiliary systems',
      icon: CpuChipIcon,
      color: 'orange',
      gradient: 'from-orange-500 to-red-600',
      path: '/engineering/electrical/datasheet/diesel-generator',
      badge: 'Active',
      disabled: false,
      features: [
        'Generator capacity & ratings',
        'Engine specifications & performance',
        'Control & monitoring systems',
        'Fuel system & consumption',
        'Environmental & acoustic requirements'
      ],
      specifications: [
        'Rated Power Output (kW/kVA)',
        'Voltage & Frequency',
        'Engine Make & Model',
        'Fuel Consumption Rate',
        'Starting System & Battery',
        'Noise Level & Enclosure Type'
      ]
    },
    {
      id: 'switchgear_11kv',
      name: '11KV Switchgear',
      fullName: 'Technical Data Sheet for 11KV Switchgear',
      description: 'Detailed technical specifications for 11KV metal-clad switchgear including circuit breakers, protection relays, metering, and control systems',
      icon: CircleStackIcon,
      color: 'purple',
      gradient: 'from-purple-500 to-pink-600',
      path: '/engineering/electrical/datasheet/switchgear-11kv',
      badge: 'Active',
      disabled: false,
      features: [
        '11KV circuit breaker specifications',
        'Protection relay settings',
        'Busbar & insulation ratings',
        'Metering & monitoring systems',
        'Type testing requirements'
      ],
      specifications: [
        'Rated Voltage & Current',
        'Short Circuit Rating (kA)',
        'Circuit Breaker Type & Mechanism',
        'Protection Relay Configuration',
        'Busbar Material & Rating',
        'IP Rating & Arc Flash Protection'
      ]
    }
  ];

  const handleNavigate = (type) => {
    if (!type.disabled) {
      navigate(type.path);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/engineering/electrical')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Smart Datasheet Generator
          </button>
          
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <BoltIcon className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Electrical Technical Data Sheets</h1>
                <p className="text-gray-600 mt-1">Comprehensive technical specifications for electrical power equipment</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/engineering/electrical/datasheet/smart-generator')}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full text-sm font-semibold shadow-lg whitespace-nowrap hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                ⚡ Smart Datasheet Generator
              </button>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-3">
              <BoltIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">ADNOC-Compliant Datasheets</h3>
                <p className="text-sm text-blue-800">
                  Comprehensive technical datasheets for electrical power equipment including transformers, generators, and switchgear
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-blue-700">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{dataSheetTypes.length}</span>
                    <span>Active Datasheets</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">3</span>
                    <span>Equipment Types</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">100%</span>
                    <span>ADNOC Compliant</span>
                  </div>
                </div>
              </div>
            </div>
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
                  relative bg-white rounded-xl shadow-lg overflow-hidden
                  border border-gray-200
                  transition-all duration-300
                  ${isDisabled 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'hover:shadow-2xl hover:-translate-y-2 cursor-pointer hover:border-transparent'}
                `}
                onClick={() => handleNavigate(type)}
              >
                {/* Gradient Header */}
                <div className={`h-3 bg-gradient-to-r ${type.gradient}`} />
                
                {/* Card Content */}
                <div className="p-6">
                  {/* Icon and Title */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={`
                        p-4 rounded-xl bg-gradient-to-r ${type.gradient} 
                        shadow-lg transform transition-transform duration-300
                        ${isDisabled ? 'opacity-50' : 'group-hover:scale-110'}
                      `}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {type.name}
                        </h3>
                        {type.badge && (
                          <span className={`
                            inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full
                            ${type.badge === 'Active' 
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'}
                          `}>
                            <span className={`w-2 h-2 rounded-full ${type.badge === 'Active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                            {type.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 mb-5 leading-relaxed text-sm">
                    {type.description}
                  </p>

                  {/* Features List */}
                  <div className="space-y-3 mb-5">
                    <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                      Key Features:
                    </p>
                    <ul className="space-y-2">
                      {type.features.map((feature, idx) => (
                        <li 
                          key={idx} 
                          className="text-sm text-gray-600 flex items-start gap-2 pl-2"
                        >
                          <span className="text-blue-500 mt-0.5">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Specifications Preview */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-5">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      Technical Specifications Include:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {type.specifications.slice(0, 3).map((spec, idx) => (
                        <span 
                          key={idx}
                          className="text-xs px-2 py-1 bg-white text-gray-600 rounded border border-gray-200"
                        >
                          {spec}
                        </span>
                      ))}
                      {type.specifications.length > 3 && (
                        <span className="text-xs px-2 py-1 text-gray-500">
                          +{type.specifications.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  {!isDisabled && (
                    <button
                      className={`
                        w-full py-3 px-4 rounded-lg font-semibold
                        bg-gradient-to-r ${type.gradient}
                        text-white shadow-lg hover:shadow-xl
                        transform transition-all duration-300 hover:scale-[1.02]
                        focus:outline-none focus:ring-4 focus:ring-${type.color}-500/50
                      `}
                      onClick={() => handleNavigate(type)}
                    >
                      Open Datasheet →
                    </button>
                  )}
                  
                  {isDisabled && (
                    <div className="w-full py-3 px-4 rounded-lg bg-gray-100 text-gray-500 text-center font-medium">
                      Coming Soon
                    </div>
                  )}
                </div>

                {/* Disabled Overlay */}
                {isDisabled && (
                  <div className="absolute inset-0 bg-gray-900/5 backdrop-blur-[0.5px]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-md">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-blue-900 mb-2">
                About Electrical Technical Data Sheets
              </h4>
              <p className="text-sm text-blue-800 leading-relaxed">
                This module provides comprehensive technical data sheets for critical electrical power equipment. 
                Each datasheet template is designed to comply with ADNOC standards and international specifications (IEC, IEEE). 
                The system facilitates standardized documentation for {dataSheetTypes.map(t => t.name).join(', ')}, 
                ensuring consistency across all Smart Datasheet Generator deliverables.
              </p>
            </div>
          </div>
        </div>

        {/* Standards Compliance Banner */}
        <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-md">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-green-900 mb-2">
                Standards & Compliance
              </h4>
              <p className="text-sm text-green-800 leading-relaxed">
                All datasheets are designed to meet ADNOC engineering standards and international codes (IEC, IEEE, BS). 
                Each template includes mandatory technical parameters, performance specifications, testing requirements, 
                and documentation formats required for project approval and procurement processes.
              </p>
              <div className="flex gap-3 mt-4">
                <span className="px-3 py-1 bg-white text-green-700 rounded-full text-xs font-semibold border border-green-200">
                  ADNOC Compliant
                </span>
                <span className="px-3 py-1 bg-white text-green-700 rounded-full text-xs font-semibold border border-green-200">
                  IEC Standards
                </span>
                <span className="px-3 py-1 bg-white text-green-700 rounded-full text-xs font-semibold border border-green-200">
                  IEEE Standards
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectricalDatasheetPage;
