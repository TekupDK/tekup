/**
 * Jobs Store - Integrated with Backend API
 *
 * Manages job state and operations with real backend
 */

import { create } from "zustand";
import { apiClient, ApiError } from "@/lib/api-client";
import { toastService } from "@/lib/toast";
import type { Job as ApiJob } from "@/lib/api-client";

export interface Job {
  id: string;
  organizationId: string;
  customerId: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high" | "urgent";
  scheduledStart?: string;
  scheduledEnd?: string;
  estimatedHours?: number;
  actualHours?: number;
  assignedTo?: string[];
  address?: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface JobsState {
  jobs: Job[];
  selectedJob: Job | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchJobs: (filters?: {
    status?: string;
    customerId?: string;
  }) => Promise<void>;
  fetchJobById: (id: string) => Promise<void>;
  createJob: (job: Partial<Job>) => Promise<Job>;
  updateJob: (id: string, updates: Partial<Job>) => Promise<Job>;
  deleteJob: (id: string) => Promise<void>;
  setSelectedJob: (job: Job | null) => void;
  clearError: () => void;
}

// Convert API job to store job format
const apiJobToJob = (apiJob: ApiJob): Job => ({
  id: apiJob.id,
  organizationId: apiJob.organization_id,
  customerId: apiJob.customer_id,
  title: apiJob.title,
  description: apiJob.description,
  status: apiJob.status,
  priority: apiJob.priority,
  scheduledStart: apiJob.scheduled_start,
  scheduledEnd: apiJob.scheduled_end,
  estimatedHours: apiJob.estimated_hours,
  actualHours: apiJob.actual_hours,
  assignedTo: apiJob.assigned_to,
  address: apiJob.address,
  metadata: apiJob.metadata,
  createdAt: apiJob.created_at,
  updatedAt: apiJob.updated_at,
});

// Convert store job to API job format
const jobToApiJob = (job: Partial<Job>): Partial<ApiJob> => ({
  customer_id: job.customerId,
  title: job.title,
  description: job.description,
  status: job.status,
  priority: job.priority,
  scheduled_start: job.scheduledStart,
  scheduled_end: job.scheduledEnd,
  estimated_hours: job.estimatedHours,
  actual_hours: job.actualHours,
  assigned_to: job.assignedTo,
  address: job.address,
  metadata: job.metadata,
});

export const useJobsStore = create<JobsState>((set, get) => ({
  jobs: [],
  selectedJob: null,
  isLoading: false,
  error: null,

  fetchJobs: async (filters) => {
    set({ isLoading: true, error: null });

    try {
      const apiJobs = await apiClient.getJobs(filters);
      const jobs = apiJobs.map(apiJobToJob);

      set({ jobs, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? (error.data as { message?: string })?.message ||
            "Kunne ikke hente jobs"
          : "Kunne ikke hente jobs";

      set({
        isLoading: false,
        error: errorMessage,
      });

      toastService.error(errorMessage);
    }
  },

  fetchJobById: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const apiJob = await apiClient.getJob(id);
      const job = apiJobToJob(apiJob);

      set({ selectedJob: job, isLoading: false });
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? (error.data as { message?: string })?.message ||
            "Kunne ikke hente job"
          : "Kunne ikke hente job";

      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },

  createJob: async (jobData: Partial<Job>) => {
    set({ isLoading: true, error: null });

    try {
      const apiJob = await apiClient.createJob(jobToApiJob(jobData));
      const newJob = apiJobToJob(apiJob);

      set((state) => ({
        jobs: [newJob, ...state.jobs],
        isLoading: false,
      }));

      toastService.success("Job oprettet succesfuldt");
      return newJob;
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? (error.data as { message?: string })?.message ||
            "Kunne ikke oprette job"
          : "Kunne ikke oprette job";

      set({
        isLoading: false,
        error: errorMessage,
      });

      toastService.error(errorMessage);
      throw error;
    }
  },

  updateJob: async (id: string, updates: Partial<Job>) => {
    set({ isLoading: true, error: null });

    try {
      const apiJob = await apiClient.updateJob(id, jobToApiJob(updates));
      const updatedJob = apiJobToJob(apiJob);

      set((state) => ({
        jobs: state.jobs.map((job) => (job.id === id ? updatedJob : job)),
        selectedJob:
          state.selectedJob?.id === id ? updatedJob : state.selectedJob,
        isLoading: false,
      }));

      toastService.success("Job opdateret succesfuldt");
      return updatedJob;
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? (error.data as { message?: string })?.message ||
            "Kunne ikke opdatere job"
          : "Kunne ikke opdatere job";

      set({
        isLoading: false,
        error: errorMessage,
      });

      toastService.error(errorMessage);
      throw error;
    }
  },

  deleteJob: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      await apiClient.deleteJob(id);

      set((state) => ({
        jobs: state.jobs.filter((job) => job.id !== id),
        selectedJob: state.selectedJob?.id === id ? null : state.selectedJob,
        isLoading: false,
      }));

      toastService.success("Job slettet succesfuldt");
    } catch (error) {
      const errorMessage =
        error instanceof ApiError
          ? (error.data as { message?: string })?.message ||
            "Kunne ikke slette job"
          : "Kunne ikke slette job";

      set({
        isLoading: false,
        error: errorMessage,
      });

      toastService.error(errorMessage);
      throw error;
    }
  },

  setSelectedJob: (job: Job | null) => {
    set({ selectedJob: job });
  },

  clearError: () => {
    set({ error: null });
  },
}));
