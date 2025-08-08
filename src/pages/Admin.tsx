import { Helmet } from "react-helmet-async";
import { useBookings } from "@/context/BookingsContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const statuses = [
  { value: "pendente", label: "Pendente" },
  { value: "em-andamento", label: "Em andamento" },
  { value: "concluída", label: "Concluída" },
] as const;

const Admin = () => {
  const { bookings, updateBooking } = useBookings();
  const [local, setLocal] = useState(() => bookings.map((b) => ({ id: b.id, lessonsRecorded: b.lessonsRecorded ?? b.lessonsBooked, status: b.status })));

  const syncField = (id: string, field: "lessonsRecorded" | "status", value: number | string) => {
    setLocal((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const save = (id: string) => {
    const row = local.find((r) => r.id === id);
    if (!row) return;
    updateBooking(id, { lessonsRecorded: Number(row.lessonsRecorded), status: row.status as any });
    toast({ title: "Atualizado", description: "Dados salvos com sucesso." });
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>Administração | EAD</title>
        <meta name="description" content="Controle completo das reservas, gravações e edições." />
      </Helmet>

      <h1 className="text-3xl font-bold mb-6">Administração</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b">
              <th className="py-3 pr-4">Data</th>
              <th className="py-3 pr-4">Período</th>
              <th className="py-3 pr-4">Docente</th>
              <th className="py-3 pr-4">Curso / Disciplina</th>
              <th className="py-3 pr-4">Aulas (marcadas)</th>
              <th className="py-3 pr-4">Aulas (gravadas)</th>
              <th className="py-3 pr-4">Status edição</th>
              <th className="py-3 pr-4">TPs</th>
              <th className="py-3 pr-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const row = local.find((r) => r.id === b.id)!;
              return (
                <tr key={b.id} className="border-b">
                  <td className="py-3 pr-4 whitespace-nowrap">{b.weekday} ({b.date})</td>
                  <td className="py-3 pr-4">{b.period} {b.start}-{b.end}</td>
                  <td className="py-3 pr-4">{b.teacher}</td>
                  <td className="py-3 pr-4">{b.course} / {b.discipline}</td>
                  <td className="py-3 pr-4">{b.lessonsBooked}</td>
                  <td className="py-3 pr-4">
                    <Label htmlFor={`lr-${b.id}`} className="sr-only">Aulas gravadas</Label>
                    <Input
                      id={`lr-${b.id}`}
                      type="number"
                      min={0}
                      max={8}
                      value={row?.lessonsRecorded ?? 0}
                      onChange={(e) => syncField(b.id, "lessonsRecorded", Number(e.target.value))}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2"
                      value={row?.status}
                      onChange={(e) => syncField(b.id, "status", e.target.value)}
                    >
                      {statuses.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-3 pr-4 max-w-[280px] truncate" title={b.tpLinks}>{b.tpLinks || "—"}</td>
                  <td className="py-3 pr-4">
                    <Button variant="hero" onClick={() => save(b.id)}>Salvar</Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default Admin;
