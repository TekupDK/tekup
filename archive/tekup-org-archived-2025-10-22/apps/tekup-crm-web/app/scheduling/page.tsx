'use client';

import { useState } from 'react';
import JobCalendar from '../../components/scheduling/JobCalendar';
import TeamSchedule from '../../components/scheduling/TeamSchedule';
import RouteOptimization from '../../components/scheduling/RouteOptimization';
import RecurringJobsManagement from '../../components/scheduling/RecurringJobsManagement';
import JobAnalyticsDashboard from '../../components/scheduling/JobAnalyticsDashboard';
import QualityControl from '../../components/scheduling/QualityControl';
import InventoryManagement from '../../components/scheduling/InventoryManagement';
import EmployeeScheduling from '../../components/scheduling/EmployeeScheduling';
import CustomerCommunicationHub from '../../components/scheduling/CustomerCommunicationHub';
import { CleaningJob } from '../../lib/types/scheduling';

export default function SchedulingPage() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'team' | 'routes' | 'recurring' | 'analytics' | 'quality' | 'inventory' | 'employees' | 'communication'>('calendar');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Job Scheduling System
        </h1>
        <p className="text-gray-600">
          Komplet rengøringsadministration med danske standarder og funktioner
        </p>

        <div className="mt-6 flex space-x-1 bg-gray-100 rounded-lg p-1 max-w-6xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-shrink-0 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'calendar' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📅 Kalender
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-shrink-0 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'team' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👥 Team
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`flex-shrink-0 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'routes' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🚛 Ruter
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={`flex-shrink-0 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'recurring' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔄 Tilbagevendende
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-shrink-0 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'analytics' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => setActiveTab('quality')}
            className={`flex-shrink-0 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'quality' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ⭐ Kvalitet
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-shrink-0 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'inventory' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📦 Lager
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex-shrink-0 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'employees' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            👨‍💼 Medarbejdere
          </button>
          <button
            onClick={() => setActiveTab('communication')}
            className={`flex-shrink-0 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'communication' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            💬 Kommunikation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="w-full">
          {activeTab === 'calendar' && <JobCalendar />}
          {activeTab === 'team' && <TeamSchedule />}
          {activeTab === 'routes' && <RouteOptimization />}
          {activeTab === 'recurring' && <RecurringJobsManagement />}
          {activeTab === 'analytics' && <JobAnalyticsDashboard />}
          {activeTab === 'quality' && <QualityControl />}
          {activeTab === 'inventory' && <InventoryManagement />}
          {activeTab === 'employees' && <EmployeeScheduling />}
          {activeTab === 'communication' && <CustomerCommunicationHub />}
        </div>
      </div>
    </div>
  );
}
