import { Booking } from '@/context/BookingsContext';

const initialBookings: Booking[] = [
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
];

const DB_KEY = 'bookings_db';

const getBookingsFromStorage = (): Booking[] => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to read from localStorage", error);
  }

  try {
    localStorage.setItem(DB_KEY, JSON.stringify(initialBookings));
  } catch (error) {
    console.error("Failed to write to localStorage", error);
  }
  return initialBookings;
};

const saveBookingsToStorage = (bookings: Booking[]) => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(bookings));
  } catch (error) {
    console.error("Failed to write to localStorage", error);
  }
};

// Database operations that persist to localStorage
export const db = {
  getAllBookings: () => {
    return getBookingsFromStorage();
  },
  getBookingById: (id: string) => {
    const bookings = getBookingsFromStorage();
    return bookings.find(b => b.id === id) || null;
  },
  addBooking: (newBookingData: Omit<Booking, 'id'>) => {
    const bookings = getBookingsFromStorage();
    const newBooking: Booking = {
      id: new Date().toISOString(), // Simple unique ID
      ...newBookingData,
    };
    bookings.push(newBooking);
    saveBookingsToStorage(bookings);
    return newBooking;
  },
  updateBooking: (id: string, patch: Partial<Booking>) => {
    const bookings = getBookingsFromStorage();
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) return null;
    bookings[index] = { ...bookings[index], ...patch };
    saveBookingsToStorage(bookings);
    return bookings[index];
  },
  deleteBooking: (id: string) => {
    const bookings = getBookingsFromStorage();
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) return false;
    bookings.splice(index, 1);
    saveBookingsToStorage(bookings);
    return true;
  },
  updateBookingsByDiscipline: (disciplineName: string, patch: Partial<Booking>) => {
    let bookings = getBookingsFromStorage();
    bookings = bookings.map(b => {
      if (b.discipline === disciplineName) {
        if (patch.completionDate === null) {
          const { completionDate, ...rest } = b;
          const newPatch = { ...patch };
          delete newPatch.completionDate;
          return { ...rest, ...newPatch };
        }
        return { ...b, ...patch };
      }
      return b;
    });
    saveBookingsToStorage(bookings);
  },
};
