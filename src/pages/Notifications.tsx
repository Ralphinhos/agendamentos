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
import { useMemo } from "react";
import { format } from "date-fns";

const NotificationsPage = () => {
  const { bookings } = useBookings();

  const cancellations = useMemo(() => {
    return bookings
      .filter(b => b.teacherConfirmation === "NEGADO")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [bookings]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>Histórico de Notificações | EAD</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Histórico de Notificações</h1>
        <p className="text-muted-foreground mt-2">
          Todos os cancelamentos de agendamento feitos por docentes.
        </p>
      </div>

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
    </main>
  );
};

export default NotificationsPage;
