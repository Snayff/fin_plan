import { useRef, useState, useCallback } from "react";
import { SettingsLeftPanel, type SettingsNavItem } from "@/components/settings/SettingsLeftPanel";
import {
  SettingsRightPanel,
  type SettingsRightPanelHandle,
} from "@/components/settings/SettingsRightPanel";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { DisplaySection } from "@/components/settings/DisplaySection";

const ITEMS: SettingsNavItem[] = [
  { id: "account", label: "Account" },
  { id: "display", label: "Display" },
];

export default function ProfileSettingsPage() {
  const [activeId, setActiveId] = useState<string>(ITEMS[0]?.id ?? "account");
  const rightRef = useRef<SettingsRightPanelHandle | null>(null);

  const handleNavClick = useCallback((id: string) => {
    setActiveId(id);
    rightRef.current?.scrollToSection(id);
  }, []);

  return (
    <div data-page="settings" className="relative flex h-full overflow-hidden">
      <SettingsLeftPanel
        title="Profile"
        subLabel="Your personal preferences"
        activeId={activeId}
        items={ITEMS}
        onNavClick={handleNavClick}
      />
      <SettingsRightPanel
        ref={rightRef}
        title="Profile"
        activeId={activeId}
        onActiveChange={setActiveId}
      >
        <ProfileSection />
        <DisplaySection />
      </SettingsRightPanel>
    </div>
  );
}
