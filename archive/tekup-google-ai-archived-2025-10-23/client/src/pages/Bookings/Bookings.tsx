import { useState, useEffect } from 'react';
import { Calendar, Plus, Search, Filter, User, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import BookingModal from '@/components/BookingModal';
import { getStatusBadgeClass } from '@/lib/statusColors';
import { exportToCSV } from '@/lib/csvExport';

interface Booking {
  id: string;
  leadId: string;
  serviceType: string | null;
  startTime: Date;
  endTime: Date;
  status: string;
  notes: string | null;
  lead: {
    name: string | null;
    email: string | null;
    phone: string | null;
    taskType: string | null;
    address: string | null;
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'https://api.renos.dk';

const Bookings = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Helper function to safely get customer name
  const getCustomerName = (booking: Booking): string => {
    const name = booking.lead?.name?.trim();
    const email = booking.lead?.email?.trim();
    if (name) return name;
    if (email) return email;
    return `Ukendt kunde (#${booking.id})`;
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sorting state
  const [sortField, setSortField] = useState<keyof Booking | ''>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    void fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/dashboard/bookings`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json() as Booking[];
      // Safe array check to prevent crashes
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]); // Ensure empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const name = booking.lead?.name || '';
    const email = booking.lead?.email || '';
    const service = booking.serviceType || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || booking.status.toLowerCase() === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Sorting logic
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    // Handle null/undefined
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // Handle dates
    if (sortField === 'startTime' || sortField === 'endTime') {
      const aDate = new Date(aValue as string).getTime();
      const bDate = new Date(bValue as string).getTime();
      return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
    }

    // Handle strings
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    return sortDirection === 'asc'
      ? aStr.localeCompare(bStr, 'da-DK')
      : bStr.localeCompare(aStr, 'da-DK');
  });

  // Pagination calculations
  const totalItems = sortedBookings.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedBookings = sortedBookings.slice(startIndex, endIndex);

  // Reset to page 1 when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, sortField, sortDirection]);

  const handleSort = (field: keyof Booking) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    const exportData = filteredBookings.map(booking => ({
      kunde: getCustomerName(booking),
      serviceType: booking.serviceType || booking.lead?.taskType || 'N/A',
      startTid: new Date(booking.startTime),
      slutTid: new Date(booking.endTime),
      status: booking.status,
      noter: booking.notes || 'N/A'
    }));

    const headers = [
      { key: 'kunde' as const, label: 'Kunde' },
      { key: 'serviceType' as const, label: 'Service Type' },
      { key: 'startTid' as const, label: 'Start Tid' },
      { key: 'slutTid' as const, label: 'Slut Tid' },
      { key: 'status' as const, label: 'Status' },
      { key: 'noter' as const, label: 'Noter' }
    ];

    exportToCSV(exportData, headers, 'bookings');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Indlæser bookinger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="stat-icon-wrapper" style={{ width: '3rem', height: '3rem', background: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }}>
            <Calendar className="w-6 h-6" style={{ color: 'var(--color-info)' }} />
          </div>
          <div>
            <h1 className="text-4xl font-bold" style={{ background: 'linear-gradient(90deg, var(--color-info), var(--color-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Bookinger</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Administrer dine aftaler og bookinger</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="btn-secondary flex items-center gap-2 px-4 py-2 transition-all duration-300 hover:scale-105"
          >
            <Download className="w-5 h-5" />
            Eksporter CSV
          </button>
          <button
            onClick={() => setShowBookingModal(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2 transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Opret Booking
          </button>
        </div>
      </header>

      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Søg efter kunde, email eller service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
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

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="p-4 font-semibold text-muted-foreground uppercase text-xs">Kunde</th>
                <th
                  className="p-4 font-semibold text-muted-foreground uppercase text-xs cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort('serviceType')}
                >
                  <div className="flex items-center gap-2">
                    Service
                    {sortField === 'serviceType' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th
                  className="p-4 font-semibold text-muted-foreground uppercase text-xs cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort('startTime')}
                >
                  <div className="flex items-center gap-2">
                    Dato & Tid
                    {sortField === 'startTime' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th
                  className="p-4 font-semibold text-muted-foreground uppercase text-xs cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {sortField === 'status' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th className="p-4 font-semibold text-muted-foreground uppercase text-xs">Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-glass/30">
                    <td className="p-4"><div className="h-4 bg-muted/50 rounded w-3/4 animate-pulse"></div></td>
                    <td className="p-4"><div className="h-4 bg-muted/50 rounded w-1/2 animate-pulse"></div></td>
                    <td className="p-4"><div className="h-4 bg-muted/50 rounded w-1/2 animate-pulse"></div></td>
                    <td className="p-4"><div className="h-6 bg-muted/50 rounded-full w-24 animate-pulse"></div></td>
                    <td className="p-4"><div className="h-8 bg-muted/50 rounded w-20 animate-pulse"></div></td>
                  </tr>
                ))
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-muted/30">
                        <Calendar className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Ingen bookinger fundet</h3>
                        <p className="text-sm text-muted-foreground">
                          {searchTerm || filterStatus !== 'all'
                            ? 'Prøv at justere dine filtre'
                            : 'Opret din første booking for at komme i gang'}
                        </p>
                      </div>
                      {!searchTerm && filterStatus === 'all' && (
                        <button
                          onClick={() => setShowBookingModal(true)}
                          className="mt-4 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-all duration-300"
                        >
                          <Plus className="w-4 h-4" />
                          Opret Booking
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBookings.map(booking => (
                  <tr key={booking.id} className="border-b border-glass/30 hover:bg-glass/20 transition-all duration-300 group">
                    <td className="p-4">
                      <div className="font-medium text-foreground group-hover:text-primary transition-colors">{getCustomerName(booking)}</div>
                      <div className="text-sm text-muted-foreground">{booking.lead?.email || 'Ingen email'}</div>
                    </td>
                    <td className="p-4 text-foreground">
                      <span className="font-medium">{booking.serviceType || booking.lead.taskType || 'N/A'}</span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm text-foreground font-medium">{new Date(booking.startTime).toLocaleDateString('da-DK')}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(booking.startTime).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })} -
                        {new Date(booking.endTime).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 hover:scale-105"
                        title="Se kunde detaljer"
                      >
                        <User className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalItems > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 glass-card border border-glass/50 rounded-lg">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                Viser {startIndex + 1}-{Math.min(endIndex, totalItems)} af {totalItems} bookinger
              </span>
              <div className="flex items-center gap-2">
                <label htmlFor="pageSize" className="text-xs">Vis:</label>
                <select
                  id="pageSize"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="input-glass rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded glass-card border border-glass/50 hover:bg-glass/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:scale-105"
              >
                Første
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded glass-card border border-glass/50 hover:bg-glass/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:scale-105"
              >
                Forrige
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded text-sm transition-all duration-200 hover:scale-105 ${currentPage === pageNum
                        ? 'bg-primary text-primary-foreground font-semibold shadow-lg'
                        : 'glass-card border border-glass/50 hover:bg-glass/50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded glass-card border border-glass/50 hover:bg-glass/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:scale-105"
              >
                Næste
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded glass-card border border-glass/50 hover:bg-glass/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm hover:scale-105"
              >
                Sidste
              </button>
            </div>
          </div>
        )}
      </div>

      {showBookingModal && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => void fetchBookings()}
        />
      )}
    </div>
  );
};

export default Bookings;
