import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Booking } from '@/context/BookingsContext';

// This function simulates removing a booking on the backend.
const removeBookingAPI = async (bookingId: string): Promise<{ id: string }> => {
  console.log(`Removing booking ${bookingId} from the API...`);
  await new Promise(resolve => setTimeout(resolve, 300));

  const rawData = localStorage.getItem("ead-bookings-v1");
  let bookings: Booking[] = rawData ? JSON.parse(rawData) : [];

  bookings = bookings.filter(b => b.id !== bookingId);

  localStorage.setItem("ead-bookings-v1", JSON.stringify(bookings));

  return { id: bookingId };
};

export const useRemoveBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeBookingAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};
