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
} from "@tanstack/react-table";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Upload, FileText, XCircle, CheckCircle2, Undo2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useUpdateBooking } from "@/hooks/api/useUpdateBooking";
import { useUpdateDiscipline } from "@/hooks/api/useUpdateDiscipline";
import { CancelBookingDialog } from "@/components/editor/CancelBookingDialog";
import { EditDetailsDialog } from "@/components/editor/EditDetailsDialog";
import { OngoingBookingsTable } from "@/components/editor/OngoingBookingsTable";
import { CompletedDisciplinesTable } from "@/components/editor/CompletedDisciplinesTable";

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
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const data = useMemo<BookingWithProgress[]>(() => {
    if (!bookings) return [];

    const activeBookings = bookings.filter(b => b.teacherConfirmation !== 'NEGADO' && !b.editorCancelled);

    // Group bookings by discipline
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

        // Sort by date to calculate running total correctly
        disciplineBookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let runningTotal = 0;
        const totalUnits = disciplineBookings[0]?.totalUnits || 0;

        disciplineBookings.forEach(b => {
            runningTotal += b.lessonsRecorded ?? 0;
            const percentage = totalUnits > 0 ? (runningTotal / totalUnits) * 100 : 0;

            processedBookings.push({
                ...b,
                disciplineProgress: Math.min(percentage, 100),
                actualRecorded: runningTotal, // This is now a running total for this specific point in time
                totalUnits: totalUnits,
            });
        });
    }

    // We need to re-sort the final array by date as the grouping messed up the original order
    return processedBookings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [bookings]);

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
      patch: {
        editorCancelled: true,
        cancellationReason: reason,
        cancellationReadByEditor: true,
      }
    }, {
      onSuccess: () => {
        toast.success("Agendamento cancelado com sucesso.");
      }
    });
  };

  const handleRevertCompletion = (disciplineName: string) => {
    updateDisciplineMutation.mutate({
      disciplineName,
      patch: { completionDate: null } // Use null to ensure it's serialized in JSON
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
      patch: { completionDate }
    });
  };


  const ongoingColumns: ColumnDef<BookingWithProgress>[] = [
    { accessorKey: "date", header: "Data", cell: ({ row }) => format(new Date(row.original.date.replace(/-/g, '/')), "dd/MM/yyyy") },
    {
      id: "time",
      header: "Horário",
      cell: ({ row }) => `${row.original.start} - ${row.original.end}`,
    },
    { accessorKey: "course", header: "Curso" },
    { accessorKey: "discipline", header: "Disciplina" },
    { accessorKey: "lessonsRecorded", header: "Aulas Gravadas" },
    {
      accessorKey: "status",
      header: "Status Edição",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge
            className={cn("cursor-pointer text-white hover:brightness-125 transition-all", statusColors[row.original.status])}
            onClick={() => handleStatusChange(row.original.id, row.original.status)}
          >
            {row.original.status}
          </Badge>
          {row.original.dailyDeliveryStatus === 'delivered' && (
            <Badge variant="outline" className="text-green-600 border-green-600">Entregue</Badge>
          )}
        </div>
      )
    },
    {
      accessorKey: "disciplineProgress",
      header: "Progresso Disciplina",
      cell: ({ row }) => {
        const { disciplineProgress, actualRecorded, totalUnits } = row.original;
        const isFirstInDiscipline = ongoingData.findIndex(b => b.discipline === row.original.discipline) === row.index;

        return (
          <div className="flex items-center gap-2">
            <div className="w-[60%] relative">
              <Progress value={disciplineProgress} className="h-5" />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-primary-foreground">
                {actualRecorded}/{totalUnits}
              </span>
            </div>
            {row.original.allRecordingsDone && isFirstInDiscipline && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => handleReopenRecordings(row.original.discipline)}>
                      <Undo2 className="h-4 w-4 text-blue-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reabrir Gravações</p>
                  </TooltipContent>
                </Tooltip>
                 <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => handleCompleteDiscipline(row.original.discipline)}>
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Concluir Disciplina (Move para a tabela de concluídas)</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
            {isFirstInDiscipline && !row.original.allRecordingsDone && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => handleMarkAllRecordingsDone(row.original.discipline)}>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Finalizar Todas as Gravações</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Dialog
            open={editingBookingId === row.original.id}
            onOpenChange={(isOpen) => !isOpen && setEditingBookingId(null)}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setEditingBookingId(row.original.id)}>
                    <FileText className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver/Editar Detalhes</p>
              </TooltipContent>
            </Tooltip>
            {editingBookingId === row.original.id && <EditDetailsDialog booking={row.original} onSave={handleSaveDetails} />}
          </Dialog>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Link to={`/upload/${row.original.id}`}>
                  <Upload className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upload de Arquivos</p>
            </TooltipContent>
          </Tooltip>

           {row.original.status !== 'concluída' && (
            <AlertDialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cancelar Agendamento</p>
                </TooltipContent>
              </Tooltip>
              <CancelBookingDialog onConfirm={(reason) => handleCancelBooking(row.original.id, reason)} />
            </AlertDialog>
          )}
        </div>
      )
    }
  ];

  const completedColumns: ColumnDef<BookingWithProgress>[] = [
    {
      accessorKey: "completionDate",
      header: "Data de Conclusão",
      cell: ({ row }) => row.original.completionDate
        ? format(new Date(row.original.completionDate.replace(/-/g, '/')), "dd/MM/yyyy")
        : "N/A"
    },
    { accessorKey: "course", header: "Curso" },
    { accessorKey: "discipline", header: "Disciplina" },
    {
      accessorKey: "disciplineProgress",
      header: "Progresso Disciplina",
      cell: ({ row }) => {
        const { disciplineProgress, actualRecorded, totalUnits } = row.original;
        return (
          <div className="w-full relative">
            <Progress value={disciplineProgress} className="h-5" />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-primary-foreground">
              {actualRecorded}/{totalUnits}
            </span>
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">Ver Detalhes</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Detalhes da Gravação Concluída</DialogTitle></DialogHeader>
              <div className="space-y-2 py-4">
                <p><strong>Curso:</strong> {row.original.course}</p>
                <p><strong>Disciplina:</strong> {row.original.discipline}</p>
                <p><strong>Observações Finais:</strong> {row.original.editorNotes || "Nenhuma"}</p>
                <p><strong>Aulas Gravadas (Total):</strong> {row.original.lessonsRecorded}</p>
              </div>
            </DialogContent>
          </Dialog>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleRevertCompletion(row.original.discipline)}
          >
            Reverter
          </Button>
        </div>
      )
    }
  ];


  const ongoingData = useMemo(() => data ? data.filter(b => !b.completionDate) : [], [data]);
  const completedData = useMemo(() => {
    if (!data) return [];
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
    columns: ongoingColumns,
    state: { sorting, globalFilter, expanded, },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

   const completedTable = useReactTable({
    data: completedData,
    columns: completedColumns,
    state: { sorting, globalFilter, },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <TooltipProvider>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Helmet>
        <title>Painel de Edição | EAD</title>
        <meta name="description" content="Acompanhe o status de edição das gravações." />
      </Helmet>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">Painel de Edição</h1>
        <Input
          placeholder="Filtrar por qualquer campo..."
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <OngoingBookingsTable table={ongoingTable} columns={ongoingColumns} />
      <CompletedDisciplinesTable table={completedTable} columns={completedColumns} />

    </main>
  </TooltipProvider>
  );
};

export default Editor;
