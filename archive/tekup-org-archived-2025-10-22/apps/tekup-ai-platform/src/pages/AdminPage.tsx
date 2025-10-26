import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, Users, Database, Activity, Settings, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Oversigt', icon: <Activity className="w-4 h-4" /> },
    { id: 'users', label: 'Brugere', icon: <Users className="w-4 h-4" /> },
    { id: 'system', label: 'System', icon: <Database className="w-4 h-4" /> },
    { id: 'security', label: 'Sikkerhed', icon: <Shield className="w-4 h-4" /> }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-danger-400" />
            System Administration
          </h1>
          <p className="text-slate-400 mt-2">
            Administrer brugere, system indstillinger og sikkerhed
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-danger-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* System Status */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Brugere', value: '234', status: 'success', icon: <Users className="w-5 h-5" /> },
                { label: 'Aktive Sessions', value: '89', status: 'success', icon: <Activity className="w-5 h-5" /> },
                { label: 'System Load', value: '34%', status: 'warning', icon: <Database className="w-5 h-5" /> },
                { label: 'Sikkerhedsstatus', value: 'Sikker', status: 'success', icon: <Shield className="w-5 h-5" /> }
              ].map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card-glass"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-lg ${
                      metric.status === 'success' ? 'bg-success-500/20 text-success-400' :
                      metric.status === 'warning' ? 'bg-warning-500/20 text-warning-400' :
                      'bg-danger-500/20 text-danger-400'
                    }`}>
                      {metric.icon}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      metric.status === 'success' ? 'bg-success-400' :
                      metric.status === 'warning' ? 'bg-warning-400' :
                      'bg-danger-400'
                    }`} />
                  </div>
                  <div className="text-2xl font-bold text-white">{metric.value}</div>
                  <div className="text-sm text-slate-400">{metric.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Recent Events */}
            <div className="card-glass">
              <h2 className="text-xl font-semibold text-white mb-6">Seneste System Events</h2>
              
              <div className="space-y-4">
                {[
                  {
                    event: 'Ny bruger registreret',
                    user: 'sarah.jensen@company.dk',
                    time: '5 min siden',
                    type: 'success'
                  },
                  {
                    event: 'Failed login attempt',
                    user: 'unknown@suspicious.com',
                    time: '15 min siden',
                    type: 'warning'
                  },
                  {
                    event: 'Database backup gennemført',
                    user: 'System',
                    time: '2 timer siden',
                    type: 'success'
                  },
                  {
                    event: 'AI service restarted',
                    user: 'Admin',
                    time: '4 timer siden',
                    type: 'info'
                  }
                ].map((event, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg">
                    <div className={`p-2 rounded-lg ${
                      event.type === 'success' ? 'bg-success-500/20 text-success-400' :
                      event.type === 'warning' ? 'bg-warning-500/20 text-warning-400' :
                      event.type === 'info' ? 'bg-primary-500/20 text-primary-400' :
                      'bg-danger-500/20 text-danger-400'
                    }`}>
                      {event.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                       event.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                       <Clock className="w-4 h-4" />}
                    </div>
                    
                    <div className="flex-1">
                      <p className="text-white font-medium">{event.event}</p>
                      <p className="text-sm text-slate-400">{event.user}</p>
                    </div>
                    
                    <span className="text-xs text-slate-400">{event.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Bruger Administration</h2>
              <button className="btn-primary">Tilføj Bruger</button>
            </div>

            <div className="card-glass">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-600">
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Bruger</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Rolle</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Sidste Login</th>
                      <th className="text-left py-3 px-4 text-slate-300 font-medium">Handlinger</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {[
                      {
                        name: 'TekUp Administrator',
                        email: 'admin@tekup.dk',
                        role: 'SUPER_ADMIN',
                        status: 'Aktiv',
                        lastLogin: '2 min siden'
                      },
                      {
                        name: 'Sarah Jensen',
                        email: 'sarah@company.dk',
                        role: 'MANAGER',
                        status: 'Aktiv',
                        lastLogin: '5 min siden'
                      },
                      {
                        name: 'Mike Nielsen',
                        email: 'mike@company.dk',
                        role: 'USER',
                        status: 'Inaktiv',
                        lastLogin: '2 dage siden'
                      }
                    ].map((user, index) => (
                      <tr key={index} className="hover:bg-slate-800/30">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-white">{user.name}</div>
                            <div className="text-sm text-slate-400">{user.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.role === 'SUPER_ADMIN' ? 'bg-danger-500/20 text-danger-400' :
                            user.role === 'MANAGER' ? 'bg-warning-500/20 text-warning-400' :
                            'bg-primary-500/20 text-primary-400'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.status === 'Aktiv' ? 'bg-success-500/20 text-success-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{user.lastLogin}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button className="btn-glass text-xs py-1 px-2">Redigér</button>
                            <button className="btn-glass text-xs py-1 px-2">Deaktivér</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold text-white">System Konfiguration</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Database Status */}
              <div className="card-glass">
                <h3 className="text-lg font-semibold text-white mb-4">Database Status</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">PostgreSQL</span>
                    <span className="text-success-400">Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Redis Cache</span>
                    <span className="text-success-400">Online</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Backup Status</span>
                    <span className="text-success-400">Aktuel</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Disk Usage</span>
                    <span className="text-warning-400">68%</span>
                  </div>
                </div>
              </div>

              {/* AI Services */}
              <div className="card-glass">
                <h3 className="text-lg font-semibold text-white mb-4">AI Services Status</h3>
                
                <div className="space-y-3">
                  {[
                    { name: 'Proposal Engine', status: 'healthy' },
                    { name: 'Content Generator', status: 'healthy' },
                    { name: 'Customer Support', status: 'degraded' },
                    { name: 'Analytics Platform', status: 'maintenance' }
                  ].map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                      <span className="text-slate-300 text-sm">{service.name}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        service.status === 'healthy' ? 'bg-success-500/20 text-success-400' :
                        service.status === 'degraded' ? 'bg-warning-500/20 text-warning-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {service.status === 'healthy' ? 'Healthy' :
                         service.status === 'degraded' ? 'Degraded' : 'Maintenance'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold text-white">Sikkerhed & Audit</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Security Settings */}
              <div className="card-glass">
                <h3 className="text-lg font-semibold text-white mb-4">Sikkerhedsindstillinger</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">2FA Påkrævet</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Session Timeout</span>
                    <select className="input-glass w-24">
                      <option>30m</option>
                      <option>1h</option>
                      <option>2h</option>
                      <option>8h</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Audit Logging</span>
                    <span className="text-success-400">Aktiveret</span>
                  </div>
                </div>
              </div>

              {/* Recent Security Events */}
              <div className="card-glass">
                <h3 className="text-lg font-semibold text-white mb-4">Seneste Sikkerhed Events</h3>
                
                <div className="space-y-3">
                  {[
                    { event: 'Failed login attempt', severity: 'warning', time: '15 min' },
                    { event: 'Password changed', severity: 'info', time: '2 timer' },
                    { event: 'Admin access granted', severity: 'info', time: '4 timer' },
                    { event: 'Suspicious activity blocked', severity: 'danger', time: '1 dag' }
                  ].map((event, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-slate-800/50 rounded">
                      <div className={`w-2 h-2 rounded-full ${
                        event.severity === 'danger' ? 'bg-danger-400' :
                        event.severity === 'warning' ? 'bg-warning-400' :
                        'bg-primary-400'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm text-white">{event.event}</p>
                        <p className="text-xs text-slate-400">{event.time} siden</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
