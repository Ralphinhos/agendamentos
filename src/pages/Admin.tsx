import { Helmet } from "react-helmet-async";
import { useBookings, BookingWithProgress, Booking } from "@/context/BookingsContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { EditingStatus } from "@/context/BookingsContext";
import {
  ColumnDef,
  useReactTable,
  SortingState,
  getSortedRowModel,
  getFilteredRowModel,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Progress } from "@/components/ui/progress";
import { CalendarClock, ListChecks, CheckCircle, FileText, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUpdateBooking } from "@/hooks/api/useUpdateBooking";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const statusColors: Record<EditingStatus, string> = {
  pendente: "bg-red-500",
  "em-andamento": "bg-yellow-500",
  concluída: "bg-green-500",
  cancelado: "bg-gray-500",
};

const CancelBookingDialog = ({ booking, onOpenChange, open }: { booking: Booking; open: boolean; onOpenChange: (open: boolean) => void; }) => {
  const [reason, setReason] = useState("");
  const updateBookingMutation = useUpdateBooking();

  const handleCancelBooking = () => {
    updateBookingMutation.mutate({
      id: booking.id,
      patch: {
        status: "cancelado",
        cancellationReason: reason,
        cancellationRead: false, // Notifica o editor
      },
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setReason("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar Agendamento</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita. O editor será notificado.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="cancellationReason">Motivo do Cancelamento (opcional)</Label>
          <Textarea
            id="cancellationReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Informe o motivo para o editor..."
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button variant="destructive" onClick={handleCancelBooking} disabled={updateBookingMutation.isPending}>
            Confirmar Cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const Admin = () => {
  const { bookings } = useBookings();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [inProgressSorting, setInProgressSorting] = useState<SortingState>([]);
  const [completedSorting, setCompletedSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [dialogState, setDialogState] = useState<{ [key: string]: boolean }>({});

  const handleOpenChange = (bookingId: string, open: boolean) => {
    setDialogState(prev => ({ ...prev, [bookingId]: open }));
  };

  const data = useMemo<BookingWithProgress[]>(() => {
    if (!bookings) return [];
    const activeBookings = bookings.filter(b => b.teacherConfirmation !== 'NEGADO');

    const progressMap: Record<string, { totalUnits: number; actualRecorded: number }> = {};
    activeBookings.forEach(b => {
      if (!b.discipline || !b.totalUnits) return;
      if (!progressMap[b.discipline]) {
        progressMap[b.discipline] = { totalUnits: b.totalUnits, actualRecorded: 0 };
      }
      progressMap[b.discipline].actualRecorded += b.lessonsRecorded ?? b.recordedUnits ?? 0;
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

  // Data sources for the three tables
  const dailyScheduleData = useMemo(() => data.filter(b => !b.completionDate && b.status !== 'cancelado'), [data]);
  const completedData = useMemo(() => {
    const uniqueDisciplines: Record<string, BookingWithProgress> = {};
    data.forEach(b => {
      if (b.completionDate) {
        if (!uniqueDisciplines[b.discipline] || new Date(b.date) > new Date(uniqueDisciplines[b.discipline].date)) {
          uniqueDisciplines[b.discipline] = b;
        }
      }
    });
    return Object.values(uniqueDisciplines);
  }, [data]);
  const inProgressData = useMemo(() => {
    const disciplineSummary: Record<string, BookingWithProgress> = {};
    const completedDisciplines = new Set(completedData.map(d => d.discipline));
    data.forEach(booking => {
      if (booking.discipline && !completedDisciplines.has(booking.discipline)) {
        disciplineSummary[booking.discipline] = booking;
      }
    });
    return Object.values(disciplineSummary);
  }, [data, completedData]);

  // Column Definitions
  const dailyScheduleCols: ColumnDef<BookingWithProgress>[] = [
    { accessorKey: "date", header: "Data", cell: ({ row }) => format(new Date(row.original.date.replace(/-/g, '/')), "dd/MM/yyyy") },
    { accessorKey: "teacher", header: "Docente" },
    { accessorKey: "course", header: "Curso" },
    { accessorKey: "discipline", header: "Disciplina" },
    { accessorKey: "status", header: "Status Edição", cell: ({ row }) => <Badge className={cn("text-white", statusColors[row.original.status])}>{row.original.status}</Badge> },
    { id: 'actions', header: "Ações", cell: ({ row }) => (
      <div className="flex items-center space-x-2">
        {row.original.editorNotes && (
          <Dialog><DialogTrigger asChild><Button variant="ghost" size="icon" title="Ver Observações"><FileText className="h-4 w-4" /></Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Observações do Editor</DialogTitle></DialogHeader><div className="py-4"><p className="text-sm text-muted-foreground">{row.original.editorNotes}</p></div></DialogContent></Dialog>
        )}
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" title="Cancelar Agendamento" onClick={() => handleOpenChange(row.original.id, true)}>
            <X className="h-4 w-4 text-red-500" />
          </Button>
        </DialogTrigger>
        <CancelBookingDialog
          booking={row.original}
          open={dialogState[row.original.id] || false}
          onOpenChange={(open) => handleOpenChange(row.original.id, open)}
        />
      </div>
    )},
  ];
  const inProgressCols: ColumnDef<BookingWithProgress>[] = [
    { accessorKey: "discipline", header: "Disciplina" },
    { accessorKey: "teacher", header: "Docente" },
    { accessorKey: "course", header: "Curso" },
    { accessorKey: "disciplineProgress", header: "Progresso", cell: ({ row }) => (
        <div className="relative w-full"><Progress value={row.original.disciplineProgress} className="h-5" /><span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-primary-foreground">{row.original.actualRecorded}/{row.original.totalUnits}</span></div>
    )},
  ];
  const completedCols: ColumnDef<BookingWithProgress>[] = [
    { accessorKey: "completionDate", header: "Data de Conclusão", cell: ({ row }) => row.original.completionDate ? format(new Date(row.original.completionDate.replace(/-/g, '/')), "dd/MM/yyyy") : "N/A" },
    { accessorKey: "course", header: "Curso" },
    { accessorKey: "discipline", header: "Disciplina" },
    inProgressCols.find(c => c.accessorKey === 'disciplineProgress')!,
  ];

  // Table Instances
  const dailyScheduleTable = useReactTable({ data: dailyScheduleData, columns: dailyScheduleCols, state: { sorting, globalFilter }, onSortingChange: setSorting, onGlobalFilterChange: setGlobalFilter, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() });
  const inProgressTable = useReactTable({ data: inProgressData, columns: inProgressCols, state: { sorting: inProgressSorting, globalFilter }, onSortingChange: setInProgressSorting, onGlobalFilterChange: setGlobalFilter, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() });
  const completedTable = useReactTable({ data: completedData, columns: completedCols, state: { sorting: completedSorting, globalFilter }, onSortingChange: setCompletedSorting, onGlobalFilterChange: setGlobalFilter, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() });

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>Agendamentos | EAD</title>
        <meta name="description" content="Visualize e gerencie todos os agendamentos." />
      </Helmet>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold">Painel do Administrador</h1>
          <p className="text-muted-foreground mt-2">Visualize o status de todos os agendamentos e gravações.</p>
        </div>
        <Input placeholder="Filtrar por qualquer campo..." value={globalFilter} onChange={e => setGlobalFilter(e.target.value)} className="max-w-sm" />
      </div>
      <Tabs defaultValue="daily-schedule">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily-schedule"><CalendarClock className="mr-2 h-4 w-4" />Agenda do Dia</TabsTrigger>
          <TabsTrigger value="in-progress"><ListChecks className="mr-2 h-4 w-4" />Disciplinas em Andamento</TabsTrigger>
          <TabsTrigger value="completed"><CheckCircle className="mr-2 h-4 w-4" />Disciplinas Concluídas</TabsTrigger>
        </TabsList>
        <TabsContent value="daily-schedule">
          <div className="rounded-lg border bg-card mt-4"><Table><TableHeader>{dailyScheduleTable.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id} onClick={h.column.getToggleSortingHandler()}>{flexRender(h.column.columnDef.header, h.getContext())}{{ asc: ' ▲', desc: ' ▼' }[h.column.getIsSorted() as string] ?? null}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{dailyScheduleTable.getRowModel().rows.length > 0 ? dailyScheduleTable.getRowModel().rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={dailyScheduleCols.length} className="h-24 text-center">Nenhum agendamento futuro.</TableCell></TableRow>}</TableBody></Table></div>
        </TabsContent>
        <TabsContent value="in-progress">
          <div className="rounded-lg border bg-card mt-4"><Table><TableHeader>{inProgressTable.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id} onClick={h.column.getToggleSortingHandler()}>{flexRender(h.column.columnDef.header, h.getContext())}{{ asc: ' ▲', desc: ' ▼' }[h.column.getIsSorted() as string] ?? null}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{inProgressTable.getRowModel().rows.length > 0 ? inProgressTable.getRowModel().rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={inProgressCols.length} className="h-24 text-center">Nenhuma disciplina em andamento.</TableCell></TableRow>}</TableBody></Table></div>
        </TabsContent>
        <TabsContent value="completed">
          <div className="rounded-lg border bg-card mt-4"><Table><TableHeader>{completedTable.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id} onClick={h.column.getToggleSortingHandler()}>{flexRender(h.column.columnDef.header, h.getContext())}{{ asc: ' ▲', desc: ' ▼' }[h.column.getIsSorted() as string] ?? null}</TableHead>)}</TableRow>)}</TableHeader><TableBody>{completedTable.getRowModel().rows.length > 0 ? completedTable.getRowModel().rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={completedCols.length} className="h-24 text-center">Nenhuma disciplina concluída.</TableCell></TableRow>}</TableBody></Table></div>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Admin;
