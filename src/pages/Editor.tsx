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
} from "@tanstack/react-table"

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
  const { bookings, updateBooking } = useBookings();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const handleDriveUpload = () => {
    if (!fileToUpload || !editingBooking) return;
    const { discipline } = editingBooking;
    console.log("--- SIMULAÇÃO DE UPLOAD GOOGLE DRIVE ---");
    console.log(`Arquivo: ${fileToUpload.name}`);
    console.log(`Pasta de destino: 2025.2/${discipline}`);
    console.log("-----------------------------------------");
    toast({ title: "Simulação de Upload", description: `Arquivo ${fileToUpload.name} enviado para a pasta ${discipline} no Drive.` });
    setFileToUpload(null);
  };

  const handleStatusChange = (id: string, currentStatus: EditingStatus) => {
    updateBooking(id, { status: nextStatus[currentStatus] });
  };

  const handleSaveDetails = () => {
    if (!editingBooking) return;
    updateBooking(editingBooking.id, {
      lessonsRecorded: editingBooking.lessonsRecorded,
      editorNotes: editingBooking.editorNotes,
    });
    setEditingBooking(null); // Fecha o dialog
  };

  const columns: ColumnDef<Booking>[] = [
    { accessorKey: "date", header: "Data", cell: ({ row }) => format(new Date(row.original.date.replace(/-/g, '/')), "dd/MM/yyyy") },
    { accessorKey: "teacher", header: "Docente" },
    { accessorKey: "discipline", header: "Disciplina" },
    { accessorKey: "recordedUnits", header: "Aulas Agendadas" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          className={cn("cursor-pointer text-white hover:brightness-125 transition-all", statusColors[row.original.status])}
          onClick={() => handleStatusChange(row.original.id, row.original.status)}
        >
          {row.original.status}
        </Badge>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Dialog
          open={editingBooking?.id === row.original.id}
          onOpenChange={(isOpen) => !isOpen && setEditingBooking(null)}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => setEditingBooking(row.original)}>
              Ver Detalhes
            </Button>
          </DialogTrigger>
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
                  value={editingBooking?.lessonsRecorded ?? ""}
                  onChange={(e) => setEditingBooking(prev => prev && { ...prev, lessonsRecorded: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Observações do Editor</Label>
                <Textarea
                  placeholder="Algum problema na gravação? Áudio, vídeo, etc."
                  value={editingBooking?.editorNotes ?? ""}
                  onChange={(e) => setEditingBooking(prev => prev && { ...prev, editorNotes: e.target.value })}
                />
              </div>
              <div>
                <Label>Enviar para o Drive</Label>
                <div className="p-4 space-y-3 border-2 border-dashed rounded-md">
                  <Input type="file" onChange={(e) => setFileToUpload(e.target.files ? e.target.files[0] : null)} />
                  <Button className="w-full" disabled={!fileToUpload} onClick={handleDriveUpload}>Subir para o Drive (Sim)</Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
              <Button onClick={handleSaveDetails}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )
    }
  ];

  const table = useReactTable({
    data: bookings,
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

export default Editor;
