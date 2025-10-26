/**
 * Security Dashboard Component
 * 
 * Main dashboard showing security compliance scores and scanner status
 * for NIS2, Copilot Readiness, and Backup Monitoring
 */

import React from 'react'

interface SecurityDashboardProps {
  className?: string
}

export function SecurityDashboard({ className = '' }: SecurityDashboardProps) {
  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">TekUp Secure Platform</h1>
        <p className="text-gray-600 mt-2">Security Compliance & AI Readiness Dashboard</p>
      </div>

      {/* Placeholder for security module cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* NIS2 Compliance Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">NIS2 Baseline</h3>
          <div className="text-3xl font-bold text-blue-600 mb-2">--</div>
          <p className="text-sm text-gray-600">Compliance Score</p>
          <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
            Run Scan
          </button>
        </div>

        {/* Copilot Readiness Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Copilot Ready</h3>
          <div className="text-3xl font-bold text-purple-600 mb-2">--</div>
          <p className="text-sm text-gray-600">Readiness Score</p>
          <button className="mt-4 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition-colors">
            Assess Risk
          </button>
        </div>

        {/* Backup Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">M365 Backup</h3>
          <div className="text-3xl font-bold text-green-600 mb-2">--</div>
          <p className="text-sm text-gray-600">System Status</p>
          <button className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
            Check Status
          </button>
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Findings</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No security scans performed yet.</p>
          <p className="text-sm mt-2">Run your first scan to see security findings here.</p>
        </div>
      </div>
    </div>
  )
}

export default SecurityDashboard