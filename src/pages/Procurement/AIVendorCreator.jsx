import React, { useState } from 'react';
import {
  XMarkIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  LightBulbIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { PROCUREMENT_CONFIG, getCertificationsList, getQualityStandardsList } from '../../config/procurement.config';
import { API_BASE_URL } from '../../config/api.config';

const AIVendorCreator = ({ isOpen, onClose, onVendorCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    vendor_code: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    website: '',
    business_type: '',
    specialization: '',
    certifications: [],
    quality_standards: [],
    approved_materials: '',
    hse_rating: '',
    payment_terms: '',
    credit_limit: '',
    // ICV (In-Country Value) - Abu Dhabi Market
    icv_percentage: '',
    icv_certificate: '',
    icv_expiry_date: '',
    icv_issuing_authority: 'ADDED',
    is_icv_certified: false,
    notes: ''
  });

  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [activeAIFeature, setActiveAIFeature] = useState(null);

  // Soft-coded business types for oil & gas industry
  const BUSINESS_TYPES = [
    { value: 'manufacturer', label: 'Manufacturer', icon: '🏭' },
    { value: 'distributor', label: 'Distributor', icon: '📦' },
    { value: 'service_provider', label: 'Service Provider', icon: '🔧' },
    { value: 'contractor', label: 'Contractor', icon: '👷' },
    { value: 'consultant', label: 'Consultant', icon: '💼' }
  ];

  // Soft-coded HSE rating levels
  const HSE_RATINGS = [
    { value: 'excellent', label: 'Excellent (95-100%)', color: 'text-green-600' },
    { value: 'good', label: 'Good (85-94%)', color: 'text-blue-600' },
    { value: 'satisfactory', label: 'Satisfactory (75-84%)', color: 'text-yellow-600' },
    { value: 'needs_improvement', label: 'Needs Improvement (<75%)', color: 'text-orange-600' }
  ];

  /**
   * AI Feature 1: Generate Vendor Code
   * Intelligent code generation based on company name and type
   */
  const generateVendorCode = () => {
    setGeneratingAI(true);
    setActiveAIFeature('vendor_code');

    setTimeout(() => {
      // Soft-coded vendor code generation algorithm
      const namePrefix = formData.name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .slice(0, 3)
        .join('');
      
      const typeCode = formData.business_type
        ? formData.business_type.substring(0, 3).toUpperCase()
        : 'GEN';
      
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const generatedCode = `${namePrefix || 'VND'}-${typeCode}-${randomNum}`;

      setFormData(prev => ({ ...prev, vendor_code: generatedCode }));
      setGeneratingAI(false);
      setActiveAIFeature(null);
    }, 1000);
  };

  /**
   * AI Feature 2: Suggest Certifications
   * Based on business type and specialization
   */
  const suggestCertifications = () => {
    setGeneratingAI(true);
    setActiveAIFeature('certifications');

    setTimeout(() => {
      // Soft-coded certification suggestion logic
      const suggestions = [];
      const businessType = formData.business_type;
      const specialization = formData.specialization.toLowerCase();

      // Base certifications for all oil & gas vendors
      suggestions.push('ISO 9001:2015');

      // Business-type specific certifications
      if (businessType === 'manufacturer') {
        suggestions.push('ISO 14001', 'ASME Certification', 'API Q1', 'PED Certification');
        if (specialization.includes('pipe') || specialization.includes('piping')) {
          suggestions.push('API 5L', 'ASTM Standards');
        }
        if (specialization.includes('valve')) {
          suggestions.push('API 600', 'API 6D', 'API 6A');
        }
        if (specialization.includes('pressure') || specialization.includes('vessel')) {
          suggestions.push('ASME VIII', 'ASME B31.3');
        }
      } else if (businessType === 'service_provider') {
        suggestions.push('ISO 45001', 'NEBOSH', 'IOSH');
        if (specialization.includes('weld') || specialization.includes('fabrication')) {
          suggestions.push('ASME IX', 'AWS Certification', 'EN ISO 3834');
        }
        if (specialization.includes('inspection') || specialization.includes('ndt')) {
          suggestions.push('ASNT Level III', 'PCN Certification', 'ISO 9712');
        }
      } else if (businessType === 'contractor') {
        suggestions.push('ISO 45001', 'Achilles', 'ISNetworld');
      }

      // HSE specific
      if (formData.hse_rating && formData.hse_rating !== 'needs_improvement') {
        suggestions.push('ISO 45001', 'OHSAS 18001');
      }

      setAiSuggestions({
        type: 'certifications',
        items: [...new Set(suggestions)], // Remove duplicates
        reasoning: `Based on ${businessType || 'general'} business type${specialization ? ` specializing in ${specialization}` : ''}, these certifications are recommended for oil & gas industry compliance.`
      });

      setGeneratingAI(false);
      setActiveAIFeature(null);
    }, 1500);
  };

  /**
   * AI Feature 3: Suggest Quality Standards
   * Industry-specific quality standards
   */
  const suggestQualityStandards = () => {
    setGeneratingAI(true);
    setActiveAIFeature('quality_standards');

    setTimeout(() => {
      // Soft-coded quality standards suggestion
      const standards = [];
      const specialization = formData.specialization.toLowerCase();

      // Always include base standards
      standards.push('ISO 9001', 'ISO 14001');

      // Specialization-based standards
      if (specialization.includes('pipe') || specialization.includes('piping')) {
        standards.push('API 5L', 'ASTM A106', 'ASME B31.3', 'ASME B31.4');
      }
      if (specialization.includes('valve')) {
        standards.push('API 600', 'API 6D', 'API 598', 'ASME B16.34');
      }
      if (specialization.includes('pressure') || specialization.includes('vessel')) {
        standards.push('ASME VIII', 'ASME B31.3', 'API 510');
      }
      if (specialization.includes('pump') || specialization.includes('rotating')) {
        standards.push('API 610', 'API 682', 'ISO 13709');
      }
      if (specialization.includes('instrument') || specialization.includes('control')) {
        standards.push('IEC 61508', 'ISA Standards', 'ANSI/ISA-18.2');
      }
      if (specialization.includes('electrical')) {
        standards.push('IEC 61000', 'IEEE Standards', 'NEMA Standards');
      }
      if (specialization.includes('material') || specialization.includes('steel')) {
        standards.push('ASTM Standards', 'NACE MR0175', 'ISO 15156');
      }

      // HSE standards
      if (formData.hse_rating && formData.hse_rating !== 'needs_improvement') {
        standards.push('ISO 45001', 'OSHA Standards');
      }

      setAiSuggestions({
        type: 'quality_standards',
        items: [...new Set(standards)],
        reasoning: `For ${specialization || 'general oil & gas'} operations, these quality standards ensure compliance with industry requirements and safety regulations.`
      });

      setGeneratingAI(false);
      setActiveAIFeature(null);
    }, 1500);
  };

  /**
   * AI Feature 4: Risk Assessment
   * Evaluate vendor risk based on provided information
   */
  const performRiskAssessment = () => {
    setGeneratingAI(true);
    setActiveAIFeature('risk_assessment');

    setTimeout(() => {
      // Soft-coded risk scoring algorithm
      let riskScore = 100; // Start with 100 (low risk)
      const risks = [];
      const strengths = [];

      // HSE rating impact
      if (!formData.hse_rating) {
        riskScore -= 15;
        risks.push('No HSE rating provided - increases operational risk');
      } else if (formData.hse_rating === 'needs_improvement') {
        riskScore -= 20;
        risks.push('HSE rating needs improvement - high safety risk');
      } else if (formData.hse_rating === 'excellent') {
        strengths.push('Excellent HSE rating - strong safety culture');
      }

      // Certifications impact
      if (formData.certifications.length === 0) {
        riskScore -= 15;
        risks.push('No certifications provided - quality assurance concerns');
      } else if (formData.certifications.length >= 5) {
        strengths.push(`${formData.certifications.length} certifications - well qualified`);
      }

      // Quality standards impact
      if (formData.quality_standards.length === 0) {
        riskScore -= 10;
        risks.push('No quality standards specified - compliance uncertainty');
      } else if (formData.quality_standards.length >= 4) {
        strengths.push(`${formData.quality_standards.length} quality standards - comprehensive compliance`);
      }

      // Business information completeness
      if (!formData.email || !formData.phone) {
        riskScore -= 10;
        risks.push('Incomplete contact information - communication challenges');
      }
      if (!formData.address || !formData.country) {
        riskScore -= 5;
        risks.push('Missing location details - logistics concerns');
      }
      if (formData.website) {
        strengths.push('Online presence verified - established business');
      }

      // Payment terms
      if (formData.payment_terms && !formData.credit_limit) {
        risks.push('Payment terms set without credit limit - financial risk');
        riskScore -= 5;
      }

      // Specialization
      if (!formData.specialization) {
        riskScore -= 10;
        risks.push('No specialization specified - scope ambiguity');
      } else {
        strengths.push(`Specialized in ${formData.specialization} - domain expertise`);
      }

      // Calculate risk level
      let riskLevel, riskColor, recommendation;
      if (riskScore >= 85) {
        riskLevel = 'Low Risk';
        riskColor = 'green';
        recommendation = 'Vendor meets quality standards. Recommend approval with standard terms.';
      } else if (riskScore >= 70) {
        riskLevel = 'Medium Risk';
        riskColor = 'yellow';
        recommendation = 'Vendor shows potential. Recommend conditional approval with monitoring.';
      } else if (riskScore >= 50) {
        riskLevel = 'High Risk';
        riskColor = 'orange';
        recommendation = 'Vendor requires improvement. Recommend probationary period with audits.';
      } else {
        riskLevel = 'Critical Risk';
        riskColor = 'red';
        recommendation = 'Vendor does not meet minimum standards. Not recommended for approval.';
      }

      setAiSuggestions({
        type: 'risk_assessment',
        riskScore,
        riskLevel,
        riskColor,
        risks,
        strengths,
        recommendation,
        reasoning: `Risk assessment based on ${Object.keys(formData).filter(key => formData[key] && formData[key].length > 0).length} data points including HSE rating, certifications, quality standards, and business information.`
      });

      setGeneratingAI(false);
      setActiveAIFeature(null);
    }, 2000);
  };

  /**
   * AI Feature 5: Smart Payment Terms
   * Suggest payment terms based on vendor type and risk
   */
  const suggestPaymentTerms = () => {
    setGeneratingAI(true);
    setActiveAIFeature('payment_terms');

    setTimeout(() => {
      // Soft-coded payment terms logic
      let terms = '';
      let creditLimit = '';
      const businessType = formData.business_type;
      const hseRating = formData.hse_rating;

      // Base payment terms by business type
      if (businessType === 'manufacturer') {
        terms = '30% advance, 60% on delivery, 10% after commissioning';
        creditLimit = '$500,000';
      } else if (businessType === 'distributor') {
        terms = 'Net 30 days from invoice date';
        creditLimit = '$250,000';
      } else if (businessType === 'service_provider') {
        terms = '25% advance, 75% on completion';
        creditLimit = '$200,000';
      } else if (businessType === 'contractor') {
        terms = '20% advance, 70% milestone-based, 10% retention';
        creditLimit = '$750,000';
      } else {
        terms = 'Net 30 days from invoice date';
        creditLimit = '$100,000';
      }

      // Adjust based on HSE rating
      if (hseRating === 'excellent') {
        creditLimit = (parseInt(creditLimit.replace(/[$,]/g, '')) * 1.5).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
      } else if (hseRating === 'needs_improvement') {
        creditLimit = (parseInt(creditLimit.replace(/[$,]/g, '')) * 0.5).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
      }

      setFormData(prev => ({
        ...prev,
        payment_terms: terms,
        credit_limit: creditLimit
      }));

      setAiSuggestions({
        type: 'payment_terms',
        terms,
        creditLimit,
        reasoning: `Payment terms optimized for ${businessType || 'general'} vendors${hseRating ? ` with ${hseRating} HSE rating` : ''}. Credit limit adjusted based on risk profile.`
      });

      setGeneratingAI(false);
      setActiveAIFeature(null);
    }, 1000);
  };

  const applySuggestion = (type) => {
    if (!aiSuggestions || aiSuggestions.type !== type) return;

    if (type === 'certifications') {
      setFormData(prev => ({
        ...prev,
        certifications: aiSuggestions.items
      }));
    } else if (type === 'quality_standards') {
      setFormData(prev => ({
        ...prev,
        quality_standards: aiSuggestions.items
      }));
    }

    setAiSuggestions(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('access_token');
      
      // Prepare data for API
      const submitData = {
        ...formData,
        certifications: formData.certifications || [],
        quality_standards: formData.quality_standards || []
      };
      
      const response = await fetch(`${API_BASE_URL}/procurement/vendors/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Vendor created successfully:', data);
        onVendorCreated(data);
        onClose();
      } else {
        const error = await response.json();
        console.error('Error creating vendor:', error);
        alert(`Failed to create vendor: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error while creating vendor. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SparklesIcon className="h-8 w-8 text-white" />
                <div>
                  <h3 className="text-xl font-bold text-white">AI-Powered Vendor Creator</h3>
                  <p className="text-sm text-indigo-100">Intelligent vendor onboarding with compliance assistance</p>
                </div>
              </div>
              <button onClick={onClose} className="text-white hover:text-gray-200">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {/* AI Suggestions Panel */}
            {aiSuggestions && (
              <div className={`mb-6 rounded-lg border-2 p-4 ${
                aiSuggestions.type === 'risk_assessment' 
                  ? `border-${aiSuggestions.riskColor}-400 bg-${aiSuggestions.riskColor}-50` 
                  : 'border-purple-400 bg-purple-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <LightBulbIcon className={`h-5 w-5 ${
                        aiSuggestions.type === 'risk_assessment' 
                          ? `text-${aiSuggestions.riskColor}-600` 
                          : 'text-purple-600'
                      }`} />
                      <h4 className="font-semibold text-gray-900">
                        {aiSuggestions.type === 'certifications' && 'AI Certification Recommendations'}
                        {aiSuggestions.type === 'quality_standards' && 'AI Quality Standards Suggestions'}
                        {aiSuggestions.type === 'risk_assessment' && `Risk Assessment: ${aiSuggestions.riskLevel}`}
                        {aiSuggestions.type === 'payment_terms' && 'Smart Payment Terms'}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{aiSuggestions.reasoning}</p>

                    {aiSuggestions.type === 'risk_assessment' && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full bg-${aiSuggestions.riskColor}-500`}
                              style={{ width: `${aiSuggestions.riskScore}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{aiSuggestions.riskScore}/100</span>
                        </div>

                        {aiSuggestions.strengths.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-green-700 mb-1">✓ Strengths:</p>
                            <ul className="text-sm text-gray-700 space-y-1 ml-4">
                              {aiSuggestions.strengths.map((strength, idx) => (
                                <li key={idx}>• {strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {aiSuggestions.risks.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-red-700 mb-1">⚠ Risk Factors:</p>
                            <ul className="text-sm text-gray-700 space-y-1 ml-4">
                              {aiSuggestions.risks.map((risk, idx) => (
                                <li key={idx}>• {risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="bg-white rounded p-3 border border-gray-200">
                          <p className="text-sm font-medium text-gray-900 mb-1">💡 Recommendation:</p>
                          <p className="text-sm text-gray-700">{aiSuggestions.recommendation}</p>
                        </div>
                      </div>
                    )}

                    {(aiSuggestions.type === 'certifications' || aiSuggestions.type === 'quality_standards') && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {aiSuggestions.items.map((item, idx) => (
                          <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white text-purple-700 border border-purple-300">
                            {item}
                          </span>
                        ))}
                      </div>
                    )}

                    {aiSuggestions.type === 'payment_terms' && (
                      <div className="bg-white rounded p-3 border border-gray-200 space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Terms: </span>
                          <span className="text-sm text-gray-900">{aiSuggestions.terms}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">Credit Limit: </span>
                          <span className="text-sm text-gray-900 font-semibold">{aiSuggestions.creditLimit}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    {(aiSuggestions.type === 'certifications' || aiSuggestions.type === 'quality_standards') && (
                      <button
                        type="button"
                        onClick={() => applySuggestion(aiSuggestions.type)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
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
                  <BuildingOfficeIcon className="h-5 w-5 mr-2 text-indigo-600" />
                  Basic Information
                </h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter vendor company name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Code
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={formData.vendor_code}
                    onChange={(e) => setFormData({ ...formData, vendor_code: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="AUTO-GEN-0000"
                  />
                  <button
                    type="button"
                    onClick={generateVendorCode}
                    disabled={generatingAI || !formData.name}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 disabled:opacity-50 flex items-center space-x-1"
                  >
                    <SparklesIcon className={`h-4 w-4 ${generatingAI && activeAIFeature === 'vendor_code' ? 'animate-spin' : ''}`} />
                    <span className="text-sm">AI</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Type *
                </label>
                <select
                  required
                  value={formData.business_type}
                  onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select business type</option>
                  {BUSINESS_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Piping materials, Valves, Pumps"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="vendor@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="+971 XX XXX XXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://www.vendor.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="United Arab Emirates"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Dubai"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Full address"
                />
              </div>

              {/* Certifications & Compliance */}
              <div className="col-span-2 mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 mr-2 text-[#00a896]" />
                  Certifications & Compliance
                </h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HSE Rating *
                </label>
                <select
                  required
                  value={formData.hse_rating}
                  onChange={(e) => setFormData({ ...formData, hse_rating: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select HSE rating</option>
                  {HSE_RATINGS.map(rating => (
                    <option key={rating.value} value={rating.value}>
                      {rating.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                  <span>Certifications</span>
                  <button
                    type="button"
                    onClick={suggestCertifications}
                    disabled={generatingAI || !formData.business_type}
                    className="text-sm text-purple-600 hover:text-purple-800 disabled:opacity-50 flex items-center space-x-1"
                  >
                    <SparklesIcon className={`h-4 w-4 ${generatingAI && activeAIFeature === 'certifications' ? 'animate-spin' : ''}`} />
                    <span>AI Suggest</span>
                  </button>
                </label>
                <select
                  multiple
                  value={formData.certifications}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    certifications: Array.from(e.target.selectedOptions, option => option.value)
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-32"
                >
                  {getCertificationsList().map(cert => (
                    <option key={cert.code} value={cert.name}>
                      {cert.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple</p>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                  <span>Quality Standards</span>
                  <button
                    type="button"
                    onClick={suggestQualityStandards}
                    disabled={generatingAI || !formData.specialization}
                    className="text-sm text-purple-600 hover:text-purple-800 disabled:opacity-50 flex items-center space-x-1"
                  >
                    <SparklesIcon className={`h-4 w-4 ${generatingAI && activeAIFeature === 'quality_standards' ? 'animate-spin' : ''}`} />
                    <span>AI Suggest</span>
                  </button>
                </label>
                <select
                  multiple
                  value={formData.quality_standards}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    quality_standards: Array.from(e.target.selectedOptions, option => option.value)
                  })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 h-32"
                >
                  {getQualityStandardsList().map(std => (
                    <option key={std.code} value={std.name}>
                      {std.name} - {std.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* ICV (In-Country Value) - Abu Dhabi Market */}
              <div className="col-span-2 mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                  </svg>
                  ICV (In-Country Value) - Abu Dhabi Market
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  ICV certification is mandatory for suppliers operating in Abu Dhabi. Higher ICV percentage improves procurement eligibility.
                </p>
              </div>

              <div>
                <label className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    checked={formData.is_icv_certified}
                    onChange={(e) => setFormData({ ...formData, is_icv_certified: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">ICV Certified</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ICV Percentage (%) {formData.is_icv_certified && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.icv_percentage}
                  onChange={(e) => setFormData({ ...formData, icv_percentage: e.target.value })}
                  required={formData.is_icv_certified}
                  disabled={!formData.is_icv_certified}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                  placeholder="e.g., 65.50"
                />
                <p className="mt-1 text-xs text-gray-500">Enter value between 0-100%</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ICV Certificate Number {formData.is_icv_certified && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.icv_certificate}
                  onChange={(e) => setFormData({ ...formData, icv_certificate: e.target.value })}
                  required={formData.is_icv_certified}
                  disabled={!formData.is_icv_certified}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                  placeholder="e.g., ICV-UAE-2024-12345"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ICV Expiry Date {formData.is_icv_certified && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="date"
                  value={formData.icv_expiry_date}
                  onChange={(e) => setFormData({ ...formData, icv_expiry_date: e.target.value })}
                  required={formData.is_icv_certified}
                  disabled={!formData.is_icv_certified}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ICV Issuing Authority
                </label>
                <input
                  type="text"
                  value={formData.icv_issuing_authority}
                  onChange={(e) => setFormData({ ...formData, icv_issuing_authority: e.target.value })}
                  disabled={!formData.is_icv_certified}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
                  placeholder="ADDED (Abu Dhabi Department of Economic Development)"
                />
                <p className="mt-1 text-xs text-gray-500">Default: ADDED</p>
              </div>

              {/* Payment Terms */}
              <div className="col-span-2 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <GlobeAltIcon className="h-5 w-5 mr-2 text-indigo-600" />
                    Payment Terms
                  </h4>
                  <button
                    type="button"
                    onClick={suggestPaymentTerms}
                    disabled={generatingAI || !formData.business_type}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <SparklesIcon className={`h-4 w-4 ${generatingAI && activeAIFeature === 'payment_terms' ? 'animate-spin' : ''}`} />
                    <span className="text-sm">AI Suggest Payment Terms</span>
                  </button>
                </div>
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
                  Credit Limit
                </label>
                <input
                  type="text"
                  value={formData.credit_limit}
                  onChange={(e) => setFormData({ ...formData, credit_limit: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="$100,000"
                />
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
                  placeholder="Additional notes about the vendor..."
                />
              </div>
            </div>

            {/* AI Risk Assessment Button */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={performRiskAssessment}
                disabled={generatingAI}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center space-x-2 font-medium"
              >
                <SparklesIcon className={`h-5 w-5 ${generatingAI && activeAIFeature === 'risk_assessment' ? 'animate-spin' : ''}`} />
                <span>Run AI Risk Assessment</span>
              </button>
            </div>

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
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Create Vendor
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIVendorCreator;
