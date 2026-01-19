import React, { useState, useMemo, useCallback } from 'react';
import { 
  FileCheck, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Award,
  Target,
  BarChart3,
  ClipboardCheck,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, Line, LineChart, ComposedChart } from 'recharts';
import { MainHeader } from './components/Common/MainHeader';
import { LoadingState } from './components/Common/LoadingState';
import { ErrorState } from './components/Common/ErrorState';
import { useQHSERunningProjects } from './hooks/useQHSEProjects';
import { withDashboardControls } from '../../hoc/withPageControls';
import { PageControlButtons } from '../../components/PageControlButtons';
import {
  calculateQualityMetrics,
  getQualityPerformance,
  getComplianceStatus,
  generateAuditTimeline,
  generateNCTrend,
  getProjectsNeedingAttention,
  generateComplianceMatrix
} from './utils/qualityMetrics';
import {
  QualityMetricCard,
  QualityStatusBadge,
  QualityProgressBar,
  AuditTimelineItem,
  ProjectAttentionCard,
  ComplianceMatrixRow,
  QualityEmptyState
} from './components/Quality/QualityComponents';

const QualityManagement = ({ pageControls }) => {
  const { data: projectsData, loading, error, refetch, isRefreshing } = useQHSERunningProjects();
  const [selectedView, setSelectedView] = useState('overview'); // overview, audits, compliance, trends

  // Calculate all quality metrics
  const qualityMetrics = useMemo(() => {
    if (!projectsData || projectsData.length === 0) return null;
    return calculateQualityMetrics(projectsData);
  }, [projectsData]);

  const auditTimeline = useMemo(() => {
    if (!projectsData || projectsData.length === 0) return [];
    return generateAuditTimeline(projectsData);
  }, [projectsData]);

  const ncTrend = useMemo(() => {
    if (!projectsData || projectsData.length === 0) return [];
    return generateNCTrend(projectsData);
  }, [projectsData]);

  const projectsNeedingAttention = useMemo(() => {
    if (!projectsData || projectsData.length === 0) return [];
    return getProjectsNeedingAttention(projectsData, 5);
  }, [projectsData]);

  const complianceMatrix = useMemo(() => {
    if (!projectsData || projectsData.length === 0) return [];
    return generateComplianceMatrix(projectsData);
  }, [projectsData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6">
        <MainHeader 
          title="Quality Management"
          subtitle="Comprehensive quality management system"
        />
        <LoadingState message="Loading quality management data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6">
        <MainHeader 
          title="Quality Management"
          subtitle="Comprehensive quality management system"
        />
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!projectsData || projectsData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6">
        <MainHeader 
          title="Quality Management"
          subtitle="Comprehensive quality management system"
        />
        <QualityEmptyState message="No quality data available. Start by adding projects to the system." />
      </div>
    );
  }

  const qualityPerformance = getQualityPerformance(qualityMetrics.qualityScore);
  const complianceStatus = getComplianceStatus(qualityMetrics.complianceRate);
  const upcomingAudits = auditTimeline.filter(a => !a.isPast).slice(0, 5);
  const recentAudits = auditTimeline.filter(a => a.isPast).slice(-5).reverse();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <MainHeader 
        title="Quality Management"
        subtitle={`Monitoring ${projectsData.length} projects • ${qualityMetrics.totalAudits} audits • ${qualityMetrics.openCARs + qualityMetrics.openObs} open issues`}
      >
        <div className="flex items-center gap-3">
          <PageControlButtons controls={pageControls} />
          <button
            onClick={refetch}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </MainHeader>

      {/* View Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'audits', label: 'Audits', icon: ClipboardCheck },
          { id: 'compliance', label: 'Compliance', icon: CheckCircle },
          { id: 'trends', label: 'Trends', icon: TrendingUp }
        ].map(view => (
          <button
            key={view.id}
            onClick={() => setSelectedView(view.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedView === view.id
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            <view.icon size={16} />
            {view.label}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <QualityMetricCard
          title="Quality Score"
          value={`${qualityMetrics.qualityScore}/100`}
          subtitle={qualityPerformance.label}
          icon={Award}
          color={qualityPerformance.label === 'Excellent' ? 'green' : qualityPerformance.label === 'Good' ? 'blue' : 'orange'}
          description={`${qualityPerformance.icon} Overall quality performance`}
        />
        <QualityMetricCard
          title="Compliance Rate"
          value={`${qualityMetrics.complianceRate}%`}
          subtitle={complianceStatus.label}
          icon={CheckCircle}
          color={qualityMetrics.complianceRate >= 90 ? 'green' : qualityMetrics.complianceRate >= 75 ? 'blue' : 'orange'}
          description={`${qualityMetrics.closedCARs + qualityMetrics.closedObs} of ${qualityMetrics.totalCARs + qualityMetrics.totalObs} issues resolved`}
        />
        <QualityMetricCard
          title="Open Issues"
          value={qualityMetrics.openCARs + qualityMetrics.openObs}
          subtitle={`${qualityMetrics.openCARs} CARs • ${qualityMetrics.openObs} Obs`}
          icon={AlertTriangle}
          color={qualityMetrics.openCARs + qualityMetrics.openObs > 20 ? 'red' : qualityMetrics.openCARs + qualityMetrics.openObs > 10 ? 'orange' : 'green'}
          description="Requiring attention"
        />
        <QualityMetricCard
          title="Quality Audits"
          value={qualityMetrics.completedAudits}
          subtitle={`of ${qualityMetrics.totalAudits} total`}
          icon={FileCheck}
          color="purple"
          description={qualityMetrics.delayedAudits > 0 ? `${qualityMetrics.delayedAudits} delayed` : 'All on schedule'}
        />
      </div>

      {/* Dynamic Content Based on Selected View */}
      {selectedView === 'overview' && (
        <OverviewView 
          qualityMetrics={qualityMetrics}
          projectsNeedingAttention={projectsNeedingAttention}
          upcomingAudits={upcomingAudits}
          ncTrend={ncTrend}
        />
      )}

      {selectedView === 'audits' && (
        <AuditsView 
          upcomingAudits={upcomingAudits}
          recentAudits={recentAudits}
          qualityMetrics={qualityMetrics}
        />
      )}

      {selectedView === 'compliance' && (
        <ComplianceView 
          complianceMatrix={complianceMatrix}
          qualityMetrics={qualityMetrics}
        />
      )}

      {selectedView === 'trends' && (
        <TrendsView 
          ncTrend={ncTrend}
          projectsData={projectsData}
        />
      )}
    </div>
  );
};

