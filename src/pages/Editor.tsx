import { Helmet } from "react-helmet-async";
import { useBookings, BookingWithProgress } from "@/context/BookingsContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Booking, EditingStatus } from "@/context/BookingsContext";
import { toast } from "sonner";
import {
  ColumnDef,
  useReactTable,
  SortingState,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  ExpandedState,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Upload, FileText, XCircle, CheckCircle2, Undo2, Check, CalendarClock, ListChecks, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useUpdateBooking } from "@/hooks/api/useUpdateBooking";
import { useUpdateDiscipline } from "@/hooks/api/useUpdateDiscipline";
import { CancelBookingDialog } from "@/components/editor/CancelBookingDialog";
import { EditDetailsDialog } from "@/components/editor/EditDetailsDialog";
import { OngoingBookingsTable } from "@/components/editor/OngoingBookingsTable";
import { CompletedDisciplinesTable } from "@/components/editor/CompletedDisciplinesTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


const statusColors: Record<EditingStatus, string> = {
  pendente: "bg-red-500",
  "em-andamento": "bg-yellow-500",
  concluída: "bg-green-500",
};

const nextStatus: Record<EditingStatus, EditingStatus> = {
  pendente: "em-andamento",
  "em-andamento": "concluída",
  concluída: "pendente",
};

