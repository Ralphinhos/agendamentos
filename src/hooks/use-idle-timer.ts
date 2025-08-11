import { useState, useEffect, useCallback, useRef } from 'react';

interface UseIdleTimerProps {
  onIdle: () => void;
  onActive?: () => void;
  onWarning?: () => void;
  warningTimeout: number; // in ms
  idleTimeout: number; // in ms
}

export const useIdleTimer = ({ onIdle, onActive, onWarning, warningTimeout, idleTimeout }: UseIdleTimerProps) => {
  const [isWarning, setIsWarning] = useState(false);
  const warningTimer = useRef<NodeJS.Timeout>();
  const idleTimer = useRef<NodeJS.Timeout>();

  const startTimers = useCallback(() => {
    warningTimer.current = setTimeout(() => {
      setIsWarning(true);
      onWarning?.();
    }, warningTimeout);

    idleTimer.current = setTimeout(() => {
      onIdle();
    }, idleTimeout);
  }, [warningTimeout, idleTimeout, onWarning, onIdle]);

  const clearTimers = useCallback(() => {
    clearTimeout(warningTimer.current);
    clearTimeout(idleTimer.current);
  }, []);

  const resetTimer = useCallback(() => {
    clearTimers();
    if (isWarning) {
      setIsWarning(false);
      onActive?.();
    }
    startTimers();
  }, [clearTimers, startTimers, isWarning, onActive]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

    events.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    startTimers();

    return () => {
      clearTimers();
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer, startTimers, clearTimers]);

  return {
    isWarning,
    reset: resetTimer,
  };
};
