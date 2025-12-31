import React from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { Link } from 'react-router-dom'
import { BRANDING, PAGE_CONTENT, FORM_CONFIG, THEME, LOGIN_RESPONSIVE, ICON } from '../../config/login.config'

/**
 * LoginForm Component
 * Right side login form with validation
 * Fully responsive for all devices
 */
const LoginForm = ({ loginSchema, isLoading, onSubmit }) => {
  const { company } = BRANDING
  const { title, subtitle } = PAGE_CONTENT
  const { fields, buttons, options } = FORM_CONFIG
  const { colors, gradients } = THEME

  return (
    <div className={`${LOGIN_RESPONSIVE.form.wrapper}`}>
      <div className={`${LOGIN_RESPONSIVE.form.maxWidth} w-full ${LOGIN_RESPONSIVE.form.container}`}>
        {/* Mobile Logo */}
        <div className="lg:hidden text-center mb-2 sm:mb-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black mb-1" style={{ color: colors.primary }}>{company.name}</h1>
          <div className="flex items-center justify-center space-x-2">
            <div className={`h-0.5 w-6 sm:w-8 md:w-10 rounded-full`} style={{ background: gradients.accentLine }}></div>
            <span className="text-xs sm:text-sm font-semibold" style={{ color: colors.secondaryAccent }}>{company.product}</span>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-3 sm:mb-5">
          <h2 className={`${LOGIN_RESPONSIVE.form.title} font-bold bg-clip-text text-transparent mb-1`} style={{ backgroundImage: gradients.title }}>
            {title}
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm">
            {subtitle}
          </p>
        </div>

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={loginSchema}
          onSubmit={onSubmit}
        >
          {({ errors, touched }) => (
            <Form className="space-y-2.5 sm:space-y-3">
              {/* Email Field */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  {fields.email.label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 md:pl-4 flex items-center pointer-events-none">
                    <svg className={`${ICON.sm} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <Field
                    name="email"
                    type={fields.email.type}
                    className={`w-full pl-8 sm:pl-10 md:pl-12 pr-2 sm:pr-3 md:pr-4 ${LOGIN_RESPONSIVE.form.input} border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-gray-50 text-gray-900 placeholder-gray-500 transition-all text-xs sm:text-sm md:text-base ${
                      errors.email && touched.email ? 'border-red-400 focus:ring-red-100 focus:border-red-500' : 'border-gray-200'
                    }`}
                    placeholder={fields.email.placeholder}
                  />
                </div>
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-600 text-[10px] sm:text-xs md:text-sm mt-1 flex items-center font-medium"
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">
                  {fields.password.label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 md:pl-4 flex items-center pointer-events-none">
                    <svg className={`${ICON.sm} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <Field
                    name="password"
                    type={fields.password.type}
                    className={`w-full pl-8 sm:pl-10 md:pl-12 pr-2 sm:pr-3 md:pr-4 ${LOGIN_RESPONSIVE.form.input} border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-gray-50 text-gray-900 placeholder-gray-500 transition-all text-xs sm:text-sm md:text-base ${
                      errors.password && touched.password ? 'border-red-400 focus:ring-red-100 focus:border-red-500' : 'border-gray-200'
                    }`}
                    placeholder={fields.password.placeholder}
                  />
                </div>
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-600 text-[10px] sm:text-xs md:text-sm mt-1 flex items-center font-medium"
                />
              </div>

              {/* Remember & Forgot */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                {options.rememberMe.enabled && (
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-[10px] sm:text-xs md:text-sm text-gray-600 font-medium">{options.rememberMe.label}</span>
                  </label>
                )}
                <a href={buttons.forgotPassword.link} className="text-[10px] sm:text-xs md:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  {buttons.forgotPassword.text}
                </a>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full text-white font-bold ${LOGIN_RESPONSIVE.form.button} px-3 sm:px-4 md:px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 relative overflow-hidden group text-xs sm:text-sm md:text-base`}
                style={{ background: gradients.button }}
              >
                <div className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-20 transition-opacity duration-300" style={{ background: gradients.accentLine }}></div>
                {isLoading ? (
                  <>
                    <svg className={`animate-spin ${ICON.sm} text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="relative z-10">{buttons.submit.loadingText}</span>
                  </>
                ) : (
                  <>
                    <span className="relative z-10">{buttons.submit.text}</span>
                    <svg className={`${ICON.sm} relative z-10`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </Form>
          )}
        </Formik>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-center text-xs text-gray-500 mb-2">
            © 2025 RADAI. All rights reserved. v1.0.0
          </p>
          <div className="flex items-center justify-center space-x-4 text-xs">
            <Link to="/privacy-policy" className="text-gray-600 hover:text-blue-600 transition-colors">Privacy Policy</Link>
            <span className="text-gray-300">•</span>
            <Link to="/terms-of-service" className="text-gray-600 hover:text-blue-600 transition-colors">Terms of Service</Link>
            <span className="text-gray-300">•</span>
            <a href="https://www.rejlers.com/ae/contact-us/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginForm
