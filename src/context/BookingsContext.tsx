import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type EditingStatus = "pendente" | "em-andamento" | "concluída";

export interface EditedFile {
  name: string;
  url: string;
}

export interface Booking {
  id: string;
  date: string; // YYYY-MM-DD
  weekday: string;
  period: "MANHÃ" | "TARDE";
  start: string; // HH:mm
  end: string; // HH:mm
  course: string;
  discipline: string;
  teacher: string;
  lessonsRecorded?: number;
  editorNotes?: string;
  status: EditingStatus;
  editedFiles?: EditedFile[];
  // Campos a serem movidos para o fluxo de confirmação do professor
  teacherConfirmation?: "CONFIRMADO" | "NEGADO";
  teacherNotes?: string; // Observações do professor
  teacherFiles?: EditedFile[]; // TPs enviados pelo professor
}

interface BookingsContextValue {
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, patch: Partial<Booking>) => void;
  removeBooking: (id: string) => void;
  getBySlot: (date: string, period: Booking["period"]) => Booking | undefined;
}

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined);

const STORAGE_KEY = "ead-bookings-v1";

export const BookingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Booking[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }, [bookings]);

  const addBooking = (booking: Booking) => setBookings((prev) => [booking, ...prev]);
  const updateBooking = (id: string, patch: Partial<Booking>) =>
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const removeBooking = (id: string) => setBookings((prev) => prev.filter((b) => b.id !== id));

  const getBySlot = (date: string, period: Booking["period"]) =>
    bookings.find((b) => b.date === date && b.period === period);

  const value = useMemo(
    () => ({ bookings, addBooking, updateBooking, removeBooking, getBySlot }),
    [bookings]
  );

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
};

export const useBookings = () => {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error("useBookings deve ser usado dentro de BookingsProvider");
  return ctx;
};
