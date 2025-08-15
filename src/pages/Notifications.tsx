import { Helmet } from "react-helmet-async";
import { useBookings } from "@/context/BookingsContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMemo, useEffect } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, XCircle, Circle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUpdateBooking } from "@/hooks/api/useUpdateBooking";
import { cn } from "@/lib/utils";
import { Booking } from "@/context/BookingsContext";

type NotificationType = 'cancellation-teacher' | 'cancellation-editor' | 'upload';

interface Notification extends Booking {
  notificationType: NotificationType;
  isNew: boolean;
}

const NotificationsPage = () => {
  const { bookings } = useBookings();
  const { user } = useAuth();
  const updateBookingMutation = useUpdateBooking();

  const allNotifications = useMemo<Notification[]>(() => {
    if (!bookings) return [];

    const notifications: Notification[] = [];

    bookings.forEach(b => {
      // Teacher cancellation notifications
      if (b.teacherConfirmation === "NEGADO") {
        notifications.push({
          ...b,
          notificationType: 'cancellation-teacher',
          isNew: user?.role === 'admin' ? !b.cancellationRead : !b.cancellationReadByEditor,
        });
      }
      // Cancellation Notifications
      if (b.status === 'cancelado') {
        // Notify admin about a cancellation by the editor
        if (user?.role === 'admin' && b.cancellationReason !== 'Cancelado pelo Administrador') {
          notifications.push({
            ...b,
            notificationType: 'cancellation-editor',
            isNew: !b.editorCancellationRead,
          });
        }
        // Notify editor about a cancellation by the admin
        else if (user?.role === 'editor' && b.cancellationReason === 'Cancelado pelo Administrador') {
          notifications.push({
            ...b,
            notificationType: 'cancellation-editor',
            isNew: !b.cancellationReadByEditor,
          });
        }
      }
      // Upload notifications
      if (b.uploadCompleted) {
        notifications.push({
          ...b,
          notificationType: 'upload',
          isNew: !b.uploadNotificationRead,
        });
      }
    });

    // Remove duplicates and sort by date
    const uniqueNotifications = Array.from(new Map(notifications.map(n => [n.id + n.notificationType, n])).values());
    return uniqueNotifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  }, [bookings, user?.role]);

  // Mark notifications as read when the component mounts
  useEffect(() => {
    allNotifications.forEach(n => {
      if (n.isNew) {
        let patch = {};
        if (n.notificationType === 'upload') {
          patch = { uploadNotificationRead: true };
        } else if (n.notificationType === 'cancellation-teacher') {
          patch = user?.role === 'admin' ? { cancellationRead: true } : { cancellationReadByEditor: true };
        } else if (n.notificationType === 'cancellation-editor') {
          if (user?.role === 'editor') {
            patch = { cancellationReadByEditor: true };
          } else if (user?.role === 'admin') {
            patch = { editorCancellationRead: true };
          }
        }

        if(Object.keys(patch).length > 0) {
          updateBookingMutation.mutate({ id: n.id, patch });
        }
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allNotifications, user?.role]); // We only want this to run once on mount when notifications are loaded.

  const uploads = allNotifications.filter(n => n.notificationType === 'upload');
  const cancellations = allNotifications.filter(n => n.notificationType.startsWith('cancellation'));

  const renderCancellationReason = (b: Notification) => {
    if (b.notificationType === 'cancellation-teacher') return `Docente ${b.teacher} negou. Motivo: "${b.cancellationReason || 'N/A'}"`;
    if (b.notificationType === 'cancellation-editor') return `Editor cancelou. Motivo: "${b.cancellationReason || 'N/A'}"`;
    return `Cancelado pelo admin. Motivo: "${b.cancellationReason || 'N/A'}"`
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <Helmet>
        <title>Histórico de Notificações | EAD</title>
      </Helmet>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Histórico de Notificações</h1>
        <p className="text-muted-foreground mt-2">
          Visualize cancelamentos e uploads concluídos. Notificações novas são marcadas com um ponto azul.
        </p>
      </div>

      <Tabs defaultValue="uploads" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="uploads">
            <Upload className="h-4 w-4 mr-2" />
            Uploads Concluídos
          </TabsTrigger>
          <TabsTrigger value="cancellations">
            <XCircle className="h-4 w-4 mr-2" />
            Cancelamentos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="uploads">
          <div className="rounded-lg border bg-card mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Data da Gravação</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.length > 0 ? (
                  uploads.map((b) => (
                    <TableRow key={b.id} className={cn(!b.isNew && "text-muted-foreground")}>
                      <TableCell>{b.isNew && <Circle className="h-2 w-2 text-blue-500 fill-current" />}</TableCell>
                      <TableCell>{format(new Date(b.date.replace(/-/g, '/')), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{b.discipline}</TableCell>
                      <TableCell><Badge variant="secondary">Upload Entregue</Badge></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      Nenhum upload concluído.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="cancellations">
           <div className="rounded-lg border bg-card mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Data do Agendamento</TableHead>
                  <TableHead>Disciplina</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cancellations.length > 0 ? (
                  cancellations.map((b) => (
                    <TableRow key={b.id + b.notificationType} className={cn(!b.isNew && "text-muted-foreground")}>
                      <TableCell>{b.isNew && <Circle className="h-2 w-2 text-blue-500 fill-current" />}</TableCell>
                      <TableCell>{format(new Date(b.date.replace(/-/g, '/')), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{b.discipline}</TableCell>
                      <TableCell className="italic">
                        {renderCancellationReason(b)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      Nenhuma notificação de cancelamento encontrada.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default NotificationsPage;
