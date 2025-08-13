import React, { createContext, useContext, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBookings } from "@/lib/api";

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
  totalUnits?: number;
  recordedUnits?: number;
  status: EditingStatus;
  editedFiles?: EditedFile[];
  teacherConfirmation?: "CONFIRMADO" | "NEGADO";
  teacherNotes?: string;
  teacherFiles?: EditedFile[];
  cancellationReason?: string;
  cancellationRead?: boolean;
  cancellationReadByEditor?: boolean;
  uploadCompleted?: boolean;
  uploadNotificationRead?: boolean;
  dailyDeliveryStatus?: 'delivered';
  completionDate?: string;
  allRecordingsDone?: boolean;
  editorCancelled?: boolean;
  editorCancellationRead?: boolean;
}

// This type is shared across Admin and Editor pages
export type BookingWithProgress = Booking & {
  disciplineProgress: number;
  actualRecorded: number;
  totalUnits: number;
};

interface BookingsContextValue {
  bookings: Booking[];
  isLoading: boolean;
  error: Error | null;
  getBySlot: (date: string, period: Booking["period"]) => Booking | undefined;
  getDisciplineProgress: (disciplineName: string) => { totalUnits: number; actualRecorded: number } | null;
}

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined);

export const BookingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: bookings = [], isLoading, error } = useQuery<Booking[], Error>({
    queryKey: ['bookings'],
    queryFn: fetchBookings,
  });

  const getBySlot = useCallback((date: string, period: Booking["period"]) =>
    bookings.find((b) => b.date === date && b.period === period && b.teacherConfirmation !== 'NEGADO'),
    [bookings]
  );

  const getDisciplineProgress = useCallback((disciplineName: string) => {
    const disciplineBookings = bookings.filter(b => b.discipline === disciplineName);
    if (disciplineBookings.length === 0) return null;

    const totalUnits = disciplineBookings[0].totalUnits || 0;
    const actualRecorded = disciplineBookings.reduce((acc, b) => {
      return acc + (b.lessonsRecorded ?? b.recordedUnits ?? 0);
    }, 0);

    return { totalUnits, actualRecorded };
  }, [bookings]);

  const value = useMemo(
    () => ({
      bookings,
      isLoading,
      error,
      getBySlot,
      getDisciplineProgress,
    }),
    [bookings, isLoading, error, getBySlot, getDisciplineProgress]
  );

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
};

export const useBookings = () => {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error("useBookings deve ser usado dentro de BookingsProvider");
  return ctx;
};
