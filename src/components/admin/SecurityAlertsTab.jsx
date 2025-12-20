import React, { useState } from 'react';
import analyticsService from '../../services/analyticsService';

/**
 * Security Alerts Component
 * AI-powered threat detection and management
 */
const SecurityAlertsTab = ({ alerts: initialAlerts, onRefresh }) => {
  const [alerts, setAlerts] = useState(initialAlerts || []);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolving, setResolving] = useState(false);

  const getSeverityBadge = (severity) => {
    const styles = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800',
    };
    return styles[severity] || styles.low;
  };

  const handleResolve = async (alertId) => {
    setResolving(true);
    try {
      const notes = prompt('Resolution notes (optional):');
      await analyticsService.resolveAlert(alertId, notes || '');
      setAlerts(alerts.filter(a => a.id !== alertId));
      setSelectedAlert(null);
      onRefresh();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      alert('Failed to resolve alert');
    } finally {
      setResolving(false);
    }
  };

  const handleInvestigate = async (alertId) => {
    try {
      await analyticsService.investigateAlert(alertId);
      onRefresh();
    } catch (error) {
      console.error('Failed to mark as investigating:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Security Alerts</h3>
          <p className="text-gray-600 mt-1">AI-powered threat detection and monitoring</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {alerts && alerts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(alert.detection_time).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{alert.title}</h4>
                  <p className="text-gray-700 mb-4">{alert.description}</p>
                  
                  {alert.user_email && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>User: {alert.user_email}</span>
                    </div>
                  )}
                  
                  {alert.ip_address && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <span>IP: {alert.ip_address}</span>
                    </div>
                  )}

                  {alert.ai_confidence && (
                    <div className="mt-3 bg-purple-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-purple-900">AI Confidence</span>
                        <span className="text-sm font-bold text-purple-600">{(alert.ai_confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${alert.ai_confidence * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {alert.threat_indicators && alert.threat_indicators.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-gray-900 mb-2">Threat Indicators:</p>
                      <div className="flex flex-wrap gap-2">
                        {alert.threat_indicators.map((indicator, idx) => (
                          <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                            {indicator}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-gray-900 mb-2">Recommended Actions:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {alert.recommended_actions.map((action, idx) => (
                          <li key={idx} className="text-sm text-gray-700">{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleInvestigate(alert.id)}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Investigate
                </button>
                <button
                  onClick={() => handleResolve(alert.id)}
                  disabled={resolving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {resolving ? 'Resolving...' : 'Mark as Resolved'}
                </button>
                <button
                  onClick={() => setSelectedAlert(alert)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-green-50 rounded-lg">
          <svg className="w-16 h-16 mx-auto mb-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <p className="text-lg font-semibold text-green-900">All Clear!</p>
          <p className="text-green-700 mt-2">No security alerts detected</p>
        </div>
      )}
    </div>
  );
};

export default SecurityAlertsTab;
