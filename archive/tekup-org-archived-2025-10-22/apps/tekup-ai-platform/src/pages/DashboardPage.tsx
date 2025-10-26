import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  Zap, 
  FileText, 
  MessageCircle, 
  Users, 
  TrendingUp, 
  FolderKanban,
  BarChart3, 
  Mic, 
  PieChart,
  Activity,
  Clock,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  Plus,
  Brain,
  Target,
  DollarSign
} from 'lucide-react'

// Hooks
import { useAuth } from '../contexts/AuthContext'
import { useAIServices } from '../contexts/AIServiceContext'

// Components
import ServiceCard from '../components/dashboard/ServiceCard'
import MetricsCard from '../components/dashboard/MetricsCard'
import QuickActionCard from '../components/dashboard/QuickActionCard'
import AIInsightCard from '../components/dashboard/AIInsightCard'

interface DashboardStats {
  totalProposals: number
  activeServices: number
  monthlyUsage: number
  successRate: number
}

const mockStats: DashboardStats = {
  totalProposals: 1247,
  activeServices: 9,
  monthlyUsage: 78,
  successRate: 94.2
}

const quickActions = [
  {
    title: 'Generer AI Forslag',
    description: 'Opret nyt forslag fra sales call',
    icon: <Zap className="w-5 h-5" />,
    href: '/proposal-engine/create',
    color: 'from-primary-500 to-primary-600'
  },
  {
    title: 'Skab Indhold',
    description: 'AI-drevet content generation',
    icon: <FileText className="w-5 h-5" />,
    href: '/content-generator/create',
    color: 'from-accent-500 to-accent-600'
  },
  {
    title: 'Start Marketing Kampagne',
    description: 'Automatiseret kampagne setup',
    icon: <TrendingUp className="w-5 h-5" />,
    href: '/marketing/campaigns/create',
    color: 'from-success-500 to-success-600'
  },
  {
    title: 'Tilføj CRM Kontakt',
    description: 'Registrer ny lead eller kunde',
    icon: <Users className="w-5 h-5" />,
    href: '/crm/contacts/create',
    color: 'from-warning-500 to-warning-600'
  }
]

const aiInsights = [
  {
    title: 'Proposal Conversion Rate',
    value: '+12.3%',
    description: 'Forbedring i de sidste 30 dage takket være AI optimization',
    trend: 'up' as const,
    category: 'performance'
  },
  {
    title: 'Content Engagement',
    value: '94.7%',
    description: 'AI-genereret indhold performer 15% bedre end manuelt indhold',
    trend: 'up' as const,
    category: 'content'
  },
  {
    title: 'Lead Quality Score',
    value: '8.9/10',
    description: 'AI lead scoring har identificeret 23% flere kvalificerede leads',
    trend: 'up' as const,
    category: 'crm'
  },
  {
    title: 'Cost Savings',
    value: 'kr 47.000',
    description: 'Månedlige besparelser gennem AI automation',
    trend: 'up' as const,
    category: 'financial'
  }
]

