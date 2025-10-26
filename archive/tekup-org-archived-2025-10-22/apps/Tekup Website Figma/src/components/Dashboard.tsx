'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { NotificationSystem } from './NotificationSystem';
import { AIAssistant } from './AIAssistant';
import { RealTimeAnalytics } from './RealTimeAnalytics';
import { PerformanceMonitor } from './PerformanceMonitor';
import { DashboardOverview } from './dashboard/DashboardOverview';
import { AutomationPipeline } from './AutomationPipeline';
import { useAuth } from '../hooks/useAuth';
import { 
  BarChart3, 
  Users, 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Search,
  Plus,
  Bell,
  Settings,
  LogOut,
  Zap,
  Database,
  Workflow,
  Globe,
  Shield,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Eye,
  Filter,
  MoreVertical
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';

interface DashboardProps {
  user?: {
    name: string;
    email: string;
    company: string;
    avatar?: string;
  };
}

export function Dashboard({ user: propUser }: DashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [activeView, setActiveView] = useState<'overview' | 'analytics' | 'ai' | 'performance' | 'automation'>('overview');
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Mock data for charts - Updated for Danish cleaning business
  const leadData = [
    { name: 'Man', leads: 18, conversion: 12 },
    { name: 'Tir', leads: 23, conversion: 15 },
    { name: 'Ons', leads: 20, conversion: 14 },
    { name: 'Tor', leads: 28, conversion: 19 },
    { name: 'Fre', leads: 25, conversion: 17 },
    { name: 'Lør', leads: 8, conversion: 6 },
    { name: 'Søn', leads: 12, conversion: 8 }
  ];

  const performanceData = [
    { name: 'Jan', value: 82 },
    { name: 'Feb', value: 85 },
    { name: 'Mar', value: 88 },
    { name: 'Apr', value: 91 },
    { name: 'Maj', value: 89 },
    { name: 'Jun', value: 93 }
  ];

  const pieData = [
    { name: 'Kontorrenhold', value: 35, color: '#0066CC' },
    { name: 'Privat renhold', value: 28, color: '#00D4FF' },
    { name: 'Specialrengøring', value: 22, color: '#10B981' },
    { name: 'Vinduespolering', value: 15, color: '#F59E0B' }
  ];

  const stats = [
    {
      title: 'Månedlige Kunder',
      value: '147',
      change: '+8.3%',
      trend: 'up',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Gennemsnitlig Ordreværdi',
      value: '3.247 kr',
      change: '+12.1%',
      trend: 'up',
      icon: TrendingUp,
      color: 'emerald'
    },
    {
      title: 'Kundetilfredshed',
      value: '4.8/5',
      change: '+0.2',
      trend: 'up',
      icon: Star,
      color: 'purple'
    },
    {
      title: 'Ventende Opgaver',
      value: '23',
      change: '-15.2%',
      trend: 'down',
      icon: Clock,
      color: 'orange'
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'new_booking',
      title: 'Ny booking modtaget',
      description: 'Køpenhavns Advokatfirma - Ugentlig kontorrenhold',
      time: '12 min siden',
      icon: CheckCircle,
      color: 'emerald'
    },
    {
      id: 2,
      type: 'ai_automation',
      title: 'Jarvis AI optimering',
      description: 'Automatisk rute planlægning for 8 rengøringsopgaver',
      time: '35 min siden',
      icon: Brain,
      color: 'purple'
    },
    {
      id: 3,
      type: 'customer_feedback',
      title: 'Kundefeedback modtaget',
      description: '5-stjernet anmeldelse fra Nørrebro Tandklinik',
      time: '1 time siden',
      icon: Star,
      color: 'yellow'
    },
    {
      id: 4,
      type: 'task_completed',
      title: 'Opgave fuldført',
      description: 'Specialrengøring hos Restaurant Noma afsluttet',
      time: '2 timer siden',
      icon: CheckCircle,
      color: 'green'
    }
  ];

  const quickActions = [
    { icon: Plus, label: 'Tilføj Lead', action: () => console.log('Add lead') },
    { icon: Calendar, label: 'Scheduling', action: () => window.location.href = '/scheduling' },
    { icon: BarChart3, label: 'Se Rapport', action: () => console.log('View report') },
    { icon: Settings, label: 'Indstillinger', action: () => console.log('Settings') }
  ];

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Show authentication required if not logged in
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4 text-white">Login påkrævet</h2>
          <p className="text-gray-300 mb-6">Du skal logge ind for at se dashboard</p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
          >
            Gå til forside
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-tekup-primary)_0%,_transparent_50%)] opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--color-tekup-accent)_0%,_transparent_50%)] opacity-10" />
      
      {/* Floating orbs */}
      <motion.div 
        className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-full opacity-40 blur-3xl"
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ 
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <header className="glass border-b border-white/10 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-tekup-primary)] to-[var(--color-tekup-accent)] rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Tekup Dashboard</h1>
                  <p className="text-sm text-gray-400">{user.company}</p>
                </div>
              </div>

              {/* Search & Actions */}
              <div className="flex items-center space-x-4">
                <div className="relative hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Søg leads, kunder, tickets..."
                    className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 text-white placeholder:text-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 backdrop-blur-sm w-80"
                  />
                </div>

                <NotificationSystem />

                <Separator orientation="vertical" className="h-6 bg-white/20" />

                {/* User Menu */}
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block">
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-sm text-gray-400">{user.email}</div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-400 hover:text-white"
                    onClick={logout}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Velkommen tilbage, {user.name.split(' ')[0]}! 👋
                </h2>
                <p className="text-gray-300">
                  Her er et overblik over din virksomheds performance i dag
                </p>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* View Toggle */}
                <div className="flex items-center space-x-1">
                  {[
                    { key: 'overview', label: 'Overblik', icon: BarChart3 },
                    { key: 'analytics', label: 'Analytics', icon: TrendingUp },
                    { key: 'ai', label: 'AI', icon: Brain },
                    { key: 'performance', label: 'Performance', icon: Activity },
                    { key: 'automation', label: 'Automation', icon: Workflow }
                  ].map((view) => (
                    <Button
                      key={view.key}
                      variant={activeView === view.key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveView(view.key as typeof activeView)}
                      className={`${
                        activeView === view.key
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                          : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      <view.icon className="w-4 h-4 mr-2" />
                      {view.label}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center space-x-2">
                  {['7d', '30d', '90d'].map((period) => (
                    <Button
                      key={period}
                      variant={selectedPeriod === period ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedPeriod(period)}
                      className={`${
                        selectedPeriod === period
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
                          : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {period}
                    </Button>
                  ))}
                </div>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Eksporter
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Conditional Content Based on Active View */}
          {activeView === 'overview' && (
            <>
              {/* New Figma-inspired Dashboard Overview */}
              <DashboardOverview 
                onLeadClick={(leadId) => {
                  console.log('Lead clicked:', leadId);
                  // Handle lead actions
                  if (leadId === 'view-all') {
                    // Navigate to leads page or show modal
                    console.log('Show all leads');
                  } else if (leadId === 'new-lead') {
                    // Show add lead modal
                    console.log('Add new lead');
                  } else if (leadId === 'view-analytics') {
                    // Switch to analytics view
                    setActiveView('analytics');
                  } else {
                    // View specific lead
                    console.log('View lead details:', leadId);
                  }
                }}
              />
              
              {/* Charts Section */}
              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                {/* Lead Performance Chart */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="lg:col-span-2"
                >
                  <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 h-full">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between">
                        Lead Performance
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={leadData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                          <XAxis dataKey="name" stroke="#9CA3AF" />
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
                            dataKey="leads"
                            stroke="#00D2FF"
                            fill="url(#leadGradient)"
                            strokeWidth={2}
                          />
                          <Area
                            type="monotone"
                            dataKey="conversion"
                            stroke="#10B981"
                            fill="url(#conversionGradient)"
                            strokeWidth={2}
                          />
                          <defs>
                            <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00D2FF" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#00D2FF" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="conversionGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Lead Distribution */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 h-full">
                    <CardHeader>
                      <CardTitle className="text-white">Lead Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
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
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-4">
                        {pieData.map((item) => (
                          <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-sm text-gray-300">{item.name}</span>
                            </div>
                            <span className="text-sm font-medium text-white">{item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Bottom Section */}
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Recent Activities */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="lg:col-span-2"
                >
                  <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center justify-between">
                        Seneste Aktivitet
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          <Eye className="w-4 h-4 mr-2" />
                          Se alle
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {recentActivities.map((activity) => (
                          <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-start space-x-4 p-3 rounded-lg hover:bg-white/5 transition-colors"
                          >
                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-${activity.color}-500/20 to-${activity.color}-600/20 flex items-center justify-center`}>
                              <activity.icon className={`w-5 h-5 text-${activity.color}-400`} />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-white">{activity.title}</h4>
                              <p className="text-sm text-gray-300">{activity.description}</p>
                              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                >
                  <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Hurtige Handlinger</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {quickActions.map((action) => (
                          <motion.div
                            key={action.label}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              variant="outline"
                              onClick={action.action}
                              className="w-full h-20 flex flex-col items-center justify-center space-y-2 bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                            >
                              <action.icon className="w-6 h-6" />
                              <span className="text-xs">{action.label}</span>
                            </Button>
                          </motion.div>
                        ))}
                      </div>

                      <Separator className="my-6 bg-white/20" />

                      {/* AI Assistant */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-white flex items-center">
                          <Brain className="w-4 h-4 mr-2 text-purple-400" />
                          Jarvis AI Status
                        </h4>
                        <div className="bg-gradient-to-r from-purple-500/20 to-indigo-500/20 p-4 rounded-lg border border-purple-400/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-purple-300">AI Performance</span>
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse" />
                              Active
                            </Badge>
                          </div>
                          <Progress value={89} className="mb-2" />
                          <p className="text-xs text-gray-300">
                            Automatiserede 45 opgaver i dag
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </>
          )}

          {/* Analytics View */}
          {activeView === 'analytics' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <RealTimeAnalytics />
            </motion.div>
          )}

          {/* AI Assistant View */}
          {activeView === 'ai' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <AIAssistant compact={false} />
            </motion.div>
          )}

          {/* Performance Monitor View */}
          {activeView === 'performance' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <PerformanceMonitor />
            </motion.div>
          )}

          {/* Automation Pipeline View */}
          {activeView === 'automation' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <AutomationPipeline />
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}