'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Crown, 
  UserCheck, 
  UserPlus, 
  UserX,
  TrendingUp,
  DollarSign,
  Calendar,
  Star,
  Filter,
  Download
} from 'lucide-react';
import { Customer } from '../../types';
import { api } from '../../lib/api';

interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  count: number;
  totalRevenue: number;
  averageRevenue: number;
  averageSatisfaction: number;
  icon: React.ComponentType<any>;
  color: string;
  customers: Customer[];
}

interface CustomerSegmentationProps {
  onSelectSegment?: (segment: CustomerSegment) => void;
}

export const CustomerSegmentation: React.FC<CustomerSegmentationProps> = ({
  onSelectSegment
}) => {
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomerSegments();
  }, []);

  const fetchCustomerSegments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all customers
      const response = await api.get('/customers', { 
        params: { limit: 1000 } // Get all customers for segmentation
      });
      
      const customers: Customer[] = response.data.data || [];

      // Create segments
      const vipCustomers = customers.filter(c => 
        (c.total_jobs >= 10 || c.total_revenue >= 50000) && c.is_active
      );
      
      const regularCustomers = customers.filter(c => 
        c.total_jobs >= 3 && c.total_jobs < 10 && 
        c.total_revenue < 50000 && c.is_active
      );
      
      const newCustomers = customers.filter(c => 
        c.total_jobs >= 1 && c.total_jobs <= 2 && c.is_active
      );
      
      const inactiveCustomers = customers.filter(c => !c.is_active);

      const calculateSegmentStats = (segmentCustomers: Customer[]) => ({
        count: segmentCustomers.length,
        totalRevenue: segmentCustomers.reduce((sum, c) => sum + (c.total_revenue || 0), 0),
        averageRevenue: segmentCustomers.length > 0 
          ? segmentCustomers.reduce((sum, c) => sum + (c.total_revenue || 0), 0) / segmentCustomers.length 
          : 0,
        averageSatisfaction: segmentCustomers.length > 0
          ? segmentCustomers
              .filter(c => c.satisfaction_score)
              .reduce((sum, c) => sum + (c.satisfaction_score || 0), 0) / 
            segmentCustomers.filter(c => c.satisfaction_score).length || 0
          : 0,
      });

      const segmentData: CustomerSegment[] = [
        {
          id: 'vip',
          name: 'VIP Kunder',
          description: '10+ jobs eller 50k+ omsætning',
          icon: Crown,
          color: 'purple',
          customers: vipCustomers,
          ...calculateSegmentStats(vipCustomers),
        },
        {
          id: 'regular',
          name: 'Almindelige Kunder',
          description: '3-9 jobs, under 50k omsætning',
          icon: UserCheck,
          color: 'blue',
          customers: regularCustomers,
          ...calculateSegmentStats(regularCustomers),
        },
        {
          id: 'new',
          name: 'Nye Kunder',
          description: '1-2 jobs, potentiale for vækst',
          icon: UserPlus,
          color: 'green',
          customers: newCustomers,
          ...calculateSegmentStats(newCustomers),
        },
        {
          id: 'inactive',
          name: 'Inaktive Kunder',
          description: 'Ingen aktive bookings',
          icon: UserX,
          color: 'gray',
          customers: inactiveCustomers,
          ...calculateSegmentStats(inactiveCustomers),
        },
      ];

      setSegments(segmentData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch customer segments');
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

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'purple':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-600',
          border: 'border-purple-200',
          hover: 'hover:bg-purple-100',
        };
      case 'blue':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          border: 'border-blue-200',
          hover: 'hover:bg-blue-100',
        };
      case 'green':
        return {
          bg: 'bg-green-50',
          text: 'text-green-600',
          border: 'border-green-200',
          hover: 'hover:bg-green-100',
        };
      case 'gray':
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-200',
          hover: 'hover:bg-gray-100',
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-200',
          hover: 'hover:bg-gray-100',
        };
    }
  };

  const handleSegmentClick = (segment: CustomerSegment) => {
    setSelectedSegment(selectedSegment === segment.id ? null : segment.id);
    if (onSelectSegment) {
      onSelectSegment(segment);
    }
  };

  const exportSegmentData = (segment: CustomerSegment) => {
    const csvContent = [
      ['Navn', 'Email', 'Telefon', 'By', 'Total Jobs', 'Total Omsætning', 'Tilfredshed'],
      ...segment.customers.map(customer => [
        customer.name,
        customer.email || '',
        customer.phone || '',
        customer.address?.city || '',
        customer.total_jobs.toString(),
        customer.total_revenue.toString(),
        customer.satisfaction_score?.toString() || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${segment.name.toLowerCase().replace(/\s+/g, '_')}_kunder.csv`;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Kunde Segmentering</h3>
          <p className="text-gray-600">Analyser dine kunder baseret på adfærd og værdi</p>
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtre
          </button>
        </div>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {segments.map((segment) => {
          const colors = getColorClasses(segment.color);
          const Icon = segment.icon;
          const isSelected = selectedSegment === segment.id;

          return (
            <div
              key={segment.id}
              onClick={() => handleSegmentClick(segment)}
              className={`
                relative cursor-pointer rounded-lg border-2 p-6 transition-all duration-200
                ${isSelected ? colors.border : 'border-gray-200'}
                ${colors.hover}
              `}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <Icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    exportSegmentData(segment);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  title="Eksporter data"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-gray-900">{segment.name}</h4>
                <p className="text-sm text-gray-600">{segment.description}</p>
                
                <div className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      Kunder
                    </div>
                    <span className="text-lg font-bold text-gray-900">{segment.count}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Total Omsætning
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(segment.totalRevenue)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-600">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Ø per Kunde
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(segment.averageRevenue)}
                    </span>
                  </div>

                  {segment.averageSatisfaction > 0 && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="w-4 h-4 mr-2" />
                        Tilfredshed
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {segment.averageSatisfaction.toFixed(1)}/5
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {isSelected && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-10 rounded-lg pointer-events-none"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Segment Details */}
      {selectedSegment && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              {segments.find(s => s.id === selectedSegment)?.name} - Detaljer
            </h4>
            <button
              onClick={() => setSelectedSegment(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Kunde
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Jobs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Omsætning
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tilfredshed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {segments
                  .find(s => s.id === selectedSegment)
                  ?.customers.slice(0, 10)
                  .map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {customer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {customer.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.total_jobs}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(customer.total_revenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.satisfaction_score 
                          ? `${customer.satisfaction_score.toFixed(1)}/5`
                          : 'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.address?.city}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {segments.find(s => s.id === selectedSegment)?.customers.length > 10 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Viser 10 af {segments.find(s => s.id === selectedSegment)?.customers.length} kunder
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};