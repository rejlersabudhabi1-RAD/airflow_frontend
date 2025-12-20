import React, { useState } from 'react';
import analyticsService from '../../services/analyticsService';

/**
 * AI Predictions and Insights Component
 * Machine learning powered recommendations
 */
const PredictionsTab = ({ predictions: initialPredictions, onRefresh }) => {
  const [predictions, setPredictions] = useState(initialPredictions || []);
  const [acknowledging, setAcknowledging] = useState(false);

  const getImpactBadge = (impact) => {
    const styles = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return styles[impact] || styles.medium;
  };

  const getInsightIcon = (type) => {
    const icons = {
      usage_forecast: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      capacity_planning: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      user_churn_risk: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      performance_optimization: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      cost_optimization: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      security_risk: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    };
    return icons[type] || icons.usage_forecast;
  };

  const handleAcknowledge = async (insightId) => {
    setAcknowledging(true);
    try {
      await analyticsService.acknowledgeInsight(insightId);
      setPredictions(predictions.filter(p => p.id !== insightId));
      onRefresh();
    } catch (error) {
      console.error('Failed to acknowledge insight:', error);
      alert('Failed to acknowledge insight');
    } finally {
      setAcknowledging(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">AI-Powered Insights</h3>
          <p className="text-gray-600 mt-1">Machine learning predictions and recommendations</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {predictions && predictions.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {predictions.map((prediction) => (
            <div key={prediction.id} className="bg-white border-2 border-purple-200 rounded-lg p-6 hover:border-purple-400 transition-colors">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                  {getInsightIcon(prediction.insight_type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-bold text-gray-900">{prediction.title}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getImpactBadge(prediction.impact_level)}`}>
                      {prediction.impact_level.toUpperCase()} IMPACT
                    </span>
                  </div>

                  <p className="text-gray-700 mb-4">{prediction.description}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Confidence Score</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${prediction.confidence_score * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-purple-600">
                          {(prediction.confidence_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Affected Area</p>
                      <p className="text-sm font-semibold text-gray-900">{prediction.affected_area}</p>
                    </div>
                  </div>

                  {prediction.recommendations && prediction.recommendations.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg mb-4">
                      <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Recommendations
                      </p>
                      <ul className="space-y-1">
                        {prediction.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-blue-800 flex items-start">
                            <svg className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {prediction.action_items && prediction.action_items.length > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                      <p className="text-sm font-semibold text-yellow-900 mb-2">Action Items:</p>
                      <ul className="space-y-1">
                        {prediction.action_items.map((item, idx) => (
                          <li key={idx} className="text-sm text-yellow-800 flex items-start">
                            <input type="checkbox" className="mt-1 mr-2" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {prediction.estimated_benefit && (
                    <div className="bg-green-50 p-3 rounded-lg mb-4">
                      <p className="text-sm text-green-900">
                        <span className="font-semibold">Estimated Benefit: </span>
                        {prediction.estimated_benefit}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Model:</span> {prediction.ml_model_used}
                    </div>
                    <button
                      onClick={() => handleAcknowledge(prediction.id)}
                      disabled={acknowledging}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                    >
                      {acknowledging ? 'Acknowledging...' : 'Acknowledge'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-lg font-semibold text-gray-900">No Active Insights</p>
          <p className="text-gray-600 mt-2">AI is analyzing your system patterns</p>
        </div>
      )}
    </div>
  );
};

export default PredictionsTab;
