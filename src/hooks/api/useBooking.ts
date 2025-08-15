import { useQuery } from '@tanstack/react-query';
import { fetchBookingByIdAPI } from '@/lib/api';
import { Booking } from '@/context/BookingsContext';

export const useBooking = (id: string) => {
  return useQuery<Booking, Error>({
    queryKey: ['booking', id],
    queryFn: () => fetchBookingByIdAPI(id),
    enabled: !!id, // Only run the query if the id is not null or undefined
  });
};
