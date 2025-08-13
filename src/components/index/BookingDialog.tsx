import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBookings } from "@/context/BookingsContext";
import { useAddBooking } from "@/hooks/api/useAddBooking";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface BookingDialogProps {
  slot: { period: "MANHÃ" | "TARDE"; start: string; end: string };
  date: Date;
  dateISO: string;
}

export function BookingDialog({ slot, date, dateISO }: BookingDialogProps) {
  const { getBySlot, getDisciplineProgress } = useBookings();
  const addBookingMutation = useAddBooking();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    teacher: "",
    course: "",
    discipline: "",
    totalUnits: 8,
    recordedUnits: 4,
  });
  const [disciplineInfo, setDisciplineInfo] = useState<{
    remaining: number;
    total: number;
  } | null>(null);

  const handleDisciplineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const disciplineName = e.target.value;
    setForm((f) => ({ ...f, discipline: disciplineName }));

    if (disciplineName.trim()) {
      const progress = getDisciplineProgress(disciplineName.trim());
      if (progress) {
        setDisciplineInfo({
          total: progress.totalUnits,
          remaining: Math.max(0, progress.totalUnits - progress.actualRecorded),
        });
        setForm(f => ({ ...f, totalUnits: progress.totalUnits }))
      } else {
        setDisciplineInfo(null);
      }
    } else {
      setDisciplineInfo(null);
    }
  };

  const submit = () => {
    if (!form.teacher || !form.course || !form.discipline) {
      toast.error("Preencha os campos obrigatórios: Docente, Curso e Disciplina.");
      return;
    }

    if (disciplineInfo && form.recordedUnits > disciplineInfo.remaining) {
      toast.error("Limite de Aulas Excedido", {
        description: `Você está tentando agendar ${form.recordedUnits} aulas, mas apenas ${disciplineInfo.remaining} estão disponíveis.`,
      });
      return;
    }

    if (disciplineInfo && disciplineInfo.remaining <= 0) {
      toast.error("Disciplina Concluída", {
        description: "Todas as unidades desta disciplina já foram gravadas.",
      });
      return;
    }

    const existing = getBySlot(dateISO, slot.period);
    if (existing) {
      toast.error("Horário já reservado", {
        description: "Escolha outro horário disponível.",
      });
      return;
    }

    addBookingMutation.mutate(
      {
        date: dateISO,
        weekday: format(date, "EEEE", { locale: ptBR }),
        period: slot.period,
        start: slot.start,
        end: slot.end,
        course: form.course,
        discipline: form.discipline,
        teacher: form.teacher,
        status: "pendente",
        totalUnits: form.totalUnits,
        recordedUnits: form.recordedUnits,
      },
      {
        onSuccess: () => {
          setOpen(false);
          toast.success("Reserva realizada!", {
            description: `Agendado para ${format(date, "dd/MM/yyyy")} no período da ${slot.period.toLowerCase()}.`,
          });
        },
        onError: () => {
          toast.error("Falha ao agendar", {
            description: "Ocorreu um erro. Tente novamente.",
          });
        },
      }
    );
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      // Reset form when dialog opens
      setForm({ teacher: "", course: "", discipline: "", totalUnits: 8, recordedUnits: 4 });
      setDisciplineInfo(null);
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={"default"}>Agendar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Agendar para {format(date, "dd/MM/yyyy")} · {slot.period}
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
          <Button onClick={submit} disabled={addBookingMutation.isPending}>
            {addBookingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Agendamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
