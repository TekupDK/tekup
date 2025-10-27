'use client';

import { useState, useEffect } from 'react';
import type { MonthlyStats } from '../../shared/types';

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
              <CalendarSyncButton onSyncComplete={fetchStats} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && (
          <>
            {/* KPI Cards */}
            <DashboardStats stats={stats} />

            {/* FB Settlement Card */}
            {stats.fbSettlement && (
              <div className="mb-8">
                <FBSettlementCard settlement={stats.fbSettlement} />
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
              <JobsTable jobs={stats.jobs.slice(0, 10)} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
