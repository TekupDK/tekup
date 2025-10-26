import { useState, useEffect } from 'react';
import { Users, Search, MessageSquare, Send, Eye, EyeOff, Plus, Mail, Phone, MapPin, TrendingUp, Calendar, DollarSign, Activity } from 'lucide-react';

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

interface EmailThread {
  id: string;
  gmailThreadId: string;
  subject: string;
  snippet: string;
  lastMessageAt: Date;
  participants: string[];
  messageCount: number;
  isMatched: boolean;
  messages: EmailMessage[];
}

interface EmailMessage {
  id: string;
  from: string;
  to: string[];
  subject: string;
  bodyPreview: string;
  direction: string;
  sentAt: Date;
  isAiGenerated: boolean;
}

interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  taskType: string | null;
  status: string;
  createdAt: Date;
  quotes: { id: string; status: string; total: number }[];
  bookings: { id: string; status: string; scheduledAt: Date }[];
}

interface Booking {
  id: string;
  serviceType: string | null;
  scheduledAt: Date;
  startTime: Date | null;
  endTime: Date | null;
  status: string;
  estimatedDuration: number;
  lead: {
    name: string | null;
    email: string | null;
    taskType: string | null;
  } | null;
  createdAt: Date;
}

const API_URL = import.meta.env.VITE_API_URL || 'https://api.renos.dk';

