import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Mail, Target, BarChart3, Users, Calendar, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function MarketingApp() {
  const [activeView, setActiveView] = useState('campaigns')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full overflow-y-auto"
    >
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-success-400" />
              Marketing Automation
            </h1>
            <p className="text-slate-400 mt-2">
              AI-drevet marketing automation og kampagne management
            </p>
          </div>
          <button className="btn-primary">
            <Target className="w-4 h-4 mr-2" />
            Ny Kampagne
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg w-fit">
          {[
            { id: 'campaigns', label: 'Kampagner', icon: <Target className="w-4 h-4" /> },
            { id: 'automation', label: 'Automation', icon: <TrendingUp className="w-4 h-4" /> },
            { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeView === tab.id
                  ? 'bg-success-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Marketing Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Aktive Kampagner', value: '12', change: '+3', color: 'success' },
            { label: 'Email Open Rate', value: '24.8%', change: '+2.1%', color: 'primary' },
            { label: 'Click-through Rate', value: '3.7%', change: '+0.8%', color: 'accent' },
            { label: 'Conversion Rate', value: '12.3%', change: '+1.5%', color: 'warning' }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-glass text-center"
            >
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
              <div className={`text-xs text-${stat.color}-400 mt-1`}>{stat.change}</div>
            </motion.div>
          ))}
        </div>

        {/* Content based on active view */}
        {activeView === 'campaigns' && (
          <div className="space-y-6">
            {/* Active Campaigns */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-glass"
            >
              <h2 className="text-xl font-semibold text-white mb-6">Aktive Kampagner</h2>
              
              <div className="space-y-4">
                {[
                  {
                    name: 'Q1 Lead Generation',
                    type: 'Email Campaign',
                    status: 'Kører',
                    progress: 67,
                    sent: '2,847',
                    opened: '1,234',
                    clicked: '234',
                    converted: '89'
                  },
                  {
                    name: 'Product Launch 2024',
                    type: 'Multi-channel',
                    status: 'Planlagt',
                    progress: 25,
                    sent: '0',
                    opened: '0',
                    clicked: '0',
                    converted: '0'
                  },
                  {
                    name: 'Customer Retention',
                    type: 'Automation',
                    status: 'Kører',
                    progress: 89,
                    sent: '1,567',
                    opened: '892',
                    clicked: '156',
                    converted: '45'
                  }
                ].map((campaign, index) => (
                  <div key={index} className="p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-white">{campaign.name}</h3>
                        <p className="text-sm text-slate-400">{campaign.type}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-md text-xs font-medium ${
                        campaign.status === 'Kører' ? 'bg-success-500/20 text-success-400' :
                        campaign.status === 'Planlagt' ? 'bg-warning-500/20 text-warning-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{campaign.sent}</div>
                        <div className="text-xs text-slate-400">Sendt</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{campaign.opened}</div>
                        <div className="text-xs text-slate-400">Åbnet</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{campaign.clicked}</div>
                        <div className="text-xs text-slate-400">Klikket</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{campaign.converted}</div>
                        <div className="text-xs text-slate-400">Konverteret</div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className="h-2 bg-gradient-to-r from-success-500 to-success-400 rounded-full transition-all duration-500"
                        style={{ width: `${campaign.progress}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{campaign.progress}% gennemført</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Development Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-success-500/10 border border-success-500/30 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-success-500/20 rounded-lg">
              <ExternalLink className="w-5 h-5 text-success-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Marketing Automation Platform</h3>
              <p className="text-slate-300 text-sm mb-4">
                Marketing Automation micro-frontend integrerer med mailchimp, HubSpot og andre marketing tools.
              </p>
              <Link to="/settings/integrations" className="text-success-400 hover:text-success-300 text-sm">
                Konfigurer integrationer →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
