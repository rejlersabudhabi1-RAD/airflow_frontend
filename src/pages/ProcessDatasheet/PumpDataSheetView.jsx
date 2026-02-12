import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/api.service';
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

/**
 * Pump Data Sheet View Component
 * Displays pump calculation data in the exact format of "Pump Data Sheet.xlsx" template
 * Soft-coded structure matching the template for professional presentation
 */
const PumpDataSheetView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pumpData, setPumpData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPumpData();
  }, [id]);

  const fetchPumpData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/process-datasheet/pump-calculations/${id}/`);
      console.log('📊 Fetched pump data:', response.data);
      setPumpData(response.data);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching pump data:', err);
      setError('Failed to load pump data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await apiClient.get(
        `/process-datasheet/pump-calculations/${id}/generate_datasheet/`,
        { responseType: 'blob' }
      );
      
      // Create filename
      const filename = `Pump_Data_Sheet_${pumpData.document_no || 'N/A'}_${pumpData.tag_no || 'N/A'}.xlsx`;
      
      // Download file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading Excel:', err);
      alert('Failed to download Excel file');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await apiClient.get(
        `/process-datasheet/pump-calculations/${id}/generate_pdf/`,
        { responseType: 'blob' }
      );
      
      const filename = `Pump_Data_Sheet_${pumpData.document_no || 'N/A'}_${pumpData.tag_no || 'N/A'}.pdf`;
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Failed to download PDF file');
    }
  };

  // Soft-coded helper to safely display values
  const displayValue = (value, defaultValue = 'N/A') => {
    if (value === null || value === undefined || value === '') return defaultValue;
    // Handle objects - convert to string representation
    if (typeof value === 'object') {
      // If it's a user object with email, use that
      if (value.email) return value.email;
      // If it's a user object with name, use that
      if (value.name) return value.name;
      // If it's a user object with username, use that
      if (value.username) return value.username;
      // Otherwise, return default
      return defaultValue;
    }
    return String(value);
  };

  // Helper to display user objects safely
  const displayUser = (userObject, defaultValue = 'N/A') => {
    if (!userObject || typeof userObject !== 'object') return defaultValue;
    // Try different properties in order of preference
    return userObject.email || userObject.name || userObject.username || userObject.first_name || defaultValue;
  };

  // Format number with precision
  const formatNumber = (value, decimals = 2) => {
    if (!value || isNaN(value)) return 'N/A';
    return parseFloat(value).toFixed(decimals);
  };

  // Helper to get value with fallback from old fields
  const getValueWithFallback = (newValue, oldValue, defaultValue = 'N/A') => {
    // First try new field
    if (newValue !== null && newValue !== undefined && newValue !== '') {
      return newValue;
    }
    // Fallback to old field
    if (oldValue !== null && oldValue !== undefined && oldValue !== '') {
      return oldValue;
    }
    return defaultValue;
  };

  // Helper to safely display liquid characteristics with fallback
  const getLiquidType = () => {
    return displayValue(getValueWithFallback(pumpData.liquid_type, pumpData.service));
  };

  const getVaporPressureMax = () => {
    return formatNumber(getValueWithFallback(pumpData.vapor_pressure_max, pumpData.vapor_pressure));
  };

  const getVaporPressureMin = () => {
    return formatNumber(getValueWithFallback(pumpData.vapor_pressure_min, pumpData.vapor_pressure));
  };

  const getDensityMax = () => {
    return formatNumber(getValueWithFallback(pumpData.density_max, pumpData.density));
  };

  const getDensityMin = () => {
    return formatNumber(getValueWithFallback(pumpData.density_min, pumpData.density));
  };

  const getViscosityMax = () => {
    return formatNumber(getValueWithFallback(pumpData.viscosity_max, pumpData.fluid_viscosity_at_temp));
  };

  const getViscosityMin = () => {
    return formatNumber(getValueWithFallback(pumpData.viscosity_min, pumpData.fluid_viscosity_at_temp));
  };

  const getTemperatureMax = () => {
    return formatNumber(getValueWithFallback(pumpData.temperature_max, pumpData.temperature));
  };

  const getTemperatureMin = () => {
    return formatNumber(getValueWithFallback(pumpData.temperature_min, pumpData.temperature));
  };

  // Helper to safely display operating conditions with fallback
  const getSuctionPressureMax = () => {
    return formatNumber(getValueWithFallback(pumpData.suction_pressure_max, pumpData.total_suction_pressure));
  };

  const getSuctionPressureNormal = () => {
    return formatNumber(getValueWithFallback(pumpData.suction_pressure_normal, pumpData.total_suction_pressure));
  };

  const getSuctionPressureMin = () => {
    return formatNumber(getValueWithFallback(pumpData.suction_pressure_min, pumpData.total_suction_pressure));
  };

  const getDischargePressureMax = () => {
    return formatNumber(getValueWithFallback(pumpData.discharge_pressure_max, pumpData.total_discharge_pressure));
  };

  const getDischargePressureNormal = () => {
    return formatNumber(getValueWithFallback(pumpData.discharge_pressure_normal, pumpData.total_discharge_pressure));
  };

  const getDischargePressureMin = () => {
    return formatNumber(getValueWithFallback(pumpData.discharge_pressure_min, pumpData.total_discharge_pressure));
  };

  const getDifferentialPressureMax = () => {
    return formatNumber(getValueWithFallback(pumpData.differential_pressure_max, pumpData.differential_pressure));
  };

  const getDifferentialPressureNormal = () => {
    return formatNumber(getValueWithFallback(pumpData.differential_pressure_normal, pumpData.differential_pressure));
  };

  const getDifferentialPressureMin = () => {
    return formatNumber(getValueWithFallback(pumpData.differential_pressure_min, pumpData.differential_pressure));
  };

  const getDifferentialHeadMax = () => {
    return formatNumber(getValueWithFallback(pumpData.differential_head_max, pumpData.differential_head));
  };

  const getDifferentialHeadNormal = () => {
    return formatNumber(getValueWithFallback(pumpData.differential_head_normal, pumpData.differential_head));
  };

  const getDifferentialHeadMin = () => {
    return formatNumber(getValueWithFallback(pumpData.differential_head_min, pumpData.differential_head));
  };

  // NPSH fallback helpers
  const getNpshAvailableMax = () => {
    return formatNumber(getValueWithFallback(pumpData.npsh_available_max, pumpData.npsha));
  };

  const getNpshAvailableMin = () => {
    return formatNumber(getValueWithFallback(pumpData.npsh_available_min, pumpData.npsha));
  };

  const getNpshRequired = () => {
    return formatNumber(pumpData.npsh_required);
  };

  // Pump Performance fallback helpers
  const getPumpEfficiencyMax = () => {
    return formatNumber(getValueWithFallback(pumpData.pump_efficiency_max, pumpData.pump_efficiency));
  };

  const getPumpEfficiencyNormal = () => {
    return formatNumber(getValueWithFallback(pumpData.pump_efficiency_normal, pumpData.pump_efficiency));
  };

  const getPumpEfficiencyMin = () => {
    return formatNumber(getValueWithFallback(pumpData.pump_efficiency_min, pumpData.pump_efficiency));
  };

  const getBhpMax = () => {
    return formatNumber(getValueWithFallback(pumpData.bhp_max, pumpData.break_horse_power));
  };

  const getBhpNormal = () => {
    return formatNumber(getValueWithFallback(pumpData.bhp_normal, pumpData.break_horse_power));
  };

  const getBhpMin = () => {
    return formatNumber(getValueWithFallback(pumpData.bhp_min, pumpData.break_horse_power));
  };

  const getAbsorbedPowerMax = () => {
    return formatNumber(getValueWithFallback(pumpData.absorbed_power_max, pumpData.power_consumption));
  };

  const getAbsorbedPowerNormal = () => {
    return formatNumber(getValueWithFallback(pumpData.absorbed_power_normal, pumpData.power_consumption));
  };

  const getAbsorbedPowerMin = () => {
    return formatNumber(getValueWithFallback(pumpData.absorbed_power_min, pumpData.power_consumption));
  };

  // Construction Materials fallback helpers with intelligent defaults
  const getDefaultMaterial = (materialType, service = '') => {
    const serviceLower = (service || '').toLowerCase();
    
    // Material selection based on service type
    const materialDefaults = {
      // Corrosive/Chemical services
      corrosive: {
        casing: 'Stainless Steel 316',
        impeller: 'Stainless Steel 316',
        shaft: 'Stainless Steel 316',
        bearings: 'Rolling Element Bearings (Ceramic)',
        mechanical_seal: 'Dual Mechanical Seal (Silicon Carbide/Silicon Carbide)'
      },
      // Seawater/Cooling water services  
      seawater: {
        casing: 'Duplex Stainless Steel',
        impeller: 'Duplex Stainless Steel',
        shaft: 'Stainless Steel 316',
        bearings: 'Rolling Element Bearings (Stainless Steel)',
        mechanical_seal: 'Mechanical Seal (Carbon/Ceramic)'
      },
      // Clean water/General purpose
      water: {
        casing: 'Cast Iron',
        impeller: 'Bronze',
        shaft: 'Carbon Steel',
        bearings: 'Rolling Element Bearings',
        mechanical_seal: 'Mechanical Seal (Carbon/Ceramic)'
      },
      // Default for unknown services
      default: {
        casing: 'Cast Iron / Ductile Iron',
        impeller: 'Cast Iron / Bronze',
        shaft: 'Carbon Steel / Stainless Steel',
        bearings: 'Rolling Element Bearings',
        mechanical_seal: 'Mechanical Seal (Standard)'
      }
    };

    // Determine service category
    let serviceCategory = 'default';
    if (serviceLower.includes('acid') || serviceLower.includes('chemical') || 
        serviceLower.includes('corrosive') || serviceLower.includes('caustic')) {
      serviceCategory = 'corrosive';
    } else if (serviceLower.includes('seawater') || serviceLower.includes('sea water') || 
               serviceLower.includes('cooling water') || serviceLower.includes('brine')) {
      serviceCategory = 'seawater';
    } else if (serviceLower.includes('water') || serviceLower.includes('potable') || 
               serviceLower.includes('fresh')) {
      serviceCategory = 'water';
    }

    return materialDefaults[serviceCategory][materialType] || materialDefaults.default[materialType];
  };

  const getCasing = () => {
    if (pumpData.casing) return displayValue(pumpData.casing);
    return displayValue(getDefaultMaterial('casing', pumpData.service || pumpData.liquid_type));
  };

  const getImpeller = () => {
    if (pumpData.impeller) return displayValue(pumpData.impeller);
    return displayValue(getDefaultMaterial('impeller', pumpData.service || pumpData.liquid_type));
  };

  const getShaft = () => {
    if (pumpData.shaft) return displayValue(pumpData.shaft);
    return displayValue(getDefaultMaterial('shaft', pumpData.service || pumpData.liquid_type));
  };

  const getBearings = () => {
    if (pumpData.bearings) return displayValue(pumpData.bearings);
    return displayValue(getDefaultMaterial('bearings', pumpData.service || pumpData.liquid_type));
  };

  const getMechanicalSeal = () => {
    if (pumpData.mechanical_seal) return displayValue(pumpData.mechanical_seal);
    return displayValue(getDefaultMaterial('mechanical_seal', pumpData.service || pumpData.liquid_type));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading Pump Data Sheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!pumpData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Actions */}
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Form
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Download Excel
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Download PDF
            </button>
          </div>
        </div>

        {/* Main Data Sheet - Matching Template Structure */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Cover Sheet Section */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white px-8 py-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold mb-2">PROCESS DATA SHEET</h1>
                <p className="text-blue-100">Pump Hydraulic Calculation</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-100 mb-1">Page 1 of 2</div>
                <div className="bg-white text-blue-900 px-4 py-1 rounded font-semibold">
                  {displayValue(pumpData.document_class, 'Confidential')}
                </div>
              </div>
            </div>
            
            {/* Document Header Info */}
            <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
              <div>
                <div className="text-blue-100 mb-1">Document No.</div>
                <div className="text-xl font-semibold">{displayValue(pumpData.document_no)}</div>
              </div>
              <div>
                <div className="text-blue-100 mb-1">Revision No.</div>
                <div className="text-xl font-semibold">{displayValue(pumpData.revision, '0')}</div>
              </div>
              <div>
                <div className="text-blue-100 mb-1">Tag No.</div>
                <div className="text-xl font-semibold">{displayValue(pumpData.tag_no)}</div>
              </div>
              <div>
                <div className="text-blue-100 mb-1">Date</div>
                <div className="text-xl font-semibold">
                  {pumpData.created_at ? new Date(pumpData.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Sheet 1 - Main Data Content */}
          <div className="p-8">
            {/* Project Information Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
                PROJECT INFORMATION
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Company Name</div>
                    <div className="font-semibold text-gray-800">{displayValue(pumpData.company_name, 'Rejlers')}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Site</div>
                    <div className="font-semibold text-gray-800">{displayValue(pumpData.site)}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">No. Required</div>
                    <div className="font-semibold text-gray-800">1</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Manufacturer</div>
                    <div className="font-semibold text-gray-800">{displayValue(pumpData.manufacturer)}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Unit</div>
                    <div className="font-semibold text-gray-800">{displayValue(pumpData.unit)}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Service</div>
                    <div className="font-semibold text-gray-800">{displayValue(pumpData.service)}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Type of Pump</div>
                    <div className="font-semibold text-gray-800">Centrifugal</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Model</div>
                    <div className="font-semibold text-gray-800">{displayValue(pumpData.model)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Liquid Characteristics Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
                LIQUID CHARACTERISTICS
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Parameter</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Maximum</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Minimum</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-800">Liquid Type / Service</td>
                      <td colSpan="2" className="px-4 py-3 text-center text-gray-700">{getLiquidType()}</td>
                      <td className="px-4 py-3 text-center text-gray-500">-</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">Vapor Pressure</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getVaporPressureMax()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getVaporPressureMin()}</td>
                      <td className="px-4 py-3 text-center text-gray-500">bar</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-800">Density</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getDensityMax()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getDensityMin()}</td>
                      <td className="px-4 py-3 text-center text-gray-500">kg/m³</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">Viscosity</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getViscosityMax()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getViscosityMin()}</td>
                      <td className="px-4 py-3 text-center text-gray-500">cP</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-800">Temperature</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getTemperatureMax()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getTemperatureMin()}</td>
                      <td className="px-4 py-3 text-center text-gray-500">°C</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Flow Rate and Operating Conditions */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
                OPERATING CONDITIONS
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Parameter</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Maximum</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Normal</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Minimum</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-800">Flow Rate</td>
                      <td className="px-4 py-3 text-center text-gray-700">{formatNumber(pumpData.flow_rate_max)}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{formatNumber(pumpData.flow_rate_normal)}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{formatNumber(pumpData.flow_rate_min)}</td>
                      <td className="px-4 py-3 text-center text-gray-500">m³/h</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">Suction Pressure</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getSuctionPressureMax()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getSuctionPressureNormal()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getSuctionPressureMin()}</td>
                      <td className="px-4 py-3 text-center text-gray-500">bar</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-800">Discharge Pressure</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getDischargePressureMax()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getDischargePressureNormal()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getDischargePressureMin()}</td>
                      <td className="px-4 py-3 text-center text-gray-500">bar</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">Differential Pressure</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getDifferentialPressureMax()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getDifferentialPressureNormal()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getDifferentialPressureMin()}</td>
                      <td className="px-4 py-3 text-center text-gray-500">bar</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-800">Differential Head</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getDifferentialHeadMax()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getDifferentialHeadNormal()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getDifferentialHeadMin()}</td>
                      <td className="px-4 py-3 text-center text-gray-500">m</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* NPSH Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
                NET POSITIVE SUCTION HEAD (NPSH)
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200">
                  <div className="text-sm text-blue-600 font-semibold mb-2">NPSH Available</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Maximum</div>
                      <div className="text-2xl font-bold text-gray-800">{getNpshAvailableMax()}</div>
                      <div className="text-xs text-gray-500 mt-1">m</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Minimum</div>
                      <div className="text-2xl font-bold text-gray-800">{getNpshAvailableMin()}</div>
                      <div className="text-xs text-gray-500 mt-1">m</div>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg border-2 border-orange-200">
                  <div className="text-sm text-orange-600 font-semibold mb-2">NPSH Required</div>
                  <div className="text-2xl font-bold text-gray-800">{getNpshRequired()}</div>
                  <div className="text-xs text-gray-500 mt-1">m</div>
                </div>
              </div>
            </div>

            {/* Pump Performance Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
                PUMP PERFORMANCE
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Parameter</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Maximum</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Normal</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Minimum</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-800">Pump Efficiency</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getPumpEfficiencyMax()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getPumpEfficiencyNormal()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getPumpEfficiencyMin()}</td>
                      <td className="px-4 py-3 text-center text-gray-500">%</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">BHP (Brake Horsepower)</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getBhpMax()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getBhpNormal()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getBhpMin()}</td>
                      <td className="px-4 py-3 text-center text-gray-500">HP</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-800">Absorbed Power</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getAbsorbedPowerMax()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getAbsorbedPowerNormal()}</td>
                      <td className="px-4 py-3 text-center text-gray-700">{getAbsorbedPowerMin()}</td>
                      <td className="px-4 py-3 text-center text-gray-500">kW</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Driver/Motor Data Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
                DRIVER / MOTOR DATA
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Driver Type</div>
                    <div className="font-semibold text-gray-800">{displayValue(pumpData.driver_type, 'Electric Motor')}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Motor Rating</div>
                    <div className="font-semibold text-gray-800">{formatNumber(pumpData.motor_rating)} kW</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Motor Voltage</div>
                    <div className="font-semibold text-gray-800">{formatNumber(pumpData.motor_voltage, 0)} V</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Motor Speed</div>
                    <div className="font-semibold text-gray-800">{formatNumber(pumpData.motor_speed, 0)} RPM</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Motor Efficiency</div>
                    <div className="font-semibold text-gray-800">{formatNumber(pumpData.motor_efficiency)} %</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Motor Classification</div>
                    <div className="font-semibold text-gray-800">{displayValue(pumpData.motor_classification)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Construction Materials Section */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
                CONSTRUCTION MATERIALS
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Casing</div>
                    <div className="font-semibold text-gray-800">{getCasing()}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Impeller</div>
                    <div className="font-semibold text-gray-800">{getImpeller()}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Shaft</div>
                    <div className="font-semibold text-gray-800">{getShaft()}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Bearings</div>
                    <div className="font-semibold text-gray-800">{getBearings()}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500 mb-1">Mechanical Seal</div>
                    <div className="font-semibold text-gray-800">{getMechanicalSeal()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes and Remarks Section */}
            {pumpData.general_notes && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-blue-600">
                  NOTES AND REMARKS
                </h2>
                <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
                  <p className="text-gray-700 whitespace-pre-wrap">{String(pumpData.general_notes)}</p>
                </div>
              </div>
            )}

            {/* Approval/Signature Section */}
            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <div className="grid grid-cols-3 gap-6 text-sm">
                <div className="text-center">
                  <div className="border-b-2 border-gray-300 pb-2 mb-2 text-gray-500">Prepared By</div>
                  <div className="font-semibold text-gray-800">
                    {displayUser(pumpData.prepared_by)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="border-b-2 border-gray-300 pb-2 mb-2 text-gray-500">Reviewed By</div>
                  <div className="font-semibold text-gray-800">{displayUser(pumpData.reviewed_by)}</div>
                </div>
                <div className="text-center">
                  <div className="border-b-2 border-gray-300 pb-2 mb-2 text-gray-500">Approved By</div>
                  <div className="font-semibold text-gray-800">{displayUser(pumpData.approved_by)}</div>
                </div>
              </div>
            </div>

            {/* Template Reference Footer */}
            <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
              RAD-PR-TMP-0001, Rev 0 | Template: Pump Data Sheet.xlsx
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PumpDataSheetView;
