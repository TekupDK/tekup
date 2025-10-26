'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Star,
  Calendar,
  Clock,
  MapPin,
  Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageRating: number;
  revenueChange: number;
  ordersChange: number;
  customersChange: number;
  ratingChange: number;
}

interface RecentOrder {
  id: string;
  customerName: string;
  items: string[];
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  time: string;
}

const DashboardPage = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 12450,
    totalOrders: 156,
    totalCustomers: 89,
    averageRating: 4.8,
    revenueChange: 12.5,
    ordersChange: 8.2,
    customersChange: 15.3,
    ratingChange: 0.2
  });

  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([
    {
      id: '1',
      customerName: 'John Doe',
      items: ['Margherita Pizza', 'Caesar Salad'],
      total: 28.50,
      status: 'preparing',
      time: '10 min ago'
    },
    {
      id: '2',
      customerName: 'Sarah Johnson',
      items: ['Chicken Burger', 'Fries'],
      total: 15.99,
      status: 'ready',
      time: '15 min ago'
    },
    {
      id: '3',
      customerName: 'Mike Wilson',
      items: ['Pasta Carbonara'],
      total: 18.00,
      status: 'delivered',
      time: '25 min ago'
    },
    {
      id: '4',
      customerName: 'Emma Davis',
      items: ['Fish & Chips', 'Coleslaw'],
      total: 22.50,
      status: 'pending',
      time: '30 min ago'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'preparing': return 'text-blue-600 bg-blue-50';
      case 'ready': return 'text-green-600 bg-green-50';
      case 'delivered': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    prefix = '', 
    suffix = '' 
  }: {
    title: string;
    value: number;
    change: number;
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
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          {change > 0 ? (
            <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
          )}
          <span className={change > 0 ? 'text-green-500' : 'text-red-500'}>
            {Math.abs(change)}%
          </span>
          <span className="ml-1">from last month</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Last 30 days
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={stats.totalRevenue}
          change={stats.revenueChange}
          icon={DollarSign}
          prefix="$"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          change={stats.ordersChange}
          icon={ShoppingBag}
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers}
          change={stats.customersChange}
          icon={Users}
        />
        <StatCard
          title="Average Rating"
          value={stats.averageRating}
          change={stats.ratingChange}
          icon={Star}
          suffix="/5"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Orders */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              You have {recentOrders.filter(order => order.status !== 'delivered').length} active orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{order.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.items.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">${order.total.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {order.time}
                      </p>
                    </div>
                    <span className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium capitalize',
                      getStatusColor(order.status)
                    )}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Manage your restaurant efficiently
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start" variant="outline">
              <ShoppingBag className="mr-2 h-4 w-4" />
              View All Orders
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Manage Customers
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <MapPin className="mr-2 h-4 w-4" />
              Update Restaurant Info
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Phone className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's Performance</CardTitle>
            <CardDescription>
              Real-time metrics for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Orders Today</span>
                <span className="text-2xl font-bold">23</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Revenue Today</span>
                <span className="text-2xl font-bold">$456.78</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Order Value</span>
                <span className="text-2xl font-bold">$19.86</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Popular Items</CardTitle>
            <CardDescription>
              Most ordered items this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Margherita Pizza', orders: 45 },
                { name: 'Chicken Burger', orders: 32 },
                { name: 'Caesar Salad', orders: 28 },
                { name: 'Pasta Carbonara', orders: 24 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground">{item.orders} orders</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;