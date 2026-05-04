import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function useAddParam(onAdd: (kind: string) => void) {
  const [params, setParams] = useSearchParams();
  const add = params.get("add");
  useEffect(() => {
    if (!add) return;
    onAdd(add);
    const next = new URLSearchParams(params);
    next.delete("add");
    setParams(next, { replace: true });
  }, [add]); // eslint-disable-line react-hooks/exhaustive-deps
}
