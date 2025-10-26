import { Suspense } from 'react'
import DashboardOverview from '@/components/dashboard/DashboardOverview'
import LeadMetrics from '@/components/dashboard/LeadMetrics'
import RecentLeads from '@/components/dashboard/RecentLeads'
import QualificationChart from '@/components/dashboard/QualificationChart'
import SLAStatusWidget from '@/components/dashboard/SLAStatusWidget'
import LoadingSkeleton from '@/components/LoadingSkeleton'

interface DashboardPageProps {
  params: Promise<{ tenant: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { tenant } = await params

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Overview Stats */}
      <Suspense fallback={<LoadingSkeleton className="h-32" />}>
        <DashboardOverview tenant={tenant} />
      </Suspense>

      {/* Main Grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column - Charts & Analytics */}
        <div className="lg:col-span-8 space-y-6">
          {/* Lead Metrics Chart */}
          <Suspense fallback={<LoadingSkeleton className="h-80" />}>
            <LeadMetrics tenant={tenant} />
          </Suspense>

          {/* Qualification Distribution */}
          <Suspense fallback={<LoadingSkeleton className="h-64" />}>
            <QualificationChart tenant={tenant} />
          </Suspense>
        </div>

        {/* Right Column - Recent Activity */}
        <div className="lg:col-span-4 space-y-6">
          {/* SLA Status */}
          <Suspense fallback={<LoadingSkeleton className="h-48" />}>
            <SLAStatusWidget tenant={tenant} />
          </Suspense>

          {/* Recent Leads */}
          <Suspense fallback={<LoadingSkeleton className="h-96" />}>
            <RecentLeads tenant={tenant} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
