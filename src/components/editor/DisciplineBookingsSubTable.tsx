import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookingWithProgress, EditingStatus } from "@/context/BookingsContext";
import { format } from "date-fns";
import { Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface DisciplineBookingsSubTableProps {
  disciplineName: string;
  allBookings: BookingWithProgress[];
  onRevert: (bookingId: string) => void;
}

const statusColors: Record<EditingStatus, string> = {
  pendente: "bg-red-500",
  "em-andamento": "bg-yellow-500",
  concluída: "bg-green-500",
};

export function DisciplineBookingsSubTable({ disciplineName, allBookings, onRevert }: DisciplineBookingsSubTableProps) {
  const disciplineBookings = useMemo(() => {
    return allBookings
      .filter(b => b.discipline === disciplineName && b.status === 'concluída')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [disciplineName, allBookings]);

  if (disciplineBookings.length === 0) {
    return <div className="p-4 text-center text-sm text-muted-foreground">Nenhuma aula concluída para esta disciplina.</div>;
  }

  return (
    <div className="p-4 bg-muted/50">
      <h4 className="font-semibold mb-2">Histórico de Aulas</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aulas Gravadas</TableHead>
            <TableHead>Progresso</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {disciplineBookings.map(booking => (
            <TableRow key={booking.id}>
              <TableCell>{format(new Date(booking.date.replace(/-/g, '/')), "dd/MM/yyyy")}</TableCell>
              <TableCell>
                <Badge className={cn("text-white", statusColors[booking.status])}>{booking.status}</Badge>
              </TableCell>
              <TableCell>{booking.lessonsRecorded ?? 0}</TableCell>
              <TableCell>
                <div className="w-full relative">
                  <Progress value={booking.disciplineProgress} className="h-5" />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-primary-foreground">
                    {booking.actualRecorded}/{booking.totalUnits}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                {booking.status === 'concluída' && (
                  <Button variant="outline" size="sm" onClick={() => onRevert(booking.id)}>
                    <Undo2 className="h-4 w-4 mr-2" />
                    Reverter
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
