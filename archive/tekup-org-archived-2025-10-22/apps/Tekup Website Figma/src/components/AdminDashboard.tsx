'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  UserPlus,
  Mail,
  Phone,
  Globe,
  Zap
} from 'lucide-react';

const mockStats = {
  totalUsers: 2547,
  activeUsers: 1823,
  totalTenants: 156,
  activeTenants: 142,
  systemHealth: 99.9,
  apiCalls: 45672,
  storageUsed: 78.4,
  revenue: 1247350
};

const mockActivities = [
  { id: 1, action: 'New tenant created', tenant: 'Nordic Clean ApS', time: '2 min ago', type: 'success' },
  { id: 2, action: 'System backup completed', tenant: 'System', time: '15 min ago', type: 'info' },
  { id: 3, action: 'User limit exceeded', tenant: 'TechStart ApS', time: '1 hour ago', type: 'warning' },
  { id: 4, action: 'Payment received', tenant: 'Digital Solutions', time: '2 hours ago', type: 'success' },
  { id: 5, action: 'API rate limit reached', tenant: 'Green Energy DK', time: '3 hours ago', type: 'error' }
];

const mockTenants = [
  { id: 1, name: 'Nordic Clean ApS', users: 12, plan: 'Pro', status: 'active', mrr: 2999 },
  { id: 2, name: 'TechStart ApS', users: 8, plan: 'Business', status: 'active', mrr: 1999 },
  { id: 3, name: 'Digital Solutions', users: 15, plan: 'Enterprise', status: 'active', mrr: 4999 },
  { id: 4, name: 'Green Energy DK', users: 6, plan: 'Starter', status: 'trial', mrr: 0 },
  { id: 5, name: 'Smart Logistics', users: 20, plan: 'Enterprise', status: 'active', mrr: 4999 }
];

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': 
        return <Badge className="bg-emerald-500 text-white">Aktiv</Badge>;
      case 'trial': 
        return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Prøve</Badge>;
      case 'suspended': 
        return <Badge variant="destructive">Suspenderet</Badge>;
      default: 
        return <Badge variant="secondary">Ukendt</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container-tekup py-8">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-2">
                System administration og tenant management
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-emerald-500 text-white">
                System Healthy
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Indstillinger
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Brugere</CardTitle>
                <Users className="w-5 h-5 text-[var(--color-tekup-primary-fallback)]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{mockStats.totalUsers.toLocaleString()}</div>
              <div className="text-sm text-emerald-600 mt-1">
                <TrendingUp className="w-4 h-4 inline mr-1" />
                +12% fra sidste måned
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Aktive Tenants</CardTitle>
                <Database className="w-5 h-5 text-[var(--color-tekup-accent-fallback)]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{mockStats.activeTenants}</div>
              <div className="text-sm text-muted-foreground mt-1">
                af {mockStats.totalTenants} totalt
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">System Uptime</CardTitle>
                <Shield className="w-5 h-5 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{mockStats.systemHealth}%</div>
              <div className="text-sm text-emerald-600 mt-1">
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Excellent
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">MRR</CardTitle>
                <BarChart3 className="w-5 h-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {(mockStats.revenue / 100).toLocaleString('da-DK', { 
                  style: 'currency', 
                  currency: 'DKK',
                  minimumFractionDigits: 0 
                })}
              </div>
              <div className="text-sm text-purple-600 mt-1">
                +8% fra sidste måned
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Oversigt</TabsTrigger>
              <TabsTrigger value="tenants">Tenants</TabsTrigger>
              <TabsTrigger value="users">Brugere</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Seneste Aktivitet
                    </CardTitle>
                    <CardDescription>
                      Systemaktivitet fra de seneste timer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                          {getActivityIcon(activity.type)}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.tenant}</p>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {activity.time}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* System Health */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="w-5 h-5 mr-2" />
                      System Sundhed
                    </CardTitle>
                    <CardDescription>
                      Real-time system metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">API Response Time</span>
                        <span className="text-sm font-medium text-emerald-600">145ms</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Database Connections</span>
                        <span className="text-sm font-medium">24/100</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Storage Used</span>
                        <span className="text-sm font-medium">{mockStats.storageUsed}%</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Active Sessions</span>
                        <span className="text-sm font-medium text-emerald-600">{mockStats.activeUsers}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        <span className="text-sm text-emerald-600 font-medium">All systems operational</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tenants" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Tenant Management</CardTitle>
                      <CardDescription>
                        Administrer alle tenants og deres subscriptions
                      </CardDescription>
                    </div>
                    <Button>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Ny Tenant
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockTenants.map((tenant) => (
                      <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] rounded-lg flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {tenant.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{tenant.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {tenant.users} brugere • {tenant.plan} plan
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {tenant.mrr > 0 ? `${tenant.mrr} kr/måned` : 'Gratis prøve'}
                            </div>
                            <div className="text-xs text-muted-foreground">MRR</div>
                          </div>
                          {getStatusBadge(tenant.status)}
                          <Button variant="ghost" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>
                    Administrer brugere på tværs af alle tenants
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Bruger management funktionalitet kommer snart...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>
                    Avancerede system indstillinger og konfiguration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>System konfiguration kommer snart...</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}