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
import { useState } from "react";
import { Booking } from "@/context/BookingsContext";
import { toast } from "@/hooks/use-toast";

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

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>Painel de Edição | EAD</title>
        <meta name="description" content="Acompanhe o status de edição das gravações." />
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Painel de Edição</h1>
        <p className="text-muted-foreground mt-2">
          Visualize os agendamentos, atualize o status e adicione observações.
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Docente</TableHead>
              <TableHead>Disciplina</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.length > 0 ? (
              bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    {format(new Date(b.date.replace(/-/g, '/')), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>{b.teacher}</TableCell>
                  <TableCell>{b.discipline}</TableCell>
                  <TableCell>
                    <Badge
                      className={cn("cursor-pointer text-white hover:brightness-125 transition-all", statusColors[b.status])}
                      onClick={() => handleStatusChange(b.id, b.status)}
                    >
                      {b.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog
                      open={editingBooking?.id === b.id}
                      onOpenChange={(isOpen) => !isOpen && setEditingBooking(null)}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setEditingBooking(b)}>
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
                              onChange={(e) =>
                                setEditingBooking(
                                  (prev) =>
                                    prev && { ...prev, lessonsRecorded: Number(e.target.value) }
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Observações do Editor</Label>
                            <Textarea
                              placeholder="Algum problema na gravação? Áudio, vídeo, etc."
                              value={editingBooking?.editorNotes ?? ""}
                              onChange={(e) =>
                                setEditingBooking(
                                  (prev) => prev && { ...prev, editorNotes: e.target.value }
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Enviar para o Drive</Label>
                            <div className="p-4 space-y-3 border-2 border-dashed rounded-md">
                              <Input
                                type="file"
                                onChange={(e) => setFileToUpload(e.target.files ? e.target.files[0] : null)}
                              />
                              <Button
                                className="w-full"
                                disabled={!fileToUpload}
                                onClick={handleDriveUpload}
                              >
                                Subir para o Drive (Sim)
                              </Button>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Cancelar</Button>
                          </DialogClose>
                          <Button onClick={handleSaveDetails}>Salvar Alterações</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Nenhum agendamento encontrado.
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
