import React from 'react';
import { PageLayout } from '@/layouts/PageLayout';
import { MainHeader } from './components/Common/MainHeader';
import { Card, CardContent } from './components/ui/Card';
import { Zap, TrendingDown, Battery, Sun } from 'lucide-react';

const Energy = () => {
  return (
    <PageLayout>
      <MainHeader 
        title="Energy Management"
        subtitle="Monitor energy consumption, efficiency, and renewable initiatives"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Consumption"
          value="45,200 kWh"
          icon={Zap}
          color="yellow"
          description="This month"
        />
        <MetricCard
          title="Energy Savings"
          value="15%"
          icon={TrendingDown}
          color="green"
          description="vs last year"
        />
        <MetricCard
          title="Renewable Energy"
          value="32%"
          icon={Sun}
          color="orange"
          description="Solar & wind"
        />
        <MetricCard
          title="Efficiency Score"
          value="87%"
          icon={Battery}
          color="blue"
          description="Overall rating"
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Energy Management Overview</h3>
          <p className="text-gray-600 mb-4">
            Comprehensive energy management system for monitoring and optimizing energy usage.
          </p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Energy consumption monitoring</p>
            <p>• Renewable energy integration</p>
            <p>• Energy efficiency initiatives</p>
            <p>• Cost optimization strategies</p>
            <p>• Carbon reduction programs</p>
            <p>• Smart building technologies</p>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

const MetricCard = ({ title, value, icon: Icon, color, description }) => {
  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600'
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

export default Energy;
