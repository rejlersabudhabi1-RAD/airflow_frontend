import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HomeModernIcon,
  Square3Stack3DIcon,
  BuildingOffice2Icon,
  CircleStackIcon,
  BeakerIcon,
  CubeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

/**
 * Civil Data Sheet Page
 * Central hub for all civil engineering data sheet functionality
 * Follows the same design pattern as Process, Instrument, and Electrical Data Sheets for consistency
 */
const CivilDatasheetPage = () => {
  const navigate = useNavigate();

  // Soft-coded data sheet types configuration for Civil Engineering
  const dataSheetTypes = [
    {
      id: 'foundation_design',
      name: 'Foundation Design',
      description: 'Foundation calculations, bearing capacity analysis, and structural design specifications',
      icon: BuildingOffice2Icon,
      color: 'gray',
      gradient: 'from-gray-500 to-slate-600',
      path: '/engineering/civil/datasheet/foundation',
      badge: 'Coming Soon',
      disabled: true,
      features: [
        'Bearing capacity calculations',
        'Settlement analysis',
        'Foundation type selection',
        'Load distribution',
        'Reinforcement design'
      ]
    },
    {
      id: 'structural_design',
      name: 'Structural Design',
      description: 'Structural analysis, member sizing, and reinforced concrete design calculations',
      icon: Square3Stack3DIcon,
      color: 'gray',
      gradient: 'from-slate-500 to-gray-600',
      path: '/engineering/civil/datasheet/structural',
      badge: 'Coming Soon',
      disabled: true,
      features: [
        'Beam & column design',
        'Slab calculations',
        'Load analysis (DL, LL, WL)',
        'Moment & shear design',
        'Deflection checks'
      ]
    },
    {
      id: 'concrete_mix',
      name: 'Concrete Mix Design',
      description: 'Concrete mix proportioning, strength requirements, and material specifications',
      icon: BeakerIcon,
      color: 'gray',
      gradient: 'from-gray-600 to-zinc-600',
      path: '/engineering/civil/datasheet/concrete',
      badge: 'Coming Soon',
      disabled: true,
      features: [
        'Mix design calculations',
        'Cement content determination',
        'Water-cement ratio',
        'Aggregate proportioning',
        'Strength requirements'
      ]
    },
    {
      id: 'soil_investigation',
      name: 'Soil Investigation',
      description: 'Geotechnical analysis, soil properties, and foundation recommendations',
      icon: CubeIcon,
      color: 'gray',
      gradient: 'from-zinc-500 to-gray-600',
      path: '/engineering/civil/datasheet/soil',
      badge: 'Coming Soon',
      disabled: true,
      features: [
        'Soil classification',
        'Bearing capacity',
        'Shear strength parameters',
        'Consolidation properties',
        'Soil test analysis'
      ]
    },
    {
      id: 'steel_structure',
      name: 'Steel Structure Design',
      description: 'Steel member design, connection details, and structural steel specifications',
      icon: Square3Stack3DIcon,
      color: 'gray',
      gradient: 'from-gray-500 to-slate-700',
      path: '/engineering/civil/datasheet/steel',
      badge: 'Coming Soon',
      disabled: true,
      features: [
        'Steel member sizing',
        'Connection design',
        'Buckling analysis',
        'Welding specifications',
        'Material selection'
      ]
    },
    {
      id: 'pavement_design',
      name: 'Pavement Design',
      description: 'Road and pavement design calculations, layer thickness, and material specifications',
      icon: HomeModernIcon,
      color: 'gray',
      gradient: 'from-slate-500 to-gray-700',
      path: '/engineering/civil/datasheet/pavement',
      badge: 'Coming Soon',
      disabled: true,
      features: [
        'Flexible pavement design',
        'Rigid pavement design',
        'Layer thickness calculations',
        'Traffic load analysis',
        'Material specifications'
      ]
    },
    {
      id: 'quantity_estimation',
      name: 'Quantity Estimation',
      description: 'Bill of quantities, material takeoff, and cost estimation calculations',
      icon: DocumentTextIcon,
      color: 'gray',
      gradient: 'from-gray-600 to-slate-600',
      path: '/engineering/civil/datasheet/quantity',
      badge: 'Coming Soon',
      disabled: true,
      features: [
        'Concrete quantities',
        'Steel reinforcement',
        'Earthwork calculations',
        'Material takeoff',
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
              Civil Data Sheets
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive civil engineering design calculations and specification system
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
              Civil Engineering
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
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
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
        <div className="mt-8 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                About Civil Data Sheets
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                This centralized hub will provide access to all civil engineering data sheet functionality. 
                Comprehensive modules for foundation design, structural calculations, concrete mix design, soil investigation, 
                steel structures, pavement design, and quantity estimation are currently under development. Each module will be 
                designed to streamline your civil engineering workflow with intelligent automation, calculation tools, and 
                comprehensive data management following international standards.
              </p>
            </div>
          </div>
        </div>

        {/* Development Status Banner */}
        <div className="mt-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Under Development
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                All civil data sheet modules are currently under development and will be available soon. 
                We are building a comprehensive suite of tools to support your civil engineering design and calculation needs.
                Check back regularly for updates and new module releases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CivilDatasheetPage;
