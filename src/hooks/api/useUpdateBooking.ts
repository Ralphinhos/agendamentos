import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Booking } from '@/context/BookingsContext';
import { updateBookingAPI } from '@/lib/api';

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Booking> }) =>
      updateBookingAPI(id, patch),
    onSuccess: () => {
      // When a booking is updated, invalidate the 'bookings' query.
      // This will cause react-query to refetch the data, updating the UI.
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    // Optional: Add onError for error handling
  });
};
