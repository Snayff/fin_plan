import type { ReactNode } from "react";

interface TwoPanelLayoutProps {
  left: ReactNode;
  right: ReactNode | null;
  rightPlaceholder?: string;
}

function PlaceholderMessage({ text }: { text: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-muted-foreground italic text-sm">{text}</p>
    </div>
  );
}

export function TwoPanelLayout({
  left,
  right,
  rightPlaceholder = "Select any item to see its detail",
}: TwoPanelLayoutProps) {
  return (
    <div className="flex h-full overflow-hidden">
      <aside className="w-[360px] min-w-[360px] border-r overflow-y-auto shrink-0 p-4">
        {left}
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        {right ?? <PlaceholderMessage text={rightPlaceholder} />}
      </main>
    </div>
  );
}