// Overview View Component
const OverviewView = ({ qualityMetrics, projectsNeedingAttention, upcomingAudits, ncTrend }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Projects Needing Attention */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="text-red-500" size={20} />
            Projects Needing Attention
          </h3>
          {projectsNeedingAttention.length > 0 ? (
            <div className="space-y-3">
              {projectsNeedingAttention.map((project, idx) => (
                <ProjectAttentionCard key={project.projectNo} project={project} rank={idx + 1} />
              ))}
            </div>
          ) : (
            <QualityEmptyState message="All projects are performing well" icon={CheckCircle} />
          )}
        </div>
      </div>

      {/* Middle & Right Columns */}
      <div className="lg:col-span-2 space-y-6">
        {/* Non-Conformance Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={20} />
            Non-Conformance Distribution
          </h3>
          {ncTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ncTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="CARs" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Observations" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <QualityEmptyState message="No non-conformance data available" />
          )}
        </div>

        {/* Upcoming Audits */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardCheck className="text-purple-500" size={20} />
            Upcoming Audits
          </h3>
          {upcomingAudits.length > 0 ? (
            <div className="space-y-3">
              {upcomingAudits.map((audit, idx) => (
                <AuditTimelineItem key={`${audit.projectNo}-${audit.auditType}-${idx}`} audit={audit} />
              ))}
            </div>
          ) : (
            <QualityEmptyState message="No upcoming audits scheduled" icon={FileCheck} />
          )}
        </div>
      </div>
    </div>
  );
};

// Audits View Component
const AuditsView = ({ upcomingAudits, recentAudits, qualityMetrics }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Audits</h3>
        {upcomingAudits.length > 0 ? (
          <div className="space-y-3">
            {upcomingAudits.map((audit, idx) => (
              <AuditTimelineItem key={`upcoming-${idx}`} audit={audit} />
            ))}
          </div>
        ) : (
          <QualityEmptyState message="No upcoming audits" />
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Audits</h3>
        {recentAudits.length > 0 ? (
          <div className="space-y-3">
            {recentAudits.map((audit, idx) => (
              <AuditTimelineItem key={`recent-${idx}`} audit={audit} />
            ))}
          </div>
        ) : (
          <QualityEmptyState message="No recent audits" />
        )}
      </div>
    </div>
  );
};

// Compliance View Component
const ComplianceView = ({ complianceMatrix, qualityMetrics }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Compliance Matrix</h3>
        <div className="space-y-3">
          {complianceMatrix.map((category, idx) => (
            <ComplianceMatrixRow key={idx} category={category} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-2">CARs Resolution</h4>
          <QualityProgressBar 
            value={qualityMetrics.closedCARs} 
            max={qualityMetrics.totalCARs || 1}
            color="green"
            label={`${qualityMetrics.closedCARs} of ${qualityMetrics.totalCARs} closed`}
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Observations Resolution</h4>
          <QualityProgressBar 
            value={qualityMetrics.closedObs} 
            max={qualityMetrics.totalObs || 1}
            color="blue"
            label={`${qualityMetrics.closedObs} of ${qualityMetrics.totalObs} closed`}
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h4 className="text-sm font-medium text-gray-600 mb-2">Overall KPI Achievement</h4>
          <QualityProgressBar 
            value={qualityMetrics.avgKPI} 
            max={100}
            color="purple"
            label={`${qualityMetrics.avgKPI}% average`}
          />
        </div>
      </div>
    </div>
  );
};

// Trends View Component
const TrendsView = ({ ncTrend, projectsData }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Non-Conformance Trends</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={ncTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Legend />
            <Bar dataKey="CARs" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Observations" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="Total" stroke="#8b5cf6" strokeWidth={2} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Wrapper component to provide refetch functionality
const QualityManagementWithRefresh = (props) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  
  return <QualityManagement {...props} refetch={refetch} key={refreshTrigger} />;
};

export default withDashboardControls(QualityManagementWithRefresh, {
  autoRefreshInterval: 30000, // 30 seconds
  storageKey: 'qhseQualityManagementPageControls',
});
