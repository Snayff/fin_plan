import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

export function useFocusParam(onFocus: (id: string) => void) {
  const [params, setParams] = useSearchParams();
  const focus = params.get("focus");
  useEffect(() => {
    if (!focus) return;
    onFocus(focus);
    const next = new URLSearchParams(params);
    next.delete("focus");
    setParams(next, { replace: true });
  }, [focus]); // eslint-disable-line react-hooks/exhaustive-deps
}
