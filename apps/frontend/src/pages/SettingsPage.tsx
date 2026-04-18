import { useRef, useState, useEffect, useCallback } from "react";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { StalenessSection } from "@/components/settings/StalenessSection";
import { SurplusSection } from "@/components/settings/SurplusSection";
import { IsaSection } from "@/components/settings/IsaSection";
import { HouseholdSection } from "@/components/settings/HouseholdSection";
import { AuditLogSection } from "@/components/settings/AuditLogSection";
import { GrowthRatesSection } from "@/components/settings/GrowthRatesSection";
import { DisplaySection } from "@/components/settings/DisplaySection";
import { SubcategoriesSection } from "@/components/settings/SubcategoriesSection";
import { DataSection } from "@/components/settings/DataSection";
import { RebuildWaterfallSection } from "@/components/settings/RebuildWaterfallSection";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { PanelError } from "@/components/common/PanelError";
import { useSettings } from "@/hooks/useSettings";
import { useAuthStore } from "@/stores/authStore";
import { useHouseholdDetails } from "@/hooks/useSettings";

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "display", label: "Display" },
  { id: "subcategories", label: "Subcategories" },
  { id: "staleness", label: "Staleness thresholds" },
  { id: "surplus", label: "Surplus benchmark" },
  { id: "isa", label: "ISA settings" },
  { id: "household", label: "Household" },
  { id: "data", label: "Data", roles: ["owner"] as string[] },
  { id: "rebuild-waterfall", label: "Rebuild waterfall", roles: ["owner"] as string[] },
  { id: "growth-rates", label: "Growth rates", roles: ["owner", "admin"] as string[] },
  { id: "audit-log", label: "Audit log", roles: ["owner", "admin"] as string[] },
] as const;

export default function SettingsPage() {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { isLoading, isError, refetch } = useSettings();
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id);
  const user = useAuthStore((s) => s.user);
  const householdId = user?.activeHouseholdId ?? "";
  const { data: householdData } = useHouseholdDetails(householdId);
  const currentMember = householdData?.household?.memberProfiles.find((m) => m.userId === user?.id);
  const callerRole = currentMember?.role ?? "member";
  const canSeeAuditLog = callerRole === "owner" || callerRole === "admin";
  const isOwner = callerRole === "owner";
  const canSeeSection = (section: (typeof SECTIONS)[number]) => {
    if (!("roles" in section)) return true;
    return section.roles.includes(callerRole);
  };

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

    const [first] = visible;
    if (first) {
      const id = first.target.getAttribute("data-section-id");
      if (id) setActiveSection(id);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoading || isError) return;

    const observer = new IntersectionObserver(handleIntersection, {
      root: container,
      threshold: 0.3,
    });

    for (const ref of Object.values(sectionRefs.current)) {
      if (ref) observer.observe(ref);
    }

    return () => observer.disconnect();
  }, [isLoading, isError, handleIntersection]);

  function scrollTo(id: string) {
    sectionRefs.current[id]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function setRef(id: string) {
    return (el: HTMLElement | null) => {
      sectionRefs.current[id] = el;
    };
  }

  return (
    <div data-page="settings" className="relative flex h-full overflow-hidden">
      {/* Left nav */}
      <aside className="flex flex-col w-48 shrink-0 border-r p-4 overflow-y-auto">
        <p className="label-section mb-3">Settings</p>
        <div className="space-y-1">
          {SECTIONS.filter(canSeeSection).map((s) => (
            <button
              key={s.id}
              type="button"
              className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                activeSection === s.id ? "bg-accent text-accent-foreground" : "hover:bg-accent"
              }`}
              onClick={() => scrollTo(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-auto border-t border-foreground/10 px-2 py-3 text-xs text-muted-foreground">
          finplan v{import.meta.env.VITE_APP_VERSION}
        </p>
      </aside>

      {/* Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-8" aria-busy={isLoading}>
        <h1 className="sr-only">Settings</h1>
        {isLoading ? (
          <SkeletonLoader variant="right-panel" />
        ) : isError ? (
          <PanelError variant="right" onRetry={refetch} message="Could not load settings" />
        ) : (
          <div className="max-w-2xl space-y-12">
            <div ref={setRef("profile")} data-section-id="profile">
              <ProfileSection />
            </div>
            <div ref={setRef("display")} data-section-id="display">
              <DisplaySection />
            </div>
            <div ref={setRef("subcategories")} data-section-id="subcategories">
              <SubcategoriesSection />
            </div>
            <div ref={setRef("staleness")} data-section-id="staleness">
              <StalenessSection />
            </div>
            <div ref={setRef("surplus")} data-section-id="surplus">
              <SurplusSection />
            </div>
            <div ref={setRef("isa")} data-section-id="isa">
              <IsaSection />
            </div>
            <div ref={setRef("household")} data-section-id="household">
              <HouseholdSection />
            </div>
            {isOwner && (
              <div ref={setRef("data")} data-section-id="data">
                <DataSection />
              </div>
            )}
            {isOwner && (
              <div ref={setRef("rebuild-waterfall")} data-section-id="rebuild-waterfall">
                <RebuildWaterfallSection />
              </div>
            )}
            {canSeeAuditLog && (
              <div ref={setRef("growth-rates")} data-section-id="growth-rates">
                <GrowthRatesSection />
              </div>
            )}
            {canSeeAuditLog && (
              <div ref={setRef("audit-log")} data-section-id="audit-log">
                <AuditLogSection />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
