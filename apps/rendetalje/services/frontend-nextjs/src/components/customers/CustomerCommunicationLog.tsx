'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Filter,
  Search,
  Download
} from 'lucide-react';
import { Customer, CustomerMessage } from '../../types';
import { api } from '../../lib/api';

interface CommunicationEntry {
  id: string;
  type: 'message' | 'email' | 'phone' | 'meeting';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  sender?: string;
  recipient?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'replied';
  attachments?: string[];
  job_id?: string;
  customer_id: string;
}

interface CustomerCommunicationLogProps {
  customer: Customer;
  jobId?: string;
}

export const CustomerCommunicationLog: React.FC<CustomerCommunicationLogProps> = ({
  customer,
  jobId
}) => {
  const [communications, setCommunications] = useState<CommunicationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'text' | 'email' | 'sms'>('text');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);

  useEffect(() => {
    fetchCommunications();
  }, [customer.id, jobId]);

  const fetchCommunications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/customers/${customer.id}/messages`, {
        params: jobId ? { job_id: jobId } : {}
      });
      
      // Transform messages to communication entries
      const messages: CustomerMessage[] = response.data;
      const entries: CommunicationEntry[] = messages.map(msg => ({
        id: msg.id,
        type: 'message',
        direction: msg.sender_id ? 'outbound' : 'inbound',
        content: msg.message,
        sender: msg.sender?.name || 'System',
        recipient: customer.name,
        timestamp: msg.created_at,
        status: msg.is_read ? 'read' : 'delivered',
        attachments: msg.attachments,
        job_id: msg.job_id,
        customer_id: msg.customer_id,
      }));

      setCommunications(entries);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch communications');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await api.post('/customers/messages', {
        customer_id: customer.id,
        job_id: jobId,
        message: newMessage,
        message_type: messageType
      });

      // Add new message to the list
      const newEntry: CommunicationEntry = {
        id: response.data.id,
        type: 'message',
        direction: 'outbound',
        content: newMessage,
        sender: 'You',
        recipient: customer.name,
        timestamp: new Date().toISOString(),
        status: 'sent',
        job_id: jobId,
        customer_id: customer.id,
      };

      setCommunications(prev => [newEntry, ...prev]);
      setNewMessage('');
      setShowNewMessage(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send message');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return Mail;
      case 'phone': return Phone;
      case 'meeting': return Calendar;
      default: return MessageCircle;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'read':
      case 'replied':
        return CheckCircle;
      case 'delivered':
        return AlertCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'read':
      case 'replied':
        return 'text-green-500';
      case 'delivered':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('da-DK', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('da-DK', { 
        weekday: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('da-DK', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const filteredCommunications = communications.filter(comm => {
    const matchesType = filterType === 'all' || comm.type === filterType;
    const matchesSearch = !searchTerm || 
      comm.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.sender?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  const exportCommunications = () => {
    const csvContent = [
      ['Tidspunkt', 'Type', 'Retning', 'Afsender', 'Modtager', 'Indhold', 'Status'],
      ...filteredCommunications.map(comm => [
        formatTimestamp(comm.timestamp),
        comm.type,
        comm.direction === 'inbound' ? 'Indgående' : 'Udgående',
        comm.sender || '',
        comm.recipient || '',
        comm.content.replace(/,/g, ';'), // Replace commas to avoid CSV issues
        comm.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${customer.name.toLowerCase().replace(/\s+/g, '_')}_kommunikation.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Kommunikationslog</h3>
          <p className="text-gray-600">Alle kommunikationer med {customer.name}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowNewMessage(!showNewMessage)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Ny Besked
          </button>
          <button
            onClick={exportCommunications}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Eksporter
          </button>
        </div>
      </div>

      {/* New Message Form */}
      {showNewMessage && (
        <div className="bg-white rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">Send Besked</h4>
            <button
              onClick={() => setShowNewMessage(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="text">Besked</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Besked</label>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Skriv din besked her..."
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowNewMessage(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annuller
            </button>
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
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Søg i kommunikationer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alle typer</option>
              <option value="message">Beskeder</option>
              <option value="email">Emails</option>
              <option value="phone">Telefonopkald</option>
              <option value="meeting">Møder</option>
            </select>
          </div>
        </div>
      </div>

      {/* Communications List */}
      <div className="bg-white rounded-lg border">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {filteredCommunications.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen kommunikationer</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterType !== 'all' 
                ? 'Ingen kommunikationer matcher dine søgekriterier'
                : 'Start en samtale ved at sende den første besked'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredCommunications.map((comm) => {
              const TypeIcon = getTypeIcon(comm.type);
              const StatusIcon = getStatusIcon(comm.status);
              
              return (
                <div key={comm.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg ${
                      comm.direction === 'inbound' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <TypeIcon className={`w-4 h-4 ${
                        comm.direction === 'inbound' ? 'text-blue-600' : 'text-green-600'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {comm.direction === 'inbound' ? comm.sender : 'Du'}
                          </span>
                          <span className="text-sm text-gray-500">→</span>
                          <span className="text-sm text-gray-600">
                            {comm.direction === 'inbound' ? 'Du' : comm.recipient}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <StatusIcon className={`w-4 h-4 ${getStatusColor(comm.status)}`} />
                          <span className="text-sm text-gray-500">
                            {formatTimestamp(comm.timestamp)}
                          </span>
                        </div>
                      </div>
                      
                      {comm.subject && (
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {comm.subject}
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-700 mt-1">
                        {comm.content}
                      </p>
                      
                      {comm.attachments && comm.attachments.length > 0 && (
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {comm.attachments.length} vedhæftning(er)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};