import { useRef } from "react";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { StalenessSection } from "@/components/settings/StalenessSection";
import { SurplusSection } from "@/components/settings/SurplusSection";
import { IsaSection } from "@/components/settings/IsaSection";
import { HouseholdSection } from "@/components/settings/HouseholdSection";
import { SnapshotsSection } from "@/components/settings/SnapshotsSection";
import { EndedIncomeSection } from "@/components/settings/EndedIncomeSection";
import { RebuildSection } from "@/components/settings/RebuildSection";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { PanelError } from "@/components/common/PanelError";
import { useSettings } from "@/hooks/useSettings";

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "staleness", label: "Staleness thresholds" },
  { id: "surplus", label: "Surplus benchmark" },
  { id: "isa", label: "ISA settings" },
  { id: "household", label: "Household" },
  { id: "snapshots", label: "Snapshots" },
  { id: "income-ended", label: "Ended income" },
  { id: "rebuild", label: "Waterfall rebuild" },
] as const;

export default function SettingsPage() {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const { isLoading, isError, refetch } = useSettings();

  function scrollTo(id: string) {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setRef(id: string) {
    return (el: HTMLElement | null) => {
      sectionRefs.current[id] = el;
    };
  }

  return (
    <div data-page="settings" className="relative flex h-full overflow-hidden">
      {/* Left nav */}
      <aside className="w-48 shrink-0 border-r p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Settings
        </p>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-accent transition-colors"
            onClick={() => scrollTo(s.id)}
          >
            {s.label}
          </button>
        ))}
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="sr-only">Settings</h1>
        {isLoading ? (
          <SkeletonLoader variant="right-panel" />
        ) : isError ? (
          <PanelError variant="right" onRetry={refetch} message="Could not load settings" />
        ) : (
          <div className="max-w-2xl space-y-12">
            <div ref={setRef("profile")}>
              <ProfileSection />
            </div>
            <div ref={setRef("staleness")}>
              <StalenessSection />
            </div>
            <div ref={setRef("surplus")}>
              <SurplusSection />
            </div>
            <div ref={setRef("isa")}>
              <IsaSection />
            </div>
            <div ref={setRef("household")}>
              <HouseholdSection />
            </div>
            <div ref={setRef("snapshots")}>
              <SnapshotsSection />
            </div>
            <div ref={setRef("income-ended")}>
              <EndedIncomeSection />
            </div>
            <div ref={setRef("rebuild")}>
              <RebuildSection />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
