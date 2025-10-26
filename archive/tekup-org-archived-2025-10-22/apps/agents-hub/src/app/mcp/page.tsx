'use client';

import { MCPDashboard } from '@/components/mcp/mcp-dashboard';

export default function MCPStudioPage() {
  return (
    <main className="min-h-screen bg-neutral-900">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <MCPDashboard />
      </div>
    </main>
  );
}

