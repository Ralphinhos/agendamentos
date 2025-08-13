import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Booking } from '@/context/BookingsContext';

type DisciplineUpdatePayload = {
  disciplineName: string;
  patch: Partial<Booking>;
};

// This function simulates a bulk update on all bookings for a given discipline.
const updateDisciplineAPI = async ({ disciplineName, patch }: DisciplineUpdatePayload): Promise<void> => {
  console.log(`Updating all bookings for discipline ${disciplineName} on the API...`, patch);
  await new Promise(resolve => setTimeout(resolve, 300));

  const rawData = localStorage.getItem("ead-bookings-v1");
  let bookings: Booking[] = rawData ? JSON.parse(rawData) : [];

  bookings = bookings.map(b => {
    if (b.discipline === disciplineName) {
      // For reverting, we need to remove a property, not just patch.
      if ('completionDate' in patch && patch.completionDate === null) {
        const { completionDate, ...rest } = b;
        return { ...rest, ...patch };
      }
      return { ...b, ...patch };
    }
    return b;
  });

  localStorage.setItem("ead-bookings-v1", JSON.stringify(bookings));
};

export const useUpdateDiscipline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDisciplineAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};
