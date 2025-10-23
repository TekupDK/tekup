import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  Zap
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const stats = [
    {
      name: 'I dag bookinger',
      value: '8',
      change: '+2 fra i går',
      changeType: 'positive',
      icon: Calendar,
    },
    {
      name: 'Aktive kunder',
      value: '142',
      change: '+12 denne måned',
      changeType: 'positive',
      icon: Users,
    },
    {
      name: 'Omsætning i dag',
      value: '24.500 kr',
      change: '+15% fra i går',
      changeType: 'positive',
      icon: DollarSign,
    },
    {
      name: 'Gennemsnitlig tid',
      value: '2.4 timer',
      change: '-0.3 timer',
      changeType: 'positive',
      icon: Clock,
    },
  ];

  const recentBookings = [
    {
      id: 1,
      customer: 'Jes Vestergaard',
      service: 'Renovering',
      time: '09:00 - 11:30',
      status: 'confirmed',
      date: '2025-10-21',
    },
    {
      id: 2,
      customer: 'Maria Hansen',
      service: 'Maling',
      time: '13:00 - 15:00',
      status: 'pending',
      date: '2025-10-21',
    },
    {
      id: 3,
      customer: 'Lars Nielsen',
      service: 'Gulv',
      time: '16:00 - 18:00',
      status: 'confirmed',
      date: '2025-10-21',
    },
  ];

  const alerts = [
    {
      type: 'warning',
      message: 'Overtid risiko på Jes Vestergaard booking',
      time: '2 min siden',
    },
    {
      type: 'info',
      message: 'Ny kunde Maria Hansen tilføjet',
      time: '15 min siden',
    },
    {
      type: 'success',
      message: 'Faktura sendt til Lars Nielsen',
      time: '1 time siden',
    },
  ];

  return (
    <div className={`p-6 space-y-6 transition-colors duration-300 ${
      isDarkMode ? 'text-gray-100' : 'text-gray-900'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Dashboard
          </h1>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Oversigt over din kalender og bookinger
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            MCP System Online
          </span>
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
              className={`rounded-lg shadow-sm border p-6 transition-colors duration-300 ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {stat.name}
                  </p>
                  <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value}
                  </p>
                  <p className={`text-sm ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                  isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                }`}>
                  <Icon className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-lg shadow-sm border transition-colors duration-300 ${
  isDarkMode
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200'
}"
        >
          <div className="p-6 border-b transition-colors duration-300 ${
  isDarkMode ? 'border-gray-700' : 'border-gray-200'
}">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Seneste bookinger
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300 ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                    </div>
                    <div>
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {booking.customer}
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {booking.service}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {booking.time}
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed'
                        ? isDarkMode
                          ? 'bg-green-900/30 text-green-300'
                          : 'bg-green-100 text-green-800'
                        : isDarkMode
                          ? 'bg-yellow-900/30 text-yellow-300'
                          : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status === 'confirmed' ? 'Bekræftet' : 'Afventer'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-lg shadow-sm border transition-colors duration-300 ${
  isDarkMode
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200'
}"
        >
          <div className="p-6 border-b transition-colors duration-300 ${
  isDarkMode ? 'border-gray-700' : 'border-gray-200'
}">
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              System alerts
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    alert.type === 'warning' ? 'bg-yellow-500' :
                    alert.type === 'info' ? 'bg-blue-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className={`text-sm ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                      {alert.message}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {alert.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-lg shadow-sm border transition-colors duration-300 ${
  isDarkMode
    ? 'bg-gray-800 border-gray-700'
    : 'bg-white border-gray-200'
} p-6"
      >
        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Hurtige handlinger
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className={`flex flex-col items-center p-4 rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-blue-900/20 hover:bg-blue-900/30 text-blue-300'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-900'
          }`}>
            <Calendar className={`w-6 h-6 mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className={`text-sm font-medium ${isDarkMode ? 'text-blue-200' : 'text-blue-900'}`}>
              Ny booking
            </span>
          </button>
          <button className={`flex flex-col items-center p-4 rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-green-900/20 hover:bg-green-900/30 text-green-300'
              : 'bg-green-50 hover:bg-green-100 text-green-900'
          }`}>
            <Users className={`w-6 h-6 mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            <span className={`text-sm font-medium ${isDarkMode ? 'text-green-200' : 'text-green-900'}`}>
              Ny kunde
            </span>
          </button>
          <button className={`flex flex-col items-center p-4 rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-purple-900/20 hover:bg-purple-900/30 text-purple-300'
              : 'bg-purple-50 hover:bg-purple-100 text-purple-900'
          }`}>
            <DollarSign className={`w-6 h-6 mb-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <span className={`text-sm font-medium ${isDarkMode ? 'text-purple-200' : 'text-purple-900'}`}>
              Send faktura
            </span>
          </button>
          <button className={`flex flex-col items-center p-4 rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-orange-900/20 hover:bg-orange-900/30 text-orange-300'
              : 'bg-orange-50 hover:bg-orange-100 text-orange-900'
          }`}>
            <Zap className={`w-6 h-6 mb-2 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
            <span className={`text-sm font-medium ${isDarkMode ? 'text-orange-200' : 'text-orange-900'}`}>
              MCP Tools
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
