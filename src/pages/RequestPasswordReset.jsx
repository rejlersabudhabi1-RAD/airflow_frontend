/**
 * Password Reset Request Page
 * Two modes (soft-coded via PASSWORD_RESET_FALLBACK.USE_ENQUIRY_FALLBACK):
 *   - Fallback (default): submits to /enquiry/submit/ so admins can review
 *     and manually reset via /admin/users. Used when SMTP is not configured.
 *   - SMTP:   original flow that emails a reset link to the user.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from '../config/api.config';
import apiService from '../services/api.service';
import {
  PASSWORD_RESET_API,
  PASSWORD_RESET_UI,
  PASSWORD_RESET_STYLES,
  PASSWORD_RESET_FALLBACK,
  validateEmail,
  buildRequestPayload,
} from '../config/passwordReset.config';

const RequestPasswordReset = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const useEnquiryFallback = PASSWORD_RESET_FALLBACK.USE_ENQUIRY_FALLBACK;
  const adminContact = PASSWORD_RESET_FALLBACK.adminContact;

  // Soft-coded submit: routes to enquiry endpoint when SMTP unavailable
  const submitViaEnquiry = async (emailValue, reasonValue) => {
    // Derive a reasonable display name from the email local-part
    const localPart = emailValue.split('@')[0] || 'User';
    const derivedName = localPart
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const payload = {
      name:    derivedName,
      email:   emailValue,
      phone:   '',            // optional for password-reset service (see backend)
      company: '',
      subject: PASSWORD_RESET_FALLBACK.subject,
      message: PASSWORD_RESET_FALLBACK.messageTemplate({ email: emailValue, reason: reasonValue }),
      service: PASSWORD_RESET_FALLBACK.serviceCode,
      urgency: PASSWORD_RESET_FALLBACK.urgency,
    };

    return apiService.post(PASSWORD_RESET_FALLBACK.enquiryEndpoint, payload);
  };

  const submitViaSmtp = async (emailValue) => {
    // Use fetch to avoid automatic auth header injection
    const response = await fetch(
      `${API_BASE_URL}${PASSWORD_RESET_API.requestReset}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequestPayload(emailValue)),
      }
    );
    return response;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const validation = validateEmail(email);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    try {
      setLoading(true);
      if (useEnquiryFallback) {
        await submitViaEnquiry(email, reason);
      } else {
        await submitViaSmtp(email);
      }
      setSuccess(true);
    } catch (err) {
      console.error('Password reset request error:', err);
      // Show generic success for security (don't reveal if user exists) â€”
      // except in fallback mode, where a real submission failure should be
      // visible so the user can retry.
      if (useEnquiryFallback) {
        setError(
          err?.response?.data?.message ||
          'Could not submit your request. Please try again or contact your administrator.'
        );
      } else {
        setSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    // Soft-coded copy: adapt success message to the active flow
    const successTitle = useEnquiryFallback
      ? 'Request Submitted'
      : PASSWORD_RESET_UI.success.title;
    const successBody = useEnquiryFallback ? (
      <>Your password reset request for <span className="font-semibold text-blue-700">{email}</span> has
        been sent to the administrator. You will be contacted shortly with next steps.</>
    ) : (
      PASSWORD_RESET_UI.success.description(<span className="font-semibold">{email}</span>)
    );
    const successTipTitle = useEnquiryFallback
      ? 'What happens next?'
      : PASSWORD_RESET_UI.success.tips.title;
    const successTipBody = useEnquiryFallback
      ? 'An administrator will verify your identity and reset your password from the internal User Management console. Keep an eye on your email or phone for a response.'
      : PASSWORD_RESET_UI.success.tips.content;

    return (
      <div className="min-h-screen relative overflow-hidden bg-slate-50">
        {/* Ambient background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50"></div>
          <div className="absolute top-[-6rem] left-[-6rem] w-[24rem] h-[24rem] rounded-full bg-emerald-300/30 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-[-6rem] right-[-6rem] w-[28rem] h-[28rem] rounded-full bg-blue-300/30 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="min-h-screen flex items-center justify-center px-4 py-10">
          <div className="max-w-md w-full rounded-3xl bg-white/90 backdrop-blur-xl shadow-2xl border border-white/60 p-8 lg:p-10 text-center">
            {/* Animated success check */}
            <div className="relative inline-flex mb-6">
              <div className="absolute inset-0 rounded-full bg-emerald-400/30 blur-xl animate-ping"></div>
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-3">{successTitle}</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">{successBody}</p>

            {/* SLA + next steps card */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5 mb-6 text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  {successTipTitle}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{successTipBody}</p>
              {useEnquiryFallback && (
                <div className="mt-3 pt-3 border-t border-blue-100 flex items-center gap-2 text-xs text-blue-800">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Typical response: <span className="font-semibold">within {adminContact.slaHours} hours</span>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate(PASSWORD_RESET_UI.links.login.url)}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all"
            >
              {PASSWORD_RESET_UI.success.backButton}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Soft-coded copy: adapt page description to the active flow
  const pageDescription = useEnquiryFallback
    ? 'Password resets are handled by your system administrator. Submit the form below and an admin will contact you shortly.'
    : PASSWORD_RESET_UI.page.description;
  const submitLabel = useEnquiryFallback
    ? { idle: 'Send Request to Administrator', loading: 'Submitting...' }
    : PASSWORD_RESET_UI.form.submitButton;

  const workflowSteps = PASSWORD_RESET_FALLBACK.workflowSteps || [];
  const trustBadges   = PASSWORD_RESET_FALLBACK.trustBadges   || [];

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-50">
      {/* Ambient background: gradient + animated blobs (pure CSS, no libs) */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100"></div>
        <div className="absolute top-[-8rem] left-[-8rem] w-[28rem] h-[28rem] rounded-full bg-blue-400/25 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-8rem] right-[-8rem] w-[32rem] h-[32rem] rounded-full bg-indigo-500/25 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-[20rem] h-[20rem] rounded-full bg-cyan-300/20 blur-3xl animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-6xl grid lg:grid-cols-5 gap-6 lg:gap-8">

          {/* â”€â”€ LEFT / HERO COLUMN (2/5) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <aside className="lg:col-span-2 relative rounded-3xl overflow-hidden shadow-2xl min-h-[560px] lg:min-h-0
                            bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-900 text-white
                            p-8 lg:p-10 flex flex-col justify-between">
            {/* decorative rings */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-72 h-72 border-2 border-white/30 rounded-full"></div>
              <div className="absolute -bottom-24 -left-24 w-96 h-96 border-2 border-white/20 rounded-full"></div>
              <div className="absolute top-1/2 right-8 w-24 h-24 border-2 border-white/25 rounded-full"></div>
            </div>

            {/* Brand + animated lock */}
            <div className="relative">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-200 mb-6">
                <span className="w-6 h-px bg-blue-300"></span>
                RADAI Secure Access
              </div>

              <div className="relative mb-6 inline-flex">
                <div className="absolute inset-0 rounded-2xl bg-white/20 blur-xl animate-pulse"></div>
                <div className="relative w-20 h-20 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shadow-2xl">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold leading-tight mb-3">
                Locked out?<br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-200 to-white">
                  We'll get you back in.
                </span>
              </h1>
              <p className="text-blue-100 text-sm lg:text-base leading-relaxed max-w-md">
                For security, RADAI does not allow self-service password resets. Send a request to your
                administrator â€” they'll verify your identity and get you a new password within
                {' '}<span className="font-semibold text-white">{adminContact.slaHours} hours</span>.
              </p>
            </div>

            {/* Workflow timeline */}
            {useEnquiryFallback && workflowSteps.length > 0 && (
              <div className="relative mt-8">
                <div className="text-xs uppercase font-semibold tracking-wider text-blue-200 mb-4">How it works</div>
                <ol className="relative border-l border-white/20 ml-4 space-y-4">
                  {workflowSteps.map((step, idx) => (
                    <li key={idx} className="pl-5 relative">
                      <span className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-white text-indigo-800 text-xs font-bold flex items-center justify-center shadow-lg">
                        {idx + 1}
                      </span>
                      <div className="flex items-start gap-2">
                        <span className="text-lg leading-none">{step.icon}</span>
                        <div>
                          <div className="text-sm font-semibold text-white">{step.title}</div>
                          <div className="text-xs text-blue-200/90 leading-relaxed">{step.body}</div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Trust badges */}
            {trustBadges.length > 0 && (
              <div className="relative mt-6 pt-6 border-t border-white/15 flex flex-wrap gap-2">
                {trustBadges.map((b, idx) => (
                  <span key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs text-white/90">
                    <span>{b.icon}</span>{b.label}
                  </span>
                ))}
              </div>
            )}
          </aside>

          {/* â”€â”€ RIGHT / FORM COLUMN (3/5) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <section className="lg:col-span-3 rounded-3xl bg-white/90 backdrop-blur-xl shadow-2xl border border-white/60 p-8 lg:p-10">
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                {useEnquiryFallback ? 'Admin-Assisted Reset' : 'Password Recovery'}
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                {PASSWORD_RESET_UI.page.title}
              </h2>
              <p className="text-gray-600">{pageDescription}</p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-rose-50 p-4 flex items-start gap-3">
                <svg className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {PASSWORD_RESET_UI.form.emailLabel} <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-white/70 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                    placeholder={PASSWORD_RESET_UI.form.emailPlaceholder}
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Use the email associated with your RADAI account.
                </p>
              </div>

              {/* Reason (fallback only) */}
              {useEnquiryFallback && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Reason <span className="text-xs font-normal text-gray-400 ml-1">(optional but recommended)</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-white/70 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none"
                    placeholder="e.g. Forgot password after vacation, account locked, new device..."
                  />
                  <div className="mt-1.5 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Speeds up identity verification.</span>
                    <span className={reason.length > 450 ? 'text-orange-500' : 'text-gray-400'}>
                      {reason.length}/500
                    </span>
                  </div>
                </div>
              )}

              {/* Submit button â€” gradient + shine */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full py-3.5 px-4 rounded-xl font-semibold text-white overflow-hidden group
                           bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600
                           hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700
                           disabled:opacity-70 disabled:cursor-not-allowed
                           shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40
                           transition-all duration-200"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000"></span>
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {submitLabel.loading}
                    </>
                  ) : (
                    <>
                      {submitLabel.idle}
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Admin contact card â€” fallback only */}
            {useEnquiryFallback && (
              <div className="mt-7 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Need help urgently?
                  </p>
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Admin online
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <a
                    href={`mailto:${adminContact.email}?subject=Urgent Password Reset&body=Hello, I need help resetting my RADAI password.`}
                    className="group flex items-center gap-3 p-3.5 rounded-xl border-2 border-gray-100 bg-gradient-to-br from-white to-blue-50/50 hover:border-blue-400 hover:shadow-md transition-all"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 group-hover:bg-blue-500 group-hover:text-white flex items-center justify-center transition-colors">
                      <svg className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Email</div>
                      <div className="text-sm font-semibold text-gray-900 truncate" title={adminContact.email}>
                        {adminContact.email}
                      </div>
                    </div>
                  </a>
                  <a
                    href={`tel:${adminContact.phone.replace(/\s/g, '')}`}
                    className="group flex items-center gap-3 p-3.5 rounded-xl border-2 border-gray-100 bg-gradient-to-br from-white to-emerald-50/50 hover:border-emerald-400 hover:shadow-md transition-all"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-colors">
                      <svg className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Phone</div>
                      <div className="text-sm font-semibold text-gray-900 truncate" title={adminContact.phone}>
                        {adminContact.phone}
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            )}

            {/* Footer link */}
            <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="text-gray-500">{PASSWORD_RESET_UI.links.login.text}</span>
              <Link
                to={PASSWORD_RESET_UI.links.login.url}
                className="inline-flex items-center gap-1 text-blue-600 font-semibold hover:text-blue-700 hover:gap-2 transition-all"
              >
                {PASSWORD_RESET_UI.links.login.linkText}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RequestPasswordReset;
