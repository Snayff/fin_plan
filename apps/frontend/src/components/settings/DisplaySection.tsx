import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { SettingsSection } from "./SettingsSection";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/utils/format";

const EXAMPLE_VALUE = 1234.56;

export function DisplaySection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const serverShowPence = settings?.showPence ?? false;
  const [showPence, setShowPence] = useState(serverShowPence);

  useEffect(() => setShowPence(serverShowPence), [serverShowPence]);

  function handleToggle() {
    const next = !showPence;
    setShowPence(next);
    updateSettings.mutate({ showPence: next }, { onError: () => setShowPence(!next) });
  }

  return (
    <SettingsSection
      id="display"
      title="Display"
      description="How values render for you specifically. Does not affect other household members."
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id="show-pence"
          checked={showPence}
          onCheckedChange={handleToggle}
          disabled={updateSettings.isPending}
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline gap-2">
            <Label htmlFor="show-pence" className="text-sm font-medium cursor-pointer">
              Show pence
            </Label>
            <span className="font-numeric text-xs text-muted-foreground">
              e.g. {formatCurrency(EXAMPLE_VALUE, showPence)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Display pence on all financial values for full precision. When off, values are rounded
            to the nearest pound.
          </p>
        </div>
      </div>
    </SettingsSection>
  );
}
