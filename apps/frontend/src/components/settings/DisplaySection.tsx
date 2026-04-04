import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { Section } from "./Section";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/utils/format";

const EXAMPLE_VALUE = 1234.56;

export function DisplaySection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const serverShowPence = settings?.showPence ?? false;

  // Local state for optimistic UI — checkbox responds instantly
  const [showPence, setShowPence] = useState(serverShowPence);

  // Sync back from server (on initial load or external change)
  useEffect(() => {
    setShowPence(serverShowPence);
  }, [serverShowPence]);

  function handleToggle() {
    const newValue = !showPence;
    setShowPence(newValue);
    updateSettings.mutate(
      { showPence: newValue },
      {
        onSuccess: () => toast.success(newValue ? "Showing pence" : "Showing whole pounds"),
        onError: () => {
          // Revert optimistic update on failure
          setShowPence(!newValue);
          toast.error("Failed to save display preference");
        },
      }
    );
  }

  return (
    <Section id="display" title="Display">
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
    </Section>
  );
}
