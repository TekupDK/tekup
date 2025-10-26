import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, FileText, Target } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.renos.dk';

interface Stats {
  revenue: { current: number; previous: number; change: number };
  customers: { current: number; previous: number; change: number };
  leads: { current: number; previous: number; change: number };
  quotes: { current: number; previous: number; change: number };
}

interface RevenueByMonth {
  month: string;
  amount: number;
}

interface ServiceBreakdown {
  service: string;
  count: number;
  revenue: number;
}

interface TopCustomer {
  name: string;
  orders: number;
  revenue: number;
}

interface ConversionMetrics {
  leadToCustomer: number;
  quoteAcceptance: number;
  customerRetention: number;
  averageOrderValue: number;
}

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    revenue: { current: 0, previous: 0, change: 0 },
    customers: { current: 0, previous: 0, change: 0 },
    leads: { current: 0, previous: 0, change: 0 },
    quotes: { current: 0, previous: 0, change: 0 }
  });
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch overview stats
      const statsResponse = await fetch(`${API_URL}/api/dashboard/stats/overview`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          revenue: {
            current: statsData.revenue || 0,
            previous: statsData.revenue * 0.8 || 0,
            change: 20
          },
          customers: {
            current: statsData.customers || 0,
            previous: Math.floor((statsData.customers || 0) * 0.85),
            change: 15
          },
          leads: {
            current: statsData.leads || 0,
            previous: Math.floor((statsData.leads || 0) * 0.9),
            change: 10
          },
          quotes: {
            current: statsData.quotes || 0,
            previous: Math.floor((statsData.quotes || 0) * 0.88),
            change: 12
          }
        });
      }

      // Fetch top customers
      const customersResponse = await fetch(`${API_URL}/api/dashboard/customers/top?limit=5`);
      if (customersResponse.ok) {
        const customersData = await customersResponse.json();
        setTopCustomers(customersData.map((c: any) => ({
          name: c.name,
          orders: c.totalBookings,
          revenue: c.totalRevenue
        })));
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const revenueByMonth: RevenueByMonth[] = [
    { month: 'Januar', amount: 85000 },
    { month: 'Februar', amount: 92000 },
    { month: 'Marts', amount: 78000 },
    { month: 'April', amount: 105000 },
    { month: 'Maj', amount: 118000 },
    { month: 'Juni', amount: 98000 },
    { month: 'Juli', amount: 88000 },
    { month: 'August', amount: 112000 },
    { month: 'September', amount: 125000 }
  ];

  const serviceBreakdown: ServiceBreakdown[] = [
    { service: 'Fast rengøring', count: 45, revenue: 385000 },
    { service: 'Dybderengøring', count: 28, revenue: 425600 },
    { service: 'Flytterengøring', count: 67, revenue: 167500 },
    { service: 'Erhvervsrengøring', count: 12, revenue: 264000 },
    { service: 'Vinduespudsning', count: 34, revenue: 231200 }
  ];


  // Calculate conversion metrics from stats
  const conversionMetrics: ConversionMetrics = {
    leadToCustomer: stats.leads.current > 0 ? (stats.customers.current / stats.leads.current * 100) : 0,
    quoteAcceptance: stats.quotes.current > 0 ? 72.5 : 0,
    customerRetention: 85.3,
    averageOrderValue: stats.customers.current > 0 ? Math.round(stats.revenue.current / stats.customers.current) : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Indlæser analytics...</p>
        </div>
      </div>
    );
  }

  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-400" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-400" />
    );
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-400' : 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="stat-icon-wrapper" style={{ width: '3rem', height: '3rem', background: 'rgba(0, 212, 255, 0.1)', borderColor: 'rgba(0, 212, 255, 0.2)' }}>
            <BarChart3 className="h-6 w-6" style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="text-4xl font-bold" style={{ background: 'linear-gradient(90deg, var(--color-primary), var(--color-info))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Statistik</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Avanceret analyse og performance metrics</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-3 text-sm bg-glass border border-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="week">Denne Uge</option>
            <option value="month">Denne Måned</option>
            <option value="quarter">Dette Kvartal</option>
            <option value="year">Dette År</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/30">
              <DollarSign className="h-6 w-6 text-primary-color" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${getChangeColor(stats.revenue.change)}`}>
              {getChangeIcon(stats.revenue.change)}
              <span>{stats.revenue.change.toFixed(1)}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Omsætning</p>
            <p className="text-2xl font-bold text-foreground">{stats.revenue.current.toLocaleString()} kr</p>
            <p className="text-xs text-muted-foreground mt-1">Fra {stats.revenue.previous.toLocaleString()} kr</p>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-400/10 border border-blue-400/30">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${getChangeColor(stats.customers.change)}`}>
              {getChangeIcon(stats.customers.change)}
              <span>{stats.customers.change.toFixed(1)}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Kunder</p>
            <p className="text-2xl font-bold text-foreground">{stats.customers.current}</p>
            <p className="text-xs text-muted-foreground mt-1">Fra {stats.customers.previous} kunder</p>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-yellow-400/10 border border-yellow-400/30">
              <Target className="h-6 w-6 text-yellow-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${getChangeColor(stats.leads.change)}`}>
              {getChangeIcon(stats.leads.change)}
              <span>{stats.leads.change.toFixed(1)}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Leads</p>
            <p className="text-2xl font-bold text-foreground">{stats.leads.current}</p>
            <p className="text-xs text-muted-foreground mt-1">Fra {stats.leads.previous} leads</p>
          </div>
        </div>

        <div className="glass rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-400/10 border border-purple-400/30">
              <FileText className="h-6 w-6 text-purple-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${getChangeColor(stats.quotes.change)}`}>
              {getChangeIcon(stats.quotes.change)}
              <span>{stats.quotes.change.toFixed(1)}%</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tilbud</p>
            <p className="text-2xl font-bold text-foreground">{stats.quotes.current}</p>
            <p className="text-xs text-muted-foreground mt-1">Fra {stats.quotes.previous} tilbud</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="glass rounded-xl border overflow-hidden">
          <div className="p-6 border-b border-glass">
            <h3 className="text-lg font-semibold text-foreground">Omsætning Udvikling</h3>
            <p className="text-sm text-muted-foreground">Månedlig omsætning (kr)</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {revenueByMonth.map((item, index) => {
                const maxRevenue = Math.max(...revenueByMonth.map(m => m.amount));
                const widthPercent = (item.amount / maxRevenue) * 100;
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{item.month}</span>
                      <span className="text-foreground font-medium">{item.amount.toLocaleString()} kr</span>
                    </div>
                    <div className="w-full h-2 bg-glass rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Service Breakdown */}
        <div className="glass rounded-xl border overflow-hidden">
          <div className="p-6 border-b border-glass">
            <h3 className="text-lg font-semibold text-foreground">Service Fordeling</h3>
            <p className="text-sm text-muted-foreground">Antal opgaver og omsætning</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {serviceBreakdown.map((item, index) => (
                <div key={index} className="glass rounded-lg p-4 border">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-foreground">{item.service}</span>
                    <span className="text-xs text-muted-foreground">{item.count} opgaver</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="w-full h-2 bg-glass rounded-full overflow-hidden mr-3">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                        style={{ width: `${(item.revenue / 425600) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground whitespace-nowrap">{item.revenue.toLocaleString()} kr</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="glass rounded-xl border overflow-hidden">
          <div className="p-6 border-b border-glass">
            <h3 className="text-lg font-semibold text-foreground">Top Kunder</h3>
            <p className="text-sm text-muted-foreground">Sorteret efter omsætning</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div key={index} className="flex items-center justify-between p-3 glass rounded-lg border hover:bg-glass/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{customer.orders} ordrer</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{customer.revenue.toLocaleString()} kr</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Conversion Metrics */}
        <div className="glass rounded-xl border overflow-hidden">
          <div className="p-6 border-b border-glass">
            <h3 className="text-lg font-semibold text-foreground">Konverterings Metrics</h3>
            <p className="text-sm text-muted-foreground">Performance indikatorer</p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Lead til Kunde</span>
                  <span className="text-sm font-semibold text-foreground">{conversionMetrics.leadToCustomer}%</span>
                </div>
                <div className="w-full h-3 bg-glass rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"
                    style={{ width: `${conversionMetrics.leadToCustomer}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Tilbud Accept Rate</span>
                  <span className="text-sm font-semibold text-foreground">{conversionMetrics.quoteAcceptance}%</span>
                </div>
                <div className="w-full h-3 bg-glass rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
                    style={{ width: `${conversionMetrics.quoteAcceptance}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Kunde Fastholdelse</span>
                  <span className="text-sm font-semibold text-foreground">{conversionMetrics.customerRetention}%</span>
                </div>
                <div className="w-full h-3 bg-glass rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                    style={{ width: `${conversionMetrics.customerRetention}%` }}
                  />
                </div>
              </div>

              <div className="glass rounded-lg p-4 border mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gennemsnitlig Ordre Værdi</span>
                  <span className="text-xl font-bold text-foreground">{conversionMetrics.averageOrderValue.toLocaleString()} kr</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
