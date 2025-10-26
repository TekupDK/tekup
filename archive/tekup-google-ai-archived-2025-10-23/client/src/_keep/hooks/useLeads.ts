import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Lead, ConvertLeadInput } from '@/lib/types';

/**
 * Fetch all leads
 */
export function useLeads() {
    return useQuery({
        queryKey: ['leads'],
        queryFn: async () => {
            const { data } = await apiClient.get<Lead[]>('/dashboard/leads');
            return data;
        },
    });
}

/**
 * Fetch single lead by ID
 */
export function useLead(id: number | null) {
    return useQuery({
        queryKey: ['lead', id],
        queryFn: async () => {
            if (!id) throw new Error('Lead ID is required');
            const { data } = await apiClient.get<Lead>(`/dashboard/leads/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

/**
 * Convert lead to customer
 */
export function useConvertLead() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ leadId, ...input }: ConvertLeadInput & { leadId: number }) => {
            const { data } = await apiClient.post(`/dashboard/leads/${leadId}/convert`, input);
            return data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['leads'] });
            void queryClient.invalidateQueries({ queryKey: ['customers'] });
            void queryClient.invalidateQueries({ queryKey: ['bookings'] });
        },
    });
}
