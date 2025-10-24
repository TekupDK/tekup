'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useJobsStore } from '@/store/jobsStore-v2';
import { useCustomersStore } from '@/store/customersStore-v2';
import { LoadingState, Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  completed: 'success',
  in_progress: 'info',
  pending: 'warning',
  cancelled: 'danger',
};

const statusLabels: Record<string, string> = {
  completed: 'Færdig',
  in_progress: 'I gang',
  pending: 'Afventende',
  cancelled: 'Annulleret',
};

export default function JobsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { jobs, isLoading, error, fetchJobs, createJob, deleteJob } = useJobsStore();
  const { customers, fetchCustomers } = useCustomersStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Fetch data
  useEffect(() => {
    if (isAuthenticated) {
      fetchJobs();
      fetchCustomers();
    }
  }, [isAuthenticated, fetchJobs, fetchCustomers]);

  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesStatus = !filterStatus || job.status === filterStatus;
    const matchesSearch = !searchQuery || 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCreateJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      await createJob({
        customerId: formData.get('customerId') as string,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        status: 'pending',
        priority: formData.get('priority') as 'low' | 'medium' | 'high' | 'urgent',
        scheduledStart: formData.get('scheduledStart') as string,
        estimatedHours: Number(formData.get('estimatedHours')),
      });
      
      setIsModalOpen(false);
      e.currentTarget.reset();
    } catch (error) {
      // Error toast already shown by store
    }
  };

  const handleDeleteJob = async (id: string, title: string) => {
    if (confirm(`Er du sikker på du vil slette job: ${title}?`)) {
      await deleteJob(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center mb-2">
            <div>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-flex items-center"
              >
                ← Tilbage til dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
            </div>
            <Button onClick={() => setIsModalOpen(true)}>
              + Opret job
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Søg"
                placeholder="Søg efter job titel eller beskrivelse..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Alle</option>
                <option value="pending">Afventende</option>
                <option value="in_progress">I gang</option>
                <option value="completed">Færdig</option>
                <option value="cancelled">Annulleret</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <LoadingState
          isLoading={isLoading}
          error={error}
          isEmpty={filteredJobs.length === 0}
          loadingMessage="Henter jobs..."
          emptyMessage="Ingen jobs fundet. Opret dit første job!"
        >
          <div className="grid grid-cols-1 gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      <Badge variant={statusColors[job.status]}>
                        {statusLabels[job.status]}
                      </Badge>
                      {job.priority && job.priority !== 'medium' && (
                        <Badge variant={job.priority === 'urgent' || job.priority === 'high' ? 'danger' : 'default'}>
                          {job.priority}
                        </Badge>
                      )}
                    </div>
                    
                    {job.description && (
                      <p className="text-gray-600 mb-3">{job.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {job.scheduledStart && (
                        <div>
                          <span className="text-gray-500">Start:</span>
                          <p className="font-medium">
                            {new Date(job.scheduledStart).toLocaleDateString('da-DK')}
                          </p>
                        </div>
                      )}
                      {job.estimatedHours && (
                        <div>
                          <span className="text-gray-500">Estimeret:</span>
                          <p className="font-medium">{job.estimatedHours} timer</p>
                        </div>
                      )}
                      {job.actualHours && (
                        <div>
                          <span className="text-gray-500">Faktisk:</span>
                          <p className="font-medium">{job.actualHours} timer</p>
                        </div>
                      )}
                      {job.assignedTo && job.assignedTo.length > 0 && (
                        <div>
                          <span className="text-gray-500">Tildelt:</span>
                          <p className="font-medium">{job.assignedTo.length} personer</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => alert('Edit functionality coming soon')}
                    >
                      Rediger
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteJob(job.id, job.title)}
                    >
                      Slet
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </LoadingState>
      </main>

      {/* Create Job Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Opret nyt job"
      >
        <form onSubmit={handleCreateJob}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kunde
              </label>
              <select
                name="customerId"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Vælg kunde...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Titel"
              name="title"
              placeholder="F.eks. Vinduespudsning"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beskrivelse
              </label>
              <textarea
                name="description"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Beskriv jobbet..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioritet
                </label>
                <select
                  name="priority"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Lav</option>
                  <option value="medium">Medium</option>
                  <option value="high">Høj</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <Input
                label="Estimeret timer"
                name="estimatedHours"
                type="number"
                min="0"
                step="0.5"
                placeholder="8"
              />
            </div>

            <Input
              label="Planlagt start"
              name="scheduledStart"
              type="datetime-local"
            />
          </div>

          <ModalFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Annuller
            </Button>
            <Button type="submit">
              Opret job
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
