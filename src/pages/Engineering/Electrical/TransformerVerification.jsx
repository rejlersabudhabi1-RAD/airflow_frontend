/**
 * Transformer Datasheet Verification
 * Reuses P&ID/PFD verification UI pattern
 */

import React, { useState } from 'react';
import { 
  CloudArrowUpIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  XCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import apiClient from '../../../services/api.service';

const TransformerVerification = () => {
  const [verificationFiles, setVerificationFiles] = useState({
    transformer_datasheet: null,
    mv_calc_document: null,
    criteria_document: null,
    formula_document: null,
    lv_calc_document: null
  });
  
  const [verificationResults, setVerificationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fileLabels = {
    transformer_datasheet: 'Transformer Datasheet (Excel)',
    mv_calc_document: 'MV Transformer Calculation (PDF)',
    criteria_document: 'Criteria Document (PDF)',
    formula_document: 'Formula Document (PDF)',
    lv_calc_document: 'LV Transformer Calculation (PDF)'
  };

  const handleFileChange = (key, file) => {
    setVerificationFiles(prev => ({
      ...prev,
      [key]: file
    }));
    setError('');
  };

  const handleVerify = async () => {
    // Validate all files uploaded
    const missingFiles = Object.entries(verificationFiles)
      .filter(([key, file]) => !file)
      .map(([key]) => fileLabels[key]);
    
    if (missingFiles.length > 0) {
      setError(`Please upload: ${missingFiles.join(', ')}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      Object.entries(verificationFiles).forEach(([key, file]) => {
        formData.append(key, file);
      });

      const response = await apiClient.post(
        '/electrical/datasheets/verify-transformer/',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 120000 // 2 minutes
        }
      );

      setVerificationResults(response.data);
    } catch (err) {
      console.error('Verification error:', err);
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Valid':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Mismatch':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Incorrect':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Missing':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence) => {
    switch (confidence) {
      case 'High':
        return 'text-green-600 bg-green-100';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'Low':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Transformer Datasheet Verification
          </h1>
          <p className="text-gray-600">
            Upload transformer datasheet and supporting documents for AI-powered verification
          </p>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Upload Documents
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(fileLabels).map(([key, label]) => (
              <div key={key} className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  {verificationFiles[key] && (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  )}
                </div>
                
                <input
                  type="file"
                  accept={key === 'transformer_datasheet' ? '.xlsx,.xls' : '.pdf'}
                  onChange={(e) => handleFileChange(key, e.target.files[0])}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
                
                {verificationFiles[key] && (
                  <p className="text-xs text-gray-500 mt-2">
                    {verificationFiles[key].name}
                  </p>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading || Object.values(verificationFiles).some(f => !f)}
            className="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold
              hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
              transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Verifying...
              </>
            ) : (
              <>
                <DocumentTextIcon className="w-5 h-5" />
                Verify Datasheet
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {verificationResults && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {verificationResults.summary.total_parameters}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <p className="text-sm text-gray-600">Valid</p>
                <p className="text-2xl font-bold text-green-600">
                  {verificationResults.summary.valid}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <p className="text-sm text-gray-600">Mismatch</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {verificationResults.summary.mismatch}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <p className="text-sm text-gray-600">Incorrect</p>
                <p className="text-2xl font-bold text-red-600">
                  {verificationResults.summary.incorrect}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <p className="text-sm text-gray-600">Missing</p>
                <p className="text-2xl font-bold text-gray-600">
                  {verificationResults.summary.missing}
                </p>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Verification Results
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Parameter
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Datasheet Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Document Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Explanation
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Confidence
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {verificationResults.verification_results.map((result, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {result.parameter}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.datasheet_value}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {result.document_value}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(result.status)}`}>
                            {result.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                          {result.explanation}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getConfidenceColor(result.confidence)}`}>
                            {result.confidence}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {result.source_document}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TransformerVerification;
