// apps/frontend/src/hooks/useAutoSave.ts
import { useCallback, useEffect, useRef, useState } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseAutoSaveOptions<T> {
  initialValue: T;
  onSave: (value: T) => Promise<unknown>;
  debounceMs?: number;
  errorMessage?: string;
}

export interface UseAutoSaveResult<T> {
  value: T;
  setValue: (next: T) => void;
  status: AutoSaveStatus;
  errorMessage: string | null;
}

const DEFAULT_ERROR = "Couldn't save — try again";

export function useAutoSave<T>({
  initialValue,
  onSave,
  debounceMs = 600,
  errorMessage = DEFAULT_ERROR,
}: UseAutoSaveOptions<T>): UseAutoSaveResult<T> {
  const [value, setLocal] = useState<T>(initialValue);
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const lastSavedRef = useRef<T>(initialValue);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from external changes (e.g. server refresh)
  useEffect(() => {
    lastSavedRef.current = initialValue;
    setLocal(initialValue);
  }, [initialValue]);

  const commit = useCallback(
    async (next: T) => {
      setStatus("saving");
      try {
        await onSave(next);
        lastSavedRef.current = next;
        setStatus("saved");
      } catch {
        setLocal(lastSavedRef.current);
        setStatus("error");
      }
    },
    [onSave]
  );

  const setValue = useCallback(
    (next: T) => {
      setLocal(next);
      setStatus("idle");
      if (timerRef.current) clearTimeout(timerRef.current);
      if (Object.is(next, lastSavedRef.current)) return;

      timerRef.current = setTimeout(() => void commit(next), debounceMs);
    },
    [commit, debounceMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    value,
    setValue,
    status,
    errorMessage: status === "error" ? errorMessage : null,
  };
}
