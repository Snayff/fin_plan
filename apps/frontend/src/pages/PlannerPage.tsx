import { useState, useCallback } from "react";
import type React from "react";
import { useSearchParams } from "react-router-dom";
import { TwoPanelLayout } from "@/components/layout/TwoPanelLayout";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { PanelError } from "@/components/common/PanelError";
import { GhostedListEmpty } from "@/components/ui/GhostedListEmpty";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const year = Number(searchParams.get("year")) || new Date().getFullYear();
  const setYear = useCallback(
    (updater: (prev: number) => number) => {
      setSearchParams((prev) => {
        const current = Number(prev.get("year")) || new Date().getFullYear();
        const next = updater(current);
        return { year: String(next) };
      });
    },
    [setSearchParams]
  );
  const [view, setView] = useState<RightView>({ type: "purchases" });
  const isReadOnly = year < new Date().getFullYear();

  const {
    data: purchases,
    isLoading: purchasesLoading,
    isError: purchasesError,
    refetch: purchasesRefetch,
  } = usePurchases(year);
  const {
    data: giftPersons,
    isLoading: giftsLoading,
    isError: giftsError,
    refetch: giftsRefetch,
  } = useGiftPersons(year);
  const { data: budget } = useYearBudget(year);
  const {
    data: upcoming,
    isLoading: upcomingLoading,
    isError: upcomingError,
    refetch: upcomingRefetch,
  } = useUpcomingGifts(year);

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
      purchases={purchases ?? []}
      giftPersons={giftPersons ?? []}
      activeView={activeView}
      onSelectView={(v) => setView({ type: v })}
    />
  );

  let right: React.ReactNode | null = null;
  if (view.type === "purchases") {
    if (purchasesLoading && !purchases) {
      right = <SkeletonLoader variant="right-panel" />;
    } else if (purchasesError && !purchases) {
      right = (
        <PanelError variant="right" onRetry={purchasesRefetch} message="Could not load purchases" />
      );
    } else if (!purchasesLoading && !purchasesError && (purchases ?? []).length === 0) {
      right = (
        <GhostedListEmpty
          ctaText="No purchases planned yet"
          ctaButtonLabel="+ Add purchase"
          showCta={false}
        />
      );
    } else {
      right = <PurchaseListPanel year={year} purchases={purchases ?? []} isReadOnly={isReadOnly} />;
    }
  } else if (view.type === "gifts-upcoming") {
    if (upcomingLoading && !upcoming) {
      right = <SkeletonLoader variant="right-panel" />;
    } else if (upcomingError && !upcoming) {
      right = (
        <PanelError
          variant="right"
          onRetry={upcomingRefetch}
          message="Could not load gift events"
        />
      );
    } else if (!upcomingLoading && !upcomingError && (upcoming ?? []).length === 0) {
      right = <GhostedListEmpty ctaText="No upcoming gift events" showCta={false} />;
    } else {
      right = <GiftUpcomingPanel year={year} gifts={upcoming ?? []} isReadOnly={isReadOnly} />;
    }
  } else if (view.type === "gifts-by-person") {
    if (giftsLoading && !giftPersons) {
      right = <SkeletonLoader variant="right-panel" />;
    } else if (giftsError && !giftPersons) {
      right = (
        <PanelError variant="right" onRetry={giftsRefetch} message="Could not load gift people" />
      );
    } else if (!giftsLoading && !giftsError && (giftPersons ?? []).length === 0) {
      right = <GhostedListEmpty ctaText="No gift people yet" showCta={false} />;
    } else {
      right = (
        <GiftPersonListPanel
          year={year}
          persons={giftPersons ?? []}
          isReadOnly={isReadOnly}
          onSelectPerson={(p) => setView({ type: "gift-person", person: p })}
          selectedPersonId={null}
        />
      );
    }
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
    <div data-page="planner" className="relative flex flex-col h-full">
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
