import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Customer, CreateCustomerInput } from '@/lib/types';

/**
 * Fetch all customers
 */
export function useCustomers() {
    return useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const { data } = await apiClient.get<Customer[]>('/dashboard/customers');
            return data;
        },
    });
}

/**
 * Fetch single customer by ID
 */
export function useCustomer(id: number | null) {
    return useQuery({
        queryKey: ['customer', id],
        queryFn: async () => {
            if (!id) throw new Error('Customer ID is required');
            const { data } = await apiClient.get<Customer>(`/dashboard/customers/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

/**
 * Create new customer
 */
export function useCreateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateCustomerInput) => {
            const { data } = await apiClient.post<Customer>('/dashboard/customers', input);
            return data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
}

/**
 * Update existing customer
 */
export function useUpdateCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...input }: Partial<Customer> & { id: number }) => {
            const { data } = await apiClient.put<Customer>(`/dashboard/customers/${id}`, input);
            return data;
        },
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({ queryKey: ['customers'] });
            void queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
        },
    });
}

/**
 * Delete customer
 */
export function useDeleteCustomer() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await apiClient.delete(`/dashboard/customers/${id}`);
            return id;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['customers'] });
        },
    });
}
