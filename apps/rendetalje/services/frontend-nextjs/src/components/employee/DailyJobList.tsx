'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Navigation, 
  Camera, 
  CheckCircle, 
  AlertCircle,
  Play,
  Pause,
  Square,
  FileText,
  Star,
  Route
} from 'lucide-react';
import { Job, Customer } from '../../types';
import { api } from '../../lib/api';

interface DailyJob extends Job {
  customer: Customer;
  estimatedTravelTime?: number;
  distanceFromPrevious?: number;
  routeOrder?: number;
}

interface DailyJobListProps {
  employeeId: string;
  date?: string;
}

export const DailyJobList: React.FC<DailyJobListProps> = ({
  employeeId,
  date = new Date().toISOString().split('T')[0]
}) => {
  const [jobs, setJobs] = useState<DailyJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<DailyJob | null>(null);

  useEffect(() => {
    fetchDailyJobs();
  }, [employeeId, date]);

  const fetchDailyJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/jobs', {
        params: {
          employee_id: employeeId,
          date: date,
          status: 'scheduled,confirmed,in_progress'
        }
      });
      
      setJobs(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch daily jobs');
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId: string, status: string) => {
    try {
      await api.patch(`/jobs/${jobId}`, { status });
      
      // Update local state
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: status as any } : job
      ));
      
      if (status === 'in_progress') {
        setActiveJob(jobId);
      } else if (status === 'completed') {
        setActiveJob(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update job status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Planlagt';
      case 'confirmed': return 'Bekræftet';
      case 'in_progress': return 'I gang';
      case 'completed': return 'Fuldført';
      default: return status;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('da-DK', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openNavigation = (address: any) => {
    const addressString = `${address.street}, ${address.postal_code} ${address.city}`;
    const encodedAddress = encodeURIComponent(addressString);
    
    // Try to open in Google Maps app first, fallback to web
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  };

  const callCustomer = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const emailCustomer = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchDailyJobs}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Prøv igen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dagens Jobs</h2>
          <p className="text-gray-600">
            {new Date(date).toLocaleDateString('da-DK', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{jobs.length} jobs</span>
          {activeJob && (
            <div className="flex items-center text-yellow-600">
              <Play className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">Aktiv</span>
            </div>
          )}
        </div>
      </div>

      {/* Route Overview */}
      {jobs.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Route className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <h3 className="font-medium text-blue-900">Optimeret Rute</h3>
                <p className="text-sm text-blue-700">
                  Estimeret køretid: {jobs.reduce((total, job) => total + (job.estimatedTravelTime || 0), 0)} min
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const addresses = jobs.map(job => 
                  `${job.location.street}, ${job.location.postal_code} ${job.location.city}`
                ).join('|');
                const url = `https://www.google.com/maps/dir/?api=1&waypoints=${encodeURIComponent(addresses)}`;
                window.open(url, '_blank');
              }}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              Åbn Rute
            </button>
          </div>
        </div>
      )}

      {/* Job List */}
      {jobs.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Ingen jobs i dag</h3>
          <p className="mt-1 text-sm text-gray-500">
            Du har ingen planlagte jobs for denne dag
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job, index) => (
            <div
              key={job.id}
              className={`bg-white rounded-lg border-2 p-4 transition-all ${
                activeJob === job.id 
                  ? 'border-yellow-300 bg-yellow-50' 
                  : selectedJob?.id === job.id
                  ? 'border-blue-300'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Job Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {job.service_type}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Job #{job.job_number}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(job.status)}`}>
                    {getStatusText(job.status)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {formatTime(job.scheduled_date)}
                  </span>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Kunde</h4>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-gray-900">
                      <User className="w-4 h-4 mr-2 text-gray-400" />
                      {job.customer.name}
                    </div>
                    {job.customer.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        <button
                          onClick={() => callCustomer(job.customer.phone!)}
                          className="hover:text-blue-600 underline"
                        >
                          {job.customer.phone}
                        </button>
                      </div>
                    )}
                    {job.customer.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        <button
                          onClick={() => emailCustomer(job.customer.email!)}
                          className="hover:text-blue-600 underline"
                        >
                          {job.customer.email}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Adresse</h4>
                  <div className="flex items-start text-sm text-gray-900">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5" />
                    <div>
                      <div>{job.location.street}</div>
                      <div>{job.location.postal_code} {job.location.city}</div>
                      <button
                        onClick={() => openNavigation(job.location)}
                        className="text-blue-600 hover:text-blue-800 underline mt-1 flex items-center"
                      >
                        <Navigation className="w-3 h-3 mr-1" />
                        Få vejvisning
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Detaljer</h4>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {job.estimated_duration} min
                  </div>
                </div>
                
                {job.special_instructions && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                    <div className="flex items-start">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Særlige instruktioner</p>
                        <p className="text-sm text-yellow-700 mt-1">{job.special_instructions}</p>
                      </div>
                    </div>
                  </div>
                )}

                {job.customer.preferences?.special_instructions && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <div className="flex items-start">
                      <FileText className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Kunde præferencer</p>
                        <p className="text-sm text-blue-700 mt-1">{job.customer.preferences.special_instructions}</p>
                        {job.customer.preferences.key_location && (
                          <p className="text-sm text-blue-700 mt-1">
                            <strong>Nøgle:</strong> {job.customer.preferences.key_location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  {job.status === 'scheduled' && (
                    <button
                      onClick={() => updateJobStatus(job.id, 'confirmed')}
                      className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Bekræft Ankomst
                    </button>
                  )}
                  
                  {job.status === 'confirmed' && (
                    <button
                      onClick={() => updateJobStatus(job.id, 'in_progress')}
                      className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Start Job
                    </button>
                  )}
                  
                  {job.status === 'in_progress' && (
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="bg-yellow-600 text-white px-3 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                    >
                      <Square className="w-4 h-4" />
                      Afslut Job
                    </button>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                    className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded Job Details */}
              {selectedJob?.id === job.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Tjekliste</h5>
                      <div className="space-y-2">
                        {job.checklist?.map((item, idx) => (
                          <div key={idx} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() => {
                                // Update checklist item
                                const updatedChecklist = [...job.checklist];
                                updatedChecklist[idx] = { ...item, completed: !item.completed };
                                setJobs(prev => prev.map(j => 
                                  j.id === job.id ? { ...j, checklist: updatedChecklist } : j
                                ));
                              }}
                              className="mr-2"
                            />
                            <span className={`text-sm ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {item.title}
                            </span>
                            {item.required_photo && (
                              <Camera className="w-3 h-3 ml-2 text-gray-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Kunde Information</h5>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div>Total jobs: {job.customer.total_jobs}</div>
                        <div>Tilfredshed: {job.customer.satisfaction_score ? (
                          <div className="inline-flex items-center">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${
                                  i < Math.round(job.customer.satisfaction_score!) 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="ml-1">{job.customer.satisfaction_score.toFixed(1)}</span>
                          </div>
                        ) : 'Ingen vurdering'}</div>
                      </div>
                    </div>
                  </div>

                  {job.status === 'in_progress' && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => updateJobStatus(job.id, 'completed')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Marker som Fuldført
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};