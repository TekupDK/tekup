import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { DashboardStats, AvailabilitySlot } from '@/lib/types';

/**
 * Fetch dashboard statistics
 */
export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const { data } = await apiClient.get<DashboardStats>('/dashboard/stats');
            return data;
        },
        refetchInterval: 60000, // Refetch every minute
    });
}

/**
 * Fetch calendar availability for a specific date
 */
export function useCalendarAvailability(date: string | null) {
    return useQuery({
        queryKey: ['calendar-availability', date],
        queryFn: async () => {
            if (!date) throw new Error('Date is required');
            const { data } = await apiClient.get<AvailabilitySlot[]>(
                `/dashboard/calendar/availability?date=${date}`
            );
            return data;
        },
        enabled: !!date,
    });
}
