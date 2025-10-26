import { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Phone,
  Mail,
  Filter,
  RefreshCw,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { getStatusBadgeClass } from '@/lib/statusColors';
import BookingModal from './BookingModal';
import TimeTracker from './TimeTracker';

interface Booking {
  id: string;
  leadId: string;
  serviceType: string | null;
  startTime: Date;
  endTime: Date;
  estimatedDuration?: number;
  status: string;
  notes: string | null;
  timerStatus?: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  actualDuration?: number;
  timeVariance?: number;
  efficiencyScore?: number;
  calendarEventId?: string;
  calendarLink?: string;
  lead: {
    name: string | null;
    email: string | null;
    phone: string | null;
    taskType: string | null;
    address: string | null;
  };
}

interface CalendarSyncStatus {
  lastSync: Date | null;
  totalEvents: number;
  totalBookings: number;
  syncErrors: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://api.renos.dk';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [syncStatus, setSyncStatus] = useState<CalendarSyncStatus | null>(null);
  const [showSyncStatus, setShowSyncStatus] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    void fetchBookings();
    void fetchSyncStatus();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/dashboard/bookings`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json() as Booking[];

      // Convert date strings to Date objects
      const bookingsWithDates = data.map(booking => ({
        ...booking,
        startTime: new Date(booking.startTime),
        endTime: new Date(booking.endTime)
      }));

      setBookings(bookingsWithDates);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/calendar-sync/status`);
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data.data);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch(`${API_URL}/api/calendar-sync/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncDirection: 'bidirectional',
          maxEvents: 1000
        })
      });

      if (response.ok) {
        await fetchBookings();
        await fetchSyncStatus();
      }
    } catch (error) {
      console.error('Error syncing calendar:', error);
    } finally {
      setSyncing(false);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      if (filterStatus === 'all') return true;
      return booking.status.toLowerCase() === filterStatus;
    });
  }, [bookings, filterStatus]);

  const getBookingsForDate = (date: Date) => {
    return filteredBookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate.toDateString() === date.toDateString();
    });
  };


  const getBookingsForDay = (date: Date) => {
    return filteredBookings.filter(booking => {
      const bookingDate = new Date(booking.startTime);
      return bookingDate.toDateString() === date.toDateString();
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('da-DK', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('da-DK', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    startOfWeek.setDate(diff);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const renderMonthView = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay() + 1); // Monday start

    const dates = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Header */}
        {['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'].map(day => (
          <div key={day} className="p-3 text-center font-semibold text-muted-foreground bg-muted/30 rounded-lg">
            {day}
          </div>
        ))}

        {/* Days */}
        {dates.map((date: Date, index) => {
          const dayBookings = getBookingsForDate(date);
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`
                min-h-[120px] p-2 border border-border rounded-lg transition-all duration-200 hover:bg-muted/20
                ${!isCurrentMonth ? 'opacity-30' : ''}
                ${isToday ? 'bg-primary/10 border-primary/30' : ''}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                  {date.getDate()}
                </span>
                {dayBookings.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {dayBookings.length}
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                {dayBookings.slice(0, 3).map(booking => (
                  <div
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className="text-xs p-1 rounded bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors truncate"
                    title={`${booking.lead.name} - ${booking.serviceType} (${formatTime(booking.startTime)})`}
                  >
                    {formatTime(booking.startTime)} {booking.lead.name}
                  </div>
                ))}
                {dayBookings.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayBookings.length - 3} flere
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);

    return (
      <div className="grid grid-cols-7 gap-4">
        {weekDates.map((date: Date, index) => {
          const dayBookings = getBookingsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div key={index} className="space-y-2">
              <div className={`text-center p-3 rounded-lg ${isToday ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'}`}>
                <div className="font-semibold text-sm">
                  {date.toLocaleDateString('da-DK', { weekday: 'short' })}
                </div>
                <div className={`text-lg ${isToday ? 'text-primary font-bold' : ''}`}>
                  {date.getDate()}
                </div>
              </div>

              <div className="space-y-1 min-h-[200px]">
                {dayBookings.map(booking => (
                  <div
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className="p-2 rounded-lg bg-card border border-border hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="text-xs font-medium text-primary">
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </div>
                    <div className="text-sm font-semibold truncate">
                      {booking.lead.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {booking.serviceType}
                    </div>
                    <Badge
                      className={`text-xs mt-1 ${getStatusBadgeClass(booking.status)}`}
                    >
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayBookings = getBookingsForDay(currentDate);
    const sortedBookings = dayBookings.sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return (
      <div className="space-y-4">
        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <h2 className="text-2xl font-bold">{formatDate(currentDate)}</h2>
          <p className="text-muted-foreground">
            {dayBookings.length} booking{dayBookings.length !== 1 ? 'er' : ''}
          </p>
        </div>

        <div className="space-y-3">
          {sortedBookings.map(booking => (
            <Card
              key={booking.id}
              className="hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => setSelectedBooking(booking)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="font-semibold">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </span>
                      <Badge className={getStatusBadgeClass(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-lg mb-2">{booking.lead.name}</h3>
                    <p className="text-muted-foreground mb-2">{booking.serviceType}</p>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {booking.lead.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {booking.lead.email}
                        </div>
                      )}
                      {booking.lead.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {booking.lead.phone}
                        </div>
                      )}
                      {booking.lead.address && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {booking.lead.address}
                        </div>
                      )}
                    </div>

                    {booking.notes && (
                      <p className="text-sm text-muted-foreground mt-2 italic">
                        "{booking.notes}"
                      </p>
                    )}
                  </div>

                  {booking.calendarLink && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(booking.calendarLink, '_blank');
                      }}
                    >
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      Google
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {dayBookings.length === 0 && (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ingen bookinger i dag</h3>
              <p className="text-muted-foreground mb-4">
                Der er ingen bookinger planlagt for {formatDate(currentDate)}
              </p>
              <Button onClick={() => setShowBookingModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Opret Booking
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSyncStatus = () => {
    if (!syncStatus) return null;

    const timeSinceSync = syncStatus.lastSync
      ? Math.floor((Date.now() - syncStatus.lastSync.getTime()) / (1000 * 60 * 60))
      : null;

    return (
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Kalender Synkronisering
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 mr-2" />
              )}
              {syncing ? 'Synkroniserer...' : 'Synkroniser'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Sidste Sync</div>
              <div className="font-semibold">
                {syncStatus.lastSync
                  ? timeSinceSync === 0
                    ? 'Lige nu'
                    : `${timeSinceSync}t siden`
                  : 'Aldrig'
                }
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Google Events</div>
              <div className="font-semibold">{syncStatus.totalEvents}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Database Bookings</div>
              <div className="font-semibold">{syncStatus.totalBookings}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Sync Fejl</div>
              <div className={`font-semibold ${syncStatus.syncErrors > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {syncStatus.syncErrors}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Indlæser kalender...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
            <CalendarIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Kalender
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Administrer dine bookinger og synkroniser med Google Calendar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSyncStatus(!showSyncStatus)}
          >
            {showSyncStatus ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showSyncStatus ? 'Skjul' : 'Vis'} Sync Status
          </Button>
          <Button onClick={() => setShowBookingModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Opret Booking
          </Button>
        </div>
      </header>

      {/* Sync Status */}
      {showSyncStatus && renderSyncStatus()}

      {/* Controls */}
      <div className="glass-card p-6 rounded-xl shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Måned
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Uge
            </Button>
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Dag
            </Button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(currentDate);
                if (viewMode === 'month') {
                  newDate.setMonth(newDate.getMonth() - 1);
                } else if (viewMode === 'week') {
                  newDate.setDate(newDate.getDate() - 7);
                } else {
                  newDate.setDate(newDate.getDate() - 1);
                }
                setCurrentDate(newDate);
              }}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              I dag
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(currentDate);
                if (viewMode === 'month') {
                  newDate.setMonth(newDate.getMonth() + 1);
                } else if (viewMode === 'week') {
                  newDate.setDate(newDate.getDate() + 7);
                } else {
                  newDate.setDate(newDate.getDate() + 1);
                }
                setCurrentDate(newDate);
              }}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-glass rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
            >
              <option value="all">Alle Status</option>
              <option value="pending">Afventer</option>
              <option value="confirmed">Bekræftet</option>
              <option value="completed">Gennemført</option>
              <option value="cancelled">Annulleret</option>
            </select>
          </div>
        </div>

        {/* Calendar View */}
        <div className="min-h-[600px]">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            void fetchBookings();
            void fetchSyncStatus();
          }}
        />
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Booking Detaljer</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBooking(null)}
                >
                  Luk
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Kunde</label>
                  <p className="font-semibold">{selectedBooking.lead.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Service</label>
                  <p className="font-semibold">{selectedBooking.serviceType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Start Tid</label>
                  <p className="font-semibold">{formatTime(selectedBooking.startTime)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Slut Tid</label>
                  <p className="font-semibold">{formatTime(selectedBooking.endTime)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className={getStatusBadgeClass(selectedBooking.status)}>
                    {selectedBooking.status}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-semibold">{selectedBooking.lead.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telefon</label>
                  <p className="font-semibold">{selectedBooking.lead.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Adresse</label>
                  <p className="font-semibold">{selectedBooking.lead.address || 'N/A'}</p>
                </div>
              </div>

              {/* Time Tracker */}
              {selectedBooking.status === 'confirmed' && (
                <div className="border-t border-border/50 pt-4">
                  <TimeTracker
                    bookingId={selectedBooking.id}
                    estimatedDuration={selectedBooking.estimatedDuration || 120}
                    onComplete={() => {
                      void fetchBookings();
                      setSelectedBooking(null);
                    }}
                  />
                </div>
              )}

              {selectedBooking.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Noter</label>
                  <p className="mt-1 p-3 bg-muted/30 rounded-lg">{selectedBooking.notes}</p>
                </div>
              )}

              {selectedBooking.calendarLink && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => window.open(selectedBooking.calendarLink, '_blank')}
                    className="flex-1"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Åbn i Google Calendar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
