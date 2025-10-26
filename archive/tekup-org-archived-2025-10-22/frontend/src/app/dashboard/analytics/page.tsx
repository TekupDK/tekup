'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingBag,
  Star,
  Clock,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { cn, formatCurrency, formatPercentage } from '@/lib/utils';

interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down';
  };
  orders: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down';
  };
  customers: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down';
  };
  avgOrderValue: {
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down';
  };
}

interface AIInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'success' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  category: 'revenue' | 'operations' | 'customer' | 'menu';
}

interface PopularItem {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  change: number;
  trend: 'up' | 'down';
}

interface TimeSlotData {
  hour: string;
  orders: number;
  revenue: number;
}

const AnalyticsPage = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  
  const analyticsData: AnalyticsData = {
    revenue: {
      current: 12450,
      previous: 11200,
      change: 11.2,
      trend: 'up'
    },
    orders: {
      current: 156,
      previous: 142,
      change: 9.9,
      trend: 'up'
    },
    customers: {
      current: 89,
      previous: 95,
      change: -6.3,
      trend: 'down'
    },
    avgOrderValue: {
      current: 79.81,
      previous: 78.87,
      change: 1.2,
      trend: 'up'
    }
  };

  const aiInsights: AIInsight[] = [
    {
      id: '1',
      type: 'opportunity',
      title: 'Peak Hour Optimization',
      description: 'Your busiest hours (6-8 PM) show 23% higher demand than capacity. Consider adding staff or pre-preparing popular items.',
      impact: 'high',
      actionable: true,
      category: 'operations'
    },
    {
      id: '2',
      type: 'recommendation',
      title: 'Menu Item Promotion',
      description: 'Pasta Carbonara has 89% customer satisfaction but only 12% order frequency. A promotion could boost revenue by ~15%.',
      impact: 'medium',
      actionable: true,
      category: 'menu'
    },
    {
      id: '3',
      type: 'warning',
      title: 'Customer Retention Alert',
      description: 'Repeat customer rate dropped 6.3% this month. Consider implementing a loyalty program or follow-up campaigns.',
      impact: 'high',
      actionable: true,
      category: 'customer'
    },
    {
      id: '4',
      type: 'success',
      title: 'Delivery Performance',
      description: 'Your average delivery time improved by 18% this month, leading to higher customer satisfaction scores.',
      impact: 'medium',
      actionable: false,
      category: 'operations'
    },
    {
      id: '5',
      type: 'opportunity',
      title: 'Weekend Revenue Gap',
      description: 'Weekend revenue is 34% lower than weekdays. Consider special weekend menus or promotions.',
      impact: 'high',
      actionable: true,
      category: 'revenue'
    }
  ];

  const popularItems: PopularItem[] = [
    {
      id: '1',
      name: 'Margherita Pizza',
      orders: 45,
      revenue: 854.55,
      change: 12.5,
      trend: 'up'
    },
    {
      id: '2',
      name: 'Chicken Caesar Salad',
      orders: 32,
      revenue: 479.68,
      change: 8.3,
      trend: 'up'
    },
    {
      id: '3',
      name: 'Beef Burger Deluxe',
      orders: 28,
      revenue: 475.72,
      change: -5.2,
      trend: 'down'
    },
    {
      id: '4',
      name: 'Pasta Carbonara',
      orders: 24,
      revenue: 479.76,
      change: 15.7,
      trend: 'up'
    },
    {
      id: '5',
      name: 'Fish & Chips',
      orders: 19,
      revenue: 427.50,
      change: -2.1,
      trend: 'down'
    }
  ];

  const timeSlotData: TimeSlotData[] = [
    { hour: '11:00', orders: 8, revenue: 156.80 },
    { hour: '12:00', orders: 15, revenue: 298.50 },
    { hour: '13:00', orders: 22, revenue: 445.60 },
    { hour: '14:00', orders: 12, revenue: 234.80 },
    { hour: '15:00', orders: 6, revenue: 118.20 },
    { hour: '16:00', orders: 9, revenue: 178.90 },
    { hour: '17:00', orders: 18, revenue: 356.40 },
    { hour: '18:00', orders: 28, revenue: 567.20 },
    { hour: '19:00', orders: 32, revenue: 645.60 },
    { hour: '20:00', orders: 25, revenue: 498.50 },
    { hour: '21:00', orders: 14, revenue: 278.60 },
    { hour: '22:00', orders: 7, revenue: 139.30 }
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return Target;
      case 'warning': return AlertTriangle;
      case 'success': return CheckCircle;
      case 'recommendation': return Lightbulb;
      default: return Activity;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-red-600 bg-red-50 border-red-200';
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'recommendation': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const MetricCard = ({ 
    title, 
    current, 
    previous, 
    change, 
    trend, 
    icon: Icon, 
    prefix = '', 
    suffix = '' 
  }: {
    title: string;
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down';
    icon: any;
    prefix?: string;
    suffix?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {prefix}{typeof current === 'number' ? current.toLocaleString() : current}{suffix}
        </div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          {trend === 'up' ? (
            <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
          ) : (
            <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
          )}
          <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
            {Math.abs(change)}%
          </span>
          <span className="ml-1">vs last period</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Previous: {prefix}{previous.toLocaleString()}{suffix}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics & Insights</h2>
        <div className="flex items-center space-x-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button variant="outline">
            <BarChart3 className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Revenue"
          current={analyticsData.revenue.current}
          previous={analyticsData.revenue.previous}
          change={analyticsData.revenue.change}
          trend={analyticsData.revenue.trend}
          icon={DollarSign}
          prefix="$"
        />
        <MetricCard
          title="Orders"
          current={analyticsData.orders.current}
          previous={analyticsData.orders.previous}
          change={analyticsData.orders.change}
          trend={analyticsData.orders.trend}
          icon={ShoppingBag}
        />
        <MetricCard
          title="Customers"
          current={analyticsData.customers.current}
          previous={analyticsData.customers.previous}
          change={analyticsData.customers.change}
          trend={analyticsData.customers.trend}
          icon={Users}
        />
        <MetricCard
          title="Avg Order Value"
          current={analyticsData.avgOrderValue.current}
          previous={analyticsData.avgOrderValue.previous}
          change={analyticsData.avgOrderValue.change}
          trend={analyticsData.avgOrderValue.trend}
          icon={Star}
          prefix="$"
        />
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="mr-2 h-5 w-5" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription>
            Actionable recommendations based on your restaurant's performance data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiInsights.map((insight) => {
              const Icon = getInsightIcon(insight.type);
              return (
                <div 
                  key={insight.id}
                  className={cn(
                    "p-4 border rounded-lg",
                    getInsightColor(insight.type)
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Icon className="h-5 w-5 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium">{insight.title}</h4>
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full font-medium",
                            getImpactColor(insight.impact)
                          )}>
                            {insight.impact} impact
                          </span>
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 capitalize">
                            {insight.category}
                          </span>
                        </div>
                        <p className="text-sm opacity-90">{insight.description}</p>
                      </div>
                    </div>
                    {insight.actionable && (
                      <Button size="sm" variant="outline">
                        Take Action
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Popular Items */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Items</CardTitle>
            <CardDescription>
              Most ordered items and their performance trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {popularItems.map((item, index) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.orders} orders • {formatCurrency(item.revenue)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      item.trend === 'up' ? 'text-green-500' : 'text-red-500'
                    )}>
                      {Math.abs(item.change)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card>
          <CardHeader>
            <CardTitle>Peak Hours Analysis</CardTitle>
            <CardDescription>
              Order volume and revenue by hour of day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {timeSlotData.map((slot) => {
                const maxOrders = Math.max(...timeSlotData.map(s => s.orders));
                const orderPercentage = (slot.orders / maxOrders) * 100;
                
                return (
                  <div key={slot.hour} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{slot.hour}</span>
                      <div className="flex items-center space-x-4">
                        <span>{slot.orders} orders</span>
                        <span className="text-muted-foreground">{formatCurrency(slot.revenue)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${orderPercentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Customer Satisfaction</CardTitle>
            <CardDescription>Based on reviews and ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">4.8/5</div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>Based on 234 reviews</span>
            </div>
            <div className="mt-4 space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = rating === 5 ? 156 : rating === 4 ? 52 : rating === 3 ? 18 : rating === 2 ? 6 : 2;
                const percentage = (count / 234) * 100;
                
                return (
                  <div key={rating} className="flex items-center space-x-2">
                    <span className="text-sm w-2">{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operational Efficiency</CardTitle>
            <CardDescription>Key operational metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Avg Prep Time</span>
              <span className="text-2xl font-bold">18 min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Order Accuracy</span>
              <span className="text-2xl font-bold">96.5%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">On-Time Delivery</span>
              <span className="text-2xl font-bold">94.2%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Table Turnover</span>
              <span className="text-2xl font-bold">2.3x</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Growth Metrics</CardTitle>
            <CardDescription>Month-over-month growth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Revenue Growth</span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold text-green-500">+11.2%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">New Customers</span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold text-green-500">+8.7%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Repeat Orders</span>
              <div className="flex items-center space-x-1">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-2xl font-bold text-red-500">-3.1%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Market Share</span>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-2xl font-bold text-green-500">+2.4%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsPage;