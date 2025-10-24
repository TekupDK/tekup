'use client';

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // In production, call logout API
      toast.success('Du er nu logget ud');
      router.push('/');
    } catch (error) {
      toast.error('Logout fejlede');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">RenOS Dashboard</h1>
          
          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLogout}
              className="text-gray-700 hover:text-gray-900"
              aria-label="Bruger menu"
            >
              <span className="sr-only">Bruger menu</span>
              Menu
            </button>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 font-medium"
              role="menuitem"
            >
              Log ud
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Aktive Jobs</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">12</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Kunder</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">48</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Denne Måned</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">24.500 kr</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hurtige Handlinger</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/jobs"
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
            >
              <h3 className="font-medium text-gray-900">Jobs</h3>
              <p className="text-sm text-gray-500 mt-1">Se og administrer jobs</p>
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
