/**
 * Customers Store - Integrated with Backend API
 * 
 * Manages customer state and operations with real backend
 */

import { create } from 'zustand';
import { apiClient, ApiError } from '@/lib/api-client';
import type { Customer as ApiCustomer } from '@/lib/api-client';

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  cvr?: string;
  address?: {
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;
  };
  notes?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface CustomersState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  
  // Actions
  fetchCustomers: (params?: { search?: string }) => Promise<void>;
  fetchCustomerById: (id: string) => Promise<void>;
  createCustomer: (customer: Partial<Customer>) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  setSelectedCustomer: (customer: Customer | null) => void;
  setSearchQuery: (query: string) => void;
  clearError: () => void;
}

// Convert API customer to store customer format
const apiCustomerToCustomer = (apiCustomer: ApiCustomer): Customer => ({
  id: apiCustomer.id,
  organizationId: apiCustomer.organization_id,
  name: apiCustomer.name,
  email: apiCustomer.email,
  phone: apiCustomer.phone,
  companyName: apiCustomer.company_name,
  cvr: apiCustomer.cvr,
  address: apiCustomer.address,
  notes: apiCustomer.notes,
  tags: apiCustomer.tags,
  metadata: apiCustomer.metadata,
  createdAt: apiCustomer.created_at,
  updatedAt: apiCustomer.updated_at,
});

// Convert store customer to API customer format
const customerToApiCustomer = (customer: Partial<Customer>): Partial<ApiCustomer> => ({
  name: customer.name,
  email: customer.email,
  phone: customer.phone,
  company_name: customer.companyName,
  cvr: customer.cvr,
  address: customer.address,
  notes: customer.notes,
  tags: customer.tags,
  metadata: customer.metadata,
});

export const useCustomersStore = create<CustomersState>((set, get) => ({
  customers: [],
  selectedCustomer: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  
  fetchCustomers: async (params) => {
    set({ isLoading: true, error: null });
    
    try {
      const apiCustomers = await apiClient.getCustomers(params);
      const customers = apiCustomers.map(apiCustomerToCustomer);
      
      set({ customers, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof ApiError
        ? (error.data as { message?: string })?.message || 'Kunne ikke hente kunder'
        : 'Kunne ikke hente kunder';
      
      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },
  
  fetchCustomerById: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const apiCustomer = await apiClient.getCustomer(id);
      const customer = apiCustomerToCustomer(apiCustomer);
      
      set({ selectedCustomer: customer, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof ApiError
        ? (error.data as { message?: string })?.message || 'Kunne ikke hente kunde'
        : 'Kunne ikke hente kunde';
      
      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },
  
  createCustomer: async (customerData: Partial<Customer>) => {
    set({ isLoading: true, error: null });
    
    try {
      const apiCustomer = await apiClient.createCustomer(customerToApiCustomer(customerData));
      const newCustomer = apiCustomerToCustomer(apiCustomer);
      
      set(state => ({
        customers: [newCustomer, ...state.customers],
        isLoading: false,
      }));
      
      return newCustomer;
    } catch (error) {
      const errorMessage = error instanceof ApiError
        ? (error.data as { message?: string })?.message || 'Kunne ikke oprette kunde'
        : 'Kunne ikke oprette kunde';
      
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },
  
  updateCustomer: async (id: string, updates: Partial<Customer>) => {
    set({ isLoading: true, error: null });
    
    try {
      const apiCustomer = await apiClient.updateCustomer(id, customerToApiCustomer(updates));
      const updatedCustomer = apiCustomerToCustomer(apiCustomer);
      
      set(state => ({
        customers: state.customers.map(customer => 
          customer.id === id ? updatedCustomer : customer
        ),
        selectedCustomer: state.selectedCustomer?.id === id 
          ? updatedCustomer 
          : state.selectedCustomer,
        isLoading: false,
      }));
      
      return updatedCustomer;
    } catch (error) {
      const errorMessage = error instanceof ApiError
        ? (error.data as { message?: string })?.message || 'Kunne ikke opdatere kunde'
        : 'Kunne ikke opdatere kunde';
      
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },
  
  deleteCustomer: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      await apiClient.deleteCustomer(id);
      
      set(state => ({
        customers: state.customers.filter(customer => customer.id !== id),
        selectedCustomer: state.selectedCustomer?.id === id ? null : state.selectedCustomer,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof ApiError
        ? (error.data as { message?: string })?.message || 'Kunne ikke slette kunde'
        : 'Kunne ikke slette kunde';
      
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },
  
  setSelectedCustomer: (customer: Customer | null) => {
    set({ selectedCustomer: customer });
  },
  
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
  
  clearError: () => {
    set({ error: null });
  },
}));
