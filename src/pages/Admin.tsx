import { Helmet } from "react-helmet-async";
import { useBookings, EditingStatus } from "@/context/BookingsContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const statusColors: Record<EditingStatus, string> = {
  pendente: "bg-red-500",
  "em-andamento": "bg-yellow-500",
  concluída: "bg-green-500",
};

import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";

const Admin = () => {
  const { bookings } = useBookings();

  const disciplineProgress = useMemo(() => {
    const progress: Record<string, { totalUnits: number; recordedUnits: number }> = {};

    bookings.forEach(booking => {
      if (!booking.discipline || !booking.totalUnits) return;
      if (!progress[booking.discipline]) {
        progress[booking.discipline] = {
          totalUnits: booking.totalUnits,
          recordedUnits: 0,
        };
      }
      progress[booking.discipline].recordedUnits += booking.recordedUnits || 0;
    });
    return progress;
  }, [bookings]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>Agendamentos | EAD</title>
        <meta name="description" content="Visualize todos os agendamentos e o status da edição." />
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Progresso das Disciplinas</h1>
        <p className="text-muted-foreground mt-2">
          Acompanhe o andamento geral da gravação de cada disciplina.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Object.entries(disciplineProgress).map(([discipline, progress]) => {
          const percentage = (progress.recordedUnits / progress.totalUnits) * 100;
          return (
            <div key={discipline} className="bg-card p-4 rounded-lg border">
              <h3 className="font-semibold">{discipline}</h3>
              <p className="text-sm text-muted-foreground">
                {progress.recordedUnits} / {progress.totalUnits} unidades gravadas
              </p>
              <Progress value={percentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {percentage === 100 ? "Concluído" : "Em andamento"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Histórico de Agendamentos</h1>
        <p className="text-muted-foreground mt-2">
          Visualize todos os agendamentos individuais.
        </p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Docente</TableHead>
              <TableHead>Disciplina</TableHead>
              <TableHead>Aulas Gravadas</TableHead>
              <TableHead className="text-right">Status da Edição</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length > 0 ? (
              bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    {format(new Date(b.date.replace(/-/g, '/')), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{b.teacher}</TableCell>
                  <TableCell>{b.discipline}</TableCell>
                  <TableCell>{b.lessonsRecorded ?? "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <Badge className={cn("text-white", statusColors[b.status])}>
                      {b.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Nenhum agendamento encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
};

export default Admin;
