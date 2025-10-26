import {
    Building,
    Calendar,
    DollarSign,
    Edit,
    Filter,
    Mail,
    MoreVertical,
    Phone,
    Plus,
    Search,
    TrendingUp,
    UserCheck,
    Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Activities from '../components/Activities';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  value: number;
  lastContact: string;
  source: string;
  tags: string[];
  notes: string;
}

interface Deal {
  id: string;
  title: string;
  contactId: string;
  value: number;
  stage: 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  probability: number;
  expectedCloseDate: string;
  createdDate: string;
}

const CRM = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activeTab, setActiveTab] = useState<'contacts' | 'deals' | 'pipeline' | 'activities'>('contacts');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);

  // Sample data
  useEffect(() => {
    const sampleContacts: Contact[] = [
      {
        id: '1',
        name: 'Lars Andersen',
        email: 'lars.andersen@nordeabank.dk',
        phone: '+45 20 12 34 56',
        company: 'Nordea Bank',
        position: 'IT Director',
        status: 'customer',
        value: 450000,
        lastContact: '2024-09-10',
        source: 'LinkedIn',
        tags: ['Enterprise', 'Banking', 'Priority'],
        notes: 'Interesseret i AI-løsninger til kundeservice automatisering'
      },
      {
        id: '2',
        name: 'Maria Hansen',
        email: 'mhansen@tdc.dk',
        phone: '+45 30 45 67 89',
        company: 'TDC Group',
        position: 'Digital Transformation Manager',
        status: 'prospect',
        value: 280000,
        lastContact: '2024-09-08',
        source: 'Conference',
        tags: ['Telecom', 'AI', 'Automation'],
        notes: 'Evaluerer forskellige AI-platforme til netværksoptimering'
      },
      {
        id: '3',
        name: 'Thomas Nielsen',
        email: 'thomas.nielsen@lego.com',
        phone: '+45 75 50 60 70',
        company: 'LEGO Group',
        position: 'Innovation Lead',
        status: 'lead',
        value: 650000,
        lastContact: '2024-09-12',
        source: 'Website',
        tags: ['Manufacturing', 'Innovation', 'Global'],
        notes: 'Søger AI-løsninger til produktudvikling og kvalitetskontrol'
      },
      {
        id: '4',
        name: 'Sofie Larsen',
        email: 'sofie.larsen@vestas.com',
        phone: '+45 97 73 00 00',
        company: 'Vestas',
        position: 'Data Science Manager',
        status: 'customer',
        value: 1200000,
        lastContact: '2024-09-11',
        source: 'Referral',
        tags: ['Wind Energy', 'Sustainability', 'IoT'],
        notes: 'Implementerer AI til vindmølle predictive maintenance'
      }
    ];

    const sampleDeals: Deal[] = [
      {
        id: '1',
        title: 'AI Kundeservice Platform - Nordea',
        contactId: '1',
        value: 450000,
        stage: 'negotiation',
        probability: 75,
        expectedCloseDate: '2024-09-30',
        createdDate: '2024-08-15'
      },
      {
        id: '2',
        title: 'Netværks AI Optimering - TDC',
        contactId: '2',
        value: 280000,
        stage: 'proposal',
        probability: 45,
        expectedCloseDate: '2024-10-15',
        createdDate: '2024-09-01'
      },
      {
        id: '3',
        title: 'Produktions AI Suite - LEGO',
        contactId: '3',
        value: 650000,
        stage: 'qualified',
        probability: 30,
        expectedCloseDate: '2024-11-30',
        createdDate: '2024-09-10'
      }
    ];

    setContacts(sampleContacts);
    setDeals(sampleDeals);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'customer': return 'bg-green-500';
      case 'prospect': return 'bg-blue-500';
      case 'lead': return 'bg-yellow-500';
      case 'inactive': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'qualified': return 'bg-blue-500';
      case 'proposal': return 'bg-yellow-500';
      case 'negotiation': return 'bg-orange-500';
      case 'closed-won': return 'bg-green-500';
      case 'closed-lost': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPipelineValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const averageDealValue = deals.length > 0 ? totalPipelineValue / deals.length : 0;
  const winRate = deals.filter(deal => deal.stage === 'closed-won').length / deals.length * 100;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Customer Relationship Management</h1>
              <p className="text-gray-400">Administrer kunder, leads og salgsprocesser</p>
            </div>
            <button className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              <Plus className="w-5 h-5" />
              <span>Ny Kontakt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Kontakter</p>
                <p className="text-2xl font-bold text-white">{contacts.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pipeline Værdi</p>
                <p className="text-2xl font-bold text-white">{(totalPipelineValue / 1000000).toFixed(1)}M DKK</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Gennemsnitlig Deal</p>
                <p className="text-2xl font-bold text-white">{Math.round(averageDealValue / 1000)}K DKK</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Win Rate</p>
                <p className="text-2xl font-bold text-white">{winRate.toFixed(0)}%</p>
              </div>
              <UserCheck className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800/30 rounded-xl p-6">
          <div className="flex space-x-1 mb-6">
            {['contacts', 'deals', 'pipeline', 'activities'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                {tab === 'contacts' && 'Kontakter'}
                {tab === 'deals' && 'Deals'}
                {tab === 'pipeline' && 'Pipeline'}
                {tab === 'activities' && 'Aktiviteter'}
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Søg kontakter..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'contacts' && (
            <div className="space-y-4">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="bg-gray-700/50 backdrop-blur-sm border border-gray-600 rounded-xl p-6 hover:bg-gray-700/70 transition-colors cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={`Vælg kontakt ${contact.name}`}
                  onClick={() => setSelectedContact(contact)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedContact(contact); } }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-lg">
                          {contact.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{contact.name}</h3>
                        <p className="text-gray-400">{contact.position} @ {contact.company}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="flex items-center space-x-1 text-sm text-gray-400">
                            <Mail className="w-4 h-4" />
                            <span>{contact.email}</span>
                          </span>
                          <span className="flex items-center space-x-1 text-sm text-gray-400">
                            <Phone className="w-4 h-4" />
                            <span>{contact.phone}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-white">{(contact.value / 1000).toFixed(0)}K DKK</p>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(contact.status)}`}></div>
                          <span className="text-sm text-gray-400 capitalize">{contact.status}</span>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-gray-600 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-4">
                    {contact.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'deals' && (
            <div className="space-y-4">
              {deals.map((deal) => {
                const contact = contacts.find(c => c.id === deal.contactId);
                return (
                  <div
                    key={deal.id}
                    className="bg-gray-700/50 backdrop-blur-sm border border-gray-600 rounded-xl p-6 hover:bg-gray-700/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{deal.title}</h3>
                        <p className="text-gray-400">{contact?.name} • {contact?.company}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-2xl font-bold text-white">
                            {(deal.value / 1000).toFixed(0)}K DKK
                          </span>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStageColor(deal.stage)} text-white`}>
                            {deal.stage.replace('-', ' ').toUpperCase()}
                          </div>
                          <span className="text-sm text-gray-400">
                            {deal.probability}% sandsynlighed
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Forventet lukning</p>
                        <p className="text-white font-medium">{new Date(deal.expectedCloseDate).toLocaleDateString('da-DK')}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              {['qualified', 'proposal', 'negotiation', 'closed-won'].map((stage) => {
                const stageDeals = deals.filter(deal => deal.stage === stage);
                const stageValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
                
                return (
                  <div key={stage} className="bg-gray-700/50 backdrop-blur-sm border border-gray-600 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white capitalize">
                        {stage.replace('-', ' ')} ({stageDeals.length})
                      </h3>
                      <span className="text-lg font-bold text-white">
                        {(stageValue / 1000000).toFixed(1)}M DKK
                      </span>
                    </div>
                    <div className="space-y-3">
                      {stageDeals.map((deal) => {
                        const contact = contacts.find(c => c.id === deal.contactId);
                        return (
                          <div
                            key={deal.id}
                            className="bg-gray-800/50 border border-gray-600 rounded-lg p-4 hover:bg-gray-800/70 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-white">{deal.title}</h4>
                                <p className="text-sm text-gray-400">{contact?.company}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-white">{(deal.value / 1000).toFixed(0)}K</p>
                                <p className="text-xs text-gray-400">{deal.probability}%</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'activities' && (
            <Activities />
          )}
        </div>
      </div>

      {/* Contact Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Kontakt Detaljer</h2>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-xl">
                    {selectedContact.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">{selectedContact.name}</h3>
                  <p className="text-gray-400">{selectedContact.position}</p>
                  <p className="text-gray-400">{selectedContact.company}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Kontaktinformation</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">{selectedContact.email}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">{selectedContact.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Building className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">{selectedContact.company}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Business Information</h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedContact.status)}`}></div>
                        <span className="text-white capitalize">{selectedContact.status}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Værdi:</span>
                      <p className="text-white font-semibold">{(selectedContact.value / 1000).toFixed(0)}K DKK</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Sidste kontakt:</span>
                      <p className="text-white">{new Date(selectedContact.lastContact).toLocaleDateString('da-DK')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedContact.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-600/20 text-blue-400 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Noter</h4>
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                  <p className="text-gray-300">{selectedContact.notes}</p>
                </div>
              </div>

              <div className="flex space-x-4 pt-4">
                <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                  <span>Rediger</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                  <Mail className="w-4 h-4" />
                  <span>Send Email</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                  <Calendar className="w-4 h-4" />
                  <span>Book Møde</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRM;