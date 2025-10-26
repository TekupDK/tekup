import React, { Suspense, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, ExternalLink, Settings, BarChart3, FileText, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

// Placeholder component while micro-frontend is not yet implemented
export default function ProposalEngineApp() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Simulate loading of remote module
    const timer = setTimeout(() => {
      setIsLoading(false)
      // For now, we'll show the placeholder since micro-frontend isn't ready
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary-500/20 rounded-2xl flex items-center justify-center">
            <Zap className="w-8 h-8 text-primary-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Indlæser AI Proposal Engine</h3>
            <p className="text-slate-400">Vent venligst...</p>
          </div>
          <div className="w-8 h-8 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto bg-danger-500/20 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-danger-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Service ikke tilgængelig</h3>
            <p className="text-slate-400">AI Proposal Engine kunne ikke indlæses. Prøv igen senere.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Prøv igen
          </button>
        </div>
      </div>
    )
  }

  // Placeholder UI for AI Proposal Engine
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
              <Zap className="w-8 h-8 text-primary-400" />
              AI Proposal Engine
            </h1>
            <p className="text-slate-400 mt-2">
              Generer præcise forslag fra sales call transcripts med AI-teknologi
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Settings className="w-4 h-4 mr-2" />
              Indstillinger
            </button>
            <Link to="/proposal-engine/analytics" className="btn-primary">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Forslag genereret', value: '1,247', change: '+12%' },
            { label: 'Success rate', value: '94.2%', change: '+3.1%' },
            { label: 'Gns. confidence', value: '91.7%', change: '+1.8%' },
            { label: 'Denne måned', value: '89', change: '+15%' }
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
              <div className="text-xs text-success-400 mt-1">{stat.change}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create New Proposal */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card-glass space-y-6"
          >
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-400" />
              Opret Nyt Forslag
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Upload Sales Call Transcript
                </label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
                  <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300 mb-2">Træk og slip eller klik for at uploade</p>
                  <p className="text-sm text-slate-400">Understøtter .txt, .pdf, .docx filer</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Kunde navn
                  </label>
                  <input 
                    type="text" 
                    className="input-glass w-full" 
                    placeholder="Acme Corporation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Forslag type
                  </label>
                  <select className="input-glass w-full">
                    <option>Standard proposal</option>
                    <option>Technical proposal</option>
                    <option>Consulting proposal</option>
                  </select>
                </div>
              </div>
              
              <button className="btn-primary w-full">
                <Zap className="w-4 h-4 mr-2" />
                Generer AI Forslag
              </button>
            </div>
          </motion.div>

          {/* Recent Proposals */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="card-glass"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Seneste Forslag</h2>
            
            <div className="space-y-4">
              {[
                { 
                  client: 'Acme Corporation', 
                  status: 'Godkendt', 
                  confidence: '94.2%',
                  date: '2 timer siden',
                  statusColor: 'text-success-400'
                },
                { 
                  client: 'TechStart ApS', 
                  status: 'Under review', 
                  confidence: '91.7%',
                  date: '5 timer siden',
                  statusColor: 'text-warning-400'
                },
                { 
                  client: 'Digital Solutions', 
                  status: 'Sendt', 
                  confidence: '96.1%',
                  date: '1 dag siden',
                  statusColor: 'text-primary-400'
                }
              ].map((proposal, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors">
                  <div>
                    <h3 className="font-medium text-white">{proposal.client}</h3>
                    <p className="text-sm text-slate-400">{proposal.date}</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${proposal.statusColor}`}>
                      {proposal.status}
                    </div>
                    <div className="text-xs text-slate-400">
                      {proposal.confidence} confidence
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <Link 
              to="/proposal-engine/proposals" 
              className="block text-center text-primary-400 hover:text-primary-300 text-sm mt-4"
            >
              Se alle forslag →
            </Link>
          </motion.div>
        </div>

        {/* Development Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-primary-500/20 rounded-lg">
              <ExternalLink className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Micro-Frontend i udvikling</h3>
              <p className="text-slate-300 text-sm mb-4">
                AI Proposal Engine micro-frontend er under udvikling. Denne placeholder viser den kommende funktionalitet.
              </p>
              <div className="flex items-center gap-3">
                <Link to="/ai-proposal-engine-web" className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1">
                  Se eksisterende app <ExternalLink className="w-3 h-3" />
                </Link>
                <span className="text-slate-400 text-sm">•</span>
                <Link to="/settings/integrations" className="text-primary-400 hover:text-primary-300 text-sm">
                  Konfigurer integration
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
