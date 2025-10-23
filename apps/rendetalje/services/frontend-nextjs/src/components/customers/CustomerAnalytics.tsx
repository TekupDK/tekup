'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Star, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { api } from '../../lib/api';
import { CustomerSegmentation } from './CustomerSegmentation';
import { CustomerSatisfactionTracking } from './CustomerSatisfactionTracking';

interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  averageSatisfaction: number;
  totalRevenue: number;
  averageJobsPerCustomer: number;
  topCities: Array<{ city: string; count: number; revenue: number }>;
  satisfactionDistribution: Record<number, number>;
  monthlyTrends: Record<string, { customers: number; revenue: number; satisfaction: number }>;
  customerSegments: {
    vip: number;
    regular: number;
    new: number;
    inactive: number;
  };
}

export const CustomerAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/customers/analytics', {
        params: { timeRange }
      });
      
      setAnalytics(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen data tilgængelig</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kunde Analytics</h2>
          <p className="text-gray-600">Indsigt i dine kunder og deres adfærd</p>
        </div>
        <div className="flex space-x-2">
          {[
            { value: '7d', label: '7 dage' },
            { value: '30d', label: '30 dage' },
            { value: '90d', label: '90 dage' },
            { value: '1y', label: '1 år' }
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setTimeRange(value as any)}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                timeRange === value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Kunder</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalCustomers}</p>
              <p className="text-sm text-green-600">
                {analytics.activeCustomers} aktive
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Nye Kunder</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.newCustomersThisMonth}</p>
              <p className="text-sm text-gray-500">Denne måned</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Omsætning</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.totalRevenue)}
              </p>
              <p className="text-sm text-gray-500">
                Ø {formatCurrency(analytics.totalRevenue / analytics.totalCustomers)} per kunde
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Star className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tilfredshed</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-gray-900 mr-2">
                  {analytics.averageSatisfaction.toFixed(1)}
                </p>
                <div className="flex">
                  {renderStars(Math.round(analytics.averageSatisfaction))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Segmentation */}
      <CustomerSegmentation />

      {/* Top Cities */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Byer</h3>
        <div className="space-y-4">
          {analytics.topCities.slice(0, 5).map((city, index) => (
            <div key={city.city} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{city.city}</p>
                  <p className="text-sm text-gray-500">{city.count} kunder</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatCurrency(city.revenue)}
                </p>
                <p className="text-sm text-gray-500">
                  Ø {formatCurrency(city.revenue / city.count)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Satisfaction Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tilfredshedsfordeling</h3>
        <div className="space-y-3">
          {Object.entries(analytics.satisfactionDistribution)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([rating, count]) => {
              const percentage = (count / analytics.totalCustomers) * 100;
              return (
                <div key={rating} className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 w-20">
                    <span className="text-sm font-medium text-gray-900">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Customer Satisfaction Tracking */}
      <CustomerSatisfactionTracking timeRange={timeRange} />

      {/* Monthly Trends */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Månedlige Trends</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Måned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nye Kunder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Omsætning
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tilfredshed
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(analytics.monthlyTrends)
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 6)
                .map(([month, data]) => (
                  <tr key={month}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(month + '-01').toLocaleDateString('da-DK', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.customers}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(data.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex mr-2">
                          {renderStars(Math.round(data.satisfaction))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {data.satisfaction.toFixed(1)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};