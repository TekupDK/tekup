'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  Clock, 
  Globe,
  Smartphone,
  Monitor,
  Eye,
  MousePointer,
  RefreshCw,
  Download,
  Share,
  Filter,
  Calendar,
  MapPin,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar
} from 'recharts';

interface RealTimeMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  icon: any;
  color: string;
  format: 'number' | 'percentage' | 'currency' | 'time';
}

interface RealTimeEvent {
  id: string;
  type: 'lead' | 'conversion' | 'visit' | 'signup' | 'demo' | 'support';
  title: string;
  description: string;
  timestamp: Date;
  location?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  value?: number;
  metadata?: Record<string, any>;
}

interface AnalyticsData {
  metrics: RealTimeMetric[];
  events: RealTimeEvent[];
  chartData: {
    visitors: Array<{ time: string; visitors: number; conversions: number }>;
    devices: Array<{ name: string; value: number; color: string }>;
    locations: Array<{ country: string; visitors: number; conversions: number }>;
  };
}

const generateMockData = (): AnalyticsData => {
  // Mock real-time metrics
  const metrics: RealTimeMetric[] = [
    {
      id: 'active_visitors',
      name: 'Aktive Besøgende',
      value: Math.floor(Math.random() * 50) + 200,
      previousValue: 235,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      icon: Users,
      color: 'blue',
      format: 'number'
    },
    {
      id: 'conversion_rate',
      name: 'Konverteringsrate',
      value: Math.random() * 5 + 65,
      previousValue: 68.2,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      icon: Target,
      color: 'emerald',
      format: 'percentage'
    },
    {
      id: 'revenue_today',
      name: 'Indtægter I Dag',
      value: Math.random() * 5000 + 15000,
      previousValue: 18500,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      icon: TrendingUp,
      color: 'purple',
      format: 'currency'
    },
    {
      id: 'avg_session',
      name: 'Gennemsnitlig Session',
      value: Math.random() * 60 + 180,
      previousValue: 210,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      icon: Clock,
      color: 'orange',
      format: 'time'
    }
  ];

  // Calculate changes
  metrics.forEach(metric => {
    metric.change = metric.value - metric.previousValue;
    metric.changePercent = ((metric.change / metric.previousValue) * 100);
    metric.trend = metric.change > 0 ? 'up' : metric.change < 0 ? 'down' : 'stable';
  });

  // Mock recent events
  const eventTypes = ['lead', 'conversion', 'visit', 'signup', 'demo', 'support'] as const;
  const events: RealTimeEvent[] = Array.from({ length: 10 }, (_, i) => ({
    id: i.toString(),
    type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
    title: `Event ${i + 1}`,
    description: 'Lorem ipsum dolor sit amet',
    timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
    location: ['Denmark', 'Sweden', 'Norway', 'Germany', 'UK'][Math.floor(Math.random() * 5)],
    device: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)] as any,
    value: Math.random() * 1000
  }));

  // Mock chart data
  const now = new Date();
  const chartData = {
    visitors: Array.from({ length: 24 }, (_, i) => ({
      time: `${23 - i}:00`,
      visitors: Math.floor(Math.random() * 50) + 20,
      conversions: Math.floor(Math.random() * 10) + 5
    })).reverse(),
    devices: [
      { name: 'Desktop', value: 45, color: '#3B82F6' },
      { name: 'Mobile', value: 40, color: '#10B981' },
      { name: 'Tablet', value: 15, color: '#F59E0B' }
    ],
    locations: [
      { country: 'Denmark', visitors: 120, conversions: 25 },
      { country: 'Sweden', visitors: 85, conversions: 18 },
      { country: 'Norway', visitors: 65, conversions: 12 },
      { country: 'Germany', visitors: 45, conversions: 8 },
      { country: 'UK', visitors: 35, conversions: 6 }
    ]
  };

  return { metrics, events, chartData };
};

