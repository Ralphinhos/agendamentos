import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Booking } from "@/context/BookingsContext";
import { useState } from "react";

interface EditDetailsDialogProps {
  booking: Booking;
  onSave: (data: Partial<Booking>) => void;
}

export function EditDetailsDialog({ booking, onSave }: EditDetailsDialogProps) {
  const [formData, setFormData] = useState({
    lessonsRecorded: booking.lessonsRecorded ?? 0,
    editorNotes: booking.editorNotes ?? "",
  });

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Detalhes da Gravação</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <Label>Aulas Gravadas</Label>
          <Input
            type="number"
            placeholder="Nº de aulas"
            value={formData.lessonsRecorded}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                lessonsRecorded: Number(e.target.value),
              }))
            }
          />
        </div>
        <div>
          <Label>Observações do Editor</Label>
          <Textarea
            placeholder="Algum problema na gravação? Áudio, vídeo, etc."
            value={formData.editorNotes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, editorNotes: e.target.value }))
            }
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button onClick={handleSave}>Salvar Alterações</Button>
      </DialogFooter>
    </DialogContent>
  );
}
