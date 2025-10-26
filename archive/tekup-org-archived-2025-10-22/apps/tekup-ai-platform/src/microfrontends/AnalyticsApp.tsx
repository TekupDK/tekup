import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Target, Brain, Calendar, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AnalyticsApp() {
  const [timeRange, setTimeRange] = useState('30d')

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
              <BarChart3 className="w-8 h-8 text-accent-400" />
              AI Analytics Platform
            </h1>
            <p className="text-slate-400 mt-2">
              Predictive analytics og avanceret business intelligence
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input-glass"
            >
              <option value="7d">Sidste 7 dage</option>
              <option value="30d">Sidste 30 dage</option>
              <option value="90d">Sidste 90 dage</option>
              <option value="1y">Sidste år</option>
            </select>
            <button className="btn-primary">
              <Calendar className="w-4 h-4 mr-2" />
              Eksporter Rapport
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              label: 'Total Revenue', 
              value: 'kr 2.4M', 
              change: '+18.2%', 
              icon: <TrendingUp className="w-5 h-5" />,
              color: 'success'
            },
            { 
              label: 'Conversion Rate', 
              value: '24.8%', 
              change: '+3.1%', 
              icon: <Target className="w-5 h-5" />,
              color: 'primary'
            },
            { 
              label: 'AI Efficiency', 
              value: '94.2%', 
              change: '+12.5%', 
              icon: <Brain className="w-5 h-5" />,
              color: 'accent'
            },
            { 
              label: 'Customer LTV', 
              value: 'kr 45.7K', 
              change: '+8.9%', 
              icon: <BarChart3 className="w-5 h-5" />,
              color: 'warning'
            }
          ].map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-glass"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 bg-${metric.color}-500/20 text-${metric.color}-400 rounded-lg`}>
                  {metric.icon}
                </div>
                <span className="text-xs text-success-400 font-medium">{metric.change}</span>
              </div>
              <div className="text-2xl font-bold text-white">{metric.value}</div>
              <div className="text-sm text-slate-400">{metric.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Revenue Chart Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-glass"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Revenue Trend</h2>
          
          <div className="h-64 bg-slate-800/50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">Interactive chart kommer her</p>
              <p className="text-sm text-slate-500">Chart.js eller D3.js integration</p>
            </div>
          </div>
        </motion.div>

        {/* AI Insights & Predictions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Predictions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="card-glass"
          >
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <Brain className="w-5 h-5 text-accent-400" />
              AI Predictions
            </h2>
            
            <div className="space-y-4">
              {[
                {
                  title: 'Next Month Revenue',
                  prediction: 'kr 890K - kr 1.2M',
                  confidence: '94%',
                  trend: 'up',
                  description: 'Baseret på nuværende trends og seasonal patterns'
                },
                {
                  title: 'Churn Risk',
                  prediction: '12 kunder',
                  confidence: '87%',
                  trend: 'warning',
                  description: 'Kunder med høj risiko for at forlade platformen'
                },
                {
                  title: 'Lead Conversion',
                  prediction: '156 nye kunder',
                  confidence: '91%',
                  trend: 'up',
                  description: 'Forventet konvertering fra nuværende pipeline'
                }
              ].map((prediction, index) => (
                <div key={index} className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-white">{prediction.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      prediction.trend === 'up' ? 'bg-success-500/20 text-success-400' :
                      prediction.trend === 'warning' ? 'bg-warning-500/20 text-warning-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {prediction.confidence} sikker
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-accent-400 mb-2">
                    {prediction.prediction}
                  </div>
                  <p className="text-sm text-slate-400">{prediction.description}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Top Performing Channels */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="card-glass"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Top Kanaler</h2>
            
            <div className="space-y-4">
              {[
                { channel: 'AI Proposal Engine', revenue: 'kr 850K', percentage: 85, growth: '+23%' },
                { channel: 'Content Marketing', revenue: 'kr 420K', percentage: 65, growth: '+18%' },
                { channel: 'Email Campaigns', revenue: 'kr 320K', percentage: 45, growth: '+12%' },
                { channel: 'Social Media', revenue: 'kr 180K', percentage: 25, growth: '+8%' }
              ].map((channel, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{channel.channel}</span>
                    <div className="text-right">
                      <div className="text-white font-semibold">{channel.revenue}</div>
                      <div className="text-xs text-success-400">{channel.growth}</div>
                    </div>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="h-2 bg-gradient-to-r from-accent-500 to-accent-400 rounded-full transition-all duration-1000"
                      style={{ width: `${channel.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Development Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-accent-500/10 border border-accent-500/30 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-accent-500/20 rounded-lg">
              <ExternalLink className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Advanced Analytics Integration</h3>
              <p className="text-slate-300 text-sm mb-4">
                Analytics Platform integrerer med Google Analytics, Mixpanel, Amplitude og andre analytics tools for comprehensive data insights.
              </p>
              <Link to="/settings/integrations" className="text-accent-400 hover:text-accent-300 text-sm">
                Konfigurer data sources →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
