import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Booking } from '@/context/BookingsContext';

// This function simulates updating a booking on the backend.
const updateBookingAPI = async (updatedBooking: Partial<Booking> & { id: string }): Promise<Booking> => {
  console.log(`Updating booking ${updatedBooking.id} on the API...`, updatedBooking);
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay

  // In a real app, this would be a PATCH request.
  // Here, we simulate by updating the data in localStorage.
  const rawData = localStorage.getItem("ead-bookings-v1");
  const bookings: Booking[] = rawData ? JSON.parse(rawData) : [];

  const bookingIndex = bookings.findIndex(b => b.id === updatedBooking.id);
  if (bookingIndex === -1) {
    throw new Error("Booking not found");
  }

  const newBooking = { ...bookings[bookingIndex], ...updatedBooking };
  bookings[bookingIndex] = newBooking;

  localStorage.setItem("ead-bookings-v1", JSON.stringify(bookings));

  return newBooking;
};

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBookingAPI,
    onSuccess: () => {
      // When a booking is updated, invalidate the 'bookings' query.
      // This will cause react-query to refetch the data, updating the UI.
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    // Optional: Add onError for error handling
  });
};
