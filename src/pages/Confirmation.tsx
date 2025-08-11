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

const Confirmation = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const { bookings, updateBooking } = useBookings();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDenied, setIsDenied] = useState(false);
  const [isDenying, setIsDenying] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");

  const booking = bookings.find((b) => b.id === bookingId);

  const handleConfirm = () => {
    if (!booking) return;
    updateBooking(booking.id, { teacherConfirmation: "CONFIRMADO" });
    setIsConfirmed(true);
  };

  const handleDeny = () => {
    if (!booking) return;
    updateBooking(booking.id, {
      teacherConfirmation: "NEGADO",
      cancellationReason,
      cancellationRead: false,
      status: "pendente", // Mantém o status para não desaparecer do histórico imediatamente
    });
    setIsDenied(true);
    // Simulação de e-mail
    console.log(`--- SIMULAÇÃO DE E-MAIL PARA GERENTE ---`);
    console.log(`Assunto: Agendamento Cancelado pelo Docente`);
    console.log(`Docente: ${booking.teacher}`);
    console.log(`Disciplina: ${booking.discipline}`);
    console.log(`Data: ${booking.date}`);
    console.log(`Motivo: ${cancellationReason}`);
    console.log(`--------------------------------------`);
  };

  if (isDenied) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-lg text-center p-8">
          <CardHeader>
            <CardTitle>Agendamento Recusado</CardTitle>
            <CardDescription>Sua recusa foi registrada e o administrador foi notificado. Obrigado pelo aviso.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Agendamento não encontrado</CardTitle>
            <CardDescription>O link pode estar quebrado ou o agendamento foi cancelado.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <main className="flex items-center justify-center min-h-screen bg-gray-50">
      <Helmet>
        <title>Confirmação de Agendamento</title>
      </Helmet>
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Confirmação de Agendamento de Gravação</CardTitle>
          <CardDescription>
            Por favor, confirme ou recuse o agendamento abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 border rounded-md space-y-2">
            <h3 className="font-semibold">Detalhes do Agendamento</h3>
            <p><strong>Docente:</strong> {booking.teacher}</p>
            <p><strong>Disciplina:</strong> {booking.discipline}</p>
            <p><strong>Data:</strong> {format(new Date(booking.date.replace(/-/g, '/')), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            <p><strong>Horário:</strong> {booking.start} às {booking.end} ({booking.period})</p>
          </div>

          {isConfirmed ? (
            <div className="space-y-4 text-center">
              <h3 className="text-xl font-bold text-green-600">Agendamento Confirmado!</h3>
              <p>Obrigado! Por favor, envie os TPs (arquivos de apresentação) abaixo.</p>
              <div className="p-4 text-center border-2 border-dashed rounded-md">
                <Label>Enviar TPs</Label>
                <p className="text-sm text-muted-foreground mt-2">
                  A funcionalidade de upload de arquivos será implementada aqui.
                </p>
              </div>
               <Button>Enviar Arquivos (demo)</Button>
            </div>
          ) : isDenying ? (
            <div className="space-y-4">
              <Label htmlFor="cancellationReason">Motivo da recusa (opcional)</Label>
              <Textarea
                id="cancellationReason"
                placeholder="Ex: Tive um imprevisto e não poderei comparecer."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsDenying(false)}>Voltar</Button>
                <Button variant="destructive" onClick={handleDeny}>Confirmar Recusa</Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-around gap-4">
              <Button variant="destructive" size="lg" onClick={() => setIsDenying(true)}>
                Recusar Agendamento
              </Button>
              <Button variant="default" size="lg" onClick={handleConfirm}>
                Confirmar Agendamento
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default Confirmation;
