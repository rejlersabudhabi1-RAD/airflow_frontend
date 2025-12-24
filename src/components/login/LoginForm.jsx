import React from 'react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import { BRANDING, PAGE_CONTENT, FORM_CONFIG, THEME } from '../../config/login.config'

/**
 * LoginForm Component
 * Right side login form with validation
 */
const LoginForm = ({ loginSchema, isLoading, onSubmit }) => {
  const { company } = BRANDING
  const { title, subtitle } = PAGE_CONTENT
  const { fields, buttons, options } = FORM_CONFIG
  const { gradients } = THEME

  return (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        {/* Mobile Logo */}
        <div className="lg:hidden text-center mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-1">{company.name}</h1>
          <div className="flex items-center justify-center space-x-2">
            <div className={`h-1 w-12 bg-gradient-to-r ${gradients.accentLine} rounded-full`}></div>
            <span className="text-amber-600 text-base font-semibold">{company.product}</span>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className={`text-3xl font-bold bg-gradient-to-r ${gradients.title} bg-clip-text text-transparent mb-2`}>
            {title}
          </h2>
          <p className="text-gray-600">
            {subtitle}
          </p>
        </div>

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={loginSchema}
          onSubmit={onSubmit}
        >
          {({ errors, touched }) => (
            <Form className="space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {fields.email.label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <Field
                    name="email"
                    type={fields.email.type}
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-gray-50 text-gray-900 placeholder-gray-500 transition-all ${
                      errors.email && touched.email ? 'border-red-400 focus:ring-red-100 focus:border-red-500' : 'border-gray-200'
                    }`}
                    placeholder={fields.email.placeholder}
                  />
                </div>
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-600 text-sm mt-2 flex items-center font-medium"
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {fields.password.label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <Field
                    name="password"
                    type={fields.password.type}
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-gray-50 text-gray-900 placeholder-gray-500 transition-all ${
                      errors.password && touched.password ? 'border-red-400 focus:ring-red-100 focus:border-red-500' : 'border-gray-200'
                    }`}
                    placeholder={fields.password.placeholder}
                  />
                </div>
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-600 text-sm mt-2 flex items-center font-medium"
                />
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                {options.rememberMe.enabled && (
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600 font-medium">{options.rememberMe.label}</span>
                  </label>
                )}
                <a href={buttons.forgotPassword.link} className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  {buttons.forgotPassword.text}
                </a>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-gradient-to-r ${gradients.button} hover:${gradients.buttonHover} text-white font-bold py-4 px-6 rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2 relative overflow-hidden group`}
              >
                <div className={`absolute inset-0 w-full h-full bg-gradient-to-r ${gradients.accentLine} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{buttons.submit.loadingText}</span>
                  </>
                ) : (
                  <>
                    <span>{buttons.submit.text}</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  )
}

export default LoginForm
