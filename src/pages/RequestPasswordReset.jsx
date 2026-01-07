/**
 * Password Reset Request Page
 * Allows users to request a password reset link via email
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';
import { 
  PASSWORD_RESET_API, 
  PASSWORD_RESET_UI, 
  PASSWORD_RESET_STYLES,
  validateEmail,
  buildRequestPayload,
  getPublicRequestConfig
} from '../config/passwordReset.config';

const RequestPasswordReset = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    // Validate email
    const validation = validateEmail(email);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }
    
    try {
      setLoading(true);
      
      // Use fetch instead of axios to avoid automatic auth header injection
      const response = await fetch(
        `${API_BASE_URL}${PASSWORD_RESET_API.requestReset}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildRequestPayload(email)),
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(true);
      } else if (!response.ok) {
        console.error('Password reset error:', response.status, data);
        // Still show success for security
        setSuccess(true);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error('Password reset request error:', err);
      // Always show success message for security (don't reveal if user exists)
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${PASSWORD_RESET_STYLES.background.light} flex items-center justify-center p-4`}>
        <div className={`max-w-md w-full ${PASSWORD_RESET_STYLES.container.light} rounded-2xl shadow-xl p-8`}>
          <div className="text-center">
            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${PASSWORD_RESET_STYLES.success.icon} mb-4`}>
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{PASSWORD_RESET_UI.success.title}</h2>
            <p className="text-gray-600 mb-6">
              {PASSWORD_RESET_UI.success.description(<span className="font-semibold">{email}</span>)}
            </p>
            <div className={`${PASSWORD_RESET_STYLES.success.tip.light} border rounded-lg p-4 mb-6`}>
              <p className="text-sm">
                <strong>{PASSWORD_RESET_UI.success.tips.title}</strong>
                <br />
                {PASSWORD_RESET_UI.success.tips.content}
              </p>
            </div>
            <button
              onClick={() => navigate(PASSWORD_RESET_UI.links.login.url)}
              className={`w-full ${PASSWORD_RESET_STYLES.primary.button.idle} text-white rounded-lg px-6 py-3 font-semibold transition-colors`}
            >
              {PASSWORD_RESET_UI.success.backButton}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${PASSWORD_RESET_STYLES.background.light} flex items-center justify-center p-4`}>
      <div className={`max-w-md w-full ${PASSWORD_RESET_STYLES.container.light} rounded-2xl shadow-xl p-8`}>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{PASSWORD_RESET_UI.page.title}</h1>
          <p className="text-gray-600">
            {PASSWORD_RESET_UI.page.description}
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className={`mb-6 ${PASSWORD_RESET_STYLES.error.background.light} border rounded-lg p-4`}>
            <div className="flex items-start">
              <svg className={`h-5 w-5 ${PASSWORD_RESET_STYLES.error.icon} mt-0.5 mr-2`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className={`text-sm ${PASSWORD_RESET_STYLES.error.text.light}`}>{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {PASSWORD_RESET_UI.form.emailLabel} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={PASSWORD_RESET_UI.form.emailPlaceholder}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
              loading
                ? PASSWORD_RESET_STYLES.primary.button.loading
                : PASSWORD_RESET_STYLES.primary.button.idle
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {PASSWORD_RESET_UI.form.submitButton.loading}
              </span>
            ) : (
              PASSWORD_RESET_UI.form.submitButton.idle
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {PASSWORD_RESET_UI.links.login.text}{' '}
            <Link
              to={PASSWORD_RESET_UI.links.login.url}
              className={`${PASSWORD_RESET_STYLES.primary.text} font-semibold`}
            >
              {PASSWORD_RESET_UI.links.login.linkText}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RequestPasswordReset;
