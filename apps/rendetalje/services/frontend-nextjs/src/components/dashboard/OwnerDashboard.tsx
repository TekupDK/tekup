'use client'

import { useState, useEffect } from 'react'
import { 
  DollarSign, 
  Briefcase, 
  Users, 
  Star,
  TrendingUp,
  Calendar,
  AlertCircle,
  Clock
} from 'lucide-react'
import { KPICard } from './KPICard'
import { RevenueChart } from './RevenueChart'
import { TeamMap } from './TeamMap'
import { NotificationCenter } from './NotificationCenter'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { DashboardKPIs, RevenueData, TeamLocation, Notification } from '@/types'

export function OwnerDashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [teamLocations, setTeamLocations] = useState<TeamLocation[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
    
    // Set up real-time updates (in a real app, this would use WebSocket)
    const interval = setInterval(loadDashboardData, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    try {
      setError(null)
      
      // Load all dashboard data in parallel
      const [kpisData, revenueResponse, locationsData] = await Promise.all([
        apiClient.getDashboardKPIs(),
        apiClient.getRevenueData('30d'),
        apiClient.getTeamLocations(),
      ])

      setKpis(kpisData)
      setRevenueData(revenueResponse)
      setTeamLocations(locationsData)
      
      // Mock notifications for now
      setNotifications([
        {
          id: '1',
          user_id: 'user-1',
          title: 'Nyt job booket',
          message: 'Kunde har booket standardrengøring til i morgen kl. 10:00',
          type: 'info',
          read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: 'user-1',
          title: 'Job færdiggjort',
          message: 'Team har færdiggjort job hos Andersen - 5 stjerner!',
          type: 'success',
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          user_id: 'user-1',
          title: 'Overarbejde advarsel',
          message: 'Maria har arbejdet over 8 timer i dag',
          type: 'warning',
          read: true,
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
      ])
      
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Kunne ikke indlæse dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Fejl</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="btn-primary"
          >
            Prøv igen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">RendetaljeOS</h1>
                <p className="text-sm text-gray-600">Ejer Dashboard</p>
              </div>
              <nav className="hidden md:flex space-x-8">
                <a
                  href="/"
                  className="text-gray-900 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </a>
                <a
                  href="/customers"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Kunder
                </a>
                <a
                  href="/jobs"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Jobs
                </a>
                <a
                  href="/team"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Team
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter
                notifications={notifications}
                onMarkAsRead={handleMarkNotificationAsRead}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                loading={loading}
              />
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">EJ</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Ejer</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard
            title="Total Omsætning"
            value={kpis ? formatCurrency(kpis.total_revenue) : '0 kr'}
            change={kpis?.revenue_change}
            changeLabel="vs. sidste måned"
            icon={DollarSign}
            color="green"
            loading={loading}
          />
          <KPICard
            title="Jobs Færdiggjort"
            value={kpis?.jobs_completed || 0}
            change={kpis?.jobs_change}
            changeLabel="vs. sidste måned"
            icon={Briefcase}
            color="blue"
            loading={loading}
          />
          <KPICard
            title="Team Udnyttelse"
            value={kpis ? `${kpis.team_utilization}%` : '0%'}
            change={kpis?.utilization_change}
            changeLabel="vs. sidste måned"
            icon={Users}
            color="purple"
            loading={loading}
          />
          <KPICard
            title="Kundetilfredshed"
            value={kpis ? `${kpis.customer_satisfaction}/5` : '0/5'}
            change={kpis?.satisfaction_change}
            changeLabel="vs. sidste måned"
            icon={Star}
            color="yellow"
            loading={loading}
          />
        </div>

        {/* Charts and Maps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RevenueChart data={revenueData} loading={loading} />
          <TeamMap locations={teamLocations} loading={loading} />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Aktive Jobs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {kpis?.active_jobs || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">I gang lige nu</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                <Clock className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventende Fakturaer</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {kpis?.pending_invoices || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">Afventer betaling</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dagens Jobs</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {teamLocations.filter(t => t.status === 'busy').length}
                </p>
                <p className="text-sm text-gray-500 mt-1">Planlagt i dag</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 text-green-600">
                <Calendar className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}