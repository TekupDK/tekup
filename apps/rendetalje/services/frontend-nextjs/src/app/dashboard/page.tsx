"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useJobsStore } from "@/store/jobsStore-v2";
import { useCustomersStore } from "@/store/customersStore-v2";
import { LoadingState } from "@/components/ui/Spinner";

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuthStore();
  const {
    jobs,
    isLoading: jobsLoading,
    error: jobsError,
    fetchJobs,
  } = useJobsStore();
  const {
    customers,
    isLoading: customersLoading,
    fetchCustomers,
  } = useCustomersStore();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  // Fetch data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchJobs();
      fetchCustomers();
    }
  }, [isAuthenticated, fetchJobs, fetchCustomers]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Calculate stats
  const activeJobs = jobs.filter((job) => job.status === "in_progress").length;
  const pendingJobs = jobs.filter((job) => job.status === "pending").length;
  const completedJobs = jobs.filter((job) => job.status === "completed").length;
  const totalCustomers = customers.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              RenOS Dashboard
            </h1>
            {user && (
              <p className="text-sm text-gray-500 mt-1">
                Velkommen tilbage, {user.name}
              </p>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Log ud
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingState
          isLoading={jobsLoading || customersLoading}
          error={jobsError}
          loadingMessage="Henter dashboard data..."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Stats Cards */}
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">
                  Aktive Jobs
                </h3>
                <span className="text-2xl">🔨</span>
              </div>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {activeJobs}
              </p>
              <p className="text-xs text-gray-500 mt-1">I gang lige nu</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">
                  Afventende
                </h3>
                <span className="text-2xl">⏱️</span>
              </div>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {pendingJobs}
              </p>
              <p className="text-xs text-gray-500 mt-1">Venter på start</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">
                  Gennemført
                </h3>
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {completedJobs}
              </p>
              <p className="text-xs text-gray-500 mt-1">Denne måned</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">Kunder</h3>
                <span className="text-2xl">👥</span>
              </div>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {totalCustomers}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total antal</p>
            </div>
          </div>
        </LoadingState>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Hurtige Handlinger
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/jobs"
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <h3 className="font-medium text-gray-900">Jobs</h3>
              <p className="text-sm text-gray-500 mt-1">
                Se og administrer jobs
              </p>
            </a>
            <a
              href="/customers"
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <h3 className="font-medium text-gray-900">Kunder</h3>
              <p className="text-sm text-gray-500 mt-1">Administrer kunder</p>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
