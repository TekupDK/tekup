import React from 'react'
import { motion } from 'framer-motion'
import { PieChart, TrendingUp, BarChart3, Download, Filter, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function BusinessIntelligenceApp() {
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
              <PieChart className="w-8 h-8 text-warning-400" />
              Business Intelligence
            </h1>
            <p className="text-slate-400 mt-2">
              Avanceret rapportering og data visualization
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-secondary">
              <Filter className="w-4 h-4 mr-2" />
              Filtrér Data
            </button>
            <button className="btn-primary">
              <Download className="w-4 h-4 mr-2" />
              Eksporter Rapport
            </button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              label: 'Total Revenue', 
              value: 'kr 4.8M', 
              change: '+24.5%', 
              icon: <TrendingUp className="w-5 h-5" />,
              color: 'success'
            },
            { 
              label: 'Active Customers', 
              value: '1,847', 
              change: '+12.3%', 
              icon: <BarChart3 className="w-5 h-5" />,
              color: 'primary'
            },
            { 
              label: 'Avg Deal Size', 
              value: 'kr 87K', 
              change: '+8.7%', 
              icon: <PieChart className="w-5 h-5" />,
              color: 'warning'
            },
            { 
              label: 'Market Growth', 
              value: '34.2%', 
              change: '+5.1%', 
              icon: <TrendingUp className="w-5 h-5" />,
              color: 'accent'
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

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="card-glass"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Revenue Breakdown</h2>
            
            <div className="space-y-4">
              {[
                { source: 'AI Proposal Engine', amount: 'kr 1.8M', percentage: 75, color: 'primary' },
                { source: 'Content Generator', amount: 'kr 1.2M', percentage: 50, color: 'accent' },
                { source: 'CRM System', amount: 'kr 0.9M', percentage: 37, color: 'success' },
                { source: 'Marketing Tools', amount: 'kr 0.6M', percentage: 25, color: 'warning' },
                { source: 'Analytics Platform', amount: 'kr 0.3M', percentage: 12, color: 'slate' }
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium">{item.source}</span>
                    <span className="text-white font-semibold">{item.amount}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 bg-gradient-to-r from-${item.color}-500 to-${item.color}-400 rounded-full transition-all duration-1000`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-400">{item.percentage}% af total revenue</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Customer Segments */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="card-glass"
          >
            <h2 className="text-xl font-semibold text-white mb-6">Customer Segments</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                <div className="text-2xl font-bold text-white">67%</div>
                <div className="text-sm text-slate-400">Enterprise</div>
              </div>
              <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                <div className="text-2xl font-bold text-white">33%</div>
                <div className="text-sm text-slate-400">SMB</div>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                { segment: 'Enterprise (500+ employees)', count: 234, value: 'kr 3.2M', growth: '+18%' },
                { segment: 'Mid-market (50-500)', count: 567, value: 'kr 1.2M', growth: '+25%' },
                { segment: 'Small business (<50)', count: 1046, value: 'kr 0.4M', growth: '+12%' }
              ].map((segment, index) => (
                <div key={index} className="p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-sm">{segment.segment}</span>
                    <span className="text-success-400 text-xs">{segment.growth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">{segment.count} kunder</span>
                    <span className="text-white font-semibold">{segment.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Trend Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-glass"
        >
          <h2 className="text-xl font-semibold text-white mb-6">12-Månders Trend Analyse</h2>
          
          <div className="h-64 bg-slate-800/50 rounded-lg flex items-center justify-center mb-6">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">Interactive trend chart kommer her</p>
              <p className="text-sm text-slate-500">Chart.js eller D3.js integration med real-time data</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-lg font-bold text-success-400">+47%</div>
              <div className="text-sm text-slate-400">Revenue Growth</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-primary-400">+23%</div>
              <div className="text-sm text-slate-400">Customer Acquisition</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-warning-400">94.2%</div>
              <div className="text-sm text-slate-400">Customer Retention</div>
            </div>
          </div>
        </motion.div>

        {/* Key Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card-glass"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Key Business Insights</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'Revenue Acceleration',
                insight: 'AI Proposal Engine driver 65% af ny revenue growth med 34% højere close rate',
                impact: 'Høj',
                action: 'Investér mere i AI capabilities'
              },
              {
                title: 'Customer Expansion',
                insight: 'Enterprise kunder har 3.2x højere lifetime value end SMB segmentet',
                impact: 'Medium',
                action: 'Focus på enterprise sales strategy'
              },
              {
                title: 'Product Adoption',
                insight: 'Multi-product kunder har 45% lavere churn rate og 67% højere expansion',
                impact: 'Høj',
                action: 'Utveckla cross-sell programs'
              },
              {
                title: 'Market Opportunity',
                insight: 'Nordisk marked viser 28% YoY growth potential for AI business tools',
                impact: 'Medium',
                action: 'Accelerer nordisk expansion'
              }
            ].map((insight, index) => (
              <div key={index} className="p-4 bg-slate-800/50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-white">{insight.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    insight.impact === 'Høj' ? 'bg-danger-500/20 text-danger-400' :
                    insight.impact === 'Medium' ? 'bg-warning-500/20 text-warning-400' :
                    'bg-success-500/20 text-success-400'
                  }`}>
                    {insight.impact} Impact
                  </span>
                </div>
                <p className="text-slate-300 text-sm mb-3">{insight.insight}</p>
                <div className="text-xs text-primary-400 font-medium">
                  💡 {insight.action}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Development Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-warning-500/10 border border-warning-500/30 rounded-xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-warning-500/20 rounded-lg">
              <ExternalLink className="w-5 h-5 text-warning-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Business Intelligence Platform</h3>
              <p className="text-slate-300 text-sm mb-4">
                BI Platform integrerer med Power BI, Tableau, Looker og andre BI tools for comprehensive business reporting og analytics.
              </p>
              <Link to="/settings/integrations" className="text-warning-400 hover:text-warning-300 text-sm">
                Konfigurer BI integrationer →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
