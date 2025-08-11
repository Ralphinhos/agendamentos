import { Helmet } from "react-helmet-async";
import { useBookings, EditingStatus, Booking } from "@/context/BookingsContext";
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
import { useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input";

const statusColors: Record<EditingStatus, string> = {
  pendente: "bg-red-500",
  "em-andamento": "bg-yellow-500",
  concluída: "bg-green-500",
};

// Estrutura de dados para a nova tabela
export type BookingWithProgress = Booking & {
  disciplineProgress: number; // 0-100
};

const Admin = () => {
  const { bookings } = useBookings();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // 1. Processar dados para a tabela
  const data = useMemo<BookingWithProgress[]>(() => {
    const progressMap: Record<string, { totalUnits: number; actualRecorded: number }> = {};

    bookings.forEach(b => {
      if (!b.discipline || !b.totalUnits) return;
      if (!progressMap[b.discipline]) {
        progressMap[b.discipline] = { totalUnits: b.totalUnits, actualRecorded: 0 };
      }
      const unitsToAdd = b.lessonsRecorded ?? b.recordedUnits ?? 0;
      progressMap[b.discipline].actualRecorded += unitsToAdd;
    });

    return bookings.map(b => {
      const progress = progressMap[b.discipline];
      const disciplineProgress = progress ? (progress.actualRecorded / progress.totalUnits) * 100 : 0;
      return { ...b, disciplineProgress };
    });
  }, [bookings]);

  const columns: ColumnDef<BookingWithProgress>[] = [
    { accessorKey: "date", header: "Data", cell: ({ row }) => format(new Date(row.original.date.replace(/-/g, '/')), "dd/MM/yyyy") },
    { accessorKey: "teacher", header: "Docente" },
    { accessorKey: "discipline", header: "Disciplina" },
    { accessorKey: "recordedUnits", header: "Aulas Agendadas" },
    { accessorKey: "status", header: "Status Edição", cell: ({ row }) => <Badge className={cn("text-white", statusColors[row.original.status])}>{row.original.status}</Badge> },
    {
      accessorKey: "disciplineProgress",
      header: "Progresso Disciplina",
      cell: ({ row }) => {
        const percentage = row.original.disciplineProgress;
        return (
          <div className="flex items-center gap-2">
            <Progress value={percentage} className="w-[80%]" />
            <span className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</span>
          </div>
        )
      },
      // Lógica para mover concluídos para o fim
      sortingFn: (rowA, rowB) => (rowA.original.disciplineProgress === 100 ? 1 : 0) - (rowB.original.disciplineProgress === 100 ? 1 : 0),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
    },
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>Agendamentos | EAD</title>
        <meta name="description" content="Visualize e gerencie todos os agendamentos." />
      </Helmet>

      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold">Agendamentos</h1>
          <p className="text-muted-foreground mt-2">
            Filtre, ordene e visualize todos os agendamentos.
          </p>
        </div>
        <Input
          placeholder="Filtrar por qualquer campo..."
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id} onClick={header.column.getToggleSortingHandler()}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? null}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum resultado encontrado.
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
