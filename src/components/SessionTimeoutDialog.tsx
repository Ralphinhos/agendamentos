import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useEffect, useState } from "react";

interface SessionTimeoutDialogProps {
  isOpen: boolean;
  onContinue: () => void;
  onLogout: () => void;
  countdownSeconds?: number;
}

export const SessionTimeoutDialog = ({ isOpen, onContinue, onLogout, countdownSeconds = 60 }: SessionTimeoutDialogProps) => {
  const [countdown, setCountdown] = useState(countdownSeconds);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(countdownSeconds);
      return;
    }

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onLogout, countdownSeconds]);

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você ainda está aí?</AlertDialogTitle>
          <AlertDialogDescription>
            Sua sessão será encerrada por inatividade em {countdown} segundos.
            Clique em "Continuar" para não ser deslogado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onContinue}>Continuar Sessão</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