export default function DashboardPage() {
  const { user } = useAuth()
  const { services, overallHealth, healthyServices, totalServices } = useAIServices()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'God morgen'
    if (hour < 18) return 'God eftermiddag'
    return 'God aften'
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">
              {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-400 mt-2">
              Her er et overblik over dit AI-drevne business økosystem
            </p>
          </div>

          {/* System Status */}
          <div className="flex items-center gap-4 p-4 glass rounded-xl">
            <div className={`flex items-center gap-2 ${
              overallHealth === 'healthy' ? 'text-success-400' :
              overallHealth === 'degraded' ? 'text-warning-400' : 'text-danger-400'
            }`}>
              <Activity className="w-5 h-5" />
              <span className="font-medium">System Status: </span>
              <span className="capitalize">{overallHealth === 'healthy' ? 'Optimal' : overallHealth}</span>
            </div>
            <div className="text-slate-400">
              {healthyServices}/{totalServices} services aktive
            </div>
            <Link 
              to="/analytics/services" 
              className="ml-auto text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
            >
              Se detaljer <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricsCard
            title="AI Forslag Dette År"
            value={mockStats.totalProposals.toLocaleString()}
            change="+15.3%"
            trend="up"
            icon={<Target className="w-6 h-6" />}
            color="primary"
          />
          <MetricsCard
            title="Aktive AI Services"
            value={`${mockStats.activeServices}/11`}
            change="100%"
            trend="neutral"
            icon={<Brain className="w-6 h-6" />}
            color="accent"
          />
          <MetricsCard
            title="Månedlig Usage"
            value={`${mockStats.monthlyUsage}%`}
            change="+8.2%"
            trend="up"
            icon={<Activity className="w-6 h-6" />}
            color="success"
          />
          <MetricsCard
            title="Success Rate"
            value={`${mockStats.successRate}%`}
            change="+2.1%"
            trend="up"
            icon={<CheckCircle className="w-6 h-6" />}
            color="warning"
          />
        </div>

        {/* AI Services Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">AI Services</h2>
            <Link 
              to="/settings/services" 
              className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
            >
              Administrér services <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ServiceCard
              title="AI Proposal Engine"
              description="Generer præcise forslag fra sales calls"
              icon={<Zap className="w-6 h-6" />}
              href="/proposal-engine"
              status="healthy"
              metrics={{ usage: 245, limit: 1000 }}
              color="primary"
            />
            <ServiceCard
              title="Content Generator"
              description="AI-drevet indholdsproduktion"
              icon={<FileText className="w-6 h-6" />}
              href="/content-generator"
              status="healthy"
              metrics={{ usage: 156, limit: 800 }}
              color="accent"
            />
            <ServiceCard
              title="Customer Support"
              description="Intelligent chatbot og ticket system"
              icon={<MessageCircle className="w-6 h-6" />}
              href="/customer-support"
              status="degraded"
              metrics={{ usage: 89, limit: 500 }}
              color="warning"
            />
            <ServiceCard
              title="Enhanced CRM"
              description="AI-forstærket kunde management"
              icon={<Users className="w-6 h-6" />}
              href="/crm"
              status="healthy"
              metrics={{ usage: 312, limit: 800 }}
              color="success"
            />
            <ServiceCard
              title="Marketing Automation"
              description="Automatiserede marketing kampagner"
              icon={<TrendingUp className="w-6 h-6" />}
              href="/marketing"
              status="healthy"
              metrics={{ usage: 178, limit: 600 }}
              color="primary"
            />
            <ServiceCard
              title="Analytics Platform"
              description="Predictive analytics og insights"
              icon={<BarChart3 className="w-6 h-6" />}
              href="/analytics"
              status="loading"
              metrics={{ usage: 0, limit: 300 }}
              color="accent"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-6">Hurtige Handlinger</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={action.title}
                {...action}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">AI Insights</h2>
            <Link 
              to="/analytics/insights" 
              className="text-primary-400 hover:text-primary-300 text-sm flex items-center gap-1"
            >
              Se alle insights <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aiInsights.map((insight, index) => (
              <AIInsightCard
                key={insight.title}
                {...insight}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-2xl font-semibold text-white mb-6">Seneste Aktivitet</h2>
          <div className="glass rounded-xl p-6">
            <div className="space-y-4">
              {[
                {
                  action: 'AI Proposal genereret for Acme Corp',
                  time: '5 min siden',
                  status: 'success',
                  icon: <Zap className="w-4 h-4" />
                },
                {
                  action: 'Blog post publiceret: "AI i moderne business"',
                  time: '23 min siden',
                  status: 'success',
                  icon: <FileText className="w-4 h-4" />
                },
                {
                  action: 'Marketing kampagne startet: Q1 Lead Generation',
                  time: '1 time siden',
                  status: 'success',
                  icon: <TrendingUp className="w-4 h-4" />
                },
                {
                  action: 'CRM kontakt tilføjet: John Doe fra TechStart',
                  time: '2 timer siden',
                  status: 'success',
                  icon: <Users className="w-4 h-4" />
                }
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="p-2 bg-success-500/20 text-success-400 rounded-lg">
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.action}</p>
                    <p className="text-slate-400 text-xs">{activity.time}</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-success-400" />
                </motion.div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Link
                to="/analytics/activity"
                className="text-primary-400 hover:text-primary-300 text-sm flex items-center justify-center gap-1"
              >
                Se al aktivitet <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
