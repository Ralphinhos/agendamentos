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
import { useUpdateBooking } from "@/hooks/api/useUpdateBooking";
import { toast } from "sonner";
import { Loader2, Pencil } from "lucide-react";
import { Booking } from "@/context/BookingsContext";

interface EditBookingDialogProps {
  booking: Booking;
}

export function EditBookingDialog({ booking }: EditBookingDialogProps) {
  const updateBookingMutation = useUpdateBooking();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    teacher: booking.teacher,
    course: booking.course,
    discipline: booking.discipline,
    totalUnits: booking.totalUnits ?? 8,
    recordedUnits: booking.recordedUnits ?? 4,
  });

  const submit = () => {
    if (!form.teacher || !form.course || !form.discipline) {
      toast.error("Todos os campos são obrigatórios.");
      return;
    }

    updateBookingMutation.mutate(
      {
        id: booking.id,
        patch: {
          teacher: form.teacher,
          course: form.course,
          discipline: form.discipline,
          totalUnits: form.totalUnits,
          recordedUnits: form.recordedUnits,
        },
      },
      {
        onSuccess: () => {
          setOpen(false);
          toast.success("Agendamento atualizado com sucesso!");
        },
        onError: () => {
          toast.error("Falha ao atualizar", {
            description: "Ocorreu um erro. Tente novamente.",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Editar agendamento"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Editar Agendamento
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
            <Input id="discipline" value={form.discipline} onChange={(e) => setForm({ ...form, discipline: e.target.value })} placeholder="Ex: Marketing I" />
          </div>
          <div className="grid items-center gap-4">
            <Label htmlFor="totalUnits">Total de Unidades da Disciplina</Label>
            <Input id="totalUnits" type="number" value={form.totalUnits} onChange={(e) => setForm({ ...form, totalUnits: Number(e.target.value) })} />
          </div>
          <div className="grid items-center gap-4">
            <Label htmlFor="recordedUnits">Aulas a Serem Gravadas</Label>
            <Input id="recordedUnits" type="number" value={form.recordedUnits} onChange={(e) => setForm({ ...form, recordedUnits: Number(e.target.value) })} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={updateBookingMutation.isPending}>
            {updateBookingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
