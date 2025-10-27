import { formatCurrency, formatHours, formatPercentage } from '../../../shared/utils';
import type { MonthlyStats } from '../../../shared/types';

interface DashboardStatsProps {
  stats: MonthlyStats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const cards = [
    {
      title: 'Total Jobs',
      value: stats.totalJobs.toString(),
      icon: '📋',
      color: 'bg-blue-500',
    },
    {
      title: 'Total Hours',
      value: formatHours(stats.totalHours),
      icon: '⏰',
      color: 'bg-green-500',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: '💰',
      color: 'bg-yellow-500',
    },
    {
      title: 'Total Profit',
      value: formatCurrency(stats.totalProfit),
      icon: '📈',
      color: 'bg-purple-500',
    },
    {
      title: 'Avg Hourly Rate',
      value: formatCurrency(stats.avgHourlyRate),
      icon: '💵',
      color: 'bg-indigo-500',
    },
    {
      title: 'FB Hours',
      value: formatHours(stats.fbHours),
      subtitle: `${formatPercentage((stats.fbHours / stats.totalHours) * 100)} of total`,
      icon: '👥',
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow p-6 border border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {card.value}
              </p>
              {card.subtitle && (
                <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
              )}
            </div>
            <div className={`p-3 rounded-full ${card.color} text-white`}>
              <span className="text-xl">{card.icon}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}