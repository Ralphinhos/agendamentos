import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Booking } from '@/context/BookingsContext';

const fetchBookingById = async (id: string): Promise<Booking> => {
  const { data } = await api.get(`/bookings/${id}`);
  return data;
};

export const useBooking = (id: string) => {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => fetchBookingById(id),
    enabled: !!id, // Only run the query if the id is not null or undefined
  });
};
