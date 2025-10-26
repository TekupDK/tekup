'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  MapPin,
  User,
  DollarSign,
  Calendar,
  Truck,
  ChefHat,
  Bell
} from 'lucide-react';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress?: string;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'cash' | 'card' | 'online';
  estimatedTime: number;
  actualTime?: number;
  specialInstructions?: string;
  createdAt: string;
  updatedAt: string;
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'ORD-001',
      customerName: 'John Doe',
      customerPhone: '+1 (555) 123-4567',
      customerEmail: 'john@example.com',
      deliveryAddress: '123 Main St, Apt 4B, City 12345',
      orderType: 'delivery',
      status: 'preparing',
      items: [
        { id: '1', name: 'Margherita Pizza', quantity: 1, price: 18.99 },
        { id: '2', name: 'Caesar Salad', quantity: 1, price: 12.99 }
      ],
      subtotal: 31.98,
      tax: 2.56,
      deliveryFee: 3.99,
      total: 38.53,
      paymentStatus: 'paid',
      paymentMethod: 'online',
      estimatedTime: 35,
      specialInstructions: 'Extra cheese on pizza, dressing on the side for salad',
      createdAt: '2024-01-25T14:30:00Z',
      updatedAt: '2024-01-25T14:35:00Z'
    },
    {
      id: '2',
      orderNumber: 'ORD-002',
      customerName: 'Sarah Johnson',
      customerPhone: '+1 (555) 987-6543',
      customerEmail: 'sarah@example.com',
      orderType: 'takeaway',
      status: 'ready',
      items: [
        { id: '3', name: 'Chicken Burger', quantity: 2, price: 15.99 },
        { id: '4', name: 'French Fries', quantity: 2, price: 4.99 }
      ],
      subtotal: 41.96,
      tax: 3.36,
      deliveryFee: 0,
      total: 45.32,
      paymentStatus: 'paid',
      paymentMethod: 'card',
      estimatedTime: 15,
      actualTime: 12,
      createdAt: '2024-01-25T15:15:00Z',
      updatedAt: '2024-01-25T15:27:00Z'
    },
    {
      id: '3',
      orderNumber: 'ORD-003',
      customerName: 'Mike Wilson',
      customerPhone: '+1 (555) 456-7890',
      customerEmail: 'mike@example.com',
      orderType: 'dine-in',
      status: 'pending',
      items: [
        { id: '5', name: 'Pasta Carbonara', quantity: 1, price: 19.99 },
        { id: '6', name: 'Garlic Bread', quantity: 1, price: 6.99 },
        { id: '7', name: 'Tiramisu', quantity: 1, price: 8.99 }
      ],
      subtotal: 35.97,
      tax: 2.88,
      deliveryFee: 0,
      total: 38.85,
      paymentStatus: 'pending',
      paymentMethod: 'cash',
      estimatedTime: 25,
      specialInstructions: 'Table 12, customer has nut allergy',
      createdAt: '2024-01-25T15:45:00Z',
      updatedAt: '2024-01-25T15:45:00Z'
    },
    {
      id: '4',
      orderNumber: 'ORD-004',
      customerName: 'Emma Davis',
      customerPhone: '+1 (555) 321-0987',
      customerEmail: 'emma@example.com',
      deliveryAddress: '456 Oak Ave, Suite 2A, City 12345',
      orderType: 'delivery',
      status: 'out-for-delivery',
      items: [
        { id: '8', name: 'Fish & Chips', quantity: 1, price: 22.50 },
        { id: '9', name: 'Coleslaw', quantity: 1, price: 4.50 }
      ],
      subtotal: 27.00,
      tax: 2.16,
      deliveryFee: 3.99,
      total: 33.15,
      paymentStatus: 'paid',
      paymentMethod: 'online',
      estimatedTime: 40,
      actualTime: 35,
      createdAt: '2024-01-25T14:00:00Z',
      updatedAt: '2024-01-25T14:35:00Z'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.orderType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'confirmed': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'preparing': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'ready': return 'text-green-600 bg-green-50 border-green-200';
      case 'out-for-delivery': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'delivered': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return AlertCircle;
      case 'confirmed': return CheckCircle;
      case 'preparing': return ChefHat;
      case 'ready': return Bell;
      case 'out-for-delivery': return Truck;
      case 'delivered': return CheckCircle;
      case 'cancelled': return XCircle;
      default: return Clock;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dine-in': return User;
      case 'takeaway': return ChefHat;
      case 'delivery': return Truck;
      default: return User;
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
        : order
    ));
  };

  const getNextStatus = (currentStatus: Order['status']): Order['status'] | null => {
    const statusFlow = {
      'pending': 'confirmed',
      'confirmed': 'preparing',
      'preparing': 'ready',
      'ready': 'out-for-delivery',
      'out-for-delivery': 'delivered'
    } as const;
    
    return statusFlow[currentStatus] || null;
  };

  const OrderCard = ({ order }: { order: Order }) => {
    const StatusIcon = getStatusIcon(order.status);
    const TypeIcon = getTypeIcon(order.orderType);
    const nextStatus = getNextStatus(order.status);
    
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <TypeIcon className="mr-1 h-4 w-4" />
                <span className="capitalize">{order.orderType}</span>
                <span className="mx-2">•</span>
                <span>{formatRelativeTime(order.createdAt)}</span>
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <span className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border flex items-center',
                getStatusColor(order.status)
              )}>
                <StatusIcon className="mr-1 h-3 w-3" />
                {order.status.replace('-', ' ')}
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Customer Info */}
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <User className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{order.customerName}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <Phone className="mr-2 h-4 w-4" />
              <span>{order.customerPhone}</span>
            </div>
            {order.deliveryAddress && (
              <div className="flex items-start text-sm text-muted-foreground">
                <MapPin className="mr-2 h-4 w-4 mt-0.5" />
                <span className="line-clamp-2">{order.deliveryAddress}</span>
              </div>
            )}
          </div>
          
          {/* Order Items */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Items ({order.items.length})</h4>
            <div className="space-y-1">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Special Instructions */}
          {order.specialInstructions && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Special Instructions:</strong> {order.specialInstructions}
              </p>
            </div>
          )}
          
          {/* Order Summary */}
          <div className="space-y-1 pt-2 border-t">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            {order.deliveryFee > 0 && (
              <div className="flex justify-between text-sm">
                <span>Delivery:</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-medium pt-1 border-t">
              <span>Total:</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
          
          {/* Timing Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <Clock className="mr-1 h-4 w-4" />
              <span>Est. {order.estimatedTime} min</span>
              {order.actualTime && (
                <span className="ml-2">(Actual: {order.actualTime} min)</span>
              )}
            </div>
            <div className="flex items-center">
              <DollarSign className="mr-1 h-4 w-4" />
              <span className={cn(
                "capitalize",
                order.paymentStatus === 'paid' ? 'text-green-600' : 
                order.paymentStatus === 'failed' ? 'text-red-600' : 'text-yellow-600'
              )}>
                {order.paymentStatus}
              </span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              {nextStatus && order.status !== 'delivered' && order.status !== 'cancelled' && (
                <Button 
                  size="sm" 
                  onClick={() => updateOrderStatus(order.id, nextStatus)}
                >
                  Mark as {nextStatus.replace('-', ' ')}
                </Button>
              )}
              {order.status === 'pending' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-red-600"
                  onClick={() => updateOrderStatus(order.id, 'cancelled')}
                >
                  Cancel
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline">
                <Phone className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline">
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const orderStats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    revenue: orders.reduce((acc, order) => acc + order.total, 0)
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Today
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by order number, customer name, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 max-w-md"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="out-for-delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select 
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Types</option>
          <option value="dine-in">Dine In</option>
          <option value="takeaway">Takeaway</option>
          <option value="delivery">Delivery</option>
        </select>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preparing</CardTitle>
            <ChefHat className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{orderStats.preparing}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready</CardTitle>
            <Bell className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{orderStats.ready}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(orderStats.revenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' ? 
              'No orders found matching your criteria.' : 
              'No orders found.'
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;