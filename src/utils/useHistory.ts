import { useState, useCallback, useEffect, useRef } from 'react';

export function useHistory<T>(initialPresent: T, maxHistory = 50) {
  const [past, setPast] = useState<T[]>([]);
  const [present, setPresent] = useState<T>(initialPresent);
  const [future, setFuture] = useState<T[]>([]);

  const lastCommittedRef = useRef<T>(initialPresent);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const undo = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setPast((currentPast) => {
      if (currentPast.length === 0) return currentPast;
      const previous = currentPast[currentPast.length - 1];
      const newPast = currentPast.slice(0, currentPast.length - 1);

      setPresent((currentPresent) => {
        setFuture((currentFuture) => [currentPresent, ...currentFuture]);
        lastCommittedRef.current = previous;
        return previous;
      });

      return newPast;
    });
  }, []);

  const redo = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setFuture((currentFuture) => {
      if (currentFuture.length === 0) return currentFuture;
      const next = currentFuture[0];
      const newFuture = currentFuture.slice(1);

      setPresent((currentPresent) => {
        setPast((currentPast) => [...currentPast, currentPresent].slice(-maxHistory));
        lastCommittedRef.current = next;
        return next;
      });

      return newFuture;
    });
  }, [maxHistory]);

  const set = useCallback((newPresent: T, commitImmediately = false) => {
    setPresent(newPresent);

    if (commitImmediately) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setPast((currentPast) => [...currentPast, lastCommittedRef.current].slice(-maxHistory));
      setFuture([]);
      lastCommittedRef.current = newPresent;
      return;
    }

    // Debounce history point creation (350ms) so continuous slider scrubbing records 1 clean undo point
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setPast((currentPast) => [...currentPast, lastCommittedRef.current].slice(-maxHistory));
      setFuture([]);
      lastCommittedRef.current = newPresent;
      timerRef.current = null;
    }, 350);
  }, [maxHistory]);

  // Global Keyboard Shortcuts (Cmd+Z, Cmd+Shift+Z, Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      if (!isCmdOrCtrl) return;

      const activeTag = document.activeElement?.tagName.toLowerCase();
      // If user is actively typing in a text input, let them use native text undo unless they press Cmd+Shift+Z or outside text
      if (activeTag === 'input' && (document.activeElement as HTMLInputElement).type === 'text') {
        return;
      }

      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return {
    state: present,
    set,
    undo,
    redo,
    canUndo,
    canRedo,
    pastCount: past.length,
    futureCount: future.length,
  };
}
