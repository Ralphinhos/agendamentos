import { Link, useLocation } from "react-router-dom";
import { CalendarCheck, ListChecks, Clapperboard, LogOut, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { useBookings } from "@/context/BookingsContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMemo } from "react";

const Header = () => {
  const location = useLocation();
  const { role, logout } = useAuth();
  const { bookings, updateBooking } = useBookings();
  const isActive = (path: string) => location.pathname === path;

  const adminNotifications = useMemo(() => {
    return bookings.filter(b =>
      (b.teacherConfirmation === "NEGADO" && !b.cancellationRead) ||
      (b.uploadCompleted && !b.uploadNotificationRead) ||
      (b.editorCancelled && !b.editorCancellationRead)
    );
  }, [bookings]);

  const editorNotifications = useMemo(() => {
    return bookings.filter(b =>
      ((b.teacherConfirmation === "NEGADO" || b.status === "cancelado") && !b.cancellationReadByEditor) ||
      (b.uploadCompleted && !b.uploadNotificationRead)
    );
  }, [bookings]);

  // Don't render header on login or confirmation pages
  if (!role) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
            <CalendarCheck className="h-5 w-5 text-primary" />
          </div>
          <span className="font-semibold">EAD Gravações</span>
        </Link>
        <div className="flex items-center gap-2">
          {role === 'admin' && (
            <>
              <Link
                to="/"
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/60 transition-colors",
                  isActive("/") && "bg-accent"
                )}
                aria-label="Agendar"
                title="Agendar"
              >
                <CalendarCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Agendar</span>
              </Link>
              <Link
                to="/agendamentos"
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/60 transition-colors",
                  isActive("/agendamentos") && "bg-accent"
                )}
                aria-label="Agendamentos"
                title="Agendamentos"
              >
                <ListChecks className="h-4 w-4" />
                <span className="hidden sm:inline">Agendamentos</span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {adminNotifications.length > 0 && (
                      <span className="absolute top-1 right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notificações (Admin)</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {adminNotifications.length > 0 ? (
                    adminNotifications.map(b => {
                      const isUpload = b.uploadCompleted && !b.uploadNotificationRead;
                      const isTeacherCancellation = b.teacherConfirmation === "NEGADO" && !b.cancellationRead;
                      const isEditorCancellation = b.editorCancelled && !b.editorCancellationRead;

                      const handleSelect = () => {
                        if (isUpload) updateBooking(b.id, { uploadNotificationRead: true });
                        if (isTeacherCancellation) updateBooking(b.id, { cancellationRead: true });
                        if (isEditorCancellation) updateBooking(b.id, { editorCancellationRead: true });
                      }

                      return (
                        <DropdownMenuItem key={b.id} onSelect={handleSelect}>
                          <div className="flex flex-col">
                            {isTeacherCancellation && <>
                              <span className="font-semibold">{b.teacher} cancelou</span>
                              <span className="text-xs text-muted-foreground">{b.discipline}</span>
                              {b.cancellationReason && <span className="text-xs text-muted-foreground italic">"{b.cancellationReason}"</span>}
                            </>}
                             {isUpload && <>
                              <span className="font-semibold">Upload Concluído</span>
                              <span className="text-xs text-muted-foreground">Editor enviou arquivos para: {b.discipline}</span>
                            </>}
                             {isEditorCancellation && <>
                              <span className="font-semibold">Editor cancelou</span>
                              <span className="text-xs text-muted-foreground">{b.discipline}</span>
                              {b.cancellationReason && <span className="text-xs text-muted-foreground italic">"{b.cancellationReason}"</span>}
                            </>}
                          </div>
                        </DropdownMenuItem>
                      )
                    })
                  ) : (
                    <DropdownMenuItem disabled>Nenhuma notificação nova</DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/notificacoes" className="w-full justify-center">
                      Ver todas as notificações
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          {role === 'editor' && (
            <>
              <Link
                to="/editor"
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent/60 transition-colors",
                  isActive("/editor") && "bg-accent"
                )}
                aria-label="Edição"
                title="Edição"
              >
                <Clapperboard className="h-4 w-4" />
                <span className="hidden sm:inline">Edição</span>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {editorNotifications.length > 0 && (
                      <span className="absolute top-1 right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notificações (Editor)</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {editorNotifications.length > 0 ? (
                    editorNotifications.map(b => {
                      const isUpload = b.uploadCompleted && !b.uploadNotificationRead;
                      const isCancellation = (b.teacherConfirmation === "NEGADO" || b.status === "cancelado") && !b.cancellationReadByEditor;

                      const handleSelect = () => {
                        if (isUpload) updateBooking(b.id, { uploadNotificationRead: true });
                        if (isCancellation) updateBooking(b.id, { cancellationReadByEditor: true });
                      };

                      return (
                        <DropdownMenuItem key={b.id} onSelect={handleSelect}>
                          <div className="flex flex-col">
                            {isCancellation && (
                              b.editorCancelled ? (
                                <>
                                  <span className="font-semibold">Você cancelou: {b.discipline}</span>
                                  {b.cancellationReason && <span className="text-xs text-muted-foreground italic">"{b.cancellationReason}"</span>}
                                </>
                              ) : (
                                <>
                                  <span className="font-semibold">Cancelamento: {b.discipline}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {b.teacherConfirmation === 'NEGADO' ? `Docente ${b.teacher} negou.` : `Cancelado pelo admin.`}
                                  </span>
                                  {b.cancellationReason && <span className="text-xs text-muted-foreground italic">"{b.cancellationReason}"</span>}
                                </>
                              )
                            )}
                            {isUpload && <>
                              <span className="font-semibold">Upload Concluído</span>
                              <span className="text-xs text-muted-foreground">Você enviou arquivos para: {b.discipline}</span>
                            </>}
                          </div>
                        </DropdownMenuItem>
                      );
                    })
                  ) : (
                    <DropdownMenuItem disabled>Nenhuma notificação nova</DropdownMenuItem>
                  )}
                   <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/notificacoes" className="w-full justify-center">
                      Ver todas as notificações
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={logout} title="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
