'use client';

import { useState, useEffect } from 'react';

interface Job {
  id: string;
  calendarEventId: string;
  date: string;
  customerName: string;
  team: 'Jonas+Rawan' | 'FB' | 'Mixed';
  hoursWorked: number;
  revenue: number;
  cost: number;
  profit: number;
  jobType: 'Fast' | 'Flyt' | 'Hoved' | 'Post-reno';
  status: 'planned' | 'completed' | 'invoiced' | 'paid';
  invoiceId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface FBSettlement {
  id: string;
  month: string;
  totalHours: number;
  hourlyRate: number;
  totalAmount: number;
  paid: boolean;
  paidAt?: string;
  jobs: Job[];
  createdAt: string;
}

interface MonthlyStats {
  month: string;
  totalJobs: number;
  totalHours: number;
  fbHours: number;
  ownHours: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  avgHourlyRate: number;
  jobs: Job[];
  fbSettlement?: FBSettlement;
}

// Simple utility function (inline for now)
function formatMonthYear(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('da-DK', { year: 'numeric', month: 'long' });
}

export default function Home() {
  const [stats, setStats] = useState<MonthlyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current month
  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/monthly?month=${currentMonth}`);
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error || 'Failed to fetch statistics');
      }
    } catch (err) {
      setError('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold">Error</div>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                RenOS Time & Revenue Tracker
              </h1>
              <p className="text-gray-600 mt-1">
                {stats ? formatMonthYear(stats.month) : 'Loading...'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchStats}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <span>🔄</span>
                <span>Sync Calendar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-500 text-white">
                    <span>📋</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalHours.toFixed(1)}t</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-500 text-white">
                    <span>⏰</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalRevenue.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-yellow-500 text-white">
                    <span>💰</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Profit</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalProfit.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-500 text-white">
                    <span>📈</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Hourly Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.avgHourlyRate.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-indigo-500 text-white">
                    <span>💵</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">FB Hours</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.fbHours.toFixed(1)}t</p>
                    <p className="text-sm text-gray-500">
                      {((stats.fbHours / stats.totalHours) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-red-500 text-white">
                    <span>👥</span>
                  </div>
                </div>
              </div>
            </div>

            {/* FB Settlement Card */}
            {stats.fbSettlement && (
              <div className="mb-8 bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    FB Rengøring Settlement
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    stats.fbSettlement.paid
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {stats.fbSettlement.paid ? 'Paid' : 'Pending'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.fbSettlement.totalHours.toFixed(1)}t
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Total Hours</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">
                      {stats.fbSettlement.hourlyRate.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Per Hour</div>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {stats.fbSettlement.totalAmount.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Total Payment</div>
                  </div>
                </div>
              </div>
            )}

            {/* Jobs Table */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Jobs
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {stats.jobs.length} jobs in {formatMonthYear(stats.month)}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Revenue
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.jobs.slice(0, 10).map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatMonthYear(job.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {job.customerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.team}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.hoursWorked.toFixed(1)}t
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.revenue.toLocaleString('da-DK', { style: 'currency', currency: 'DKK' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            job.status === 'completed' ? 'text-green-600 bg-green-100' :
                            job.status === 'invoiced' ? 'text-blue-600 bg-blue-100' :
                            'text-yellow-600 bg-yellow-100'
                          }`}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