export function RealTimeAnalytics() {
  const [data, setData] = useState<AnalyticsData>(generateMockData());
  const [isLive, setIsLive] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Update data every 5 seconds when live
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setData(generateMockData());
    }, 5000);

    return () => clearInterval(interval);
  }, [isLive]);

  const formatValue = (value: number, format: RealTimeMetric['format']) => {
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `${Math.floor(value).toLocaleString('da-DK')} kr`;
      case 'time':
        return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;
      default:
        return Math.floor(value).toLocaleString('da-DK');
    }
  };

  const getTrendIcon = (trend: RealTimeMetric['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend: RealTimeMetric['trend']) => {
    switch (trend) {
      case 'up':
        return 'text-emerald-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const eventIcons = {
    lead: Target,
    conversion: TrendingUp,
    visit: Eye,
    signup: Users,
    demo: Monitor,
    support: AlertCircle
  };

  const eventColors = {
    lead: 'blue',
    conversion: 'emerald',
    visit: 'purple',
    signup: 'cyan',
    demo: 'orange',
    support: 'red'
  };

  const deviceIcons = {
    desktop: Monitor,
    mobile: Smartphone,
    tablet: Monitor
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Real-Time Analytics</h2>
          <p className="text-gray-300">Live performance data og bruger aktivitet</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Live Indicator */}
          <div className="flex items-center space-x-2">
            <Button
              variant={isLive ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className={`${
                isLive
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                  : 'bg-white/10 border-white/20 text-gray-300'
              }`}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
              {isLive ? 'Live' : 'Paused'}
            </Button>
          </div>

          {/* Time Range */}
          <div className="flex items-center space-x-1">
            {['1h', '24h', '7d', '30d'].map((range) => (
              <Button
                key={range}
                variant={selectedTimeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeRange(range)}
                className={`${
                  selectedTimeRange === range
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30'
                    : 'bg-white/10 border-white/20 text-gray-300'
                }`}
              >
                {range}
              </Button>
            ))}
          </div>

          {/* Actions */}
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-gray-300 hover:bg-white/20">
            <Download className="w-4 h-4 mr-2" />
            Eksporter
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2 }}
          >
            <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-${metric.color}-500/20 to-${metric.color}-600/20 flex items-center justify-center`}>
                    <metric.icon className={`w-5 h-5 text-${metric.color}-400`} />
                  </div>
                  {getTrendIcon(metric.trend)}
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-1">{metric.name}</p>
                  <p className="text-2xl font-bold text-white mb-1">
                    {formatValue(metric.value, metric.format)}
                  </p>
                  <div className="flex items-center space-x-1">
                    <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                      {metric.change > 0 ? '+' : ''}{formatValue(Math.abs(metric.change), metric.format)}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({metric.changePercent > 0 ? '+' : ''}{metric.changePercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                {/* Mini Progress Bar */}
                <div className="mt-3">
                  <Progress 
                    value={Math.abs(metric.changePercent) * 10} 
                    className={`h-1 ${metric.trend === 'up' ? 'text-emerald-400' : metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'}`} 
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Visitor Timeline */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 h-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Besøgende & Konverteringer (24t)
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.chartData.visitors}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(17, 24, 39, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke="#3B82F6"
                    fill="url(#visitorsGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="conversions"
                    stroke="#10B981"
                    fill="url(#conversionsGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="conversionsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Device Breakdown */}
        <div>
          <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 h-full">
            <CardHeader>
              <CardTitle className="text-white">Enheder</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <RechartsPieChart>
                  <Pie
                    data={data.chartData.devices}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.chartData.devices.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: 'rgba(17, 24, 39, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: 'white'
                    }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
              
              <div className="space-y-2 mt-4">
                {data.chartData.devices.map((device) => {
                  const Icon = deviceIcons[device.name.toLowerCase() as keyof typeof deviceIcons] || Monitor;
                  return (
                    <div key={device.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-300">{device.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: device.color }}
                        />
                        <span className="text-sm font-medium text-white">{device.value}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Live Activity Feed */}
        <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              Live Aktivitet
              <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-1 animate-pulse" />
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <AnimatePresence>
                {data.events.slice(0, 8).map((event, index) => {
                  const Icon = eventIcons[event.type];
                  const color = eventColors[event.type];
                  const DeviceIcon = deviceIcons[event.device || 'desktop'];

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-${color}-500/20 to-${color}-600/20 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 text-${color}-400`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-white text-sm">{event.title}</p>
                          <span className="text-xs text-gray-500">
                            {event.timestamp.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">{event.description}</p>
                        
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          {event.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.device && (
                            <div className="flex items-center space-x-1">
                              <DeviceIcon className="w-3 h-3" />
                              <span className="capitalize">{event.device}</span>
                            </div>
                          )}
                          {event.value && (
                            <div className="flex items-center space-x-1">
                              <span>{Math.floor(event.value).toLocaleString('da-DK')} kr</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Top Locations */}
        <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Top Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.chartData.locations.map((location, index) => (
                <motion.div
                  key={location.country}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{location.country}</p>
                      <p className="text-sm text-gray-400">{location.visitors} besøgende</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium text-emerald-400">{location.conversions}</p>
                    <p className="text-xs text-gray-500">konverteringer</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}