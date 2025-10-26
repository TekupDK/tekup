'use client';

import React, { useState, useMemo } from 'react';
import { CleaningJob, CleaningJobType, RecurringConfig } from '../../lib/types/scheduling';
import { mockCleaningJobs } from '../../lib/types/mockData';

// Simple SVG icon components
const CalendarIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const RepeatIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ClockIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlusIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const PencilIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const PauseIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlayIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M12 21A9 9 0 103 12a9 9 0 009 9z" />
  </svg>
);

const TrashIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

// Extended interface for recurring job with additional properties
interface RecurringJob extends CleaningJob {
  recurring: RecurringConfig;
  nextOccurrence: Date;
  totalOccurrences: number;
  completedOccurrences: number;
  estimatedMonthlyRevenue: number;
}

// Interface for creating new recurring job
interface NewRecurringJob {
  customer: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    phone: string;
    email: string;
  };
  jobType: CleaningJobType;
  title: string;
  description: string;
  estimatedDuration: number;
  basePrice: number;
  recurring: RecurringConfig;
  startDate: Date;
  endDate?: Date;
  preferredTime: string;
  specialRequirements: string[];
}

export default function RecurringJobsManagement() {
  const [activeTab, setActiveTab] = useState<'active' | 'paused' | 'expired'>('active');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState<RecurringJob | null>(null);
  const [newJob, setNewJob] = useState<Partial<NewRecurringJob>>({
    customer: {
      name: '',
      address: '',
      city: '',
      postalCode: '',
      phone: '',
      email: ''
    },
    jobType: 'kontorrenhold',
    title: '',
    description: '',
    estimatedDuration: 120,
    basePrice: 350,
    recurring: {
      frequency: 'weekly',
      interval: 1,
      weekdays: [1], // Monday
      endDate: undefined,
      skipHolidays: false,
      autoConfirm: true
    },
    startDate: new Date(),
    preferredTime: '09:00',
    specialRequirements: []
  });

  // Mock recurring jobs data - in real app, this would come from API
  const recurringJobs: RecurringJob[] = useMemo(() => {
    return mockCleaningJobs
      .filter(job => job.recurring)
      .map(job => ({
        ...job,
        recurring: job.recurring!,
        nextOccurrence: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        totalOccurrences: 52, // Assuming yearly contracts
        completedOccurrences: Math.floor(Math.random() * 20),
        estimatedMonthlyRevenue: job.cost.total * 4 // Assuming weekly
      }));
  }, []);

  // Filter jobs by status
  const filteredJobs = useMemo(() => {
    const now = new Date();
    return recurringJobs.filter(job => {
      switch (activeTab) {
        case 'active':
          return job.status === 'scheduled' && (!job.recurring.endDate || job.recurring.endDate > now);
        case 'paused':
          return job.status === 'paused';
        case 'expired':
          return job.recurring.endDate && job.recurring.endDate <= now;
        default:
          return false;
      }
    });
  }, [recurringJobs, activeTab]);

  // Calculate statistics
  const stats = useMemo(() => {
    const active = recurringJobs.filter(job => job.status === 'scheduled').length;
    const paused = recurringJobs.filter(job => job.status === 'paused').length;
    const totalRevenue = recurringJobs
      .filter(job => job.status === 'scheduled')
      .reduce((sum, job) => sum + job.estimatedMonthlyRevenue, 0);
    
    return { active, paused, totalRevenue };
  }, [recurringJobs]);

  const formatFrequency = (recurring: RecurringConfig) => {
    const { frequency, interval, weekdays } = recurring;
    
    if (frequency === 'daily') {
      return interval === 1 ? 'Dagligt' : `Hver ${interval}. dag`;
    }
    
    if (frequency === 'weekly') {
      const days = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
      const dayNames = weekdays?.map((day: number) => days[day]).join(', ') || '';
      return interval === 1 ? `Ugentligt (${dayNames})` : `Hver ${interval}. uge (${dayNames})`;
    }
    
    if (frequency === 'monthly') {
      return interval === 1 ? 'Månedligt' : `Hver ${interval}. måned`;
    }
    
    return 'Brugerdefineret';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-green-100 text-green-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateJob = () => {
    // In real app, this would call API to create the recurring job
    console.log('Creating recurring job:', newJob);
    setShowCreateForm(false);
    setNewJob({
      customer: {
        name: '',
        address: '',
        city: '',
        postalCode: '',
        phone: '',
        email: ''
      },
      jobType: 'kontorrenhold',
      title: '',
      description: '',
      estimatedDuration: 120,
      basePrice: 350,
      recurring: {
        frequency: 'weekly',
        interval: 1,
        weekdays: [1],
        endDate: undefined,
        skipHolidays: false,
        autoConfirm: true
      },
      startDate: new Date(),
      preferredTime: '09:00',
      specialRequirements: []
    });
  };

  const handlePauseJob = (jobId: string) => {
    console.log('Pausing job:', jobId);
    // In real app, update job status via API
  };

  const handleResumeJob = (jobId: string) => {
    console.log('Resuming job:', jobId);
    // In real app, update job status via API
  };

  const handleDeleteJob = (jobId: string) => {
    if (confirm('Er du sikker på, at du vil slette dette tilbagevendende job?')) {
      console.log('Deleting job:', jobId);
      // In real app, delete job via API
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Tilbagevendende Jobs
            </h1>
            <p className="text-gray-600">
              Administrer faste rengøringskontrakter og automatiske gentagelser
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nyt tilbagevendende job</span>
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <RepeatIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Aktive kontrakter</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <PauseIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Pauserede kontrakter</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.paused}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Månedlig omsætning</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalRevenue.toLocaleString()} DKK</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'active', label: 'Aktive', count: stats.active },
                { id: 'paused', label: 'Pauserede', count: stats.paused },
                { id: 'expired', label: 'Udløbne', count: 0 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Jobs List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Job Header */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {job.customer.name}
                    </h3>
                    <p className="text-purple-100">
                      {job.jobType === 'kontorrenhold' && 'Kontorrenhold'}
                      {job.jobType === 'privatrenhold' && 'Privatrenhold'}
                      {job.jobType === 'byggerenhold' && 'Byggerenhold'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingJob(job)}
                      className="text-purple-200 hover:text-white"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    {job.status === 'scheduled' ? (
                      <button
                        onClick={() => handlePauseJob(job.id)}
                        className="text-purple-200 hover:text-white"
                      >
                        <PauseIcon className="h-5 w-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleResumeJob(job.id)}
                        className="text-purple-200 hover:text-white"
                      >
                        <PlayIcon className="h-5 w-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="text-purple-200 hover:text-white"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="px-6 py-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Frekvens</p>
                    <p className="font-medium text-gray-900">
                      {formatFrequency(job.recurring)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Næste udførelse</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(job.nextOccurrence)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                      {job.status === 'scheduled' && 'Aktiv'}
                      {job.status === 'paused' && 'Pauseret'}
                      {job.status === 'completed' && 'Afsluttet'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Månedlig værdi</p>
                    <p className="font-medium text-green-600">
                      {job.estimatedMonthlyRevenue.toLocaleString()} DKK
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-500 mb-2">Adresse</p>
                  <p className="text-sm text-gray-900">
                    {job.location.address}, {job.location.city}
                  </p>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Udført</span>
                    <span className="font-medium">
                      {job.completedOccurrences} / {job.totalOccurrences}
                    </span>
                  </div>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${(job.completedOccurrences / job.totalOccurrences) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredJobs.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <RepeatIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ingen {activeTab === 'active' ? 'aktive' : activeTab === 'paused' ? 'pauserede' : 'udløbne'} tilbagevendende jobs
            </h3>
            <p className="text-gray-500 mb-6">
              {activeTab === 'active' 
                ? 'Opret dit første tilbagevendende job for at få automatiske gentagelser.'
                : 'Der er ingen jobs i denne kategori på nuværende tidspunkt.'
              }
            </p>
            {activeTab === 'active' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-purple-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Opret tilbagevendende job
              </button>
            )}
          </div>
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Nyt tilbagevendende job
                </h2>
              </div>
              
              <div className="px-6 py-4 space-y-4">
                {/* Customer Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Kunde oplysninger</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Navn
                      </label>
                      <input
                        type="text"
                        value={newJob.customer?.name || ''}
                        onChange={(e) => setNewJob(prev => ({
                          ...prev,
                          customer: { ...prev.customer!, name: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={newJob.customer?.email || ''}
                        onChange={(e) => setNewJob(prev => ({
                          ...prev,
                          customer: { ...prev.customer!, email: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Job Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Job detaljer</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job type
                      </label>
                      <select
                        value={newJob.jobType || 'kontorrenhold'}
                        onChange={(e) => setNewJob(prev => ({
                          ...prev,
                          jobType: e.target.value as CleaningJobType
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="kontorrenhold">Kontorrenhold</option>
                        <option value="privatrenhold">Privatrenhold</option>
                        <option value="flytterenhold">Flytterenhold</option>
                        <option value="byggerenhold">Byggerenhold</option>
                        <option value="vinduespudsning">Vinduespudsning</option>
                        <option value="dybrengøring">Dybrengøring</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimeret varighed (minutter)
                      </label>
                      <input
                        type="number"
                        min="30"
                        max="480"
                        value={newJob.estimatedDuration || 120}
                        onChange={(e) => setNewJob(prev => ({
                          ...prev,
                          estimatedDuration: parseInt(e.target.value)
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Recurrence Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Gentagelse</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Frekvens
                      </label>
                      <select
                        value={newJob.recurring?.frequency || 'weekly'}
                        onChange={(e) => setNewJob(prev => ({
                          ...prev,
                          recurring: { 
                            ...prev.recurring!, 
                            frequency: e.target.value as any 
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="daily">Dagligt</option>
                        <option value="weekly">Ugentligt</option>
                        <option value="monthly">Månedligt</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Interval
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={newJob.recurring?.interval || 1}
                        onChange={(e) => setNewJob(prev => ({
                          ...prev,
                          recurring: { 
                            ...prev.recurring!, 
                            interval: parseInt(e.target.value) 
                          }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start dato
                      </label>
                      <input
                        type="date"
                        value={newJob.startDate?.toISOString().split('T')[0] || ''}
                        onChange={(e) => setNewJob(prev => ({
                          ...prev,
                          startDate: new Date(e.target.value)
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Annuller
                </button>
                <button
                  onClick={handleCreateJob}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700"
                >
                  Opret job
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}