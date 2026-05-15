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
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import PaperSpecExtractor from './components/PaperSpecExtractor';

// ─── Soft-coded feature flags ───────────────────────────────────────────────
// Flip flags here to switch panels on/off without code churn.
const HUB_FEATURE_FLAGS = {
  SHOW_PAPER_SPEC_EXTRACTOR: true,   // live AI multi-format extractor
  SHOW_ROADMAP_GRID:         false,  // compact "coming next" strip — hidden until items go live
};

// ─── Soft-coded roadmap (compact cards) ─────────────────────────────────────
// NOTE: the old "Legacy Doc Extraction" disabled card has been removed —
// the Paper Spec Extractor above now delivers that capability live.
const roadmapTools = [
  {
    id: 'piping_spec_gen',
    name: 'Piping Spec Generator',
    description: 'Generate project-specific PMS from reference docs and project criteria.',
    icon: WrenchScrewdriverIcon,
    gradient: 'from-pink-500 to-rose-600',
    badge: 'AI · Planned',
  },
  {
    id: 'instrument_spec_gen',
    name: 'Instrument Spec Builder',
    description: 'Generate instrument datasheets from Instrument Index with AI parameter fill.',
    icon: CpuChipIcon,
    gradient: 'from-purple-500 to-pink-600',
    badge: 'AI · Planned',
  },
  {
    id: 'equipment_spec_gen',
    name: 'Equipment Spec Generator',
    description: 'Create detailed equipment specs from uploaded PFD, HMB and equipment data.',
    icon: CircleStackIcon,
    gradient: 'from-rose-500 to-pink-700',
    badge: 'AI · Planned',
  },
  {
    id: 'document_templating',
    name: 'Document Templating',
    description: 'Upload your template once; AI auto-fills repetitive fields across spec sheets.',
    icon: DocumentTextIcon,
    gradient: 'from-pink-600 to-fuchsia-600',
    badge: 'Planned',
  },
  {
    id: 'spec_qa_checker',
    name: 'Spec QA Checker',
    description: 'Cross-check specifications against project data book, P&IDs and line list.',
    icon: FunnelIcon,
    gradient: 'from-fuchsia-500 to-pink-600',
    badge: 'Planned',
  },
  {
    id: 'revision_manager',
    name: 'Revision Manager',
    description: 'Track and compare specification revisions with auto-generated change notes.',
    icon: ArrowPathIcon,
    gradient: 'from-pink-500 to-purple-600',
    badge: 'Planned',
  },
  {
    id: 'spec_catalogue',
    name: 'Spec Catalogue',
    description: 'Central library of approved specs, BOQs and standard drawings for reuse.',
    icon: TableCellsIcon,
    gradient: 'from-purple-600 to-rose-500',
    badge: 'Planned',
  },
];

const SpecCustomizationPage = () => {
  const navigate = useNavigate(); // reserved for future-enabled roadmap items
  void navigate;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
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
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium flex items-center gap-1">
              <CheckCircleIcon className="w-3.5 h-3.5" />
              1 Live
            </span>
          </div>
        </div>
      </div>

      {/* ── PRIMARY: Paper Spec Extractor (live AI panel) ─────────────── */}
      {HUB_FEATURE_FLAGS.SHOW_PAPER_SPEC_EXTRACTOR && (
        <div className="max-w-7xl mx-auto mb-10">
          <PaperSpecExtractor />
        </div>
      )}

      {/* ── ROADMAP: compact card strip ───────────────────────────────── */}
      {HUB_FEATURE_FLAGS.SHOW_ROADMAP_GRID && roadmapTools.length > 0 && (
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Roadmap — coming next
            </h2>
            <span className="text-xs text-gray-500">
              {roadmapTools.length} tool{roadmapTools.length !== 1 ? 's' : ''} planned
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {roadmapTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 opacity-80 hover:opacity-100 transition-opacity overflow-hidden"
                  title={tool.description}
                >
                  <div className={`h-1 -mx-3 -mt-3 mb-2 bg-gradient-to-r ${tool.gradient}`} />
                  <div className="flex items-start gap-2">
                    <div className={`p-1.5 rounded bg-gradient-to-r ${tool.gradient}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {tool.name}
                      </p>
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        {tool.badge}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                    {tool.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecCustomizationPage;
