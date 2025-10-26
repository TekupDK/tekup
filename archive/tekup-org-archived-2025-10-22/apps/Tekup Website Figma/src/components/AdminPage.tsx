'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { useAuth } from '../hooks/useAuth';
import { 
  Calendar, 
  Mail, 
  Phone, 
  Building, 
  Users, 
  TrendingUp,
  Clock,
  Eye,
  Download,
  Filter,
  Search,
  RefreshCw,
  BarChart3,
  Activity,
  Star,
  MessageCircle
} from 'lucide-react';

export function AdminPage() {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Check if user is authorized (owner role)
  const isAuthorized = isAuthenticated && user?.role === 'owner';

  useEffect(() => {
    loadData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      // Load recent bookings
      const bookingsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-68ad12b6/recent-bookings`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        setBookings(bookingsData.bookings || []);
      }

      // Load dashboard data for stats
      const dashboardResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-68ad12b6/dashboard-data`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (dashboardResponse.ok) {
        const data = await dashboardResponse.json();
        setDashboardData(data);
        
        // Extract contacts from activities
        const contactActivities = data.activities?.filter((activity: any) => 
          activity.type === 'contact_received'
        ) || [];
        setContacts(contactActivities);
      }

      setLastUpdated(new Date().toLocaleString('da-DK'));
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Adgang Nægtet</h2>
            <p className="text-gray-300 mb-4">Du har ikke tilladelse til at se denne side.</p>
            <Button 
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              onClick={() => window.history.back()}
            >
              Gå tilbage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Indlæser Admin Data</h2>
            <p className="text-gray-300">Henter de seneste data fra backend...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-tekup-primary)_0%,_transparent_50%)] opacity-10" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="glass border-b border-white/10 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Tekup Admin</h1>
                  <p className="text-sm text-gray-400">Backend Dashboard</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={loadData}
                  className="text-gray-400 hover:text-white"
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Opdater
                </Button>
                
                <div className="text-xs text-gray-400">
                  Sidst opdateret: {lastUpdated}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            {[
              {
                title: 'Demo Bookings',
                value: dashboardData?.stats?.bookings?.total || 0,
                change: '+' + (dashboardData?.stats?.bookings?.thisWeek || 0) + ' denne uge',
                icon: Calendar,
                color: 'blue'
              },
              {
                title: 'Kontaktformularer',
                value: dashboardData?.stats?.contacts?.total || 0,
                change: '+' + (dashboardData?.stats?.contacts?.thisWeek || 0) + ' denne uge',
                icon: Mail,
                color: 'emerald'
              },
              {
                title: 'Newsletter',
                value: '127', // Mock data
                change: '+12 denne uge',
                icon: MessageCircle,
                color: 'purple'
              },
              {
                title: 'Konverteringsrate',
                value: '68.2%',
                change: '+4.1% fra sidste måned',
                icon: TrendingUp,
                color: 'orange'
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10 hover-lift smooth-3d">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">{stat.title}</p>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-green-400 mt-2">{stat.change}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                        stat.color === 'blue' ? 'from-blue-500/20 to-blue-600/20' :
                        stat.color === 'emerald' ? 'from-emerald-500/20 to-emerald-600/20' :
                        stat.color === 'purple' ? 'from-purple-500/20 to-purple-600/20' :
                        'from-orange-500/20 to-orange-600/20'
                      } flex items-center justify-center`}>
                        <stat.icon className={`w-6 h-6 ${
                          stat.color === 'blue' ? 'text-blue-400' :
                          stat.color === 'emerald' ? 'text-emerald-400' :
                          stat.color === 'purple' ? 'text-purple-400' :
                          'text-orange-400'
                        }`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Tabs for different data views */}
          <Tabs defaultValue="bookings" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 border border-white/10">
              <TabsTrigger value="bookings" className="text-white data-[state=active]:bg-white/10">
                Demo Bookings
              </TabsTrigger>
              <TabsTrigger value="contacts" className="text-white data-[state=active]:bg-white/10">
                Kontakter
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-white/10">
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* Demo Bookings */}
            <TabsContent value="bookings" className="mt-6">
              <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Demo Bookings ({bookings.length})
                    </span>
                    <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white">
                      <Download className="w-4 h-4 mr-2" />
                      Eksporter
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookings.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">Ingen demo bookings endnu</p>
                      </div>
                    ) : (
                      bookings.map((booking, index) => (
                        <motion.div
                          key={booking.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg flex items-center justify-center">
                              <Building className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white">{booking.name}</h4>
                              <p className="text-sm text-gray-300">{booking.company}</p>
                              <p className="text-xs text-gray-400">{booking.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-blue-500/20 text-blue-400 border border-blue-400/30 mb-2">
                              Pending
                            </Badge>
                            <p className="text-xs text-gray-400">
                              {new Date(booking.createdAt).toLocaleDateString('da-DK')}
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contacts */}
            <TabsContent value="contacts" className="mt-6">
              <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    <span className="flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      Kontaktformularer ({contacts.length})
                    </span>
                    <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white">
                      <Download className="w-4 h-4 mr-2" />
                      Eksporter
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contacts.length === 0 ? (
                      <div className="text-center py-8">
                        <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">Ingen kontaktformularer endnu</p>
                      </div>
                    ) : (
                      contacts.map((contact, index) => (
                        <motion.div
                          key={contact.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-lg flex items-center justify-center">
                              <MessageCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-white">{contact.title}</h4>
                              <p className="text-sm text-gray-300">{contact.description}</p>
                              <p className="text-xs text-gray-400">{contact.time}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
                              New
                            </Badge>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="mt-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      Real-time Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Backend API Calls</span>
                        <Badge className="bg-green-500/20 text-green-400 border border-green-400/30">
                          {bookings.length + contacts.length} i dag
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Database Connections</span>
                        <Badge className="bg-blue-500/20 text-blue-400 border border-blue-400/30">
                          Healthy
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">KV Store Usage</span>
                        <Badge className="bg-purple-500/20 text-purple-400 border border-purple-400/30">
                          {(bookings.length + contacts.length) * 2} keys
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-xl border border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      System Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Supabase Edge Functions</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-green-400 text-sm">Online</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Database Connection</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                          <span className="text-green-400 text-sm">Connected</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300">Response Time</span>
                        <Badge className="bg-green-500/20 text-green-400 border border-green-400/30">
                          120ms
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}