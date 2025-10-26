'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useAnalytics, trackingEvents } from '../analytics/AnalyticsProvider';
import { useEmail } from '../email/EmailProvider';
import { toast } from 'sonner@2.0.3';
import {
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Calendar,
  MessageSquare,
  Star,
  Clock,
  TrendingUp,
  TrendingDown,
  MoreHorizontal,
  User,
  Building2,
  MapPin,
  Globe,
  Edit,
  Trash2,
  Archive,
  Send,
  FileText,
  History,
  Bell,
  Heart,
  ExternalLink
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  score: number;
  status: 'hot' | 'warm' | 'cold' | 'converted' | 'lost';
  source: string;
  lastContact?: string;
  nextFollowUp?: string;
  value?: number;
  urgency: 'high' | 'medium' | 'low';
  keywords?: string[];
  notes?: LeadNote[];
  activities?: LeadActivity[];
  location?: string;
  website?: string;
  assignedTo?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface LeadNote {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  type: 'note' | 'call' | 'email' | 'meeting';
}

interface LeadActivity {
  id: string;
  type: 'email_sent' | 'call_made' | 'meeting_scheduled' | 'note_added' | 'status_changed' | 'score_updated';
  description: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface LeadManagerProps {
  onLeadSelect?: (lead: Lead) => void;
  selectedLeadId?: string;
}

export function LeadManager({ onLeadSelect, selectedLeadId }: LeadManagerProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'created' | 'updated' | 'value'>('score');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  const { track } = useAnalytics();
  const { sendTransactionalEmail } = useEmail();

  // Load leads
  useEffect(() => {
    loadLeads();
  }, []);

  // Filter and search leads
  useEffect(() => {
    let filtered = leads;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.keywords?.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Sort leads
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'value':
          return (b.value || 0) - (a.value || 0);
        default:
          return 0;
      }
    });

    setFilteredLeads(filtered);
  }, [leads, searchQuery, statusFilter, sortBy]);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      // In real app, this would fetch from API
      // For now, using realistic Danish cleaning business mock data
      const mockLeads: Lead[] = [
        {
          id: '1',
          name: 'Caja og Torben Nielsen',
          company: 'Privat bolig - Aarhus C',
          email: 'caja.torben@gmail.com',
          phone: '+45 23 45 67 89',
          score: 95,
          status: 'hot',
          source: 'Leadpoint.dk',
          lastContact: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          nextFollowUp: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          value: 12500,
          urgency: 'high',
          keywords: ['akut', 'hurtig', 'budget klar', 'flytterengøring'],
          location: 'Aarhus C',
          assignedTo: 'demo-user',
          tags: ['privat', 'højværdi', 'hurtig'],
          createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          notes: [
            {
              id: '1',
              content: 'Skal bruge flytterengøring inden for 3 dage. Budget er godkendt. Virker meget interesseret.',
              authorId: 'demo-user',
              authorName: 'Demo Bruger',
              createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              type: 'note'
            }
          ],
          activities: [
            {
              id: '1',
              type: 'email_sent',
              description: 'Sendte tilbud på flytterengøring',
              authorId: 'demo-user',
              authorName: 'Demo Bruger',
              createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
            }
          ]
        },
        {
          id: '2',
          name: 'Emil Houmann',
          company: 'Houmann Consulting ApS',
          email: 'emil@houmannconsulting.dk',
          phone: '+45 87 65 43 21',
          score: 87,
          status: 'warm',
          source: 'Leadmail.no',
          lastContact: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          nextFollowUp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          value: 25000,
          urgency: 'medium',
          keywords: ['kontor', 'ugentlig', 'professionel', 'langvarig aftale'],
          location: 'Silkeborg',
          website: 'https://houmannconsulting.dk',
          assignedTo: 'demo-user',
          tags: ['b2b', 'ugentlig', 'langvarig'],
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          notes: [
            {
              id: '2',
              content: 'Ønsker ugentlig kontorrenhold. Har 15 medarbejdere. Skal have tilbud på både basis og premium pakke.',
              authorId: 'demo-user',
              authorName: 'Demo Bruger',
              createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
              type: 'call'
            }
          ],
          activities: [
            {
              id: '2',
              type: 'call_made',
              description: 'Telefonsamtale - diskuterede behov og pakker',
              authorId: 'demo-user',
              authorName: 'Demo Bruger',
              createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
            }
          ]
        },
        {
          id: '3',
          name: 'Natascha Kring',
          company: 'Kring & Partners Advokatfirma',
          email: 'natascha@kringpartners.dk',
          phone: '+45 42 18 75 93',
          score: 98,
          status: 'hot',
          source: 'Leadpoint.dk',
          lastContact: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          nextFollowUp: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          value: 18750,
          urgency: 'high',
          keywords: ['i dag', 'akut behov', 'fast aftale', 'præsentabel'],
          location: 'København K',
          website: 'https://kringpartners.dk',
          assignedTo: 'demo-user',
          tags: ['juridisk', 'akut', 'københavn'],
          createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          notes: [
            {
              id: '3',
              content: 'AKUT: Skal bruge rengøring i dag før vigtig møde i morgen. Har besøg fra internationale partnere.',
              authorId: 'demo-user',
              authorName: 'Demo Bruger',
              createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
              type: 'note'
            }
          ],
          activities: [
            {
              id: '3',
              type: 'email_sent',
              description: 'Sendte akut tilbud - samme dag service',
              authorId: 'demo-user',
              authorName: 'Demo Bruger',
              createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
            }
          ]
        }
      ];

      setLeads(mockLeads);
      track(trackingEvents.FEATURE_USED, { feature: 'lead_manager', leads_count: mockLeads.length });
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Kunne ikke indlæse leads');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailModalOpen(true);
    onLeadSelect?.(lead);
    track(trackingEvents.LEAD_VIEWED, { lead_id: lead.id, lead_score: lead.score, lead_status: lead.status });
  };

  const handleStatusChange = async (leadId: string, newStatus: Lead['status']) => {
    try {
      // Update local state
      setLeads(prev => prev.map(lead => 
        lead.id === leadId 
          ? { ...lead, status: newStatus, updatedAt: new Date().toISOString() }
          : lead
      ));

      // Update selected lead if it's the same
      if (selectedLead?.id === leadId) {
        setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
      }

      track(trackingEvents.LEAD_UPDATED, { lead_id: leadId, new_status: newStatus });
      toast.success(`Lead status opdateret til ${getStatusLabel(newStatus)}`);

      // Send email notification for important status changes
      if (newStatus === 'converted') {
        // Celebration email or internal notification
        track(trackingEvents.LEAD_CONVERTED, { lead_id: leadId });
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Kunne ikke opdatere lead status');
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedLead) return;

    setIsAddingNote(true);
    try {
      const note: LeadNote = {
        id: crypto.randomUUID(),
        content: newNote,
        authorId: 'demo-user',
        authorName: 'Demo Bruger',
        createdAt: new Date().toISOString(),
        type: 'note'
      };

      // Update local state
      setLeads(prev => prev.map(lead => 
        lead.id === selectedLead.id 
          ? { 
              ...lead, 
              notes: [...(lead.notes || []), note],
              updatedAt: new Date().toISOString() 
            }
          : lead
      ));

      setSelectedLead(prev => prev ? {
        ...prev,
        notes: [...(prev.notes || []), note]
      } : null);

      setNewNote('');
      track(trackingEvents.FEATURE_USED, { feature: 'add_note', lead_id: selectedLead.id });
      toast.success('Note tilføjet');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Kunne ikke tilføje note');
    } finally {
      setIsAddingNote(false);
    }
  };

  const getStatusColor = (status: Lead['status']) => {
    switch (status) {
      case 'hot': return 'bg-red-500 text-white';
      case 'warm': return 'bg-yellow-500 text-white';
      case 'cold': return 'bg-blue-500 text-white';
      case 'converted': return 'bg-green-500 text-white';
      case 'lost': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusLabel = (status: Lead['status']) => {
    switch (status) {
      case 'hot': return 'Hot';
      case 'warm': return 'Varm';
      case 'cold': return 'Kold';
      case 'converted': return 'Konverteret';
      case 'lost': return 'Tabt';
      default: return status;
    }
  };

  const getUrgencyColor = (urgency: Lead['urgency']) => {
    switch (urgency) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min siden`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} timer siden`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} dage siden`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Lead Manager</h1>
          <p className="text-gray-300">Administrer og følg op på dine leads</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button className="bg-gradient-to-r from-[var(--color-tekup-primary-fallback)] to-[var(--color-tekup-accent-fallback)] text-white">
            <Plus className="w-4 h-4 mr-2" />
            Tilføj Lead
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Søg leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle status</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="warm">Varm</SelectItem>
                <SelectItem value="cold">Kold</SelectItem>
                <SelectItem value="converted">Konverteret</SelectItem>
                <SelectItem value="lost">Tabt</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Sorter efter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">AI Score</SelectItem>
                <SelectItem value="created">Oprettet</SelectItem>
                <SelectItem value="updated">Opdateret</SelectItem>
                <SelectItem value="value">Værdi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Totale Leads</p>
                <p className="text-2xl font-bold text-white">{leads.length}</p>
              </div>
              <Users className="w-8 h-8 text-[var(--color-tekup-accent-fallback)]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Hot Leads</p>
                <p className="text-2xl font-bold text-red-400">{leads.filter(l => l.status === 'hot').length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Gns. Score</p>
                <p className="text-2xl font-bold text-white">{Math.round(leads.reduce((acc, lead) => acc + lead.score, 0) / leads.length) || 0}</p>
              </div>
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Værdi</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrency(leads.reduce((acc, lead) => acc + (lead.value || 0), 0))}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads List */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">
            Leads ({filteredLeads.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-tekup-accent-fallback)]"></div>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ingen leads fundet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLeads.map((lead) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 hover:bg-gray-700/70 cursor-pointer transition-all"
                  onClick={() => handleLeadClick(lead)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <Avatar>
                        <AvatarFallback className="bg-[var(--color-tekup-primary-fallback)] text-white">
                          {lead.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-medium text-white truncate">{lead.name}</h3>
                          <Badge className={getStatusColor(lead.status)}>
                            {getStatusLabel(lead.status)}
                          </Badge>
                          {lead.urgency === 'high' && (
                            <Badge variant="outline" className="border-red-500 text-red-400">
                              Akut
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-2">{lead.company}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {lead.email}
                          </span>
                          {lead.phone && (
                            <span className="flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {lead.phone}
                            </span>
                          )}
                          {lead.location && (
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {lead.location}
                            </span>
                          )}
                        </div>
                        
                        {lead.keywords && lead.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {lead.keywords.slice(0, 3).map((keyword, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-gray-500 text-gray-300">
                                {keyword}
                              </Badge>
                            ))}
                            {lead.keywords.length > 3 && (
                              <Badge variant="outline" className="text-xs border-gray-500 text-gray-300">
                                +{lead.keywords.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="font-bold text-white">{lead.score}</span>
                      </div>
                      
                      {lead.value && (
                        <p className="text-sm font-medium text-green-400 mb-1">
                          {formatCurrency(lead.value)}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-400">
                        {formatRelativeTime(lead.updatedAt)}
                      </p>
                      
                      {lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date() && (
                        <Badge variant="outline" className="border-red-500 text-red-400 text-xs mt-1">
                          <Bell className="w-3 h-3 mr-1" />
                          Opfølgning forfald
                        </Badge>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-gray-800 text-white border-gray-700">
          {selectedLead && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-[var(--color-tekup-primary-fallback)] text-white text-lg">
                        {selectedLead.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <DialogTitle className="text-xl">{selectedLead.name}</DialogTitle>
                      <p className="text-gray-300">{selectedLead.company}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getStatusColor(selectedLead.status)}>
                          {getStatusLabel(selectedLead.status)}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="font-bold">{selectedLead.score}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Select
                    value={selectedLead.status}
                    onValueChange={(value: Lead['status']) => handleStatusChange(selectedLead.id, value)}
                  >
                    <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hot">Hot</SelectItem>
                      <SelectItem value="warm">Varm</SelectItem>
                      <SelectItem value="cold">Kold</SelectItem>
                      <SelectItem value="converted">Konverteret</SelectItem>
                      <SelectItem value="lost">Tabt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-700">
                    <TabsTrigger value="overview">Overblik</TabsTrigger>
                    <TabsTrigger value="notes">Noter ({selectedLead.notes?.length || 0})</TabsTrigger>
                    <TabsTrigger value="activities">Aktiviteter</TabsTrigger>
                    <TabsTrigger value="details">Detaljer</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6 mt-6">
                    {/* Quick Actions */}
                    <div className="flex space-x-3">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Phone className="w-4 h-4 mr-2" />
                        Ring op
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <Mail className="w-4 h-4 mr-2" />
                        Send email
                      </Button>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        <Calendar className="w-4 h-4 mr-2" />
                        Book møde
                      </Button>
                      {selectedLead.website && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={selectedLead.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Website
                          </a>
                        </Button>
                      )}
                    </div>

                    {/* Key Information */}
                    <div className="grid grid-cols-2 gap-6">
                      <Card className="bg-gray-700/50 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-sm">Kontaktinfo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{selectedLead.email}</span>
                          </div>
                          {selectedLead.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{selectedLead.phone}</span>
                            </div>
                          )}
                          {selectedLead.location && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{selectedLead.location}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-700/50 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-sm">Lead Data</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Kilde:</span>
                            <span className="text-sm">{selectedLead.source}</span>
                          </div>
                          {selectedLead.value && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-400">Værdi:</span>
                              <span className="text-sm font-medium text-green-400">
                                {formatCurrency(selectedLead.value)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Hastighed:</span>
                            <span className={`text-sm font-medium ${getUrgencyColor(selectedLead.urgency)}`}>
                              {selectedLead.urgency === 'high' ? 'Høj' : selectedLead.urgency === 'medium' ? 'Mellem' : 'Lav'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-400">Oprettet:</span>
                            <span className="text-sm">{formatRelativeTime(selectedLead.createdAt)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Keywords */}
                    {selectedLead.keywords && selectedLead.keywords.length > 0 && (
                      <Card className="bg-gray-700/50 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-sm">Nøgleord</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {selectedLead.keywords.map((keyword, index) => (
                              <Badge key={index} variant="outline" className="border-gray-500 text-gray-300">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="notes" className="space-y-4 mt-6">
                    {/* Add Note */}
                    <Card className="bg-gray-700/50 border-gray-600">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <Textarea
                            placeholder="Tilføj en note..."
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            className="bg-gray-600 border-gray-500 text-white"
                            rows={3}
                          />
                          <Button 
                            onClick={handleAddNote}
                            disabled={!newNote.trim() || isAddingNote}
                            size="sm"
                          >
                            {isAddingNote ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            ) : (
                              <MessageSquare className="w-4 h-4 mr-2" />
                            )}
                            Tilføj note
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notes List */}
                    <div className="space-y-3">
                      {selectedLead.notes?.map((note) => (
                        <Card key={note.id} className="bg-gray-700/50 border-gray-600">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {note.type === 'call' ? 'Opkald' : note.type === 'email' ? 'Email' : note.type === 'meeting' ? 'Møde' : 'Note'}
                                </Badge>
                                <span className="text-sm text-gray-400">{note.authorName}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {formatRelativeTime(note.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-white whitespace-pre-wrap">{note.content}</p>
                          </CardContent>
                        </Card>
                      )) || (
                        <p className="text-center text-gray-400 py-8">Ingen noter endnu</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="activities" className="space-y-3 mt-6">
                    {selectedLead.activities?.map((activity) => (
                      <Card key={activity.id} className="bg-gray-700/50 border-gray-600">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-[var(--color-tekup-accent-fallback)] rounded-full flex items-center justify-center">
                                <History className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="text-sm text-white">{activity.description}</p>
                                <p className="text-xs text-gray-400">{activity.authorName}</p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(activity.createdAt)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )) || (
                      <p className="text-center text-gray-400 py-8">Ingen aktiviteter endnu</p>
                    )}
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4 mt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="bg-gray-700/50 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-sm">Tidsstempler</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Oprettet:</span>
                            <span>{new Date(selectedLead.createdAt).toLocaleString('da-DK')}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Opdateret:</span>
                            <span>{new Date(selectedLead.updatedAt).toLocaleString('da-DK')}</span>
                          </div>
                          {selectedLead.lastContact && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Sidste kontakt:</span>
                              <span>{new Date(selectedLead.lastContact).toLocaleString('da-DK')}</span>
                            </div>
                          )}
                          {selectedLead.nextFollowUp && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Næste opfølgning:</span>
                              <span className={new Date(selectedLead.nextFollowUp) < new Date() ? 'text-red-400' : ''}>
                                {new Date(selectedLead.nextFollowUp).toLocaleString('da-DK')}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="bg-gray-700/50 border-gray-600">
                        <CardHeader>
                          <CardTitle className="text-sm">Tags</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {selectedLead.tags && selectedLead.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {selectedLead.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="border-gray-500 text-gray-300">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">Ingen tags</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}