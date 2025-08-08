import { Helmet } from "react-helmet-async";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBookings } from "@/context/BookingsContext";
import { toast } from "@/hooks/use-toast";

function formatDateISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getWeekDays() {
  const today = new Date();
  const day = today.getDay(); // 0-6 dom-sab
  const diffToMonday = ((day + 6) % 7); // days since Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday);
  const days = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const names = ["Domingo","Segunda-Feira","Terça-Feira","Quarta-Feira","Quinta-Feira","Sexta-Feira","Sábado"];
    const months = ["jan","fev","mar","abr","mai","jun","jul","ago","set","out","nov","dez"];
    return {
      label: names[(i + 1) % 7 || 1],
      date,
      dateISO: formatDateISO(date),
      short: `${date.getDate().toString().padStart(2,"0")}/${months[date.getMonth()]}.`,
    };
  });
  return days; // Mon-Fri
}

const morning = { period: "MANHÃ" as const, start: "09:00", end: "12:00" };
const afternoon = { period: "TARDE" as const, start: "13:30", end: "17:30" };
const fridayAfternoon = { period: "TARDE" as const, start: "13:30", end: "16:30" };

function Index() {
  const { addBooking, getBySlot } = useBookings();
  const week = useMemo(() => getWeekDays(), []);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    dateISO: "",
    weekday: "",
    period: "MANHÃ" as "MANHÃ" | "TARDE",
    start: "",
    end: "",
    teacher: "",
    course: "",
    discipline: "",
    lessons: 1,
    tpLinks: "",
  });

  const openDialog = (
    dateISO: string,
    weekday: string,
    period: "MANHÃ" | "TARDE",
    start: string,
    end: string
  ) => {
    setForm((f) => ({ ...f, dateISO, weekday, period, start, end }));
    setOpen(true);
  };

  const submit = () => {
    if (!form.teacher || !form.course || !form.discipline) {
      toast({ title: "Preencha os campos obrigatórios.", description: "Docente, Curso e Disciplina." });
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
      weekday: form.weekday,
      period: form.period,
      start: form.start,
      end: form.end,
      course: form.course,
      discipline: form.discipline,
      teacher: form.teacher,
      lessonsBooked: form.lessons,
      tpLinks: form.tpLinks,
      status: "pendente",
    });
    setOpen(false);
    toast({ title: "Reserva realizada!", description: `${form.weekday} ${form.start}-${form.end}` });
  };

  return (
    <main className="bg-app min-h-[calc(100vh-56px)]">
      <section
        className="max-w-7xl mx-auto px-4 py-8"
        onMouseMove={(e) => {
          const el = e.currentTarget as HTMLElement;
          const rect = el.getBoundingClientRect();
          el.style.setProperty("--x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
          el.style.setProperty("--y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
        }}
      >
        <Helmet>
          <title>Agendar gravações | EAD</title>
          <meta name="description" content="Escolha horários disponíveis e agende suas gravações de videoaulas." />
        </Helmet>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Agendar gravações</h1>
          <p className="text-muted-foreground mt-2">Selecione um horário disponível e informe os detalhes.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {week.map((d, idx) => {
            const isFriday = idx === 4; // Mon=0..Fri=4
            const slots = [
              { ...(morning), enabled: !isFriday },
              { ...(isFriday ? fridayAfternoon : afternoon), enabled: true },
            ].filter((s) => s.enabled);

            return (
              <div key={d.dateISO} className="glass rounded-lg p-4 shadow-[var(--shadow-soft)]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">{d.label}</div>
                    <div className="font-semibold">{d.short}</div>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {slots.map((s) => {
                    const booked = getBySlot(d.dateISO, s.period);
                    return (
                      <div key={`${d.dateISO}-${s.period}`} className="flex items-center justify-between rounded-md border p-3">
                        <div>
                          <div className="text-xs text-muted-foreground">{s.period}</div>
                          <div className="font-medium">{s.start} – {s.end}</div>
                          {booked && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Reservado por {booked.teacher} · {booked.course} / {booked.discipline} · {booked.lessonsBooked} aula(s)
                            </div>
                          )}
                        </div>
                        <Dialog open={open && form.dateISO === d.dateISO && form.period === s.period} onOpenChange={setOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant={booked ? "secondary" : "hero"}
                              disabled={!!booked}
                              onClick={() => openDialog(d.dateISO, d.label, s.period, s.start, s.end)}
                            >
                              {booked ? "Indisponível" : "Reservar"}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>
                                {form.weekday} · {form.period} · {form.start}–{form.end}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label htmlFor="teacher">Docente</Label>
                                  <Input id="teacher" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} placeholder="Nome do docente" />
                                </div>
                                <div>
                                  <Label htmlFor="course">Curso</Label>
                                  <Input id="course" value={form.course} onChange={(e) => setForm({ ...form, course: e.target.value })} placeholder="Ex: Administração" />
                                </div>
                                <div>
                                  <Label htmlFor="discipline">Disciplina</Label>
                                  <Input id="discipline" value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })} placeholder="Ex: Marketing I" />
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="lessons">Quantidade de aulas (1 a 8)</Label>
                                  <Input
                                    id="lessons"
                                    type="number"
                                    min={1}
                                    max={8}
                                    value={form.lessons}
                                    onChange={(e) => setForm({ ...form, lessons: Math.max(1, Math.min(8, Number(e.target.value))) })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="tplinks">TPs / observações</Label>
                                  <Textarea id="tplinks" value={form.tpLinks} onChange={(e) => setForm({ ...form, tpLinks: e.target.value })} placeholder="Links dos TPs, observações, etc." />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="secondary" onClick={() => setOpen(false)}>Cancelar</Button>
                                <Button variant="hero" onClick={submit}>Confirmar reserva</Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default Index;
