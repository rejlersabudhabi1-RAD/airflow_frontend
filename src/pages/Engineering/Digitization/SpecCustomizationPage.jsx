import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CircleStackIcon,
  DocumentTextIcon,
  SparklesIcon,
  CpuChipIcon,
  TableCellsIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

/**
 * Spec Customization Page — Digitization discipline
 *
 * Soft-coded hub for AI-powered specification customization tools.
 * To add / remove / enable a card: edit the `specTools` array below.
 * No other file changes required.
 */

// ─── Soft-coded tool configuration ───────────────────────────────────────────
const specTools = [
  {
    id: 'piping_spec_gen',
    name: 'Piping Spec Generator',
    description:
      'AI-powered generation of project-specific Piping Material Specifications (PMS) from uploaded reference docs and project criteria.',
    icon: WrenchScrewdriverIcon,
    gradient: 'from-pink-500 to-rose-600',
    path: '/engineering/digitization/spec-customization/piping-spec',
    badge: 'AI',
    disabled: true,
    features: [
      'Auto-populate pipe class tables from P&ID',
      'Map fluid service to allowable materials',
      'Generate valve schedule per pipe class',
      'Export to Excel / PDF',
      'Revision tracking',
    ],
  },
  {
    id: 'instrument_spec_gen',
    name: 'Instrument Spec Builder',
    description:
      'Generate instrument datasheets and technical purchase specs from Instrument Index using AI-assisted parameter fill.',
    icon: CpuChipIcon,
    gradient: 'from-purple-500 to-pink-600',
    path: '/engineering/digitization/spec-customization/instrument-spec',
    badge: 'AI',
    disabled: true,
    features: [
      'Parse Instrument Index automatically',
      'AI fill for standard parameters',
      'IEC / ISA tag format support',
      'Bulk generation for all tags',
      'Configurable datasheet templates',
    ],
  },
  {
    id: 'equipment_spec_gen',
    name: 'Equipment Spec Generator',
    description:
      'Create detailed equipment technical specifications for mechanical packages from uploaded PFD, HMB, and equipment data.',
    icon: CircleStackIcon,
    gradient: 'from-rose-500 to-pink-700',
    path: '/engineering/digitization/spec-customization/equipment-spec',
    badge: 'AI',
    disabled: true,
    features: [
      'Extract duty conditions from HMB',
      'Generate vessel / pump / HEX specs',
      'Nozzle schedule auto-population',
      'Material selection assistant',
      'Contractor RFQ-ready output',
    ],
  },
  {
    id: 'document_templating',
    name: 'Document Templating',
    description:
      'Upload your company document template once and let AI auto-fill repetitive fields across hundreds of specification sheets.',
    icon: DocumentTextIcon,
    gradient: 'from-pink-600 to-fuchsia-600',
    path: '/engineering/digitization/spec-customization/templates',
    badge: 'Coming Soon',
    disabled: true,
    features: [
      'Custom template library',
      'Variable mapping engine',
      'Batch export (Word / PDF / Excel)',
      'Version control per template',
      'Multi-language output',
    ],
  },
  {
    id: 'spec_qa_checker',
    name: 'Spec QA Checker',
    description:
      'Automatically cross-check issued specifications against the project data book, P&IDs, and line list for inconsistencies.',
    icon: FunnelIcon,
    gradient: 'from-fuchsia-500 to-pink-600',
    path: '/engineering/digitization/spec-customization/qa-checker',
    badge: 'Coming Soon',
    disabled: true,
    features: [
      'Cross-reference spec vs P&ID tags',
      'Flag missing or conflicting data',
      'Consistency score per package',
      'PDF mark-up with comments',
      'QA report export',
    ],
  },
  {
    id: 'revision_manager',
    name: 'Revision Manager',
    description:
      'Track and compare specification revisions across project phases, auto-generate change notes, and maintain audit trail.',
    icon: ArrowPathIcon,
    gradient: 'from-pink-500 to-purple-600',
    path: '/engineering/digitization/spec-customization/revision-manager',
    badge: 'Coming Soon',
    disabled: true,
    features: [
      'Side-by-side revision diff',
      'Auto-generated change summary',
      'Approval workflow integration',
      'ISO 19650 metadata tagging',
      'Full audit trail per spec',
    ],
  },
  {
    id: 'data_extraction',
    name: 'Legacy Doc Extraction',
    description:
      'Digitize legacy PDF specifications using AI OCR — extract structured data tables and export to editable formats.',
    icon: SparklesIcon,
    gradient: 'from-rose-600 to-fuchsia-700',
    path: '/engineering/digitization/spec-customization/extraction',
    badge: 'AI',
    disabled: true,
    features: [
      'Scanned PDF OCR extraction',
      'Table structure recognition',
      'Export to Excel / JSON',
      'Confidence scoring per field',
      'Batch processing queue',
    ],
  },
  {
    id: 'spec_catalogue',
    name: 'Spec Catalogue',
    description:
      'Central searchable library of approved company specifications, BOQs, and standard drawings for reuse across projects.',
    icon: TableCellsIcon,
    gradient: 'from-purple-600 to-rose-500',
    path: '/engineering/digitization/spec-customization/catalogue',
    badge: 'Coming Soon',
    disabled: true,
    features: [
      'Full-text spec search',
      'Filter by discipline / project',
      'Version history per document',
      'One-click clone to new project',
      'Access control per user role',
    ],
  },
];
// ─────────────────────────────────────────────────────────────────────────────

