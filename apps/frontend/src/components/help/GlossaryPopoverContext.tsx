import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface GlossaryPopoverContextValue {
  openId: string | null;
  openPopover: (id: string) => void;
  closePopover: () => void;
}

const GlossaryPopoverContext = createContext<GlossaryPopoverContextValue>({
  openId: null,
  openPopover: () => {},
  closePopover: () => {},
});

export function GlossaryPopoverProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const openPopover = useCallback((id: string) => setOpenId(id), []);
  const closePopover = useCallback(() => setOpenId(null), []);

  return (
    <GlossaryPopoverContext.Provider value={{ openId, openPopover, closePopover }}>
      {children}
    </GlossaryPopoverContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGlossaryPopover() {
  return useContext(GlossaryPopoverContext);
}
