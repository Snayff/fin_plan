import { useCallback, useEffect, useRef } from "react";

type Saver<T extends Record<string, unknown>> = (data: T) => Promise<unknown>;

export function useDebouncedSave<T extends Record<string, unknown>>(save: Saver<T>, delayMs = 300) {
  const pendingRef = useRef<T>({} as T);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const data = pendingRef.current;
    if (Object.keys(data).length === 0) return;
    pendingRef.current = {} as T;
    await save(data);
  }, [save]);

  const queue = useCallback(
    (patch: Partial<T>) => {
      pendingRef.current = { ...pendingRef.current, ...patch } as T;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void flush();
      }, delayMs);
    },
    [flush, delayMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { queue, flush };
}
