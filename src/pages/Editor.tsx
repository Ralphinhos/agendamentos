import { Helmet } from "react-helmet-async";
import { useBookings, EditingStatus } from "@/context/BookingsContext";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo } from "react";
import { Booking } from "@/context/BookingsContext";
import { toast } from "@/hooks/use-toast";
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
} from "@tanstack/react-table";
import { Progress } from "@/components/ui/progress";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChevronDown, Upload, FileText, XCircle, CheckCircle2, Undo2, Check } from "lucide-react";
import { BookingWithProgress } from "./Admin"; // Reutilizando o tipo
import { Link } from "react-router-dom";

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

// Componente do Dialog para evitar re-render da tabela principal
const CancelBookingDialog = ({ onConfirm }: { onConfirm: (reason: string) => void }) => {
  const [reason, setReason] = useState("");
  const handleConfirm = () => {
    if (!reason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo do cancelamento.",
        variant: "destructive",
      });
      return;
    }
    onConfirm(reason);
  }

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Cancelar Agendamento</AlertDialogTitle>
        <AlertDialogDescription>
          Por favor, informe o motivo do cancelamento. Esta ação não pode ser desfeita.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div className="py-4">
        <Textarea
          placeholder="Descreva o motivo do cancelamento aqui..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel>Voltar</AlertDialogCancel>
        <AlertDialogAction onClick={handleConfirm} disabled={!reason.trim()}>Confirmar Cancelamento</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  )
}

const EditDetailsDialog = ({ booking, onSave }: { booking: Booking, onSave: (data: Partial<Booking>) => void }) => {
  const [formData, setFormData] = useState({
    lessonsRecorded: booking.lessonsRecorded ?? 0,
    editorNotes: booking.editorNotes ?? "",
  });

  const handleSave = () => {
    onSave(formData);
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Detalhes da Gravação</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <Label>Aulas Gravadas</Label>
          <Input
            type="number"
            placeholder="Nº de aulas"
            value={formData.lessonsRecorded}
            onChange={(e) => setFormData(prev => ({ ...prev, lessonsRecorded: Number(e.target.value) }))}
          />
        </div>
        <div>
          <Label>Observações do Editor</Label>
          <Textarea
            placeholder="Algum problema na gravação? Áudio, vídeo, etc."
            value={formData.editorNotes}
            onChange={(e) => setFormData(prev => ({ ...prev, editorNotes: e.target.value }))}
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
        <Button onClick={handleSave}>Salvar Alterações</Button>
      </DialogFooter>
    </DialogContent>
  )
}


const Editor = () => {
  const { bookings, updateBooking, revertCompletion, markAllRecordingsDone, reopenRecordings, completeDiscipline } = useBookings();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});

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
      const progress = progressMap[b.discipline];
      const percentage = progress ? (progress.actualRecorded / progress.totalUnits) * 100 : 0;
      return { ...b, disciplineProgress: Math.min(percentage, 100) };
    });
  }, [bookings]);

  const handleStatusChange = (id: string, currentStatus: EditingStatus) => {
    updateBooking(id, { status: nextStatus[currentStatus] });
  };

  const handleSaveDetails = (data: Partial<Booking>) => {
    if (!editingBookingId) return;
    updateBooking(editingBookingId, data);
    setEditingBookingId(null); // Fecha o dialog
  };

  const handleCancelBooking = (bookingId: string, reason: string) => {
    updateBooking(bookingId, {
      status: 'cancelado',
      cancellationReason: reason,
      editorCancelled: true,
      editorCancellationRead: false,
    });
    toast({
      title: "Agendamento Cancelado",
      description: "O agendamento foi cancelado com sucesso.",
    })
  };

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
        const isFirstInDiscipline = ongoingData.findIndex(b => b.discipline === row.original.discipline) === row.index;

        return (
          <div className="flex items-center gap-2">
            <Progress value={row.original.disciplineProgress} className="w-[80%]" />
            <span className="text-xs text-muted-foreground">{row.original.disciplineProgress.toFixed(0)}%</span>
            {row.original.allRecordingsDone && isFirstInDiscipline && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => reopenRecordings(row.original.discipline)}>
                      <Undo2 className="h-4 w-4 text-blue-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reabrir Gravações</p>
                  </TooltipContent>
                </Tooltip>
                 <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => completeDiscipline(row.original.discipline)}>
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
                  <Button variant="ghost" size="icon" onClick={() => markAllRecordingsDone(row.original.discipline)}>
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
            <EditDetailsDialog booking={row.original} onSave={handleSaveDetails} />
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
    { accessorKey: "date", header: "Data", cell: ({ row }) => format(new Date(row.original.date.replace(/-/g, '/')), "dd/MM/yyyy") },
    { accessorKey: "course", header: "Curso" },
    { accessorKey: "discipline", header: "Disciplina" },
    {
      accessorKey: "completionDate",
      header: "Data de Conclusão",
      cell: ({ row }) => row.original.completionDate
        ? format(new Date(row.original.completionDate.replace(/-/g, '/')), "dd/MM/yyyy")
        : "N/A"
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
            onClick={() => revertCompletion(row.original.discipline)}
          >
            Reverter
          </Button>
        </div>
      )
    }
  ];


  const ongoingData = useMemo(() => data.filter(b => !b.completionDate), [data]);
  const completedData = useMemo(() => {
    // Para a tabela de concluídos, queremos mostrar apenas uma linha por disciplina
    const uniqueDisciplines: Record<string, BookingWithProgress> = {};
    data.forEach(b => {
      if (b.completionDate) {
        // Guarda a primeira ocorrência da disciplina concluída
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
    state: {
      sorting,
      globalFilter,
      expanded,
    },
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
    state: {
      sorting,
      globalFilter,
    },
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
                <TableRow
                  key={row.id}
                  className={cn({
                    "bg-green-100/50 hover:bg-green-100/60": row.original.dailyDeliveryStatus === 'delivered',
                  })}
                >
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
  </TooltipProvider>
  );
};

export default Editor;
