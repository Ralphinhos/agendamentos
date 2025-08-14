import { Helmet } from "react-helmet-async";
import { useEffect, useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { useBookings } from "@/context/BookingsContext";
import { format, isSameDay, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { TimeSlotItem } from "@/components/index/TimeSlotItem";

interface Holiday {
  date: string;
  name: string;
  type: string;
}

const allTimeSlots = [
    { period: "08:30-10:00", start: "08:30", end: "10:00", label: "Manhã" },
    { period: "10:00-11:30", start: "10:00", end: "11:30", label: "Manhã" },
    { period: "13:30-15:00", start: "13:30", end: "15:00", label: "Tarde" },
    { period: "15:00-16:30", start: "15:00", end: "16:30", label: "Tarde" },
    { period: "16:30-17:30", start: "16:30", end: "17:30", label: "Tarde" },
];

const fridayTimeSlots = [
    { period: "13:30-15:00", start: "13:30", end: "15:00", label: "Tarde" },
    { period: "15:00-16:30", start: "15:00", end: "16:30", label: "Tarde" },
    { period: "16:30-17:30", start: "16:30", end: "17:30", label: "Tarde" },
];


function Index() {
  const { bookings, isLoading: isLoadingBookings } = useBookings();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  const availableTimeSlots = useMemo(() => {
    if (!date) return [];
    const dayOfWeek = getDay(date); // Sunday = 0, Monday = 1, ..., Friday = 5
    if (dayOfWeek === 5) { // It's Friday
      return fridayTimeSlots;
    }
    return allTimeSlots;
  }, [date]);

  const bookedDays = useMemo(() => {
    if (!bookings) return [];
    const dates = bookings
      .filter(b => b.teacherConfirmation !== 'NEGADO' && b.status !== 'cancelado' && !b.completionDate)
      .map(b => {
        const [year, month, day] = b.date.split('-').map(Number);
        return new Date(year, month - 1, day);
      });
    return dates;
  }, [bookings]);

  const holidayDates = useMemo(() => {
    return holidays.map(h => {
      const [year, month, day] = h.date.split('-').map(Number);
      return new Date(year, month - 1, day);
    });
  }, [holidays]);

  useEffect(() => {
    const year = new Date().getFullYear();
    fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`)
      .then(res => res.json())
      .then(setHolidays)
      .catch(err => console.error("Falha ao buscar feriados:", err));
  }, []);

  const selectedDayIsHoliday = date && holidayDates.some(holidayDate => isSameDay(holidayDate, date));
  const holidayName = date && holidays.find(h => {
    const [year, month, day] = h.date.split('-').map(Number);
    return isSameDay(new Date(year, month - 1, day), date);
  })?.name;


  return (
    <main className="bg-app min-h-[calc(100vh-56px)]">
      <section className="max-w-7xl mx-auto px-4 py-8">
        <Helmet>
          <title>Calendário de Agendamentos | Admin</title>
          <meta name="description" content="Visualize e gerencie os agendamentos de gravação." />
        </Helmet>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Calendário de Agendamentos</h1>
          <p className="text-muted-foreground mt-2">
            Clique em um dia para ver os detalhes ou para agendar uma nova gravação. Feriados são marcados em vermelho.
          </p>
        </div>

        <div className="bg-card p-6 rounded-2xl border">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="w-full"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4 w-full",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-xl font-medium",
                  nav: "space-x-1 flex items-center",
                  table: "w-full border-collapse",
                  head_row: "flex justify-around",
                  head_cell: "text-muted-foreground rounded-md w-12 font-normal text-lg",
                  row: "flex w-full mt-2 justify-around",
                  // 🔧 sem bg no container da célula
                  cell:
                    "h-12 w-12 text-center text-lg p-0 relative focus-within:relative focus-within:z-20",
                  // dia é um círculo; hover suave
                  day:
                    "h-12 w-12 p-0 font-normal aria-selected:opacity-100 rounded-full hover:bg-accent/50 transition-colors",
                  // selecionado (quando NÃO for hoje)
                  day_selected:
                    "bg-primary text-primary-foreground rounded-full hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  // hoje (prevalece mesmo se estiver selecionado)
                  day_today:
                    "bg-accent text-accent-foreground rounded-full aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
                locale={ptBR}
                disabled={holidayDates}
                modifiers={{
                  holiday: holidayDates,
                  booked: bookedDays,
                }}
                modifiersClassNames={{
                  holiday: "text-red-500",
                  // se quiser evitar conflito visual com hoje/selecionado,
                  // pode trocar bg por um anel: "ring-2 ring-brand-blue text-white rounded-full"
                  booked: "bg-brand-blue text-white rounded-full",
                }}
              />
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">
                {date ? `Horários para ${format(date, "PPP", { locale: ptBR })}` : "Selecione uma data"}
              </h2>
              {isLoadingBookings ? (
                <div className="flex items-center justify-center h-24">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : date && (
                selectedDayIsHoliday ? (
                  <div>
                    <p className="font-semibold text-red-500">Este dia é um feriado.</p>
                    <p className="text-sm text-muted-foreground">{holidayName}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableTimeSlots.map((slot) => (
                      <TimeSlotItem key={slot.period} slot={slot} date={date} />
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Index;
