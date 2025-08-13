import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBookings } from "@/context/BookingsContext";
import { toast } from "@/hooks/use-toast";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo } from "react";
import { Trash2, Link2, Send } from "lucide-react";

interface Holiday {
  date: string;
  name: string;
  type: string;
}

const timeSlots = [
  { period: "MANHÃ" as const, start: "09:00", end: "12:00" },
  { period: "TARDE" as const, start: "13:30", end: "17:30" },
];

function formatDateISO(d: Date) {
  return format(d, "yyyy-MM-dd");
}

function Index() {
  const { addBooking, getBySlot, bookings, getDisciplineProgress, removeBooking } = useBookings();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [disciplineInfo, setDisciplineInfo] = useState<{ remaining: number, total: number } | null>(null);

  const bookedDays = useMemo(() => {
    const dates = bookings
      .filter(b => b.teacherConfirmation !== 'NEGADO' && b.status !== 'cancelado' && !b.completionDate)
      .map(b => {
        const [year, month, day] = b.date.split('-').map(Number);
        return new Date(year, month - 1, day);
      });
    return dates;
  }, [bookings, bookings.length]);

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


  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    dateISO: "",
    period: "MANHÃ" as "MANHÃ" | "TARDE",
    start: "",
    end: "",
    teacher: "",
    course: "",
    discipline: "",
    totalUnits: 8, // Default value
    recordedUnits: 4, // Default value
  });

  const openDialog = (
    dateISO: string,
    period: "MANHÃ" | "TARDE",
    start: string,
    end: string
  ) => {
    setForm((f) => ({ ...f, dateISO, period, start, end, teacher: '', course: '', discipline: '', totalUnits: 8, recordedUnits: 4 }));
    setDisciplineInfo(null);
    setOpen(true);
  };

  const handleDisciplineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const disciplineName = e.target.value;
    setForm(f => ({ ...f, discipline: disciplineName }));

    if (disciplineName.trim()) {
      const progress = getDisciplineProgress(disciplineName.trim());
      if (progress) {
        setDisciplineInfo({
          total: progress.totalUnits,
          remaining: Math.max(0, progress.totalUnits - progress.actualRecorded),
        });
      } else {
        setDisciplineInfo(null);
      }
    } else {
      setDisciplineInfo(null);
    }
  };

  const submit = () => {
    if (!form.teacher || !form.course || !form.discipline) {
      toast({ title: "Preencha os campos obrigatórios.", description: "Docente, Curso e Disciplina." });
      return;
    }

    if (disciplineInfo && form.recordedUnits > disciplineInfo.remaining) {
       toast({ variant: "destructive", title: "Limite de Aulas Excedido", description: `Você está tentando agendar ${form.recordedUnits} aulas, mas apenas ${disciplineInfo.remaining} estão disponíveis para esta disciplina.` });
      return;
    }

    if (disciplineInfo && disciplineInfo.remaining <= 0) {
      toast({ variant: "destructive", title: "Disciplina Concluída", description: "Todas as unidades desta disciplina já foram gravadas." });
      return;
    }

    const existing = getBySlot(form.dateISO, form.period);
    if (existing) {
      toast({ title: "Horário já reservado", description: "Escolha outro horário disponível." });
      return;
    }
    addBooking({
      id: crypto.randomUUID(),
      date: form.dateISO,
      weekday: date ? format(date, "EEEE", { locale: ptBR }) : "",
      period: form.period,
      start: form.start,
      end: form.end,
      course: form.course,
      discipline: form.discipline,
      teacher: form.teacher,
      status: "pendente",
      totalUnits: form.totalUnits,
      recordedUnits: form.recordedUnits,
    });
    setOpen(false);
    toast({ title: "Reserva realizada!", description: `Agendado para ${format(new Date(form.dateISO.replace(/-/g, '/')), "dd/MM/yyyy")} no período da ${form.period.toLowerCase()}.` });
  };

  const sendWhatsApp = (link: string, teacher: string) => {
    const message = `Olá, ${teacher}! Passando para lembrar da sua gravação agendada. Por favor, confirme sua presença no link: ${link}`;
    console.log("--- SIMULAÇÃO DE ENVIO WHATSAPP ---");
    console.log(`Mensagem: ${message}`);
    console.log("------------------------------------");
    toast({ title: "Simulação de WhatsApp", description: "A mensagem foi registrada no console." });
  };

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
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex justify-around",
                  head_cell: "text-muted-foreground rounded-md w-12 font-normal text-lg",
                  row: "flex w-full mt-2 justify-around",
                  cell: "h-12 w-12 text-center text-lg p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-12 w-12 p-0 font-normal aria-selected:opacity-100 rounded-full hover:bg-accent/50 transition-colors",
                  day_selected: "bg-primary text-primary-foreground rounded-full hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground rounded-full",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
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
                booked: "bg-brand-blue text-white rounded-full",
              }}
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              {date ? `Horários para ${format(date, "PPP", { locale: ptBR })}` : "Selecione uma data"}
            </h2>
            {date && (
              selectedDayIsHoliday ? (
                <div>
                  <p className="font-semibold text-red-500">Este dia é um feriado.</p>
                  <p className="text-sm text-muted-foreground">{holidayName}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {timeSlots.map((slot) => {
                    const dateISO = formatDateISO(date);
                    const booked = getBySlot(dateISO, slot.period);
                    const confirmationLink = booked ? `${window.location.origin}/confirmacao/${booked.id}` : "";

                    const copyLink = () => {
                      navigator.clipboard.writeText(confirmationLink);
                      toast({ title: "Link copiado!", description: "O link de confirmação foi copiado para a área de transferência." });
                    };

                    return (
                      <div key={slot.period} className="flex items-start justify-between rounded-md border p-3">
                        <div className="flex-1">
                          <div className="text-xs text-muted-foreground">{slot.period}</div>
                          <div className="font-medium">{slot.start} – {slot.end}</div>
                          {booked && (
                            <div className="text-xs text-muted-foreground mt-1 space-y-1">
                              <p>Reservado por <strong>{booked.teacher}</strong></p>
                              <p>{booked.course} / {booked.discipline}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center">
                          {booked ? (
                            <div className="flex flex-col items-center gap-1 ml-2">
                               <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyLink} title="Copiar link de confirmação">
                                <Link2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={() => sendWhatsApp(confirmationLink, booked.teacher)} title="Enviar lembrete via WhatsApp (Simulação)">
                                <Send className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" title="Excluir agendamento">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta ação não pode ser desfeita. Isso irá remover permanentemente o agendamento.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => removeBooking(booked.id)} className="bg-destructive hover:bg-destructive/90">
                                      Sim, remover
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ) : (
                            <Dialog open={open && form.dateISO === dateISO && form.period === slot.period} onOpenChange={setOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  variant={"default"}
                                  onClick={() => openDialog(dateISO, slot.period, slot.start, slot.end)}
                                >
                                  Agendar
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>
                                    Agendar para {form.dateISO ? format(new Date(form.dateISO.replace(/-/g, '/')), "dd/MM/yyyy") : ""} · {form.period}
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid items-center gap-4">
                                    <Label htmlFor="teacher">Docente</Label>
                                    <Input id="teacher" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} placeholder="Nome do docente" />
                                  </div>
                                  <div className="grid items-center gap-4">
                                    <Label htmlFor="course">Curso</Label>
                                    <Input id="course" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="Ex: Administração" />
                                  </div>
                                  <div className="grid items-center gap-4">
                                    <Label htmlFor="discipline">Disciplina</Label>
                                    <Input id="discipline" value={form.discipline} onChange={handleDisciplineChange} placeholder="Ex: Marketing I" />
                                  </div>
                                  <div className="grid items-center gap-4">
                                    <Label htmlFor="totalUnits">Total de Unidades da Disciplina</Label>
                                    <Input id="totalUnits" type="number" value={form.totalUnits} onChange={(e) => setForm({ ...form, totalUnits: Number(e.target.value) })} placeholder="Ex: 8" disabled={!!disciplineInfo} />
                                  </div>
                                   <div className="grid items-center gap-4">
                                    <Label htmlFor="recordedUnits">Aulas a Serem Gravadas</Label>
                                    <Input id="recordedUnits" type="number" value={form.recordedUnits} onChange={(e) => setForm({ ...form, recordedUnits: Number(e.target.value) })} placeholder="Ex: 4" />
                                    {disciplineInfo && (
                                      <p className="text-sm text-muted-foreground">
                                        Unidades restantes para gravar: {disciplineInfo.remaining} de {disciplineInfo.total}.
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                                  <Button onClick={submit}>Confirmar Agendamento</Button>
                                </div>
                              </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    );
                  })}
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
