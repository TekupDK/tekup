import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Settings, User, Shield, Bell, Palette, Database, Zap, ExternalLink, Save } from 'lucide-react'

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile')

  const sections = [
    { id: 'profile', label: 'Profil', icon: <User className="w-4 h-4" /> },
    { id: 'security', label: 'Sikkerhed', icon: <Shield className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifikationer', icon: <Bell className="w-4 h-4" /> },
    { id: 'appearance', label: 'Udseende', icon: <Palette className="w-4 h-4" /> },
    { id: 'integrations', label: 'Integrationer', icon: <Database className="w-4 h-4" /> },
    { id: 'ai-services', label: 'AI Services', icon: <Zap className="w-4 h-4" /> }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary-400" />
            Indstillinger
          </h1>
          <p className="text-slate-400 mt-2">
            Administrer din profil og platform indstillinger
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="card-glass p-4">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeSection === section.id
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    {section.icon}
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="card-glass p-6">
              {/* Profile Settings */}
              {activeSection === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-white mb-6">Profil Indstillinger</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Fulde Navn
                      </label>
                      <input 
                        type="text" 
                        className="input-glass w-full" 
                        defaultValue="TekUp Administrator"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email
                      </label>
                      <input 
                        type="email" 
                        className="input-glass w-full" 
                        defaultValue="admin@tekup.dk"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Telefon
                      </label>
                      <input 
                        type="tel" 
                        className="input-glass w-full" 
                        placeholder="+45 12 34 56 78"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Tidzone
                      </label>
                      <select className="input-glass w-full">
                        <option>Europe/Copenhagen (CET)</option>
                        <option>Europe/London (GMT)</option>
                        <option>America/New_York (EST)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Bio
                    </label>
                    <textarea 
                      className="input-glass w-full h-24 resize-none" 
                      placeholder="Fortæl lidt om dig selv..."
                    />
                  </div>
                  
                  <button className="btn-primary">
                    <Save className="w-4 h-4 mr-2" />
                    Gem Ændringer
                  </button>
                </motion.div>
              )}

              {/* Security Settings */}
              {activeSection === 'security' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-white mb-6">Sikkerhed</h2>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <h3 className="font-medium text-white mb-2">Skift Adgangskode</h3>
                      <p className="text-sm text-slate-400 mb-4">Opdater din adgangskode regelmæssigt for bedre sikkerhed</p>
                      
                      <div className="space-y-3">
                        <input 
                          type="password" 
                          className="input-glass w-full" 
                          placeholder="Nuværende adgangskode"
                        />
                        <input 
                          type="password" 
                          className="input-glass w-full" 
                          placeholder="Ny adgangskode"
                        />
                        <input 
                          type="password" 
                          className="input-glass w-full" 
                          placeholder="Bekræft ny adgangskode"
                        />
                        <button className="btn-primary">Opdater Adgangskode</button>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <h3 className="font-medium text-white mb-2">To-Faktor Autentificering</h3>
                      <p className="text-sm text-slate-400 mb-4">Tilføj et ekstra lag af sikkerhed til din konto</p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">2FA Status</span>
                        <span className="px-3 py-1 bg-warning-500/20 text-warning-400 rounded-md text-sm">
                          Ikke aktiveret
                        </span>
                      </div>
                      
                      <button className="btn-secondary mt-3">Aktivér 2FA</button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* AI Services Settings */}
              {activeSection === 'ai-services' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-white mb-6">AI Services Konfiguration</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[
                      { name: 'AI Proposal Engine', enabled: true, quota: '245/1000' },
                      { name: 'Content Generator', enabled: true, quota: '156/800' },
                      { name: 'Customer Support', enabled: false, quota: '89/500' },
                      { name: 'Enhanced CRM', enabled: true, quota: '312/800' },
                      { name: 'Marketing Automation', enabled: true, quota: '178/600' },
                      { name: 'Analytics Platform', enabled: false, quota: '0/300' }
                    ].map((service, index) => (
                      <div key={index} className="p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-white">{service.name}</h3>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              defaultChecked={service.enabled}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                          </label>
                        </div>
                        
                        <div className="text-sm text-slate-400 mb-2">Månedlig usage: {service.quota}</div>
                        
                        <div className="w-full bg-slate-700 rounded-full h-1">
                          <div 
                            className="h-1 bg-primary-500 rounded-full" 
                            style={{ width: `${(parseInt(service.quota.split('/')[0]) / parseInt(service.quota.split('/')[1])) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Integrations */}
              {activeSection === 'integrations' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold text-white mb-6">Integrationer</h2>
                  
                  <div className="space-y-4">
                    {[
                      { name: 'Google Workspace', status: 'Connected', icon: '🔗' },
                      { name: 'Microsoft 365', status: 'Not Connected', icon: '⭕' },
                      { name: 'Slack', status: 'Connected', icon: '🔗' },
                      { name: 'Zapier', status: 'Connected', icon: '🔗' },
                      { name: 'HubSpot', status: 'Not Connected', icon: '⭕' },
                      { name: 'Salesforce', status: 'Not Connected', icon: '⭕' }
                    ].map((integration, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{integration.icon}</span>
                          <div>
                            <h3 className="font-medium text-white">{integration.name}</h3>
                            <p className="text-sm text-slate-400">
                              Status: <span className={`${
                                integration.status === 'Connected' ? 'text-success-400' : 'text-slate-400'
                              }`}>{integration.status}</span>
                            </p>
                          </div>
                        </div>
                        
                        <button className={`btn-${integration.status === 'Connected' ? 'secondary' : 'primary'}`}>
                          {integration.status === 'Connected' ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
