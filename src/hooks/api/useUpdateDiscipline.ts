import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Booking } from '@/context/BookingsContext';
import { updateDisciplineAPI } from '@/lib/api';

type DisciplineUpdatePayload = {
  disciplineName: string;
  patch: Partial<Booking>;
};

export const useUpdateDiscipline = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ disciplineName, patch }: DisciplineUpdatePayload) =>
      updateDisciplineAPI(disciplineName, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
};
