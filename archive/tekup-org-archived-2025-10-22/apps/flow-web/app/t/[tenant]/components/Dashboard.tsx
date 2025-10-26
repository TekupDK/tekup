"use client";
import React from 'react';
import { Lead } from '../../../../lib/api';
import { ComplianceDashboard } from './ComplianceDashboard';

interface DashboardProps {
  tenant: string;
  leads: Lead[];
  loading: boolean;
  error?: string;
  onRetry?: () => void;
}

interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  lost: number;
  bySource: Record<string, number>;
}

interface ComplianceStats {
  totalFindings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  slaBreached: number;
  slaApproaching: number;
}

export function Dashboard({ tenant, leads, loading, error }: DashboardProps) {
  // Calculate lead statistics
  const leadStats: LeadStats = React.useMemo(() => {
    if (loading || error || !leads) {
      return { total: 0, new: 0, contacted: 0, qualified: 0, lost: 0, bySource: {} };
    }

    const stats: LeadStats = {
      total: leads.length,
      new: 0,
      contacted: 0,
      qualified: 0,
      lost: 0,
      bySource: {}
    };

    leads.forEach(lead => {
      // Count by status
      switch (lead.status?.toLowerCase()) {
        case 'new':
          stats.new++;
          break;
        case 'contacted':
          stats.contacted++;
          break;
        case 'qualified':
          stats.qualified++;
          break;
        case 'lost':
          stats.lost++;
          break;
      }

      // Count by source
      const source = lead.source || 'unknown';
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;
    });

    return stats;
  }, [leads, loading, error]);

  // Calculate compliance statistics
  const complianceStats: ComplianceStats = React.useMemo(() => {
    if (loading || error || !leads) {
      return {
        totalFindings: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        slaBreached: 0,
        slaApproaching: 0
      };
    }

    const stats: ComplianceStats = {
      totalFindings: 0,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      slaBreached: 0,
      slaApproaching: 0
    };

    const now = new Date();

    leads.forEach(lead => {
      // Check if this is a compliance lead
      if (lead.payload?.compliance_type) {
        stats.totalFindings++;
        
        // Count by severity
        switch (lead.payload.severity?.toLowerCase()) {
          case 'critical':
            stats.critical++;
            break;
          case 'high':
            stats.high++;
            break;
          case 'medium':
            stats.medium++;
            break;
          case 'low':
            stats.low++;
            break;
        }

        // Check SLA status
        if (lead.payload.sla_deadline) {
          const deadline = new Date(lead.payload.sla_deadline);
          
          if (deadline < now) {
            stats.slaBreached++;
          } else {
            // Check if approaching (within 24 hours)
            const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
            if (hoursUntilDeadline <= 24) {
              stats.slaApproaching++;
            }
          }
        }
      }
    });

    return stats;
  }, [leads, loading, error]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-neutral-800 rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-neutral-700 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-neutral-700 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 mb-8">
        <h3 className="text-red-400 font-medium mb-2">Error Loading Dashboard</h3>
        <p className="text-red-300 text-sm mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Lead Overview Stats */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-200 mb-4">Lead Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard 
            title="Total Leads" 
            value={leadStats.total} 
            color="blue" 
          />
          <StatCard 
            title="New" 
            value={leadStats.new} 
            color="yellow" 
          />
          <StatCard 
            title="Contacted" 
            value={leadStats.contacted} 
            color="green" 
          />
          <StatCard 
            title="Qualified" 
            value={leadStats.qualified} 
            color="purple" 
          />
          <StatCard 
            title="Lost" 
            value={leadStats.lost} 
            color="red" 
          />
        </div>
      </div>

      {/* Source Distribution */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-200 mb-4">Lead Sources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(leadStats.bySource).map(([source, count]) => (
            <StatCard 
              key={source}
              title={source.charAt(0).toUpperCase() + source.slice(1)} 
              value={count} 
              color="indigo" 
            />
          ))}
        </div>
      </div>

      {/* Compliance Status (only show if there are compliance findings) */}
      {complianceStats.totalFindings > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-neutral-200 mb-4">Compliance Status</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Findings" 
              value={complianceStats.totalFindings} 
              color="blue" 
            />
            <StatCard 
              title="Critical" 
              value={complianceStats.critical} 
              color="red" 
            />
            <StatCard 
              title="High" 
              value={complianceStats.high} 
              color="orange" 
            />
            <StatCard 
              title="Medium/Low" 
              value={complianceStats.medium + complianceStats.low} 
              color="yellow" 
            />
          </div>
          
          {/* SLA Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <StatCard 
              title="SLA Breached" 
              value={complianceStats.slaBreached} 
              color="red" 
              description={complianceStats.slaBreached > 0 ? "Immediate attention required" : ""}
            />
            <StatCard 
              title="SLA Approaching" 
              value={complianceStats.slaApproaching} 
              color="yellow" 
              description={complianceStats.slaApproaching > 0 ? "Review within 24 hours" : ""}
            />
          </div>
        </div>
      )}

      {/* Full Compliance Dashboard for TekUp tenants */}
      {tenant === 'tekup' && (
        <ComplianceDashboard tenant={tenant} />
      )}

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-200 mb-4">Recent Leads</h2>
        <div className="bg-neutral-800 rounded-lg border border-neutral-700">
          {leads.slice(0, 5).map(lead => (
            <div 
              key={lead.id} 
              className="border-b border-neutral-700 last:border-b-0 p-4 hover:bg-neutral-750 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-neutral-200">
                    {lead.payload?.name || 'Unnamed Lead'}
                  </h3>
                  <p className="text-sm text-neutral-400">
                    {lead.source} • {new Date(lead.created_at || lead.createdAt || '').toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  lead.status === 'NEW' ? 'bg-yellow-900/30 text-yellow-400' :
                  lead.status === 'CONTACTED' ? 'bg-blue-900/30 text-blue-400' :
                  lead.status === 'QUALIFIED' ? 'bg-green-900/30 text-green-400' :
                  'bg-red-900/30 text-red-400'
                }`}>
                  {lead.status}
                </span>
              </div>
              {lead.payload?.email && (
                <p className="text-sm text-neutral-300 mt-1">{lead.payload.email}</p>
              )}
            </div>
          ))}
          
          {leads.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-neutral-400">No leads found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  color: string;
  description?: string;
}

function StatCard({ title, value, color, description }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-900/20 text-blue-400 border-blue-800/50',
    yellow: 'bg-yellow-900/20 text-yellow-400 border-yellow-800/50',
    green: 'bg-green-900/20 text-green-400 border-green-800/50',
    red: 'bg-red-900/20 text-red-400 border-red-800/50',
    purple: 'bg-purple-900/20 text-purple-400 border-purple-800/50',
    orange: 'bg-orange-900/20 text-orange-400 border-orange-800/50',
    indigo: 'bg-indigo-900/20 text-indigo-400 border-indigo-800/50'
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <h3 className="text-sm font-medium text-neutral-400 mb-1">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
      {description && (
        <p className="text-xs text-neutral-400 mt-2">{description}</p>
      )}
    </div>
  );
}