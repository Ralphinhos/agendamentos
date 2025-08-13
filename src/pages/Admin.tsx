import React from "react";
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
  getExpandedRowModel,
  ExpandedState,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input";
import { ChevronDown, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

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
  const { bookings, removeBooking } = useBookings();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [ongoingExpanded, setOngoingExpanded] = useState<ExpandedState>({});
  const [completedExpanded, setCompletedExpanded] = useState<ExpandedState>({});

  // 1. Processar dados para a tabela
  const data = useMemo<BookingWithProgress[]>(() => {
    const progressMap: Record<string, { totalUnits: number; actualRecorded: number }> = {};

    const activeBookings = bookings.filter(b => b.teacherConfirmation !== 'NEGADO' && b.status !== 'cancelado');

    activeBookings.forEach(b => {
      if (!b.discipline || !b.totalUnits) return;
      if (!progressMap[b.discipline]) {
        progressMap[b.discipline] = { totalUnits: b.totalUnits, actualRecorded: 0 };
      }
      const unitsToAdd = b.lessonsRecorded ?? b.recordedUnits ?? 0;
      progressMap[b.discipline].actualRecorded += unitsToAdd;
    });

    return activeBookings.map(b => {
      const progress = progressMap[b.discipline] || { totalUnits: 0, actualRecorded: 0 };
      const percentage = progress.totalUnits > 0 ? (progress.actualRecorded / progress.totalUnits) * 100 : 0;
      return {
        ...b,
        disciplineProgress: Math.min(percentage, 100),
        actualRecorded: progress.actualRecorded,
        totalUnits: progress.totalUnits
      };
    });
  }, [bookings]);

  const columns: ColumnDef<BookingWithProgress>[] = [
    { accessorKey: "date", header: "Data", cell: ({ row }) => format(new Date(row.original.date.replace(/-/g, '/')), "dd/MM/yyyy") },
    {
      id: "time",
      header: "Horário",
      cell: ({ row }) => `${row.original.start} - ${row.original.end}`,
    },
    { accessorKey: "course", header: "Curso" },
    { accessorKey: "discipline", header: "Disciplina" },
    { accessorKey: "recordedUnits", header: "Aulas Agendadas" },
    { accessorKey: "status", header: "Status Edição", cell: ({ row }) => <Badge className={cn("text-white", statusColors[row.original.status])}>{row.original.status}</Badge> },
    {
      accessorKey: "disciplineProgress",
      header: "Progresso Disciplina",
      cell: ({ row }) => {
        const { disciplineProgress, actualRecorded, totalUnits } = row.original;
        return (
          <div className="relative w-full">
            <Progress value={disciplineProgress} className="h-5" />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-primary-foreground">
              {actualRecorded}/{totalUnits}
            </span>
          </div>
        )
      },
      sortingFn: (rowA, rowB) => (rowA.original.disciplineProgress === 100 ? 1 : 0) - (rowB.original.disciplineProgress === 100 ? 1 : 0),
    },
    {
      id: 'actions',
      header: "Ações",
      cell: ({ row }) => {
        return row.original.editorNotes ? (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" title="Ver Observações">
                <FileText className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Observações do Editor</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground">{row.original.editorNotes}</p>
              </div>
            </DialogContent>
          </Dialog>
        ) : null;
      },
    }
  ];

  const ongoingData = useMemo(() => data.filter(b => !b.completionDate), [data]);
  const completedData = useMemo(() => {
    // Para a tabela de concluídos, queremos mostrar apenas uma linha por disciplina
    const uniqueDisciplines: Record<string, BookingWithProgress> = {};
    data.forEach(b => {
      if (b.completionDate) {
        if (!uniqueDisciplines[b.discipline]) {
          uniqueDisciplines[b.discipline] = b;
        }
      }
    });
    return Object.values(uniqueDisciplines);
  }, [data]);

  const ongoingTable = useReactTable({
    data: ongoingData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    onExpandedChange: setOngoingExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    state: {
      sorting,
      globalFilter,
      expanded: ongoingExpanded,
    },
  });

  const completedAdminColumns: ColumnDef<BookingWithProgress>[] = columns.filter(c => c.id !== 'time' && c.accessorKey !== 'disciplineProgress');
  const dateColumnIndex = completedAdminColumns.findIndex(c => c.accessorKey === 'date');
  completedAdminColumns.splice(dateColumnIndex + 1, 0, {
      accessorKey: "completionDate",
      header: "Data de Conclusão",
      cell: ({ row }) => row.original.completionDate
        ? format(new Date(row.original.completionDate.replace(/-/g, '/')), "dd/MM/yyyy")
        : "N/A"
  });
  // Re-add progress bar to keep it in the completed view
  const progressColumn = columns.find(c => c.accessorKey === 'disciplineProgress');
  if (progressColumn) {
    completedAdminColumns.splice(3, 0, progressColumn);
  }


  const completedTable = useReactTable({
    data: completedData,
    columns: completedAdminColumns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    onExpandedChange: setCompletedExpanded,
    getExpandedRowModel: getExpandedRowModel(),
    state: {
      sorting,
      globalFilter,
      expanded: completedExpanded,
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
            {ongoingTable.getHeaderGroups().map(headerGroup => (
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
            {ongoingTable.getRowModel().rows.length > 0 ? (
              ongoingTable.getRowModel().rows.map(row => (
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
                  Nenhum agendamento em andamento.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Collapsible className="mt-6">
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-2 cursor-pointer">
            <h2 className="text-xl font-semibold">Disciplinas Concluídas</h2>
            <ChevronDown className="h-5 w-5 transition-transform [&[data-state=open]]:rotate-180" />
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                {completedTable.getHeaderGroups().map(headerGroup => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                      <TableHead key={header.id}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {completedTable.getRowModel().rows.length > 0 ? (
                  completedTable.getRowModel().rows.map(row => (
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
                      Nenhuma disciplina concluída.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </main>
  );
};

export default Admin;
