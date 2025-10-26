'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@tekup/sso';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PosInterface } from '@/components/pos/PosInterface';
import { MenuManagement } from '@/components/menu/MenuManagement';
import { ComplianceCenter } from '@/components/compliance/ComplianceCenter';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const { user, loading, signIn } = useAuth();
  const [activeTab, setActiveTab] = useState('pos');

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              FoodTruck OS
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Dansk-godkendt POS og styringssystem til food trucks
            </p>
          </div>
          <button
            onClick={signIn}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Log ind med TekUp SSO
          </button>
        </div>
      </div>
    );
  }

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'pos':
        return <PosInterface />;
      case 'menu':
        return <MenuManagement />;
      case 'compliance':
        return <ComplianceCenter />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <PosInterface />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderActiveComponent()}
    </DashboardLayout>
  );
}
