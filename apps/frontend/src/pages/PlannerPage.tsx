import { useState } from "react";
import { TwoPanelLayout } from "@/components/layout/TwoPanelLayout";
import { PlannerLeftPanel } from "@/components/planner/PlannerLeftPanel";
import { PurchaseListPanel } from "@/components/planner/PurchaseListPanel";
import { GiftUpcomingPanel } from "@/components/planner/GiftUpcomingPanel";
import { GiftPersonListPanel } from "@/components/planner/GiftPersonListPanel";
import { GiftPersonDetailPanel } from "@/components/planner/GiftPersonDetailPanel";
import { usePurchases, useGiftPersons, useYearBudget, useUpcomingGifts } from "@/hooks/usePlanner";

type RightView =
  | { type: "purchases" }
  | { type: "gifts-upcoming" }
  | { type: "gifts-by-person" }
  | { type: "gift-person"; person: any }
  | { type: "none" };

export default function PlannerPage() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [view, setView] = useState<RightView>({ type: "purchases" });
  const isReadOnly = year < new Date().getFullYear();

  const { data: purchases = [] } = usePurchases(year);
  const { data: giftPersons = [] } = useGiftPersons(year);
  const { data: budget } = useYearBudget(year);
  const { data: upcoming = [] } = useUpcomingGifts(year);

  const activeView =
    view.type === "gift-person"
      ? "gifts-by-person"
      : view.type === "none"
        ? "purchases"
        : (view.type as "purchases" | "gifts-upcoming" | "gifts-by-person");

  const left = (
    <PlannerLeftPanel
      year={year}
      budget={budget}
      purchases={purchases}
      giftPersons={giftPersons}
      activeView={activeView}
      onSelectView={(v) => setView({ type: v })}
    />
  );

  let right: React.ReactNode | null = null;
  if (view.type === "purchases") {
    right = <PurchaseListPanel year={year} purchases={purchases} isReadOnly={isReadOnly} />;
  } else if (view.type === "gifts-upcoming") {
    right = <GiftUpcomingPanel year={year} gifts={upcoming} isReadOnly={isReadOnly} />;
  } else if (view.type === "gifts-by-person") {
    right = (
      <GiftPersonListPanel
        year={year}
        persons={giftPersons}
        isReadOnly={isReadOnly}
        onSelectPerson={(p) => setView({ type: "gift-person", person: p })}
        selectedPersonId={null}
      />
    );
  } else if (view.type === "gift-person") {
    right = (
      <GiftPersonDetailPanel
        personId={view.person.id}
        year={year}
        onBack={() => setView({ type: "gifts-by-person" })}
        isReadOnly={isReadOnly}
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Year selector */}
      <div className="h-10 shrink-0 border-b flex items-center px-4 gap-2 text-sm">
        <button
          onClick={() => setYear((y) => y - 1)}
          className="text-muted-foreground hover:text-foreground"
        >
          ‹
        </button>
        <span className="font-medium w-10 text-center">{year}</span>
        <button
          onClick={() => setYear((y) => y + 1)}
          className="text-muted-foreground hover:text-foreground"
        >
          ›
        </button>
        {isReadOnly && <span className="text-xs text-muted-foreground ml-2">(read-only)</span>}
      </div>
      <div className="flex-1 min-h-0">
        <TwoPanelLayout left={left} right={right} />
      </div>
    </div>
  );
}
