import { useQuery } from '@tanstack/react-query';
import { fetchBookingById } from '@/lib/api';

export const useGetBookingById = (id: string | undefined) => {
  return useQuery({
    queryKey: ['booking', id],
    queryFn: () => {
      if (!id) {
        return Promise.reject(new Error("Booking ID is required"));
      }
      return fetchBookingById(id);
    },
    enabled: !!id, // The query will not execute until the id exists
  });
};
