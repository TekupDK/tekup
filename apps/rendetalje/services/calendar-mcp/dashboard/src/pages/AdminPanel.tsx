import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Database, Zap, Settings, Clock } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const systemStats = [
    {
      name: 'MCP Server Status',
      value: 'Online',
      status: 'success',
      icon: Zap
    },
    {
      name: 'Database Connection',
      value: 'Connected',
      status: 'success',
      icon: Database
    },
    {
      name: 'Active Plugins',
      value: '5',
      status: 'info',
      icon: Settings
    },
    {
      name: 'System Load',
      value: '23%',
      status: 'success',
      icon: Clock
    }
  ];

  const recentLogs = [
    {
      id: 1,
      level: 'info',
      message: 'MCP server started successfully',
      timestamp: '2025-10-21 19:45:23',
      service: 'MCP Server'
    },
    {
      id: 2,
      level: 'success',
      message: 'Database connection established',
      timestamp: '2025-10-21 19:45:20',
      service: 'Database'
    },
    {
      id: 3,
      level: 'warning',
      message: 'High memory usage detected',
      timestamp: '2025-10-21 19:44:15',
      service: 'System'
    },
    {
      id: 4,
      level: 'info',
      message: 'Plugin loaded: RenOS Calendar MCP',
      timestamp: '2025-10-21 19:44:10',
      service: 'Plugin Manager'
    }
  ];

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'success':
  //       return 'bg-green-100 text-green-800';
  //     case 'warning':
  //       return 'bg-yellow-100 text-yellow-800';
  //     case 'error':
  //       return 'bg-red-100 text-red-800';
  //     case 'info':
  //       return 'bg-blue-100 text-blue-800';
  //     default:
  //       return 'bg-gray-100 text-gray-800';
  //   }
  // };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      case 'info':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600">System administration og monitoring</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Restart System
          </button>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemStats.map((stat, index) => {
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
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stat.status === 'success' ? 'bg-green-100' :
                  stat.status === 'warning' ? 'bg-yellow-100' :
                  stat.status === 'error' ? 'bg-red-100' : 'bg-blue-100'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    stat.status === 'success' ? 'text-green-600' :
                    stat.status === 'warning' ? 'text-yellow-600' :
                    stat.status === 'error' ? 'text-red-600' : 'text-blue-600'
                  }`} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Logs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    log.level === 'success' ? 'bg-green-500' :
                    log.level === 'warning' ? 'bg-yellow-500' :
                    log.level === 'error' ? 'bg-red-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{log.message}</p>
                      <span className={`text-xs font-medium ${getLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>{log.timestamp}</span>
                      <span>{log.service}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Restart MCP Server</span>
                </div>
                <span className="text-sm text-blue-600">→</span>
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-900">Backup Database</span>
                </div>
                <span className="text-sm text-green-600">→</span>
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-900">Update Plugins</span>
                </div>
                <span className="text-sm text-purple-600">→</span>
              </button>
              <button className="w-full flex items-center justify-between p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-900">Security Scan</span>
                </div>
                <span className="text-sm text-orange-600">→</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">CPU Usage</span>
              <span className="text-sm font-semibold text-gray-900">23%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '23%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Memory Usage</span>
              <span className="text-sm font-semibold text-gray-900">67%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '67%' }}></div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Disk Usage</span>
              <span className="text-sm font-semibold text-gray-900">45%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminPanel;
