import React from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Bot, Users, BarChart3, Clock, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CustomerSupportApp() {
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
            <MessageCircle className="w-8 h-8 text-success-400" />
            AI Customer Support
          </h1>
          <p className="text-slate-400 mt-2">
            Intelligent chatbot og ticket management system
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Aktive Tickets', value: '23', change: '-12%', color: 'warning' },
            { label: 'Response Time', value: '2.3m', change: '-8%', color: 'success' },
            { label: 'Satisfaction', value: '96.7%', change: '+2.1%', color: 'primary' },
            { label: 'AI Resolution', value: '78%', change: '+15%', color: 'accent' }
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

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Chatbot */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card-glass space-y-6"
          >
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-success-400" />
              AI Chat Assistant
            </h2>
            
            <div className="h-80 bg-slate-800/50 rounded-lg p-4 overflow-y-auto">
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-success-500/20 rounded-lg p-3 max-w-xs">
                    <p className="text-sm text-white">
                      Hej! Hvordan kan jeg hjælpe dig i dag?
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3 justify-end">
                  <div className="bg-primary-500/20 rounded-lg p-3 max-w-xs">
                    <p className="text-sm text-white">
                      Jeg har problemer med at logge ind
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-success-500/20 rounded-lg p-3 max-w-xs">
                    <p className="text-sm text-white">
                      Jeg kan hjælpe med login problemer. Prøv venligst at:
                      <br />• Ryd din browser cache
                      <br />• Check din email og password
                      <br />• Prøv "Glemt password" funktionen
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <input 
                type="text" 
                className="input-glass flex-1" 
                placeholder="Skriv din besked..."
              />
              <button className="btn-primary px-4">Send</button>
            </div>
          </motion.div>

          {/* Ticket Management */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="card-glass"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Aktive Tickets</h2>
            
            <div className="space-y-4">
              {[
                {
                  id: '#12847',
                  title: 'Login problemer',
                  customer: 'John Doe',
                  priority: 'Høj',
                  status: 'I gang',
                  time: '15 min',
                  priorityColor: 'danger',
                  statusColor: 'warning'
                },
                {
                  id: '#12846',
                  title: 'Billing spørgsmål',
                  customer: 'Jane Smith',
                  priority: 'Medium',
                  status: 'Venter',
                  time: '1 time',
                  priorityColor: 'warning',
                  statusColor: 'slate'
                },
                {
                  id: '#12845',
                  title: 'Feature request',
                  customer: 'TechCorp',
                  priority: 'Lav',
                  status: 'Eskaleret',
                  time: '2 timer',
                  priorityColor: 'success',
                  statusColor: 'primary'
                }
              ].map((ticket, index) => (
                <div key={ticket.id} className="p-4 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-white">{ticket.title}</h3>
                      <p className="text-sm text-slate-400">{ticket.id} • {ticket.customer}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-${ticket.priorityColor}-500/20 text-${ticket.priorityColor}-400`}>
                        {ticket.priority}
                      </span>
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-xs text-slate-400">{ticket.time}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs font-medium bg-${ticket.statusColor}-500/20 text-${ticket.statusColor}-400`}>
                      {ticket.status}
                    </span>
                    <button className="text-primary-400 hover:text-primary-300 text-xs">
                      Se detaljer →
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <Link 
              to="/customer-support/tickets" 
              className="block text-center text-primary-400 hover:text-primary-300 text-sm mt-4"
            >
              Se alle tickets →
            </Link>
          </motion.div>
        </div>

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
              <h3 className="font-semibold text-white mb-2">Support System Integration</h3>
              <p className="text-slate-300 text-sm mb-4">
                Customer Support micro-frontend er klar til integration med eksisterende helpdesk systemer.
              </p>
              <Link to="/settings/integrations" className="text-success-400 hover:text-success-300 text-sm">
                Konfigurer integration →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
