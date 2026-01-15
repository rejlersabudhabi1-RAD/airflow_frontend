import React from 'react';
import { PageLayout } from '@/layouts/PageLayout';
import { MainHeader } from './components/Common/MainHeader';
import { Card, CardContent } from './components/ui/Card';
import { Leaf, Droplet, Recycle, Wind } from 'lucide-react';

const Environmental = () => {
  return (
    <PageLayout>
      <MainHeader 
        title="Environmental Management"
        subtitle="Track environmental impact, emissions, and sustainability initiatives"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Carbon Footprint"
          value="1,245 tCO₂"
          icon={Wind}
          color="blue"
          description="This year"
        />
        <MetricCard
          title="Waste Recycled"
          value="78%"
          icon={Recycle}
          color="green"
          description="Recycling rate"
        />
        <MetricCard
          title="Water Usage"
          value="12,500 m³"
          icon={Droplet}
          color="cyan"
          description="Monthly consumption"
        />
        <MetricCard
          title="Eco Score"
          value="8.5/10"
          icon={Leaf}
          color="teal"
          description="Environmental rating"
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Environmental Management Overview</h3>
          <p className="text-gray-600 mb-4">
            Comprehensive environmental management system for sustainability and compliance.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Carbon emissions monitoring</p>
            <p>• Waste management and recycling</p>
            <p>• Water and energy conservation</p>
            <p>• Environmental compliance tracking</p>
            <p>• Sustainability initiatives</p>
            <p>• Environmental impact assessments</p>
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
    cyan: 'bg-cyan-100 text-cyan-600',
    teal: 'bg-teal-100 text-teal-600'
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

export default Environmental;
