import { Helmet } from "react-helmet-async";
import { useBookings } from "@/context/BookingsContext";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const Editor = () => {
  const { bookings, updateBooking } = useBookings();
  const [files, setFiles] = useState<Record<string, { name: string; url: string }[]>>({});

  const onFileChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const f = Array.from(e.target.files || []).map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    setFiles((prev) => ({ ...prev, [id]: f }));
  };

  const save = (id: string) => {
    const f = files[id] || [];
    updateBooking(id, { editedFiles: f, status: f.length ? "concluída" : "em-andamento" });
    toast({ title: "Atualizado", description: f.length ? "Arquivos anexados (demo)." : "Status atualizado." });
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>Edição | EAD</title>
        <meta name="description" content="Painel dos editores para indicar status de edição e anexar arquivos." />
      </Helmet>

      <h1 className="text-3xl font-bold mb-6">Edição de vídeos</h1>
      <p className="text-muted-foreground mb-6">Este ambiente é demonstrativo. Para upload real e publicação no YouTube, conecte o Supabase e configure uma função Edge com a API do YouTube.</p>

      <div className="space-y-6">
        {bookings.map((b) => (
          <div key={b.id} className="rounded-lg border p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-sm text-muted-foreground">{b.weekday} ({b.date}) · {b.period} {b.start}-{b.end}</div>
                <div className="font-medium">{b.teacher} · {b.course} / {b.discipline}</div>
                <div className="text-sm text-muted-foreground">Aulas gravadas: {b.lessonsRecorded ?? "—"} · Status: {b.status}</div>
              </div>
              <div className="flex items-center gap-3">
                <input type="file" multiple onChange={(e) => onFileChange(b.id, e)} />
                <Button variant="hero" onClick={() => save(b.id)}>Salvar</Button>
              </div>
            </div>
            {b.editedFiles?.length ? (
              <ul className="mt-3 list-disc pl-6 text-sm text-muted-foreground">
                {b.editedFiles.map((f, i) => (
                  <li key={i}>{f.name}</li>
                ))}
              </ul>
            ) : null}

            <div className="mt-3 text-sm">
              <Button variant="secondary" disabled title="Configure Supabase para publicar no YouTube">Publicar no YouTube (requer integração)</Button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
};

export default Editor;
