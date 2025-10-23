import React from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, Calendar, Clock } from 'lucide-react';

const Analytics: React.FC = () => {
  const stats = [
    {
      name: 'Total omsætning',
      value: '156.500 kr',
      change: '+12% fra sidste måned',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      name: 'Aktive kunder',
      value: '142',
      change: '+8 nye kunder',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      name: 'Bookinger denne måned',
      value: '89',
      change: '+15% fra sidste måned',
      icon: Calendar,
      color: 'text-purple-600'
    },
    {
      name: 'Gennemsnitlig tid',
      value: '2.4 timer',
      change: '-0.3 timer',
      icon: Clock,
      color: 'text-orange-600'
    }
  ];

  const chartData = [
    { month: 'Jan', bookings: 45, revenue: 12500 },
    { month: 'Feb', bookings: 52, revenue: 14200 },
    { month: 'Mar', bookings: 48, revenue: 13800 },
    { month: 'Apr', bookings: 61, revenue: 16800 },
    { month: 'Maj', bookings: 55, revenue: 15200 },
    { month: 'Jun', bookings: 67, revenue: 18500 },
    { month: 'Jul', bookings: 72, revenue: 19800 },
    { month: 'Aug', bookings: 68, revenue: 19200 },
    { month: 'Sep', bookings: 75, revenue: 21000 },
    { month: 'Okt', bookings: 89, revenue: 24500 }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Oversigt over din forretningsudvikling</p>
        </div>
        <div className="flex items-center space-x-3">
          <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>Seneste 30 dage</option>
            <option>Seneste 3 måneder</option>
            <option>Seneste år</option>
          </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Omsætning over tid</h3>
          <div className="space-y-4">
            {chartData.slice(-6).map((data) => (
              <div key={data.month} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">{data.month}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(data.revenue / 25000) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{data.revenue.toLocaleString()} kr</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bookings Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bookinger over tid</h3>
          <div className="space-y-4">
            {chartData.slice(-6).map((data) => (
              <div key={data.month} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">{data.month}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(data.bookings / 100) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{data.bookings}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top Services */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mest populære services</h3>
        <div className="space-y-3">
          {[
            { name: 'Renovering', bookings: 45, revenue: 67500 },
            { name: 'Maling', bookings: 32, revenue: 38400 },
            { name: 'Gulv', bookings: 28, revenue: 50400 },
            { name: 'Konsultation', bookings: 15, revenue: 15000 }
          ].map((service) => (
            <div key={service.name} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{service.name}</p>
                <p className="text-sm text-gray-500">{service.bookings} bookinger</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{service.revenue.toLocaleString()} kr</p>
                <p className="text-sm text-gray-500">Omsætning</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;
