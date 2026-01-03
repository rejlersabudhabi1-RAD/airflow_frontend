import React from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { Link } from 'react-router-dom'
import { BRANDING, PAGE_CONTENT, FORM_CONFIG, THEME, LOGIN_RESPONSIVE, ICON } from '../../config/login.config'

/**
 * LoginForm Component
 * Right side login form - Oil & Gas Industrial Design
 * Advanced Engineering Interface
 */
const LoginForm = ({ loginSchema, isLoading, onSubmit }) => {
  const { company } = BRANDING
  const { title, subtitle } = PAGE_CONTENT
  const { fields, buttons, options } = FORM_CONFIG
  const { colors, gradients } = THEME

  return (
    <div className={`${LOGIN_RESPONSIVE.form.wrapper} relative`}>
      {/* Subtle Technical Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-full blur-3xl"></div>
      </div>

      <div className={`${LOGIN_RESPONSIVE.form.maxWidth} w-full ${LOGIN_RESPONSIVE.form.container} relative z-10`}>
        {/* Mobile Logo - Enhanced */}
        <div className="lg:hidden text-center mb-6">
          <div className="inline-flex items-center space-x-2 mb-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
              </svg>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{company.name}</h1>
              <p className="text-xs font-semibold text-amber-600">{company.product}</p>
            </div>
          </div>
        </div>

        {/* Welcome Message - Industrial Style */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center space-x-2 mb-3">
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            <div className="w-8 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-black mb-2 bg-gradient-to-r from-slate-800 via-blue-700 to-cyan-700 bg-clip-text text-transparent">
            {title}
          </h2>
          <p className="text-gray-600 text-sm font-medium">
            {subtitle}
          </p>
          
          {/* Technical Indicator */}
          <div className="flex items-center justify-center space-x-2 mt-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-gray-500 font-medium">Secure Industrial Portal</span>
          </div>
        </div>

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={loginSchema}
          onSubmit={onSubmit}
        >
          {({ errors, touched }) => (
            <Form className="space-y-5">
              {/* Email Field - Enhanced Industrial Design */}
              <div className="relative group">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <span className="w-1 h-4 bg-gradient-to-b from-blue-600 to-cyan-600 rounded-full mr-2"></span>
                  {fields.email.label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                  </div>
                  <Field
                    name="email"
                    type={fields.email.type}
                    className={`w-full pl-20 pr-4 py-4 text-base border-2 rounded-xl 
                      ${errors.email && touched.email 
                        ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                      }
                      bg-white text-gray-900 placeholder-gray-400 
                      transition-all duration-300 font-medium
                      shadow-sm hover:shadow-md focus:shadow-lg`}
                    placeholder={fields.email.placeholder}
                  />
                  {/* Technical Corner Accent */}
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-blue-300 rounded-tr-xl opacity-50"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-300 rounded-bl-xl opacity-50"></div>
                </div>
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-600 text-xs mt-2 flex items-center font-semibold"
                />
              </div>

              {/* Password Field - Enhanced Industrial Design */}
              <div className="relative group">
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <span className="w-1 h-4 bg-gradient-to-b from-amber-600 to-orange-600 rounded-full mr-2"></span>
                  {fields.password.label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <Field
                    name="password"
                    type={fields.password.type}
                    className={`w-full pl-20 pr-4 py-4 text-base border-2 rounded-xl 
                      ${errors.password && touched.password 
                        ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100' 
                        : 'border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                      }
                      bg-white text-gray-900 placeholder-gray-400 
                      transition-all duration-300 font-medium
                      shadow-sm hover:shadow-md focus:shadow-lg`}
                    placeholder={fields.password.placeholder}
                  />
                  {/* Technical Corner Accent */}
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-300 rounded-tr-xl opacity-50"></div>
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-orange-300 rounded-bl-xl opacity-50"></div>
                </div>
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-600 text-xs mt-2 flex items-center font-semibold"
                />
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between pt-2">
                {options.rememberMe.enabled && (
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                    />
                    <span className="ml-3 text-sm text-gray-700 font-semibold group-hover:text-blue-600 transition-colors">{options.rememberMe.label}</span>
                  </label>
                )}
                <a href={buttons.forgotPassword.link} className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center group">
                  {buttons.forgotPassword.text}
                  <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </a>
              </div>

              {/* Sign In Button - Industrial Engineering Style */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full text-white font-bold py-4 px-6 rounded-xl overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group shadow-xl hover:shadow-2xl"
                style={{ 
                  background: 'linear-gradient(135deg, #1e40af 0%, #0891b2 50%, #06b6d4 100%)',
                }}
              >
                {/* Animated Background Layer */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Technical Grid Overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                                   linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }}></div>

                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white/30 rounded-tl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white/30 rounded-br-xl"></div>

                {/* Button Content */}
                <div className="relative z-10 flex items-center justify-center space-x-3">
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="text-lg tracking-wide">{buttons.submit.loadingText}</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                      </svg>
                      <span className="text-lg tracking-wide">{buttons.submit.text}</span>
                      <svg className="w-6 h-6 transform group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </div>
              </button>

              {/* Security Badge */}
              <div className="flex items-center justify-center space-x-2 pt-3">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span className="text-xs text-gray-600 font-semibold">256-bit SSL Encrypted Connection</span>
              </div>
            </Form>
          )}
        </Formik>

        {/* Footer - Industrial Style */}
        <div className="mt-8 pt-6 border-t-2 border-gray-200">
          {/* Quick Links */}
          <div className="flex items-center justify-center space-x-6 mb-4">
            <a href="#" className="text-xs text-gray-600 hover:text-blue-600 font-semibold transition-colors flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Help Center
            </a>
            <a href="#" className="text-xs text-gray-600 hover:text-blue-600 font-semibold transition-colors flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Documentation
            </a>
          </div>

          {/* Copyright */}
          <p className="text-center text-xs text-gray-500 font-medium mb-3">
            © 2025 RADAI - Oil & Gas Engineering Platform. All rights reserved.
          </p>

          {/* Version & Status */}
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-gray-500 font-medium">v1.0.0</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-gray-500 font-medium">All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginForm
