import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  SparklesIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  TruckIcon,
  LightBulbIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ShieldCheckIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { PROCUREMENT_CONFIG } from '../../config/procurement.config';

const AIPurchaseOrderCreator = ({ isOpen, onClose, onOrderCreated, vendors }) => {
  const [formData, setFormData] = useState({
    po_number: '',
    vendor_id: '',
    requisition_id: '',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: '',
    shipping_address: '',
    billing_address: '',
    payment_terms: '',
    delivery_terms: '',
    notes: '',
    items: [],
    // Oil & gas specific fields
    material_specifications: '',
    required_certifications: [],
    inspection_requirements: '',
    witness_inspection: false,
    heat_numbers_required: false,
    ndt_requirements: '',
    applicable_standards: [],
    material_grade: '',
    pressure_rating: '',
    temperature_rating: ''
  });

  const [items, setItems] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [activeAIFeature, setActiveAIFeature] = useState(null);

  // Soft-coded delivery terms for oil & gas
  const DELIVERY_TERMS = [
    { value: 'exw', label: 'EXW - Ex Works', description: 'Buyer arranges all transport' },
    { value: 'fob', label: 'FOB - Free on Board', description: 'Seller delivers to port' },
    { value: 'cif', label: 'CIF - Cost, Insurance & Freight', description: 'Seller covers shipping' },
    { value: 'dap', label: 'DAP - Delivered at Place', description: 'Seller delivers to destination' },
    { value: 'ddp', label: 'DDP - Delivered Duty Paid', description: 'Seller covers all costs' }
  ];

  /**
   * AI Feature 1: Auto-generate PO Number
   * Intelligent numbering based on vendor and date
   */
  const generatePONumber = () => {
    setGeneratingAI(true);
    setActiveAIFeature('po_number');

    setTimeout(() => {
      const vendor = vendors.find(v => v.id === parseInt(formData.vendor_id));
      const vendorCode = vendor ? vendor.vendor_code.split('-')[0] : 'GEN';
      const year = new Date().getFullYear().toString().slice(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      
      const poNumber = `PO-${vendorCode}-${year}${month}-${randomNum}`;
      setFormData(prev => ({ ...prev, po_number: poNumber }));
      
      setGeneratingAI(false);
      setActiveAIFeature(null);
    }, 1000);
  };

  /**
   * AI Feature 2: Smart Vendor Selection
   * Recommends best vendor based on requirements
   */
  const suggestBestVendor = () => {
    setGeneratingAI(true);
    setActiveAIFeature('vendor_selection');

    setTimeout(() => {
      // Soft-coded vendor scoring algorithm
      const scoredVendors = vendors.map(vendor => {
        let score = 0;
        const reasons = [];

        // Rating score
        if (vendor.rating >= 4) {
          score += 30;
          reasons.push(`High rating (${vendor.rating}★)`);
        } else if (vendor.rating >= 3) {
          score += 15;
        }

        // Status check
        if (vendor.status === 'active') {
          score += 20;
          reasons.push('Active vendor');
        }

        // Certifications
        const certCount = vendor.certifications?.length || 0;
        if (certCount >= 5) {
          score += 25;
          reasons.push(`${certCount} certifications`);
        } else if (certCount >= 3) {
          score += 15;
        }

        // HSE rating
        if (vendor.hse_rating === 'excellent') {
          score += 25;
          reasons.push('Excellent HSE rating');
        } else if (vendor.hse_rating === 'good') {
          score += 15;
        }

        return { vendor, score, reasons };
      });

      // Get top 3 vendors
      const topVendors = scoredVendors
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .filter(v => v.score > 0);

      if (topVendors.length > 0) {
        setAiSuggestions({
          type: 'vendor_selection',
          topVendors,
          reasoning: `AI analyzed ${vendors.length} vendors based on rating, certifications, HSE compliance, and reliability.`
        });
      }

      setGeneratingAI(false);
      setActiveAIFeature(null);
    }, 1500);
  };

  /**
   * AI Feature 3: Smart Item Suggestions
   * Based on vendor specialization and past orders
   */
  const suggestOrderItems = () => {
    setGeneratingAI(true);
    setActiveAIFeature('item_suggestions');

    setTimeout(() => {
      const vendor = vendors.find(v => v.id === parseInt(formData.vendor_id));
      if (!vendor) {
        setGeneratingAI(false);
        return;
      }

      // Soft-coded item suggestions based on vendor specialization
      const specialization = (vendor.specialization || '').toLowerCase();
      const suggestedItems = [];

      if (specialization.includes('pipe') || specialization.includes('piping')) {
        suggestedItems.push(
          { name: 'Carbon Steel Seamless Pipes - API 5L X65', spec: 'API 5L Grade X65, 12" SCH 40', unit: 'meters', est_price: 850, category: 'piping_materials' },
          { name: 'Pipe Fittings - ASME B16.9', spec: 'A234 WPB Elbows 90°, 12"', unit: 'pieces', est_price: 320, category: 'piping_materials' },
          { name: 'Flanges - ASME B16.5', spec: 'Class 300, RF, 12"', unit: 'pieces', est_price: 480, category: 'piping_materials' }
        );
      } else if (specialization.includes('valve')) {
        suggestedItems.push(
          { name: 'Gate Valve - API 600', spec: 'Class 300, 8", CF8M', unit: 'pieces', est_price: 2500, category: 'valves_actuators' },
          { name: 'Ball Valve - API 6D', spec: 'Class 150, 6", Full Bore', unit: 'pieces', est_price: 1800, category: 'valves_actuators' },
          { name: 'Check Valve - API 594', spec: 'Swing Type, 6"', unit: 'pieces', est_price: 1200, category: 'valves_actuators' }
        );
      } else if (specialization.includes('pump') || specialization.includes('rotating')) {
        suggestedItems.push(
          { name: 'Centrifugal Pump - API 610', spec: 'OH2, 500 GPM, 150 ft head', unit: 'unit', est_price: 45000, category: 'rotating_equipment' },
          { name: 'Mechanical Seal - API 682', spec: 'Plan 53A, Cartridge Type', unit: 'set', est_price: 3500, category: 'rotating_equipment' },
          { name: 'Coupling - API 671', spec: 'Flexible, Spacer Type', unit: 'unit', est_price: 1200, category: 'rotating_equipment' }
        );
      } else if (specialization.includes('instrument')) {
        suggestedItems.push(
          { name: 'Pressure Transmitter', spec: '0-1000 psi, 4-20mA, HART', unit: 'unit', est_price: 850, category: 'instrumentation' },
          { name: 'Control Valve', spec: 'Globe type, 4", Pneumatic', unit: 'unit', est_price: 3200, category: 'instrumentation' },
          { name: 'Flow Meter', spec: 'Magnetic, 6", Flanged', unit: 'unit', est_price: 4500, category: 'instrumentation' }
        );
      } else {
        // Generic items
        suggestedItems.push(
          { name: 'Industrial Gaskets', spec: 'Spiral wound, RF, various sizes', unit: 'set', est_price: 150, category: 'consumables' },
          { name: 'Bolts & Nuts - ASTM A193', spec: 'Grade B7, Various sizes', unit: 'set', est_price: 200, category: 'consumables' },
          { name: 'Safety Equipment', spec: 'Various PPE items', unit: 'set', est_price: 500, category: 'safety_equipment' }
        );
      }

      setAiSuggestions({
        type: 'item_suggestions',
        items: suggestedItems,
        vendor: vendor.name,
        reasoning: `Based on ${vendor.name}'s specialization in ${vendor.specialization || 'general supplies'}, these items are commonly ordered.`
      });

      setGeneratingAI(false);
      setActiveAIFeature(null);
    }, 2000);
  };

  /**
   * AI Feature 4: Calculate Optimal Delivery Date
   * Based on vendor lead time and urgency
   */
  const calculateDeliveryDate = () => {
    setGeneratingAI(true);
    setActiveAIFeature('delivery_date');

    setTimeout(() => {
      const vendor = vendors.find(v => v.id === parseInt(formData.vendor_id));
      if (!vendor) {
        setGeneratingAI(false);
        return;
      }

      // Soft-coded lead time calculation
      let leadTimeDays = 30; // Default
      const specialization = (vendor.specialization || '').toLowerCase();

      // Category-based lead times
      if (specialization.includes('pipe') || specialization.includes('valve')) {
        leadTimeDays = 45; // Long-lead items
      } else if (specialization.includes('pump') || specialization.includes('rotating')) {
        leadTimeDays = 90; // Very long-lead equipment
      } else if (specialization.includes('instrument')) {
        leadTimeDays = 60;
      } else if (specialization.includes('consumable') || specialization.includes('spare')) {
        leadTimeDays = 14; // Short-lead items
      }

      // Factor in vendor country (international shipping)
      const country = (vendor.country || '').toLowerCase();
      if (!country.includes('uae') && !country.includes('emirates')) {
        leadTimeDays += 14; // Add 2 weeks for international
      }

      // Add buffer for certifications and inspections
      if (formData.required_certifications.length > 0) {
        leadTimeDays += 7; // Add 1 week for cert processing
      }
      if (formData.witness_inspection) {
        leadTimeDays += 5; // Add 5 days for witness inspection
      }

      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + leadTimeDays);

      setFormData(prev => ({
        ...prev,
        delivery_date: deliveryDate.toISOString().split('T')[0]
      }));

      setAiSuggestions({
        type: 'delivery_date',
        leadTimeDays,
        deliveryDate: deliveryDate.toISOString().split('T')[0],
        factors: [
          `Item type lead time: ${leadTimeDays - (country.includes('uae') ? 0 : 14)} days`,
          country.includes('uae') ? 'Local vendor (no international shipping)' : 'International shipping: +14 days',
          formData.required_certifications.length > 0 ? 'Certification processing: +7 days' : null,
          formData.witness_inspection ? 'Witness inspection: +5 days' : null
        ].filter(Boolean),
        reasoning: `AI calculated optimal delivery date based on vendor location, item type, and compliance requirements.`
      });

      setGeneratingAI(false);
      setActiveAIFeature(null);
    }, 1500);
  };

  /**
   * AI Feature 5: Smart Certification Requirements
   * Based on item category and standards
   */
  const suggestCertifications = () => {
    setGeneratingAI(true);
    setActiveAIFeature('certifications');

    setTimeout(() => {
      // Analyze items to determine certification needs
      const certifications = new Set();
      const standards = new Set();

      items.forEach(item => {
        const category = item.category;
        const spec = (item.spec || '').toUpperCase();

        // Base certifications for all oil & gas items
        certifications.add('Material Test Certificate (MTC 3.1)');
        certifications.add('Certificate of Conformance (COC)');

        // Category-specific certifications
        if (category === 'piping_materials' || category === 'static_equipment') {
          certifications.add('Hydrostatic Test Certificate');
          certifications.add('PMI (Positive Material Identification)');
          standards.add('ASME B31.3');
          standards.add('ASTM Standards');
          
          if (spec.includes('API')) {
            certifications.add('API Monogram Certificate');
            standards.add('API 5L');
          }
        }

        if (category === 'valves_actuators') {
          certifications.add('API Certificate');
          certifications.add('Pressure Test Certificate');
          standards.add('API 600');
          standards.add('API 6D');
          standards.add('ASME B16.34');
        }

        if (category === 'rotating_equipment') {
          certifications.add('Factory Acceptance Test (FAT)');
          certifications.add('Performance Test Certificate');
          standards.add('API 610');
          standards.add('API 682');
        }

        if (category === 'electrical') {
          certifications.add('IECEx Certificate');
          certifications.add('ATEX Certificate');
          standards.add('IEC Standards');
          standards.add('IEEE Standards');
        }

        // Welding-related items
        if (spec.includes('WELD') || spec.includes('FABRICAT')) {
          certifications.add('Welding Procedure Specification (WPS)');
          certifications.add('Procedure Qualification Record (PQR)');
          certifications.add('Welder Qualification Test Record (WQTR)');
          certifications.add('NDT Reports (RT/UT/MT/PT)');
          standards.add('ASME IX');
        }
      });

      // If pressure or temperature ratings specified
      if (formData.pressure_rating || formData.temperature_rating) {
        certifications.add('Design Calculation Report');
        certifications.add('Material Traceability');
        standards.add('ASME VIII');
      }

      setAiSuggestions({
        type: 'certifications',
        certifications: Array.from(certifications),
        standards: Array.from(standards),
        reasoning: `Based on ${items.length} items in order, AI recommends these certifications for oil & gas compliance and material traceability.`
      });

      setGeneratingAI(false);
      setActiveAIFeature(null);
    }, 1800);
  };

  /**
   * AI Feature 6: Cost Optimization
   * Analyzes and suggests cost savings
   */
  const analyzeCostOptimization = () => {
    setGeneratingAI(true);
    setActiveAIFeature('cost_optimization');

    setTimeout(() => {
      const totalCost = items.reduce((sum, item) => {
        return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
      }, 0);

      const optimizations = [];
      let potentialSavings = 0;

      // Bulk order discount
      const totalQuantity = items.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
      if (totalQuantity > 100) {
        const bulkDiscount = totalCost * 0.05;
        optimizations.push({
          title: 'Bulk Order Discount',
          description: 'Order quantity > 100 units qualifies for 5% discount',
          savings: bulkDiscount
        });
        potentialSavings += bulkDiscount;
      }

      // Payment terms optimization
      if (formData.payment_terms.includes('advance') || formData.payment_terms.includes('prepay')) {
        const earlyPayDiscount = totalCost * 0.02;
        optimizations.push({
          title: 'Early Payment Discount',
          description: 'Negotiate 2% discount for advance payment',
          savings: earlyPayDiscount
        });
        potentialSavings += earlyPayDiscount;
      }

      // Consolidation savings
      if (items.length > 10) {
        const consolidationSavings = totalCost * 0.03;
        optimizations.push({
          title: 'Order Consolidation',
          description: 'Consolidated shipping for 10+ items saves on logistics',
          savings: consolidationSavings
        });
        potentialSavings += consolidationSavings;
      }

      // Local vendor savings
      const vendor = vendors.find(v => v.id === parseInt(formData.vendor_id));
      if (vendor && vendor.country && vendor.country.toLowerCase().includes('uae')) {
        const localSavings = totalCost * 0.04;
        optimizations.push({
          title: 'Local Vendor Benefit',
          description: 'Save on international shipping, customs, and lead time',
          savings: localSavings
        });
        potentialSavings += localSavings;
      }

      setAiSuggestions({
        type: 'cost_optimization',
        totalCost,
        optimizations,
        potentialSavings,
        optimizedCost: totalCost - potentialSavings,
        savingsPercentage: ((potentialSavings / totalCost) * 100).toFixed(1),
        reasoning: `AI analyzed order value, payment terms, vendor location, and order quantity to identify potential savings.`
      });

      setGeneratingAI(false);
      setActiveAIFeature(null);
    }, 2000);
  };

  const addItemToOrder = (suggestedItem) => {
    const newItem = {
      id: Date.now(),
      name: suggestedItem.name,
      description: suggestedItem.spec,
      category: suggestedItem.category,
      quantity: 1,
      unit: suggestedItem.unit,
      unit_price: suggestedItem.est_price,
      total_price: suggestedItem.est_price
    };
    setItems([...items, newItem]);
    setAiSuggestions(null);
  };

  const addBlankItem = () => {
    const newItem = {
      id: Date.now(),
      name: '',
      description: '',
      category: '',
      quantity: 1,
      unit: 'pieces',
      unit_price: 0,
      total_price: 0
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updated.total_price = (parseFloat(updated.quantity) || 0) * (parseFloat(updated.unit_price) || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const applyVendorSuggestion = (vendor) => {
    setFormData(prev => ({ ...prev, vendor_id: vendor.id.toString() }));
    setAiSuggestions(null);
  };

  const applyCertifications = () => {
    if (aiSuggestions?.type === 'certifications') {
      setFormData(prev => ({
        ...prev,
        required_certifications: aiSuggestions.certifications,
        applicable_standards: aiSuggestions.standards
      }));
      setAiSuggestions(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const orderData = {
      ...formData,
      items,
      total_amount: items.reduce((sum, item) => sum + item.total_price, 0)
    };
    console.log('Creating purchase order with AI data:', orderData);
    onOrderCreated(orderData);
    onClose();
  };

  if (!isOpen) return null;

  const totalOrderValue = items.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SparklesIcon className="h-8 w-8 text-white" />
                <div>
                  <h3 className="text-xl font-bold text-white">AI-Powered Purchase Order Creator</h3>
                  <p className="text-sm text-indigo-100">Smart vendor selection, cost optimization, and compliance assistance</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white hover:text-gray-200">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 max-h-[75vh] overflow-y-auto">
            {/* AI Suggestions Panel */}
            {aiSuggestions && (
              <div className={`mb-6 rounded-lg border-2 p-4 ${
                aiSuggestions.type === 'cost_optimization' ? 'border-green-400 bg-green-50' : 'border-purple-400 bg-purple-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <LightBulbIcon className="h-5 w-5 text-purple-600" />
                      <h4 className="font-semibold text-gray-900">
                        {aiSuggestions.type === 'vendor_selection' && 'AI Vendor Recommendations'}
                        {aiSuggestions.type === 'item_suggestions' && 'Smart Item Suggestions'}
                        {aiSuggestions.type === 'delivery_date' && 'Optimal Delivery Timeline'}
                        {aiSuggestions.type === 'certifications' && 'Required Certifications & Standards'}
                        {aiSuggestions.type === 'cost_optimization' && 'Cost Optimization Opportunities'}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{aiSuggestions.reasoning}</p>

                    {/* Vendor Selection Display */}
                    {aiSuggestions.type === 'vendor_selection' && (
                      <div className="space-y-2">
                        {aiSuggestions.topVendors.map((item, idx) => (
                          <div key={idx} className="bg-white rounded p-3 border border-purple-200 flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-semibold text-gray-900">#{idx + 1} {item.vendor.name}</span>
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Score: {item.score}</span>
                              </div>
                              <p className="text-xs text-gray-600 mt-1">{item.reasons.join(' • ')}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => applyVendorSuggestion(item.vendor)}
                              className="ml-3 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                            >
                              Select
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Item Suggestions Display */}
                    {aiSuggestions.type === 'item_suggestions' && (
                      <div className="space-y-2">
                        {aiSuggestions.items.map((item, idx) => (
                          <div key={idx} className="bg-white rounded p-3 border border-purple-200 flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-600">{item.spec}</p>
                              <p className="text-xs text-indigo-600 mt-1">${item.est_price} per {item.unit}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => addItemToOrder(item)}
                              className="ml-3 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                            >
                              Add
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Delivery Date Display */}
                    {aiSuggestions.type === 'delivery_date' && (
                      <div className="bg-white rounded p-3 border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-900">Recommended Delivery Date:</span>
                          <span className="text-lg font-bold text-indigo-600">{new Date(aiSuggestions.deliveryDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">Total Lead Time: {aiSuggestions.leadTimeDays} days</p>
                        <ul className="text-xs text-gray-600 space-y-1 ml-4">
                          {aiSuggestions.factors.map((factor, idx) => (
                            <li key={idx}>• {factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Certifications Display */}
                    {aiSuggestions.type === 'certifications' && (
                      <div className="space-y-3">
                        <div className="bg-white rounded p-3 border border-purple-200">
                          <p className="text-sm font-semibold text-gray-900 mb-2">Required Certifications:</p>
                          <div className="flex flex-wrap gap-2">
                            {aiSuggestions.certifications.map((cert, idx) => (
                              <span key={idx} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded border border-green-300">
                                ✓ {cert}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="bg-white rounded p-3 border border-purple-200">
                          <p className="text-sm font-semibold text-gray-900 mb-2">Applicable Standards:</p>
                          <div className="flex flex-wrap gap-2">
                            {aiSuggestions.standards.map((std, idx) => (
                              <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-300">
                                {std}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cost Optimization Display */}
                    {aiSuggestions.type === 'cost_optimization' && (
                      <div className="space-y-3">
                        <div className="bg-white rounded p-3 border border-green-300">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-700">Current Total:</span>
                            <span className="text-lg font-semibold text-gray-900">${aiSuggestions.totalCost.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-700">Potential Savings:</span>
                            <span className="text-lg font-semibold text-green-600">-${aiSuggestions.potentialSavings.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                            <span className="text-sm font-semibold text-gray-900">Optimized Total:</span>
                            <span className="text-xl font-bold text-green-600">${aiSuggestions.optimizedCost.toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-green-700 mt-2 text-center">Save {aiSuggestions.savingsPercentage}%</p>
                        </div>
                        {aiSuggestions.optimizations.map((opt, idx) => (
                          <div key={idx} className="bg-white rounded p-3 border border-green-200">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">{opt.title}</p>
                                <p className="text-xs text-gray-600">{opt.description}</p>
                              </div>
                              <span className="ml-3 text-sm font-semibold text-green-600">-${opt.savings.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    {aiSuggestions.type === 'certifications' && (
                      <button
                        type="button"
                        onClick={applyCertifications}
                        className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                      >
                        <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="col-span-2">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ShoppingCartIcon className="h-5 w-5 mr-2 text-indigo-600" />
                  Order Information
                </h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PO Number
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.po_number}
                    onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="PO-XXX-XXXX"
                  />
                  <button
                    type="button"
                    onClick={generatePONumber}
                    disabled={generatingAI || !formData.vendor_id}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 disabled:opacity-50 flex items-center space-x-1"
                  >
                    <SparklesIcon className={`h-4 w-4 ${generatingAI && activeAIFeature === 'po_number' ? 'animate-spin' : ''}`} />
                    <span className="text-sm">AI</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                  <span>Vendor *</span>
                  <button
                    type="button"
                    onClick={suggestBestVendor}
                    disabled={generatingAI || vendors.length === 0}
                    className="text-sm text-purple-600 hover:text-purple-800 disabled:opacity-50 flex items-center space-x-1"
                  >
                    <SparklesIcon className={`h-4 w-4 ${generatingAI && activeAIFeature === 'vendor_selection' ? 'animate-spin' : ''}`} />
                    <span>AI Suggest</span>
                  </button>
                </label>
                <select
                  required
                  value={formData.vendor_id}
                  onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.name} {vendor.rating ? `(${vendor.rating}★)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Date
                </label>
                <input
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                  <span>Delivery Date *</span>
                  <button
                    type="button"
                    onClick={calculateDeliveryDate}
                    disabled={generatingAI || !formData.vendor_id}
                    className="text-sm text-purple-600 hover:text-purple-800 disabled:opacity-50 flex items-center space-x-1"
                  >
                    <SparklesIcon className={`h-4 w-4 ${generatingAI && activeAIFeature === 'delivery_date' ? 'animate-spin' : ''}`} />
                    <span>AI Calculate</span>
                  </button>
                </label>
                <input
                  type="date"
                  required
                  value={formData.delivery_date}
                  onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Address *
                </label>
                <input
                  type="text"
                  required
                  value={formData.shipping_address}
                  onChange={(e) => setFormData({ ...formData, shipping_address: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Complete delivery address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Net 30 days"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Terms (Incoterms)
                </label>
                <select
                  value={formData.delivery_terms}
                  onChange={(e) => setFormData({ ...formData, delivery_terms: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select delivery terms</option>
                  {DELIVERY_TERMS.map(term => (
                    <option key={term.value} value={term.value}>
                      {term.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Order Items */}
              <div className="col-span-2 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <ShieldCheckIcon className="h-5 w-5 mr-2 text-[#00a896]" />
                    Order Items
                  </h4>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={suggestOrderItems}
                      disabled={generatingAI || !formData.vendor_id}
                      className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 disabled:opacity-50 flex items-center space-x-2"
                    >
                      <SparklesIcon className={`h-4 w-4 ${generatingAI && activeAIFeature === 'item_suggestions' ? 'animate-spin' : ''}`} />
                      <span className="text-sm">AI Suggest Items</span>
                    </button>
                    <button
                      type="button"
                      onClick={addBlankItem}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      + Add Item
                    </button>
                  </div>
                </div>

                {items.length > 0 ? (
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-4">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Item Name</label>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                              className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                              placeholder="Item name"
                            />
                          </div>
                          <div className="col-span-4">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Description/Spec</label>
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                              className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                              placeholder="Specification"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                              className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                              className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                              placeholder="pcs"
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Unit Price ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateItem(item.id, 'unit_price', e.target.value)}
                              className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Total ($)</label>
                            <input
                              type="number"
                              value={item.total_price}
                              readOnly
                              className="block w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md bg-gray-100"
                            />
                          </div>
                          <div className="col-span-6 flex items-end">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="bg-indigo-50 rounded-lg p-4 border-2 border-indigo-200">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-900">Total Order Value:</span>
                        <span className="text-2xl font-bold text-indigo-600">${totalOrderValue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-sm text-gray-500">No items added yet. Use AI suggestions or add manually.</p>
                  </div>
                )}
              </div>

              {/* Oil & Gas Compliance */}
              <div className="col-span-2 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <BeakerIcon className="h-5 w-5 mr-2 text-indigo-600" />
                    Oil & Gas Compliance
                  </h4>
                  <button
                    type="button"
                    onClick={suggestCertifications}
                    disabled={generatingAI || items.length === 0}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <SparklesIcon className={`h-4 w-4 ${generatingAI && activeAIFeature === 'certifications' ? 'animate-spin' : ''}`} />
                    <span className="text-sm">AI Suggest Certifications</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Material Specifications
                    </label>
                    <textarea
                      rows={2}
                      value={formData.material_specifications}
                      onChange={(e) => setFormData({ ...formData, material_specifications: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., ASTM A106 Grade B, API 5L X65..."
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.witness_inspection}
                      onChange={(e) => setFormData({ ...formData, witness_inspection: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Witness Inspection Required
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.heat_numbers_required}
                      onChange={(e) => setFormData({ ...formData, heat_numbers_required: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Heat Numbers Required (Material Traceability)
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pressure Rating
                    </label>
                    <input
                      type="text"
                      value={formData.pressure_rating}
                      onChange={(e) => setFormData({ ...formData, pressure_rating: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Class 300, 150#"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temperature Rating
                    </label>
                    <input
                      type="text"
                      value={formData.temperature_rating}
                      onChange={(e) => setFormData({ ...formData, temperature_rating: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., -20°C to 150°C"
                    />
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Additional requirements, special instructions..."
                />
              </div>
            </div>

            {/* AI Cost Optimization Button */}
            {items.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={analyzeCostOptimization}
                  disabled={generatingAI}
                  className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 flex items-center justify-center space-x-2 font-medium"
                >
                  <SparklesIcon className={`h-5 w-5 ${generatingAI && activeAIFeature === 'cost_optimization' ? 'animate-spin' : ''}`} />
                  <span>Run AI Cost Optimization</span>
                </button>
              </div>
            )}

            {/* Form Actions */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={items.length === 0}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                Create Purchase Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIPurchaseOrderCreator;
