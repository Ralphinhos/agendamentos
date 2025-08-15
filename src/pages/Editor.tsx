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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { Upload, FileText, XCircle, Undo2, CalendarClock, ListChecks, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useUpdateBooking } from "@/hooks/api/useUpdateBooking";
import { useUpdateDiscipline } from "@/hooks/api/useUpdateDiscipline";
import { CancelBookingDialog } from "@/components/editor/CancelBookingDialog";
import { EditDetailsDialog } from "@/components/editor/EditDetailsDialog";

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

  const data = useMemo<Booking[]>(() => {
    if (!bookings) return [];
    return bookings
      .filter(b => b.teacherConfirmation !== 'NEGADO' && b.status !== 'cancelado')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [bookings]);

  const handleStatusChange = (id: string, currentStatus: EditingStatus) => {
    const newStatus = nextStatus[currentStatus];
    updateBookingMutation.mutate({ id, patch: { status: newStatus }});
    if (newStatus === 'concluída') {
        toast.success("Agendamento concluído!", {
            description: "Movido para a aba 'Disciplinas em Andamento'.",
        });
    }
  };

  const handleRevertBooking = (bookingId: string) => {
    updateBookingMutation.mutate(
      { id: bookingId, patch: { status: 'em-andamento' } },
      {
        onSuccess: () => {
          toast.success("Status revertido.", {
            description: "O agendamento voltou para a 'Agenda do Dia'.",
          });
        },
      }
    );
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
        status: 'cancelado',
        cancellationReason: reason,
        editorCancelled: true,
        editorCancellationRead: false
      }
    }, {
      onSuccess: () => { toast.success("Agendamento cancelado com sucesso."); }
    });
  };

  const handleRevertDiscipline = (disciplineName: string) => {
    updateDisciplineMutation.mutate({
      disciplineName,
      patch: { completionDate: null }
    });
  };

  const handleCompleteDiscipline = (disciplineName: string) => {
    const completionDate = new Date().toISOString().split('T')[0];
    updateDisciplineMutation.mutate({
      disciplineName,
      patch: { completionDate }
    });
  };

  const dailyScheduleData = useMemo(() => data.filter(b => (b.status === 'pendente' || b.status === 'em-andamento') && !b.completionDate), [data]);
  const inProgressData = useMemo(() => data.filter(b => b.status === 'concluída' && !b.completionDate), [data]);
  const completedData = useMemo(() => {
    if (!data) return [];
    const uniqueDisciplines: Record<string, Booking> = {};
    data.forEach(b => {
      if (b.completionDate) {
        if (!uniqueDisciplines[b.discipline] || new Date(b.date) > new Date(uniqueDisciplines[b.discipline].date)) {
          uniqueDisciplines[b.discipline] = b;
        }
      }
    });
    return Object.values(uniqueDisciplines);
  }, [data]);

  const dailyColumns: ColumnDef<Booking>[] = [
    { accessorKey: "date", header: "Data", cell: ({ row }) => format(new Date(row.original.date.replace(/-/g, '/')), "dd/MM/yyyy") },
    { id: "time", header: "Horário", cell: ({ row }) => `${row.original.start} - ${row.original.end}`},
    { accessorKey: "teacher", header: "Docente" },
    { accessorKey: "discipline", header: "Disciplina" },
    { accessorKey: "status", header: "Status Edição", cell: ({ row }) => (
        <Badge className={cn("cursor-pointer", statusColors[row.original.status])} onClick={() => handleStatusChange(row.original.id, row.original.status)}>{row.original.status}</Badge>
    )},
    { id: "actions", cell: ({ row }) => (
        <div className="flex items-center gap-1">
            <Dialog open={editingBookingId === row.original.id} onOpenChange={(isOpen) => !isOpen && setEditingBookingId(null)}>
                <Tooltip><TooltipTrigger asChild><DialogTrigger asChild><Button variant="ghost" size="icon" onClick={() => setEditingBookingId(row.original.id)}><FileText className="h-4 w-4" /></Button></DialogTrigger></TooltipTrigger><TooltipContent><p>Ver/Editar Detalhes</p></TooltipContent></Tooltip>
                {editingBookingId === row.original.id && <EditDetailsDialog booking={row.original} onSave={handleSaveDetails} />}
            </Dialog>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" asChild><Link to={`/upload/${row.original.id}`}><Upload className="h-4 w-4" /></Link></Button></TooltipTrigger><TooltipContent><p>Upload de Arquivos</p></TooltipContent></Tooltip>
            <AlertDialog>
                <Tooltip><TooltipTrigger asChild><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600"><XCircle className="h-4 w-4" /></Button></AlertDialogTrigger></TooltipTrigger><TooltipContent><p>Cancelar Agendamento</p></TooltipContent></Tooltip>
                <CancelBookingDialog onConfirm={(reason) => handleCancelBooking(row.original.id, reason)} />
            </AlertDialog>
        </div>
    )}
  ];

  const inProgressColumns: ColumnDef<Booking>[] = [
      ...dailyColumns.filter(c => c.id !== 'actions' && c.accessorKey !== 'status'),
      {
          id: 'actions',
          cell: ({ row }) => (
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => handleRevertBooking(row.original.id)}>
                          <Undo2 className="h-4 w-4 text-orange-500" />
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Reverter para 'em andamento'</p></TooltipContent>
              </Tooltip>
          )
      }
  ];

  const completedColumns: ColumnDef<Booking>[] = [
      { accessorKey: "completionDate", header: "Data de Conclusão", cell: ({ row }) => row.original.completionDate ? format(new Date(row.original.completionDate.replace(/-/g, '/')), "dd/MM/yyyy") : "N/A" },
      { accessorKey: "course", header: "Curso" },
      { accessorKey: "discipline", header: "Disciplina" },
      { id: "actions", cell: ({ row }) => (
          <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleRevertDiscipline(row.original.discipline)}>Reverter Conclusão</Button>
          </div>
      )}
  ];

  const dailyScheduleTable = useReactTable({ data: dailyScheduleData, columns: dailyColumns, state: { sorting, globalFilter }, onSortingChange: setSorting, onGlobalFilterChange: setGlobalFilter, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() });
  const inProgressTable = useReactTable({ data: inProgressData, columns: inProgressColumns, state: { sorting: inProgressSorting, globalFilter }, onSortingChange: setInProgressSorting, onGlobalFilterChange: setGlobalFilter, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() });
  const completedTable = useReactTable({ data: completedData, columns: completedColumns, state: { sorting: completedSorting, globalFilter }, onSortingChange: setCompletedSorting, onGlobalFilterChange: setGlobalFilter, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel(), getFilteredRowModel: getFilteredRowModel() });

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
              <div className="rounded-lg border bg-card mt-4">
                  <Table>
                      <TableHeader>{dailyScheduleTable.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
                      <TableBody>{dailyScheduleTable.getRowModel().rows.length > 0 ? dailyScheduleTable.getRowModel().rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={dailyColumns.length} className="h-24 text-center">Nenhum agendamento para hoje.</TableCell></TableRow>}</TableBody>
                  </Table>
              </div>
          </TabsContent>

          <TabsContent value="in-progress">
            <div className="rounded-lg border bg-card mt-4">
                <Table>
                    <TableHeader>{inProgressTable.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
                    <TableBody>{inProgressTable.getRowModel().rows.length > 0 ? inProgressTable.getRowModel().rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={inProgressColumns.length} className="h-24 text-center">Nenhuma disciplina em andamento.</TableCell></TableRow>}</TableBody>
                </Table>
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="rounded-lg border bg-card mt-4">
                <Table>
                    <TableHeader>{completedTable.getHeaderGroups().map(hg => <TableRow key={hg.id}>{hg.headers.map(h => <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>)}</TableRow>)}</TableHeader>
                    <TableBody>{completedTable.getRowModel().rows.length > 0 ? completedTable.getRowModel().rows.map(row => <TableRow key={row.id}>{row.getVisibleCells().map(cell => <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>)}</TableRow>) : <TableRow><TableCell colSpan={completedColumns.length} className="h-24 text-center">Nenhuma disciplina concluída.</TableCell></TableRow>}</TableBody>
                </Table>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </TooltipProvider>
  );
};

export default Editor;
