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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Booking } from "@/context/BookingsContext";
import { useUpdateBooking } from "@/hooks/api/useUpdateBooking";
import { Link2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EditBookingDialog } from "./EditBookingDialog";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BookingActionsProps {
  booking: Booking;
}

export function BookingActions({ booking }: BookingActionsProps) {
  const updateBookingMutation = useUpdateBooking();
  const [cancellationReason, setCancellationReason] = useState("");
  const confirmationLink = `${window.location.origin}/confirmacao/${booking.id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(confirmationLink);
    toast.success("Link copiado!");
  };

  const sendWhatsApp = (link: string, teacher: string) => {
    const message = `Olá, ${teacher}! Passando para lembrar da sua gravação agendada. Por favor, confirme sua presença no link: ${link}`;
    console.log("--- SIMULAÇÃO DE ENVIO WHATSAPP ---");
    console.log(`Mensagem: ${message}`);
    console.log("------------------------------------");
    toast.info("Simulação de WhatsApp", {
      description: "A mensagem foi registrada no console.",
    });
  };

  const handleCancelBooking = () => {
    updateBookingMutation.mutate({
      id: booking.id,
      patch: {
        status: 'cancelado-admin',
        cancellationReason: cancellationReason || 'Cancelado pelo Administrador',
        cancellationReadByEditor: false, // Ensure editor gets a notification
      }
    }, {
      onSuccess: () => {
        toast.success("Agendamento cancelado com sucesso.");
        setCancellationReason(""); // Reset reason after submission
      }
    });
  };

  return (
    <div className="flex flex-row items-center gap-0 ml-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={copyLink}
        title="Copiar link de confirmação"
      >
        <Link2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-green-600 hover:text-green-700"
        onClick={() => sendWhatsApp(confirmationLink, booking.teacher)}
        title="Enviar lembrete via WhatsApp (Simulação)"
      >
        <Send className="h-4 w-4" />
      </Button>
      <EditBookingDialog booking={booking} />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-600 hover:text-red-700"
            title="Cancelar agendamento"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja cancelar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação marcará o agendamento como 'cancelado' e notificará o editor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="cancellationReason">Motivo do Cancelamento (opcional)</Label>
            <Textarea
              id="cancellationReason"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Ex: Sala de gravação em manutenção."
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancellationReason("")}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sim, cancelar agendamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
