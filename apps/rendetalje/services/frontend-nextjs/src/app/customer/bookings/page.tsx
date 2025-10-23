'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  MessageCircle, 
  Star, 
  CheckCircle,
  AlertCircle,
  Eye,
  Filter,
  Search
} from 'lucide-react';
import { CustomerMessaging } from '../../../components/customer/CustomerMessaging';
import { CustomerReview } from '../../../components/customer/CustomerReview';
import { CustomerNotifications } from '../../../components/customer/CustomerNotifications';

interface Booking {
  id: string;
  jobNumber: string;
  service: string;
  date: string;
  time: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  address: string;
  teamMembers: string[];
  price: number;
  rating?: number;
  hasReview: boolean;
  canReview: boolean;
}

type ViewMode = 'list' | 'messaging' | 'review';

export default function CustomerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock customer data
  const customer = {
    id: 'cust-1',
    name: 'Lars Nielsen',
    email: 'lars@example.com'
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, statusFilter, searchTerm]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock bookings data
      const mockBookings: Booking[] = [
        {
          id: 'JOB-125',
          jobNumber: 'JOB-125',
          service: 'Standard Boligrengøring',
          date: '2024-01-15',
          time: '14:00',
          status: 'scheduled',
          address: 'Hovedgade 123, 1000 København',
          teamMembers: ['Maria Hansen', 'Peter Andersen'],
          price: 800,
          hasReview: false,
          canReview: false
        },
        {
          id: 'JOB-124',
          jobNumber: 'JOB-124',
          service: 'Dybderengøring',
          date: '2024-01-10',
          time: '10:00',
          status: 'in_progress',
          address: 'Hovedgade 123, 1000 København',
          teamMembers: ['Maria Hansen'],
          price: 1200,
          hasReview: false,
          canReview: false
        },
        {
          id: 'JOB-123',
          jobNumber: 'JOB-123',
          service: 'Standard Boligrengøring',
          date: '2024-01-05',
          time: '10:00',
          status: 'completed',
          address: 'Hovedgade 123, 1000 København',
          teamMembers: ['Maria Hansen', 'Peter Andersen'],
          price: 800,
          rating: 5,
          hasReview: true,
          canReview: false
        },
        {
          id: 'JOB-122',
          jobNumber: 'JOB-122',
          service: 'Standard Boligrengøring',
          date: '2023-12-20',
          time: '14:00',
          status: 'completed',
          address: 'Hovedgade 123, 1000 København',
          teamMembers: ['Anna Larsen'],
          price: 850,
          hasReview: false,
          canReview: true
        },
        {
          id: 'JOB-121',
          jobNumber: 'JOB-121',
          service: 'Vedligeholdelsesrengøring',
          date: '2023-12-10',
          time: '16:00',
          status: 'cancelled',
          address: 'Hovedgade 123, 1000 København',
          teamMembers: [],
          price: 400,
          hasReview: false,
          canReview: false
        }
      ];
      
      setBookings(mockBookings);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.jobNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.teamMembers.some(member => 
          member.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    setFilteredBookings(filtered);
  };

  const handleMessaging = (booking: Booking) => {
    setSelectedBooking(booking);
    setViewMode('messaging');
  };

  const handleReview = (booking: Booking) => {
    setSelectedBooking(booking);
    setViewMode('review');
  };

  const handleReviewSubmit = async (reviewData: any) => {
    console.log('Review submitted:', reviewData);
    
    // Update booking to mark as reviewed
    setBookings(prev => prev.map(booking => 
      booking.id === selectedBooking?.id 
        ? { ...booking, hasReview: true, canReview: false, rating: reviewData.rating }
        : booking
    ));
    
    setViewMode('list');
    setSelectedBooking(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Planlagt';
      case 'confirmed': return 'Bekræftet';
      case 'in_progress': return 'I gang';
      case 'completed': return 'Fuldført';
      case 'cancelled': return 'Aflyst';
      default: return status;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('da-DK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK'
    }).format(amount);
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

  if (viewMode === 'messaging' && selectedBooking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setViewMode('list')}
                  className="p-2 hover:bg-gray-100 rounded-lg mr-4"
                >
                  ←
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Chat - {selectedBooking.jobNumber}</h1>
                  <p className="text-sm text-gray-600">{selectedBooking.service}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <CustomerNotifications customerId={customer.id} />
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {customer.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    <div className="text-xs text-gray-500">Kunde</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-[600px]">
            <CustomerMessaging
              customerId={customer.id}
              jobId={selectedBooking.id}
              teamMembers={selectedBooking.teamMembers.map(name => ({ name }))}
            />
          </div>
        </main>
      </div>
    );
  }

  if (viewMode === 'review' && selectedBooking) {
    return (
      <>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <button
                    onClick={() => setViewMode('list')}
                    className="p-2 hover:bg-gray-100 rounded-lg mr-4"
                  >
                    ←
                  </button>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Vurder service</h1>
                    <p className="text-sm text-gray-600">{selectedBooking.service}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <CustomerNotifications customerId={customer.id} />
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                      <div className="text-xs text-gray-500">Kunde</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>
        </div>

        <CustomerReview
          jobId={selectedBooking.id}
          jobDetails={{
            service: selectedBooking.service,
            date: selectedBooking.date,
            teamMembers: selectedBooking.teamMembers
          }}
          onReviewSubmit={handleReviewSubmit}
          onClose={() => setViewMode('list')}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mine Bookinger</h1>
              <p className="text-sm text-gray-600">Oversigt over dine rengøringsaftaler</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <CustomerNotifications customerId={customer.id} />
              
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {customer.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                  <div className="text-xs text-gray-500">Kunde</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Søg i bookinger..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Alle status</option>
                <option value="scheduled">Planlagt</option>
                <option value="confirmed">Bekræftet</option>
                <option value="in_progress">I gang</option>
                <option value="completed">Fuldført</option>
                <option value="cancelled">Aflyst</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen bookinger fundet</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Prøv at justere dine søgekriterier'
                : 'Du har ingen bookinger endnu'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg border p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.service}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {getStatusText(booking.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(booking.date)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {booking.time}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {booking.address}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="w-4 h-4 mr-2" />
                          {booking.teamMembers.length > 0 
                            ? booking.teamMembers.join(', ')
                            : 'Team ikke tildelt'
                          }
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(booking.price)}
                        </div>
                      </div>

                      {booking.hasReview && booking.rating && (
                        <div className="flex items-center">
                          <div className="flex mr-2">
                            {renderStars(booking.rating)}
                          </div>
                          <span className="text-sm text-gray-600">{booking.rating}/5</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {(booking.status === 'confirmed' || booking.status === 'in_progress') && (
                      <button
                        onClick={() => handleMessaging(booking)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                        title="Chat med team"
                      >
                        <MessageCircle className="w-5 h-5" />
                      </button>
                    )}

                    {booking.canReview && (
                      <button
                        onClick={() => handleReview(booking)}
                        className="text-yellow-600 hover:text-yellow-800 p-2 rounded-lg hover:bg-yellow-50"
                        title="Giv vurdering"
                      >
                        <Star className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      onClick={() => {
                        // View booking details
                        console.log('View booking details:', booking.id);
                      }}
                      className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-50"
                      title="Se detaljer"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}