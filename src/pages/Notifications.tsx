import { Helmet } from "react-helmet-async";
import { useBookings } from "@/context/BookingsContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const NotificationsPage = () => {
  const { bookings, updateBooking } = useBookings();

  const cancellations = useMemo(() => {
    return bookings
      .filter(b => b.teacherConfirmation === "NEGADO")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bookings]);

  const uploads = useMemo(() => {
    return bookings
      .filter(b => b.uploadCompleted)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bookings]);

  // Marcar notificações de upload como lidas ao visitar a página
  useEffect(() => {
    uploads.forEach(b => {
      if (!b.uploadNotificationRead) {
        updateBooking(b.id, { uploadNotificationRead: true });
      }
    });
    // A dependência `updateBooking` é estável, `uploads` é o que importa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploads]);


  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>Histórico de Notificações | EAD</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Histórico de Notificações</h1>
        <p className="text-muted-foreground mt-2">
          Visualize cancelamentos e uploads concluídos.
        </p>
      </div>

      <div className="space-y-10">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Uploads Concluídos</h2>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data da Gravação</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.length > 0 ? (
                  uploads.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{format(new Date(b.date.replace(/-/g, '/')), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{b.discipline}</TableCell>
                      <TableCell><Badge variant="secondary">Upload Entregue</Badge></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">
                      Nenhum upload concluído.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Cancelamentos por Docentes</h2>
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data do Agendamento</TableHead>
                  <TableHead>Docente</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Motivo do Cancelamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cancellations.length > 0 ? (
                  cancellations.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{format(new Date(b.date.replace(/-/g, '/')), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{b.teacher}</TableCell>
                      <TableCell>{b.discipline}</TableCell>
                      <TableCell className="italic text-muted-foreground">
                        "{b.cancellationReason || "Nenhum motivo informado."}"
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      Nenhuma notificação de cancelamento encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotificationsPage;