const Customer360 = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerThreads, setCustomerThreads] = useState<EmailThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<EmailMessage[]>([]);
  const [customerLeads, setCustomerLeads] = useState<Lead[]>([]);
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmailBodies, setShowEmailBodies] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [activeTab, setActiveTab] = useState<'emails' | 'leads' | 'bookings'>('emails');

  useEffect(() => {
    void fetchCustomers();
  }, []);

  useEffect(() => {
    if (selectedCustomer) {
      void fetchCustomerThreads();
      void fetchCustomerLeads();
      void fetchCustomerBookings();
    }
  }, [selectedCustomer]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedThread) {
      void fetchThreadMessages();
    }
  }, [selectedThread]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/dashboard/customers`);
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json() as Customer[];
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerThreads = async () => {
    if (!selectedCustomer) return;

    try {
      setThreadsLoading(true);
      const response = await fetch(`${API_URL}/api/dashboard/customers/${selectedCustomer.id}/threads`);
      if (!response.ok) throw new Error('Failed to fetch customer threads');
      const data = await response.json() as { threads: EmailThread[] };
      setCustomerThreads(data.threads);
    } catch (error) {
      console.error('Error fetching customer threads:', error);
    } finally {
      setThreadsLoading(false);
    }
  };

  const fetchThreadMessages = async () => {
    if (!selectedThread) return;

    try {
      const response = await fetch(`${API_URL}/api/dashboard/threads/${selectedThread.id}/messages?expand=body`);
      if (!response.ok) throw new Error('Failed to fetch thread messages');
      const data = await response.json() as { messages: EmailMessage[] };
      setThreadMessages(data.messages);
    } catch (error) {
      console.error('Error fetching thread messages:', error);
    }
  };

  const fetchCustomerLeads = async () => {
    if (!selectedCustomer) return;

    setLeadsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/dashboard/customers/${selectedCustomer.id}/leads`);
      if (!response.ok) throw new Error('Failed to fetch customer leads');
      const data = await response.json() as { leads: Lead[] };
      setCustomerLeads(data.leads);
    } catch (error) {
      console.error('Error fetching customer leads:', error);
    } finally {
      setLeadsLoading(false);
    }
  };

  const fetchCustomerBookings = async () => {
    if (!selectedCustomer) return;

    setBookingsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/dashboard/customers/${selectedCustomer.id}/bookings`);
      if (!response.ok) throw new Error('Failed to fetch customer bookings');
      const data = await response.json() as { bookings: Booking[] };
      setCustomerBookings(data.bookings);
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedThread || !replyBody.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/dashboard/threads/${selectedThread.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: replyBody,
          dryRun: false,
        }),
      });

      if (response.ok) {
        setReplyBody('');
        void fetchThreadMessages();
        alert('Svar sendt!');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Fejl ved afsendelse af svar');
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Indlæser Customer 360...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Section - Matching RenOS Design */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Customer 360</h1>
            <p className="text-sm text-muted-foreground mt-1">Komplet oversigt over kundeinteraktioner og email historik</p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
          <Plus className="w-5 h-5" />
          Ny Email
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List Panel */}
        <div className="lg:col-span-1">
          <div className="glass-card rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-glass">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Søg kunder..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-300"
                />
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {filteredCustomers.length === 0 ? (
                <div className="p-6 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Ingen kunder fundet</p>
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className={`p-4 border-b border-glass cursor-pointer hover:bg-glass/30 transition-all duration-300 ${selectedCustomer?.id === customer.id ? 'bg-primary/10 border-primary/30' : ''
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">{customer.name}</h3>
                        {customer.email && (
                          <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-green-400/20 text-green-400 px-2 py-0.5 rounded-full">
                            {customer.totalLeads} leads
                          </span>
                          <span className="text-xs bg-blue-400/20 text-blue-400 px-2 py-0.5 rounded-full">
                            {customer.totalBookings} bookinger
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Customer Details & Email Threads */}
        <div className="lg:col-span-2">
          {selectedCustomer ? (
            <div className="space-y-6">
              {/* Customer Overview Card */}
              <div className="glass-card p-6 rounded-xl shadow-md">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{selectedCustomer.name}</h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {selectedCustomer.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span>{selectedCustomer.email}</span>
                          </div>
                        )}
                        {selectedCustomer.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            <span>{selectedCustomer.phone}</span>
                          </div>
                        )}
                      </div>
                      {selectedCustomer.address && (
                        <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{selectedCustomer.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedCustomer.status === 'active'
                    ? 'bg-green-400/20 text-green-400'
                    : 'bg-gray-400/20 text-gray-400'
                    }`}>
                    {selectedCustomer.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass-card p-4 rounded-lg text-center">
                    <TrendingUp className="h-6 w-6 text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-400">{selectedCustomer.totalLeads}</p>
                    <p className="text-sm text-muted-foreground">Leads</p>
                  </div>
                  <div className="glass-card p-4 rounded-lg text-center">
                    <Calendar className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-400">{selectedCustomer.totalBookings}</p>
                    <p className="text-sm text-muted-foreground">Bookinger</p>
                  </div>
                  <div className="glass-card p-4 rounded-lg text-center">
                    <DollarSign className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-400">{selectedCustomer.totalRevenue.toLocaleString()} kr</p>
                    <p className="text-sm text-muted-foreground">Værdi</p>
                  </div>
                  <div className="glass-card p-4 rounded-lg text-center">
                    <Activity className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-400">{customerThreads.length}</p>
                    <p className="text-sm text-muted-foreground">Email Tråde</p>
                  </div>
                </div>
              </div>

              {/* Tabbed Sections: Emails, Leads, Bookings */}
              <div className="glass-card rounded-xl shadow-md overflow-hidden">
                {/* Tabs Header */}
                <div className="p-6 border-b border-glass">
                  <div className="flex items-center gap-4 mb-4">
                    <button
                      onClick={() => setActiveTab('emails')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'emails'
                        ? 'bg-primary text-primary-foreground'
                        : 'glass glass-hover'
                        }`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Email Tråde ({customerThreads.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('leads')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'leads'
                        ? 'bg-primary text-primary-foreground'
                        : 'glass glass-hover'
                        }`}
                    >
                      <TrendingUp className="h-4 w-4" />
                      Leads ({customerLeads.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'bookings'
                        ? 'bg-primary text-primary-foreground'
                        : 'glass glass-hover'
                        }`}
                    >
                      <Calendar className="h-4 w-4" />
                      Bookinger ({customerBookings.length})
                    </button>
                  </div>

                  {activeTab === 'emails' && (
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Email Tråde
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowEmailBodies(!showEmailBodies)}
                          className="flex items-center gap-2 px-3 py-1 text-sm glass glass-hover rounded-lg border"
                        >
                          {showEmailBodies ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          {showEmailBodies ? 'Skjul' : 'Vis'} Indhold
                        </button>
                        <span className="text-sm text-muted-foreground">{customerThreads.length} tråde</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Email Threads List */}
                {activeTab === 'emails' && (
                  <div className="max-h-96 overflow-y-auto">
                    {threadsLoading ? (
                      <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-muted-foreground">Indlæser email tråde...</p>
                      </div>
                    ) : customerThreads.length === 0 ? (
                      <div className="p-6 text-center">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">Ingen email tråde fundet</p>
                        <p className="text-sm text-muted-foreground mt-1">Email tråde vil vises her når de bliver matchet til denne kunde</p>
                      </div>
                    ) : (
                      customerThreads.map((thread) => (
                        <div
                          key={thread.id}
                          onClick={() => setSelectedThread(thread)}
                          className={`p-4 border-b border-glass cursor-pointer hover:bg-glass/30 transition-all duration-300 ${selectedThread?.id === thread.id ? 'bg-primary/10 border-primary/30' : ''
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <MessageSquare className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground truncate">{thread.subject}</h4>
                              <p className="text-sm text-muted-foreground truncate mt-1">{thread.snippet}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(thread.lastMessageAt).toLocaleDateString('da-DK')}
                                </span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">
                                  {thread.messageCount} beskeder
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Email Thread Messages */}
                {selectedThread && activeTab === 'emails' && (
                  <div className="border-t border-glass">
                    <div className="p-4 bg-glass/20">
                      <h4 className="font-medium text-foreground mb-2">{selectedThread.subject}</h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {threadMessages.map((message, index) => (
                          <div key={index} className="p-3 glass-card rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-foreground">{message.from}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.sentAt).toLocaleString('da-DK')}
                              </span>
                            </div>
                            {showEmailBodies && (
                              <p className="text-sm text-muted-foreground">{message.bodyPreview}</p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Reply Section */}
                      <div className="mt-4 space-y-3">
                        <textarea
                          value={replyBody}
                          onChange={(e) => setReplyBody(e.target.value)}
                          placeholder="Skriv dit svar..."
                          className="w-full p-3 input-glass rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                          rows={3}
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={() => void handleSendReply()}
                            disabled={!replyBody.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                          >
                            <Send className="h-4 w-4" />
                            Send Svar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Leads Tab Content */}
                {activeTab === 'leads' && (
                  <div className="max-h-96 overflow-y-auto">
                    {leadsLoading ? (
                      <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-muted-foreground">Indlæser leads...</p>
                      </div>
                    ) : customerLeads.length === 0 ? (
                      <div className="p-6 text-center">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">Ingen leads fundet</p>
                        <p className="text-sm text-muted-foreground mt-1">Leads fra denne kunde vil vises her</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-glass">
                        {customerLeads.map((lead) => (
                          <div key={lead.id} className="p-4 hover:bg-glass/30 transition-all">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-foreground">{lead.name || 'Unavngiven Lead'}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${lead.status === 'new' ? 'bg-blue-400/20 text-blue-400' :
                                    lead.status === 'contacted' ? 'bg-yellow-400/20 text-yellow-400' :
                                      lead.status === 'quoted' ? 'bg-purple-400/20 text-purple-400' :
                                        lead.status === 'won' ? 'bg-green-400/20 text-green-400' :
                                          lead.status === 'lost' ? 'bg-red-400/20 text-red-400' :
                                            'bg-gray-400/20 text-gray-400'
                                    }`}>
                                    {lead.status}
                                  </span>
                                  {lead.taskType && (
                                    <span className="text-xs text-muted-foreground">{lead.taskType}</span>
                                  )}
                                  {lead.source && (
                                    <span className="text-xs text-muted-foreground">• {lead.source}</span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Oprettet: {new Date(lead.createdAt).toLocaleDateString('da-DK')}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                {lead.quotes.length > 0 && (
                                  <span className="text-xs bg-purple-400/20 text-purple-400 px-2 py-0.5 rounded-full">
                                    {lead.quotes.length} tilbud
                                  </span>
                                )}
                                {lead.bookings.length > 0 && (
                                  <span className="text-xs bg-blue-400/20 text-blue-400 px-2 py-0.5 rounded-full">
                                    {lead.bookings.length} bookinger
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Bookings Tab Content */}
                {activeTab === 'bookings' && (
                  <div className="max-h-96 overflow-y-auto">
                    {bookingsLoading ? (
                      <div className="p-6 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                        <p className="text-muted-foreground">Indlæser bookinger...</p>
                      </div>
                    ) : customerBookings.length === 0 ? (
                      <div className="p-6 text-center">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">Ingen bookinger fundet</p>
                        <p className="text-sm text-muted-foreground mt-1">Bookinger fra denne kunde vil vises her</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-glass">
                        {customerBookings.map((booking) => (
                          <div key={booking.id} className="p-4 hover:bg-glass/30 transition-all">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-foreground">
                                    {booking.serviceType || booking.lead?.taskType || 'Booking'}
                                  </h4>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${booking.status === 'scheduled' ? 'bg-blue-400/20 text-blue-400' :
                                    booking.status === 'confirmed' ? 'bg-green-400/20 text-green-400' :
                                      booking.status === 'completed' ? 'bg-purple-400/20 text-purple-400' :
                                        booking.status === 'cancelled' ? 'bg-red-400/20 text-red-400' :
                                          'bg-gray-400/20 text-gray-400'
                                    }`}>
                                    {booking.status}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(booking.scheduledAt).toLocaleString('da-DK')}</span>
                                  <span>• {booking.estimatedDuration} min</span>
                                </div>
                                {booking.lead?.name && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Lead: {booking.lead.name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 rounded-xl shadow-md text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Vælg en kunde</h3>
              <p className="text-muted-foreground">Vælg en kunde fra listen for at se deres komplette profil og email historik</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Customer360;
