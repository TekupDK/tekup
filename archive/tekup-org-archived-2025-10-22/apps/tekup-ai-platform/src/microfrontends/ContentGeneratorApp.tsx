import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Sparkles, Share2, Calendar, TrendingUp, Eye, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ContentGeneratorApp() {
  const [activeTab, setActiveTab] = useState('create')

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
              <FileText className="w-8 h-8 text-accent-400" />
              AI Content Generator
            </h1>
            <p className="text-slate-400 mt-2">
              Skab engaging indhold til alle platforme med AI-teknologi
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Calendar className="w-4 h-4 mr-2" />
              Planlæg
            </button>
            <button className="btn-primary">
              <Sparkles className="w-4 h-4 mr-2" />
              Ny kampagne
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-800 rounded-lg w-fit">
          {[
            { id: 'create', label: 'Opret Indhold', icon: <Sparkles className="w-4 h-4" /> },
            { id: 'manage', label: 'Administrér', icon: <FileText className="w-4 h-4" /> },
            { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-accent-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Content Types */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold text-white">Vælg Indholdstype</h2>
              
              <div className="grid grid-cols-1 gap-4">
                {[
                  {
                    type: 'Blog Post',
                    description: 'Detaljerede artikler og tutorials',
                    icon: <FileText className="w-6 h-6" />,
                    color: 'accent',
                    popular: true
                  },
                  {
                    type: 'Social Media',
                    description: 'Posts til LinkedIn, Facebook, Instagram',
                    icon: <Share2 className="w-6 h-6" />,
                    color: 'primary'
                  },
                  {
                    type: 'Email Campaign',
                    description: 'Newsletters og marketing emails',
                    icon: <Calendar className="w-6 h-6" />,
                    color: 'success'
                  },
                  {
                    type: 'Product Description',
                    description: 'SEO-optimerede produktbeskrivelser',
                    icon: <TrendingUp className="w-6 h-6" />,
                    color: 'warning'
                  }
                ].map((contentType, index) => (
                  <motion.button
                    key={contentType.type}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card-glass hover:shadow-xl transition-all duration-300 text-left group relative overflow-hidden"
                  >
                    {contentType.popular && (
                      <div className="absolute top-3 right-3 bg-accent-500 text-white text-xs px-2 py-1 rounded-full">
                        Populær
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className={`p-3 bg-${contentType.color}-500/20 text-${contentType.color}-400 rounded-xl`}>
                        {contentType.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white group-hover:text-accent-300 transition-colors">
                          {contentType.type}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                          {contentType.description}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Quick Create Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="card-glass space-y-6"
            >
              <h2 className="text-xl font-semibold text-white">Hurtig Oprettelse</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Emne/Titel
                  </label>
                  <input 
                    type="text" 
                    className="input-glass w-full" 
                    placeholder="Hvad skal indholdet handle om?"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Målgruppe
                  </label>
                  <select className="input-glass w-full">
                    <option>B2B Decision Makers</option>
                    <option>Tech Enthusiasts</option>
                    <option>Small Business Owners</option>
                    <option>General Consumers</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tone of Voice
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Professional', 'Casual', 'Technical', 'Inspirational'].map((tone) => (
                      <button
                        key={tone}
                        className="btn-glass text-sm py-2"
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nøgleord (SEO)
                  </label>
                  <input 
                    type="text" 
                    className="input-glass w-full" 
                    placeholder="ai, automation, business"
                  />
                </div>
                
                <button className="btn-primary w-full">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generer Indhold
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {activeTab === 'manage' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Indholdsbibliotek</h2>
              <div className="flex items-center gap-3">
                <select className="input-glass">
                  <option>Alle typer</option>
                  <option>Blog Posts</option>
                  <option>Social Media</option>
                  <option>Email Campaigns</option>
                </select>
                <button className="btn-secondary">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: 'AI i Moderne Business',
                  type: 'Blog Post',
                  status: 'Publiceret',
                  engagement: '94.2%',
                  date: '2 dage siden'
                },
                {
                  title: 'TekUp Platform Launch',
                  type: 'Social Media',
                  status: 'Planlagt',
                  engagement: '0%',
                  date: 'I morgen'
                },
                {
                  title: 'Newsletter Q1 2024',
                  type: 'Email Campaign',
                  status: 'Kladde',
                  engagement: '0%',
                  date: '1 uge siden'
                }
              ].map((content, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card-glass hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-white">{content.title}</h3>
                      <p className="text-sm text-slate-400">{content.type}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                        content.status === 'Publiceret' ? 'bg-success-500/20 text-success-400' :
                        content.status === 'Planlagt' ? 'bg-warning-500/20 text-warning-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {content.status}
                      </span>
                      <span className="text-xs text-slate-400">{content.date}</span>
                    </div>
                    
                    <div className="text-sm text-slate-300">
                      Engagement: <span className="text-white font-medium">{content.engagement}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Development Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-accent-500/10 border border-accent-500/30 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-accent-500/20 rounded-lg">
              <ExternalLink className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Micro-Frontend Integration</h3>
              <p className="text-slate-300 text-sm mb-4">
                Content Generator micro-frontend er klar til integration. Dette er en placeholder interface.
              </p>
              <Link to="/settings/integrations" className="text-accent-400 hover:text-accent-300 text-sm">
                Konfigurer integration →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
