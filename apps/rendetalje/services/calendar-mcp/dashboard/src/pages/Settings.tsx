import React from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Database, Zap } from 'lucide-react';

const Settings: React.FC = () => {
  const settingsCategories = [
    {
      name: 'Profil',
      icon: User,
      description: 'Administrer din profil og personlige information',
      items: [
        { name: 'Navn', value: 'Admin User', editable: true },
        { name: 'Email', value: 'admin@renos.dk', editable: true },
        { name: 'Telefon', value: '+45 12 34 56 78', editable: true },
        { name: 'Adresse', value: 'København, Danmark', editable: true }
      ]
    },
    {
      name: 'Notifikationer',
      icon: Bell,
      description: 'Konfigurer notifikationer og alerts',
      items: [
        { name: 'Email notifikationer', value: 'Aktiveret', editable: true },
        { name: 'SMS alerts', value: 'Aktiveret', editable: true },
        { name: 'Push notifikationer', value: 'Aktiveret', editable: true },
        { name: 'Overtid alerts', value: 'Aktiveret', editable: true }
      ]
    },
    {
      name: 'Sikkerhed',
      icon: Shield,
      description: 'Sikkerhedsindstillinger og adgangskontrol',
      items: [
        { name: '2FA', value: 'Aktiveret', editable: true },
        { name: 'Session timeout', value: '24 timer', editable: true },
        { name: 'Login logs', value: 'Aktiveret', editable: true },
        { name: 'API nøgler', value: '3 aktive', editable: true }
      ]
    },
    {
      name: 'Database',
      icon: Database,
      description: 'Database indstillinger og backup',
      items: [
        { name: 'Backup frekvens', value: 'Daglig', editable: true },
        { name: 'Data retention', value: '2 år', editable: true },
        { name: 'Encryption', value: 'Aktiveret', editable: true },
        { name: 'Last backup', value: '2025-10-21 06:00', editable: false }
      ]
    },
    {
      name: 'MCP System',
      icon: Zap,
      description: 'MCP server indstillinger og plugins',
      items: [
        { name: 'MCP Server', value: 'Aktiveret', editable: true },
        { name: 'Plugin count', value: '5 aktive', editable: false },
        { name: 'Auto-update', value: 'Aktiveret', editable: true },
        { name: 'Debug mode', value: 'Deaktiveret', editable: true }
      ]
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Indstillinger</h1>
          <p className="text-gray-600">Administrer systemindstillinger og konfiguration</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Gem ændringer
          </button>
        </div>
      </div>

      {/* Settings Categories */}
      <div className="space-y-6">
        {settingsCategories.map((category, index) => {
          const Icon = category.icon;
          return (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.value}</p>
                      </div>
                      {item.editable && (
                        <button className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors">
                          Rediger
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* System Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">MCP Server: Online</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Database: Connected</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Plugins: 5 Active</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Settings;
