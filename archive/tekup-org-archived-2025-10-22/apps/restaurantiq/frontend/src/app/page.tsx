import DashboardStats from '@/components/DashboardStats'
import RecentOrders from '@/components/RecentOrders'
import QuickActions from '@/components/QuickActions'

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📊 Restaurant Dashboard
        </h1>
        <p className="text-gray-600">
          Velkommen til RestaurantIQ - Få overblik over din restaurants performance
        </p>
      </div>

      {/* Statistics Cards */}
      <DashboardStats />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentOrders />
        </div>

        {/* Quick Actions - Takes 1 column */}
        <div>
          <QuickActions />
        </div>
      </div>
    </div>
  )
}