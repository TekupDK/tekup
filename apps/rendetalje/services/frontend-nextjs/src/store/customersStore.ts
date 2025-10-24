import { create } from "zustand";

export interface Customer {
  id: string;
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  type: "private" | "business";
  cvr?: string;
  addressStreet?: string;
  addressPostalCode?: string;
  addressCity?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomersState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCustomers: () => Promise<void>;
  fetchCustomerById: (id: string) => Promise<void>;
  createCustomer: (
    customer: Omit<Customer, "id" | "createdAt" | "updatedAt">
  ) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  setSelectedCustomer: (customer: Customer | null) => void;
  clearError: () => void;
}

export const useCustomersStore = create<CustomersState>((set, get) => ({
  customers: [],
  selectedCustomer: null,
  isLoading: false,
  error: null,

  fetchCustomers: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch("/api/customers");

      if (!response.ok) {
        throw new Error("Kunne ikke hente kunder");
      }

      const data = await response.json();
      set({ customers: data.customers, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Fejl ved hentning af kunder",
      });
    }
  },

  fetchCustomerById: async (id: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/customers/${id}`);

      if (!response.ok) {
        throw new Error("Kunne ikke hente kunde");
      }

      const data = await response.json();
      set({ selectedCustomer: data.customer, isLoading: false });
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Fejl ved hentning af kunde",
      });
    }
  },

  createCustomer: async (customer) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customer),
      });

      if (!response.ok) {
        throw new Error("Kunne ikke oprette kunde");
      }

      const data = await response.json();
      set((state) => ({
        customers: [...state.customers, data.customer],
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Fejl ved oprettelse af kunde",
      });
      throw error;
    }
  },

  updateCustomer: async (id, updates) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Kunne ikke opdatere kunde");
      }

      const data = await response.json();
      set((state) => ({
        customers: state.customers.map((customer) =>
          customer.id === id ? data.customer : customer
        ),
        selectedCustomer:
          state.selectedCustomer?.id === id
            ? data.customer
            : state.selectedCustomer,
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Fejl ved opdatering af kunde",
      });
      throw error;
    }
  },

  deleteCustomer: async (id) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Kunne ikke slette kunde");
      }

      set((state) => ({
        customers: state.customers.filter((customer) => customer.id !== id),
        selectedCustomer:
          state.selectedCustomer?.id === id ? null : state.selectedCustomer,
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : "Fejl ved sletning af kunde",
      });
      throw error;
    }
  },

  setSelectedCustomer: (customer) => {
    set({ selectedCustomer: customer });
  },

  clearError: () => {
    set({ error: null });
  },
}));