const Editor = () => {
  const { bookings } = useBookings();
  const updateBookingMutation = useUpdateBooking();
  const updateDisciplineMutation = useUpdateDiscipline();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [completedSorting, setCompletedSorting] = useState<SortingState>([]);
  const [inProgressSorting, setInProgressSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const data = useMemo<BookingWithProgress[]>(() => {
    if (!bookings) return [];
    const activeBookings = bookings.filter(b => b.teacherConfirmation !== 'NEGADO' && !b.editorCancelled);
    const bookingsByDiscipline: Record<string, Booking[]> = {};
    activeBookings.forEach(b => {
        if (!b.discipline) return;
        if (!bookingsByDiscipline[b.discipline]) {
            bookingsByDiscipline[b.discipline] = [];
        }
        bookingsByDiscipline[b.discipline].push(b);
    });
    const processedBookings: BookingWithProgress[] = [];
    for (const disciplineName in bookingsByDiscipline) {
        const disciplineBookings = bookingsByDiscipline[disciplineName];
        disciplineBookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        let runningTotal = 0;
        const totalUnits = disciplineBookings[0]?.totalUnits || 0;
        disciplineBookings.forEach(b => {
            runningTotal += b.lessonsRecorded ?? 0;
            const percentage = totalUnits > 0 ? (runningTotal / totalUnits) * 100 : 0;
            processedBookings.push({
                ...b,
                disciplineProgress: Math.min(percentage, 100),
                actualRecorded: runningTotal,
                totalUnits: totalUnits,
            });
        });
    }
    return processedBookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [bookings]);

  // Handlers... (omitted for brevity, they are unchanged)
  const handleStatusChange = (id: string, currentStatus: EditingStatus) => {
    updateBookingMutation.mutate({ id, patch: { status: nextStatus[currentStatus] }});
  };
  const handleSaveDetails = (data: Partial<Booking>) => {
    if (!editingBookingId) return;
    updateBookingMutation.mutate({ id: editingBookingId, patch: data }, {
      onSuccess: () => {
        setEditingBookingId(null);
        toast.success("Detalhes salvos com sucesso!");
      }
    });
  };
  const handleCancelBooking = (bookingId: string, reason: string) => {
    updateBookingMutation.mutate({
      id: bookingId,
      patch: { editorCancelled: true, cancellationReason: reason, cancellationReadByEditor: true, }
    }, {
      onSuccess: () => { toast.success("Agendamento cancelado com sucesso."); }
    });
  };
  const handleRevertCompletion = (disciplineName: string) => {
    updateDisciplineMutation.mutate({
      disciplineName,
      patch: { completionDate: null }
    });
  };
  const handleMarkAllRecordingsDone = (disciplineName: string) => {
    updateDisciplineMutation.mutate({
      disciplineName,
      patch: { allRecordingsDone: true }
    });
  };
  const handleReopenRecordings = (disciplineName: string) => {
    updateDisciplineMutation.mutate({
      disciplineName,
      patch: { allRecordingsDone: false }
    });
  };
  const handleCompleteDiscipline = (disciplineName: string) => {
    const completionDate = new Date().toISOString().split('T')[0];
    updateDisciplineMutation.mutate({
      disciplineName,
      patch: { completionDate, status: 'concluída', allRecordingsDone: true, }
    });
  };

  // Main table for daily schedule
  const ongoingColumns: ColumnDef<BookingWithProgress>[] = [
    { accessorKey: "date", header: "Data", cell: ({ row }) => format(new Date(row.original.date.replace(/-/g, '/')), "dd/MM/yyyy") },
    { id: "time", header: "Horário", cell: ({ row }) => `${row.original.start} - ${row.original.end}`},
    { accessorKey: "teacher", header: "Docente" },
    { accessorKey: "course", header: "Curso" },
    { accessorKey: "discipline", header: "Disciplina" },
    { accessorKey: "lessonsRecorded", header: "Aulas Gravadas" },
    { accessorKey: "status", header: "Status Edição", cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge className={cn("cursor-pointer", statusColors[row.original.status])} onClick={() => handleStatusChange(row.original.id, row.original.status)}>{row.original.status}</Badge>
          {row.original.dailyDeliveryStatus === 'delivered' && <Badge variant="outline" className="text-green-600 border-green-600">Entregue</Badge>}
        </div>
    )},
    { id: "actions", cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Dialog open={editingBookingId === row.original.id} onOpenChange={(isOpen) => !isOpen && setEditingBookingId(null)}>
            <Tooltip><TooltipTrigger asChild><DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => setEditingBookingId(row.original.id)}><FileText className="h-4 w-4" /></Button></DialogTrigger></TooltipTrigger><TooltipContent><p>Ver/Editar Detalhes</p></TooltipContent></Tooltip>
            {editingBookingId === row.original.id && <EditDetailsDialog booking={row.original} onSave={handleSaveDetails} />}
          </Dialog>
          <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" asChild><Link to={`/upload/${row.original.id}`}><Upload className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent><p>Upload de Arquivos</p></TooltipContent></Tooltip>
           {row.original.status !== 'concluída' && (
            <AlertDialog>
              <Tooltip><TooltipTrigger asChild><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600"><XCircle className="h-4 w-4" /></Button></AlertDialogTrigger></TooltipTrigger><TooltipContent><p>Cancelar Agendamento</p></TooltipContent></Tooltip>
              <CancelBookingDialog onConfirm={(reason) => handleCancelBooking(row.original.id, reason)} />
            </AlertDialog>
          )}
        </div>
    )}
  ];

  // Data sources for the three tables
  const dailyScheduleData = useMemo(() => data ? data.filter(b => !b.completionDate) : [], [data]);
  const completedData = useMemo(() => {
    if (!data) return [];
    const uniqueDisciplines: Record<string, BookingWithProgress> = {};
    data.forEach(b => {
      if (b.completionDate) {
        if (!uniqueDisciplines[b.discipline]) {
          uniqueDisciplines[b.discipline] = b;
        } else { // Always take the latest booking for the completed summary
            if(new Date(b.date) > new Date(uniqueDisciplines[b.discipline].date)) {
                uniqueDisciplines[b.discipline] = b;
            }
        }
      }
    });
    return Object.values(uniqueDisciplines);
  }, [data]);
  const inProgressData = useMemo(() => {
      const disciplineSummary: Record<string, BookingWithProgress> = {};
      const completedOrScheduledForCompletion = new Set(completedData.map(d => d.discipline));

      data.forEach(booking => {
          if (booking.discipline && !completedOrScheduledForCompletion.has(booking.discipline)) {
              // If it's the last known booking for this discipline, use it for summary
              disciplineSummary[booking.discipline] = booking;
          }
      });
      return Object.values(disciplineSummary);
  }, [data, completedData]);


  // Table instances
  const dailyScheduleTable = useReactTable({ data: dailyScheduleData, columns: ongoingColumns, state: { sorting, globalFilter, expanded, }, onSortingChange: setSorting, onGlobalFilterChange: setGlobalFilter, onExpandedChange: setExpanded, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel(), getExpandedRowModel: getExpandedRowModel() });
  const completedTable = useReactTable({ data: completedData, columns: [
    { accessorKey: "completionDate", header: "Data de Conclusão", cell: ({ row }) => row.original.completionDate ? format(new Date(row.original.completionDate.replace(/-/g, '/')), "dd/MM/yyyy") : "N/A" },
    { accessorKey: "course", header: "Curso" },
    { accessorKey: "discipline", header: "Disciplina" },
    { accessorKey: "disciplineProgress", header: "Progresso", cell: ({ row }) => {
        const { disciplineProgress, actualRecorded, totalUnits } = row.original;
        return (<div className="w-full relative"><Progress value={disciplineProgress} className="h-5" /><span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-primary-foreground">{actualRecorded}/{totalUnits}</span></div>)
    }},
    { id: "actions", cell: ({ row }) => (
        <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleRevertCompletion(row.original.discipline)}>Reverter</Button>
        </div>
    )}
  ], state: { sorting: completedSorting, globalFilter, }, onSortingChange: setCompletedSorting, onGlobalFilterChange: setGlobalFilter, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() });
  const inProgressTable = useReactTable({ data: inProgressData, columns: [
    { accessorKey: "discipline", header: "Disciplina" },
    { accessorKey: "teacher", header: "Docente" },
    { accessorKey: "course", header: "Curso" },
    { accessorKey: "disciplineProgress", header: "Progresso", cell: ({ row }) => {
        const { disciplineProgress, actualRecorded, totalUnits } = row.original;
        const progressIsComplete = actualRecorded >= totalUnits;
        return (
            <div className="flex items-center gap-2"><div className="w-[60%] relative"><Progress value={disciplineProgress} className="h-5" /><span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-primary-foreground">{actualRecorded}/{totalUnits}</span></div>
            {progressIsComplete && !row.original.allRecordingsDone && <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleMarkAllRecordingsDone(row.original.discipline)}><CheckCircle2 className="h-4 w-4 text-green-600" /></Button></TooltipTrigger><TooltipContent><p>Finalizar Todas as Gravações</p></TooltipContent></Tooltip>}
            {row.original.allRecordingsDone && <><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleReopenRecordings(row.original.discipline)}><Undo2 className="h-4 w-4 text-blue-600" /></Button></TooltipTrigger><TooltipContent><p>Reabrir Gravações</p></TooltipContent></Tooltip><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={() => handleCompleteDiscipline(row.original.discipline)}><Check className="h-4 w-4 text-green-600" /></Button></TooltipTrigger><TooltipContent><p>Concluir Disciplina</p></TooltipContent></Tooltip></>}
            </div>
        )
    }},
  ], state: { sorting: inProgressSorting, globalFilter, }, onSortingChange: setInProgressSorting, onGlobalFilterChange: setGlobalFilter, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() });


  return (
    <TooltipProvider>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Helmet>
          <title>Painel de Edição | EAD</title>
          <meta name="description" content="Acompanhe o status de edição das gravações." />
        </Helmet>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Painel de Edição</h1>
          <Input placeholder="Filtrar por qualquer campo..." value={globalFilter ?? ''} onChange={e => setGlobalFilter(e.target.value)} className="max-w-sm" />
        </div>

        <Tabs defaultValue="daily-schedule">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily-schedule"><CalendarClock className="mr-2 h-4 w-4" />Agenda do Dia</TabsTrigger>
            <TabsTrigger value="in-progress"><ListChecks className="mr-2 h-4 w-4" />Disciplinas em Andamento</TabsTrigger>
            <TabsTrigger value="completed"><CheckCircle className="mr-2 h-4 w-4" />Disciplinas Concluídas</TabsTrigger>
          </TabsList>

          <TabsContent value="daily-schedule">
            <OngoingBookingsTable table={dailyScheduleTable} columns={ongoingColumns} />
          </TabsContent>

          <TabsContent value="in-progress">
            <div className="rounded-lg border bg-card mt-4">
                <Table>
                    <TableHeader>{inProgressTable.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
                    <TableBody>{inProgressTable.getRowModel().rows.length > 0 ? inProgressTable.getRowModel().rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={inProgressTable.getAllColumns().length} className="h-24 text-center">Nenhuma disciplina em andamento.</TableCell></TableRow>}</TableBody>
                </Table>
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <CompletedDisciplinesTable table={completedTable} columns={completedTable.options.columns} />
          </TabsContent>
        </Tabs>
      </main>
    </TooltipProvider>
  );
};

export default Editor;
