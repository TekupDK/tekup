'use client';

import React, { useState, useMemo } from 'react';
import { mockCleaningJobs, mockCustomers } from '../../lib/types/mockData';
import { CleaningJob, Customer } from '../../lib/types/scheduling';

// Simple SVG icon components
const ChatBubbleLeftRightIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const EnvelopeIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const PhoneIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const BellIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const StarIcon = ({ className = "h-5 w-5", filled = false }: { className?: string; filled?: boolean }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const PaperAirplaneIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const ClockIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlusIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

// Communication interfaces
interface CommunicationMessage {
  id: string;
  customerId: string;
  jobId?: string;
  type: 'sms' | 'email' | 'phone' | 'system';
  direction: 'inbound' | 'outbound';
  subject?: string;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  employeeId?: string;
  automated: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface CustomerFeedback {
  id: string;
  customerId: string;
  jobId: string;
  rating: number; // 1-5 stars
  comment: string;
  categories: {
    quality: number;
    punctuality: number;
    professionalism: number;
    value: number;
  };
  timestamp: Date;
  responded: boolean;
  followUpRequired: boolean;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'sms' | 'email';
  trigger: 'job_scheduled' | 'job_reminder' | 'job_completed' | 'feedback_request' | 'payment_reminder';
  subject?: string;
  content: string;
  variables: string[];
  active: boolean;
  timing: number; // minutes before/after trigger
}

// Mock data
const mockCommunicationMessages: CommunicationMessage[] = [
  {
    id: 'msg-001',
    customerId: 'cust-001',
    jobId: 'job-001',
    type: 'sms',
    direction: 'outbound',
    content: 'Hej! Vi kommer i morgen kl. 09:00 til rengøring. Vi medbringer alt udstyr. Mvh TekUp Rengøring',
    timestamp: new Date('2024-09-15T08:00:00'),
    status: 'delivered',
    automated: true,
    priority: 'normal'
  },
  {
    id: 'msg-002',
    customerId: 'cust-002',
    type: 'email',
    direction: 'outbound',
    subject: 'Rengøring afsluttet - Feedback ønskes',
    content: 'Kære kunde, Vi har netop afsluttet rengøringen hos jer. Vi håber I er tilfredse med resultatet. Vi ville sætte stor pris på jeres feedback.',
    timestamp: new Date('2024-09-14T16:30:00'),
    status: 'read',
    employeeId: 'emp-001',
    automated: false,
    priority: 'normal'
  },
  {
    id: 'msg-003',
    customerId: 'cust-003',
    type: 'phone',
    direction: 'inbound',
    content: 'Kunde ringede og ønskede at flytte torsdagsrengøring til fredag pga. møde',
    timestamp: new Date('2024-09-16T10:15:00'),
    status: 'delivered',
    employeeId: 'emp-002',
    automated: false,
    priority: 'high'
  }
];

const mockCustomerFeedback: CustomerFeedback[] = [
  {
    id: 'fb-001',
    customerId: 'cust-001',
    jobId: 'job-001',
    rating: 5,
    comment: 'Fantastisk arbejde! Kontoret har aldrig været renere. Teamet var professionelle og grundige.',
    categories: {
      quality: 5,
      punctuality: 5,
      professionalism: 5,
      value: 4
    },
    timestamp: new Date('2024-09-15T18:00:00'),
    responded: false,
    followUpRequired: false
  },
  {
    id: 'fb-002',
    customerId: 'cust-002',
    jobId: 'job-002',
    rating: 3,
    comment: 'Okay rengøring, men der var støv tilbage på nogle hylder. Kom til tiden.',
    categories: {
      quality: 3,
      punctuality: 5,
      professionalism: 4,
      value: 3
    },
    timestamp: new Date('2024-09-14T17:30:00'),
    responded: false,
    followUpRequired: true
  }
];

const mockNotificationTemplates: NotificationTemplate[] = [
  {
    id: 'template-001',
    name: 'Job påmindelse (SMS)',
    type: 'sms',
    trigger: 'job_reminder',
    content: 'Hej {{customerName}}! Vi kommer i morgen kl. {{time}} til rengøring på {{address}}. Mvh {{companyName}}',
    variables: ['customerName', 'time', 'address', 'companyName'],
    active: true,
    timing: -1440 // 24 timer før
  },
  {
    id: 'template-002',
    name: 'Feedback anmodning (Email)',
    type: 'email',
    trigger: 'feedback_request',
    subject: 'Hvordan var rengøringen? - {{customerName}}',
    content: 'Kære {{customerName}}, Vi har netop afsluttet rengøringen hos jer. Vi håber I er tilfredse med resultatet og ville sætte stor pris på jeres feedback.',
    variables: ['customerName', 'jobDate', 'teamMember'],
    active: true,
    timing: 60 // 1 time efter
  },
  {
    id: 'template-003',
    name: 'Job bekræftelse (Email)',
    type: 'email',
    trigger: 'job_scheduled',
    subject: 'Rengøring bekræftet - {{jobDate}}',
    content: 'Hej {{customerName}}, Din rengøring er nu bekræftet til {{jobDate}} kl. {{time}}. Vi glæder os til at hjælpe dig!',
    variables: ['customerName', 'jobDate', 'time', 'serviceType'],
    active: true,
    timing: 0 // Med det samme
  }
];

export default function CustomerCommunicationHub() {
  const [activeView, setActiveView] = useState<'messages' | 'feedback' | 'notifications' | 'templates'>('messages');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [messageFilter, setMessageFilter] = useState<'all' | 'sms' | 'email' | 'phone'>('all');
  const [messages] = useState<CommunicationMessage[]>(mockCommunicationMessages);
  const [feedback] = useState<CustomerFeedback[]>(mockCustomerFeedback);
  const [templates] = useState<NotificationTemplate[]>(mockNotificationTemplates);
  const [newMessage, setNewMessage] = useState<string>('');
  const [selectedMessageType, setSelectedMessageType] = useState<'sms' | 'email'>('sms');

  // Filter messages
  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      const customerMatch = selectedCustomer === 'all' || message.customerId === selectedCustomer;
      const typeMatch = messageFilter === 'all' || message.type === messageFilter;
      return customerMatch && typeMatch;
    });
  }, [messages, selectedCustomer, messageFilter]);

  // Calculate communication stats
  const communicationStats = useMemo(() => {
    const totalMessages = messages.length;
    const todayMessages = messages.filter(msg => 
      new Date(msg.timestamp).toDateString() === new Date().toDateString()
    ).length;
    const avgRating = feedback.length > 0 
      ? feedback.reduce((sum, fb) => sum + fb.rating, 0) / feedback.length 
      : 0;
    const pendingFeedback = feedback.filter(fb => fb.followUpRequired && !fb.responded).length;

    return {
      totalMessages,
      todayMessages,
      avgRating: Math.round(avgRating * 10) / 10,
      pendingFeedback
    };
  }, [messages, feedback]);

  const getCustomerName = (customerId: string) => {
    const customer = mockCustomers.find(c => c.id === customerId);
    return customer ? customer.name : 'Ukendt kunde';
  };

  const getMessageStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-blue-600 bg-blue-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'read': return 'text-purple-600 bg-purple-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Mock sending message
    console.log('Sending message:', {
      type: selectedMessageType,
      content: newMessage,
      customer: selectedCustomer
    });
    
    setNewMessage('');
    alert(`${selectedMessageType.toUpperCase()} sendt til kunde!`);
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('da-DK', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(timestamp);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Kunde Kommunikation
            </h1>
            <p className="text-gray-600">
              SMS, email, feedback og kommunikationshistorik med kunder
            </p>
          </div>
          
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Ny besked
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total beskeder</p>
                <p className="text-2xl font-semibold text-gray-900">{communicationStats.totalMessages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">I dag</p>
                <p className="text-2xl font-semibold text-gray-900">{communicationStats.todayMessages}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <StarIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Gennemsnitlig rating</p>
                <p className="text-2xl font-semibold text-gray-900">{communicationStats.avgRating}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <BellIcon className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Afventende feedback</p>
                <p className="text-2xl font-semibold text-gray-900">{communicationStats.pendingFeedback}</p>
              </div>
            </div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="bg-white rounded-lg shadow-lg p-1 mb-6 flex space-x-1 max-w-2xl">
          {[
            { id: 'messages', name: 'Beskeder', icon: '💬' },
            { id: 'feedback', name: 'Feedback', icon: '⭐' },
            { id: 'notifications', name: 'Notifikationer', icon: '🔔' },
            { id: 'templates', name: 'Skabeloner', icon: '📝' }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeView === view.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {view.icon} {view.name}
            </button>
          ))}
        </div>

        {activeView === 'messages' && (
          <>
            {/* Message Filters */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Alle kunder</option>
                  {mockCustomers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>

                <select
                  value={messageFilter}
                  onChange={(e) => setMessageFilter(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Alle typer</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="phone">Telefon</option>
                </select>
              </div>
            </div>

            {/* Message List */}
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Kommunikationshistorik
                </h3>
              </div>
              
              <div className="divide-y divide-gray-200">
                {filteredMessages.map((message) => (
                  <div key={message.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center space-x-2">
                            {message.type === 'sms' && <PhoneIcon className="h-4 w-4 text-green-600" />}
                            {message.type === 'email' && <EnvelopeIcon className="h-4 w-4 text-blue-600" />}
                            {message.type === 'phone' && <PhoneIcon className="h-4 w-4 text-purple-600" />}
                            {message.type === 'system' && <BellIcon className="h-4 w-4 text-gray-600" />}
                            
                            <span className="font-medium text-gray-900">
                              {getCustomerName(message.customerId)}
                            </span>
                          </div>

                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            message.direction === 'outbound' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {message.direction === 'outbound' ? 'Sendt' : 'Modtaget'}
                          </span>

                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMessageStatusColor(message.status)}`}>
                            {message.status === 'sent' && 'Sendt'}
                            {message.status === 'delivered' && 'Leveret'}
                            {message.status === 'read' && 'Læst'}
                            {message.status === 'failed' && 'Fejlet'}
                          </span>

                          {message.priority !== 'normal' && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(message.priority)}`}>
                              {message.priority === 'urgent' && 'Urgent'}
                              {message.priority === 'high' && 'Høj'}
                              {message.priority === 'low' && 'Lav'}
                            </span>
                          )}

                          {message.automated && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Automatisk
                            </span>
                          )}
                        </div>

                        {message.subject && (
                          <h4 className="font-medium text-gray-900 mb-1">
                            {message.subject}
                          </h4>
                        )}

                        <p className="text-gray-700 mb-2">
                          {message.content}
                        </p>

                        <div className="text-xs text-gray-500">
                          {formatTimestamp(message.timestamp)}
                          {message.employeeId && ` • Håndteret af medarbejder`}
                          {message.jobId && ` • Job: ${message.jobId}`}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Message */}
            <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Send hurtig besked
              </h3>
              
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <select
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Vælg kunde</option>
                    {mockCustomers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedMessageType}
                    onChange={(e) => setSelectedMessageType(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                  placeholder="Skriv din besked her..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {newMessage.length}/160 tegn {selectedMessageType === 'sms' && '(SMS)'}
                  </span>
                  
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || !selectedCustomer}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeView === 'feedback' && (
          <div className="space-y-6">
            {feedback.map((fb) => (
              <div key={fb.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getCustomerName(fb.customerId)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Job: {fb.jobId} • {formatTimestamp(fb.timestamp)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`h-5 w-5 ${
                          star <= fb.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        filled={star <= fb.rating}
                      />
                    ))}
                    <span className="ml-2 text-lg font-semibold text-gray-900">
                      {fb.rating}/5
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {Object.entries(fb.categories).map(([category, rating]) => (
                    <div key={category} className="text-center">
                      <p className="text-sm text-gray-600 mb-1">
                        {category === 'quality' && 'Kvalitet'}
                        {category === 'punctuality' && 'Punktlighed'}
                        {category === 'professionalism' && 'Professionalisme'}
                        {category === 'value' && 'Værdi'}
                      </p>
                      <div className="flex justify-center space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className={`h-4 w-4 ${
                              star <= rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            filled={star <= rating}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-gray-700 mb-4">
                  "{fb.comment}"
                </p>

                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    {fb.followUpRequired && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Opfølgning påkrævet
                      </span>
                    )}
                    {fb.responded && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Besvaret
                      </span>
                    )}
                  </div>

                  {!fb.responded && (
                    <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                      Besvar feedback
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'templates' && (
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Besked skabeloner
              </h3>
            </div>

            <div className="divide-y divide-gray-200">
              {templates.map((template) => (
                <div key={template.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {template.name}
                        </h4>
                        
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          template.type === 'sms' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {template.type.toUpperCase()}
                        </span>

                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          template.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {template.active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </div>

                      {template.subject && (
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Emne: {template.subject}
                        </p>
                      )}

                      <p className="text-gray-700 mb-2">
                        {template.content}
                      </p>

                      <div className="text-xs text-gray-500">
                        Trigger: {template.trigger} • Timing: {template.timing} min
                        {template.variables.length > 0 && (
                          <> • Variabler: {template.variables.join(', ')}</>
                        )}
                      </div>
                    </div>

                    <button className="ml-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                      Rediger
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}