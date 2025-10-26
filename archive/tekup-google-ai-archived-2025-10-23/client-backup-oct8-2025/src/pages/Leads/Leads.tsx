import { useState, useEffect } from 'react';
import { Target, Plus, Search, Filter, Phone, Mail, Trash2, Sparkles, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import CreateLeadModal from '@/components/CreateLeadModal';
import AIQuoteModal from '@/components/AIQuoteModal';
import { getStatusBadgeClass } from '@/lib/statusColors';
import { exportToCSV } from '@/lib/csvExport';
import { API_CONFIG } from '@/config/api';

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  taskType: string | null;
  status: string;
  estimatedValue: number | null;
  createdAt: Date;
  externalId?: string | null; // For Leadmail.no integration
  customer?: {
    name: string;
    email: string | null;
    phone: string | null;
  };
}

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showAIQuoteModal, setShowAIQuoteModal] = useState(false);
  const [aiQuoteData, setAIQuoteData] = useState<Lead | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Sorting state
  const [sortField, setSortField] = useState<keyof Lead | ''>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    void fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/dashboard/leads`);
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json() as Lead[];

      // Deduplicate leads by externalId (highest priority) or email+createdAt composite key
      // This prevents showing same lead multiple times from Leadmail.no or other sources
      const uniqueLeads = (Array.isArray(data) ? data : []).reduce((acc, lead) => {
        // Prefer externalId for deduplication if available (e.g., from Leadmail.no)
        const key = lead.externalId || `${lead.email || lead.id}-${lead.createdAt}`;
        if (!acc.seen.has(key)) {
          acc.seen.add(key);
          acc.leads.push(lead);
        }
        return acc;
      }, { seen: new Set<string>(), leads: [] as Lead[] });

      setLeads(uniqueLeads.leads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      setLeads([]); // Ensure empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: { target: { value: string } }) => {
    setSearchTerm(e.target.value);
  };

  const handleFilter = (status: string) => {
    setFilterStatus(status);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/leads/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete lead');
      void fetchLeads(); // Refresh leads after deletion
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleGenerateAIQuote = (lead: Lead) => {
    setAIQuoteData(lead);
    setShowAIQuoteModal(true);
  };

  const filteredLeads = leads.filter(lead => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch =
      (lead.name && lead.name.toLowerCase().includes(searchTermLower)) ||
      (lead.email && lead.email.toLowerCase().includes(searchTermLower)) ||
      (lead.customer?.name && lead.customer.name.toLowerCase().includes(searchTermLower));

    const matchesFilter = filterStatus === 'all' || lead.status.toLowerCase() === filterStatus;

    return matchesSearch && matchesFilter;
  });

  // Sorting logic
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    // Handle null/undefined
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    // Handle dates
    if (sortField === 'createdAt') {
      const aDate = new Date(aValue as string).getTime();
      const bDate = new Date(bValue as string).getTime();
      return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
    }

    // Handle numbers
    if (sortField === 'estimatedValue') {
      const aNum = Number(aValue) || 0;
      const bNum = Number(bValue) || 0;
      return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
    }

    // Handle strings
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    return sortDirection === 'asc'
      ? aStr.localeCompare(bStr, 'da-DK')
      : bStr.localeCompare(aStr, 'da-DK');
  });

  // Pagination calculations
  const totalItems = sortedLeads.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedLeads = sortedLeads.slice(startIndex, endIndex);

  // Reset to page 1 when filters or sorting change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, sortField, sortDirection]);

  const handleSort = (field: keyof Lead) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, start with ascending
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
    const exportData = filteredLeads.map(lead => ({
      navn: lead.customer?.name || lead.name || 'N/A',
      email: lead.customer?.email || lead.email || 'N/A',
      telefon: lead.customer?.phone || lead.phone || 'N/A',
      opgaveType: lead.taskType || 'N/A',
      værdi: lead.estimatedValue || 0,
      status: lead.status,
      oprettet: new Date(lead.createdAt)
    }));

    const headers = [
      { key: 'navn' as const, label: 'Navn' },
      { key: 'email' as const, label: 'Email' },
      { key: 'telefon' as const, label: 'Telefon' },
      { key: 'opgaveType' as const, label: 'Opgave Type' },
      { key: 'værdi' as const, label: 'Estimeret Værdi (kr)' },
      { key: 'status' as const, label: 'Status' },
      { key: 'oprettet' as const, label: 'Oprettet' }
    ];

    exportToCSV(exportData, headers, 'leads');
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="stat-icon-wrapper" style={{ width: '3rem', height: '3rem', background: 'rgba(0, 230, 118, 0.1)', borderColor: 'rgba(0, 230, 118, 0.2)' }}>
            <Target className="w-6 h-6" style={{ color: 'var(--color-success)' }} />
          </div>
          <div>
            <h1 className="text-4xl font-bold" style={{ background: 'linear-gradient(90deg, var(--color-success), var(--color-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Leads</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Administrer dine potentielle kunder</p>
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
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2 px-4 py-2 transition-all duration-300 hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Opret Lead
          </button>
        </div>
      </header>

      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              placeholder="Søg efter navn eller email..."
              value={searchTerm}
              onChange={handleSearch}
              className="input-field w-full pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
            <select
              value={filterStatus}
              onChange={(e) => handleFilter(e.target.value)}
              className="input-field px-3 py-2"
            >
              <option value="all">Alle Status</option>
              <option value="new">Ny</option>
              <option value="contacted">Kontaktet</option>
              <option value="qualified">Kvalificeret</option>
              <option value="lost">Tabt</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th
                  className="p-4 font-semibold text-muted-foreground uppercase text-xs cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Navn
                    {sortField === 'name' ? (
                      sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                </th>
                <th className="p-4 font-semibold text-muted-foreground uppercase text-xs">Kontakt</th>
                <th
                  className="p-4 font-semibold text-muted-foreground uppercase text-xs cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort('estimatedValue')}
                >
                  <div className="flex items-center gap-2">
                    Værdi
                    {sortField === 'estimatedValue' ? (
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
                <th
                  className="p-4 font-semibold text-muted-foreground uppercase text-xs cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-2">
                    Oprettet
                    {sortField === 'createdAt' ? (
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
                    <td className="p-4"><div className="h-4 bg-muted/50 rounded w-1/4 animate-pulse"></div></td>
                    <td className="p-4"><div className="h-6 bg-muted/50 rounded-full w-20 animate-pulse"></div></td>
                    <td className="p-4"><div className="h-4 bg-muted/50 rounded w-1/2 animate-pulse"></div></td>
                    <td className="p-4"><div className="h-8 bg-muted/50 rounded w-24 animate-pulse"></div></td>
                  </tr>
                ))
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 rounded-full bg-muted/30">
                        <Target className="w-12 h-12 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">Ingen leads fundet</h3>
                        <p className="text-sm text-muted-foreground">
                          {searchTerm || filterStatus !== 'all'
                            ? 'Prøv at justere dine filtre'
                            : 'Opret din første lead for at komme i gang'}
                        </p>
                      </div>
                      {!searchTerm && filterStatus === 'all' && (
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="mt-4 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg transition-all duration-300"
                        >
                          <Plus className="w-4 h-4" />
                          Opret Lead
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLeads.map(lead => (
                  <tr key={lead.id} className="border-b border-glass/30 hover:bg-glass/20 transition-all duration-300 group">
                    <td className="p-4">
                      <div className="font-medium text-foreground group-hover:text-primary transition-colors">{lead.customer?.name || lead.name || 'N/A'}</div>
                      <div className="text-sm text-muted-foreground">{lead.taskType || 'Ingen opgave'}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{lead.email || lead.customer?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground mt-1">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{lead.phone || lead.customer?.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-foreground">
                      {lead.estimatedValue ? (
                        <span className="text-success font-semibold">{lead.estimatedValue.toLocaleString('da-DK')} kr.</span>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${getStatusBadgeClass(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(lead.createdAt).toLocaleDateString('da-DK')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGenerateAIQuote(lead)}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 hover:scale-105"
                          title="Generer AI Tilbud"
                        >
                          <Sparkles className="w-5 h-5" />
                        </button>
                        {deleteConfirm === lead.id ? (
                          <button
                            onClick={() => void handleDelete(lead.id)}
                            className="p-2 bg-destructive text-destructive-foreground rounded-lg transition-all duration-200 hover:scale-105"
                            title="Bekræft Sletning"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(lead.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200 hover:scale-105"
                            title="Slet Lead"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
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
                Viser {startIndex + 1}-{Math.min(endIndex, totalItems)} af {totalItems} leads
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

      {showCreateModal && (
        <CreateLeadModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={() => void fetchLeads()} />
      )}
      {showAIQuoteModal && aiQuoteData && (
        <AIQuoteModal
          isOpen={showAIQuoteModal}
          quoteData={aiQuoteData}
          onSuccess={() => void fetchLeads()}
          onClose={() => setShowAIQuoteModal(false)}
        />
      )}
    </div>
  );
};

export default Leads;
