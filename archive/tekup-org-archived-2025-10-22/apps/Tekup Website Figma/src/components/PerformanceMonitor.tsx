'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Activity, 
  Cpu, 
  Database, 
  Globe, 
  HardDrive,
  Wifi,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Server,
  Shield,
  Eye,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  status: 'healthy' | 'warning' | 'critical';
  threshold: { warning: number; critical: number };
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface ServiceStatus {
  id: string;
  name: string;
  status: 'online' | 'degraded' | 'offline';
  uptime: number;
  responseTime: number;
  lastChecked: Date;
  url?: string;
}

interface PerformanceAlert {
  id: string;
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  component: string;
}

const generateSystemMetrics = (): SystemMetric[] => [
  {
    id: 'cpu',
    name: 'CPU Forbrug',
    value: Math.random() * 30 + 20,
    status: 'healthy',
    threshold: { warning: 70, critical: 90 },
    unit: '%',
    trend: 'stable',
    change: Math.random() * 4 - 2
  },
  {
    id: 'memory',
    name: 'Hukommelse',
    value: Math.random() * 20 + 45,
    status: 'healthy',
    threshold: { warning: 80, critical: 95 },
    unit: '%',
    trend: 'up',
    change: Math.random() * 3
  },
  {
    id: 'disk',
    name: 'Disk Plads',
    value: Math.random() * 15 + 30,
    status: 'healthy',
    threshold: { warning: 85, critical: 95 },
    unit: '%',
    trend: 'up',
    change: Math.random() * 2
  },
  {
    id: 'network',
    name: 'Netværk I/O',
    value: Math.random() * 50 + 100,
    status: 'healthy',
    threshold: { warning: 500, critical: 1000 },
    unit: 'MB/s',
    trend: 'stable',
    change: Math.random() * 20 - 10
  }
];

const generateServiceStatus = (): ServiceStatus[] => [
  {
    id: 'api',
    name: 'Main API',
    status: 'online',
    uptime: 99.97,
    responseTime: Math.random() * 50 + 120,
    lastChecked: new Date(),
    url: 'api.tekup.dk'
  },
  {
    id: 'database',
    name: 'Database',
    status: 'online',
    uptime: 99.99,
    responseTime: Math.random() * 20 + 15,
    lastChecked: new Date(),
    url: 'db.tekup.dk'
  },
  {
    id: 'cdn',
    name: 'CDN',
    status: 'online',
    uptime: 99.95,
    responseTime: Math.random() * 30 + 45,
    lastChecked: new Date(),
    url: 'cdn.tekup.dk'
  },
  {
    id: 'ai',
    name: 'Jarvis AI',
    status: Math.random() > 0.1 ? 'online' : 'degraded',
    uptime: 99.8,
    responseTime: Math.random() * 200 + 300,
    lastChecked: new Date(),
    url: 'ai.tekup.dk'
  },
  {
    id: 'auth',
    name: 'Authentication',
    status: 'online',
    uptime: 99.99,
    responseTime: Math.random() * 100 + 80,
    lastChecked: new Date(),
    url: 'auth.tekup.dk'
  }
];

const generateAlerts = (): PerformanceAlert[] => [
  {
    id: '1',
    severity: 'warning',
    title: 'Høj database responstid',
    message: 'Database responstid er steget til 245ms i de sidste 10 minutter',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    resolved: false,
    component: 'Database'
  },
  {
    id: '2',
    severity: 'info',
    title: 'Automatisk scaling aktiveret',
    message: 'API servere skaleret op fra 3 til 5 instanser pga. øget trafik',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    resolved: true,
    component: 'API'
  },
  {
    id: '3',
    severity: 'error',
    title: 'SSL certifikat udløber snart',
    message: 'SSL certifikat for cdn.tekup.dk udløber om 7 dage',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    resolved: false,
    component: 'CDN'
  }
];

