'use client';

import React, { useState, useEffect } from 'react';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  User,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Filter,
  Download,
  BarChart3
} from 'lucide-react';
import { Customer, CustomerReview } from '../../types';
import { api } from '../../lib/api';

interface SatisfactionMetrics {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  monthlyTrends: Record<string, { average: number; count: number }>;
  recentReviews: CustomerReview[];
  lowSatisfactionCustomers: Customer[];
  improvementTrend: number;
}

interface CustomerSatisfactionTrackingProps {
  customerId?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

export const CustomerSatisfactionTracking: React.FC<CustomerSatisfactionTrackingProps> = ({
  customerId,
  timeRange = '30d'
}) => {
  const [metrics, setMetrics] = useState<SatisfactionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [showLowSatisfaction, setShowLowSatisfaction] = useState(false);

  useEffect(() => {
    fetchSatisfactionMetrics();
  }, [customerId, timeRange]);

  const fetchSatisfactionMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/customers/satisfaction-metrics', {
        params: { 
          timeRange,
          ...(customerId && { customerId })
        }
      });
      
      setMetrics(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch satisfaction metrics');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${sizeClasses[size]} ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    if (rating >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRatingBgColor = (rating: number) => {
    if (rating >= 4.5) return 'bg-green-50 border-green-200';
    if (rating >= 3.5) return 'bg-yellow-50 border-yellow-200';
    if (rating >= 2.5) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const exportSatisfactionData = () => {
    if (!metrics) return;

    const csvContent = [
      ['Måned', 'Gennemsnitlig Vurdering', 'Antal Anmeldelser'],
      ...Object.entries(metrics.monthlyTrends).map(([month, data]) => [
        month,
        data.average.toFixed(2),
        data.count.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kundetilfredshed_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <Star className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen tilfredshedsdata</h3>
        <p className="mt-1 text-sm text-gray-500">
          Der er endnu ikke indsamlet tilfredshedsdata
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Kundetilfredshed</h3>
          <p className="text-gray-600">Spor og analyser kundetilfredshed over tid</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowLowSatisfaction(!showLowSatisfaction)}
            className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <AlertTriangle className="w-4 h-4" />
            Lav Tilfredshed
          </button>
          <button
            onClick={exportSatisfactionData}
            className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Eksporter
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-lg border-2 p-6 ${getRatingBgColor(metrics.averageRating)}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gennemsnitlig Vurdering</p>
              <div className="flex items-center mt-2">
                <p className={`text-3xl font-bold ${getRatingColor(metrics.averageRating)}`}>
                  {metrics.averageRating.toFixed(1)}
                </p>
                <div className="flex ml-3">
                  {renderStars(Math.round(metrics.averageRating), 'lg')}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              {metrics.improvementTrend > 0 ? (
                <TrendingUp className="w-8 h-8 text-green-500" />
              ) : metrics.improvementTrend < 0 ? (
                <TrendingDown className="w-8 h-8 text-red-500" />
              ) : (
                <BarChart3 className="w-8 h-8 text-gray-500" />
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Baseret på {metrics.totalReviews} anmeldelser
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Anmeldelser</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.totalReviews}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {timeRange === '7d' ? 'Sidste 7 dage' : 
             timeRange === '30d' ? 'Sidste 30 dage' :
             timeRange === '90d' ? 'Sidste 90 dage' : 'Sidste år'}
          </p>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Positive Anmeldelser</p>
              <p className="text-2xl font-bold text-gray-900">
                {((metrics.ratingDistribution[4] + metrics.ratingDistribution[5]) / metrics.totalReviews * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            4-5 stjerner
          </p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="bg-white rounded-lg border p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Vurderingsfordeling</h4>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = metrics.ratingDistribution[rating] || 0;
            const percentage = metrics.totalReviews > 0 ? (count / metrics.totalReviews) * 100 : 0;
            
            return (
              <div 
                key={rating} 
                className={`flex items-center space-x-4 p-2 rounded cursor-pointer transition-colors ${
                  selectedRating === rating ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
              >
                <div className="flex items-center space-x-2 w-20">
                  <span className="text-sm font-medium text-gray-900">{rating}</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                </div>
                <div className="flex-1">
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-yellow-400 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span className="text-sm text-gray-600">
                    {count} ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white rounded-lg border p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Månedlige Trends</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Måned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Gennemsnit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Anmeldelser
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(metrics.monthlyTrends)
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 6)
                .map(([month, data], index, array) => {
                  const prevData = array[index + 1]?.[1];
                  const trend = prevData ? data.average - prevData.average : 0;
                  
                  return (
                    <tr key={month}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {new Date(month + '-01').toLocaleDateString('da-DK', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex mr-2">
                            {renderStars(Math.round(data.average))}
                          </div>
                          <span className="text-sm text-gray-900">
                            {data.average.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {trend !== 0 && (
                          <div className="flex items-center">
                            {trend > 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                            )}
                            <span className={`text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {Math.abs(trend).toFixed(1)}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="bg-white rounded-lg border p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Seneste Anmeldelser</h4>
        <div className="space-y-4">
          {metrics.recentReviews.slice(0, 5).map((review) => (
            <div key={review.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {review.rating}/5
                    </span>
                    <span className="text-sm text-gray-500">
                      Job #{review.jobs?.job_number}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  {formatDate(review.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Low Satisfaction Alert */}
      {showLowSatisfaction && metrics.lowSatisfactionCustomers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <h4 className="text-lg font-medium text-red-900">
                Kunder med Lav Tilfredshed
              </h4>
            </div>
            <button
              onClick={() => setShowLowSatisfaction(false)}
              className="text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
          <p className="text-red-700 mb-4">
            Disse kunder har givet lave vurderinger og bør kontaktes for opfølgning:
          </p>
          <div className="space-y-2">
            {metrics.lowSatisfactionCustomers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between bg-white rounded p-3">
                <div>
                  <span className="font-medium text-gray-900">{customer.name}</span>
                  <span className="text-gray-500 ml-2">
                    Gennemsnit: {customer.satisfaction_score?.toFixed(1)}/5
                  </span>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  Kontakt
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};