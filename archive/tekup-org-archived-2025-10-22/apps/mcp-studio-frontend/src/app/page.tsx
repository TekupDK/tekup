'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@tekup/sso';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProjectsInterface } from '@/components/projects/ProjectsInterface';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { MarketplaceInterface } from '@/components/marketplace/MarketplaceInterface';
import { TestingInterface } from '@/components/testing/TestingInterface';
import { DeploymentCenter } from '@/components/deployment/DeploymentCenter';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const { user, loading, signIn } = useAuth();
  const [activeTab, setActiveTab] = useState('projects');

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              MCP Studio
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Developer tools for MCP server development
            </p>
          </div>
          <button
            onClick={signIn}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
          >
            Log ind med TekUp SSO
          </button>
        </div>
      </div>
    );
  }

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'projects':
        return <ProjectsInterface />;
      case 'editor':
        return <CodeEditor />;
      case 'testing':
        return <TestingInterface />;
      case 'marketplace':
        return <MarketplaceInterface />;
      case 'deployment':
        return <DeploymentCenter />;
      default:
        return <ProjectsInterface />;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderActiveComponent()}
    </DashboardLayout>
  );
}
