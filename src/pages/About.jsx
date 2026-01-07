import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  COMPANY_INFO,
  CORE_VALUES,
  MILESTONES,
  COMPANY_STATS,
  EXPERTISE_AREAS,
  TEAM_DEPARTMENTS,
  CERTIFICATIONS,
  AWARDS,
  ABOUT_CTA,
  getCompanyAge,
  getRecentAwards
} from '../config/about.config'
import {
  SparklesIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

/**
 * About Page Component
 * Smart, soft-coded design showcasing company information
 */

const About = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const companyAge = getCompanyAge()
  const recentAwards = getRecentAwards()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <SparklesIcon className="w-5 h-5 mr-2" />
              <span className="text-sm font-semibold">{companyAge}+ Years of Engineering Excellence</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              {COMPANY_INFO.name}
            </h1>
            
            <p className="text-2xl lg:text-3xl text-purple-100 font-bold mb-4">
              {COMPANY_INFO.tagline}
            </p>
            
            <p className="text-xl text-purple-100 max-w-4xl mx-auto mb-10 leading-relaxed">
              {COMPANY_INFO.description}
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/solutions"
                className="px-8 py-4 bg-white text-indigo-600 font-black rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl flex items-center gap-2"
              >
                Explore Solutions
                <ArrowRightIcon className="w-5 h-5" />
              </Link>
              <Link
                to="/enquiry"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white text-white font-bold rounded-xl hover:bg-white/20 transition-all transform hover:scale-105"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative -mt-16 z-10 mb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {COMPANY_STATS.map((stat) => (
              <div 
                key={stat.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 text-center transform hover:scale-105 transition-all duration-300 hover:shadow-2xl"
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-black text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text mb-1">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="py-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Vision */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl opacity-10"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mb-6">
                  <GlobeAltIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                  Our Vision
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  {COMPANY_INFO.vision}
                </p>
              </div>
            </div>

            {/* Mission */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl opacity-10"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-6">
                  <RocketLaunchIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                  Our Mission
                </h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  {COMPANY_INFO.mission}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Our Core Values
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CORE_VALUES.map((value) => {
              const Icon = value.icon
              return (
                <div
                  key={value.id}
                  className="group bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${value.color} rounded-2xl mb-6 transform group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Our Journey
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {companyAge} years of innovation and growth
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-indigo-500 to-purple-500 hidden lg:block"></div>

            <div className="space-y-12">
              {MILESTONES.map((milestone, index) => {
                const Icon = milestone.icon
                const isLeft = index % 2 === 0
                
                return (
                  <div
                    key={milestone.year}
                    className={`relative flex items-center ${isLeft ? 'lg:flex-row' : 'lg:flex-row-reverse'} flex-col`}
                  >
                    {/* Content */}
                    <div className={`w-full lg:w-5/12 ${isLeft ? 'lg:text-right lg:pr-12' : 'lg:text-left lg:pl-12'}`}>
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl transform hover:scale-105 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-3xl font-black text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">
                            {milestone.year}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          {milestone.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          {milestone.description}
                        </p>
                      </div>
                    </div>

                    {/* Icon in Center */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 hidden lg:flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full border-4 border-white dark:border-gray-900 shadow-xl z-10">
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Spacer */}
                    <div className="w-full lg:w-5/12"></div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Expertise Areas */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Our Expertise
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              World-class capabilities across multiple domains
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {EXPERTISE_AREAS.map((area) => {
              const Icon = area.icon
              return (
                <div
                  key={area.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r ${area.color} rounded-xl mb-4`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                    {area.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {area.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {area.technologies.map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-full"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Team Departments */}
      <section className="py-20 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Our Team
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Passionate experts dedicated to engineering excellence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TEAM_DEPARTMENTS.map((dept) => {
              const Icon = dept.icon
              return (
                <div
                  key={dept.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all text-center"
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${dept.color} rounded-full mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-black text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text mb-2">
                    {dept.size}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {dept.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {dept.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Certifications & Standards
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              Committed to excellence and compliance
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {CERTIFICATIONS.map((cert) => (
              <div
                key={cert.id}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all text-center"
              >
                <CheckBadgeIcon className="w-12 h-12 mx-auto text-green-600 mb-3" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {cert.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {cert.description}
                </p>
                <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                  {cert.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-black mb-6">
            Ready to Join the Future of Engineering?
          </h2>
          <p className="text-xl text-purple-100 mb-10 max-w-3xl mx-auto">
            Experience the power of AI-driven engineering solutions backed by {companyAge} years of expertise
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to={ABOUT_CTA.primary.link}
              className="px-8 py-4 bg-white text-indigo-600 font-black rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 shadow-2xl flex items-center gap-2"
            >
              {ABOUT_CTA.primary.text}
              <RocketLaunchIcon className="w-5 h-5" />
            </Link>
            <Link
              to={ABOUT_CTA.secondary.link}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border-2 border-white text-white font-bold rounded-xl hover:bg-white/20 transition-all transform hover:scale-105"
            >
              {ABOUT_CTA.secondary.text}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
