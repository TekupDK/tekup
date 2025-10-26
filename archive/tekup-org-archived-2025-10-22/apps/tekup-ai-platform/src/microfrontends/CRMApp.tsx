import React from 'react'
import { motion } from 'framer-motion'
import { Users, TrendingUp, Target, DollarSign, Plus, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CRMApp() {
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
              <Users className="w-8 h-8 text-primary-400" />
              Enhanced CRM
            </h1>
            <p className="text-slate-400 mt-2">
              AI-forstærket customer relationship management
            </p>
          </div>
          <button className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Tilføj Kontakt
          </button>
        </div>

        {/* CRM Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Kontakter', value: '2,847', change: '+12%', icon: <Users className="w-5 h-5" /> },
            { label: 'Aktive Deals', value: '156', change: '+8%', icon: <Target className="w-5 h-5" /> },
            { label: 'Månedlig ARR', value: 'kr 840K', change: '+23%', icon: <DollarSign className="w-5 h-5" /> },
            { label: 'Conversion Rate', value: '24.3%', change: '+5.1%', icon: <TrendingUp className="w-5 h-5" /> }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-glass"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-primary-500/20 text-primary-400 rounded-lg">
                  {stat.icon}
                </div>
                <span className="text-xs text-success-400 font-medium">{stat.change}</span>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Sales Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-glass"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Sales Pipeline</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { stage: 'Leads', count: 127, value: 'kr 1.2M', color: 'slate' },
              { stage: 'Qualified', count: 89, value: 'kr 890K', color: 'primary' },
              { stage: 'Proposal', count: 34, value: 'kr 680K', color: 'accent' },
              { stage: 'Negotiation', count: 12, value: 'kr 480K', color: 'warning' },
              { stage: 'Closed Won', count: 8, value: 'kr 320K', color: 'success' }
            ].map((stage, index) => (
              <motion.div
                key={stage.stage}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={`p-4 bg-${stage.color}-500/10 border border-${stage.color}-500/30 rounded-lg hover:bg-${stage.color}-500/20 transition-colors`}
              >
                <h3 className={`font-semibold text-${stage.color}-400`}>{stage.stage}</h3>
                <div className="mt-2">
                  <div className="text-lg font-bold text-white">{stage.count}</div>
                  <div className="text-sm text-slate-400">{stage.value}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity & Top Contacts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="card-glass"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Seneste Aktivitet</h2>
            
            <div className="space-y-4">
              {[
                {
                  action: 'Deal lukket',
                  contact: 'Acme Corporation',
                  value: 'kr 125.000',
                  time: '2 timer siden',
                  type: 'success'
                },
                {
                  action: 'Nyt lead',
                  contact: 'TechStart ApS',
                  value: 'Kvalificeret',
                  time: '4 timer siden',
                  type: 'primary'
                },
                {
                  action: 'Opfølgning planlagt',
                  contact: 'Digital Solutions',
                  value: 'I morgen',
                  time: '6 timer siden',
                  type: 'warning'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full bg-${activity.type}-400`} />
                    <div>
                      <p className="text-white text-sm font-medium">{activity.action}</p>
                      <p className="text-slate-400 text-xs">{activity.contact}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm">{activity.value}</p>
                    <p className="text-slate-400 text-xs">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Link 
              to="/crm/activity" 
              className="block text-center text-primary-400 hover:text-primary-300 text-sm mt-4"
            >
              Se al aktivitet →
            </Link>
          </motion.div>

          {/* Top Contacts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="card-glass"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Top Kontakter</h2>
            
            <div className="space-y-4">
              {[
                {
                  name: 'Lars Nielsen',
                  company: 'Acme Corporation',
                  score: 95,
                  lastContact: '2 dage siden',
                  value: 'kr 450K'
                },
                {
                  name: 'Maria Jensen',
                  company: 'TechStart ApS',
                  score: 87,
                  lastContact: '1 uge siden',
                  value: 'kr 280K'
                },
                {
                  name: 'Thomas Andersen',
                  company: 'Digital Solutions',
                  score: 82,
                  lastContact: '3 dage siden',
                  value: 'kr 190K'
                }
              ].map((contact, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {contact.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{contact.name}</h3>
                      <p className="text-sm text-slate-400">{contact.company}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-medium text-white">{contact.score}</div>
                      <div className="w-12 h-2 bg-slate-700 rounded-full">
                        <div 
                          className="h-2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                          style={{ width: `${contact.score}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">{contact.lastContact}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Link 
              to="/crm/contacts" 
              className="block text-center text-primary-400 hover:text-primary-300 text-sm mt-4"
            >
              Se alle kontakter →
            </Link>
          </motion.div>
        </div>

        {/* CRM Integration Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <ExternalLink className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">CRM System Integration</h3>
              <p className="text-slate-300 text-sm mb-4">
                Enhanced CRM er fuldt integreret med eksisterende TekUp CRM backend. AI features tilføjer intelligent lead scoring og automatisering.
              </p>
              <div className="flex items-center gap-4">
                <Link to="/crm" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
                  Se eksisterende CRM <ExternalLink className="w-3 h-3" />
                </Link>
                <Link to="/settings/crm" className="text-primary-400 hover:text-primary-300 text-sm">
                  CRM indstillinger
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
