import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { Section } from "./Section";

export function IsaSection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const [limit, setLimit] = useState(settings?.isaAnnualLimit ?? 20000);
  const [month, setMonth] = useState(settings?.isaYearStartMonth ?? 4);
  const [day, setDay] = useState(settings?.isaYearStartDay ?? 6);

  function handleSave() {
    updateSettings.mutate(
      { isaAnnualLimit: limit, isaYearStartMonth: month, isaYearStartDay: day },
      { onSuccess: () => toast.success("ISA settings saved") }
    );
  }

  return (
    <Section id="isa" title="ISA settings">
      <p className="text-sm text-muted-foreground">
        UK default: 6 April. Only change if you are in a different jurisdiction.
      </p>
      <div className="grid grid-cols-3 gap-3 max-w-sm">
        <div className="space-y-1">
          <label htmlFor="isa-limit" className="text-xs text-muted-foreground">
            Annual limit (£)
          </label>
          <Input
            id="isa-limit"
            type="number"
            min={0}
            value={limit}
            onChange={(e) => setLimit(parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="isa-month" className="text-xs text-muted-foreground">
            Month (1–12)
          </label>
          <Input
            id="isa-month"
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value) || 1)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="isa-day" className="text-xs text-muted-foreground">
            Day (1–31)
          </label>
          <Input
            id="isa-day"
            type="number"
            min={1}
            max={31}
            value={day}
            onChange={(e) => setDay(parseInt(e.target.value) || 1)}
          />
        </div>
      </div>
      <Button size="sm" onClick={handleSave} disabled={updateSettings.isPending}>
        {updateSettings.isPending ? "Saving…" : "Save"}
      </Button>
    </Section>
  );
}
