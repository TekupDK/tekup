import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardHeader, CardBody } from '../ui/Card';

interface BusinessMetricsData {
  timestamp: string;
  revenue: number;
  users: number;
  conversions: number;
  orders: number;
}

interface UserActivityData {
  date: string;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  sessionDuration: number;
}

interface ConversionData {
  stage: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface BusinessMetricsChartProps {
  revenueData: BusinessMetricsData[];
  userActivityData: UserActivityData[];
  timeRange: '7d' | '30d' | '90d' | '1y';
}

export function BusinessMetricsChart({
  revenueData,
  userActivityData
}: BusinessMetricsChartProps) {
  // Conversion funnel data
  const conversionData: ConversionData[] = [
    { stage: 'Visitors', value: 10000, color: '#3b82f6' },
    { stage: 'Sign-ups', value: 2500, color: '#10b981' },
    { stage: 'Active Users', value: 1500, color: '#f59e0b' },
    { stage: 'Conversions', value: 324, color: '#ef4444' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'revenue' && 'Revenue: '}
              {entry.dataKey === 'users' && 'Users: '}
              {entry.dataKey === 'conversions' && 'Conversions: '}
              {entry.dataKey === 'orders' && 'Orders: '}
              {entry.dataKey === 'activeUsers' && 'Active Users: '}
              {entry.dataKey === 'newUsers' && 'New Users: '}
              {entry.dataKey === 'returningUsers' && 'Returning Users: '}
              {entry.dataKey === 'sessionDuration' && 'Avg Session: '}
              <span className="font-medium">
                {entry.value}
                {entry.dataKey === 'revenue' ? '€' : ''}
                {entry.dataKey === 'sessionDuration' ? 'min' : ''}
              </span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Revenue Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Revenue Trend
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Monthly revenue performance
            </p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="timestamp" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#6b7280' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#6b7280' }}
                  label={{ value: 'Revenue (€)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="#10b981"
                  fillOpacity={0.2}
                  name="Revenue (€)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* User Activity */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              User Activity
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Daily user engagement metrics
            </p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userActivityData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#6b7280' }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={{ stroke: '#6b7280' }}
                  label={{ value: 'Users', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                  name="Active Users"
                />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                  name="New Users"
                />
                <Line
                  type="monotone"
                  dataKey="returningUsers"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', strokeWidth: 2, r: 3 }}
                  name="Returning Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Conversion Funnel
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              User journey conversion rates
            </p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={conversionData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis 
                  type="category" 
                  dataKey="stage" 
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {data.stage}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Count: {(data as any).value.toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="#8b5cf6"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Conversion Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Conversion Distribution
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Conversion rates by stage
            </p>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={conversionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props) => {
                    const entry = props as unknown as ConversionData;
                    return entry.stage && entry.value 
                      ? `${entry.stage}: ${((entry.value / conversionData[0].value) * 100).toFixed(1)}%`
                      : '';
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {conversionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {data.stage}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {data.value.toLocaleString()} users
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}