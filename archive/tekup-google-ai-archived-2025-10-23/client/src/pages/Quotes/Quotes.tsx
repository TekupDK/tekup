import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, User, Calendar, DollarSign, CheckCircle, Clock, XCircle, Send, Trash2 } from 'lucide-react';
import CreateQuoteModal from '@/components/CreateQuoteModal';

interface Quote {
  id: string;
  leadId: string;
  hourlyRate: number;
  estimatedHours: number;
  subtotal: number;
  vatRate: number;
  total: number;
  notes: string | null;
  validUntil: Date | null;
  status: string;
  createdAt: Date;
  lead: {
    name: string | null;
    email: string | null;
    taskType: string | null;
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'https://api.renos.dk';

const Quotes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [sendingQuote, setSendingQuote] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/dashboard/quotes`);
      if (!response.ok) throw new Error('Failed to fetch quotes');
      const data = await response.json();
      setQuotes(data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuote = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard/quotes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete quote');

      setDeleteConfirm(null);
      fetchQuotes();
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Kunne ikke slette tilbud. Prøv igen.');
    }
  };

  const handleSendQuote = async (id: string) => {
    setSendingQuote(id);
    try {
      const response = await fetch(`${API_URL}/api/dashboard/quotes/${id}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error('Failed to send quote');

      alert('Tilbud sendt via email!');
      fetchQuotes();
    } catch (error) {
      console.error('Error sending quote:', error);
      alert('Kunne ikke sende tilbud. Prøv igen.');
    } finally {
      setSendingQuote(null);
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const name = quote.lead?.name || '';
    const taskType = quote.lead?.taskType || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      taskType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || quote.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted': return 'text-green-400';
      case 'sent': return 'text-blue-400';
      case 'pending': return 'text-yellow-400';
      case 'draft': return 'text-gray-400';
      case 'rejected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted': return 'bg-green-400/10 border-green-400/30';
      case 'sent': return 'bg-blue-400/10 border-blue-400/30';
      case 'pending': return 'bg-yellow-400/10 border-yellow-400/30';
      case 'draft': return 'bg-gray-400/10 border-gray-400/30';
      case 'rejected': return 'bg-red-400/10 border-red-400/30';
      default: return 'bg-gray-400/10 border-gray-400/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted': return 'Accepteret';
      case 'sent': return 'Sendt';
      case 'pending': return 'Afventer';
      case 'draft': return 'Kladde';
      case 'rejected': return 'Afvist';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Indlæser tilbud...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="stat-icon-wrapper" style={{ width: '3rem', height: '3rem', background: 'rgba(255, 179, 0, 0.1)', borderColor: 'rgba(255, 179, 0, 0.2)' }}>
            <FileText className="w-6 h-6" style={{ color: 'var(--color-warning)' }} />
          </div>
          <div>
            <h1 className="text-4xl font-bold" style={{ background: 'linear-gradient(90deg, var(--color-warning), var(--color-primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Tilbud</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Administrer dine tilbud og priser</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2 transition-all duration-300 hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          Nyt Tilbud
        </button>
      </header>

      {/* Search and Filter */}
      <div className="glass-card p-6 rounded-xl shadow-md">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Søg efter kunde, service eller tilbudsnummer..."
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
              <option value="draft">Kladde</option>
              <option value="sent">Sendt</option>
              <option value="pending">Afventer</option>
              <option value="accepted">Accepteret</option>
              <option value="rejected">Afvist</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quote Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="glass-card group hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Tilbud</p>
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/10 border border-blue-500/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{quotes.length}</p>
          </div>
        </div>
        <div className="glass-card group hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Accepteret</p>
              <div className="p-3 rounded-xl bg-gradient-to-br from-success/20 to-success/10 border border-success/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{quotes.filter(q => q.status === 'accepted').length}</p>
          </div>
        </div>
        <div className="glass-card group hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Værdi</p>
              <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 border border-yellow-500/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <DollarSign className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{quotes.reduce((sum, q) => sum + q.total, 0).toLocaleString()} kr</p>
          </div>
        </div>
        <div className="glass-card group hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Afventer</p>
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/10 border border-purple-500/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{quotes.filter(q => q.status === 'pending' || q.status === 'sent').length}</p>
          </div>
        </div>
      </div>

      {/* Quote List */}
      <div className="glass rounded-xl border overflow-hidden">
        <div className="p-6 border-b border-glass">
          <h3 className="text-lg font-semibold text-foreground">Tilbud Liste</h3>
          <p className="text-sm text-muted-foreground">Viser {filteredQuotes.length} af {quotes.length} tilbud</p>
        </div>
        <div className="space-y-4 p-6">
          {filteredQuotes.map((quote) => (
            <div key={quote.id} className="glass rounded-lg p-6 border hover:bg-glass/30 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-foreground">Tilbud #{quote.id.substring(0, 8)}</h4>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBg(quote.status)} ${getStatusColor(quote.status)}`}>
                      {getStatusIcon(quote.status)}
                      {getStatusText(quote.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{quote.lead?.name || 'Ukendt kunde'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{quote.lead?.taskType || 'Ingen service'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Oprettet: {new Date(quote.createdAt).toLocaleDateString('da-DK')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Gyldig til: {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('da-DK') : 'Ubestemt'}</span>
                    </div>
                  </div>

                  <div className="mt-3 p-4 bg-glass/50 rounded-lg">
                    <h5 className="text-sm font-medium text-foreground mb-2">Detaljer:</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Timepris</span>
                        <span className="font-medium text-foreground">{quote.hourlyRate.toLocaleString()} kr</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Estimerede timer</span>
                        <span className="font-medium text-foreground">{quote.estimatedHours} timer</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-medium text-foreground">{quote.subtotal.toLocaleString()} kr</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Moms ({quote.vatRate * 100}%)</span>
                        <span className="font-medium text-foreground">{((quote.total - quote.subtotal)).toLocaleString()} kr</span>
                      </div>
                      <div className="pt-2 border-t border-glass flex justify-between text-base font-semibold text-foreground">
                        <span>Total</span>
                        <span>{quote.total.toLocaleString()} kr</span>
                      </div>
                    </div>
                    {quote.notes && (
                      <p className="mt-3 text-xs text-muted-foreground italic">{quote.notes}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  {quote.status === 'draft' && (
                    <button
                      onClick={() => handleSendQuote(quote.id)}
                      disabled={sendingQuote === quote.id}
                      className="glass glass-hover rounded-lg px-3 py-2 border text-blue-400 text-sm hover:bg-blue-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      {sendingQuote === quote.id ? 'Sender...' : 'Send'}
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteConfirm(quote.id)}
                    className="glass glass-hover rounded-lg px-3 py-2 border text-red-400 text-sm hover:bg-red-500/20 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Slet
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Quote Modal */}
      <CreateQuoteModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchQuotes}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass rounded-xl p-6 border w-full max-w-md">
            <h3 className="text-xl font-bold text-foreground mb-4">Bekræft Sletning</h3>
            <p className="text-muted-foreground mb-6">
              Er du sikker på, at du vil slette dette tilbud? Denne handling kan ikke fortrydes.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-glass border border-glass text-foreground rounded-lg hover:bg-gray-700 transition-colors"
              >
                Annuller
              </button>
              <button
                onClick={() => handleDeleteQuote(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Slet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotes;
