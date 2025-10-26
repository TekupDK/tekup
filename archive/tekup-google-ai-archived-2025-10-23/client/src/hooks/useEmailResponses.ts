import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { EmailResponse } from '@/lib/types';

/**
 * Fetch all email responses
 */
export function useEmailResponses() {
    return useQuery({
        queryKey: ['email-responses'],
        queryFn: async () => {
            const { data } = await apiClient.get<EmailResponse[]>('/dashboard/email-responses');
            return data;
        },
    });
}

/**
 * Approve email response (sends the email)
 */
export function useApproveEmail() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await apiClient.post(`/dashboard/email-responses/${id}/approve`);
            return data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['email-responses'] });
        },
    });
}

/**
 * Reject email response (deletes the draft)
 */
export function useRejectEmail() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await apiClient.post(`/dashboard/email-responses/${id}/reject`);
            return data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['email-responses'] });
        },
    });
}
