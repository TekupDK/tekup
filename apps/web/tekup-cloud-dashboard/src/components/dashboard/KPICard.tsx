import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardBody } from '../ui/Card';
import { KPIMetric } from '../../types';

interface KPICardProps {
  metric: KPIMetric;
}

export function KPICard({ metric }: KPICardProps) {
  const { label, value, change, trend, icon } = metric;

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <Card hover shadow="md" className="transition-all duration-200 hover:scale-105">
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            <div className={`flex items-center mt-2 text-sm ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="ml-1 font-medium">
                {change > 0 ? '+' : ''}
                {change}%
              </span>
              <span className="ml-2 text-gray-500 dark:text-gray-400">vs last period</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <span className="text-2xl" role="img" aria-label={label}>{icon}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
