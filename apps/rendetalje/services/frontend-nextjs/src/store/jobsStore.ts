import { create } from 'zustand';

export interface Job {
  id: string;
  customerId: string;
  customerName: string;
  assignedTo?: string;
  type: 'window' | 'facade' | 'gutter' | 'pressure_wash' | 'other';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  address: string;
  description?: string;
  estimatedHours?: number;
  actualHours?: number;
  price?: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface JobsState {
  jobs: Job[];
  selectedJob: Job | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchJobs: () => Promise<void>;
  fetchJobById: (id: string) => Promise<void>;
  createJob: (job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<void>;
  deleteJob: (id: string) => Promise<void>;
  setSelectedJob: (job: Job | null) => void;
  clearError: () => void;
}

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  selectedJob: null,
  isLoading: false,
  error: null,
  
  fetchJobs: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/jobs');
      
      if (!response.ok) {
        throw new Error('Kunne ikke hente jobs');
      }
      
      const data = await response.json();
      set({ jobs: data.jobs, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Fejl ved hentning af jobs',
      });
    }
  },
  
  fetchJobById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/jobs/${id}`);
      
      if (!response.ok) {
        throw new Error('Kunne ikke hente job');
      }
      
      const data = await response.json();
      set({ selectedJob: data.job, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Fejl ved hentning af job',
      });
    }
  },
  
  createJob: async (job) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(job),
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke oprette job');
      }
      
      const data = await response.json();
      set((state) => ({
        jobs: [...state.jobs, data.job],
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Fejl ved oprettelse af job',
      });
      throw error;
    }
  },
  
  updateJob: async (id, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke opdatere job');
      }
      
      const data = await response.json();
      set((state) => ({
        jobs: state.jobs.map((job) => (job.id === id ? data.job : job)),
        selectedJob: state.selectedJob?.id === id ? data.job : state.selectedJob,
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Fejl ved opdatering af job',
      });
      throw error;
    }
  },
  
  deleteJob: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Kunne ikke slette job');
      }
      
      set((state) => ({
        jobs: state.jobs.filter((job) => job.id !== id),
        selectedJob: state.selectedJob?.id === id ? null : state.selectedJob,
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Fejl ved sletning af job',
      });
      throw error;
    }
  },
  
  setSelectedJob: (job) => {
    set({ selectedJob: job });
  },
  
  clearError: () => {
    set({ error: null });
  },
}));
