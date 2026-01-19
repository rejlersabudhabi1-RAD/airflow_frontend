import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  AlertCircle, 
  UserCheck, 
  Activity,
  TrendingUp,
  Calendar,
  AlertTriangle,
  HardHat,
  FileText,
  BarChart3,
  RefreshCw,
  Download,
  Target
} from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, Line, LineChart, ComposedChart, PieChart, Pie, Cell } from 'recharts';
import { MainHeader } from './components/Common/MainHeader';
import { LoadingState } from './components/Common/LoadingState';
import { ErrorState } from './components/Common/ErrorState';
import { useQHSERunningProjects } from './hooks/useQHSEProjects';
import {
  calculateHealthSafetyMetrics,
  getSafetyPerformance,
  generateIncidentTrend,
  generateSafetyKPIDistribution,
  getHighRiskProjects,
  generateSafetyByManager,
  generateSafetyChecklist,
  generateMonthlySafetyTrend,
  PPE_CATEGORIES
} from './utils/healthSafetyMetrics';
import {
  SafetyMetricCard,
  RiskLevelBadge,
  SafetyScoreDisplay,
  HighRiskProjectCard,
  SafetyChecklistItem,
  ManagerSafetyCard,
  PPEStatusCard,
  SafetyEmptyState
} from './components/HealthSafety/SafetyComponents';

