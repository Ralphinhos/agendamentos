import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeBookingAPI } from '@/lib/api';

export const useRemoveBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: string) => removeBookingAPI(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};