const SpecCustomizationPage = () => {
  const navigate = useNavigate();

  const handleNavigate = (tool) => {
    if (!tool.disabled) {
      navigate(tool.path);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Spec Customization
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              AI-powered specification generation, customization, and quality assurance tools
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full text-sm font-medium">
              Digitization
            </span>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium flex items-center gap-1">
              <SparklesIcon className="w-3.5 h-3.5" />
              AI Powered
            </span>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-xl p-4 flex items-start gap-3">
          <SparklesIcon className="w-6 h-6 text-pink-600 dark:text-pink-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-pink-800 dark:text-pink-300 font-semibold text-sm">
              Spec Customization Suite — Under Development
            </p>
            <p className="text-pink-700 dark:text-pink-400 text-sm mt-1">
              These AI-powered tools are currently in development. They will enable your team to
              auto-generate, customise, cross-check, and manage engineering specifications directly
              from project data — eliminating manual effort and reducing transcription errors.
            </p>
          </div>
        </div>
      </div>

      {/* ── Tool Cards Grid ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specTools.map((tool) => {
            const IconComponent = tool.icon;
            const isDisabled = tool.disabled ?? true;
            const isAI = tool.badge === 'AI';

            return (
              <div
                key={tool.id}
                className={`
                  relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden
                  transition-all duration-300
                  ${isDisabled
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:shadow-2xl hover:-translate-y-1 cursor-pointer'}
                `}
                onClick={() => handleNavigate(tool)}
              >
                {/* Gradient top bar */}
                <div className={`h-2 bg-gradient-to-r ${tool.gradient}`} />

                {/* Card body */}
                <div className="p-6">
                  {/* Icon + Title */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg bg-gradient-to-r ${tool.gradient} ${isDisabled ? 'opacity-50' : ''}`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {tool.name}
                        </h3>
                        {tool.badge && (
                          <span className={`
                            inline-block px-2 py-1 text-xs font-medium rounded-full mt-1
                            ${isAI
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
                          `}>
                            {isAI && <span className="mr-1">✦</span>}{tool.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                    {tool.description}
                  </p>

                  {/* Features */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Key Capabilities:
                    </p>
                    <ul className="space-y-1">
                      {tool.features.slice(0, 3).map((feature, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 dark:bg-pink-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {tool.features.length} capabilities planned
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      In Development
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SpecCustomizationPage;
