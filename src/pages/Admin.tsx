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

import { useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ListChecks, History, BarChart2 } from "lucide-react";

const Admin = () => {
  const { bookings } = useBookings();
  const [activeView, setActiveView] = useState<"agendados" | "historico" | "progresso">("agendados");

  const pendingBookings = useMemo(() => bookings.filter(b => b.status === 'pendente' || b.status === 'em-andamento'), [bookings]);
  const completedBookings = useMemo(() => bookings.filter(b => b.status === 'concluída'), [bookings]);

  const disciplineProgress = useMemo(() => {
    const progress: Record<string, { totalUnits: number; actualRecorded: number }> = {};

    bookings.forEach(booking => {
      if (!booking.discipline || !booking.totalUnits) return;

      if (!progress[booking.discipline]) {
        progress[booking.discipline] = {
          totalUnits: booking.totalUnits,
          actualRecorded: 0,
        };
      }

      // Usa lessonsRecorded (do editor) se existir, senão usa recordedUnits (metade do total agendado)
      const unitsToAdd = booking.lessonsRecorded ?? booking.recordedUnits ?? 0;
      progress[booking.discipline].actualRecorded += unitsToAdd;
    });

    return progress;
  }, [bookings]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>Agendamentos | EAD</title>
        <meta name="description" content="Visualize o progresso das disciplinas e o histórico de agendamentos." />
      </Helmet>

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Agendamentos</h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe o status das gravações e o progresso das disciplinas.
          </p>
        </div>
        <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
          <Button variant={activeView === 'agendados' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveView('agendados')}>
            <ListChecks className="mr-2 h-4 w-4" />
            Agendados
          </Button>
          <Button variant={activeView === 'historico' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveView('historico')}>
            <History className="mr-2 h-4 w-4" />
            Histórico
          </Button>
          <Button variant={activeView === 'progresso' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveView('progresso')}>
            <BarChart2 className="mr-2 h-4 w-4" />
            Progresso
          </Button>
        </div>
      </div>

      {activeView === 'agendados' && (
        <div className="rounded-lg border bg-card animate-fade-in">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Docente</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead className="text-right">Status da Edição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingBookings.length > 0 ? (
                pendingBookings.map((b) => (
                  <TableRow key={b.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <TableCell>{format(new Date(b.date.replace(/-/g, '/')), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{b.teacher}</TableCell>
                    <TableCell>{b.discipline}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={cn("text-white", statusColors[b.status])}>{b.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24">Nenhum agendamento pendente.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {activeView === 'historico' && (
        <div className="rounded-lg border bg-card animate-fade-in">
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
              {completedBookings.length > 0 ? (
                completedBookings.map((b) => (
                  <TableRow key={b.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
                    <TableCell>{format(new Date(b.date.replace(/-/g, '/')), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{b.teacher}</TableCell>
                    <TableCell>{b.discipline}</TableCell>
                    <TableCell>{b.lessonsRecorded ?? "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <Badge className={cn("text-white", statusColors[b.status])}>{b.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">Nenhum agendamento concluído.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {activeView === 'progresso' && (
        <div className="rounded-lg border bg-card animate-fade-in">
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
                  const percentage = (progress.actualRecorded / progress.totalUnits) * 100;
                  return (
                    <TableRow key={discipline}>
                      <TableCell className="font-medium">{discipline}</TableCell>
                      <TableCell>{progress.actualRecorded} / {progress.totalUnits} Un.</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={percentage} className="w-[60%]" />
                          <span className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center h-24">Nenhum progresso de disciplina para mostrar.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
};

export default Admin;
