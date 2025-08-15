import { Booking } from '@/context/BookingsContext';

const DB_KEY = 'bookings-db';

// The initial data to seed the database if it's empty in localStorage
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

// --- localStorage persistence layer ---
const loadDb = (): Booking[] => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to load bookings from localStorage", error);
  }
  // If nothing in localStorage, or it fails to parse, seed with initial data
  return initialBookings;
};

const saveDb = () => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(bookings));
  } catch (error) {
    console.error("Failed to save bookings to localStorage", error);
  }
};

// --- In-memory database, initialized from localStorage ---
let bookings: Booking[] = loadDb();

// Save db to localStorage on first load if it was empty
if (!localStorage.getItem(DB_KEY)) {
  saveDb();
}

// --- Database operations ---
export const db = {
  getAllBookings: () => bookings,
  addBooking: (newBookingData: Omit<Booking, 'id'>) => {
    const newBooking: Booking = {
      id: new Date().toISOString(), // Simple unique ID
      ...newBookingData,
    };
    bookings.push(newBooking);
    saveDb();
    return newBooking;
  },
  updateBooking: (id: string, patch: Partial<Booking>) => {
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) return null;
    bookings[index] = { ...bookings[index], ...patch };
    saveDb();
    return bookings[index];
  },
  deleteBooking: (id: string) => {
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) return false;
    bookings.splice(index, 1);
    saveDb();
    return true;
  },
  updateBookingsByDiscipline: (disciplineName: string, patch: Partial<Booking>) => {
    let updated = false;
    bookings = bookings.map(b => {
      if (b.discipline === disciplineName) {
        updated = true;
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
    if (updated) {
      saveDb();
    }
  },
};
