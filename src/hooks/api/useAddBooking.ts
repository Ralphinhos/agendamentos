import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Booking } from '@/context/BookingsContext';

// This function simulates adding a booking on the backend.
const addBookingAPI = async (newBooking: Booking): Promise<Booking> => {
  console.log("Adding new booking to the API...", newBooking);
  await new Promise(resolve => setTimeout(resolve, 300));

  const rawData = localStorage.getItem("ead-bookings-v1");
  const bookings: Booking[] = rawData ? JSON.parse(rawData) : [];

  bookings.unshift(newBooking); // Add to the beginning of the array

  localStorage.setItem("ead-bookings-v1", JSON.stringify(bookings));

  return newBooking;
};

export const useAddBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addBookingAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};
