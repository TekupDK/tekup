import { useEffect, useState } from 'react';
import { Users, BarChart3, Calendar, Mail, Database, RefreshCw, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatCardSkeleton, ListItemSkeleton, CacheStatsSkeleton } from '@/components/ui/Skeleton';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getStatusBadgeClass } from '@/lib/statusColors';
import ConflictMonitor from '@/components/ConflictMonitor';
import SystemStatus from '@/components/SystemStatus';
import { EmailQualityMonitor } from '@/components/EmailQualityMonitor';
import { FollowUpTracker } from '@/components/FollowUpTracker';
import { RateLimitMonitor } from '@/components/RateLimitMonitor';
import QuoteStatusTracker from '@/components/QuoteStatusTracker';
import { API_CONFIG, buildApiUrl } from '@/config/api';
import { useNavigate } from 'react-router-dom';


interface OverviewStats {
  customers: number;
  leads: number;
  bookings: number;
  quotes: number;
  conversations: number;
  revenue: number;
  // Change indicators compared to previous period
  customersChange?: number;
  leadsChange?: number;
  bookingsChange?: number;
  quotesChange?: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: string;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  customer?: {
    name: string;
  };
}

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  lead?: {
    name: string;
    customer?: {
      name: string;
    };
  };
}

type PeriodFilter = '24h' | '7d' | '30d' | '90d';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [activePeriod, setActivePeriod] = useState<PeriodFilter>('7d');
  const [revenueData, setRevenueData] = useState<Array<{ date: string; revenue: number }>>([]);
  const [serviceData, setServiceData] = useState<Array<{ name: string; value: number; color: string }>>([]);

  // Loading states
  const [statsLoading, setStatsLoading] = useState(false);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all dashboard data
  const fetchAllData = async () => {
    setStatsLoading(true);
    setCacheLoading(true);
    setLeadsLoading(true);
    setBookingsLoading(true);
    setRevenueLoading(true);
    setServicesLoading(true);
    setError(null);

    try {
      // Fetch data sequentially to avoid hitting rate limits
      const statsRes = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.STATS)}?period=${activePeriod}`);
      if (!statsRes.ok) throw new Error('Failed to fetch overview stats');
      setStats(await statsRes.json() as OverviewStats);
      setStatsLoading(false);

      const cacheRes = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.CACHE));
      if (!cacheRes.ok) throw new Error('Failed to fetch cache stats');
      setCacheStats(await cacheRes.json() as CacheStats);
      setCacheLoading(false);

      const leadsRes = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.LEADS_RECENT)}?limit=10`);
      if (!leadsRes.ok) throw new Error('Failed to fetch recent leads');
      const leadsData = await leadsRes.json() as Lead[];

      // Deduplicate leads by email to avoid showing same customer multiple times
      const uniqueLeads = leadsData.reduce((acc: Lead[], lead) => {
        const exists = acc.find(l => l.email === lead.email);
        if (!exists) {
          acc.push(lead);
        }
        return acc;
      }, []).slice(0, 5); // Take only 5 unique leads

      setRecentLeads(uniqueLeads);
      setLeadsLoading(false);

      const bookingsRes = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.BOOKINGS_UPCOMING));
      if (!bookingsRes.ok) throw new Error('Failed to fetch upcoming bookings');
      const bookingsData = await bookingsRes.json() as Booking[];
      setUpcomingBookings(bookingsData.slice(0, 5));
      setBookingsLoading(false);

      const revenueRes = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.REVENUE)}?period=${activePeriod}`);
      if (!revenueRes.ok) throw new Error('Failed to fetch revenue data');
      setRevenueData(await revenueRes.json() as Array<{ date: string; revenue: number }>);
      setRevenueLoading(false);

      const servicesRes = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.DASHBOARD.SERVICES));
      if (!servicesRes.ok) throw new Error('Failed to fetch service data');
      setServiceData(await servicesRes.json() as Array<{ name: string; value: number; color: string }>);
      setServicesLoading(false);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Kunne ikke indlæse dashboard-data. Prøv venligst igen senere.');
      // Ensure all loading states are reset on error
      setStatsLoading(false);
      setCacheLoading(false);
      setLeadsLoading(false);
      setBookingsLoading(false);
      setRevenueLoading(false);
      setServicesLoading(false);
    }
  };

  useEffect(() => {
    void fetchAllData();

    const interval = setInterval(() => void fetchAllData(), 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [activePeriod]);

  const handleRefresh = () => {
    void fetchAllData();
  };



  const isLoading = statsLoading || cacheLoading || leadsLoading || bookingsLoading || revenueLoading || servicesLoading;

  if (isLoading && !stats) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Indlæser data...</p>
        </div>

        {/* Skeleton Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Skeleton Cache Stats */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-muted-foreground" />
              <span className="text-muted-foreground">Indlæser cache stats...</span>
            </div>
          </CardHeader>
          <CardContent>
            <CacheStatsSkeleton />
          </CardContent>
        </Card>

        {/* Skeleton Lists */}
        <Card>
          <CardHeader>
            <span className="text-muted-foreground">Indlæser leads...</span>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <ListItemSkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check for empty state (completely new system)
  const isEmpty = stats &&
    stats.customers === 0 &&
    stats.leads === 0 &&
    stats.bookings === 0 &&
    stats.quotes === 0;

  if (isEmpty) {
    return (
      <div className="space-y-8 animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Velkommen til RenOS - dit AI-drevne rengøringssystem
          </p>
        </div>

        <Card className="glass-card">
          <CardContent className="p-12">
            <div className="flex flex-col items-center gap-6 text-center max-w-2xl mx-auto">
              <div className="p-6 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30">
                <Target className="w-16 h-16 text-primary" />
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground">Kom i gang med RenOS</h2>
                <p className="text-muted-foreground text-lg">
                  Dit dashboard er klar til at vise data. Start med at oprette din første lead eller kunde.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-6">
                <div className="p-6 rounded-lg bg-glass/30 border border-glass/50 text-left">
                  <Users className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Opret Kunder</h3>
                  <p className="text-sm text-muted-foreground">
                    Tilføj dine eksisterende kunder til systemet
                  </p>
                </div>

                <div className="p-6 rounded-lg bg-glass/30 border border-glass/50 text-left">
                  <Target className="w-8 h-8 text-success mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Modtag Leads</h3>
                  <p className="text-sm text-muted-foreground">
                    Systemet overvåger automatisk din email for nye leads
                  </p>
                </div>

                <div className="p-6 rounded-lg bg-glass/30 border border-glass/50 text-left">
                  <Calendar className="w-8 h-8 text-blue-400 mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Book Aftaler</h3>
                  <p className="text-sm text-muted-foreground">
                    Opret bookinger direkte fra leads eller kunder
                  </p>
                </div>

                <div className="p-6 rounded-lg bg-glass/30 border border-glass/50 text-left">
                  <Mail className="w-8 h-8 text-yellow-400 mb-3" />
                  <h3 className="font-semibold text-foreground mb-2">Send Tilbud</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-genererede tilbud baseret på kundens behov
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <button
                  onClick={() => navigate('/leads')}
                  className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg"
                >
                  Se Leads
                </button>
                <button
                  onClick={() => navigate('/customers')}
                  className="px-6 py-3 bg-glass border border-glass/50 text-foreground font-semibold rounded-lg hover:bg-glass/50 transition-colors"
                >
                  Opret Kunde
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header Section - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-4xl dashboard-title">
            Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Oversigt over din virksomheds performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg p-1" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {(['7d', '30d', '90d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={`px-3 py-1.5 text-xs font-semibold rounded transition-all duration-200 ${activePeriod === p ? 'btn-primary' : ''}`}
                style={activePeriod !== p ? { background: 'transparent', color: 'rgba(255, 255, 255, 0.6)' } : {}}
              >
                {p === '7d' ? '7d' : p === '30d' ? '30d' : '90d'}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            className="btn-secondary flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold disabled:opacity-50"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Opdater</span>
            <span className="sm:hidden">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Grid - Enhanced with Better Responsive Design */}
      {error && (
        <div className="glass-card bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-lg text-center animate-fade-in">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
        {/* Kunder Card - Enhanced with Hover Effects */}
        <Card className="stats-card-premium group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Kunder</p>
              <div className="stats-icon-premium">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="space-y-3">
              <p className="stats-value-enhanced">{stats?.customers || 0}</p>
              {stats?.customersChange !== undefined && (
                <div className="flex items-center gap-1.5">
                  {stats.customersChange >= 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="text-sm font-medium text-success">+{stats.customersChange.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">{stats.customersChange.toFixed(1)}%</span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">vs forrige periode</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leads Card - Enhanced */}
        <Card className="stats-card-premium group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Leads</p>
              <div className="stats-icon-premium">
                <BarChart3 className="w-6 h-6 text-success" />
              </div>
            </div>
            <div className="space-y-3">
              <p className="stats-value-enhanced">{stats?.leads || 0}</p>
              {stats?.leadsChange !== undefined && (
                <div className="flex items-center gap-1.5">
                  {stats.leadsChange >= 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="text-sm font-medium text-success">+{stats.leadsChange.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">{stats.leadsChange.toFixed(1)}%</span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">vs forrige periode</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bookinger Card - Enhanced */}
        <Card className="stats-card-premium group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Bookinger</p>
              <div className="stats-icon-premium">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="space-y-3">
              <p className="stats-value-enhanced">{stats?.bookings || 0}</p>
              {stats?.bookingsChange !== undefined && (
                <div className="flex items-center gap-1.5">
                  {stats.bookingsChange >= 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="text-sm font-medium text-success">+{stats.bookingsChange.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">{stats.bookingsChange.toFixed(1)}%</span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">vs forrige periode</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tilbud Card - Enhanced */}
        <Card className="stats-card-premium group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tilbud</p>
              <div className="stats-icon-premium">
                <Mail className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <div className="space-y-3">
              <p className="stats-value-enhanced">{stats?.quotes || 0}</p>
              {stats?.quotesChange !== undefined && (
                <div className="flex items-center gap-1.5">
                  {stats.quotesChange >= 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-success" />
                      <span className="text-sm font-medium text-success">+{stats.quotesChange.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-destructive" />
                      <span className="text-sm font-medium text-destructive">{stats.quotesChange.toFixed(1)}%</span>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground ml-1">vs forrige periode</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Enhanced Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Revenue Chart - Enhanced */}
        <Card className="chart-container-premium">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold text-white">Omsætning</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Udvikling over tid</p>
              </div>
              <div className="flex gap-2">
                {(['24h', '7d', '30d', '90d'] as PeriodFilter[]).map((period) => (
                  <button
                    key={period}
                    onClick={() => setActivePeriod(period)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${activePeriod === period
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {revenueLoading ? (
              <div className="h-80 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : revenueData.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-center">
                <BarChart3 className="w-16 h-16 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">Ingen omsætningsdata tilgængelig endnu</p>
                <p className="text-xs text-muted-foreground mt-2">Data vises når der er accepterede tilbud</p>
              </div>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(10, 10, 20, 0.95)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(0, 212, 255, 0.3)',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 212, 255, 0.2)',
                        padding: '12px 16px'
                      }}
                      labelStyle={{ color: '#ffffff', fontWeight: 600, marginBottom: '4px' }}
                      formatter={(value: number) => [`${value.toLocaleString('da-DK')} kr.`, 'Omsætning']}
                      cursor={{ stroke: 'rgba(0, 212, 255, 0.3)', strokeWidth: 2 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Distribution - Enhanced */}
        <Card className="chart-container-premium">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-white">Service Fordeling</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Populære tjenester</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(10, 10, 20, 0.95)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(124, 58, 237, 0.3)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(124, 58, 237, 0.2)',
                      padding: '12px 16px'
                    }}
                    formatter={(value: number) => [`${value} bookinger`, 'Antal']}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cache Performance - Enhanced */}
      {cacheStats && (
        <Card className="stats-card-premium">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/30">
                <Database className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-white">Cache Performance</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">System ydeevne metrics</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                <p className="text-3xl font-bold text-blue-400 mb-2">{cacheStats.hitRate}</p>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Hit Rate</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                <p className="text-2xl font-bold text-green-400 mb-2">{cacheStats.hits.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Hits</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20">
                <p className="text-2xl font-bold text-red-400 mb-2">{cacheStats.misses.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Misses</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-gray-500/10 to-gray-500/5 border border-gray-500/20">
                <p className="text-2xl font-bold text-gray-400 mb-2">{cacheStats.size.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground uppercase tracking-wide">Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Status - CRITICAL SAFETY */}
      <SystemStatus />

      {/* Conflict Monitor Section */}
      <ConflictMonitor />

      {/* Quote Status Tracker - NEW for dashboard upgrade */}
      <QuoteStatusTracker />

      {/* Email Quality Monitor Section */}
      <EmailQualityMonitor />

      {/* Follow-Up Tracker Section */}
      <FollowUpTracker />

      {/* Rate Limit Monitor Section */}
      <RateLimitMonitor />

      {/* Bottom Section - Enhanced Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent Leads - Enhanced */}
        {recentLeads.length > 0 && (
          <Card className="glass-card group hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/30 group-hover:scale-110 transition-all duration-300">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">Seneste Leads</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Nye potentielle kunder</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {recentLeads.map((lead, index) => (
                  <div
                    key={lead.id}
                    className="group flex items-center justify-between p-4 rounded-xl glass-card border border-glass/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {(lead.customer?.name || lead.name)?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{lead.customer?.name || lead.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{lead.email}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {new Date(lead.createdAt).toLocaleString('da-DK', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${getStatusBadgeClass(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upcoming Bookings - Enhanced */}
        {upcomingBookings.length > 0 && (
          <Card className="glass-card group hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/30 group-hover:scale-110 transition-all duration-300">
                  <Calendar className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">Kommende Bookinger</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Planlagte aftaler</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {upcomingBookings.map((booking, index) => (
                  <div
                    key={booking.id}
                    className="group flex items-center justify-between p-4 rounded-xl glass-card border border-glass/50 hover:border-blue-500/30 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">
                          {booking.lead?.customer?.name || booking.lead?.name || 'Ukendt kunde'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.startTime).toLocaleString('da-DK', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {' - '}
                          {new Date(booking.endTime).toLocaleTimeString('da-DK', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
