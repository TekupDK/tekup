'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { NotificationSystem } from './NotificationSystem';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  isLoading?: boolean;
  isStale?: boolean;
}

function StatCard({ title, value, change, trend, icon, isLoading, isStale }: StatCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  return (
    <Card className="glass hover:glass-hover transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {icon}
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                {title}
                {isStale && (
                  <Badge variant="outline" className="text-xs">
                    Stale
                  </Badge>
                )}
              </p>
              <div className="flex items-center gap-2">
                {isLoading ? (
                  <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                ) : (
                  <p className="text-2xl font-semibold">{value}</p>
                )}
                {change !== undefined && (
                  <div className="flex items-center gap-1">
                    {getTrendIcon()}
                    <span className={`text-sm ${
                      trend === 'up' ? 'text-green-500' : 
                      trend === 'down' ? 'text-red-500' : 
                      'text-muted-foreground'
                    }`}>
                      {change > 0 ? '+' : ''}{change}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EnhancedDashboard() {
  const { user, currentTenant, logout, switchTenant, tenants } = useAuth();
  const { isConnected, notifications, unreadCount } = useRealtime();
  const { stats: realtimeStats, isStale } = useRealtimeStats();
  
  // API data hooks
  const { data: dashboardStats, isLoading: statsLoading, refresh: refreshStats } = useDashboardStats();
  const { data: crmStats, isLoading: crmLoading } = useCrmStats();
  const { data: leadStats, isLoading: leadLoading } = useLeadStats();
  const { data: jarvisStats, isLoading: jarvisLoading } = useJarvisStats();

  // Use real-time stats if available, fallback to API data
  const stats = realtimeStats || dashboardStats || {
    totalLeads: 0,
    conversionRate: 0,
    activeDeals: 0,
    revenue: 0,
    customers: 0,
    aiAutomations: 0,
  };

  const handleTenantSwitch = async (tenantId: string) => {
    await switchTenant(tenantId);
    // Refresh data after tenant switch
    refreshStats();
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };

  // Sample chart data - would come from real API
  const chartData = [
    { month: 'Jan', leads: 45, conversions: 12, revenue: 24000 },
    { month: 'Feb', leads: 52, conversions: 18, revenue: 32000 },
    { month: 'Mar', leads: 48, conversions: 15, revenue: 28000 },
    { month: 'Apr', leads: 61, conversions: 22, revenue: 41000 },
    { month: 'May', leads: 55, conversions: 19, revenue: 35000 },
    { month: 'Jun', leads: 67, conversions: 25, revenue: 48000 },
  ];

  const pieData = [
    { name: 'New Leads', value: 35, color: '#3B82F6' },
    { name: 'Qualified', value: 25, color: '#10B981' },
    { name: 'Proposals', value: 20, color: '#F59E0B' },
    { name: 'Closed Won', value: 20, color: '#EF4444' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b border-border/50 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                  <Wifi className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </Badge>
              )}
              {isStale && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-500/20">
                  <Activity className="w-3 h-3 mr-1" />
                  Updating...
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStats}
              disabled={statsLoading}
            >
              <RefreshCw className={`w-4 h-4 ${statsLoading ? 'animate-spin' : ''}`} />
            </Button>

            {/* Notifications */}
            <NotificationSystem />

            {/* Tenant Switcher */}
            {tenants.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    <span>{currentTenant?.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="glass" align="end">
                  <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {tenants.map((tenant) => (
                    <DropdownMenuItem
                      key={tenant.id}
                      onClick={() => handleTenantSwitch(tenant.id)}
                      className={currentTenant?.id === tenant.id ? 'bg-accent' : ''}
                    >
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span>{tenant.name}</span>
                        {currentTenant?.id === tenant.id && (
                          <Badge variant="secondary" className="ml-auto">Current</Badge>
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback>
                      {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 glass" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Total Leads"
            value={stats.totalLeads?.toLocaleString() || '0'}
            change={12}
            trend="up"
            icon={<Users className="w-5 h-5 text-primary" />}
            isLoading={statsLoading}
            isStale={isStale}
          />
          <StatCard
            title="Conversion Rate"
            value={`${stats.conversionRate || 0}%`}
            change={5}
            trend="up"
            icon={<Target className="w-5 h-5 text-primary" />}
            isLoading={statsLoading}
            isStale={isStale}
          />
          <StatCard
            title="Active Deals"
            value={stats.activeDeals?.toLocaleString() || '0'}
            change={-2}
            trend="down"
            icon={<DollarSign className="w-5 h-5 text-primary" />}
            isLoading={statsLoading}
            isStale={isStale}
          />
          <StatCard
            title="Revenue"
            value={`$${(stats.revenue || 0).toLocaleString()}`}
            change={18}
            trend="up"
            icon={<TrendingUp className="w-5 h-5 text-primary" />}
            isLoading={statsLoading}
            isStale={isStale}
          />
          <StatCard
            title="Customers"
            value={stats.customers?.toLocaleString() || '0'}
            change={8}
            trend="up"
            icon={<Users className="w-5 h-5 text-primary" />}
            isLoading={statsLoading}
            isStale={isStale}
          />
          <StatCard
            title="AI Automations"
            value={stats.aiAutomations?.toLocaleString() || '0'}
            change={25}
            trend="up"
            icon={<Zap className="w-5 h-5 text-primary" />}
            isLoading={statsLoading}
            isStale={isStale}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--color-tekup-glass)',
                      border: '1px solid var(--color-tekup-glass-border)',
                      borderRadius: '8px',
                      backdropFilter: 'blur(20px)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Lead Pipeline */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Lead Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {pieData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-muted-foreground">{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'var(--color-tekup-glass)',
                      border: '1px solid var(--color-tekup-glass-border)',
                      borderRadius: '8px',
                      backdropFilter: 'blur(20px)'
                    }}
                  />
                  <Bar dataKey="leads" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="conversions" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="glass">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: 'New lead generated', time: '2 minutes ago', type: 'lead' },
                  { action: 'Deal closed: $15,000', time: '1 hour ago', type: 'deal' },
                  { action: 'AI automation triggered', time: '3 hours ago', type: 'automation' },
                  { action: 'Customer support ticket resolved', time: '5 hours ago', type: 'support' },
                  { action: 'New customer onboarded', time: '1 day ago', type: 'customer' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {activity.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}