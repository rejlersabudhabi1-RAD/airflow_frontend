import React from 'react';
import { PageLayout } from '@/layouts/PageLayout';
import { MainHeader } from './components/Common/MainHeader';
import { Card, CardContent } from './components/ui/Card';
import { Shield, AlertCircle, UserCheck, Activity } from 'lucide-react';

const HealthSafety = () => {
  return (
    <PageLayout>
      <MainHeader 
        title="Health and Safety"
        subtitle="Monitor workplace safety, incidents, and HSE compliance"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Safety Score"
          value="95%"
          icon={Shield}
          color="green"
          description="Overall safety rating"
        />
        <MetricCard
          title="Incidents"
          value="2"
          icon={AlertCircle}
          color="red"
          description="This month"
        />
        <MetricCard
          title="Training Completed"
          value="148"
          icon={UserCheck}
          color="blue"
          description="Staff certifications"
        />
        <MetricCard
          title="Safety Audits"
          value="12"
          icon={Activity}
          color="purple"
          description="Conducted this quarter"
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Health and Safety Overview</h3>
          <p className="text-gray-600 mb-4">
            Comprehensive health and safety management system for workplace safety and compliance.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Incident tracking and investigation</p>
            <p>• Safety training and certifications</p>
            <p>• Risk assessments and mitigation</p>
            <p>• PPE management</p>
            <p>• Emergency response procedures</p>
            <p>• Safety committee meetings</p>
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
    red: 'bg-red-100 text-red-600',
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

export default HealthSafety;
