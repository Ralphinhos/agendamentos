import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Booking } from '@/context/BookingsContext';
import { addBookingAPI } from '@/lib/api';

export const useAddBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newBookingData: Omit<Booking, 'id'>) => addBookingAPI(newBookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};
