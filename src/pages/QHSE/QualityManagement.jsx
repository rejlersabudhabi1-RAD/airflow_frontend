import React from 'react';
import { PageLayout } from '@/layouts/PageLayout';
import { MainHeader } from './components/Common/MainHeader';
import { Card, CardContent } from './components/ui/Card';
import { CheckCircle, AlertTriangle, FileCheck, TrendingUp } from 'lucide-react';

const QualityManagement = () => {
  return (
    <PageLayout>
      <MainHeader 
        title="Quality Management"
        subtitle="Monitor and manage quality metrics, audits, and compliance"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Quality Audits"
          value="24"
          icon={FileCheck}
          color="blue"
          description="Completed this month"
        />
        <MetricCard
          title="Compliance Rate"
          value="98.5%"
          icon={CheckCircle}
          color="green"
          description="Overall compliance"
        />
        <MetricCard
          title="Open NCs"
          value="8"
          icon={AlertTriangle}
          color="orange"
          description="Non-conformities"
        />
        <MetricCard
          title="Quality Score"
          value="9.2/10"
          icon={TrendingUp}
          color="purple"
          description="Average rating"
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quality Management Overview</h3>
          <p className="text-gray-600 mb-4">
            This section provides comprehensive quality management tools and metrics for your projects.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Quality audits and inspections</p>
            <p>• Non-conformance tracking</p>
            <p>• Compliance monitoring</p>
            <p>• Quality assurance metrics</p>
            <p>• Continuous improvement initiatives</p>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

const MetricCard = ({ title, value, icon: Icon, color, description }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QualityManagement;
