import { useRef, useState, useEffect, useCallback } from "react";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { StalenessSection } from "@/components/settings/StalenessSection";
import { SurplusSection } from "@/components/settings/SurplusSection";
import { IsaSection } from "@/components/settings/IsaSection";
import { HouseholdSection } from "@/components/settings/HouseholdSection";
import { TrustAccountsSection } from "@/components/settings/TrustAccountsSection";
import { SkeletonLoader } from "@/components/common/SkeletonLoader";
import { PanelError } from "@/components/common/PanelError";
import { useSettings } from "@/hooks/useSettings";

const SECTIONS = [
  { id: "profile", label: "Profile" },
  { id: "staleness", label: "Staleness thresholds" },
  { id: "surplus", label: "Surplus benchmark" },
  { id: "isa", label: "ISA settings" },
  { id: "household", label: "Household" },
  { id: "trust-accounts", label: "Trust accounts" },
] as const;

export default function SettingsPage() {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { isLoading, isError, refetch } = useSettings();
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const visible = entries
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

    if (visible.length > 0) {
      const id = visible[0].target.getAttribute("data-section-id");
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
      <aside className="w-48 shrink-0 border-r p-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          Settings
        </p>
        {SECTIONS.map((s) => (
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
            <div ref={setRef("trust-accounts")} data-section-id="trust-accounts">
              <TrustAccountsSection />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
