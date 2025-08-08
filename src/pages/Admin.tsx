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

      <div className="rounded-md border bg-card mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Disciplina</TableHead>
              <TableHead className="w-[200px]">Progresso</TableHead>
              <TableHead className="w-[250px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(disciplineProgress).length > 0 ? (
              Object.entries(disciplineProgress).map(([discipline, progress]) => {
                const percentage = (progress.recordedUnits / progress.totalUnits) * 100;
                return (
                  <TableRow key={discipline}>
                    <TableCell className="font-medium">{discipline}</TableCell>
                    <TableCell>
                      {progress.recordedUnits} / {progress.totalUnits} Un.
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={percentage} className="w-[60%]" />
                        <span className="text-xs text-muted-foreground">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  Nenhum progresso de disciplina para mostrar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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
