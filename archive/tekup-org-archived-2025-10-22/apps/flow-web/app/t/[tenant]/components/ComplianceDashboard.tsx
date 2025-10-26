"use client";
import React from 'react';

interface ComplianceScore {
  name: string;
  score: number;
  maxScore: number;
  status: 'good' | 'warning' | 'critical';
  lastUpdated: string;
  trend?: 'up' | 'down' | 'stable';
}

interface ComplianceDashboardProps {
  tenant: string;
  complianceScores?: ComplianceScore[];
  loading?: boolean;
  error?: string;
}

export function ComplianceDashboard({ 
  tenant, 
  complianceScores = [],
  loading = false,
  error
}: ComplianceDashboardProps) {
  // Default compliance scores if none provided
  const defaultScores: ComplianceScore[] = [
    {
      name: "NIS2 Compliance",
      score: 75,
      maxScore: 100,
      status: "warning",
      lastUpdated: new Date().toISOString(),
      trend: "up"
    },
    {
      name: "Copilot Readiness",
      score: 92,
      maxScore: 100,
      status: "good",
      lastUpdated: new Date().toISOString(),
      trend: "stable"
    },
    {
      name: "Backup Status",
      score: 88,
      maxScore: 100,
      status: "good",
      lastUpdated: new Date().toISOString(),
      trend: "up"
    }
  ];

  const scores = complianceScores.length > 0 ? complianceScores : defaultScores;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-neutral-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-900/20 border-green-800/50';
      case 'warning': return 'bg-yellow-900/20 border-yellow-800/50';
      case 'critical': return 'bg-red-900/20 border-red-800/50';
      default: return 'bg-neutral-800 border-neutral-700';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return (
        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
      case 'down': return (
        <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      );
      default: return (
        <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      );
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('da-DK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-6">
        <div className="h-6 bg-neutral-700 rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-neutral-700 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-neutral-700 rounded w-2/3 mb-3"></div>
              <div className="h-8 bg-neutral-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-neutral-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
        <h3 className="text-red-400 font-medium mb-2">Error Loading Compliance Data</h3>
        <p className="text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-800 rounded-lg border border-neutral-700 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-neutral-200">Compliance Status</h2>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <span className="text-xs text-neutral-400">Last updated</span>
          <span className="text-xs font-medium text-neutral-300">
            {formatDate(scores[0]?.lastUpdated || new Date().toISOString())}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scores.map((score) => (
          <div 
            key={score.name}
            className={`border rounded-lg p-4 ${getStatusBg(score.status)}`}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-medium text-neutral-200">{score.name}</h3>
              <div className="flex items-center gap-1">
                {getTrendIcon(score.trend)}
              </div>
            </div>
            
            <div className="mb-3">
              <span className={`text-2xl font-bold ${getStatusColor(score.status)}`}>
                {score.score}
              </span>
              <span className="text-neutral-400 text-sm">/{score.maxScore}</span>
            </div>
            
            <div className="w-full bg-neutral-700 rounded-full h-2 mb-2">
              <div 
                className={`h-2 rounded-full ${
                  score.status === 'good' ? 'bg-green-500' :
                  score.status === 'warning' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${(score.score / score.maxScore) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs">
              <span className={`font-medium ${getStatusColor(score.status)}`}>
                {score.status.charAt(0).toUpperCase() + score.status.slice(1)}
              </span>
              <span className="text-neutral-400">
                {Math.round((score.score / score.maxScore) * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Findings Summary */}
      <div className="mt-6 pt-6 border-t border-neutral-700">
        <h3 className="font-medium text-neutral-200 mb-4">Recent Compliance Findings</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-neutral-750 rounded-lg">
            <div>
              <p className="text-sm font-medium text-neutral-200">Critical Security Vulnerability</p>
              <p className="text-xs text-neutral-400">Detected in email server configuration</p>
            </div>
            <span className="px-2 py-1 bg-red-900/30 text-red-400 text-xs rounded font-medium">
              Critical
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-neutral-750 rounded-lg">
            <div>
              <p className="text-sm font-medium text-neutral-200">Backup Configuration Review</p>
              <p className="text-xs text-neutral-400">Weekly backup schedule implemented</p>
            </div>
            <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded font-medium">
              Resolved
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-neutral-750 rounded-lg">
            <div>
              <p className="text-sm font-medium text-neutral-200">NIS2 Policy Update Required</p>
              <p className="text-xs text-neutral-400">New incident response procedures</p>
            </div>
            <span className="px-2 py-1 bg-yellow-900/30 text-yellow-400 text-xs rounded font-medium">
              Pending
            </span>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">
            View all findings →
          </button>
        </div>
      </div>
    </div>
  );
}