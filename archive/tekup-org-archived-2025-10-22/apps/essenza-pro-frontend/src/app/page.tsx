'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@tekup/sso';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { BookingInterface } from '@/components/bookings/BookingInterface';
import { ClientManagement } from '@/components/clients/ClientManagement';
import { ServiceManagement } from '@/components/services/ServiceManagement';
import { StaffManagement } from '@/components/staff/StaffManagement';
import { PaymentCenter } from '@/components/payments/PaymentCenter';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const { user, loading, signIn } = useAuth();
  const [activeTab, setActiveTab] = useState('bookings');

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              EssenzaPro
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Dansk skønheds- og wellness platform
            </p>
          </div>
          <button
            onClick={signIn}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
          >
            Log ind med TekUp SSO
          </button>
        </div>
      </div>
    );
  }

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'bookings':
        return <BookingInterface />;
      case 'clients':
        return <ClientManagement />;
      case 'services':
        return <ServiceManagement />;
      case 'staff':
        return <StaffManagement />;
      case 'payments':
        return <PaymentCenter />;
      default:
        return <BookingInterface />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderActiveComponent()}
    </DashboardLayout>
  );
}