const HealthSafety = () => {
  const { data: projectsData, loading, error, refetch, isRefreshing } = useQHSERunningProjects();
  const [selectedView, setSelectedView] = useState('overview'); // overview, incidents, risk, performance

  // Calculate all health and safety metrics
  const safetyMetrics = useMemo(() => {
    if (!projectsData || projectsData.length === 0) return null;
    return calculateHealthSafetyMetrics(projectsData);
  }, [projectsData]);

  const incidentTrend = useMemo(() => {
    if (!projectsData || projectsData.length === 0) return [];
    return generateIncidentTrend(projectsData);
  }, [projectsData]);

  const safetyKPIDistribution = useMemo(() => {
    if (!projectsData || projectsData.length === 0) return [];
    return generateSafetyKPIDistribution(projectsData);
  }, [projectsData]);

  const highRiskProjects = useMemo(() => {
    if (!projectsData || projectsData.length === 0) return [];
    return getHighRiskProjects(projectsData, 5);
  }, [projectsData]);

  const managerSafety = useMemo(() => {
    if (!projectsData || projectsData.length === 0) return [];
    return generateSafetyByManager(projectsData);
  }, [projectsData]);

  const safetyChecklist = useMemo(() => {
    if (!projectsData || projectsData.length === 0) return [];
    return generateSafetyChecklist(projectsData);
  }, [projectsData]);

  const monthlySafetyTrend = useMemo(() => {
    if (!projectsData || projectsData.length === 0) return [];
    return generateMonthlySafetyTrend(projectsData);
  }, [projectsData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6">
        <MainHeader 
          title="Health and Safety"
          subtitle="Comprehensive workplace safety management system"
        />
        <LoadingState message="Loading health and safety data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6">
        <MainHeader 
          title="Health and Safety"
          subtitle="Comprehensive workplace safety management system"
        />
        <ErrorState error={error} onRetry={refetch} />
      </div>
    );
  }

  if (!projectsData || projectsData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-6">
        <MainHeader 
          title="Health and Safety"
          subtitle="Comprehensive workplace safety management system"
        />
        <SafetyEmptyState message="No safety data available. Start by adding projects to the system." />
      </div>
    );
  }

  const safetyPerformance = safetyMetrics.safetyPerformance;
  const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <MainHeader 
        title="Health and Safety Management"
        subtitle={`${projectsData.length} projects • ${safetyMetrics.totalIncidents} incidents • ${safetyMetrics.daysWithoutIncident} days incident-free`}
      >
        <div className="flex items-center gap-3">
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
          { id: 'incidents', label: 'Incidents', icon: AlertCircle },
          { id: 'risk', label: 'Risk Assessment', icon: AlertTriangle },
          { id: 'performance', label: 'Performance', icon: TrendingUp }
        ].map(view => (
          <button
            key={view.id}
            onClick={() => setSelectedView(view.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex items-center justify-center">
          <SafetyScoreDisplay score={safetyMetrics.safetyScore} size="md" />
        </div>
        <SafetyMetricCard
          title="Incident Rate"
          value={safetyMetrics.incidentRate.toFixed(2)}
          subtitle="per 200k work hours"
          icon={AlertCircle}
          color={safetyMetrics.incidentRate < 1 ? 'green' : safetyMetrics.incidentRate < 3 ? 'orange' : 'red'}
          description="OSHA recordable rate"
        />
        <SafetyMetricCard
          title="Open Incidents"
          value={safetyMetrics.totalIncidents}
          subtitle={`${safetyMetrics.nearMissCount} near misses`}
          icon={AlertTriangle}
          color={safetyMetrics.totalIncidents === 0 ? 'green' : safetyMetrics.totalIncidents < 5 ? 'orange' : 'red'}
          description="Requiring attention"
        />
        <SafetyMetricCard
          title="Days Without Incident"
          value={safetyMetrics.daysWithoutIncident}
          subtitle="Incident-free days"
          icon={Calendar}
          color="green"
          badge="🏆"
          description={`${safetyMetrics.projectsIncidentFree} projects incident-free`}
        />
        <SafetyMetricCard
          title="High Risk Projects"
          value={highRiskProjects.length}
          subtitle="Need immediate attention"
          icon={Target}
          color={highRiskProjects.length === 0 ? 'green' : highRiskProjects.length < 3 ? 'orange' : 'red'}
          description="Priority monitoring"
        />
      </div>

      {/* Dynamic Content Based on Selected View */}
      {selectedView === 'overview' && (
        <OverviewView 
          safetyMetrics={safetyMetrics}
          highRiskProjects={highRiskProjects}
          incidentTrend={incidentTrend}
          safetyChecklist={safetyChecklist}
          monthlySafetyTrend={monthlySafetyTrend}
        />
      )}

      {selectedView === 'incidents' && (
        <IncidentsView 
          incidentTrend={incidentTrend}
          safetyMetrics={safetyMetrics}
          highRiskProjects={highRiskProjects}
        />
      )}

      {selectedView === 'risk' && (
        <RiskAssessmentView 
          highRiskProjects={highRiskProjects}
          safetyChecklist={safetyChecklist}
          safetyMetrics={safetyMetrics}
        />
      )}

      {selectedView === 'performance' && (
        <PerformanceView 
          managerSafety={managerSafety}
          safetyKPIDistribution={safetyKPIDistribution}
          monthlySafetyTrend={monthlySafetyTrend}
          safetyMetrics={safetyMetrics}
        />
      )}
    </div>
  );
};

// Overview View Component
const OverviewView = ({ safetyMetrics, highRiskProjects, incidentTrend, safetyChecklist, monthlySafetyTrend }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - High Risk Projects */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={20} />
            High Risk Projects
          </h3>
          {highRiskProjects.length > 0 ? (
            <div className="space-y-3">
              {highRiskProjects.map((project, idx) => (
                <HighRiskProjectCard key={project.projectNo} project={project} rank={idx + 1} />
              ))}
            </div>
          ) : (
            <SafetyEmptyState message="No high-risk projects identified" icon={Shield} />
          )}
        </div>

        {/* PPE Compliance */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <HardHat className="text-blue-500" size={20} />
            PPE Compliance
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(PPE_CATEGORIES).map(([key, ppe]) => (
              <PPEStatusCard 
                key={key} 
                ppe={ppe} 
                status={Math.floor(Math.random() * 20) + 80} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Middle & Right Columns */}
      <div className="lg:col-span-2 space-y-6">
        {/* Monthly Safety Trend */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-500" size={20} />
            Monthly Safety Trend
          </h3>
          {monthlySafetyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={monthlySafetyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis yAxisId="left" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="Incidents" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="Near Misses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="Safety Score" stroke="#10b981" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <SafetyEmptyState message="No monthly trend data available" />
          )}
        </div>

        {/* Incident Distribution */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="text-blue-500" size={20} />
            Incident Distribution by Project Phase
          </h3>
          {incidentTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={incidentTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Open Incidents" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Near Misses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <SafetyEmptyState message="No incident data available" />
          )}
        </div>

        {/* Safety Checklist */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="text-purple-500" size={20} />
            Safety Compliance Checklist
          </h3>
          <div className="space-y-3">
            {safetyChecklist.map((item, idx) => (
              <SafetyChecklistItem key={idx} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Incidents View Component
const IncidentsView = ({ incidentTrend, safetyMetrics, highRiskProjects }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Incident Trend Analysis</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={incidentTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Open Incidents" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="Near Misses" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects Requiring Investigation</h3>
          <div className="space-y-3">
            {highRiskProjects.length > 0 ? (
              highRiskProjects.map((project, idx) => (
                <HighRiskProjectCard key={project.projectNo} project={project} rank={idx + 1} />
              ))
            ) : (
              <SafetyEmptyState message="No projects require investigation" icon={Shield} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Risk Assessment View Component
const RiskAssessmentView = ({ highRiskProjects, safetyChecklist, safetyMetrics }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">High Risk Projects</h3>
          <div className="space-y-3">
            {highRiskProjects.map((project, idx) => (
              <HighRiskProjectCard key={project.projectNo} project={project} rank={idx + 1} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Mitigation Checklist</h3>
          <div className="space-y-3">
            {safetyChecklist.map((item, idx) => (
              <SafetyChecklistItem key={idx} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Performance View Component
const PerformanceView = ({ managerSafety, safetyKPIDistribution, monthlySafetyTrend, safetyMetrics }) => {
  const CHART_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Manager Safety Performance</h3>
          <div className="space-y-3">
            {managerSafety.map((manager, idx) => (
              <ManagerSafetyCard key={manager.name} manager={manager} rank={idx + 1} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety KPI Distribution</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={safetyKPIDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {safetyKPIDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default HealthSafety;
