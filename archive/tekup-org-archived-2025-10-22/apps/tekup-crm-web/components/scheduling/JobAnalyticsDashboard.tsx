'use client';

import React, { useState, useMemo } from 'react';
import { mockCleaningJobs, mockTeamMembers } from '../../lib/types/mockData';
import { CleaningJob, TeamMember } from '../../lib/types/scheduling';

// Simple SVG icon components
const ChartBarIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CurrencyDollarIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
);

const ClockIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TrendingUpIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const UsersIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const StarIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

// Interface for analytics data
interface AnalyticsData {
  totalRevenue: number;
  monthlyRevenue: number;
  totalJobs: number;
  completedJobs: number;
  averageJobDuration: number;
  customerSatisfaction: number;
  topPerformingTeamMember: TeamMember;
  revenueByJobType: { type: string; revenue: number; count: number }[];
  monthlyTrends: { month: string; revenue: number; jobs: number }[];
  teamPerformance: { member: TeamMember; jobsCompleted: number; avgRating: number; efficiency: number }[];
}

export default function JobAnalyticsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'jobs' | 'efficiency'>('revenue');

  // Calculate analytics data from mock jobs
  const analyticsData: AnalyticsData = useMemo(() => {
    const completedJobs = mockCleaningJobs.filter(job => job.status === 'completed');
    const totalRevenue = completedJobs.reduce((sum, job) => sum + job.cost.total, 0);
    const totalJobs = mockCleaningJobs.length;
    const avgDuration = completedJobs.length > 0 
      ? completedJobs.reduce((sum, job) => sum + job.estimatedDuration, 0) / completedJobs.length 
      : 0;

    // Revenue by job type
    const revenueByType = completedJobs.reduce((acc, job) => {
      const existingType = acc.find(item => item.type === job.jobType);
      if (existingType) {
        existingType.revenue += job.cost.total;
        existingType.count += 1;
      } else {
        acc.push({
          type: job.jobType,
          revenue: job.cost.total,
          count: 1
        });
      }
      return acc;
    }, [] as { type: string; revenue: number; count: number }[]);

    // Team performance
    const teamPerformance = mockTeamMembers.map(member => {
      const memberJobs = completedJobs.filter(job => 
        job.teamMembers.some(tm => tm.id === member.id)
      );
      
      return {
        member,
        jobsCompleted: memberJobs.length,
        avgRating: 4.2 + Math.random() * 0.8, // Mock rating between 4.2-5.0
        efficiency: 85 + Math.random() * 15 // Mock efficiency 85-100%
      };
    });

    // Mock monthly trends
    const monthlyTrends = [
      { month: 'Jan', revenue: 45000, jobs: 28 },
      { month: 'Feb', revenue: 52000, jobs: 32 },
      { month: 'Mar', revenue: 48000, jobs: 30 },
      { month: 'Apr', revenue: 58000, jobs: 36 },
      { month: 'Maj', revenue: 62000, jobs: 38 },
      { month: 'Jun', revenue: 55000, jobs: 34 }
    ];

    const topPerformer = teamPerformance.reduce((best, current) => 
      current.jobsCompleted > best.jobsCompleted ? current : best
    );

    return {
      totalRevenue,
      monthlyRevenue: totalRevenue * 0.8, // Mock monthly portion
      totalJobs,
      completedJobs: completedJobs.length,
      averageJobDuration: avgDuration,
      customerSatisfaction: 4.6,
      topPerformingTeamMember: topPerformer.member,
      revenueByJobType: revenueByType,
      monthlyTrends,
      teamPerformance
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(amount);
  };

  const formatJobType = (type: string) => {
    const typeMap: Record<string, string> = {
      'kontorrenhold': 'Kontorrenhold',
      'privatrenhold': 'Privatrenhold',
      'flytterenhold': 'Flytterenhold',
      'byggerenhold': 'Byggerenhold',
      'vinduespudsning': 'Vinduespudsning',
      'dybrengøring': 'Dybrengøring',
      'tæpperens': 'Tæpperengøring'
    };
    return typeMap[type] || type;
  };

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              Forretningsanalyse og performance metrics for rengøringsvirksomheden
            </p>
          </div>
          
          {/* Period Selector */}
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow">
            {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period === 'week' && 'Uge'}
                {period === 'month' && 'Måned'}
                {period === 'quarter' && 'Kvartal'}
                {period === 'year' && 'År'}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Månedlig omsætning</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatCurrency(analyticsData.monthlyRevenue)}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUpIcon className="h-3 w-3 mr-1" />
                  +12.5% fra sidste måned
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Afsluttede jobs</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analyticsData.completedJobs}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  af {analyticsData.totalJobs} planlagt
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Gennemsnitlig varighed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(analyticsData.averageJobDuration)} min
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  pr. rengøringsjob
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <StarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Kundetilfredshed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analyticsData.customerSatisfaction.toFixed(1)}
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  ⭐⭐⭐⭐⭐ (gennemsnit)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by Job Type */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Omsætning efter jobtype
            </h3>
            <div className="space-y-4">
              {analyticsData.revenueByJobType.map((item, index) => {
                const maxRevenue = Math.max(...analyticsData.revenueByJobType.map(i => i.revenue));
                const percentage = (item.revenue / maxRevenue) * 100;
                
                return (
                  <div key={item.type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        {formatJobType(item.type)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatCurrency(item.revenue)} ({item.count} jobs)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Månedlige tendenser
            </h3>
            <div className="space-y-4">
              {analyticsData.monthlyTrends.map((month, index) => (
                <div key={month.month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{month.month}</p>
                    <p className="text-sm text-gray-500">{month.jobs} jobs</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(month.revenue)}
                    </p>
                    {index > 0 && (
                      <p className="text-xs text-gray-500">
                        {month.revenue > analyticsData.monthlyTrends[index - 1].revenue ? '+' : ''}
                        {Math.round((month.revenue - analyticsData.monthlyTrends[index - 1].revenue) / analyticsData.monthlyTrends[index - 1].revenue * 100)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Team Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {analyticsData.teamPerformance.map((performance) => (
              <div key={performance.member.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {performance.member.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{performance.member.name}</h4>
                    <p className="text-sm text-gray-500">{performance.member.role}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Jobs afsluttet</span>
                    <span className="font-semibold text-gray-900">{performance.jobsCompleted}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Bedømmelse</span>
                    <span className="font-semibold text-yellow-600">
                      {performance.avgRating.toFixed(1)} ⭐
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Effektivitet</span>
                      <span className="font-semibold text-green-600">
                        {Math.round(performance.efficiency)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${performance.efficiency}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performer Highlight */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                🏆 Månedens Medarbejder
              </h3>
              <p className="text-lg font-medium">
                {analyticsData.topPerformingTeamMember.name}
              </p>
              <p className="text-indigo-200">
                {analyticsData.topPerformingTeamMember.role}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">
                {analyticsData.teamPerformance.find(p => p.member.id === analyticsData.topPerformingTeamMember.id)?.jobsCompleted}
              </p>
              <p className="text-indigo-200">jobs gennemført</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}