import { useState, useEffect } from 'react';
import { Users, Plus, Search, Filter, Phone, Mail, MapPin, Edit2, X, Trash2, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { exportToCSV } from '@/lib/csvExport';
import { API_CONFIG } from '@/config/api';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: 'active' | 'inactive';
  totalLeads: number;
  totalBookings: number;
  totalRevenue: number;
  lastContactAt: Date | null;
}

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<keyof Customer | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    companyName: '',
    notes: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    void fetchCustomers();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Navn er påkrævet';
    }

    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = 'Ugyldig email-adresse';
      }
    }

    if (formData.phone) {
      const phoneRegex = /^(\+45\s?)?(\d{2}\s?\d{2}\s?\d{2}\s?\d{2}|\d{8})$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        errors.phone = 'Ugyldig telefonnummer (brug format: +45 12 34 56 78)';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/dashboard/customers`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json() as Customer[];
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedCustomers = sortField
    ? [...filteredCustomers].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue), 'da-DK');
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    })
    : filteredCustomers;

  const handleSort = (field: keyof Customer) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleExportCSV = () => {
    const exportData = sortedCustomers.map(customer => ({
      navn: customer.name,
      email: customer.email || '',
      telefon: customer.phone || '',
      adresse: customer.address || '',
      status: customer.status === 'active' ? 'Aktiv' : 'Inaktiv',
      antalLeads: customer.totalLeads.toString(),
      antalBookinger: customer.totalBookings.toString(),
      omsætning: `${customer.totalRevenue.toLocaleString('da-DK')} kr.`,
      sidsteKontakt: customer.lastContactAt
        ? new Date(customer.lastContactAt).toLocaleString('da-DK')
        : 'Ingen kontakt'
    }));

    const headers = [
      { key: 'navn' as const, label: 'Navn' },
      { key: 'email' as const, label: 'Email' },
      { key: 'telefon' as const, label: 'Telefon' },
      { key: 'adresse' as const, label: 'Adresse' },
      { key: 'status' as const, label: 'Status' },
      { key: 'antalLeads' as const, label: 'Antal Leads' },
      { key: 'antalBookinger' as const, label: 'Antal Bookinger' },
      { key: 'omsætning' as const, label: 'Omsætning' },
      { key: 'sidsteKontakt' as const, label: 'Sidste Kontakt' }
    ];

    exportToCSV(exportData, headers, 'kunder');
  };

  const handleCreateCustomer = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Ret venligst fejlene i formularen', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast('Kunde oprettet!', 'success');
        setShowCreateModal(false);
        setValidationErrors({});
        setFormData({
          name: '',
          email: '',
          phone: '',
          address: '',
          companyName: '',
          notes: '',
          status: 'active'
        });
        void fetchCustomers();
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Kunne ikke oprette kunde', 'error');
      }
    } catch (error) {
      console.error('Error creating customer:', error);
      showToast('Netværksfejl - prøv igen', 'error');
    }
  };

  const handleEditCustomer = async () => {
    if (!editingCustomer) return;

    if (!validateForm()) {
      showToast('Ret venligst fejlene i formularen', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showToast('Kunde opdateret!', 'success');
        setShowEditModal(false);
        setEditingCustomer(null);
        setValidationErrors({});
        void fetchCustomers();
      } else {
        const errorData = await response.json();
        showToast(errorData.error || 'Kunne ikke opdatere kunde', 'error');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      showToast('Netværksfejl - prøv igen', 'error');
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/customers/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete customer');

      showToast('Kunde slettet', 'success');
      void fetchCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      showToast('Kunne ikke slette kunde', 'error');
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      companyName: '',
      notes: '',
      status: customer.status
    });
    setShowEditModal(true);
  };

  const CreateCustomerModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass rounded-xl p-6 border w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Tilføj Kunde</h2>
          <button
            onClick={() => setShowCreateModal(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleCreateCustomer(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Navn *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 input-glass rounded-lg focus:outline-none focus:ring-2 ${validationErrors.name ? 'ring-2 ring-destructive' : 'focus:ring-primary'}`}
              placeholder="Indtast kundens navn"
              required
            />
            {validationErrors.name && (
              <p className="text-destructive text-sm mt-1">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3 py-2 input-glass rounded-lg focus:outline-none focus:ring-2 ${validationErrors.email ? 'ring-2 ring-destructive' : 'focus:ring-primary'}`}
              placeholder="kunde@example.com"
            />
            {validationErrors.email && (
              <p className="text-destructive text-sm mt-1">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Telefon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`w-full px-3 py-2 input-glass rounded-lg focus:outline-none focus:ring-2 ${validationErrors.phone ? 'ring-2 ring-destructive' : 'focus:ring-primary'}`}
              placeholder="+45 12 34 56 78"
            />
            {validationErrors.phone && (
              <p className="text-destructive text-sm mt-1">{validationErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Adresse
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Gadenavn 123, 2000 By"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="flex-1 px-4 py-2 text-muted-foreground hover:text-foreground"
            >
              Annuller
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Opret Kunde
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const EditCustomerModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="glass rounded-xl p-6 border w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Rediger Kunde</h2>
          <button
            onClick={() => setShowEditModal(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleUpdateCustomer(e)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Navn *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 input-glass rounded-lg focus:outline-none focus:ring-2 ${validationErrors.name ? 'ring-2 ring-destructive' : 'focus:ring-primary'}`}
              placeholder="Indtast kundens navn"
              required
            />
            {validationErrors.name && (
              <p className="text-destructive text-sm mt-1">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3 py-2 input-glass rounded-lg focus:outline-none focus:ring-2 ${validationErrors.email ? 'ring-2 ring-destructive' : 'focus:ring-primary'}`}
              placeholder="kunde@example.com"
            />
            {validationErrors.email && (
              <p className="text-destructive text-sm mt-1">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Telefon
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`w-full px-3 py-2 input-glass rounded-lg focus:outline-none focus:ring-2 ${validationErrors.phone ? 'ring-2 ring-destructive' : 'focus:ring-primary'}`}
              placeholder="+45 12 34 56 78"
            />
            {validationErrors.phone && (
              <p className="text-destructive text-sm mt-1">{validationErrors.phone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Adresse
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Gadenavn 123, 2000 By"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-3 py-2 input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="active">Aktiv</option>
              <option value="inactive">Inaktiv</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="flex-1 px-4 py-2 text-muted-foreground hover:text-foreground"
            >
              Annuller
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Gem Ændringer
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="stat-icon-wrapper" style={{ width: '3rem', height: '3rem' }}>
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-4xl font-bold dashboard-title">
              Kunder
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Administrer dine kunder og deres data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="btn-premium btn-premium-secondary flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Eksporter CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-premium btn-premium-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Tilføj Kunde
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Søg efter navn, email eller telefon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field w-full pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-field px-3 py-2"
            >
              <option value="all">Alle statuser</option>
              <option value="active">Aktive</option>
              <option value="inactive">Inaktive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="stats-card-premium rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-premium">
            <thead>
              <tr className="glass-card border-b border-glass/50">
                <th
                  className="p-4 font-semibold text-muted-foreground uppercase text-xs tracking-wide cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Navn
                    {sortField === 'name' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 opacity-30" />
                    )}
                  </div>
                </th>
                <th className="p-4 font-semibold text-muted-foreground uppercase text-xs tracking-wide">Kontakt</th>
                <th
                  className="p-4 font-semibold text-muted-foreground uppercase text-xs tracking-wide cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('totalLeads')}
                >
                  <div className="flex items-center gap-2">
                    Statistik
                    {sortField === 'totalLeads' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 opacity-30" />
                    )}
                  </div>
                </th>
                <th
                  className="p-4 font-semibold text-muted-foreground uppercase text-xs tracking-wide cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {sortField === 'status' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                    ) : (
                      <ArrowUpDown className="w-4 h-4 opacity-30" />
                    )}
                  </div>
                </th>
                <th className="p-4 font-semibold text-muted-foreground uppercase text-xs tracking-wide">Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-glass/30">
                    <td className="p-4"><div className="h-4 loading-shimmer rounded w-3/4"></div></td>
                    <td className="p-4"><div className="h-4 loading-shimmer rounded w-1/2"></div></td>
                    <td className="p-4"><div className="h-4 loading-shimmer rounded w-1/2"></div></td>
                    <td className="p-4"><div className="h-6 loading-shimmer rounded-full w-24"></div></td>
                    <td className="p-4"><div className="h-8 loading-shimmer rounded w-20"></div></td>
                  </tr>
                ))
              ) : sortedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-muted/30">
                        <Users className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {searchTerm || filterStatus !== 'all'
                            ? 'Ingen kunder fundet'
                            : 'Ingen kunder endnu'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {searchTerm || filterStatus !== 'all'
                            ? 'Prøv at justere dine filtre eller søgning'
                            : 'Opret din første kunde for at komme i gang'}
                        </p>
                        {!searchTerm && filterStatus === 'all' && (
                          <button
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                          >
                            <Plus className="w-4 h-4" />
                            Opret Kunde
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedCustomers.map(customer => (
                  <tr key={customer.id} className="group">
                    <td className="p-4">
                      <div className="font-medium text-foreground group-hover:text-primary transition-colors">{customer.name}</div>
                      {customer.address && <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {customer.address}</div>}
                    </td>
                    <td className="p-4">
                      {customer.email && <div className="text-sm text-foreground flex items-center gap-1.5"><Mail className="w-3 h-3 text-muted-foreground" /> {customer.email}</div>}
                      {customer.phone && <div className="text-sm text-foreground flex items-center gap-1.5 mt-1"><Phone className="w-3 h-3 text-muted-foreground" /> {customer.phone}</div>}
                    </td>
                    <td className="p-4 text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Leads:</span>
                        <span className="font-medium text-primary">{customer.totalLeads}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Bookings:</span>
                        <span className="font-medium text-blue-400">{customer.totalBookings}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Omsætning:</span>
                        <span className="font-medium text-success">{customer.totalRevenue.toLocaleString('da-DK')} kr.</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`status-badge-premium ${customer.status === 'active' ? 'active' : 'inactive'}`}>
                        {customer.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="p-4 flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(customer)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 hover:scale-105"
                        title="Rediger kunde"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(customer.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200 hover:scale-105"
                        title="Slet kunde"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-card rounded-xl p-8 shadow-2xl max-w-md w-full mx-4 animate-scale-in">
            <h2 className="text-xl font-bold text-foreground mb-6">Opret Ny Kunde</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Navn *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-glass/30 border border-glass/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground"
                  placeholder="Kundens navn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-glass/30 border border-glass/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground"
                  placeholder="kunde@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-glass/30 border border-glass/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground"
                  placeholder="+45 12 34 56 78"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-glass/30 border border-glass/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground"
                  placeholder="Kundens adresse"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 bg-glass/30 border border-glass/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground"
                >
                  <option value="active">Aktiv</option>
                  <option value="inactive">Inaktiv</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Annuller
              </button>
              <button
                onClick={handleCreateCustomer}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Opret
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-card rounded-xl p-8 shadow-2xl max-w-md w-full mx-4 animate-scale-in">
            <h2 className="text-xl font-bold text-foreground mb-6">Rediger Kunde</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Navn *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-glass/30 border border-glass/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground"
                  placeholder="Kundens navn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-glass/30 border border-glass/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground"
                  placeholder="kunde@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Telefon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-glass/30 border border-glass/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground"
                  placeholder="+45 12 34 56 78"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Adresse</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-glass/30 border border-glass/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground"
                  placeholder="Kundens adresse"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 bg-glass/30 border border-glass/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-foreground"
                >
                  <option value="active">Aktiv</option>
                  <option value="inactive">Inaktiv</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Annuller
              </button>
              <button
                onClick={handleEditCustomer}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Gem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-card rounded-xl p-8 shadow-2xl text-center max-w-md mx-4 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Er du sikker?</h3>
            <p className="text-muted-foreground mb-6">Denne handling kan ikke fortrydes.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-6 py-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                Annuller
              </button>
              <button
                onClick={() => { void handleDeleteCustomer(deleteConfirm); setDeleteConfirm(null); }}
                className="px-6 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-200 hover:scale-105"
              >
                Slet
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg animate-fade-in ${toast.type === 'success'
          ? 'bg-success text-white'
          : 'bg-destructive text-white'
          }`}>
          <p className="font-medium">{toast.message}</p>
        </div>
      )}
    </div>
  );
};

export default Customers;
