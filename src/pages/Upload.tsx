import { Helmet } from "react-helmet-async";
import { useParams, Link } from "react-router-dom";
import { useBookings } from "@/context/BookingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const UploadPage = () => {
  const { id } = useParams<{ id: string }>();
  const { bookings, updateBooking } = useBookings();
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const booking = bookings.find(b => b.id === id);

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl font-bold">Agendamento não encontrado</h1>
        <Link to="/editor">
          <Button variant="link">Voltar para o painel</Button>
        </Link>
      </div>
    );
  }

  const handleDriveUpload = () => {
    if (!fileToUpload) return;

    // Simula o upload e depois atualiza o booking para notificar o admin
    updateBooking(booking.id, {
      uploadCompleted: true,
      uploadNotificationRead: false,
      recordingStatus: 'delivered',
    });

    toast({ title: "Upload Concluído", description: `Arquivo ${fileToUpload.name} enviado. O Admin foi notificado.` });
    setFileToUpload(null);
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Helmet>
        <title>Upload de Arquivos | {booking.discipline}</title>
      </Helmet>

      <div className="mb-4">
        <Link to="/editor" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Voltar para o Painel de Edição
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload de Arquivos</CardTitle>
          <CardDescription>
            Envie os arquivos de vídeo para a disciplina: <strong>{booking.discipline}</strong> do curso <strong>{booking.course}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="p-6 space-y-4 border-2 border-dashed rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="text-lg font-semibold">Enviar para o Drive</Label>
              <p className="text-sm text-muted-foreground">Selecione o arquivo de vídeo finalizado para enviar.</p>
            </div>
            <Input id="file-upload" type="file" onChange={(e) => setFileToUpload(e.target.files ? e.target.files[0] : null)} />
            <Button className="w-full" disabled={!fileToUpload} onClick={handleDriveUpload}>
              Subir para o Drive (Sim)
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default UploadPage;
