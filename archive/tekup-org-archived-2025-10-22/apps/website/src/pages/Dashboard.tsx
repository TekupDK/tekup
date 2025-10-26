import { Activity, Brain, ChevronRight, Clock, Database, Shield, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ErrorBoundary from "../components/ErrorBoundary";
import LoadingSpinner from "../components/LoadingSpinner";

const Dashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    activeImplementations: 200,
    dataStreams: 847000,
    efficiency: 45,
    uptime: 99.7
  });

  // Sample data for charts
  const performanceData = [
    { time: '00:00', cpu: 45, memory: 62, network: 23 },
    { time: '02:00', cpu: 52, memory: 68, network: 31 },
    { time: '04:00', cpu: 38, memory: 55, network: 18 },
    { time: '06:00', cpu: 71, memory: 78, network: 42 },
    { time: '08:00', cpu: 89, memory: 85, network: 67 },
    { time: '10:00', cpu: 94, memory: 91, network: 78 },
    { time: '12:00', cpu: 87, memory: 89, network: 71 },
    { time: '14:00', cpu: 76, memory: 82, network: 58 },
    { time: '16:00', cpu: 82, memory: 86, network: 64 },
    { time: '18:00', cpu: 69, memory: 75, network: 45 },
    { time: '20:00', cpu: 54, memory: 67, network: 34 },
    { time: '22:00', cpu: 48, memory: 61, network: 28 }
  ];

  const aiModelData = [
    { name: 'JARVIS', performance: 847, accuracy: 99.97 },
    { name: 'Predictive', performance: 623, accuracy: 94.2 },
    { name: 'NLP', performance: 721, accuracy: 97.8 },
    { name: 'Computer Vision', performance: 892, accuracy: 98.5 },
    { name: 'Anomaly Detection', performance: 567, accuracy: 96.3 },
    { name: 'Recommendation', performance: 445, accuracy: 91.7 }
  ];

  useEffect(() => {
    // Simulate loading
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
      // Reduce frequency of metrics updates to prevent re-render loops
      setMetrics(prev => ({
        ...prev,
        activeImplementations: prev.activeImplementations + Math.floor(Math.random() * 3 - 1),
        dataStreams: prev.dataStreams + Math.floor(Math.random() * 1000 - 500),
      }));
    }, 10000); // Increased from 5000 to 10000 (10 seconds)

    return () => {
      clearTimeout(loadingTimer);
      clearInterval(timeInterval);
    };
  }, []); // Empty dependency array to run only once

  const quickActions = [
    { icon: Brain, label: "Træn AI-løsning", color: "from-blue-500 to-purple-600" },
    { icon: Database, label: "Intelligent dataanalyse", color: "from-purple-500 to-pink-600" },
    { icon: Activity, label: "System status", color: "from-green-500 to-blue-600" },
    { icon: Shield, label: "Sikkerhed", color: "from-orange-500 to-red-600" }
  ];

  const recentActivities = [
    { id: 1, type: "Model", name: "Business Intelligence Engine", status: "Implementering komplet", time: "2 min siden" },
    { id: 2, type: "Data", name: "Kunde Analytics", status: "Analyse kører", time: "5 min siden" },
    { id: 3, type: "Alert", name: "Høj CPU-brug", status: "Løst", time: "12 min siden" },
    { id: 4, type: "Model", name: "Beslutningsstøtte Platform", status: "Deployment klar", time: "23 min siden" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <LoadingSpinner size="lg" text="Indlæser dashboard data..." className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="pt-24 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ErrorBoundary 
              error={error} 
              onDismiss={() => setError(null)}
              retry={() => {
                setError(null);
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 1500);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">AI Indsigt Platform</h1>
              <p className="text-gray-400">Realtids oversigt over dine AI-systemer</p>
            </div>
            <div className="flex items-center space-x-4 bg-gray-800/60 px-6 py-3 rounded-xl border border-gray-700">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-white font-medium">Live - {currentTime.toLocaleTimeString('da-DK')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{metrics.activeImplementations.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Succesfulde implementeringer</div>
            <div className="text-xs text-green-400 mt-2">↗ +12 i dag</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Database className="w-6 h-6 text-purple-400" />
              </div>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{(metrics.dataStreams / 1000).toFixed(0)}K</div>
            <div className="text-sm text-gray-400">Datastrømme/sek</div>
            <div className="text-xs text-blue-400 mt-2">Real-time processing</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{metrics.efficiency}%</div>
            <div className="text-sm text-gray-400">Effektivitetsforbedring</div>
            <div className="text-xs text-green-400 mt-2">Optimal performance</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-800/70 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-2">{metrics.uptime}%</div>
            <div className="text-sm text-gray-400">System oppetid</div>
            <div className="text-xs text-emerald-400 mt-2">24/7 kørsel</div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-white mb-6">Hurtige handlinger</h2>
            <div className="space-y-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    className="w-full flex items-center justify-between p-4 bg-gray-800/50 hover:bg-gray-800/70 border border-gray-700 rounded-xl transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 bg-gradient-to-r ${action.color} rounded-lg opacity-90 group-hover:opacity-100 transition-opacity`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white font-medium">{action.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-6">Seneste aktivitet</h2>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.status.includes('komplet') ? 'bg-green-400' :
                        activity.status.includes('kører') ? 'bg-blue-400 animate-pulse' :
                        activity.status.includes('Løst') ? 'bg-yellow-400' : 'bg-purple-400'
                      }`}></div>
                      <div>
                        <div className="text-white font-medium">{activity.name}</div>
                        <div className="text-sm text-gray-400">{activity.type} • {activity.status}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">{activity.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* System Overview Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* System Performance Chart */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">System performance - Sidste 24 timer</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151', 
                      borderRadius: '8px',
                      color: '#FFFFFF'
                    }} 
                  />
                  <Area type="monotone" dataKey="cpu" stroke="#3B82F6" fillOpacity={1} fill="url(#cpuGradient)" name="CPU %" />
                  <Area type="monotone" dataKey="memory" stroke="#8B5CF6" fillOpacity={1} fill="url(#memoryGradient)" name="Memory %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Model Performance Chart */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-6">AI Model Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aiModelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151', 
                      borderRadius: '8px',
                      color: '#FFFFFF'
                    }} 
                  />
                  <Bar dataKey="performance" fill="#10B981" name="Ops/sek" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Network Traffic Chart */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Network Traffic & Data Flow</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151', 
                    borderRadius: '8px',
                    color: '#FFFFFF'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="network" 
                  stroke="#F59E0B" 
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                  name="Network %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;