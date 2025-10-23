'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Edit, 
  MessageCircle, 
  Star, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign,
  Clock,
  TrendingUp,
  User,
  FileText,
  Camera,
  Send,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Customer, Job, CustomerReview, CustomerMessage } from '../../types';
import { api } from '../../lib/api';
import { CustomerCommunicationLog } from './CustomerCommunicationLog';

interface CustomerDetailProps {
  customer: Customer;
  onBack: () => void;
  onEdit: (customer: Customer) => void;
}

interface CustomerHistory {
  jobs: Job[];
  reviews: CustomerReview[];
  statistics: {
    total_jobs: number;
    completed_jobs: number;
    total_revenue: number;
    average_rating: number | null;
    last_job_date: string | null;
  };
}

export const CustomerDetail: React.FC<CustomerDetailProps> = ({
  customer,
  onBack,
  onEdit
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'messages' | 'communication' | 'reviews'>('overview');
  const [history, setHistory] = useState<CustomerHistory | null>(null);
  const [messages, setMessages] = useState<CustomerMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'history' && !history) {
      fetchCustomerHistory();
    } else if (activeTab === 'messages' && messages.length === 0) {
      fetchCustomerMessages();
    }
  }, [activeTab]);

  const fetchCustomerHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/customers/${customer.id}/history`);
      setHistory(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch customer history');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/customers/${customer.id}/messages`);
      setMessages(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await api.post('/customers/messages', {
        customer_id: customer.id,
        message: newMessage,
        message_type: 'text'
      });

      setMessages(prev => [response.data, ...prev]);
      setNewMessage('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getJobStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Fuldført';
      case 'in_progress': return 'I gang';
      case 'scheduled': return 'Planlagt';
      case 'cancelled': return 'Aflyst';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600">Kunde detaljer og historik</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('messages')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Send Besked
          </button>
          <button
            onClick={() => onEdit(customer)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            Rediger
          </button>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Kontaktinformation</h3>
            <div className="space-y-2">
              {customer.email && (
                <div className="flex items-center text-sm text-gray-900">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  {customer.email}
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center text-sm text-gray-900">
                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                  {customer.phone}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Adresse</h3>
            <div className="flex items-start text-sm text-gray-900">
              <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
              <div>
                <div>{customer.address.street}</div>
                <div>{customer.address.postal_code} {customer.address.city}</div>
                <div>{customer.address.country}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Statistikker</h3>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-900">
                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                {customer.total_jobs} jobs
              </div>
              <div className="flex items-center text-sm text-gray-900">
                <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                {formatCurrency(customer.total_revenue)}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Tilfredshed</h3>
            {customer.satisfaction_score ? (
              <div className="flex items-center">
                <div className="flex mr-2">
                  {renderStars(Math.round(customer.satisfaction_score))}
                </div>
                <span className="text-sm text-gray-900">
                  {customer.satisfaction_score.toFixed(1)}
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">Ingen vurdering endnu</span>
            )}
          </div>
        </div>

        {customer.preferences && Object.keys(customer.preferences).length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Præferencer</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customer.preferences.preferred_time && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Foretrukken tid:</span>
                  <span className="ml-2 text-sm text-gray-900">{customer.preferences.preferred_time}</span>
                </div>
              )}
              {customer.preferences.contact_method && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Kontaktmetode:</span>
                  <span className="ml-2 text-sm text-gray-900">{customer.preferences.contact_method}</span>
                </div>
              )}
              {customer.preferences.key_location && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Nøgle placering:</span>
                  <span className="ml-2 text-sm text-gray-900">{customer.preferences.key_location}</span>
                </div>
              )}
              {customer.preferences.special_instructions && (
                <div className="md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">Særlige instruktioner:</span>
                  <p className="mt-1 text-sm text-gray-900">{customer.preferences.special_instructions}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {customer.notes && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Interne noter</h3>
            <p className="text-sm text-gray-900">{customer.notes}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Oversigt', icon: User },
            { id: 'history', label: 'Job Historik', icon: Calendar },
            { id: 'messages', label: 'Beskeder', icon: MessageCircle },
            { id: 'communication', label: 'Kommunikation', icon: FileText },
            { id: 'reviews', label: 'Anmeldelser', icon: Star }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Calendar className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-600">Total Jobs</p>
                    <p className="text-2xl font-bold text-blue-900">{customer.total_jobs}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-600">Total Omsætning</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(customer.total_revenue)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-center">
                  <Star className="w-8 h-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-yellow-600">Tilfredshed</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {customer.satisfaction_score ? customer.satisfaction_score.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {history && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Seneste Aktivitet</h3>
                <div className="space-y-4">
                  {history.jobs.slice(0, 3).map((job) => (
                    <div key={job.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <Calendar className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {job.service_type} - #{job.job_number}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(job.scheduled_date)}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getJobStatusColor(job.status)}`}>
                        {getJobStatusText(job.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : history ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">{history.statistics.total_jobs}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600">Fuldførte Jobs</p>
                    <p className="text-2xl font-bold text-gray-900">{history.statistics.completed_jobs}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600">Total Omsætning</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(history.statistics.total_revenue)}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-600">Gennemsnitlig Vurdering</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {history.statistics.average_rating ? history.statistics.average_rating.toFixed(1) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Job Historik</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Job
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Service
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Dato
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Kvalitet
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {history.jobs.map((job) => (
                          <tr key={job.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{job.job_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {job.service_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(job.scheduled_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getJobStatusColor(job.status)}`}>
                                {getJobStatusText(job.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {job.quality_score ? (
                                <div className="flex items-center">
                                  {renderStars(Math.round(job.quality_score))}
                                  <span className="ml-2">{job.quality_score.toFixed(1)}</span>
                                </div>
                              ) : (
                                'N/A'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen job historik</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Denne kunde har endnu ikke haft nogen jobs
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="p-6">
            <div className="space-y-4">
              {/* Message Input */}
              <div className="border rounded-lg p-4">
                <div className="flex space-x-4">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Skriv en besked til kunden..."
                    rows={3}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send
                  </button>
                </div>
              </div>

              {/* Messages List */}
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <MessageCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {message.sender?.name || 'System'}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                        {message.is_read ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-900">{message.message}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen beskeder</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start en samtale med kunden ved at sende den første besked
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'communication' && (
          <div className="p-6">
            <CustomerCommunicationLog customer={customer} />
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="p-6">
            {history?.reviews && history.reviews.length > 0 ? (
              <div className="space-y-6">
                {history.reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="flex">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {review.rating}/5
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Job #{review.jobs?.job_number} - {formatDate(review.created_at)}
                        </p>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm text-gray-900">{review.comment}</p>
                    )}
                    {review.photos && review.photos.length > 0 && (
                      <div className="mt-3 flex space-x-2">
                        {review.photos.map((photo, index) => (
                          <div key={index} className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Camera className="w-6 h-6 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Star className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen anmeldelser</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Kunden har endnu ikke givet nogen anmeldelser
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};