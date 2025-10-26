import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Booking, CreateBookingInput, UpdateBookingInput } from '@/lib/types';

/**
 * Fetch all bookings
 */
export function useBookings() {
    return useQuery({
        queryKey: ['bookings'],
        queryFn: async () => {
            const { data } = await apiClient.get<Booking[]>('/dashboard/bookings');
            return data;
        },
    });
}

/**
 * Fetch single booking by ID
 */
export function useBooking(id: number | null) {
    return useQuery({
        queryKey: ['booking', id],
        queryFn: async () => {
            if (!id) throw new Error('Booking ID is required');
            const { data } = await apiClient.get<Booking>(`/dashboard/bookings/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

/**
 * Create new booking
 */
export function useCreateBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (input: CreateBookingInput) => {
            const { data } = await apiClient.post<Booking>('/dashboard/bookings', input);
            return data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['bookings'] });
        },
    });
}

/**
 * Update existing booking
 */
export function useUpdateBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...input }: UpdateBookingInput & { id: number }) => {
            const { data } = await apiClient.put<Booking>(`/dashboard/bookings/${id}`, input);
            return data;
        },
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({ queryKey: ['bookings'] });
            void queryClient.invalidateQueries({ queryKey: ['booking', variables.id] });
        },
    });
}

/**
 * Delete booking
 */
export function useDeleteBooking() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id: number) => {
            await apiClient.delete(`/dashboard/bookings/${id}`);
            return id;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['bookings'] });
        },
    });
}