// Generate historical performance data
const generateHistoricalData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }),
      cpu: Math.random() * 30 + 20,
      memory: Math.random() * 20 + 45,
      network: Math.random() * 50 + 100,
      responseTime: Math.random() * 100 + 150
    });
  }
  
  return data;
};

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<SystemMetric[]>(generateSystemMetrics());
  const [services, setServices] = useState<ServiceStatus[]>(generateServiceStatus());
  const [alerts, setAlerts] = useState<PerformanceAlert[]>(generateAlerts());
  const [historicalData] = useState(generateHistoricalData());
  const [selectedMetric, setSelectedMetric] = useState<string>('cpu');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Update metrics every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setMetrics(generateSystemMetrics());
      setServices(generateServiceStatus());
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getStatusColor = (status: 'healthy' | 'warning' | 'critical' | 'online' | 'degraded' | 'offline') => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-400/30';
      case 'warning':
      case 'degraded':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      case 'critical':
      case 'offline':
        return 'text-red-400 bg-red-500/20 border-red-400/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'critical' | 'online' | 'degraded' | 'offline') => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="w-4 h-4" />;
      case 'critical':
      case 'offline':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: 'info' | 'warning' | 'error') => {
    switch (severity) {
      case 'info':
        return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      case 'error':
        return 'text-red-400 bg-red-500/20 border-red-400/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
    }
  };

  const getMetricIcon = (id: string) => {
    switch (id) {
      case 'cpu': return <Cpu className="w-5 h-5" />;
      case 'memory': return <Database className="w-5 h-5" />;
      case 'disk': return <HardDrive className="w-5 h-5" />;
      case 'network': return <Wifi className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  const formatResponseTime = (time: number) => {
    return `${Math.round(time)}ms`;
  };

  // Update metric status based on value
  useEffect(() => {
    setMetrics(prevMetrics => 
      prevMetrics.map(metric => {
        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        
        if (metric.value >= metric.threshold.critical) {
          status = 'critical';
        } else if (metric.value >= metric.threshold.warning) {
          status = 'warning';
        }
        
        return { ...metric, status };
      })
    );
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">System Performance</h2>
          <p className="text-gray-300">Real-time monitoring af system sundhed og performance</p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`${
              autoRefresh
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                : 'bg-white/10 border-white/20 text-gray-300'
            }`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          
          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
            <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
            Alle systemer operationelle
          </Badge>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -2 }}
          >
            <Card 
              className={`bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer ${
                selectedMetric === metric.id ? 'ring-2 ring-cyan-400/50' : ''
              }`}
              onClick={() => setSelectedMetric(metric.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                      {getMetricIcon(metric.id)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{metric.name}</p>
                      <p className="text-xs text-gray-400">
                        {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'} 
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}{metric.unit}
                      </p>
                    </div>
                  </div>
                  
                  <Badge className={getStatusColor(metric.status)}>
                    {getStatusIcon(metric.status)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-white">
                      {metric.value.toFixed(1)}{metric.unit}
                    </span>
                  </div>
                  
                  <Progress 
                    value={metric.unit === '%' ? metric.value : (metric.value / metric.threshold.critical) * 100} 
                    className={`h-2 ${
                      metric.status === 'healthy' ? 'text-emerald-400' : 
                      metric.status === 'warning' ? 'text-yellow-400' : 'text-red-400'
                    }`}
                  />
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Threshold: {metric.threshold.warning}{metric.unit}</span>
                    <span>Max: {metric.threshold.critical}{metric.unit}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts and Services */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Performance Historie (24t)
                <div className="flex items-center space-x-2">
                  {['cpu', 'memory', 'network'].map((metric) => (
                    <Button
                      key={metric}
                      variant={selectedMetric === metric ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedMetric(metric)}
                      className={`text-xs ${
                        selectedMetric === metric
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/30'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {metric.toUpperCase()}
                    </Button>
                  ))}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={historicalData}>
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
                    dataKey={selectedMetric}
                    stroke="#00D2FF"
                    fill="url(#metricGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D2FF" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00D2FF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Service Status */}
        <div>
          <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Server className="w-5 h-5 mr-2" />
                Service Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(service.status)}>
                          {getStatusIcon(service.status)}
                        </Badge>
                        <div>
                          <p className="font-medium text-white text-sm">{service.name}</p>
                          <p className="text-xs text-gray-400">{service.url}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-emerald-400">{formatUptime(service.uptime)}</p>
                        <p className="text-xs text-gray-400">uptime</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatResponseTime(service.responseTime)}</span>
                      </div>
                      <span>Checked {service.lastChecked.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alerts */}
      <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              System Alerts
            </div>
            <Badge className="bg-yellow-500/20 text-yellow-400 border border-yellow-400/30">
              {alerts.filter(a => !a.resolved).length} aktive
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border transition-all ${
                  alert.resolved 
                    ? 'bg-gray-800/50 border-gray-700/50 opacity-60' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.resolved ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    </Badge>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-medium ${alert.resolved ? 'text-gray-400' : 'text-white'}`}>
                          {alert.title}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {alert.component}
                        </Badge>
                      </div>
                      <p className={`text-sm mt-1 ${alert.resolved ? 'text-gray-500' : 'text-gray-300'}`}>
                        {alert.message}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{alert.timestamp.toLocaleString('da-DK')}</span>
                        </div>
                        {alert.resolved && (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 text-xs">
                            Løst
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {!alert.resolved && (
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setAlerts(prev => prev.map(a => 
                            a.id === alert.id ? { ...a, resolved: true } : a
                          ));
                        }}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}