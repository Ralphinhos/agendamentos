import { Booking } from '@/context/BookingsContext';

const bookings: Booking[] = [
  {
    id: '1',
    date: '2024-08-19',
    weekday: 'Segunda-feira',
    period: 'MANHÃ',
    start: '08:00',
    end: '12:00',
    course: 'Engenharia de Software',
    discipline: 'Introdução à Programação',
    teacher: 'Dr. Alan Turing',
    status: 'pendente',
    totalUnits: 10,
    recordedUnits: 0,
  },
  {
    id: '2',
    date: '2024-08-19',
    weekday: 'Segunda-feira',
    period: 'TARDE',
    start: '14:00',
    end: '18:00',
    course: 'Ciência da Computação',
    discipline: 'Estrutura de Dados',
    teacher: 'Dr. Grace Hopper',
    status: 'em-andamento',
    totalUnits: 12,
    recordedUnits: 4,
    lessonsRecorded: 4,
  },
  {
    id: '3',
    date: '2024-08-20',
    weekday: 'Terça-feira',
    period: 'MANHÃ',
    start: '08:00',
    end: '12:00',
    course: 'Sistemas de Informação',
    discipline: 'Banco de Dados',
    teacher: 'Dr. Edgar Codd',
    status: 'concluída',
    totalUnits: 8,
    recordedUnits: 8,
    lessonsRecorded: 8,
    completionDate: '2024-08-15',
    allRecordingsDone: true,
  },
  {
    id: '4',
    date: '2024-08-21',
    weekday: 'Quarta-feira',
    period: 'MANHÃ',
    start: '09:00',
    end: '11:00',
    course: 'Inteligência Artificial',
    discipline: 'Aprendizado de Máquina',
    teacher: 'Dr. Geoffrey Hinton',
    status: 'pendente',
    totalUnits: 10,
    recordedUnits: 0,
    cancellationReason: 'Feriado',
  },
];

// In-memory database operations
export const db = {
  getAllBookings: () => bookings,
  getBookingById: (id: string) => {
    return bookings.find(b => b.id === id) || null;
  },
  addBooking: (newBookingData: Omit<Booking, 'id'>) => {
    const newBooking: Booking = {
      id: new Date().toISOString(), // Simple unique ID
      ...newBookingData,
    };
    bookings.push(newBooking);
    return newBooking;
  },
  updateBooking: (id: string, patch: Partial<Booking>) => {
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) return null;
    bookings[index] = { ...bookings[index], ...patch };
    return bookings[index];
  },
  deleteBooking: (id: string) => {
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) return false;
    bookings.splice(index, 1);
    return true;
  },
  updateBookingsByDiscipline: (disciplineName: string, patch: Partial<Booking>) => {
    const updatedBookings = bookings.map(b => {
      if (b.discipline === disciplineName) {
        // Handle special case for reverting completion by removing a property
        if (patch.completionDate === null) {
          const { completionDate, ...rest } = b;
          // Create a new patch without completionDate to avoid re-adding it as null
          const newPatch = { ...patch };
          delete newPatch.completionDate;
          return { ...rest, ...newPatch };
        }
        return { ...b, ...patch };
      }
      return b;
    });
    bookings.length = 0;
    bookings.push(...updatedBookings);
  },
};
