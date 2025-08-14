import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { useBookings } from "@/context/BookingsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUpdateBooking } from "@/hooks/api/useUpdateBooking";
import { Loader2 } from "lucide-react";

const Confirmation = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { bookings } = useBookings();
  const updateBookingMutation = useUpdateBooking();

  // Local state to manage the immediate UI response after an action
  const [actionTaken, setActionTaken] = useState<"CONFIRMADO" | "NEGADO" | null>(null);
  const [isDenying, setIsDenying] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const booking = bookings.find((b) => b.id === bookingId);

  const handleConfirm = () => {
    if (!booking) return;
    updateBookingMutation.mutate({
      id: booking.id,
      patch: { teacherConfirmation: "CONFIRMADO" }
    }, {
      onSuccess: () => setActionTaken("CONFIRMADO"),
    });
  };

  const handleDeny = () => {
    if (!booking) return;
    updateBookingMutation.mutate({
      id: booking.id,
      patch: {
        teacherConfirmation: "NEGADO",
        cancellationReason,
        cancellationRead: false,
      }
    }, {
      onSuccess: () => {
        setActionTaken("NEGADO");
        // Simulação de e-mail
        console.log(`--- SIMULAÇÃO DE E-MAIL PARA GERENTE ---`);
        console.log(`Assunto: Agendamento Cancelado pelo Docente`);
        console.log(`Docente: ${booking.teacher}`);
        console.log(`Disciplina: ${booking.discipline}`);
        console.log(`Data: ${booking.date}`);
        console.log(`Motivo: ${cancellationReason}`);
        console.log(`--------------------------------------`);
      }
    });
  };

  const renderContent = () => {
    // 1. Handle booking not found
    if (!booking) {
      return (
        <Card className="w-full max-w-md text-center p-8">
          <CardHeader>
            <CardTitle>Agendamento não encontrado</CardTitle>
            <CardDescription>O link pode estar quebrado ou o agendamento foi cancelado.</CardDescription>
          </CardHeader>
        </Card>
      );
    }

    // 2. Handle immediate action taken in this session
    if (actionTaken === "CONFIRMADO") {
      return (
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-600">Agendamento Confirmado!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p>Obrigado! Por favor, envie os TPs (arquivos de apresentação) abaixo.</p>
            <div className="p-4 text-center border-2 border-dashed rounded-md">
              <Label>Enviar TPs</Label>
              <p className="text-sm text-muted-foreground mt-2">A funcionalidade de upload de arquivos será implementada aqui.</p>
            </div>
            <Button>Enviar Arquivos (demo)</Button>
          </CardContent>
        </Card>
      );
    }

    if (actionTaken === "NEGADO") {
      return (
        <Card className="w-full max-w-lg text-center p-8">
          <CardHeader>
            <CardTitle>Agendamento Recusado</CardTitle>
            <CardDescription>Sua recusa foi registrada e o administrador foi notificado. Obrigado pelo aviso.</CardDescription>
          </CardHeader>
        </Card>
      );
    }

    // 3. Handle booking already actioned in a previous session
    if (booking.teacherConfirmation) {
      return (
        <Card className="w-full max-w-md text-center p-8">
          <CardHeader>
            <CardTitle>Link Expirado</CardTitle>
            <CardDescription>Este agendamento já foi respondido. Obrigado!</CardDescription>
          </CardHeader>
        </Card>
      );
    }

    // 4. Handle user interaction for denial reason
    if (isDenying) {
      return (
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center"><CardTitle>Recusar Agendamento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Label htmlFor="cancellationReason">Por favor, informe o motivo da recusa (opcional):</Label>
            <Textarea
              id="cancellationReason"
              placeholder="Ex: Tive um imprevisto e não poderei comparecer."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsDenying(false)}>Voltar</Button>
              <Button variant="destructive" onClick={handleDeny} disabled={updateBookingMutation.isPending}>
                {updateBookingMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Confirmar Recusa
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // 5. Default view: show booking details and action buttons
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Confirmação de Agendamento de Gravação</CardTitle>
          <CardDescription>Por favor, confirme ou recuse o agendamento abaixo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-md space-y-2">
            <h3 className="font-semibold">Detalhes do Agendamento</h3>
            <p><strong>Docente:</strong> {booking.teacher}</p>
            <p><strong>Disciplina:</strong> {booking.discipline}</p>
            <p><strong>Data:</strong> {format(new Date(booking.date.replace(/-/g, '/')), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            <p><strong>Horário:</strong> {booking.start} às {booking.end} ({booking.period})</p>
          </div>
          <div className="flex justify-around gap-4">
            <Button variant="destructive" size="lg" onClick={() => setIsDenying(true)} disabled={updateBookingMutation.isPending}>Recusar Agendamento</Button>
            <Button variant="default" size="lg" onClick={handleConfirm} disabled={updateBookingMutation.isPending}>
              {updateBookingMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar Agendamento
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
      <Helmet>
        <title>Confirmação de Agendamento</title>
      </Helmet>
      {renderContent()}
    </main>
  );
};

export default Confirmation;
