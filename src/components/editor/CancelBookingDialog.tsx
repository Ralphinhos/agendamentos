import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";

interface CancelBookingDialogProps {
  onConfirm: (reason: string) => void;
}

export function CancelBookingDialog({ onConfirm }: CancelBookingDialogProps) {
  const [reason, setReason] = useState("");
  const handleConfirm = () => {
    if (!reason.trim()) {
      toast.error("Motivo obrigatório", {
        description: "Por favor, informe o motivo do cancelamento.",
      });
      return;
    }
    onConfirm(reason);
  };

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
        <AlertDialogDescription>
          Por favor, informe o motivo do cancelamento. Esta ação não pode ser
          desfeita.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="py-4">
        <Textarea
          placeholder="Descreva o motivo do cancelamento aqui..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel>Voltar</AlertDialogCancel>
        <AlertDialogAction onClick={handleConfirm} disabled={!reason.trim()}>
          Confirmar Cancelamento
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}
