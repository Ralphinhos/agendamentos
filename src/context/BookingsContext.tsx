import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

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
  // Campos a serem movidos para o fluxo de confirmação do professor
  teacherConfirmation?: "CONFIRMADO" | "NEGADO";
  teacherNotes?: string; // Observações do professor
  teacherFiles?: EditedFile[]; // TPs enviados pelo professor
  cancellationReason?: string;
  cancellationRead?: boolean; // Para o admin
  cancellationReadByEditor?: boolean; // Para o editor
  // Notificação de upload
  uploadCompleted?: boolean;
  uploadNotificationRead?: boolean;
  // Nova flag para indicar que a gravação do dia foi entregue
  dailyDeliveryStatus?: 'delivered';
  completionDate?: string; // YYYY-MM-DD
  allRecordingsDone?: boolean; // Nova flag para indicar que a gravação da disciplina inteira terminou
  // Notificação de cancelamento pelo editor
  editorCancelled?: boolean;
  editorCancellationRead?: boolean; // Para o admin
}

interface BookingsContextValue {
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, patch: Partial<Booking>) => void;
  removeBooking: (id: string) => void;
  revertCompletion: (disciplineName: string) => void;
  markAllRecordingsDone: (disciplineName: string) => void;
  getBySlot: (date: string, period: Booking["period"]) => Booking | undefined;
  getDisciplineProgress: (disciplineName: string) => { totalUnits: number; actualRecorded: number } | null;
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

  // Efeito para sincronizar entre abas
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          setBookings(JSON.parse(event.newValue));
        } catch (e) {
          console.error("Failed to parse bookings from storage event", e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const addBooking = useCallback((booking: Booking) => setBookings((prev) => [booking, ...prev]), []);

  const updateBooking = useCallback((id: string, patch: Partial<Booking>) => {
    setBookings((prev) => {
      let bookingsToUpdate = prev.map((b) => (b.id === id ? { ...b, ...patch } : b));

      // Se o status for alterado para 'concluída', define a data de conclusão
      if (patch.status === 'concluída') {
        const updatedBooking = bookingsToUpdate.find(b => b.id === id);
        if (updatedBooking) {
          const completionDate = new Date().toISOString().split('T')[0];
          bookingsToUpdate = bookingsToUpdate.map(b =>
            b.discipline === updatedBooking.discipline
              ? { ...b, completionDate: b.completionDate || completionDate }
              : b
          );
        }
      }

      return bookingsToUpdate;
    });
  }, []);

  const removeBooking = useCallback((id: string) => setBookings((prev) => prev.filter((b) => b.id !== id)), []);

  const revertCompletion = useCallback((disciplineName: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.discipline === disciplineName) {
          const { completionDate, ...rest } = b;
          return { ...rest, status: "em-andamento" as EditingStatus };
        }
        return b;
      })
    );
  }, []);

  const markAllRecordingsDone = useCallback((disciplineName: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.discipline === disciplineName ? { ...b, allRecordingsDone: true } : b
      )
    );
  }, []);

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
    () => ({ bookings, addBooking, updateBooking, removeBooking, getBySlot, getDisciplineProgress, revertCompletion, markAllRecordingsDone }),
    [bookings, addBooking, updateBooking, removeBooking, getBySlot, getDisciplineProgress, revertCompletion, markAllRecordingsDone]
  );

  return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
};

export const useBookings = () => {
  const ctx = useContext(BookingsContext);
  if (!ctx) throw new Error("useBookings deve ser usado dentro de BookingsProvider");
  return ctx;
};
